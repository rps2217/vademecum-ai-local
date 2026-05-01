import { LogEntry } from '../core/types';

class LoggerService {
  private static instance: LoggerService;
  private logs: LogEntry[] = [];
  private readonly MAX_LOGS = 100;

  private constructor() {}

  static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  log(level: LogEntry['level'], message: string, details?: any) {
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      level,
      message,
      details
    };

    this.logs = [entry, ...this.logs].slice(0, this.MAX_LOGS);
    
    const color = {
      info: '\x1b[34m', // Blue
      warn: '\x1b[33m', // Yellow
      error: '\x1b[31m', // Red
      ai: '\x1b[35m'   // Magenta
    }[level];

    console.log(`${color}[${level.toUpperCase()}] ${message}\x1b[0m`, details || '');
    
    // Disparar evento para posible UI de consola interna
    window.dispatchEvent(new CustomEvent('app_log', { detail: entry }));
  }

  info(message: string, details?: any) { this.log('info', message, details); }
  warn(message: string, details?: any) { this.log('warn', message, details); }
  error(message: string, details?: any) { this.log('error', message, details); }
  ai(message: string, details?: any) { this.log('ai', message, details); }

  getLogs(): LogEntry[] {
    return this.logs;
  }

  clear() {
    this.logs = [];
  }
}

export const logger = LoggerService.getInstance();
