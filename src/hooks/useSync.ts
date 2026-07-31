/**
 * Hook para estado de sincronización
 */

import { useState, useEffect, useCallback } from 'react';
import { syncService, type SyncStatus } from '@/core/sync';
import { isSupabaseConfigured } from '@/lib/supabase';

type SyncState = 'idle' | 'syncing' | 'error' | 'offline';

interface SyncProgress {
  state: SyncState;
  direction: 'upload' | 'download' | 'bidirectional';
  total: number;
  completed: number;
  errors: string[];
  lastSyncAt: number | null;
}

export interface UseSyncResult {
  isOnline: boolean;
  isConfigured: boolean;
  syncState: SyncState;
  progress: SyncProgress;
  sync: () => Promise<SyncProgress>;
  lastSyncAt: number | null;
  errorCount: number;
}

export function useSync(): UseSyncResult {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const isConfigured = isSupabaseConfigured();

  useEffect(() => {
    // Suscribirse a cambios del SyncService
    const unsubscribe = syncService.subscribe(setStatus);
    return unsubscribe;
  }, []);

  const sync = useCallback(async () => {
    const result = await syncService.forceSync();
    // Refresh status after sync
    const newStatus = await syncService.getStatus();
    setStatus(newStatus);
    
    const progress: SyncProgress = {
      state: result.success ? 'idle' : 'error',
      direction: 'bidirectional',
      total: result.uploaded + result.downloaded,
      completed: result.uploaded + result.downloaded,
      errors: result.error ? [result.error] : [],
      lastSyncAt: newStatus.lastSyncAt,
    };
    return progress;
  }, []);

  const isOnline = status?.isOnline ?? (typeof navigator !== 'undefined' ? navigator.onLine : true);
  const syncState: SyncState = status?.isSyncing ? 'syncing' : 
    (status?.error ? 'error' : 
    (!isOnline ? 'offline' : 'idle'));

  const progress: SyncProgress = {
    state: syncState,
    direction: 'bidirectional',
    total: status?.pendingOps ?? 0,
    completed: 0,
    errors: status?.error ? [status.error] : [],
    lastSyncAt: status?.lastSyncAt ?? null,
  };

  return {
    isOnline,
    isConfigured,
    syncState,
    progress,
    sync,
    lastSyncAt: status?.lastSyncAt ?? null,
    errorCount: status?.error ? 1 : 0,
  };
}
