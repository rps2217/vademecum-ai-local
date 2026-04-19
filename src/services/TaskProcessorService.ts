import { TaskQueueService, PendingTask } from './TaskQueueService';
import { CloudSyncService } from './CloudSyncService';
import { SynergyBackgroundService } from './SynergyBackgroundService';
import { VectorBackgroundService } from './VectorBackgroundService';
import { AIOrchestratorService } from './AIOrchestratorService';
import { EventBus, EventType } from './EventBus';
import { waitForDB } from './DatabaseService';
import { DataService } from './DataService';

export class TaskProcessorService {
  private static isProcessing = false;
  private static stopRequested = false;
  private static lastCleanup = 0;

  static async start() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.stopRequested = false;
    
    console.log('[TaskProcessor] Iniciando bucle de procesamiento de tareas...');
    
    // Asegurar que la DB esté lista antes de entrar al bucle
    const dbReady = await waitForDB();
    if (!dbReady) {
      console.error('[TaskProcessor] No se pudo inicializar la DB para el procesamiento.');
      this.isProcessing = false;
      return;
    }

    this.processLoop();
  }

  static stop() {
    this.stopRequested = true;
    this.isProcessing = false;
  }

  private static async processLoop() {
    while (this.isProcessing && !this.stopRequested) {
      try {
        // Ejecutar limpieza cada hora
        const now = Date.now();
        if (now - this.lastCleanup > 60 * 60 * 1000) {
          await TaskQueueService.runCleanup();
          this.lastCleanup = now;
        }

        const task = await TaskQueueService.getNextPending();
        
        if (!task) {
          // No hay tareas, esperar un poco
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        }

        await this.executeTask(task);
        
        // Pausa entre tareas con Gestión Térmica Dinámica (Garantiza enfriamiento en M4)
        const delay = AIOrchestratorService.getThermalDelay();
        if (delay > 10000) {
          console.warn(`[TaskProcessor] Thermal Guard activo: Esperando ${delay/1000}s para enfriar el procesador...`);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      } catch (error) {
        console.error('[TaskProcessor] Error critico en el bucle:', error);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
  }

  private static async executeTask(task: PendingTask) {
    console.log(`[TaskProcessor] Ejecutando tarea: ${task.type} (${task.id})`);
    
    // Marcar como procesando
    await TaskQueueService.updateTask(task.id, { status: 'processing' });

    try {
      switch (task.type) {
        case 'cloud_sync':
        case 'firebase_sync': // Mantener alias para compatibilidad con tareas encoladas
          await CloudSyncService.updateProductsBatch([task.payload]);
          AIOrchestratorService.trackActivity(10);
          break;
        
        case 'ai_analysis':
          if (task.payload.type === 'synergy') {
            const product = task.payload.product || await DataService.getProductBySku(task.payload.sku);
            if (product) {
              await SynergyBackgroundService.forceAnalyze(product);
              AIOrchestratorService.trackActivity(50);
            }
          }
          break;

        case 'vectorization':
          const prodToVectorize = task.payload.product || await DataService.getProductBySku(task.payload.sku);
          if (prodToVectorize) {
            await VectorBackgroundService.vectorizeProduct(prodToVectorize);
            AIOrchestratorService.trackActivity(30);
          }
          break;

        default:
          console.warn(`[TaskProcessor] Tipo de tarea desconocido: ${task.type}`);
      }

      // Tarea completada con éxito
      await TaskQueueService.removeTask(task.id);
      console.log(`[TaskProcessor] Tarea completada: ${task.id}`);

    } catch (error: any) {
      console.error(`[TaskProcessor] Error ejecutando tarea ${task.id}:`, error);
      
      const newRetries = (task.retries || 0) + 1;
      const status = newRetries >= 5 ? 'failed' : 'pending'; // Reintentar hasta 5 veces
      
      await TaskQueueService.updateTask(task.id, {
        status,
        retries: newRetries,
        lastError: error.message || String(error)
      });
    }
  }
}
