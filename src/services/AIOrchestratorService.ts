import { getDB } from '../core/database/db';
import { AIService } from './AIService';
import { FirebaseSyncService } from './FirebaseSyncService';
import { Product } from '../core/types/product.types';
import { auth } from '../firebase';

export class AIOrchestratorService {
  private static isRunning = false;
  private static isWatching = false;

  static startWatcher() {
    if (this.isWatching) return;
    this.isWatching = true;
    window.addEventListener('db_updated', () => {
      this.runPipeline();
    });
    console.log('[Orchestrator] Observador iniciado.');
  }

  static async runPipeline() {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const db = await getDB();
      const products = await db.getAll('products');
      const userId = auth.currentUser?.uid || 'anonymous';

      for (const product of products) {
        // Si ya está todo procesado, saltar
        if (product.synergy_analyzed && product.vectores && product.tags_ia) continue;

        // 1. Intentar adquirir candado (Protocolo Clúster)
        const locked = await FirebaseSyncService.claimProductLock(product.sku, userId);
        if (!locked) continue; // Otro dispositivo está trabajando en esto

        console.log(`[Orchestrator] Procesando: ${product.sku}`);
        const updatedProduct = { ...product };

        // 2. Paso 1: Estandarizar Etiquetas (si es necesario)
        if (!updatedProduct.tags_ia) {
            // Lógica simplificada de estandarización por producto
            const result = await AIService.standardizeTags(updatedProduct.tags_ia || []);
            // ... (aplicar mapeo)
        }

        // 3. Paso 2: Vectorizar (si es necesario)
        if (!updatedProduct.vectores || updatedProduct.vectores.length === 0) {
            const vector = await AIService.generateEmbedding(updatedProduct.nombre_comercial);
            updatedProduct.vectores = vector;
        }

        // 4. Paso 3: Análisis Clínico (si es necesario)
        if (!updatedProduct.synergy_analyzed) {
            // Buscar candidatos similares (simplificado)
            const candidates = products
                .filter(p => p.sku !== updatedProduct.sku && p.vectores)
                .sort((a, b) => 0.5) // (lógica de similitud aquí)
                .slice(0, 3);
            
            const result = await AIService.analyzeClinical(updatedProduct, candidates, 'synergy');
            if (result) {
                updatedProduct.synergy_analyzed = true;
                updatedProduct.sugerencia_complementaria = result.sugerencia;
                updatedProduct.skus_relacionados = result.ids;
            }
        }

        // 5. Liberar y guardar
        updatedProduct.last_updated = Date.now();
        await FirebaseSyncService.releaseProductLockAndSave(updatedProduct);
      }

      // 6. Respaldo final
      await FirebaseSyncService.uploadLocalProducts();
      
    } finally {
      this.isRunning = false;
    }
  }
}
