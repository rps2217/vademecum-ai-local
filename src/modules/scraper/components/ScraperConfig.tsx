import React from 'react';
import { Play, Square } from 'lucide-react';

interface ScraperConfigProps {
  targetUrl: string;
  setTargetUrl: (url: string) => void;
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
}

export const ScraperConfig: React.FC<ScraperConfigProps> = ({
  targetUrl,
  setTargetUrl,
  isRunning,
  onStart,
  onStop
}) => {
  return (
    <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 space-y-5">
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          URL de la Farmacia a Escanear
        </label>
        <input 
          type="url"
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
          placeholder="https://farmacia.com/categoria/analgesicos"
          className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
        />
      </div>

      {isRunning ? (
        <button 
          onClick={onStop}
          className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
        >
          <Square className="w-5 h-5" /> Detener Proceso
        </button>
      ) : (
        <button 
          onClick={onStart}
          disabled={!targetUrl}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
        >
          <Play className="w-5 h-5" /> Iniciar Scraping
        </button>
      )}
    </div>
  );
};
