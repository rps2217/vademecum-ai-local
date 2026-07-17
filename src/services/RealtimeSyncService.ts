/**
 * RealtimeSyncService - Sincronización en tiempo real via WebSocket
 * 
 * Usa Supabase Realtime para recibir cambios de otros dispositivos
 * y mantener la base de datos local sincronizada.
 */

import { Product } from '../core/types/product.types';
import { EventBus, EventType } from './EventBus';
import { logger } from './LoggerService';
import { supabaseService } from './SupabaseService';

export type RealtimeChannel = 'products' | 'synergy' | 'chat';

export interface RealtimeEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: any;
  old_record: any;
}

export interface SyncStatus {
  connected: boolean;
  lastEvent: Date | null;
  pendingChanges: number;
  channel: RealtimeChannel | null;
}

export class RealtimeSyncService {
  private static instance: RealtimeSyncService;
  private channels: Map<RealtimeChannel, any> = new Map();
  private isConnected = false;
  private lastEvent: Date | null = null;
  private pendingChanges = 0;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, ((event: RealtimeEvent) => void)[]> = new Map();
  private statusCallbacks: ((status: SyncStatus) => void)[] = [];

  private constructor() {}

  static getInstance(): RealtimeSyncService {
    if (!RealtimeSyncService.instance) {
      RealtimeSyncService.instance = new RealtimeSyncService();
    }
    return RealtimeSyncService.instance;
  }

  /**
   * Conectar al canal de realtime
   */
  async connect(channel: RealtimeChannel = 'products'): Promise<boolean> {
    if (!supabaseService.isConfigured()) {
      logger.warn('Supabase no configurado, realtime deshabilitado', 'RealtimeSync');
      return false;
    }

    if (this.isConnected && this.channels.has(channel)) {
      logger.info(`Ya conectado al canal: ${channel}`, 'RealtimeSync');
      return true;
    }

    try {
      const supabase = supabaseService.getClient();
      if (!supabase) return false;

      const tableMap: Record<RealtimeChannel, string> = {
        products: 'products',
        synergy: 'synergy_analyses',
        chat: 'chat_messages'
      };

      const tableName = tableMap[channel];

      // Crear canal de realtime
      const channelObj = supabase.channel(`${channel}_${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: tableName
          },
          (payload) => this.handleRealtimeEvent(channel, payload)
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            logger.success(`Conectado a realtime: ${channel}`, 'RealtimeSync');
            this.notifyStatusChange();
          } else if (status === 'CHANNEL_ERROR') {
            logger.error(`Error en canal realtime: ${channel}`, 'RealtimeSync');
            this.handleDisconnect(channel);
          } else if (status === 'CLOSED') {
            logger.info(`Canal cerrado: ${channel}`, 'RealtimeSync');
            this.isConnected = false;
            this.notifyStatusChange();
          }
        });

      this.channels.set(channel, channelObj);
      return true;
    } catch (error) {
      logger.error(`Error conectando a realtime: ${channel}`, 'RealtimeSync', error);
      this.handleDisconnect(channel);
      return false;
    }
  }

  /**
   * Desconectar de un canal
   */
  async disconnect(channel?: RealtimeChannel): Promise<void> {
    if (channel) {
      const channelObj = this.channels.get(channel);
      if (channelObj) {
        await supabaseService.getClient()?.removeChannel(channelObj);
        this.channels.delete(channel);
        logger.info(`Desconectado de: ${channel}`, 'RealtimeSync');
      }
    } else {
      // Desconectar todos
      for (const [ch, channelObj] of this.channels) {
        await supabaseService.getClient()?.removeChannel(channelObj);
        logger.info(`Desconectado de: ${ch}`, 'RealtimeSync');
      }
      this.channels.clear();
    }
    this.isConnected = this.channels.size > 0;
    this.notifyStatusChange();
  }

  /**
   * Manejar evento de realtime
   */
  private handleRealtimeEvent(channel: RealtimeChannel, payload: any): void {
    this.lastEvent = new Date();
    this.pendingChanges++;

    const event: RealtimeEvent = {
      type: payload.eventType?.toUpperCase() || 'UPDATE',
      table: payload.table || channel,
      record: payload.new || payload.record,
      old_record: payload.old || payload.old_record
    };

    logger.info(`Realtime event: ${event.type} en ${event.table}`, 'RealtimeSync');

    // Notificar listeners específicos
    const channelListeners = this.listeners.get(channel) || [];
    channelListeners.forEach(cb => cb(event));

    // Notificar listeners globales
    const globalListeners = this.listeners.get('*') || [];
    globalListeners.forEach(cb => cb(event));

    // Acciones específicas por canal
    switch (channel) {
      case 'products':
        this.handleProductEvent(event);
        break;
      case 'synergy':
        this.handleSynergyEvent(event);
        break;
    }

    this.pendingChanges--;
    this.notifyStatusChange();
    EventBus.emit(EventType.DB_UPDATED, { source: 'realtime', event });
  }

  /**
   * Manejar evento de producto
   */
  private handleProductEvent(event: RealtimeEvent): void {
    switch (event.type) {
      case 'INSERT':
        logger.info(`Nuevo producto en la nube: ${event.record?.sku}`, 'RealtimeSync');
        EventBus.emit(EventType.PRODUCT_ADDED, event.record);
        break;
      case 'UPDATE':
        logger.info(`Producto actualizado en la nube: ${event.record?.sku}`, 'RealtimeSync');
        EventBus.emit(EventType.PRODUCT_UPDATED, event.record);
        break;
      case 'DELETE':
        logger.info(`Producto eliminado en la nube: ${event.old_record?.sku}`, 'RealtimeSync');
        EventBus.emit(EventType.PRODUCT_DELETED, { sku: event.old_record?.sku });
        break;
    }
  }

  /**
   * Manejar evento de sinergia
   */
  private handleSynergyEvent(event: RealtimeEvent): void {
    if (event.type === 'UPDATE' || event.type === 'INSERT') {
      EventBus.emit(EventType.SYNERGY_STATUS_CHANGED, {
        message: 'Análisis de sinergia actualizado',
        record: event.record
      });
    }
  }

  /**
   * Suscribirse a eventos de un canal
   */
  onEvent(channel: RealtimeChannel | '*', callback: (event: RealtimeEvent) => void): () => void {
    const key = channel;
    const listeners = this.listeners.get(key) || [];
    listeners.push(callback);
    this.listeners.set(key, listeners);

    return () => {
      const currentListeners = this.listeners.get(key) || [];
      const filtered = currentListeners.filter(cb => cb !== callback);
      this.listeners.set(key, filtered);
    };
  }

  /**
   * Suscribirse a cambios de estado
   */
  onStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.statusCallbacks.push(callback);
    // Notificar estado actual inmediatamente
    callback(this.getStatus());

    return () => {
      this.statusCallbacks = this.statusCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Obtener estado actual
   */
  getStatus(): SyncStatus {
    return {
      connected: this.isConnected,
      lastEvent: this.lastEvent,
      pendingChanges: this.pendingChanges,
      channel: this.channels.keys().next().value || null
    };
  }

  /**
   * Notificar cambio de estado
   */
  private notifyStatusChange(): void {
    const status = this.getStatus();
    this.statusCallbacks.forEach(cb => cb(status));
  }

  /**
   * Manejar desconexión
   */
  private async handleDisconnect(channel: RealtimeChannel): Promise<void> {
    this.isConnected = false;
    this.notifyStatusChange();

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      logger.info(`Reconectando en ${delay}ms (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})`, 'RealtimeSync');
      
      setTimeout(() => {
        this.connect(channel);
      }, delay);
    } else {
      logger.warn('Máximo de intentos de reconexión alcanzado', 'RealtimeSync');
    }
  }

  /**
   * Verificar si está conectado
   */
  isOnline(): boolean {
    return this.isConnected;
  }

  /**
   * Forzar reconexión
   */
  async reconnect(channel?: RealtimeChannel): Promise<void> {
    this.reconnectAttempts = 0;
    if (channel) {
      await this.disconnect(channel);
      await this.connect(channel);
    } else {
      const channels = Array.from(this.channels.keys());
      await this.disconnect();
      for (const ch of channels) {
        await this.connect(ch);
      }
    }
  }
}

export const realtimeSyncService = RealtimeSyncService.getInstance();
