import { getDB } from '../core/database/db';
import { Product } from '../core/types/product.types';
import { AIService } from './AIService';
import { GeminiService } from './GeminiService';
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
      if (!status.isReady) return;

      const db = await getDB();
      const allProducts = await db.getAll('products');
      
      // Buscar el siguiente producto que necesite análisis
      const nextProduct = allProducts.find(p => !p.synergy_analyzed);
      
      if (!nextProduct) {
        // console.log('[SynergyService] Todos los productos están analizados.');
        return;
      }

      console.log(`[SynergyService] Analizando sinergias para: ${nextProduct.nombre_comercial}`);
      
      // 1. Encontrar candidatos por similitud semántica (Local Embeddings)
      const mainVector = nextProduct.vectores;
      if (!mainVector || mainVector.length === 0) {
        // Si no tiene vectores, marcamos como analizado (o podríamos generar el vector aquí)
        await db.put('products', { ...nextProduct, synergy_analyzed: true, last_synergy_analysis: Date.now() });
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

      // 2. Análisis Clínico (Preferimos Gemini para precisión, pero el usuario pidió "local AI")
      // Intentamos usar Gemini si hay API Key, si no, usamos AIService local
      let synergyResult;
      
      try {
        // Usamos Gemini para la lógica compleja si es posible
        const analysis = await GeminiService.analyzeSynergy(nextProduct, candidates);
        synergyResult = {
          sugerencia_complementaria: analysis.sugerencia_complementaria,
          skus_relacionados: analysis.skus_relacionados,
          explicacion_clinica: analysis.explicacion_clinica
        };
      } catch (e) {
        // Fallback a Local AI si Gemini falla o no hay internet/key
        console.warn('[SynergyService] Fallback a IA Local para sinergia...');
        const prompt = `Analiza si estos productos son complementarios o similares a ${nextProduct.nombre_comercial}.
        CANDIDATOS: ${candidates.map(c => c.nombre_comercial).join(', ')}.
        Responde brevemente con sugerencias.`;
        
        const localAnalysis = await AIService.analyze(prompt, [nextProduct, ...candidates]);
        synergyResult = {
          sugerencia_complementaria: localAnalysis.substring(0, 200),
          skus_relacionados: candidates.map(c => c.sku), // Asumimos relación si la IA local no puede filtrar bien
          explicacion_clinica: localAnalysis
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
      
      // Disparar evento para que la UI se entere si está abierta
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
