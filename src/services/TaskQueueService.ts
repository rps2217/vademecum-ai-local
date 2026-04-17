
export interface PendingTask {
  id: string;
  type: 'firebase_sync' | 'ai_analysis';
  payload: any;
  timestamp: number;
}

export const TaskQueueService = {
  addTask: async (type: 'firebase_sync' | 'ai_analysis', payload: any) => {
    console.warn('[TaskQueueService] Tareas locales deshabilitadas');
  },

  getTasks: async (): Promise<PendingTask[]> => {
    return [];
  },

  removeTask: async (id: string) => {
    console.warn('[TaskQueueService] Tareas locales deshabilitadas');
  }
};
