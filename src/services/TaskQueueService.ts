import { getDB } from '../core/database/db';

export interface PendingTask {
  id: string;
  type: 'firebase_sync' | 'ai_analysis';
  payload: any;
  timestamp: number;
}

export const TaskQueueService = {
  addTask: async (type: 'firebase_sync' | 'ai_analysis', payload: any) => {
    const db = await getDB();
    const task: PendingTask = {
      id: crypto.randomUUID(),
      type,
      payload,
      timestamp: Date.now(),
    };
    await db.put('pending_tasks', task);
  },

  getTasks: async (): Promise<PendingTask[]> => {
    const db = await getDB();
    return await db.getAll('pending_tasks');
  },

  removeTask: async (id: string) => {
    const db = await getDB();
    await db.delete('pending_tasks', id);
  }
};
