import { getDB } from '../core/database/db';
import { Product } from '../core/types/product.types';
import { AIService } from './AIService';
import { GeminiService } from './GeminiService';
import { OllamaService } from './OllamaService';
import { FirebaseSyncService } from './FirebaseSyncService';
import { formatArrayToString } from '../utils/formatters';
import { auth } from '../firebase';

export class SynergyBackgroundService {
  private static isRunning = false;
  private static intervalId: number | null = null;
  private static currentProcessingSku: string | null = null;
  private static currentProcessingName: string | null = null;
  private static listeners: Array<(sku: string | null, name: string | null) => void> = [];

  static subscribe(listener: (sku: string | null, name: string | null) => void) {
    this.listeners.push(listener);
    listener(this.currentProcessingSku, this.currentProcessingName);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private static notifyListeners() {
    this.listeners.forEach(l => l(this.currentProcessingSku, this.currentProcessingName));
  }

  static start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[SynergyService] Iniciando motor de sinergia en segundo plano...');
    
    // Ejecutar cada 30 segundos si hay trabajo pendiente
    this.intervalId = window.setInterval(() => this.processNext(), 30000);
    this.processNext(); // Primera ejecución inmediata
  }

  static stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  static async forceAnalyze(product: Product) {
    if (!product || product.synergy_analyzed) return false;
    
    // Si ya estamos procesando algo, no interrumpir, pero podríamos encolarlo.
    // Para simplificar, si está libre, lo procesamos directo.
    if (this.currentProcessingSku) {
      console.log(`[SynergyService] Ocupado con ${this.currentProcessingSku}, no se puede forzar ${product.sku} ahora.`);
      return false;
    }

    console.log(`[SynergyService] Análisis forzado para: ${product.nombre_comercial}`);
    await this.processProduct(product, true);
    return true;
  }

  private static async processNext() {
    if (this.currentProcessingSku) return; // Ya hay uno en proceso

    try {
      const db = await getDB();
      const allProducts = await db.getAll('products');
      const now = Date.now();
      const userId = auth.currentUser?.uid;

      if (!userId) {
        console.warn('[SynergyService] Esperando autenticación anónima para iniciar trabajo distribuido...');
        return;
      }
      
      // Buscar el siguiente producto que necesite análisis y no esté bloqueado por otro nodo
      const nextProduct = allProducts.find(p => 
        !p.synergy_analyzed && 
        (!p.lock_uid || p.lock_uid === userId || (now - (p.lock_timestamp || 0)) > 5 * 60 * 1000)
      );
      
      if (!nextProduct) {
        return;
      }

      await this.processProduct(nextProduct, false);
    } catch (error) {
      console.error('[SynergyService] Error en ciclo de procesamiento:', error);
    }
  }

  private static async processProduct(product: Product, isForced: boolean = false) {
    try {
      const status = AIService.getStatus();
      const db = await getDB();
      const now = Date.now();
      const userId = auth.currentUser?.uid || 'local-user'; // Fallback for local forced execution

      if (!isForced && !auth.currentUser?.uid) return;

      // Intentar adquirir el candado en Firebase
      let lockAcquired = false;
      if (auth.currentUser?.uid) {
        lockAcquired = await FirebaseSyncService.claimProductLock(product.sku, userId);
      }
      
      if (!lockAcquired && !isForced) {
        console.log(`[SynergyService] Producto ${product.sku} está siendo procesado por otro nodo o no está en la nube. Buscando otro...`);
        return;
      }

      this.currentProcessingSku = product.sku;
      this.currentProcessingName = product.nombre_comercial;
      this.notifyListeners();

      console.log(`[SynergyService] Iniciando análisis de sinergias para: ${product.nombre_comercial} (Forzado: ${isForced})`);
      
      // Actualizar DB local con el candado
      await db.put('products', { ...product, lock_uid: userId, lock_timestamp: now });

      // 1. Encontrar candidatos por similitud semántica (Local Embeddings)
      let mainVector = product.vectores;
      if (!mainVector || mainVector.length === 0) {
        if (status.isReady) {
          const text = `${product.nombre_comercial} ${formatArrayToString(product.indicaciones, ' ')} ${product.analisis_componentes || ''}`;
          mainVector = await AIService.generateEmbedding(text);
          product.vectores = mainVector;
          await db.put('products', { ...product, vectores: mainVector });
        } else {
          await db.put('products', { ...product, synergy_analyzed: true, last_synergy_analysis: Date.now() });
          this.clearCurrent();
          return;
        }
      }

      const allProducts = await db.getAll('products');
      const candidates = allProducts
        .filter(p => p.sku !== product.sku && p.vectores && p.vectores.length > 0)
        .map(p => ({
          product: p,
          score: this.cosineSimilarity(mainVector, p.vectores)
        }))
        .filter(item => item.score > 0.65)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(item => item.product);

      if (candidates.length === 0) {
        const updatedProduct = { 
          ...product, 
          synergy_analyzed: true, 
          last_synergy_analysis: Date.now(),
          sugerencia_complementaria: "No se encontraron complementos directos en la base local.",
          skus_relacionados: []
        };
        await db.put('products', updatedProduct);
        await FirebaseSyncService.releaseProductLockAndSave(updatedProduct);
        this.clearCurrent();
        return;
      }

      // 2. Análisis Clínico
      let synergyResult;
      const isOllamaAvailable = await OllamaService.isAvailable();

      if (isOllamaAvailable) {
        console.log('[SynergyService] Usando Ollama (Motor PC Local) para análisis...');
        try {
          const analysis = await OllamaService.analyzeSynergy(product, candidates);
          synergyResult = {
            sugerencia_complementaria: analysis.sugerencia_complementaria,
            skus_relacionados: analysis.skus_relacionados,
            explicacion_clinica: analysis.explicacion_clinica
          };
        } catch (e) {
          console.warn('[SynergyService] Fallo Ollama, intentando Gemini...');
        }
      }

      if (!synergyResult) {
        try {
          const analysis = await GeminiService.analyzeSynergy(product, candidates);
          synergyResult = {
            sugerencia_complementaria: analysis.sugerencia_complementaria,
            skus_relacionados: analysis.skus_relacionados,
            explicacion_clinica: analysis.explicacion_clinica
          };
        } catch (e) {
          console.warn('[SynergyService] Fallo Gemini, intentando IA Local Navegador...');
          if (status.isReady) {
            const prompt = `Analiza si estos productos son complementarios a ${product.nombre_comercial}: ${candidates.map(c => c.nombre_comercial).join(', ')}.`;
            const localAnalysis = await AIService.analyze(prompt, [product, ...candidates]);
            synergyResult = {
              sugerencia_complementaria: localAnalysis.substring(0, 200),
              skus_relacionados: candidates.map(c => c.sku),
              explicacion_clinica: localAnalysis
            };
          }
        }
      }

      if (!synergyResult) {
        synergyResult = {
          sugerencia_complementaria: "Análisis pendiente de motor IA.",
          skus_relacionados: [],
          explicacion_clinica: "No hay motores de IA disponibles para el análisis profundo."
        };
      }

      const finalProduct = {
        ...product,
        synergy_analyzed: true,
        last_synergy_analysis: Date.now(),
        sugerencia_complementaria: synergyResult.sugerencia_complementaria,
        skus_relacionados: synergyResult.skus_relacionados
      };

      await db.put('products', finalProduct);
      await FirebaseSyncService.releaseProductLockAndSave(finalProduct);
      
      console.log(`[SynergyService] Sinergia completada para ${product.nombre_comercial}`);
      window.dispatchEvent(new CustomEvent('db_updated'));

    } catch (error) {
      console.error(`[SynergyService] Error procesando ${product.sku}:`, error);
    } finally {
      this.clearCurrent();
    }
  }

  private static clearCurrent() {
    this.currentProcessingSku = null;
    this.currentProcessingName = null;
    this.notifyListeners();
  }

  private static cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
