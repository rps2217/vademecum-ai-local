import { EventBus, EventType } from './EventBus';
import { logger } from './LoggerService';

export interface PendingTask {
  id: string;
  type: 'cloud_sync' | 'ai_analysis' | 'vectorization';
  payload: any;
  timestamp: number;
  status: 'pending' | 'processing' | 'failed';
  retries: number;
  lastError?: string;
}

interface AddTaskOptions {
  deduplicate?: boolean;
}

const STORAGE_KEY = 'pending_tasks';

class TaskQueueService {
  private static instance: TaskQueueService;

  private constructor() {}

  static getInstance(): TaskQueueService {
    if (!TaskQueueService.instance) {
      TaskQueueService.instance = new TaskQueueService();
    }
    return TaskQueueService.instance;
  }

  private getTasksFromStorage(): PendingTask[] {
    const tasks = localStorage.getItem(STORAGE_KEY);
    try {
      return tasks ? JSON.parse(tasks) : [];
    } catch (e) {
      return [];
    }
  }

  private saveTasksToStorage(tasks: PendingTask[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  async addTask(type: 'cloud_sync' | 'ai_analysis' | 'vectorization', payload: any, options: AddTaskOptions = { deduplicate: true }) {
    let tasks = this.getTasksFromStorage();
    const sku = payload.sku || (type === 'cloud_sync' ? payload.sku : null);

    if (options.deduplicate && sku) {
      const existingIndex = tasks.findIndex(
        t => t.type === type && t.status === 'pending' && (t.payload.sku === sku || t.payload.product?.sku === sku)
      );

      if (existingIndex !== -1) {
        tasks[existingIndex].timestamp = Date.now();
        this.saveTasksToStorage(tasks);
        return;
      }
    }

    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    const taskData: PendingTask = {
      id,
      type,
      payload,
      timestamp: Date.now(),
      status: 'pending',
      retries: 0
    };

    tasks.push(taskData);
    this.saveTasksToStorage(tasks);
    
    EventBus.emit(EventType.TASK_QUEUED, taskData);
    logger.info(`Tarea encolada: ${type} (${id})`, 'TaskQueue');
  }

  async getNextPending(): Promise<PendingTask | null> {
    const tasks = this.getTasksFromStorage();
    const pending = tasks.filter(t => t.status === 'pending').sort((a,b) => a.timestamp - b.timestamp);
    return pending.length > 0 ? pending[0] : null;
  }

  async getTasks(): Promise<PendingTask[]> {
    return this.getTasksFromStorage();
  }

  async updateTask(id: string, updates: Partial<PendingTask>) {
    let tasks = this.getTasksFromStorage();
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...updates };
      this.saveTasksToStorage(tasks);
      EventBus.emit(EventType.TASK_UPDATED, { id, ...updates });
    }
  }

  async removeTask(id: string) {
    let tasks = this.getTasksFromStorage();
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      tasks.splice(index, 1);
      this.saveTasksToStorage(tasks);
      EventBus.emit(EventType.TASK_COMPLETED, { id });
    }
  }

  getQueueLength(): number {
    return this.getTasksFromStorage().filter(t => t.status === 'pending').length;
  }

  async getStats() {
    const tasks = this.getTasksFromStorage();
    const pending = tasks.filter(t => t.status === 'pending').length;
    const failed = tasks.filter(t => t.status === 'failed').length;
    return { pending, failed };
  }

  async runCleanup() {
    let tasks = this.getTasksFromStorage();
    const now = Date.now();
    const STUCK_TIMEOUT = 30 * 60 * 1000; 
    
    let modified = false;
    tasks = tasks.map(t => {
      if (t.status === 'processing' && (now - t.timestamp > STUCK_TIMEOUT)) {
        logger.warn(`Reseteando tarea estancada ${t.id} (${t.type})`, 'TaskQueue');
        modified = true;
        return { ...t, status: 'pending', timestamp: now, retries: (t.retries || 0) + 1 };
      }
      return t;
    });

    if (modified) {
      this.saveTasksToStorage(tasks);
    }
  }
}

export const taskQueueService = TaskQueueService.getInstance();
