/**
 * MetricsPanel - Panel de Métricas y Estadísticas
 * 
 * Muestra:
 * - Búsquedas totales
 * - Búsquedas de hoy
 * - Productos más consultados
 * - Tiempo promedio de respuesta
 * - Errores
 */

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Clock, AlertTriangle, Search, RefreshCw, Trash2, Download } from 'lucide-react';
import { metricsService } from '../../services/MetricsService';

export function MetricsPanel() {
  const [stats, setStats] = useState<ReturnType<typeof metricsService.getStats>>();
  const [topProducts, setTopProducts] = useState<ReturnType<typeof metricsService.getTopProducts>>([]);
  const [recentSearches, setRecentSearches] = useState<ReturnType<typeof metricsService.getRecentSearches>>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadMetrics();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = () => {
    setStats(metricsService.getStats());
    setTopProducts(metricsService.getTopProducts(10));
    setRecentSearches(metricsService.getRecentSearches(10));
  };

  const handleClear = () => {
    if (confirm('¿Limpiar todas las métricas? Esta acción no se puede deshacer.')) {
      metricsService.clearMetrics();
      loadMetrics();
    }
  };

  const handleExport = () => {
    const data = metricsService.exportMetrics();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vademecum-metrics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!stats) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div 
        className="bg-gradient-to-r from-violet-500 to-purple-600 p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-white" />
            <h2 className="text-lg font-semibold text-white">Métricas de Uso</h2>
          </div>
          <button className="text-white/80 hover:text-white">
            <svg 
              className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50">
        <StatCard
          icon={<Search className="w-5 h-5" />}
          label="Búsquedas Totales"
          value={stats.totalSearches.toLocaleString()}
          color="blue"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Hoy"
          value={stats.todaySearches.toLocaleString()}
          color="green"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Tiempo Promedio"
          value={`${stats.avgResponseTime}ms`}
          color="amber"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Errores"
          value={stats.totalErrors.toLocaleString()}
          color={stats.totalErrors > 10 ? 'red' : 'gray'}
        />
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="p-4 space-y-6 border-t">
          {/* Top Búsquedas */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Search className="w-4 h-4" />
              Búsquedas Más Populares
            </h3>
            <div className="space-y-2">
              {stats.topSearches.length > 0 ? (
                stats.topSearches.map((item, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-gray-700">{item.query}</span>
                    <span className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full text-sm font-medium">
                      {item.count}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">Sin datos aún</p>
              )}
            </div>
          </div>

          {/* Top Productos */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Productos Más Vistos
            </h3>
            <div className="space-y-2">
              {topProducts.length > 0 ? (
                topProducts.slice(0, 5).map((product, index) => (
                  <div key={product.productId} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm">#{index + 1}</span>
                      <span className="text-gray-700 truncate max-w-[200px]">{product.productName}</span>
                    </div>
                    <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-sm font-medium">
                      {product.views}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">Sin datos aún</p>
              )}
            </div>
          </div>

          {/* Búsquedas Recientes */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Búsquedas Recientes
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recentSearches.length > 0 ? (
                recentSearches.map((search, index) => (
                  <div key={index} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-gray-700 truncate max-w-[150px]">{search.query}</span>
                    <span className="text-gray-400">
                      {search.resultsCount} resultados • {search.duration}ms
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">Sin búsquedas recientes</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <button
              onClick={loadMetrics}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
            <button
              onClick={handleClear}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Limpiar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  color: 'blue' | 'green' | 'amber' | 'red' | 'gray';
}) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
    gray: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="bg-white rounded-lg p-3 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <div className={`p-1.5 rounded-lg ${colors[color]}`}>
          {icon}
        </div>
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

export default MetricsPanel;
