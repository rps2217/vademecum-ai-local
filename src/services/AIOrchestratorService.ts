import { AIService } from './AIService';
import { FirebaseSyncService } from './FirebaseSyncService';
import { Product } from '../core/types/product.types';
import { auth } from '../firebase';
import { DataService } from './DataService';

export interface OrchestratorStatus {
  isRunning: boolean;
  progress: number;
  currentTask: string;
}

export class AIOrchestratorService {
  private static isRunning = false;
  private static isWatching = false;
  private static status: OrchestratorStatus = { isRunning: false, progress: 0, currentTask: '' };
  private static listeners: Array<(status: OrchestratorStatus) => void> = [];

  static subscribe(listener: (status: OrchestratorStatus) => void) {
    this.listeners.push(listener);
    listener({ ...this.status });
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  private static notify() {
    this.listeners.forEach(l => l({ ...this.status }));
  }

  private static lastRun = 0;
  private static debounceTimer: number | null = null;

  static startWatcher() {
    if (this.isWatching) return;
    this.isWatching = true;
    
    window.addEventListener('db_updated', () => {
      if (this.isRunning) return;
      
      // Debounce: solo ejecutar si han pasado 10 segundos desde el último cambio significativo
      if (this.debounceTimer) window.clearTimeout(this.debounceTimer);
      this.debounceTimer = window.setTimeout(() => {
        const now = Date.now();
        if (now - this.lastRun < 10000) return; // Máximo una vez cada 10 seg
        this.runPipeline().catch(err => console.error('[Orchestrator] Pipeline failed:', err));
        this.lastRun = now;
      }, 5000);
    });
    console.log('[Orchestrator] Observador silencioso iniciado.');
  }

  static async runPipeline() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.status = { isRunning: true, progress: 0, currentTask: 'Iniciando...' };
    this.notify();

    try {
      const products = await DataService.getAllProducts();
      const userId = auth.currentUser?.uid || 'anonymous';
      const total = products.length;
      let processed = 0;

      if (total === 0) {
        console.log('[Orchestrator] No hay productos para procesar.');
        return;
      }

      for (const product of products) {
        processed++;
        this.status.progress = Math.round((processed / total) * 100);
        this.status.currentTask = `Procesando ${product.sku}`;
        this.notify();

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

        // 6. PAUSA DE SEGURIDAD: Evitar sobrecalentamiento procesando a ráfagas con descanso
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      // 7. Respaldo final
      this.status.currentTask = 'Realizando respaldo en la nube...';
      this.notify();
      await FirebaseSyncService.uploadLocalProducts();
      
    } finally {
      this.isRunning = false;
      this.status = { isRunning: false, progress: 100, currentTask: 'Completado' };
      this.notify();
    }
  }
}
