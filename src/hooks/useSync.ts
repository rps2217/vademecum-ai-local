/**
 * useSync - Hook para gestión de sincronización
 * Centraliza la lógica de sincronización delta
 */

import { useState, useEffect, useCallback } from 'react';
import { knowledgeSyncService, type SyncResult, type SyncStatus } from '../services/KnowledgeSyncService';
import { deltaSyncService, type DeltaSyncStatus } from '../services/DeltaSyncService';
import { cloudSyncService } from '../services/CloudSyncService';

export interface UseSyncReturn {
  // Estado general
  isSyncing: boolean;
  lastSyncTime: Date | null;
  pendingChanges: number;
  needsSync: boolean;
  error: string | null;
  
  // Productos
  productSyncStatus: string;
  localProductCount: number;
  cloudProductCount: number;
  
  // KB
  kbSyncStatus: string;
  kbIngredientsCount: number;
  kbPendingChanges: number;
  
  // Acciones
  syncAll: () => Promise<void>;
  syncKb: () => Promise<SyncResult>;
  syncProducts: () => Promise<number>;
  forceFullSync: () => Promise<SyncResult>;
  
  // Stats
  getSyncStats: () => SyncStats;
}

export interface SyncStats {
  products: {
    local: number;
    cloud: number;
    pending: number;
  };
  kb: {
    total: number;
    lastSync: Date | null;
    pendingChanges: number;
  };
}

export function useSync(): UseSyncReturn {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [productSyncStatus, setProductSyncStatus] = useState('idle');
  const [localProductCount, setLocalProductCount] = useState(0);
  const [cloudProductCount, setCloudProductCount] = useState(0);
  const [kbSyncStatus, setKbSyncStatus] = useState('idle');
  const [kbIngredientsCount, setKbIngredientsCount] = useState(0);
  const [kbPendingChanges, setKbPendingChanges] = useState(0);

  // Cargar estado inicial
  useEffect(() => {
    loadInitialState();
  }, []);

  // Suscribir a eventos de sincronización KB
  useEffect(() => {
    const unsubscribeKb = knowledgeSyncService.addSyncListener((status: SyncStatus) => {
      if (status.status === 'syncing') {
        setKbSyncStatus('syncing');
        setIsSyncing(true);
      } else if (status.status === 'synced') {
        setKbSyncStatus('synced');
        setIsSyncing(false);
        setLastSyncTime(new Date());
      } else if (status.status === 'error') {
        setKbSyncStatus('error');
        setError(status.error || 'Error desconocido');
        setIsSyncing(false);
      }
    });

    const unsubscribeDelta = deltaSyncService.addListener((status: DeltaSyncStatus) => {
      if (status.phase === 'complete') {
        const stats = deltaSyncService.getSyncStats();
        setLastSyncTime(stats.lastSync);
        setKbPendingChanges(stats.pendingChanges);
      }
    });

    return () => {
      unsubscribeKb();
      unsubscribeDelta();
    };
  }, []);

  const loadInitialState = useCallback(async () => {
    // Cargar stats de KB
    const kbStats = knowledgeSyncService.getStats();
    setKbIngredientsCount(kbStats.total);

    const deltaStats = deltaSyncService.getSyncStats();
    setLastSyncTime(deltaStats.lastSync);
    setKbPendingChanges(deltaStats.pendingChanges);
    setNeedsSync(deltaStats.needsSync);

    // Cargar stats de productos
    try {
      const cloudCount = await cloudSyncService.getCloudCount();
      setCloudProductCount(cloudCount);
    } catch {
      // Ignorar errores de cloud
    }
  }, []);

  const setNeedsSync = useCallback((value: boolean) => {
    setPendingChanges(kbPendingChanges);
  }, [kbPendingChanges]);

  const syncKb = useCallback(async (): Promise<SyncResult> => {
    setError(null);
    const result = await knowledgeSyncService.sync();
    
    if (!result.success && result.error) {
      setError(result.error);
    }
    
    return result;
  }, []);

  const syncProducts = useCallback(async (): Promise<number> => {
    setProductSyncStatus('syncing');
    try {
      const count = await cloudSyncService.uploadLocalProducts();
      setProductSyncStatus('synced');
      return count;
    } catch (e: any) {
      setProductSyncStatus('error');
      setError(e.message);
      return 0;
    }
  }, []);

  const syncAll = useCallback(async (): Promise<void> => {
    setError(null);
    
    // Sincronizar KB y productos en paralelo
    const [kbResult, productCount] = await Promise.all([
      syncKb(),
      syncProducts()
    ]);

    if (!kbResult.success) {
      setError(kbResult.error || 'Error en sincronización KB');
    }
    
    // Recargar estado
    await loadInitialState();
  }, [syncKb, syncProducts, loadInitialState]);

  const forceFullSync = useCallback(async (): Promise<SyncResult> => {
    setError(null);
    const result = await knowledgeSyncService.fullSync();
    
    if (!result.success && result.error) {
      setError(result.error);
    }
    
    return result;
  }, []);

  const getSyncStats = useCallback((): SyncStats => {
    const deltaStats = deltaSyncService.getSyncStats();
    return {
      products: {
        local: localProductCount,
        cloud: cloudProductCount,
        pending: 0
      },
      kb: {
        total: kbIngredientsCount,
        lastSync: deltaStats.lastSync,
        pendingChanges: deltaStats.pendingChanges
      }
    };
  }, [localProductCount, cloudProductCount, kbIngredientsCount]);

  return {
    isSyncing,
    lastSyncTime,
    pendingChanges: kbPendingChanges,
    needsSync: deltaSyncService.needsSync(),
    error,
    productSyncStatus,
    localProductCount,
    cloudProductCount,
    kbSyncStatus,
    kbIngredientsCount,
    kbPendingChanges,
    syncAll,
    syncKb,
    syncProducts,
    forceFullSync,
    getSyncStats
  };
}

export default useSync;
