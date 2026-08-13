/**
 * ErrorLog - Registro local de errores técnicos en IndexedDB.
 *
 * Permite al farmacéutico exportar logs para soporte técnico.
 * NO contiene datos personales (PII) — solo mensajes técnicos,
 * stack traces y contexto de la app.
 */

import { db, generateId } from '@/db';

const MAX_LOG_ENTRIES = 500;
const OLD_LOG_MS = 30 * 24 * 60 * 60 * 1000; // 30 días

export async function logError(
  message: string,
  options?: { stack?: string; context?: string; level?: 'error' | 'warn' },
): Promise<void> {
  try {
    await db.errorLog.add({
      id: generateId(),
      timestamp: Date.now(),
      level: options?.level ?? 'error',
      message: message.slice(0, 1000),
      stack: options?.stack?.slice(0, 4000),
      context: options?.context?.slice(0, 500),
    });

    // Limpieza: mantener solo los últimos MAX_LOG_ENTRIES y <30 días
    const cutoff = Date.now() - OLD_LOG_MS;
    const old = await db.errorLog.where('timestamp').below(cutoff).primaryKeys();
    if (old.length > 0) await db.errorLog.bulkDelete(old);

    const count = await db.errorLog.count();
    if (count > MAX_LOG_ENTRIES) {
      const excess = await db.errorLog.orderBy('timestamp').limit(count - MAX_LOG_ENTRIES).primaryKeys();
      await db.errorLog.bulkDelete(excess);
    }
  } catch {
    // Si IndexedDB falla, no podemos hacer nada — fallar silenciosamente
  }
}

export async function getErrorLogs(limit = 100): Promise<DbErrorLog[]> {
  return db.errorLog.orderBy('timestamp').reverse().limit(limit).toArray();
}

export async function clearErrorLogs(): Promise<void> {
  await db.errorLog.clear();
}

export async function exportErrorLogs(): Promise<string> {
  const logs = await db.errorLog.orderBy('timestamp').toArray();
  const lines = logs.map((l) => {
    const ts = new Date(l.timestamp).toISOString();
    const ctx = l.context ? ` [${l.context}]` : '';
    const stack = l.stack ? `\n  ${l.stack}` : '';
    return `${ts} ${l.level.toUpperCase()}${ctx}: ${l.message}${stack}`;
  });
  return lines.join('\n\n');
}

/** Instala capturadores globales de errores. Llamar una sola vez al arrancar. */
export function installGlobalErrorHandlers(): void {
  window.addEventListener('error', (e) => {
    void logError(e.message || 'Error no capturado', {
      stack: e.error?.stack,
      context: 'window.error',
    });
  });

  window.addEventListener('unhandledrejection', (e) => {
    const reason = e.reason;
    const message = reason instanceof Error ? reason.message : String(reason);
    void logError(message, {
      stack: reason instanceof Error ? reason.stack : undefined,
      context: 'unhandledrejection',
    });
  });
}

import type { DbErrorLog } from '@/db/schema';
