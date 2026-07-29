/**
 * Hook para estado de sincronización
 */

import { useState, useEffect, useCallback } from 'react';
import { syncManager, type SyncProgress, type SyncState } from '@/data/sync/SyncManager';
import { isSupabaseConfigured } from '@/lib/supabase';

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
  const [progress, setProgress] = useState<SyncProgress>(syncManager['progress']);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const isConfigured = isSupabaseConfigured();

  useEffect(() => {
    // Suscribirse a cambios del SyncManager
    const unsubscribe = syncManager.subscribe(setProgress);

    // Listeners de red
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const sync = useCallback(async () => {
    return syncManager.sync();
  }, []);

  return {
    isOnline,
    isConfigured,
    syncState: progress.state,
    progress,
    sync,
    lastSyncAt: progress.lastSyncAt,
    errorCount: progress.errors.length,
  };
}
