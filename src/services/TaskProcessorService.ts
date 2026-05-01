import { taskQueueService, PendingTask } from './TaskQueueService';
import { cloudSyncService } from './CloudSyncService';
import { synergyBackgroundService } from './SynergyBackgroundService';
import { vectorBackgroundService } from './VectorBackgroundService';
import { aiOrchestratorService } from './AIOrchestratorService';
import { dataService } from './DataService';
import { logger } from './LoggerService';

export class TaskProcessorService {
  private static instance: TaskProcessorService;
  private isProcessing = false;
  private stopRequested = false;
  private lastCleanup = 0;

  private constructor() {}

  static getInstance(): TaskProcessorService {
    if (!TaskProcessorService.instance) {
      TaskProcessorService.instance = new TaskProcessorService();
    }
    return TaskProcessorService.instance;
  }

  async start() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.stopRequested = false;
    
    console.log('[TaskProcessor] Iniciando bucle de procesamiento de tareas...');
    
    this.processLoop();
  }

  stop() {
    this.stopRequested = true;
    this.isProcessing = false;
  }

  private async processLoop() {
    while (this.isProcessing && !this.stopRequested) {
      try {
        const now = Date.now();
        if (now - this.lastCleanup > 60 * 60 * 1000) {
          await taskQueueService.runCleanup();
          this.lastCleanup = now;
        }

        const task = await taskQueueService.getNextPending();
        
        if (!task) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        }

        await this.executeTask(task);
        
        const delay = aiOrchestratorService.getThermalDelay();
        if (delay >= 5000) {
          console.warn(`[TaskProcessor] Thermal Guard activo: Esperando ${delay/1000}s para disipar calor...`);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      } catch (error) {
        console.error('[TaskProcessor] Error critico en el bucle:', error);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
  }

  private async executeTask(task: PendingTask) {
    console.log(`[TaskProcessor] Ejecutando tarea: ${task.type} (${task.id})`);
    
    await taskQueueService.updateTask(task.id, { status: 'processing' });

    try {
      switch (task.type) {
        case 'cloud_sync':
          await cloudSyncService.updateProductsBatch([task.payload]);
          aiOrchestratorService.trackActivity(10);
          break;
        
        case 'ai_analysis':
          if (task.payload.type === 'synergy') {
            const product = task.payload.product || await dataService.getProductBySku(task.payload.sku);
            if (product) {
              await synergyBackgroundService.forceAnalyze(product);
              aiOrchestratorService.trackActivity(50);
            }
          }
          break;

        case 'vectorization':
          const prodToVectorize = task.payload.product || await dataService.getProductBySku(task.payload.sku);
          if (prodToVectorize) {
            await vectorBackgroundService.vectorizeProduct(prodToVectorize);
            aiOrchestratorService.trackActivity(30);
          }
          break;

        default:
          console.warn(`[TaskProcessor] Tipo de tarea desconocido: ${task.type}`);
      }

      await taskQueueService.removeTask(task.id);
      console.log(`[TaskProcessor] Tarea completada: ${task.id}`);

    } catch (error: any) {
      logger.error(`Fallo en tarea ${task.type}`, 'Procesador', error);
      console.error(`[TaskProcessor] Error ejecutando tarea ${task.id}:`, error);
      
      const newRetries = (task.retries || 0) + 1;
      const status = newRetries >= 5 ? 'failed' : 'pending';
      
      // Exponential Backoff: 30s, 2m, 8m, 32m...
      const backoffMinutes = Math.pow(4, newRetries - 1) * 0.5;
      const earliestRetryTimestamp = Date.now() + (backoffMinutes * 60 * 1000);
      
      await taskQueueService.updateTask(task.id, {
        status,
        retries: newRetries,
        lastError: error.message || String(error),
        earliestRetryTimestamp: status === 'pending' ? earliestRetryTimestamp : undefined
      });
    }
  }
}

export const taskProcessorService = TaskProcessorService.getInstance();
