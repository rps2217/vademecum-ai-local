import React, { useState } from 'react';
import { useTray } from '../../context/TrayContext';
import { Sparkles, X } from 'lucide-react';
import { PrescriptionAnalysisModal } from '../../modules/product/PrescriptionAnalysisModal';

export const FloatingTray: React.FC = () => {
  const { tray, clearTray } = useTray();
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);

  if (tray.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-24 sm:bottom-24 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 bg-brand-surface rounded-2xl sm:rounded-full shadow-2xl border border-slate-800 p-2 flex flex-col sm:flex-row items-center gap-2 sm:gap-4 z-40 animate-in slide-in-from-bottom-10">
        <div className="flex items-center justify-between w-full sm:w-auto px-2 sm:px-4">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {tray.slice(0, 4).map(p => (
                <div key={p.sku} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-primary/20 border-2 border-brand-surface flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-brand-primary" title={p.nombre_comercial}>
                  {p.nombre_comercial.substring(0, 2).toUpperCase()}
                </div>
              ))}
              {tray.length > 4 && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800 border-2 border-brand-surface flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-slate-400">
                  +{tray.length - 4}
                </div>
              )}
            </div>
            <span className="text-xs sm:text-sm font-medium text-slate-200 ml-1 sm:ml-2">
              {tray.length} <span className="hidden sm:inline">medicamento{tray.length > 1 ? 's' : ''}</span>
            </span>
          </div>
          <button
            onClick={clearTray}
            className="sm:hidden p-2 text-slate-500 hover:text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsAnalysisModalOpen(true)}
            disabled={tray.length < 2}
            className="flex-1 sm:flex-none bg-brand-primary text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold hover:bg-brand-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 h-4" />
            {tray.length < 2 ? 'Selecciona otro' : 'Analizar Interacciones'}
          </button>
          <button
            onClick={clearTray}
            className="hidden sm:block p-2.5 text-slate-500 hover:text-slate-300 hover:bg-brand-bg rounded-full transition-colors mr-1"
            title="Limpiar selección"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isAnalysisModalOpen && (
        <PrescriptionAnalysisModal
          products={tray}
          onClose={() => setIsAnalysisModalOpen(false)}
        />
      )}
    </>
  );
};
