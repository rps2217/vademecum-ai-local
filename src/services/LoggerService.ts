import { EventBus, EventType } from './EventBus';
import { LogEntry } from '../core/types';

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
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      level,
      module,
      message,
      details
    };

    this.logs = [entry, ...this.logs].slice(0, this.MAX_LOGS);
    
    // Dispatch events for both systems
    EventBus.emit(EventType.LOG_ADDED as any, entry);
    window.dispatchEvent(new CustomEvent('app_log', { detail: entry }));

    const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
    const color = {
      info: '\x1b[34m',
      warn: '\x1b[33m',
      error: '\x1b[31m',
      success: '\x1b[32m',
      ai: '\x1b[35m'
    }[level];

    console[consoleMethod](`${color || ''}[${module}] ${message}\x1b[0m`, details || '');
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
