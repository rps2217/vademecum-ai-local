import React, { useEffect, useState } from 'react';
import { WebScraperManager, ScraperStatus } from '../../services/WebScraperManager';
import { RefreshCw, Database, CheckCircle, AlertTriangle } from 'lucide-react';

export const ScraperProgress: React.FC = () => {
  const [status, setStatus] = useState<ScraperStatus>('idle');
  const [processed, setProcessed] = useState(0);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    WebScraperManager.subscribe((newStatus, newProcessed, newTotal, newMessage) => {
      setStatus(newStatus);
      setProcessed(newProcessed);
      setTotal(newTotal);
      setMessage(newMessage);
    });
  }, []);

  if (status === 'idle') return null;

  const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;

  return (
    <div className="fixed bottom-6 right-6 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 w-80 animate-in slide-in-from-bottom-10 z-50">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          {status === 'done' ? (
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          ) : status === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-red-500" />
          ) : (
            <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />
          )}
          Sincronización Local
        </h4>
        <span className="text-xs font-medium text-slate-500">
          {percentage}%
        </span>
      </div>

      <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3 overflow-hidden">
        <div 
          className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="text-xs text-slate-600 line-clamp-1" title={message}>
        {message}
      </p>

      {status === 'processing_products' && (
        <p className="text-[10px] text-slate-400 mt-1">
          Procesando {processed} de {total} productos con IA Local...
        </p>
      )}
    </div>
  );
};
