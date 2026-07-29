/**
 * SyncStatusBar
 * Componente que muestra el estado de sincronización
 */

import { useSync } from '@/hooks/useSync';
import { Badge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { Cloud, CloudOff, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SyncStatusBarProps {
  className?: string;
  showDetails?: boolean;
}

export function SyncStatusBar({ className, showDetails = false }: SyncStatusBarProps) {
  const { isOnline, isConfigured, syncState, progress, sync, lastSyncAt, errorCount } = useSync();

  const isSyncing = syncState === 'syncing';

  if (!isConfigured) {
    return (
      <div className={cn('flex items-center gap-2 text-amber-600', className)}>
        <CloudOff className="w-4 h-4" />
        <span className="text-sm">Sync no configurado</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Indicador de estado de red */}
      <Badge variant={isOnline ? 'success' : 'danger'}>
        {isOnline ? (
          <>
            <Cloud className="w-3 h-3 mr-1" />
            Online
          </>
        ) : (
          <>
            <CloudOff className="w-3 h-3 mr-1" />
            Offline
          </>
        )}
      </Badge>

      {/* Progreso de sync */}
      {isSyncing && (
        <span className="text-sm text-muted-foreground">
          Sync {progress.completed}/{progress.total}
        </span>
      )}

      {/* Indicador de sync */}
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
        onClick={sync}
        disabled={isSyncing || !isOnline}
        className="gap-1"
      >
        {isSyncing ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <RefreshCw className={cn('w-3 h-3', isSyncing && 'animate-spin')} />
        )}
        <span className="hidden sm:inline">{isSyncing ? 'Sync' : 'Sync'}</span>
      </Button>
    </div>
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
