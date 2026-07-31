/**
 * Audit Log Service
 * 
 * Sistema de audit log inmutable con hash chain para compliance.
 * Cada entrada incluye un hash del contenido anterior para garantizar
 * la inmutabilidad e integridad del historial.
 */

import { db } from '@/db';
import { generateId, now, getDeviceId } from '@/db/schema';
import type { DbAuditLog } from '@/db/schema';
import { logger } from '@/lib/logger';

// ============================================
// TIPOS
// ============================================

export type AuditAction =
  | 'patient.created'
  | 'patient.updated'
  | 'patient.deleted'
  | 'consultation.created'
  | 'consultation.updated'
  | 'consultation.ended'
  | 'product.recommended'
  | 'product.accepted'
  | 'product.rejected'
  | 'prescription.created'
  | 'allergy.added'
  | 'allergy.removed'
  | 'condition.added'
  | 'condition.removed'
  | 'medication.added'
  | 'medication.removed'
  | 'kb.ingredient.created'
  | 'kb.ingredient.updated'
  | 'kb.synergy.created'
  | 'kb.synergy.updated'
  | 'sync.started'
  | 'sync.completed'
  | 'sync.failed'
  | 'auth.login'
  | 'auth.logout'
  | 'auth.failed';

export interface AuditEntry {
  action: AuditAction;
  targetType: string;
  targetId: string;
  details?: Record<string, unknown>;
  userId?: string;
}

export interface AuditQuery {
  fromDate?: number;
  toDate?: number;
  targetType?: string;
  targetId?: string;
  userId?: string;
  action?: AuditAction;
  limit?: number;
}

// ============================================
// AUDIT LOG SERVICE
// ============================================

export class AuditLogService {
  private static instance: AuditLogService | null = null;
  private lastHash: string | null = null;

  private constructor() {
    this.loadLastHash();
  }

  static getInstance(): AuditLogService {
    if (!AuditLogService.instance) {
      AuditLogService.instance = new AuditLogService();
    }
    return AuditLogService.instance;
  }

  /**
   * Carga el último hash guardado
   */
  private async loadLastHash(): Promise<void> {
    const lastEntry = await db.auditLog
      .orderBy('timestamp')
      .last();
    this.lastHash = lastEntry?.hash || null;
  }

  /**
   * Registra una acción en el audit log
   */
  async log(entry: AuditEntry): Promise<string> {
    const id = generateId();
    const timestamp = now();
    const deviceId = getDeviceId();

    const contentHash = await this.calculateContentHash({
      id,
      timestamp,
      deviceId,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      details: entry.details,
      userId: entry.userId,
      previousHash: this.lastHash,
    });

    const auditEntry: DbAuditLog = {
      id,
      timestamp,
      deviceId,
      userId: entry.userId,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      details: entry.details,
      previousHash: this.lastHash || undefined,
      hash: contentHash,
    };

    await db.auditLog.add(auditEntry);
    this.lastHash = contentHash;

    logger.log('[AuditLog] Entry created:', {
      id,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
    });

    return id;
  }

  /**
   * Registra múltiples acciones en batch
   */
  async logBatch(entries: AuditEntry[]): Promise<string[]> {
    const ids: string[] = [];
    const timestamp = now();
    const deviceId = getDeviceId();

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const id = generateId();

      const contentHash = await this.calculateContentHash({
        id,
        timestamp: timestamp + i,
        deviceId,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        details: entry.details,
        userId: entry.userId,
        previousHash: this.lastHash,
      });

      const auditEntry: DbAuditLog = {
        id,
        timestamp: timestamp + i,
        deviceId,
        userId: entry.userId,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        details: entry.details,
        previousHash: this.lastHash || undefined,
        hash: contentHash,
      };

      await db.auditLog.add(auditEntry);
      this.lastHash = contentHash;
      ids.push(id);
    }

    return ids;
  }

  /**
   * Consulta entradas del audit log
   */
  async query(query: AuditQuery = {}): Promise<DbAuditLog[]> {
    let collection = db.auditLog.orderBy('timestamp').reverse();

    const entries = await collection.toArray();

    return entries.filter(entry => {
      if (query.fromDate && entry.timestamp < query.fromDate) return false;
      if (query.toDate && entry.timestamp > query.toDate) return false;
      if (query.targetType && entry.targetType !== query.targetType) return false;
      if (query.targetId && entry.targetId !== query.targetId) return false;
      if (query.userId && entry.userId !== query.userId) return false;
      if (query.action && entry.action !== query.action) return false;
      return true;
    }).slice(0, query.limit || 100);
  }

  /**
   * Obtiene historial de un objetivo específico
   */
  async getHistory(targetType: string, targetId: string): Promise<DbAuditLog[]> {
    return db.auditLog
      .where('[targetType+targetId]')
      .equals([targetType, targetId])
      .reverse()
      .sortBy('timestamp');
  }

  /**
   * Verifica la integridad del hash chain
   */
  async verifyIntegrity(fromTimestamp?: number): Promise<{
    valid: boolean;
    brokenAt?: string;
    errors: string[];
  }> {
    const errors: string[] = [];
    let previousHash: string | null = null;

    let entries = await db.auditLog
      .orderBy('timestamp')
      .toArray();

    if (fromTimestamp) {
      entries = entries.filter(e => e.timestamp >= fromTimestamp);
    }

    for (const entry of entries) {
      const expectedHash = await this.calculateContentHash({
        id: entry.id,
        timestamp: entry.timestamp,
        deviceId: entry.deviceId,
        action: entry.action as AuditAction,
        targetType: entry.targetType,
        targetId: entry.targetId,
        details: entry.details,
        userId: entry.userId,
        previousHash: previousHash,
      });

      if (entry.hash !== expectedHash) {
        errors.push(`Hash mismatch at ${entry.id}`);
      }

      if (previousHash && entry.previousHash !== previousHash) {
        errors.push(`Chain broken at ${entry.id}`);
      }

      previousHash = entry.hash;
    }

    const brokenAt = errors.length > 0 ? entries[errors.length - 1]?.id : undefined;

    return {
      valid: errors.length === 0,
      brokenAt,
      errors,
    };
  }

  /**
   * Obtiene estadísticas de auditoría
   */
  async getStats(fromDate?: number): Promise<{
    totalEntries: number;
    byAction: Record<string, number>;
    byTargetType: Record<string, number>;
    byUser: Record<string, number>;
  }> {
    let entries = await db.auditLog.toArray();

    if (fromDate) {
      entries = entries.filter(e => e.timestamp >= fromDate);
    }

    const stats = {
      totalEntries: entries.length,
      byAction: {} as Record<string, number>,
      byTargetType: {} as Record<string, number>,
      byUser: {} as Record<string, number>,
    };

    for (const entry of entries) {
      stats.byAction[entry.action] = (stats.byAction[entry.action] || 0) + 1;
      stats.byTargetType[entry.targetType] = (stats.byTargetType[entry.targetType] || 0) + 1;
      if (entry.userId) {
        stats.byUser[entry.userId] = (stats.byUser[entry.userId] || 0) + 1;
      }
    }

    return stats;
  }

  /**
   * Limpia entradas antiguas
   */
  async prune(olderThanDays: number = 365): Promise<number> {
    const cutoff = now() - (olderThanDays * 24 * 60 * 60 * 1000);
    
    const firstEntry = await db.auditLog.orderBy('timestamp').first();
    if (firstEntry && firstEntry.timestamp < cutoff) {
      const oldEntries = await db.auditLog
        .where('timestamp')
        .below(cutoff)
        .filter(e => e.id !== firstEntry.id)
        .toArray();
      
      await db.auditLog.bulkDelete(oldEntries.map(e => e.id));
      return oldEntries.length;
    }

    return 0;
  }

  /**
   * Calcula hash SHA-256 del contenido
   */
  private async calculateContentHash(data: {
    id: string;
    timestamp: number;
    deviceId: string;
    action: AuditAction;
    targetType: string;
    targetId: string;
    details?: Record<string, unknown>;
    userId?: string;
    previousHash?: string | null;
  }): Promise<string> {
    const content = JSON.stringify({
      id: data.id,
      timestamp: data.timestamp,
      deviceId: data.deviceId,
      action: data.action,
      targetType: data.targetType,
      targetId: data.targetId,
      details: data.details,
      userId: data.userId,
      previousHash: data.previousHash,
    });

    const encoder = new TextEncoder();
    const encoded = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

export const auditLog = AuditLogService.getInstance();
