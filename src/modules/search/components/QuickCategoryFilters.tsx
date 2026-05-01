import React from 'react';
import { Pill, Activity, Zap, Shield, Dna, HeartPulse } from 'lucide-react';

const CATEGORIES = [
  { id: 'anti-inflamatorio', label: 'Anti-inflamatorios', sub: 'AINEs y Esteroideos', icon: Zap, color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
  { id: 'antibiotico', label: 'Antibióticos', sub: 'Infecciones Bacterianas', icon: Dna, color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
  { id: 'analgesico', label: 'Analgésicos', sub: 'Control del Dolor', icon: HeartPulse, color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20' },
  { id: 'antiviral', label: 'Antivirales', sub: 'Terapia Antiviral', icon: Shield, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
  { id: 'suplemento', label: 'Suplementos', sub: 'Vitaminas y Minerales', icon: Pill, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
  { id: 'respiratorio', label: 'Respiratorios', sub: 'Asma y EPOC', icon: Activity, color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/20' },
];

interface QuickCategoryFiltersProps {
  onSelect: (category: string) => void;
  activeCategory?: string;
}

export const QuickCategoryFilters: React.FC<QuickCategoryFiltersProps> = ({ onSelect, activeCategory }) => {
  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-none no-scrollbar py-2">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.label)}
          className={`flex flex-col items-start gap-1 p-3 min-w-[160px] rounded-2xl transition-all border text-left group relative overflow-hidden ${
            activeCategory === cat.label
              ? `${cat.bg} ${cat.border} ring-1 ring-white/20 shadow-xl scale-[1.02]`
              : `bg-slate-900/40 border-white/5 hover:border-white/10 hover:bg-slate-900/60`
          }`}
        >
          {/* Brillo de fondo para el activo */}
          {activeCategory === cat.label && (
            <div className={`absolute -right-4 -top-4 w-12 h-12 blur-2xl opacity-40 rounded-full ${cat.bg.replace('10', '40')}`} />
          )}

          <div className="flex items-center gap-2 mb-1">
            <cat.icon className={`w-4 h-4 ${activeCategory === cat.label ? 'text-white' : cat.color}`} />
            <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${activeCategory === cat.label ? 'text-white' : 'text-slate-200'}`}>
              {cat.label}
            </span>
          </div>
          
          <span className={`text-[10px] font-medium leading-tight ${activeCategory === cat.label ? 'text-white/70' : 'text-slate-500 group-hover:text-slate-400'}`}>
            {cat.sub}
          </span>
        </button>
      ))}
    </div>
  );
};
