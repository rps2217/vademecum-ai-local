/**
 * SyncStatusBar
 * Componente que muestra el estado de sincronización
 */

import { useState } from 'react';
import { useSync } from '@/hooks/useSync';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { Badge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { Cloud, CloudOff, RefreshCw, Loader2, AlertTriangle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ConflictList } from './SyncConflictModal';

interface SyncStatusBarProps {
  className?: string;
}

export function SyncStatusBar({ className }: SyncStatusBarProps) {
  const { isOnline, isConfigured, syncState, progress, sync, lastSyncAt, errorCount } = useSync();
  const [showConflicts, setShowConflicts] = useState(false);

  const isSyncing = syncState === 'syncing';
  const pendingConflicts = useLiveQuery(
    () => db.conflicts.where('resolution').equals('pending').count(),
    [],
    0
  );

  const handleSync = async () => {
    const loadingToast = toast.loading('Sincronizando...');
    try {
      const result = await sync();
      toast.dismiss(loadingToast);
      if (result.state === 'idle' && result.errors.length === 0) {
        toast.success(`Sincronizado: ${result.completed} registros`);
      } else if (result.errors.length > 0) {
        toast.error(result.errors[0] || 'Error en sincronización');
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  if (!isConfigured) {
    return (
      <div className={cn('flex items-center gap-2 text-amber-600', className)}>
        <CloudOff className="w-4 h-4" aria-hidden="true" />
        <span className="text-sm">Sync no configurado</span>
      </div>
    );
  }

  return (
    <>
      <div className={cn('flex items-center gap-3', className)}>
        {/* Indicador de estado de red */}
        <Badge variant={isOnline ? 'success' : 'danger'}>
          {isOnline ? (
            <>
              <Cloud className="w-3 h-3 mr-1" aria-hidden="true" />
              Online
            </>
          ) : (
            <>
              <CloudOff className="w-3 h-3 mr-1" aria-hidden="true" />
              Offline
            </>
          )}
        </Badge>

        {/* Estado de sync */}
        {isSyncing && (
          <span className="text-sm text-muted-foreground animate-pulse">
            <Loader2 className="w-3 h-3 inline mr-1 animate-spin" aria-hidden="true" />
            Sincronizando...
          </span>
        )}

        {/* Progreso de sync */}
        {!isSyncing && progress.pendingOps > 0 && (
          <Badge variant="warning">
            {progress.pendingOps} pendiente{progress.pendingOps > 1 ? 's' : ''}
          </Badge>
        )}

        {/* Conflictos pendientes */}
        {pendingConflicts > 0 && (
          <button
            onClick={() => setShowConflicts(true)}
            className="flex items-center gap-1 text-amber-600 hover:text-amber-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded active:bg-amber-50"
            aria-label={`${pendingConflicts} conflictos pendientes`}
          >
            <AlertTriangle className="w-3 h-3" aria-hidden="true" />
            <span className="text-sm font-medium">
              {pendingConflicts} conflcito{pendingConflicts > 1 ? 's' : ''}
            </span>
          </button>
        )}

        {/* Éxito */}
        {syncState === 'idle' && pendingConflicts === 0 && progress.pendingOps === 0 && (
          <span className="text-green-600 flex items-center gap-1">
            <Check className="w-3 h-3" aria-hidden="true" />
            <span className="text-sm">Sincronizado</span>
          </span>
        )}

        {/* Indicador de error */}
        {syncState === 'error' && errorCount > 0 && (
          <Badge variant="danger">
            {errorCount} error{errorCount > 1 ? 'es' : ''}
          </Badge>
        )}

        {/* Última sync */}
        {lastSyncAt && !isSyncing && (
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Hace {formatTimeAgo(lastSyncAt)}
          </span>
        )}

        {/* Botón de sync */}
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSync}
          disabled={isSyncing || !isOnline}
          isLoading={isSyncing}
          className="gap-1"
          aria-label="Sincronizar ahora"
        >
          <RefreshCw className={cn('w-3 h-3', isSyncing && 'animate-spin')} aria-hidden="true" />
          <span className="hidden sm:inline">Sync</span>
        </Button>
      </div>

      {/* Modal de conflictos */}
      {showConflicts && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-label="Resolución de conflictos">
          <div className="bg-background rounded-xl border border-border shadow-lg max-w-lg w-full mx-4 p-6">
            <h2 className="text-lg font-semibold mb-4">Resolución de Conflictos</h2>
            <ConflictList />
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setShowConflicts(false)} variant="ghost">
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Formatea tiempo relativo
 */
function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'un momento';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}
