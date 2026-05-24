import { taskQueueService, PendingTask, AiAnalysisPayload, IngredientAnalysisPayload, VectorizationPayload } from './TaskQueueService';
import { cloudSyncService } from './CloudSyncService';
import { synergyBackgroundService } from './SynergyBackgroundService';
import { vectorBackgroundService } from './VectorBackgroundService';
import { aiOrchestratorService } from './AIOrchestratorService';
import { dataService } from './DataService';
import { logger } from './LoggerService';

export class TaskProcessorService {
  private static instance: TaskProcessorService;
  private isProcessing = false;
  private isEnabled = true;
  private stopRequested = false;
  private lastCleanup = 0;

  private constructor() {}

  static getInstance(): TaskProcessorService {
    if (!TaskProcessorService.instance) {
      TaskProcessorService.instance = new TaskProcessorService();
    }
    return TaskProcessorService.instance;
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (enabled && !this.isProcessing) {
      this.start();
    }
  }

  getStatus() {
    return this.isEnabled;
  }

  async start() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.stopRequested = false;
    
    logger.info('Iniciando bucle de procesamiento de tareas...', 'TaskProcessor');
    
    this.processLoop();
  }

  stop() {
    this.stopRequested = true;
    this.isProcessing = false;
  }

  private async processLoop() {
    while (this.isProcessing && !this.stopRequested) {
      try {
        if (!this.isEnabled) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }

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
          logger.warn(`Thermal Guard activo: Esperando ${delay/1000}s para disipar calor...`, 'TaskProcessor');
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      } catch (error) {
        logger.error('Error critico en el bucle', 'TaskProcessor', error);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
  }

  private async executeTask(task: PendingTask) {
    try {
      if (task.type === 'cloud_sync') {
        // Bundling logic: Pick up other pending cloud_sync tasks
        const batchTasks = await taskQueueService.getPendingBatch('cloud_sync', 20);
        
        // Ensure we load the most up-to-date products from the local DB avoiding payload bloating
        const skus = Array.from(new Set(batchTasks.map(t => t.payload.sku)));
        const products = [];
        for (const sku of skus) {
          if (sku) {
            const p = await dataService.getProductBySku(sku);
            if (p) products.push(p);
          }
        }
        
        logger.info(`Procesando paquete de ${products.length} sincronizaciones.`, 'TaskProcessor');
        
        // Mark all as processing
        await Promise.all(batchTasks.map(t => 
          taskQueueService.updateTask(t.id, { status: 'processing' })
        ));

        try {
          await cloudSyncService.updateProductsBatch(products);
          aiOrchestratorService.trackActivity(5 * products.length);
          
          // Remove all successful tasks
          await Promise.all(batchTasks.map(t => taskQueueService.removeTask(t.id)));
          logger.info(`Paquete de ${products.length} completado.`, 'TaskProcessor');
        } catch (error: any) {
          // Revert or retry individually? For now, we allow standard error handling to set them to failed/pending again
          for (const t of batchTasks) {
            await this.handleTaskError(t, error);
          }
        }
        return;
      }

      // Standard processing for non-batchable tasks
      logger.info(`Ejecutando tarea: ${task.type} (${task.id})`, 'TaskProcessor');
      await taskQueueService.updateTask(task.id, { status: 'processing' });

      switch (task.type) {
        case 'ai_analysis': {
          const payload = task.payload as AiAnalysisPayload;
          if (payload.type === 'synergy') {
            const product = payload.product || await dataService.getProductBySku(payload.sku || '');
            if (product) {
              await synergyBackgroundService.forceAnalyze(product);
              aiOrchestratorService.trackActivity(50);
            }
          }
          break;
        }

        case 'ingredient_analysis': {
          const payload = task.payload as IngredientAnalysisPayload;
          const prodToAnalyze = payload.product || await dataService.getProductBySku(payload.sku || '');
          if (prodToAnalyze && prodToAnalyze.principios_activos && prodToAnalyze.principios_activos.length > 0) {
            const { aiService } = await import('./AIService');
            const result = await aiService.explainIngredients(prodToAnalyze.nombre_comercial, prodToAnalyze.principios_activos);
            if (result && Object.keys(result).length > 0) {
              await dataService.saveProduct({
                ...prodToAnalyze,
                anotaciones_componentes: result
              }, { silent: true });
              
              // Forzamos el respaldo en la nube del nuevo análisis
              await taskQueueService.addTask('cloud_sync', { sku: prodToAnalyze.sku });
            }
            aiOrchestratorService.trackActivity(40);
          }
          break;
        }

        case 'vectorization': {
          const payload = task.payload as VectorizationPayload;
          const prodToVectorize = payload.product || await dataService.getProductBySku(payload.sku || '');
          if (prodToVectorize) {
            await vectorBackgroundService.vectorizeProduct(prodToVectorize);
            aiOrchestratorService.trackActivity(30);
          }
          break;
        }

        default:
          logger.warn(`Tipo de tarea desconocido: ${task.type}`, 'TaskProcessor');
      }

      await taskQueueService.removeTask(task.id);
      logger.info(`Tarea completada: ${task.id}`, 'TaskProcessor');

    } catch (error: any) {
      await this.handleTaskError(task, error);
    }
  }

  private async handleTaskError(task: PendingTask, error: any) {
    logger.error(`Error ejecutando tarea ${task.type} (${task.id})`, 'TaskProcessor', error);
    
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

export const taskProcessorService = TaskProcessorService.getInstance();
