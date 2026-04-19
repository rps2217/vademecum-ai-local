import React, { useState } from 'react';
import { X, Play, Square, Loader2, Globe, DatabaseZap, ListPlus } from 'lucide-react';
import { useBatchScraper } from '../../hooks/useBatchScraper';

interface ScraperModalProps {
  onClose: () => void;
  onComplete: () => void;
}

export const ScraperModal: React.FC<ScraperModalProps> = ({ onClose, onComplete }) => {
  const {
    targetUrl,
    setTargetUrl,
    logs,
    isRunning,
    startScraping,
    stopScraping,
    logsEndRef
  } = useBatchScraper();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-3xl bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-primary/10 rounded-xl">
                <DatabaseZap className="w-6 h-6 text-brand-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Scraper de Farmacias</h2>
                <p className="text-sm text-slate-400">Extrae Vademécums enteros desde una URL</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-3">
            <div className="relative flex-1">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="url"
                placeholder="https://farmacia-ejemplo.com/categoria/medicamentos..."
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                disabled={isRunning}
                className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-brand-primary outline-none transition-all disabled:opacity-50"
              />
            </div>
            {!isRunning ? (
              <button
                onClick={startScraping}
                disabled={!targetUrl}
                className="px-6 py-3 bg-brand-primary hover:bg-orange-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Play className="w-5 h-5" /> Iniciar 
              </button>
            ) : (
              <button
                onClick={stopScraping}
                className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold transition-all flex items-center gap-2"
              >
                <Square className="w-5 h-5" /> Detener
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 bg-black p-4 font-mono text-xs overflow-y-auto custom-scrollbar">
          {logs.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
               <ListPlus className="w-12 h-12 mb-4" />
               <p>Ingresa una URL de catálogo para comenzar la extracción masiva.</p>
               <p className="mt-2 text-center max-w-sm">La inteligencia artificial procesará el HTML y extraerá posologías, advertencias y principios activos automáticamente.</p>
             </div>
          ) : (
            <div className="space-y-1">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-4">
                  <span className="text-slate-600 shrink-0">[{log.time}]</span>
                  <span className={
                    log.type === 'error' ? 'text-rose-500' :
                    log.type === 'success' ? 'text-emerald-400' :
                    'text-cyan-400'
                  }>
                    {log.type === 'info' && <Loader2 className="inline w-3 h-3 animate-spin mr-2" />}
                    {log.text}
                  </span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
