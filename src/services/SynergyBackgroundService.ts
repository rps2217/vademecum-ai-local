import { Product } from '../core/types/product.types';
import { AIService } from './AIService';
import { GeminiService } from './GeminiService';
import { OllamaService } from './OllamaService';
import { CloudSyncService } from './CloudSyncService';
import { formatArrayToString } from '../utils/formatters';
import { ConfigService } from './ConfigService';
import { DataService } from './DataService';
import { TaskQueueService } from './TaskQueueService';
import { EventBus, EventType } from './EventBus';

export class SynergyBackgroundService {
  private static isRunning = false;
  private static isFatalError = false;
  private static currentProcessingSku: string | null = null;
  private static currentProcessingName: string | null = null;
  private static currentEngine: string | null = null;

  static getStatus() {
    return {
      isRunning: this.isRunning,
      currentProcessingSku: this.currentProcessingSku,
      currentProcessingName: this.currentProcessingName,
      currentEngine: this.currentEngine,
      isFatalError: this.isFatalError
    };
  }

  private static notifyListeners() {
    EventBus.emit(EventType.SYNERGY_STATUS_CHANGED, this.getStatus());
  }

  private static isInitialized = false;

  static init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    window.addEventListener('config_updated', (e: any) => {
      const newConfig = e.detail;
      if (newConfig.enableBackgroundSynergy) {
        this.start();
      } else {
        this.stop();
      }
    });

    this.isRunning = true;
  }

  static start() {
    this.isRunning = true;
  }

  static stop() {
    this.isRunning = false;
  }

  static async forceAnalyze(product: Product) {
    if (!product) return false;
    
    if (this.currentProcessingSku) {
      console.log(`[SynergyService] Ocupado con ${this.currentProcessingSku}, encolando ${product.sku}.`);
      await TaskQueueService.addTask('ai_analysis', { sku: product.sku, type: 'synergy' });
      return false;
    }

    console.log(`[SynergyService] Análisis forzado para: ${product.nombre_comercial}`);
    await this.processProduct({ ...product, synergy_analyzed: false }, true);
    return true;
  }

  private static async processProduct(product: Product, isForced: boolean = false) {
    try {
      const status = AIService.getStatus();
      const now = Date.now();

      // [CLÚSTER] 1. Reclamo de exclusividad. 
      // ¿Algún otro PC de esta farmacia ya está trabajando con esto en este instante?
      const { getDeviceId } = await import('../utils/clusterUtils');
      const deviceId = getDeviceId();
      const canLock = await CloudSyncService.claimProductLock(product.sku, deviceId);
      if (!isForced && !canLock) {
         console.warn(`[ClusterSync] Sku ${product.sku} saltado. Otro PC (${deviceId}) ya lo está analizando.`);
         return; 
      }
      
      this.currentProcessingSku = product.sku;
      this.currentProcessingName = product.nombre_comercial;
      this.notifyListeners();

      console.log(`[SynergyService] Iniciando análisis de sinergias para: ${product.nombre_comercial} (Forzado: ${isForced})`);
      
      // Actualizar localmente que estamos procesando (opcional)
      // await DataService.saveProduct({ ...product, last_synergy_analysis: now }, { silent: true });

      // 1. Encontrar candidatos por similitud semántica (Local Embeddings)
      let mainVector = product.vectores;
      if (!mainVector || mainVector.length === 0) {
        if (status.isReady) {
          const text = `${product.nombre_comercial} ${formatArrayToString(product.indicaciones, ' ')} ${product.analisis_componentes || ''}`;
          mainVector = await AIService.generateEmbedding(text);
          product.vectores = mainVector;
          await DataService.saveProduct({ ...product, vectores: mainVector }, { silent: true });
        } else {
          await DataService.saveProduct({ ...product, synergy_analyzed: true, last_synergy_analysis: Date.now() }, { silent: true });
          this.clearCurrent();
          return;
        }
      }

      const allProducts = await DataService.getAllProducts();
      const candidates = allProducts
        .filter((p: any) => p.sku !== product.sku && p.vectores && p.vectores.length > 0)
        .map((p: any) => ({
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
        await CloudSyncService.releaseProductLockAndSave(updatedProduct);
        this.clearCurrent();
        return;
      }

      // 2. Análisis Clínico - HÍBRIDO Y SILENCIOSO
      let synergyResult;
      const isOllamaAvailable = await OllamaService.isAvailable();

      if (isOllamaAvailable) {
        this.setActiveEngine('Ollama (Local Externo)');
        try {
          const analysis = await OllamaService.analyzeSynergy(product, candidates);
          synergyResult = {
            sugerencia_complementaria: analysis.sugerencia_complementaria,
            skus_relacionados: analysis.skus_relacionados,
            explicacion_clinica: analysis.explicacion_clinica
          };
        } catch (e) {
          console.warn('[SynergyService] Ollama falló, saltando...');
        }
      }

      if (!synergyResult) {
        const config = ConfigService.getConfig();
        if (config.useGeminiForSynergy) {
          this.setActiveEngine('Gemini (Nube)');
          try {
            const analysis = await GeminiService.analyzeSynergy(product, candidates);
            synergyResult = {
              sugerencia_complementaria: analysis.sugerencia_complementaria,
              skus_relacionados: analysis.skus_relacionados,
              explicacion_clinica: analysis.explicacion_clinica
            };
          } catch (e: any) {
            console.warn('[SynergyService] Gemini falló (Cuota/Red). Encolando para después.');
            await TaskQueueService.addTask('ai_analysis', { sku: product.sku, type: 'synergy' });
          }
        }
      }

      if (!synergyResult && status.isReady) {
        this.setActiveEngine('WebLLM (Interno GPU)');
        try {
          const prompt = `Analiza la sinergia clínica entre el producto principal y sus complementos. 
          
          PRODUCTO PRINCIPAL:
          - Nombre: ${product.nombre_comercial}
          - Indicaciones: ${formatArrayToString(product.indicaciones, ', ')}
          
          CANDIDATOS:
          ${candidates.map(c => `- ${c.nombre_comercial}: ${formatArrayToString(c.indicaciones, ', ')}`).join('\n')}
          
          TAREA:
          1. Explica por qué estos productos se complementan clínicamente.
          2. Indica qué beneficios aporta combinar ${product.nombre_comercial} con los candidatos mencionados.
          3. Mantén la respuesta concisa y profesional.`;

          const localAnalysis = await AIService.analyze(prompt, [product, ...candidates]);
          synergyResult = {
            sugerencia_complementaria: localAnalysis.substring(0, 200),
            skus_relacionados: candidates.map(c => c.sku),
            explicacion_clinica: localAnalysis
          };
        } catch (e) {
          console.error('[SynergyService] IA Local Browser falló.');
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

      await CloudSyncService.releaseProductLockAndSave(finalProduct);
      console.log(`[SynergyService] Sinergia completada para ${product.nombre_comercial}`);

    } catch (error) {
      console.error(`[SynergyService] Error procesando ${product.sku}:`, error);
    } finally {
      this.clearCurrent();
    }
  }

  private static clearCurrent() {
    this.currentProcessingSku = null;
    this.currentProcessingName = null;
    this.currentEngine = null;
    this.notifyListeners();
  }

  private static setActiveEngine(engine: string) {
    this.currentEngine = engine;
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
