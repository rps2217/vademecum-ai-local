import { logger } from './LoggerService';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  timestamp?: number;
  [key: string]: unknown;
}

export interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  severity: ErrorSeverity;
  context: ErrorContext;
  handled: boolean;
  timestamp: number;
}

type ErrorHandler = (error: ErrorReport) => void;

/**
 * Centralized error handling service
 * Catches, categorizes, and handles application errors
 */
export class ErrorHandlerService {
  private static instance: ErrorHandlerService;
  private reports: ErrorReport[] = [];
  private handlers: ErrorHandler[] = [];
  private readonly MAX_REPORTS = 100;
  private readonly SEVERITY_THRESHOLD = ErrorSeverity.MEDIUM;

  private constructor() {
    this.setupGlobalHandlers();
  }

  static getInstance(): ErrorHandlerService {
    if (!ErrorHandlerService.instance) {
      ErrorHandlerService.instance = new ErrorHandlerService();
    }
    return ErrorHandlerService.instance;
  }

  /**
   * Setup global error handlers for uncaught exceptions
   */
  private setupGlobalHandlers(): void {
    // Handle uncaught exceptions
    window.addEventListener('error', (event) => {
      this.captureError(event.error, {
        type: 'uncaught_exception',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(event.reason, {
        type: 'unhandled_rejection',
      });
    });
  }

  /**
   * Subscribe to error events
   */
  subscribe(handler: ErrorHandler): () => void {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter(h => h !== handler);
    };
  }

  /**
   * Capture and process an error
   */
  captureError(error: unknown, context: Partial<ErrorContext> = {}): ErrorReport | null {
    if (!error) return null;

    const errorInfo = this.extractErrorInfo(error);
    const severity = this.calculateSeverity(errorInfo);

    const report: ErrorReport = {
      id: crypto.randomUUID(),
      message: errorInfo.message,
      stack: errorInfo.stack,
      severity,
      context: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: Date.now(),
        ...context,
      },
      handled: false,
      timestamp: Date.now(),
    };

    // Store the report
    this.reports = [report, ...this.reports].slice(0, this.MAX_REPORTS);

    // Notify handlers
    this.notifyHandlers(report);

    // Log the error
    if (severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.HIGH) {
      logger.error(`[CRITICAL] ${report.message}`, 'ErrorHandler', { 
        stack: report.stack,
        severity,
        context: report.context,
      });
    } else if (severity === ErrorSeverity.MEDIUM) {
      logger.warn(`[ERROR] ${report.message}`, 'ErrorHandler', { 
        stack: report.stack,
        severity,
      });
    }

    return report;
  }

  /**
   * Extract error information from various error types
   */
  private extractErrorInfo(error: unknown): { message: string; stack?: string } {
    if (error instanceof Error) {
      return {
        message: error.message,
        stack: error.stack,
      };
    }

    if (typeof error === 'string') {
      return { message: error };
    }

    if (error && typeof error === 'object') {
      const err = error as Record<string, unknown>;
      return {
        message: String(err.message || err.msg || 'Unknown error'),
        stack: err.stack ? String(err.stack) : undefined,
      };
    }

    return { message: 'Unknown error type' };
  }

  /**
   * Calculate error severity based on various factors
   */
  private calculateSeverity(errorInfo: { message: string; stack?: string }): ErrorSeverity {
    const { message, stack } = errorInfo;
    const lowerMessage = message.toLowerCase();

    // Critical errors
    if (
      lowerMessage.includes('auth') ||
      lowerMessage.includes('permission') ||
      lowerMessage.includes('unauthorized') ||
      lowerMessage.includes('database') ||
      lowerMessage.includes('critical')
    ) {
      return ErrorSeverity.CRITICAL;
    }

    // High severity - data loss potential
    if (
      lowerMessage.includes('sync') ||
      lowerMessage.includes('save') ||
      lowerMessage.includes('delete') ||
      lowerMessage.includes('timeout') ||
      lowerMessage.includes('network')
    ) {
      return ErrorSeverity.HIGH;
    }

    // Medium severity - functionality affected
    if (
      lowerMessage.includes('parse') ||
      lowerMessage.includes('invalid') ||
      lowerMessage.includes('format') ||
      lowerMessage.includes('type')
    ) {
      return ErrorSeverity.MEDIUM;
    }

    // Default to low severity
    return ErrorSeverity.LOW;
  }

  /**
   * Notify all subscribed handlers
   */
  private notifyHandlers(report: ErrorReport): void {
    for (const handler of this.handlers) {
      try {
        handler(report);
      } catch (err) {
        logger.error('Error in error handler:', err);
      }
    }
  }

  /**
   * Get all error reports
   */
  getReports(): ErrorReport[] {
    return this.reports;
  }

  /**
   * Get reports filtered by severity
   */
  getReportsBySeverity(severity: ErrorSeverity): ErrorReport[] {
    return this.reports.filter(r => r.severity === severity);
  }

  /**
   * Get critical and high severity errors
   */
  getCriticalErrors(): ErrorReport[] {
    return this.reports.filter(
      r => r.severity === ErrorSeverity.CRITICAL || r.severity === ErrorSeverity.HIGH
    );
  }

  /**
   * Clear all reports
   */
  clear(): void {
    this.reports = [];
  }

  /**
   * Mark error as handled
   */
  markAsHandled(errorId: string): void {
    const report = this.reports.find(r => r.id === errorId);
    if (report) {
      report.handled = true;
    }
  }

  /**
   * Get error count by severity
   */
  getErrorCount(): Record<ErrorSeverity, number> {
    return {
      [ErrorSeverity.LOW]: this.reports.filter(r => r.severity === ErrorSeverity.LOW).length,
      [ErrorSeverity.MEDIUM]: this.reports.filter(r => r.severity === ErrorSeverity.MEDIUM).length,
      [ErrorSeverity.HIGH]: this.reports.filter(r => r.severity === ErrorSeverity.HIGH).length,
      [ErrorSeverity.CRITICAL]: this.reports.filter(r => r.severity === ErrorSeverity.CRITICAL).length,
    };
  }

  /**
   * Export reports for debugging/support
   */
  exportReports(): string {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      counts: this.getErrorCount(),
      reports: this.reports,
    }, null, 2);
  }
}

export const errorHandler = ErrorHandlerService.getInstance();
