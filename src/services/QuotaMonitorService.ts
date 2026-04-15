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

      for (const task of tasks) {
        try {
          if (task.type === 'firebase_sync') {
            await FirebaseSyncService.updateProduct(task.payload);
            await TaskQueueService.removeTask(task.id);
          } else if (task.type === 'ai_analysis') {
            // Reintentar análisis IA
            // Esto es complejo porque requiere llamar a AIService.analyzeClinical
            // Por ahora, solo intentamos y si falla, dejamos la tarea
            await AIService.analyzeClinical(task.payload.product, task.payload.candidates, task.payload.type);
            await TaskQueueService.removeTask(task.id);
          }
        } catch (error) {
          console.warn(`[QuotaMonitor] Tarea ${task.id} falló nuevamente:`, error);
        }
      }
    }, 60 * 1000);
  }
};
