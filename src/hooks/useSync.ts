/**
 * Hook para estado de sincronización
 */

import { useState, useEffect, useCallback } from 'react';
import { syncService, type SyncStatus } from '@/core/sync';
import { isSupabaseConfigured } from '@/lib/supabase';

type SyncState = 'idle' | 'syncing' | 'error' | 'offline' | 'loading';

interface SyncProgress {
  state: SyncState;
  direction: 'upload' | 'download' | 'bidirectional';
  total: number;
  completed: number;
  errors: string[];
  lastSyncAt: number | null;
  /** Número de operaciones pendientes */
  pendingOps: number;
  /** Número de conflictos pendientes */
  pendingConflicts: number;
  /** Timestamp del inicio de sync */
  syncStartedAt: number | null;
}

export interface UseSyncResult {
  isOnline: boolean;
  isConfigured: boolean;
  syncState: SyncState;
  progress: SyncProgress;
  sync: () => Promise<SyncProgress>;
  lastSyncAt: number | null;
  errorCount: number;
  /** Forzar sync ignorando el estado actual */
  forceSync: () => Promise<void>;
  /** Configurar sync */
  configure: (config: { autoSync?: boolean; syncInterval?: number }) => void;
}

export function useSync(): UseSyncResult {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [syncStartedAt, setSyncStartedAt] = useState<number | null>(null);
  const isConfigured = isSupabaseConfigured();

  useEffect(() => {
    // Suscribirse a cambios del SyncService
    const unsubscribe = syncService.subscribe((newStatus) => {
      setStatus(newStatus);
      // Detectar inicio de sync (functional update avoids stale closure / dep)
      if (newStatus.isSyncing) {
        setSyncStartedAt(prev => prev ?? Date.now());
      }
    });
    
    // Obtener estado inicial
    syncService.getStatus().then(setStatus);
    
    return unsubscribe;
  }, []);

  const sync = useCallback(async (): Promise<SyncProgress> => {
    setSyncStartedAt(Date.now());
    const result = await syncService.forceSync();
    const newStatus = await syncService.getStatus();
    setStatus(newStatus);
    
    const progress: SyncProgress = {
      state: result.success ? 'idle' : 'error',
      direction: 'bidirectional',
      total: result.uploaded + result.downloaded + result.conflicts,
      completed: result.uploaded + result.downloaded + (result.productsReplicated ?? 0),
      errors: result.error ? [result.error] : [],
      lastSyncAt: newStatus.lastSyncAt,
      pendingOps: newStatus.pendingOps,
      pendingConflicts: newStatus.pendingConflicts,
      syncStartedAt: syncStartedAt,
    };
    
    setSyncStartedAt(null);
    return progress;
  }, [syncStartedAt]);

  const forceSync = useCallback(async () => {
    await sync();
  }, [sync]);

  const configure = useCallback((config: { autoSync?: boolean; syncInterval?: number }) => {
    syncService.configure(config);
  }, []);

  const isOnline = status?.isOnline ?? (typeof navigator !== 'undefined' ? navigator.onLine : true);
  const syncState: SyncState = !isConfigured 
    ? 'loading' 
    : status?.isSyncing 
      ? 'syncing' 
      : status?.error 
        ? 'error' 
        : !isOnline 
          ? 'offline' 
          : 'idle';

  const progress: SyncProgress = {
    state: syncState,
    direction: 'bidirectional',
    total: status?.pendingOps ?? 0,
    completed: 0,
    errors: status?.error ? [status.error] : [],
    lastSyncAt: status?.lastSyncAt ?? null,
    pendingOps: status?.pendingOps ?? 0,
    pendingConflicts: status?.pendingConflicts ?? 0,
    syncStartedAt,
  };

  return {
    isOnline,
    isConfigured,
    syncState,
    progress,
    sync,
    lastSyncAt: status?.lastSyncAt ?? null,
    errorCount: status?.error ? 1 : 0,
    forceSync,
    configure,
  };
}
