import { TaskQueueService } from './TaskQueueService';
import { FirebaseSyncService } from './FirebaseSyncService';
import { AIService } from './AIService';

export const QuotaMonitorService = {
  start: () => {
    // Revisar cada 1 minuto
    setInterval(async () => {
      const tasks = await TaskQueueService.getTasks();
      if (tasks.length === 0) return;

      console.log(`[QuotaMonitor] Procesando ${tasks.length} tareas pendientes...`);

      // Agrupar tareas de sincronización de Firebase para procesarlas por lotes
      const syncTasks = tasks.filter(t => t.type === 'firebase_sync');
      const otherTasks = tasks.filter(t => t.type !== 'firebase_sync');

      if (syncTasks.length > 0) {
        const products = syncTasks.map(t => t.payload);
        const success = await FirebaseSyncService.updateProductsBatch(products);
        
        if (success) {
          console.log(`[QuotaMonitor] Sincronizados ${syncTasks.length} productos en lote.`);
          for (const task of syncTasks) {
            await TaskQueueService.removeTask(task.id);
          }
        }
      }

      // Procesar otras tareas (como análisis IA) una por una
      for (const task of otherTasks) {
        try {
          if (task.type === 'ai_analysis') {
            // Reintentar análisis IA
            if (task.payload.type === 'synergy') {
               const { SynergyBackgroundService } = await import('./SynergyBackgroundService');
               await SynergyBackgroundService.forceAnalyze(task.payload.product);
            } else {
               await AIService.analyzeClinical(task.payload.product, task.payload.candidates, task.payload.type);
            }
            await TaskQueueService.removeTask(task.id);
          }
        } catch (error) {
          console.warn(`[QuotaMonitor] Tarea ${task.id} falló nuevamente:`, error);
        }
      }
    }, 60 * 1000);
  }
};
