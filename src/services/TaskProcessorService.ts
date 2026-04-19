import { TaskQueueService, PendingTask } from './TaskQueueService';
import { FirebaseSyncService } from './FirebaseSyncService';
import { SynergyBackgroundService } from './SynergyBackgroundService';
import { VectorBackgroundService } from './VectorBackgroundService';
import { EventBus, EventType } from './EventBus';
import { waitForDB } from './DatabaseService';

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
        
        // Pausa entre tareas para moderar el uso de CPU/GPU
        await new Promise(resolve => setTimeout(resolve, 2000));
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
        case 'firebase_sync':
          await FirebaseSyncService.updateProductsBatch([task.payload]);
          break;
        
        case 'ai_analysis':
          if (task.payload.type === 'synergy') {
            const product = task.payload.product || await DataService.getProductBySku(task.payload.sku);
            if (product) {
              await SynergyBackgroundService.forceAnalyze(product);
            }
          }
          break;

        case 'vectorization':
          const prodToVectorize = task.payload.product || await DataService.getProductBySku(task.payload.sku);
          if (prodToVectorize) {
            await VectorBackgroundService.vectorizeProduct(prodToVectorize);
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

// Para evitar dependencias circulares, necesitamos asegurar que DataService esté disponible
// Usaremos importación dinámica o inyección si es necesario, pero por ahora asumimos disponibilidad.
import { DataService } from './DataService';
