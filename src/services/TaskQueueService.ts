import { getDB, waitForDB } from './DatabaseService';
import { EventBus, EventType } from './EventBus';

export interface PendingTask {
  id: string;
  type: 'firebase_sync' | 'cloud_sync' | 'ai_analysis' | 'vectorization';
  payload: any;
  timestamp: number;
  status: 'pending' | 'processing' | 'failed';
  retries: number;
  lastError?: string;
}

interface AddTaskOptions {
  deduplicate?: boolean;
}

export const TaskQueueService = {
  addTask: async (type: 'firebase_sync' | 'cloud_sync' | 'ai_analysis' | 'vectorization', payload: any, options: AddTaskOptions = { deduplicate: true }) => {
    try {
      const db = await waitForDB();
      if (!db) throw new Error('DB not initialized');
      
      const sku = payload.sku || (type === 'firebase_sync' || type === 'cloud_sync' ? payload.sku : null);

      // Deduplicación mejorada: si ya hay una tarea del mismo tipo para el mismo SKU pendiente, no duplicar
      if (options.deduplicate && sku) {
        const existing = await db.pending_tasks.findOne({
          selector: {
            type,
            status: 'pending',
            $or: [
              { 'payload.sku': sku },
              { 'payload.product.sku': sku }
            ]
          }
        }).exec();

        if (existing) {
          // Si ya existe, actualizamos el timestamp para darle prioridad si es necesario, pero no creamos otra
          await existing.incrementalPatch({ timestamp: Date.now() });
          return;
        }
      }

      const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
      const taskData = {
        id,
        type,
        payload,
        timestamp: Date.now(),
        status: 'pending',
        retries: 0
      };

      await db.pending_tasks.insert(taskData);
      
      EventBus.emit(EventType.TASK_QUEUED, taskData);
      console.log(`[TaskQueue] Tarea encolada: ${type} (${id})`);
    } catch (e) {
      console.error('[TaskQueue] Error al añadir tarea:', e);
    }
  },

  getNextPending: async (): Promise<PendingTask | null> => {
    const db = await waitForDB();
    if (!db) return null;
    
    const task = await db.pending_tasks.findOne({
      selector: { status: 'pending' },
      sort: [{ timestamp: 'asc' }]
    }).exec();
    
    return task ? task.toJSON() : null;
  },

  getTasks: async (): Promise<PendingTask[]> => {
    const db = await waitForDB();
    if (!db) return [];
    const tasks = await db.pending_tasks.find().exec();
    return tasks.map((t: any) => t.toJSON());
  },

  updateTask: async (id: string, updates: Partial<PendingTask>) => {
    const db = await waitForDB();
    if (!db) return;
    const doc = await db.pending_tasks.findOne({ selector: { id } }).exec();
    if (doc) {
      await doc.incrementalPatch(updates);
      EventBus.emit(EventType.TASK_UPDATED, { id, ...updates });
    }
  },

  removeTask: async (id: string) => {
    try {
      const db = await waitForDB();
      if (!db) return;
      const doc = await db.pending_tasks.findOne({ selector: { id } }).exec();
      if (doc) {
        await doc.remove();
        EventBus.emit(EventType.TASK_COMPLETED, { id });
      }
    } catch (e) {
      console.error('[TaskQueue] Error al eliminar tarea:', e);
    }
  },

  getStats: async () => {
    const db = await waitForDB();
    if (!db) return { pending: 0, failed: 0 };
    const pending = await db.pending_tasks.find({ selector: { status: 'pending' } }).exec();
    const failed = await db.pending_tasks.find({ selector: { status: 'failed' } }).exec();
    return { pending: pending.length, failed: failed.length };
  },

  /**
   * Limpia tareas fallidas antiguas (más de 24h) y restaura tareas atascadas.
   */
  runCleanup: async () => {
    const db = await waitForDB();
    if (!db) return;

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const thirtyMinutes = 30 * 60 * 1000;

    // 1. Eliminar tareas fallidas de más de 24h
    const oldFailed = await db.pending_tasks.find({
      selector: {
        status: 'failed',
        timestamp: { $lt: now - oneDay }
      }
    }).exec();
    
    if (oldFailed.length > 0) {
      console.log(`[TaskQueue] Limpiando ${oldFailed.length} tareas fallidas antiguas...`);
      await Promise.all(oldFailed.map((t: any) => t.remove()));
    }

    // 2. Restaurar tareas que se quedaron en 'processing' por error (más de 30 min)
    const stuckTasks = await db.pending_tasks.find({
      selector: {
        status: 'processing',
        timestamp: { $lt: now - thirtyMinutes }
      }
    }).exec();

    if (stuckTasks.length > 0) {
      console.log(`[TaskQueue] Restaurando ${stuckTasks.length} tareas atascadas...`);
      await Promise.all(stuckTasks.map((t: any) => t.incrementalPatch({ 
        status: 'pending', 
        timestamp: now,
        lastError: 'Task timeout / unexpected interruption'
      })));
    }
  }
};
