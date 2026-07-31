/**
 * Realtime Sync
 * 
 * Soporte para Supabase Realtime para recibir cambios en tiempo real
 * desde otros dispositivos.
 */

import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { db } from '@/db';
import { now } from '@/db/schema';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { ConflictResolver } from './ConflictResolver';

export interface RealtimeConfig {
  enabled: boolean;
  tables: string[];
  onConflictDetected?: (table: string, recordId: string) => void;
  onDataReceived?: (table: string, count: number) => void;
}

type TableChangeHandler = (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => Promise<void>;

/**
 * Gestor de sincronización en tiempo real
 */
export class RealtimeSync {
  private channel: RealtimeChannel | null = null;
  private config: RealtimeConfig = {
    enabled: false,
    tables: ['ingredients', 'synergies', 'products', 'protocols'],
  };
  private handlers: Map<string, TableChangeHandler> = new Map();
  private listeners: Set<(event: RealtimeEvent) => void> = new Set();

  /**
   * Configura el sync en tiempo real
   */
  configure(config: Partial<RealtimeConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Inicia la suscripción a cambios en tiempo real
   */
  async start(): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      logger.warn('[Realtime] Supabase no configurado');
      return false;
    }

    const supabase = getSupabase();
    if (!supabase) {
      logger.warn('[Realtime] Cliente Supabase no disponible');
      return false;
    }

    if (this.channel) {
      logger.log('[Realtime] Ya hay una suscripción activa');
      return true;
    }

    try {
      const channelName = `vademecum-sync-${Date.now()}`;
      this.channel = supabase.channel(channelName, {
        config: {
          broadcast: { self: false },
          postgres: { table: this.config.tables.join(',') },
        },
      });

      // Registrar handlers para cada tabla
      for (const table of this.config.tables) {
        this.channel.on(
          'postgres_changes' as any,
          {
            event: '*',
            schema: 'public',
            table: table,
          },
          async (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
            await this.handleTableChange(table, payload);
          }
        );
      }

      // Suscribirse
      const status = await this.channel.subscribe((status: string) => {
        logger.log(`[Realtime] Estado de suscripción: ${status}`);
        this.notifyListeners({
          type: 'status',
          status: status === 'SUBSCRIBED' ? 'connected' : 'disconnected',
        });
      });

      logger.log('[Realtime] Suscripción iniciada');
      return status === 'SUBSCRIBED';
    } catch (err) {
      logger.error('[Realtime] Error al iniciar suscripción:', err);
      return false;
    }
  }

  /**
   * Detiene la suscripción
   */
  async stop(): Promise<void> {
    if (this.channel) {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.removeChannel(this.channel);
      }
      this.channel = null;
      logger.log('[Realtime] Suscripción detenida');
      this.notifyListeners({ type: 'status', status: 'disconnected' });
    }
  }

  /**
   * Registra un handler personalizado para una tabla
   */
  registerHandler(table: string, handler: TableChangeHandler): () => void {
    this.handlers.set(table, handler);
    return () => {
      this.handlers.delete(table);
    };
  }

  /**
   * Suscribe un listener a eventos de realtime
   */
  subscribe(listener: (event: RealtimeEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notifica a todos los listeners
   */
  private notifyListeners(event: RealtimeEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (err) {
        logger.error('[Realtime] Error en listener:', err);
      }
    });
  }

  /**
   * Maneja cambios en una tabla
   */
  private async handleTableChange(
    table: string,
    payload: RealtimePostgresChangesPayload<Record<string, unknown>>
  ): Promise<void> {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    logger.log(`[Realtime] Cambio en ${table}: ${eventType}`, {
      id: newRecord?.id || oldRecord?.id,
    });

    try {
      switch (eventType) {
        case 'INSERT':
        case 'UPDATE':
          await this.handleUpsert(table, newRecord as Record<string, unknown>);
          break;
        case 'DELETE':
          await this.handleDelete(table, oldRecord as Record<string, unknown>);
          break;
      }

      // Notificar listeners
      this.notifyListeners({
        type: 'change',
        table,
        eventType,
        recordId: (newRecord?.id || oldRecord?.id) as string,
      });

      // Notificar callback de datos recibidos
      this.config.onDataReceived?.(table, 1);
    } catch (err) {
      logger.error(`[Realtime] Error procesando cambio en ${table}:`, err);
    }

    // Ejecutar handler personalizado si existe
    const handler = this.handlers.get(table);
    if (handler) {
      try {
        await handler(payload);
      } catch (err) {
        logger.error(`[Realtime] Error en handler de ${table}:`, err);
      }
    }
  }

  /**
   * Maneja insert/update de un registro
   */
  private async handleUpsert(
    table: string,
    record: Record<string, unknown>
  ): Promise<void> {
    if (!record.id) return;

    const recordId = record.id as string;
    const remoteLamport = (record.lamport as number) || 0;

    switch (table) {
      case 'ingredients': {
        const local = await db.ingredients.get(recordId);
        const localLamport = local?.lamport || 0;

        // Detectar conflicto
        if (local && ConflictResolver.detectConflict(
          localLamport,
          remoteLamport,
          local.updatedAt,
          new Date(record.updated_at as string).getTime()
        )) {
          await ConflictResolver.registerConflict({
            table: 'ingredients',
            recordId,
            localVersion: local as unknown as Record<string, unknown>,
            remoteVersion: record,
            localLamport,
            remoteLamport,
          });
          this.config.onConflictDetected?.(table, recordId);
          return;
        }

        // Actualizar si remote es más reciente
        if (!local || remoteLamport > localLamport) {
          await db.ingredients.put({
            id: recordId,
            nombre: record.nombre as string,
            sinonimos: (record.sinonimos as string[]) || [],
            categoria: record.categoria as any,
            familia: record.familia as string | undefined,
            sistemas: (record.sistemas as any[]) || [],
            indicaciones: (record.indicaciones as string[]) || [],
            evidencia: (record.evidencia as any) || 'C',
            propiedades: (record.propiedades as string[]) || [],
            seguridad: (record.seguridad as any) || {},
            interacciones: (record.interacciones as string[]) || [],
            fuentes: (record.fuentes as string[]) || [],
            lamport: remoteLamport,
            deviceId: record.device_id as string || '',
            updatedAt: new Date(record.updated_at as string).getTime(),
            createdAt: new Date(record.created_at as string).getTime(),
            tombstone: (record.tombstone as 0 | 1) || 0,
          });
        }
        break;
      }

      case 'synergies': {
        const local = await db.synergies.get(recordId);
        const localLamport = local?.lamport || 0;

        if (local && ConflictResolver.detectConflict(
          localLamport,
          remoteLamport,
          local.updatedAt,
          new Date(record.updated_at as string).getTime()
        )) {
          await ConflictResolver.registerConflict({
            table: 'synergies',
            recordId,
            localVersion: local as unknown as Record<string, unknown>,
            remoteVersion: record,
            localLamport,
            remoteLamport,
          });
          this.config.onConflictDetected?.(table, recordId);
          return;
        }

        if (!local || remoteLamport > localLamport) {
          await db.synergies.put({
            id: recordId,
            ingredienteA: record.ingrediente_a as string,
            ingredienteB: record.ingrediente_b as string,
            tipo: record.tipo as any,
            nivel: (record.nivel as any) || 'medio',
            mecanismo: record.mecanismo as string | undefined,
            evidencia: (record.evidencia as any) || 'C',
            descripcion: record.descripcion as string | undefined,
            fuentes: (record.fuentes as string[]) || [],
            lamport: remoteLamport,
            deviceId: record.device_id as string || '',
            updatedAt: new Date(record.updated_at as string).getTime(),
            tombstone: (record.tombstone as 0 | 1) || 0,
          });
        }
        break;
      }
    }
  }

  /**
   * Maneja delete de un registro (tombstone)
   */
  private async handleDelete(
    table: string,
    record: Record<string, unknown>
  ): Promise<void> {
    if (!record.id) return;
    const recordId = record.id as string;

    switch (table) {
      case 'ingredients':
        await db.ingredients.update(recordId, { tombstone: 1, updatedAt: now() });
        break;
      case 'synergies':
        await db.synergies.update(recordId, { tombstone: 1, updatedAt: now() });
        break;
    }
  }

  /**
   * Verifica si hay conexión activa
   */
  isConnected(): boolean {
    return this.channel !== null;
  }
}

// Tipos para eventos
export interface RealtimeEvent {
  type: 'status' | 'change' | 'conflict';
  status?: 'connected' | 'disconnected' | 'error';
  table?: string;
  eventType?: string;
  recordId?: string;
}

// Singleton instance
export const realtimeSync = new RealtimeSync();
