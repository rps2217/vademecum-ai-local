/**
 * SecurityAlerts - Componente de alertas de seguridad
 * Muestra advertencias importantes para ingredientes y productos
 */

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, AlertCircle, Info, X, Bell, BellOff,
  ChevronDown, ChevronUp, Check, ExternalLink, RefreshCw
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useSyncStore, type SecurityAlert } from '../../core/sync/sync-store';
import { syncService } from '../../core/sync/sync-service';

export function SecurityAlertsBadge() {
  const { unreadAlertsCount, isSyncing } = useSyncStore();
  const [showPopover, setShowPopover] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowPopover(!showPopover)}
        className={cn(
          "relative p-2 rounded-xl transition-all",
          unreadAlertsCount > 0
            ? "bg-amber-100 hover:bg-amber-200 text-amber-600"
            : "bg-gray-100 hover:bg-gray-200 text-gray-500"
        )}
      >
        {isSyncing ? (
          <RefreshCw className="w-5 h-5 animate-spin" />
        ) : unreadAlertsCount > 0 ? (
          <Bell className="w-5 h-5" />
        ) : (
          <BellOff className="w-5 h-5" />
        )}
        
        {unreadAlertsCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadAlertsCount > 9 ? '9+' : unreadAlertsCount}
          </span>
        )}
      </button>

      {showPopover && (
        <SecurityAlertsPanel onClose={() => setShowPopover(false)} />
      )}
    </div>
  );
}

interface SecurityAlertsPanelProps {
  onClose: () => void;
}

export function SecurityAlertsPanel({ onClose }: SecurityAlertsPanelProps) {
  const { alerts, markAllAlertsRead, isSyncing, isOnline } = useSyncStore();

  const handleSync = async () => {
    await syncService.syncAll();
  };

  const getSeverityIcon = (severity: SecurityAlert['severity']) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'medium':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getSeverityBg = (severity: SecurityAlert['severity']) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'bg-red-50 border-red-200';
      case 'medium':
        return 'bg-amber-50 border-amber-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Alertas de Seguridad</h3>
              <p className="text-xs text-gray-500">
                {alerts.length} alerta{alerts.length !== 1 ? 's' : ''} • {isOnline ? 'En línea' : 'Sin conexión'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleSync}
              disabled={isSyncing || !isOnline}
              className={cn(
                "p-2 rounded-lg transition-colors",
                isSyncing || !isOnline
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-500 hover:bg-gray-100"
              )}
              title={isOnline ? 'Sincronizar' : 'Sin conexión'}
            >
              <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
            </button>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-500" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Sin alertas</h4>
              <p className="text-sm text-gray-500">
                No hay alertas de seguridad pendientes.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {alerts.filter(a => !a.read).length} sin leer
                </span>
                {alerts.some(a => !a.read) && (
                  <button
                    onClick={markAllAlertsRead}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Marcar todas como leídas
                  </button>
                )}
              </div>

              {alerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Sincronizado desde la nube
          </span>
          {alert.severity && (
            <span className="text-[10px] text-gray-400">
              Actualizado {formatDate(alerts[0]?.updatedAt || new Date().toISOString())}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface AlertCardProps {
  alert: SecurityAlert;
}

function AlertCard({ alert }: AlertCardProps) {
  const { markAlertRead } = useSyncStore();
  const [expanded, setExpanded] = useState(false);

  const getSeverityIcon = (severity: SecurityAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'medium':
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSeverityBg = (severity: SecurityAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'high':
        return 'bg-red-50 border-red-100';
      case 'medium':
        return 'bg-amber-50 border-amber-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div 
      className={cn(
        "rounded-xl border p-3 transition-all cursor-pointer",
        getSeverityBg(alert.severity),
        !alert.read && "ring-2 ring-offset-1 ring-amber-300"
      )}
      onClick={() => markAlertRead(alert.id)}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {getSeverityIcon(alert.severity)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className={cn(
              "font-medium text-sm",
              alert.severity === 'critical' ? 'text-red-700' : 
              alert.severity === 'high' ? 'text-red-600' : 
              alert.severity === 'medium' ? 'text-amber-700' : 'text-blue-700'
            )}>
              {alert.title}
            </h4>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="p-1 hover:bg-white/50 rounded-lg transition-colors"
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
          
          <p className={cn(
            "text-xs mt-1",
            alert.severity === 'critical' || alert.severity === 'high' 
              ? 'text-red-600/80' 
              : 'text-gray-600'
          )}>
            {alert.message}
          </p>

          {expanded && (
            <div className="mt-3 pt-3 border-t border-current/20 space-y-2">
              {alert.affectedIngredients && alert.affectedIngredients.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-gray-500">Ingredientes afectados:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {alert.affectedIngredients.map((ing, i) => (
                      <span 
                        key={i}
                        className="px-2 py-0.5 bg-white/60 rounded text-xs font-medium"
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Fuente: {alert.source}</span>
                <span>{new Date(alert.createdAt).toLocaleDateString('es-ES')}</span>
              </div>

              {alert.url && (
                <a
                  href={alert.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  Ver más información
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente para verificar alertas específicas de un producto
export function ProductAlerts({ productName }: { productName: string }) {
  const alerts = syncService.getAlertsForItem(productName);
  
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.slice(0, 3).map((alert) => (
        <div 
          key={alert.id}
          className={cn(
            "flex items-start gap-2 p-2 rounded-lg text-xs",
            alert.severity === 'critical' || alert.severity === 'high'
              ? "bg-red-50 text-red-700"
              : "bg-amber-50 text-amber-700"
          )}
        >
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{alert.message}</span>
        </div>
      ))}
    </div>
  );
}

export default SecurityAlertsBadge;
