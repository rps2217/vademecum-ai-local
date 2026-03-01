import { getDB } from '../core/database/db';
import { Product } from '../core/types/product.types';
import { AIService } from './AIService';
import { GeminiService } from './GeminiService';
import { OllamaService } from './OllamaService';
import { formatArrayToString } from '../utils/formatters';

export class SynergyBackgroundService {
  private static isRunning = false;
  private static intervalId: number | null = null;

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

  private static async processNext() {
    try {
      const status = AIService.getStatus();
      // El motor de sinergia puede usar Gemini o Ollama incluso si el motor local (WebLLM) no está listo
      // Pero necesitamos que al menos el sistema esté inicializado.

      const db = await getDB();
      const allProducts = await db.getAll('products');
      
      // Buscar el siguiente producto que necesite análisis
      const nextProduct = allProducts.find(p => !p.synergy_analyzed);
      
      if (!nextProduct) {
        return;
      }

      console.log(`[SynergyService] Analizando sinergias para: ${nextProduct.nombre_comercial}`);
      
      // 1. Encontrar candidatos por similitud semántica (Local Embeddings)
      // Nota: Los embeddings siempre son locales para privacidad
      const mainVector = nextProduct.vectores;
      if (!mainVector || mainVector.length === 0) {
        // Si no tiene vectores, intentamos generarlos si el motor está listo
        if (status.isReady) {
          const text = `${nextProduct.nombre_comercial} ${formatArrayToString(nextProduct.indicaciones, ' ')}`;
          const vector = await AIService.generateEmbedding(text);
          await db.put('products', { ...nextProduct, vectores: vector });
          // No retornamos, dejamos que la siguiente iteración lo procese con vectores
        } else {
          // Si no hay motor local para vectores, marcamos como analizado básico
          await db.put('products', { ...nextProduct, synergy_analyzed: true, last_synergy_analysis: Date.now() });
        }
        return;
      }

      const candidates = allProducts
        .filter(p => p.sku !== nextProduct.sku && p.vectores && p.vectores.length > 0)
        .map(p => ({
          product: p,
          score: this.cosineSimilarity(mainVector, p.vectores)
        }))
        .filter(item => item.score > 0.65)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(item => item.product);

      if (candidates.length === 0) {
        await db.put('products', { 
          ...nextProduct, 
          synergy_analyzed: true, 
          last_synergy_analysis: Date.now(),
          sugerencia_complementaria: "No se encontraron complementos directos en la base local.",
          skus_relacionados: []
        });
        return;
      }

      // 2. Análisis Clínico - Prioridad de Motores:
      // A. Ollama (Motor Local PC potente - "O")
      // B. Gemini (Nube potente)
      // C. WebLLM (Local Navegador)
      
      let synergyResult;
      
      const isOllamaAvailable = await OllamaService.isAvailable();

      if (isOllamaAvailable) {
        console.log('[SynergyService] Usando Ollama (Motor PC Local) para análisis...');
        try {
          const analysis = await OllamaService.analyzeSynergy(nextProduct, candidates);
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
          const analysis = await GeminiService.analyzeSynergy(nextProduct, candidates);
          synergyResult = {
            sugerencia_complementaria: analysis.sugerencia_complementaria,
            skus_relacionados: analysis.skus_relacionados,
            explicacion_clinica: analysis.explicacion_clinica
          };
        } catch (e) {
          console.warn('[SynergyService] Fallo Gemini, intentando IA Local Navegador...');
          if (status.isReady) {
            const prompt = `Analiza si estos productos son complementarios a ${nextProduct.nombre_comercial}: ${candidates.map(c => c.nombre_comercial).join(', ')}.`;
            const localAnalysis = await AIService.analyze(prompt, [nextProduct, ...candidates]);
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

      // 3. Guardar en DB
      await db.put('products', {
        ...nextProduct,
        synergy_analyzed: true,
        last_synergy_analysis: Date.now(),
        sugerencia_complementaria: synergyResult.sugerencia_complementaria,
        skus_relacionados: synergyResult.skus_relacionados
      });

      console.log(`[SynergyService] Sinergia completada para ${nextProduct.nombre_comercial}`);
      window.dispatchEvent(new CustomEvent('db_updated'));

    } catch (error) {
      console.error('[SynergyService] Error en proceso de sinergia:', error);
    }
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
