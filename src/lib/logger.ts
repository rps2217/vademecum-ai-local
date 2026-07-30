/**
 * Logger utility for Vademecum AI
 * 
 * Centralized logging that respects environment (dev/prod).
 * Only console.warn and console.error are shown in production.
 * console.log is only shown in development.
 */

const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) {
      console.debug('[vademecum]', ...args);
    }
  },
  warn: (...args: unknown[]) => {
    console.warn('[vademecum]', ...args);
  },
  error: (...args: unknown[]) => {
    console.error('[vademecum]', ...args);
  },
  // Debug level - only in dev
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.debug('[vademecum:debug]', ...args);
    }
  },
};
