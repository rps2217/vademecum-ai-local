import React from 'react';
import { Pill, Activity, Zap, Shield, Dna, HeartPulse } from 'lucide-react';

const CATEGORIES = [
  { id: 'anti-inflamatorio', label: 'Anti-inflamatorios', icon: Zap, color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { id: 'antibiotico', label: 'Antibióticos', icon: Dna, color: 'text-red-400', bg: 'bg-red-400/10' },
  { id: 'analgesico', label: 'Analgésicos', icon: HeartPulse, color: 'text-rose-400', bg: 'bg-rose-400/10' },
  { id: 'antiviral', label: 'Antivirales', icon: Shield, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { id: 'suplemento', label: 'Suplementos', icon: Pill, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { id: 'respiratorio', label: 'Respiratorios', icon: Activity, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
];

interface QuickCategoryFiltersProps {
  onSelect: (category: string) => void;
  activeCategory?: string;
}

export const QuickCategoryFilters: React.FC<QuickCategoryFiltersProps> = ({ onSelect, activeCategory }) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.label)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all border ${
            activeCategory === cat.label
              ? 'bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/20 scale-105'
              : `bg-slate-900/50 border-white/5 text-slate-400 hover:text-white hover:border-white/20`
          }`}
        >
          <cat.icon className={`w-3.5 h-3.5 ${activeCategory === cat.label ? 'text-white' : cat.color}`} />
          <span className="text-xs font-bold uppercase tracking-widest">{cat.label}</span>
        </button>
      ))}
    </div>
  );
};
