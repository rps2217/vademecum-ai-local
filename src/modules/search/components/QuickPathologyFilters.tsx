import React from 'react';
import { Stethoscope } from 'lucide-react';
import { COMMON_PATHOLOGIES } from '../../../constants/pathologies';

interface QuickPathologyFiltersProps {
  onTagClick: (tag: string) => void;
  currentQuery: string;
}

export const QuickPathologyFilters: React.FC<QuickPathologyFiltersProps> = ({ onTagClick, currentQuery }) => {
  return (
    <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-2 mb-4 text-slate-400 px-1">
        <Stethoscope className="w-4 h-4 text-brand-primary" />
        <h4 className="text-[10px] font-bold uppercase tracking-wider">Búsquedas Frecuentes por Patología</h4>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
        {COMMON_PATHOLOGIES.map((pathology) => {
          const isActive = currentQuery.toLowerCase() === pathology.toLowerCase();
          return (
            <button
              key={pathology}
              onClick={() => onTagClick(pathology)}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm transition-all text-left border flex items-center justify-between group ${
                isActive 
                  ? 'bg-brand-primary text-brand-bg border-brand-primary shadow-lg shadow-brand-primary/20' 
                  : 'bg-brand-surface/40 text-slate-300 border-slate-800 hover:border-brand-primary/40 hover:bg-brand-surface/60 hover:text-white'
              }`}
            >
              <span className="truncate">{pathology}</span>
              {!isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-brand-primary transition-colors ml-2 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
