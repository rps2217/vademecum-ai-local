/**
 * AuditTrailService - Registro de cambios en productos
 * 
 * Mantiene un historial de todas las modificaciones realizadas
 * a los productos para trazabilidad y rollback.
 */

import { Product } from '../core/types/product.types';
import { logger } from './LoggerService';
import { EventBus, EventType } from './EventBus';

export type AuditAction = 
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'SYNC_UPLOAD'
  | 'SYNC_DOWNLOAD'
  | 'AI_ANALYSIS'
  | 'MERGE'
  | 'ROLLBACK';

export interface AuditEntry {
  id: string;
  timestamp: number;
  action: AuditAction;
  sku: string;
  productName: string;
  userId?: string;
  deviceId?: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata?: Record<string, any>;
  source: 'local' | 'cloud' | 'ai' | 'user';
}

export interface AuditQuery {
  sku?: string;
  action?: AuditAction;
  source?: AuditEntry['source'];
  startDate?: number;
  endDate?: number;
  limit?: number;
  offset?: number;
}

export class AuditTrailService {
  private static instance: AuditTrailService;
  private entries: AuditEntry[] = [];
  private maxEntries = 10000;
  private storageKey = 'vademecum_audit_trail';
  private listeners: ((entry: AuditEntry) => void)[] = [];
  private listenersAll: ((entries: AuditEntry[]) => void)[] = [];

  private constructor() {
    this.loadFromStorage();
    this.subscribeToEvents();
  }

  static getInstance(): AuditTrailService {
    if (!AuditTrailService.instance) {
      AuditTrailService.instance = new AuditTrailService();
    }
    return AuditTrailService.instance;
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.entries = Array.isArray(parsed) ? parsed : [];
        // Limpiar entradas antiguas si excede el max
        if (this.entries.length > this.maxEntries) {
          this.entries = this.entries.slice(-this.maxEntries);
        }
      }
      logger.info(`Audit trail cargado: ${this.entries.length} entradas`, 'AuditTrail');
    } catch (error) {
      logger.error('Error cargando audit trail', 'AuditTrail', error);
      this.entries = [];
    }
  }

  private saveToStorage(): void {
    try {
      // Mantener solo las ultimas entradas
      const toSave = this.entries.slice(-this.maxEntries);
      localStorage.setItem(this.storageKey, JSON.stringify(toSave));
    } catch (error) {
      logger.error('Error guardando audit trail', 'AuditTrail', error);
    }
  }

  private subscribeToEvents(): void {
    EventBus.on<any>(EventType.PRODUCT_ADDED).subscribe((event) => {
      this.log({
        action: 'SYNC_DOWNLOAD',
        sku: event?.sku,
        productName: event?.nombre_comercial || 'Unknown',
        source: 'cloud',
        metadata: { event }
      });
    });

    EventBus.on<any>(EventType.PRODUCT_UPDATED).subscribe((event) => {
      this.log({
        action: 'SYNC_DOWNLOAD',
        sku: event?.sku,
        productName: event?.nombre_comercial || 'Unknown',
        source: 'cloud',
        metadata: { event }
      });
    });

    EventBus.on<any>(EventType.PRODUCT_DELETED).subscribe((event) => {
      this.log({
        action: 'DELETE',
        sku: event?.sku,
        productName: 'Unknown',
        source: 'cloud',
        metadata: { event }
      });
    });
  }

  /**
   * Registrar una accion
   */
  log(params: {
    action: AuditAction;
    sku: string;
    productName: string;
    userId?: string;
    deviceId?: string;
    changes?: AuditEntry['changes'];
    metadata?: Record<string, any>;
    source?: AuditEntry['source'];
  }): string {
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const entry: AuditEntry = {
      id,
      timestamp: Date.now(),
      action: params.action,
      sku: params.sku,
      productName: params.productName,
      userId: params.userId,
      deviceId: params.deviceId,
      changes: params.changes,
      metadata: params.metadata,
      source: params.source || 'local'
    };

    this.entries.push(entry);
    
    // Mantener limite
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }

    this.saveToStorage();
    
    // Notificar listeners
    this.listeners.forEach(cb => cb(entry));

    logger.info(`Audit: ${params.action} - ${params.sku}`, 'AuditTrail');
    
    return id;
  }

  /**
   * Registrar cambios de producto (新旧 valores)
   */
  logProductChange(
    sku: string,
    productName: string,
    action: 'UPDATE' | 'CREATE' | 'DELETE',
    oldProduct?: Partial<Product>,
    newProduct?: Partial<Product>,
    source: AuditEntry['source'] = 'user'
  ): string {
    const changes: AuditEntry['changes'] = [];

    if (oldProduct && newProduct) {
      for (const key of Object.keys(newProduct) as (keyof Product)[]) {
        if (JSON.stringify(oldProduct[key]) !== JSON.stringify(newProduct[key])) {
          changes.push({
            field: key,
            oldValue: oldProduct[key],
            newValue: newProduct[key]
          });
        }
      }
    }

    return this.log({
      action,
      sku,
      productName,
      changes: changes.length > 0 ? changes : undefined,
      source
    });
  }

  /**
   * Consultar entradas
   */
  query(params: AuditQuery = {}): AuditEntry[] {
    let results = [...this.entries];

    if (params.sku) {
      results = results.filter(e => e.sku === params.sku);
    }

    if (params.action) {
      results = results.filter(e => e.action === params.action);
    }

    if (params.source) {
      results = results.filter(e => e.source === params.source);
    }

    if (params.startDate) {
      results = results.filter(e => e.timestamp >= params.startDate!);
    }

    if (params.endDate) {
      results = results.filter(e => e.timestamp <= params.endDate!);
    }

    // Ordenar por timestamp descendente
    results.sort((a, b) => b.timestamp - a.timestamp);

    // Paginacion
    if (params.offset) {
      results = results.slice(params.offset);
    }

    if (params.limit) {
      results = results.slice(0, params.limit);
    }

    return results;
  }

  /**
   * Obtener historial de un producto
   */
  getProductHistory(sku: string, limit: number = 50): AuditEntry[] {
    return this.query({ sku, limit });
  }

  /**
   * Obtener cambios entre dos fechas
   */
  getChangesBetween(startDate: Date, endDate: Date): AuditEntry[] {
    return this.query({
      startDate: startDate.getTime(),
      endDate: endDate.getTime()
    });
  }

  /**
   * Obtener todas las acciones de un tipo
   */
  getByAction(action: AuditAction, limit: number = 100): AuditEntry[] {
    return this.query({ action, limit });
  }

  /**
   * Obtener entrada por ID
   */
  getById(id: string): AuditEntry | undefined {
    return this.entries.find(e => e.id === id);
  }

  /**
   * Obtener estadisticas
   */
  getStats(): {
    total: number;
    byAction: Record<AuditAction, number>;
    bySource: Record<string, number>;
    last24h: number;
    last7d: number;
  } {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;
    const last7d = now - 7 * 24 * 60 * 60 * 1000;

    const byAction: Record<AuditAction, number> = {
      CREATE: 0, UPDATE: 0, DELETE: 0,
      SYNC_UPLOAD: 0, SYNC_DOWNLOAD: 0,
      AI_ANALYSIS: 0, MERGE: 0, ROLLBACK: 0
    };

    const bySource: Record<string, number> = {};

    let last24hCount = 0;
    let last7dCount = 0;

    for (const entry of this.entries) {
      byAction[entry.action]++;
      bySource[entry.source] = (bySource[entry.source] || 0) + 1;

      if (entry.timestamp >= last24h) last24hCount++;
      if (entry.timestamp >= last7d) last7dCount++;
    }

    return {
      total: this.entries.length,
      byAction,
      bySource,
      last24h: last24hCount,
      last7d: last7dCount
    };
  }

  /**
   * Suscribirse a nuevas entradas
   */
  onNewEntry(callback: (entry: AuditEntry) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Exportar historial
   */
  export(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.entries, null, 2);
    }

    // CSV
    const headers = ['id', 'timestamp', 'action', 'sku', 'productName', 'source', 'userId', 'deviceId'];
    const csvRows = [headers.join(',')];

    for (const entry of this.entries) {
      const row = headers.map(h => {
        const val = (entry as any)[h];
        if (val === undefined || val === null) return '';
        if (typeof val === 'object') return JSON.stringify(val).replace(/"/g, '""');
        return String(val).replace(/"/g, '""');
      });
      csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
  }

  /**
   * Limpiar historial
   */
  clear(olderThan?: number): void {
    if (olderThan) {
      const threshold = Date.now() - olderThan;
      this.entries = this.entries.filter(e => e.timestamp >= threshold);
    } else {
      this.entries = [];
    }
    this.saveToStorage();
    logger.info('Audit trail limpiado', 'AuditTrail');
  }

  /**
   * Obtener count
   */
  getCount(): number {
    return this.entries.length;
  }
}

export const auditTrailService = AuditTrailService.getInstance();
