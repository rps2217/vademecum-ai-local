import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

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
  COMPARISON_CHANGED = 'COMPARISON_CHANGED'
}

interface AppEvent<T = any> {
  type: EventType;
  payload: T;
  timestamp: number;
  id: string;
}

const eventSubject = new Subject<AppEvent>();
const eventHistory: AppEvent[] = [];
const MAX_HISTORY = 100;

export const EventBus = {
  // Emitir un evento
  emit: <T>(type: EventType, payload: T) => {
    const event: AppEvent = { 
      type, 
      payload, 
      timestamp: Date.now(),
      id: Math.random().toString(36).substring(2, 11)
    };
    
    // Observabilidad: Loggear a consola en desarrollo
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[EventBus] ${event.type}`, {
        id: event.id,
        timestamp: new Date(event.timestamp).toISOString(),
        payload
      });
    }

    // Mantener historial
    eventHistory.push(event);
    if (eventHistory.length > MAX_HISTORY) {
      eventHistory.shift();
    }

    eventSubject.next(event);
  },

  // Observar eventos específicos
  on: <T>(type: EventType): Observable<T> => {
    return eventSubject.asObservable().pipe(
      filter(event => event.type === type),
      map(event => event.payload)
    );
  },

  // Observar TODOS los eventos (para trazabilidad/UI Debug)
  all: (): Observable<AppEvent> => {
    return eventSubject.asObservable();
  },

  // Obtener historial reciente
  getHistory: () => [...eventHistory],

  // Limpiar historial
  clearHistory: () => {
    eventHistory.length = 0;
  }
};
