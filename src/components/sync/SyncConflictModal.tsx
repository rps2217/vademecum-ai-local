/**
 * SyncConflictModal
 * 
 * Modal para resolver conflictos de sincronización.
 * Muestra diferencias entre versión local y remota y permite al usuario
 * elegir qué versión mantener o fusionar.
 */

import { useState, useId } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ConflictResolver } from '@/core/sync';
import type { DbConflict } from '@/db/schema';
import { logger } from '@/lib/logger';
import { Button } from '@/ui/Button';
import { Check } from 'lucide-react';

interface SyncConflictModalProps {
  conflict: DbConflict;
  onResolved: () => void;
  onClose: () => void;
}

export function SyncConflictModal({ conflict, onResolved, onClose }: SyncConflictModalProps) {
  const [isResolving, setIsResolving] = useState(false);
  const [resolution, setResolution] = useState<'local' | 'remote' | 'merged'>('local');
  const radioLocal = useId();
  const radioRemote = useId();
  const radioMerged = useId();
  const [error, setError] = useState<string | null>(null);

  const handleResolve = async () => {
    setIsResolving(true);
    setError(null);

    try {
      const result = await ConflictResolver.resolveConflict(
        conflict.id,
        resolution,
        resolution === 'merged' ? conflict.localVersion : undefined
      );

      if (result.success) {
        logger.log('[ConflictModal] Conflicto resuelto:', resolution);
        onResolved();
      } else {
        setError(result.error || 'Error desconocido');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al resolver');
    } finally {
      setIsResolving(false);
    }
  };

  const renderVersion = (title: string, version: Record<string, unknown>) => (
    <div className="border border-border rounded-lg p-4 bg-muted/50">
      <h4 className="font-medium mb-2">{title}</h4>
      <div className="space-y-1 text-sm">
        {Object.entries(version).slice(0, 10).map(([key, value]) => (
          <div key={key} className="flex gap-2">
            <span className="font-mono text-muted-foreground">{key}:</span>
            <span className="truncate">
              {typeof value === 'object' 
                ? JSON.stringify(value).slice(0, 50) + '...' 
                : String(value)}
            </span>
          </div>
        ))}
        {Object.keys(version).length > 10 && (
          <div className="text-muted-foreground">...y {Object.keys(version).length - 10} campos más</div>
        )}
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        Lamport: {conflict.localLamport} | Detectado: {new Date(conflict.detectedAt).toLocaleString()}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-label="Conflicto de sincronización">
      <div className="bg-background rounded-xl border border-border shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Conflicto de Sincronización</h2>
          <p className="text-sm text-muted-foreground">
            Se detectaron cambios conflictivos en {conflict.table} / {conflict.recordId}
          </p>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Local version */}
          {renderVersion('Versión Local', conflict.localVersion)}

          {/* Remote version */}
          {renderVersion('Versión Remota', conflict.remoteVersion)}

          {/* Resolution options */}
          <div className="space-y-2">
            <h4 className="font-medium">Elegir resolución:</h4>
            <div className="space-y-2">
              <label htmlFor={radioLocal} className="flex items-center gap-2 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted focus-within:ring-2 focus-within:ring-ring">
                <input
                  id={radioLocal}
                  type="radio"
                  name="resolution"
                  value="local"
                  checked={resolution === 'local'}
                  onChange={(e) => setResolution(e.target.value as 'local')}
                />
                <span className="font-medium">Mantener versión local <span className="block text-sm font-normal text-muted-foreground">Descartar cambios remotos</span></span>
              </label>

              <label htmlFor={radioRemote} className="flex items-center gap-2 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted focus-within:ring-2 focus-within:ring-ring">
                <input
                  id={radioRemote}
                  type="radio"
                  name="resolution"
                  value="remote"
                  checked={resolution === 'remote'}
                  onChange={(e) => setResolution(e.target.value as 'remote')}
                />
                <span className="font-medium">Mantener versión remota <span className="block text-sm font-normal text-muted-foreground">Sobrescribir con datos de la nube</span></span>
              </label>

              <label htmlFor={radioMerged} className="flex items-center gap-2 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted focus-within:ring-2 focus-within:ring-ring">
                <input
                  id={radioMerged}
                  type="radio"
                  name="resolution"
                  value="merged"
                  checked={resolution === 'merged'}
                  onChange={(e) => setResolution(e.target.value as 'merged')}
                />
                <span className="font-medium">Fusionar cambios <span className="block text-sm font-normal text-muted-foreground">Combinar ambas versiones (experimental)</span></span>
              </label>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isResolving}>
            Cancelar
          </Button>
          <Button variant="default" onClick={handleResolve} disabled={isResolving} isLoading={isResolving}>
            Resolver Conflicto
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Componente para listar conflictos pendientes
 */
export function ConflictList() {
  const conflicts = useLiveQuery(
    () => ConflictResolver.getPendingConflicts(),
    [],
    []
  );

  const [selectedConflict, setSelectedConflict] = useState<DbConflict | null>(null);

  if (conflicts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Check className="w-6 h-6 mx-auto mb-2" aria-hidden="true" />
        <p>No hay conflictos pendientes</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">
          {conflicts.length} conflicto{conflicts.length !== 1 ? 's' : ''} pendiente{conflicts.length !== 1 ? 's' : ''}
        </h3>
      </div>

      <div className="space-y-2">
        {conflicts.map((conflict) => (
          <button
            type="button"
            key={conflict.id}
            className="w-full text-left p-4 border border-border rounded-lg hover:bg-muted transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setSelectedConflict(conflict)}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">{conflict.table}</span>
                <span className="text-muted-foreground ml-2">{conflict.recordId.slice(0, 8)}...</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {new Date(conflict.detectedAt).toLocaleString()}
              </span>
            </div>
          </button>
        ))}
      </div>

      {selectedConflict && (
        <SyncConflictModal
          conflict={selectedConflict}
          onResolved={() => setSelectedConflict(null)}
          onClose={() => setSelectedConflict(null)}
        />
      )}
    </div>
  );
}
