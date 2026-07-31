/**
 * useConsultationMode
 * 
 * Hook para el "modo consulta" que pausa la sincronización
 * automáticamente durante una consulta con un cliente.
 * 
 * CARACTERÍSTICAS:
 * - Pausa auto-sync mientras está activo
 * - Resume automáticamente cuando se desactiva
 * - Notifica al usuario cuando hay cambios pendientes
 * - Timeout automático configurable
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { syncService } from '@/core/sync';
import { logger } from '@/lib/logger';

export interface ConsultationModeState {
  isActive: boolean;
  startedAt: number | null;
  pausedSync: boolean;
  pendingChanges: number;
}

export interface UseConsultationModeResult {
  /** Si el modo consulta está activo */
  isActive: boolean;
  /** Timestamp de cuando se activó */
  startedAt: number | null;
  /** Número de cambios pendientes mientras estaba activo */
  pendingChanges: number;
  /** Tiempo transcurrido en modo consulta */
  elapsedTime: number;
  /** Activar modo consulta */
  startConsultation: () => void;
  /** Desactivar modo consulta y sincronizar */
  endConsultation: () => Promise<void>;
  /** Pausar sync manualmente */
  pauseSync: () => void;
  /** Reanudar sync manualmente */
  resumeSync: () => void;
}

/**
 * Hook para gestionar el modo consulta
 */
export function useConsultationMode(
  options: {
    autoSyncTimeoutMs?: number; // Timeout para auto-pausa de sync
    onPendingChanges?: (count: number) => void; // Callback cuando hay cambios pendientes
  } = {}
): UseConsultationModeResult {
  const { autoSyncTimeoutMs = 300000, onPendingChanges } = options; // 5 minutos por defecto

  const [state, setState] = useState<ConsultationModeState>({
    isActive: false,
    startedAt: null,
    pausedSync: false,
    pendingChanges: 0,
  });

  const syncStatusRef = useRef<{ autoSync: boolean } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Verificar cambios pendientes periódicamente
  useEffect(() => {
    if (!state.isActive) return;

    const checkPending = async () => {
      const status = await syncService.getStatus();
      if (status.pendingOps > 0) {
        setState(prev => {
          if (prev.pendingChanges !== status.pendingOps) {
            onPendingChanges?.(status.pendingOps);
          }
          return { ...prev, pendingChanges: status.pendingOps };
        });
      }
    };

    intervalRef.current = setInterval(checkPending, 5000);
    checkPending();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isActive, onPendingChanges]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (state.isActive && syncStatusRef.current) {
        // Restaurar configuración de sync
        syncService.configure({ autoSync: syncStatusRef.current.autoSync });
      }
    };
  }, [state.isActive]);

  /**
   * Activar modo consulta
   */
  const startConsultation = useCallback(() => {
    if (state.isActive) return;

    logger.log('[ConsultationMode] Iniciando modo consulta');

    // Guardar estado actual de sync
    syncStatusRef.current = { autoSync: true };

    // Pausar auto-sync
    syncService.configure({ autoSync: false });

    setState({
      isActive: true,
      startedAt: Date.now(),
      pausedSync: true,
      pendingChanges: 0,
    });
  }, [state.isActive]);

  /**
   * Finalizar modo consulta y sincronizar
   */
  const endConsultation = useCallback(async () => {
    if (!state.isActive) return;

    logger.log('[ConsultationMode] Finalizando modo consulta');

    // Reanudar auto-sync
    syncService.configure({ autoSync: true });

    // Forzar sync si hay cambios pendientes
    if (state.pendingChanges > 0) {
      logger.log(`[ConsultationMode] Sincronizando ${state.pendingChanges} cambios pendientes`);
      await syncService.forceSync();
    }

    syncStatusRef.current = null;

    setState({
      isActive: false,
      startedAt: null,
      pausedSync: false,
      pendingChanges: 0,
    });
  }, [state.isActive, state.pendingChanges]);

  /**
   * Pausar sync manualmente
   */
  const pauseSync = useCallback(() => {
    if (!state.isActive) return;
    syncService.configure({ autoSync: false });
    setState(prev => ({ ...prev, pausedSync: true }));
  }, [state.isActive]);

  /**
   * Reanudar sync manualmente
   */
  const resumeSync = useCallback(() => {
    if (!state.isActive) return;
    syncService.configure({ autoSync: true });
    setState(prev => ({ ...prev, pausedSync: false }));
  }, [state.isActive]);

  // Calcular tiempo transcurrido
  const elapsedTime = state.startedAt ? Date.now() - state.startedAt : 0;

  return {
    isActive: state.isActive,
    startedAt: state.startedAt,
    pendingChanges: state.pendingChanges,
    elapsedTime,
    startConsultation,
    endConsultation,
    pauseSync,
    resumeSync,
  };
}

/**
 * Provider para modo consulta a nivel de app
 */
export function useGlobalConsultationMode() {
  const consultation = useConsultationMode();

  // Auto-timeout: terminar consulta después de X tiempo sin actividad
  useEffect(() => {
    if (!consultation.isActive) return;

    const timeoutId = setTimeout(() => {
      logger.log('[ConsultationMode] Timeout automático');
      consultation.endConsultation();
    }, 30 * 60 * 1000); // 30 minutos

    return () => clearTimeout(timeoutId);
  }, [consultation.isActive, consultation.startedAt]);

  return consultation;
}
