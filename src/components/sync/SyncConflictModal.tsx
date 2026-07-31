/**
 * SyncConflictModal
 * 
 * Modal para resolver conflictos de sincronización.
 * Muestra diferencias entre versión local y remota y permite al usuario
 * elegir qué versión mantener o fusionar.
 */

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { ConflictResolver } from '@/core/sync';
import type { DbConflict } from '@/db/schema';
import { logger } from '@/lib/logger';

interface SyncConflictModalProps {
  conflict: DbConflict;
  onResolved: () => void;
  onClose: () => void;
}

export function SyncConflictModal({ conflict, onResolved, onClose }: SyncConflictModalProps) {
  const [isResolving, setIsResolving] = useState(false);
  const [resolution, setResolution] = useState<'local' | 'remote' | 'merged'>('local');
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
    <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
      <h4 className="font-medium mb-2">{title}</h4>
      <div className="space-y-1 text-sm">
        {Object.entries(version).slice(0, 10).map(([key, value]) => (
          <div key={key} className="flex gap-2">
            <span className="font-mono text-gray-600 dark:text-gray-400">{key}:</span>
            <span className="truncate">
              {typeof value === 'object' 
                ? JSON.stringify(value).slice(0, 50) + '...' 
                : String(value)}
            </span>
          </div>
        ))}
        {Object.keys(version).length > 10 && (
          <div className="text-gray-500">...y {Object.keys(version).length - 10} campos más</div>
        )}
      </div>
      <div className="mt-2 text-xs text-gray-500">
        Lamport: {conflict.localLamport} | Detectado: {new Date(conflict.detectedAt).toLocaleString()}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">⚠️ Conflicto de Sincronización</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Se detectaron cambios conflictivos en {conflict.table} / {conflict.recordId}
          </p>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Local version */}
          {renderVersion('📱 Versión Local', conflict.localVersion)}

          {/* Remote version */}
          {renderVersion('☁️ Versión Remota', conflict.remoteVersion)}

          {/* Resolution options */}
          <div className="space-y-2">
            <h4 className="font-medium">Elegir resolución:</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                <input
                  type="radio"
                  name="resolution"
                  value="local"
                  checked={resolution === 'local'}
                  onChange={(e) => setResolution(e.target.value as 'local')}
                />
                <div>
                  <div className="font-medium">Mantener versión local</div>
                  <div className="text-sm text-gray-500">Descartar cambios remotos</div>
                </div>
              </label>

              <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                <input
                  type="radio"
                  name="resolution"
                  value="remote"
                  checked={resolution === 'remote'}
                  onChange={(e) => setResolution(e.target.value as 'remote')}
                />
                <div>
                  <div className="font-medium">Mantener versión remota</div>
                  <div className="text-sm text-gray-500">Sobrescribir con datos de la nube</div>
                </div>
              </label>

              <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                <input
                  type="radio"
                  name="resolution"
                  value="merged"
                  checked={resolution === 'merged'}
                  onChange={(e) => setResolution(e.target.value as 'merged')}
                />
                <div>
                  <div className="font-medium">Fusionar cambios</div>
                  <div className="text-sm text-gray-500">Combinar ambas versiones (experimental)</div>
                </div>
              </label>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isResolving}
          >
            Cancelar
          </button>
          <button
            onClick={handleResolve}
            disabled={isResolving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isResolving ? 'Resolviendo...' : 'Resolver Conflicto'}
          </button>
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
      <div className="text-center py-8 text-gray-500">
        <span className="text-4xl mb-2 block">✓</span>
        <p>No hay conflictos pendientes</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">
          ⚠️ {conflicts.length} conflicto{conflicts.length !== 1 ? 's' : ''} pendiente{conflicts.length !== 1 ? 's' : ''}
        </h3>
      </div>

      <div className="space-y-2">
        {conflicts.map((conflict) => (
          <div
            key={conflict.id}
            className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
            onClick={() => setSelectedConflict(conflict)}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">{conflict.table}</span>
                <span className="text-gray-500 ml-2">{conflict.recordId.slice(0, 8)}...</span>
              </div>
              <span className="text-sm text-gray-500">
                {new Date(conflict.detectedAt).toLocaleString()}
              </span>
            </div>
          </div>
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
