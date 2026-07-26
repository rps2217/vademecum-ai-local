import { EventBus, EventType } from './EventBus';
import { LogEntry } from '../core/types';
import { useStore } from '../store/useStore';

// Flag to prevent recursion
let isLogging = false;

class LoggerService {
  private static instance: LoggerService;
  private logs: LogEntry[] = [];
  private readonly MAX_LOGS = 150;

  private constructor() {}

  static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  log(level: LogEntry['level'], message: string, module: string = 'App', details?: any) {
    // Prevent recursion
    if (isLogging) return;
    isLogging = true;

    try {
      const entry: LogEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        level,
        module,
        message,
        details
      };

      this.logs = [entry, ...this.logs].slice(0, this.MAX_LOGS);
      
      // Sync with Zustand - use direct store access to avoid hooks issues
      try {
        const store = useStore.getState();
        if (typeof store.addLog === 'function') {
          store.addLog(entry);
        }
      } catch (e) {
        // Early logging might fail if called before store is ready, ignore
      }
      
      // Dispatch events for both systems (LOG_ADDED is now filtered in EventBus)
      EventBus.emit(EventType.LOG_ADDED as any, entry);
      
      const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
      console[consoleMethod](`[${module}] ${message}`, details || '');
    } finally {
      isLogging = false;
    }
  }

  // Helper methods for easy access
  info(message: string, module?: string, details?: any) { this.log('info', message, module, details); }
  warn(message: string, module?: string, details?: any) { this.log('warn', message, module, details); }
  error(message: string, module?: string, details?: any) { this.log('error', message, module, details); }
  success(message: string, module?: string, details?: any) { this.log('success', message, module, details); }
  ai(message: string, module?: string, details?: any) { this.log('ai', message, module, details); }

  getLogs(): LogEntry[] { return this.logs; }
  clear() {
    this.logs = [];
    EventBus.emit(EventType.LOG_ADDED as any, null);
  }
}

export const logger = LoggerService.getInstance();
