import { EventBus, EventType } from './EventBus';

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

const getTasksFromStorage = (): PendingTask[] => {
  const tasks = localStorage.getItem(STORAGE_KEY);
  try {
    return tasks ? JSON.parse(tasks) : [];
  } catch (e) {
    return [];
  }
};

const saveTasksToStorage = (tasks: PendingTask[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
};

export const TaskQueueService = {
  addTask: async (type: 'cloud_sync' | 'ai_analysis' | 'vectorization', payload: any, options: AddTaskOptions = { deduplicate: true }) => {
    let tasks = getTasksFromStorage();
    const sku = payload.sku || (type === 'cloud_sync' ? payload.sku : null);

    if (options.deduplicate && sku) {
      const existingIndex = tasks.findIndex(
        t => t.type === type && t.status === 'pending' && (t.payload.sku === sku || t.payload.product?.sku === sku)
      );

      if (existingIndex !== -1) {
        tasks[existingIndex].timestamp = Date.now();
        saveTasksToStorage(tasks);
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
    saveTasksToStorage(tasks);
    
    EventBus.emit(EventType.TASK_QUEUED, taskData);
    console.log(`[TaskQueue] Tarea encolada: ${type} (${id})`);
  },

  getNextPending: async (): Promise<PendingTask | null> => {
    const tasks = getTasksFromStorage();
    // Sort by timestamp asc, return first pending
    const pending = tasks.filter(t => t.status === 'pending').sort((a,b) => a.timestamp - b.timestamp);
    return pending.length > 0 ? pending[0] : null;
  },

  getTasks: async (): Promise<PendingTask[]> => {
    return getTasksFromStorage();
  },

  updateTask: async (id: string, updates: Partial<PendingTask>) => {
    let tasks = getTasksFromStorage();
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...updates };
      saveTasksToStorage(tasks);
      EventBus.emit(EventType.TASK_UPDATED, { id, ...updates });
    }
  },

  removeTask: async (id: string) => {
    let tasks = getTasksFromStorage();
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      tasks.splice(index, 1);
      saveTasksToStorage(tasks);
      EventBus.emit(EventType.TASK_COMPLETED, { id });
    }
  },

  getQueueLength: (): number => {
    return getTasksFromStorage().filter(t => t.status === 'pending').length;
  },

  getStats: async () => {
    const tasks = getTasksFromStorage();
    const pending = tasks.filter(t => t.status === 'pending').length;
    const failed = tasks.filter(t => t.status === 'failed').length;
    return { pending, failed };
  },

  runCleanup: async () => {
    let tasks = getTasksFromStorage();
    const now = Date.now();
    const STUCK_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    
    let modified = false;
    tasks = tasks.map(t => {
      if (t.status === 'processing' && (now - t.timestamp > STUCK_TIMEOUT)) {
        console.warn(`[TaskQueue] Reseteando tarea estancada ${t.id} (${t.type})`);
        modified = true;
        return { ...t, status: 'pending', timestamp: now, retries: (t.retries || 0) + 1 };
      }
      return t;
    });

    if (modified) {
      saveTasksToStorage(tasks);
    }
  }
};
