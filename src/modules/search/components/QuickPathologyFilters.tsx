import React from 'react';
import { Stethoscope, Wind, Brain, Activity, Apple, Heart, Sparkles, Droplets } from 'lucide-react';
import { PATHOLOGY_CATEGORIES } from '../../../constants/pathologies';

interface QuickPathologyFiltersProps {
  onTagClick: (tag: string) => void;
  currentQuery: string;
}

const iconMap: Record<string, React.ReactNode> = {
  Wind: <Wind className="w-5 h-5" />,
  Brain: <Brain className="w-5 h-5" />,
  Activity: <Activity className="w-5 h-5" />,
  Apple: <Apple className="w-5 h-5" />,
  Heart: <Heart className="w-5 h-5" />,
  Sparkles: <Sparkles className="w-5 h-5" />,
  Droplets: <Droplets className="w-5 h-5" />
};

export const QuickPathologyFilters: React.FC<QuickPathologyFiltersProps> = ({ onTagClick, currentQuery }) => {
  return (
    <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-2 mb-6 text-slate-400 px-1">
        <Stethoscope className="w-5 h-5 text-brand-primary" />
        <h4 className="text-xs font-bold uppercase tracking-widest">Búsqueda Rápida por Categoría Clínica</h4>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {PATHOLOGY_CATEGORIES.map((category) => {
          return (
            <div 
              key={category.id} 
              className="bg-brand-surface border border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-lg transition-all flex flex-col h-full relative overflow-hidden group"
            >
              {/* Fondo decorativo sutil */}
              <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 transition-opacity group-hover:opacity-40 ${category.bgColor}`} />
              
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className={`p-2 rounded-xl ${category.bgColor} ${category.color} border ${category.borderColor}`}>
                  {iconMap[category.icon]}
                </div>
                <h5 className="font-bold text-white text-sm tracking-wide">{category.title}</h5>
              </div>
              
              <div className="flex flex-wrap gap-2 relative z-10 mt-auto">
                {category.tags.map((pathology) => {
                  const isActive = currentQuery.toLowerCase() === pathology.toLowerCase();
                  return (
                    <button
                      key={pathology}
                      onClick={() => onTagClick(pathology)}
                      className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm transition-all text-left border ${
                        isActive 
                          ? `${category.bgColor} ${category.color} ${category.borderColor} shadow-md font-bold` 
                          : 'bg-brand-bg/50 text-slate-400 border-slate-800 hover:border-slate-600 hover:text-slate-200 hover:bg-brand-bg'
                      }`}
                    >
                      {pathology}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
