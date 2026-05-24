import { EventBus, EventType } from './EventBus';
import { logger } from './LoggerService';
import { database, tasksCollection } from '../database';
import { Q } from '@nozbe/watermelondb';

export interface CloudSyncPayload {
  sku: string;
  operation?: 'create' | 'update' | 'delete';
  timestamp?: number;
}

export interface AiAnalysisPayload {
  sku?: string;
  query?: string;
  productName?: string;
  ingredients?: string[];
  product?: any;
  candidates?: any[];
  type?: 'synergy' | 'alternatives';
}

export interface VectorizationPayload {
  sku?: string;
  product?: any;
  text?: string;
}

export interface IngredientAnalysisPayload {
  sku?: string;
  product?: any;
}

export type TaskPayload = CloudSyncPayload | AiAnalysisPayload | VectorizationPayload | IngredientAnalysisPayload;

export interface PendingTask<P = TaskPayload> {
  id: string;
  type: 'cloud_sync' | 'ai_analysis' | 'vectorization' | 'ingredient_analysis';
  payload: P;
  timestamp: number;
  status: 'pending' | 'processing' | 'failed';
  retries: number;
  lastError?: string;
  priority?: number; 
  earliestRetryTimestamp?: number; 
}

interface AddTaskOptions {
  deduplicate?: boolean;
  priority?: number;
}

class TaskQueueService {
  private static instance: TaskQueueService;

  private constructor() {}

  static getInstance(): TaskQueueService {
    if (!TaskQueueService.instance) {
      TaskQueueService.instance = new TaskQueueService();
    }
    return TaskQueueService.instance;
  }

  async addTask<T extends TaskPayload>(
    type: PendingTask['type'], 
    payload: T, 
    options: AddTaskOptions = { deduplicate: true, priority: 0 }
  ): Promise<void> {
    const sku = (payload as any).sku || ((payload as any).product ? (payload as any).product.sku : null);
    const priority = options.priority !== undefined ? options.priority : (type === 'cloud_sync' ? 10 : 0);

    if (options.deduplicate && sku) {
      const pendingOfThisType = await tasksCollection.query(
        Q.where('type', type),
        Q.where('status', 'pending')
      ).fetch();
      
      const existing = pendingOfThisType.find(t => {
        const p = t.payload as any;
        return p.sku === sku || (p.product && p.product.sku === sku);
      });

      if (existing) {
        await database.write(async () => {
          await existing.update(t => {
            t.timestamp = Date.now();
            t.priority = Math.max(t.priority || 0, priority);
          });
        });
        return;
      }
    }

    const taskData = {
      type,
      payload_json: JSON.stringify(payload),
      timestamp: Date.now(),
      status: 'pending' as const,
      retries: 0,
      priority
    };

    await database.write(async () => {
      await tasksCollection.create(t => {
        t.type = taskData.type;
        t.payloadJson = taskData.payload_json;
        t.timestamp = taskData.timestamp;
        t.status = taskData.status;
        t.retries = taskData.retries;
        t.priority = taskData.priority;
      });
    });
    
    EventBus.emit(EventType.TASK_QUEUED, { id: 'new', ...taskData, payload });
    logger.info(`Tarea encolada: ${type}`, 'TaskQueue');
  }

  async getNextPending(): Promise<PendingTask | null> {
    const now = Date.now();
    const records = await tasksCollection.query(
      Q.where('status', 'pending'),
      Q.sortBy('priority', Q.desc),
      Q.sortBy('timestamp', Q.asc)
    ).fetch();

    const available = records.find(r => !r.earliestRetryTimestamp || r.earliestRetryTimestamp <= now);
    return available ? (available.asJSON() as PendingTask) : null;
  }

  async getPendingBatch(type: PendingTask['type'], limit: number = 20): Promise<PendingTask[]> {
    const now = Date.now();
    const records = await tasksCollection.query(
      Q.where('type', type),
      Q.where('status', 'pending'),
      Q.sortBy('priority', Q.desc),
      Q.sortBy('timestamp', Q.asc),
      Q.take(limit)
    ).fetch();

    const available = records.filter(r => !r.earliestRetryTimestamp || r.earliestRetryTimestamp <= now);
    return available.map(r => r.asJSON() as PendingTask);
  }

  async getTasks(): Promise<PendingTask[]> {
    const records = await tasksCollection.query().fetch();
    return records.map(r => r.asJSON() as PendingTask);
  }

  async updateTask(id: string, updates: Partial<PendingTask>) {
    const record = await tasksCollection.find(id);
    if (record) {
      await database.write(async () => {
        await record.update(t => {
          if (updates.status) t.status = updates.status;
          if (updates.retries !== undefined) t.retries = updates.retries;
          if (updates.lastError) t.lastError = updates.lastError;
          if (updates.earliestRetryTimestamp !== undefined) t.earliestRetryTimestamp = updates.earliestRetryTimestamp;
        });
      });
      EventBus.emit(EventType.TASK_UPDATED, { id, ...updates });
    }
  }

  async removeTask(id: string) {
    const record = await tasksCollection.find(id);
    if (record) {
      await database.write(async () => {
        await record.destroyPermanently();
      });
      EventBus.emit(EventType.TASK_COMPLETED, { id });
    }
  }

  async getQueueLength(): Promise<number> {
    const records = await tasksCollection.query(Q.where('status', 'pending')).fetch();
    return records.length;
  }

  async getStats() {
    const pendingRecords = await tasksCollection.query(Q.where('status', 'pending')).fetch();
    const failedRecords = await tasksCollection.query(Q.where('status', 'failed')).fetch();
    return { pending: pendingRecords.length, failed: failedRecords.length };
  }

  async runCleanup() {
    const now = Date.now();
    const STUCK_TIMEOUT = 30 * 60 * 1000; 
    
    const stuckTasks = await tasksCollection.query(
        Q.where('status', 'processing'),
        Q.where('timestamp', Q.lt(now - STUCK_TIMEOUT))
    ).fetch();

    if (stuckTasks.length > 0) {
      await database.write(async () => {
        for (const t of stuckTasks) {
            logger.warn(`Reseteando tarea estancada ${t.id} (${t.type})`, 'TaskQueue');
            await t.update(rec => {
                rec.status = 'pending';
                rec.timestamp = now;
                rec.retries = (rec.retries || 0) + 1;
            });
        }
      });
    }
  }
}

export const taskQueueService = TaskQueueService.getInstance();
