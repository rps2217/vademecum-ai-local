import { logger } from './LoggerService';

export enum EventType {
  PRODUCT_UPDATED = 'PRODUCT_UPDATED',
  PRODUCT_DELETED = 'PRODUCT_DELETED',
  DB_UPDATED = 'DB_UPDATED',
  SYNC_TRIGGERED = 'SYNC_TRIGGERED',
  SYNERGY_STATUS_CHANGED = 'SYNERGY_STATUS_CHANGED',
  TASK_QUEUED = 'TASK_QUEUED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  TRAY_CHANGED = 'TRAY_CHANGED',
  COMPARISON_CHANGED = 'COMPARISON_CHANGED',
  LOG_ADDED = 'LOG_ADDED'
}

interface AppEvent<T = any> {
  type: EventType;
  payload: T;
  timestamp: number;
  id: string;
}

type Listener<T> = (payload: T) => void;

export interface Subscription {
  unsubscribe: () => void;
}

const listeners = new Map<EventType, Listener<any>[]>();
const allListeners = new Set<Listener<AppEvent>>();
const eventHistory: AppEvent[] = [];
const MAX_HISTORY = 100;

// Flag to prevent logging recursion
let isLogging = false;

export const EventBus = {
  emit: <T>(type: EventType, payload: T) => {
    const event: AppEvent = { 
      type, 
      payload, 
      timestamp: Date.now(),
      id: Math.random().toString(36).substring(2, 11)
    };
    
    // Log only for non-LOG events and only if we're not already logging (prevent recursion)
    if (process.env.NODE_ENV !== 'production' && !isLogging && type !== EventType.LOG_ADDED) {
      isLogging = true;
      try {
        logger.debug(`EventBus: ${type}`, 'EventBus', {
          id: event.id,
          timestamp: new Date(event.timestamp).toISOString(),
          payload
        });
      } finally {
        isLogging = false;
      }
    }

    eventHistory.push(event);
    if (eventHistory.length > MAX_HISTORY) {
      eventHistory.shift();
    }

    const typeListeners = listeners.get(type) || [];
    typeListeners.forEach(l => l(payload));
    
    allListeners.forEach(l => l(event));
  },

  on: <T>(type: EventType) => {
    return {
      subscribe: (callback: Listener<T>) => {
        const typeListeners = listeners.get(type) || [];
        typeListeners.push(callback);
        listeners.set(type, typeListeners);
        
        return {
          unsubscribe: () => {
            const current = listeners.get(type) || [];
            listeners.set(type, current.filter(l => l !== callback));
          }
        };
      }
    };
  },

  all: () => {
    return {
      subscribe: (callback: Listener<AppEvent>) => {
        allListeners.add(callback);
        return {
          unsubscribe: () => {
            allListeners.delete(callback);
          }
        };
      }
    };
  },

  getHistory: () => [...eventHistory],

  clearHistory: () => {
    eventHistory.length = 0;
  }
};
