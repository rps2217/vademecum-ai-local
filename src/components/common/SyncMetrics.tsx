import React from 'react';
import { Database, Cloud, Cpu, Activity } from 'lucide-react';
import { dataService } from '../../services/DataService';
import { cloudSyncService } from '../../services/CloudSyncService';
import { taskProcessorService } from '../../services/TaskProcessorService';
import { logger } from '../../services/LoggerService';

interface Metrics {
  localProducts: number;
  cloudProducts: number;
  pendingSync: number;
  aiProcessing: boolean;
  rateLimitStats: {
    currentRequests: number;
    maxRequests: number;
    remainingRequests: number;
  };
}

export const SyncMetrics: React.FC = () => {
  const [metrics, setMetrics] = React.useState<Metrics | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [lastUpdate, setLastUpdate] = React.useState<Date | null>(null);

  const loadMetrics = React.useCallback(async () => {
    try {
      const products = await dataService.getAllProducts();
      const localProducts = products.length;
      const cloudCount = await cloudSyncService.getCloudCount();
      const syncStats = cloudSyncService.getSyncStats();
      const aiStatus = taskProcessorService.getStatus();
      const rateLimitStats = cloudSyncService.getRateLimitStats();

      setMetrics({
        localProducts,
        cloudProducts: cloudCount,
        pendingSync: syncStats.isSyncing ? 1 : 0,
        aiProcessing: aiStatus,
        rateLimitStats
      });
      setLastUpdate(new Date());
    } catch (error) {
      logger.error('Error loading metrics', 'SyncMetrics', error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [loadMetrics]);

  if (loading) {
    return (
      <div className="animate-pulse p-4 space-y-3">
        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-4 text-slate-500 text-sm">
        No se pudieron cargar las métricas
      </div>
    );
  }

  const usagePercent = metrics.rateLimitStats.maxRequests > 0
    ? Math.round((metrics.rateLimitStats.currentRequests / metrics.rateLimitStats.maxRequests) * 100)
    : 0;

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500" />
          Métricas del Sistema
        </h3>
        <span className="text-xs text-slate-400">
          {lastUpdate && `Actualizado ${lastUpdate.toLocaleTimeString()}`}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Local Products */}
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <Database className="w-3 h-3" />
            Productos Locales
          </div>
          <div className="text-2xl font-bold text-slate-800">
            {metrics.localProducts.toLocaleString()}
          </div>
        </div>

        {/* Cloud Products */}
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <Cloud className="w-3 h-3" />
            Productos en la Nube
          </div>
          <div className="text-2xl font-bold text-slate-800">
            {metrics.cloudProducts.toLocaleString()}
          </div>
        </div>

        {/* AI Status */}
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <Cpu className="w-3 h-3" />
            Procesamiento IA
          </div>
          <div className={`text-lg font-semibold ${metrics.aiProcessing ? 'text-emerald-500' : 'text-slate-400'}`}>
            {metrics.aiProcessing ? 'Activo' : 'Pausado'}
          </div>
        </div>

        {/* Sync Status */}
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <Cloud className="w-3 h-3" />
            Estado de Sync
          </div>
          <div className={`text-lg font-semibold ${metrics.pendingSync ? 'text-amber-500' : 'text-emerald-500'}`}>
            {metrics.pendingSync ? 'Sincronizando...' : 'Al día'}
          </div>
        </div>
      </div>

      {/* Rate Limit Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-slate-500">
          <span>Rate Limit API (Supabase)</span>
          <span>{metrics.rateLimitStats.remainingRequests}/{metrics.rateLimitStats.maxRequests} restante</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              usagePercent > 80 ? 'bg-red-500' : usagePercent > 50 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(usagePercent, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
