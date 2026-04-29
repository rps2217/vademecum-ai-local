
import { EventBus, EventType } from './EventBus';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'success';
  module: string;
  message: string;
  details?: any;
}

export class LogService {
  private static logs: LogEntry[] = [];
  private static readonly MAX_LOGS = 100;

  static add(entry: Omit<LogEntry, 'id' | 'timestamp'>) {
    const newEntry: LogEntry = {
      ...entry,
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
    };

    this.logs = [newEntry, ...this.logs].slice(0, this.MAX_LOGS);
    EventBus.emit(EventType.LOG_ADDED as any, newEntry);
    
    // Also mirror to console for dev convenience
    const consoleMethod = entry.level === 'error' ? 'error' : entry.level === 'warn' ? 'warn' : 'log';
    console[consoleMethod](`[${entry.module}] ${entry.message}`, entry.details || '');
  }

  static getLogs(): LogEntry[] {
    return this.logs;
  }

  static clear(): void {
    this.logs = [];
    EventBus.emit(EventType.LOG_ADDED as any, null);
  }
}
