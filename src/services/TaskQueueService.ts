import { SQLiteService } from '../core/database/sqliteService';

export interface PendingTask {
  id: string;
  type: 'firebase_sync' | 'ai_analysis' | 'vectorization';
  payload: any;
  timestamp: number;
}

export const TaskQueueService = {
  addTask: async (type: 'firebase_sync' | 'ai_analysis' | 'vectorization', payload: any) => {
    try {
      const db = SQLiteService.getDB();
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
      const stmt = db.prepare('INSERT INTO pending_tasks (id, type, payload, timestamp) VALUES (?, ?, ?, ?)');
      stmt.run([id, type, JSON.stringify(payload), Date.now()]);
      stmt.free();
      await SQLiteService.save();
      console.log(`[TaskQueue] Tarea encolada: ${type} (${id})`);
    } catch (e) {
      console.error('[TaskQueue] Error al añadir tarea:', e);
    }
  },

  getTasks: async (): Promise<PendingTask[]> => {
    try {
      const db = SQLiteService.getDB();
      const rows = db.prepare('SELECT * FROM pending_tasks ORDER BY timestamp ASC').all();
      return rows.map((r: any) => ({
        ...r,
        payload: JSON.parse(r.payload)
      }));
    } catch (e) {
      console.error('[TaskQueue] Error al obtener tareas:', e);
      return [];
    }
  },

  removeTask: async (id: string) => {
    try {
      const db = SQLiteService.getDB();
      db.run('DELETE FROM pending_tasks WHERE id = ?', [id]);
      await SQLiteService.save();
    } catch (e) {
      console.error('[TaskQueue] Error al eliminar tarea:', e);
    }
  }
};
