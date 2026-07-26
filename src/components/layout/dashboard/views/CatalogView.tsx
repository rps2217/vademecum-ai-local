/**
 * CatalogView - Vista del Catálogo de Productos
 * Muestra estadísticas y gestión de la base de datos
 */

import React from 'react';
import { Leaf, RefreshCw, Cloud, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { synergyGraphService } from '../../../../core/knowledge-base/SynergyGraph';
import type { SyncStatus, KbStats } from '../../../../types';

interface CatalogViewProps {
  stats: { total: number; kbMatch: number; sinergias: number };
  kbStats: KbStats;
  syncStatus: SyncStatus;
  onSync: () => void;
}

export function CatalogView({ stats, kbStats, syncStatus, onSync }: CatalogViewProps) {
  const kbSynStats = synergyGraphService.obtenerEstadisticas();
  const isSyncing = syncStatus.status === 'syncing';
  const lastSync = syncStatus.status === 'synced' 
    ? new Date().toLocaleTimeString() 
    : null;

  return (
    <div className="space-y-6">
      {/* Estadísticas generales */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Base de Datos</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Productos" value={stats.total} />
          <StatCard label="Ingredientes KB" value={kbStats.total} color="emerald" />
          <StatCard label="Sinergias" value={kbSynStats.sinergiasTotales} color="violet" />
          <StatCard label="Antagonismos" value={kbSynStats.antagonismosTotales} color="red" />
        </div>
      </div>
      
      {/* Panel de Base de Conocimiento con Sincronización */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-gray-900">Base de Conocimiento</h3>
          </div>
          <button
            onClick={onSync}
            disabled={isSyncing}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              isSyncing 
                ? "bg-emerald-100 text-emerald-400 cursor-not-allowed" 
                : "bg-emerald-500 text-white hover:bg-emerald-600"
            )}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} />
            {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-600">{kbStats.total}</div>
            <div className="text-xs text-gray-500 mt-1">Ingredientes</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-600">{kbStats.families}</div>
            <div className="text-xs text-gray-500 mt-1">Familias</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-600">{kbStats.types}</div>
            <div className="text-xs text-gray-500 mt-1">Tipos</div>
          </div>
        </div>
        
        {lastSync && (
          <p className="text-xs text-emerald-600 mt-3 text-center">
            ✓ Sincronizado a las {lastSync}
          </p>
        )}
        
        <p className="text-xs text-gray-500 mt-2 text-center">
          Fitoterapia, homeopatía, vitaminas y minerales verificados
        </p>
        
        {syncStatus.status === 'error' && (
          <p className="text-xs text-red-500 mt-2 text-center">
            Error: {syncStatus.error}
          </p>
        )}
      </div>

      {/* Panel de Sincronización Multi-Dispositivo */}
      <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-5 border border-violet-100">
        <div className="flex items-center gap-2 mb-3">
          <Cloud className="w-5 h-5 text-violet-600" />
          <h3 className="font-semibold text-gray-900">Sincronización en la Nube</h3>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Estado:</span>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              syncStatus.status === 'synced' ? "bg-emerald-100 text-emerald-700" :
              syncStatus.status === 'syncing' ? "bg-amber-100 text-amber-700" :
              syncStatus.status === 'error' ? "bg-red-100 text-red-700" :
              "bg-gray-100 text-gray-700"
            )}>
              {syncStatus.status === 'synced' ? 'Sincronizado' :
               syncStatus.status === 'syncing' ? 'Sincronizando...' :
               syncStatus.status === 'error' ? 'Error' : 'Listo'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Dispositivos:</span>
            <span className="text-gray-900">Todos sincronizados</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Offline:</span>
            <span className="text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Disponible
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          La base de conocimiento se sincroniza automáticamente con Supabase. 
          Disponible offline en todos tus dispositivos.
        </p>
      </div>
    </div>
  );
}

// Componente auxiliar para tarjetas de estadísticas
function StatCard({ label, value, color = 'gray' }: { label: string; value: number; color?: string }) {
  const colorClasses = {
    gray: 'bg-gray-50 text-gray-900',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className={cn("rounded-xl p-4", colorClasses[color as keyof typeof colorClasses])}>
      <div className="text-2xl font-bold">{value.toLocaleString()}</div>
      <div className="text-xs opacity-70 mt-0.5">{label}</div>
    </div>
  );
}

export default CatalogView;
