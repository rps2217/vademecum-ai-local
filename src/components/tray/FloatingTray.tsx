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
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-brand-surface rounded-full shadow-2xl border border-slate-800 p-2 flex items-center gap-4 z-40 animate-in slide-in-from-bottom-10">
        <div className="flex items-center gap-2 px-4">
          <div className="flex -space-x-2">
            {tray.map(p => (
              <div key={p.sku} className="w-8 h-8 rounded-full bg-brand-primary/20 border-2 border-brand-surface flex items-center justify-center text-[10px] font-bold text-brand-primary" title={p.nombre_comercial}>
                {p.nombre_comercial.substring(0, 2).toUpperCase()}
              </div>
            ))}
          </div>
          <span className="text-sm font-medium text-slate-200 ml-2">
            {tray.length} medicamento{tray.length > 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={() => setIsAnalysisModalOpen(true)}
          disabled={tray.length < 2}
          className="bg-brand-primary text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-brand-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          {tray.length < 2 ? 'Selecciona otro para comparar' : 'Analizar Interacciones'}
        </button>
        <button
          onClick={clearTray}
          className="p-2.5 text-slate-500 hover:text-slate-300 hover:bg-brand-bg rounded-full transition-colors mr-1"
          title="Limpiar selección"
        >
          <X className="w-4 h-4" />
        </button>
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
