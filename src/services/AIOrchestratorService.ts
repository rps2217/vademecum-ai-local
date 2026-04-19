import { AIService } from './AIService';
import { CloudSyncService } from './CloudSyncService';
import { Product } from '../core/types/product.types';
import { DataService } from './DataService';
import { TaskQueueService } from './TaskQueueService';

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
  
  // Gestión Térmica Dinámica
  private static thermalStress = 0;
  private static lastTaskTimestamp = 0;

  static subscribe(listener: (status: OrchestratorStatus) => void) {
    this.listeners.push(listener);
    listener({ ...this.status });
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  private static notify() {
    this.listeners.forEach(l => l({ ...this.status }));
  }

  static startWatcher() {
    if (this.isWatching) return;
    this.isWatching = true;
    
    // El orquestador ya no "hace" el trabajo, solo "busca" trabajo pendiente
    // Esto reduce drásticamente la carga ya que solo hace queries, no procesamiento pesado
    window.setInterval(() => {
      this.scoutPendingWork().catch(err => console.error('[Orchestrator Scout] Failed:', err));
    }, 5 * 60 * 1000); // Revisar cada 5 minutos
    
    // Revisión inicial suave
    setTimeout(() => this.scoutPendingWork(), 10000);
  }

  /**
   * Busca productos que necesitan atención y los encola en el TaskQueue.
   * NO procesa la IA directamente.
   */
  static async scoutPendingWork() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    try {
      const db = await DataService.getDB();
      if (!db) return;

      // Buscar productos sin vectores (Prioridad 1)
      const pendingVector = await db.products.find({
        selector: {
          $or: [
            { vectores: { $exists: false } },
            { vectores: { $size: 0 } }
          ]
        },
        limit: 20
      }).exec();

      if (pendingVector.length > 0) {
        console.log(`[Orchestrator Scout] Encontrados ${pendingVector.length} productos para vectorización.`);
        for (const p of pendingVector) {
          await TaskQueueService.addTask('vectorization', { sku: p.sku });
        }
      }

      // Buscar productos sin análisis clínico (Prioridad 2)
      const pendingAnalysis = await db.products.find({
        selector: {
          synergy_analyzed: { $ne: true }
        },
        limit: 10
      }).exec();

      if (pendingAnalysis.length > 0) {
        console.log(`[Orchestrator Scout] Encontrados ${pendingAnalysis.length} productos para análisis clínico.`);
        for (const p of pendingAnalysis) {
          await TaskQueueService.addTask('ai_analysis', { sku: p.sku, type: 'synergy' });
        }
      }

    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Registra actividad térmica para frenar el sistema si es necesario
   */
  static trackActivity(points: number) {
    const now = Date.now();
    // Si ha pasado mucho tiempo, enfriar
    if (now - this.lastTaskTimestamp > 60000) {
      this.thermalStress = Math.max(0, this.thermalStress - 50);
    }
    
    this.thermalStress += points;
    this.lastTaskTimestamp = now;
    
    return this.thermalStress;
  }

  static getThermalDelay(): number {
    if (this.thermalStress > 200) return 30000; // 30s de enfriamiento forzado
    if (this.thermalStress > 100) return 10000; // 10s de pausa
    return 3000; // 3s estándar
  }
}
