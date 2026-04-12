import React from 'react';
import { ShieldCheck, CheckCircle2, Heart, Droplets, Baby, Activity, ShieldCheck as ShieldIcon, Wheat } from 'lucide-react';
import { SafetyCondition } from '../../../hooks/useProductSearch';

interface SafetyFiltersProps {
  conditionFilters: SafetyCondition[];
  setConditionFilters: React.Dispatch<React.SetStateAction<SafetyCondition[]>>;
}

export const SafetyFilters: React.FC<SafetyFiltersProps> = ({ conditionFilters, setConditionFilters }) => {
  const toggleConditionFilter = (condition: SafetyCondition) => {
    setConditionFilters(prev => 
      prev.includes(condition) 
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    );
  };

  const safetyItems: { id: SafetyCondition, label: string, icon: React.ReactNode }[] = [
    { id: 'apto_embarazo', label: 'Embarazo', icon: <Heart className="w-4 h-4" /> },
    { id: 'apto_lactancia', label: 'Lactancia', icon: <Droplets className="w-4 h-4" /> },
    { id: 'apto_pediatria', label: 'Pediatría', icon: <Baby className="w-4 h-4" /> },
    { id: 'apto_diabeticos', label: 'Diabéticos', icon: <Activity className="w-4 h-4" /> },
    { id: 'apto_hipertensos', label: 'Hipertensos', icon: <ShieldIcon className="w-4 h-4" /> },
    { id: 'apto_celiacos', label: 'Celíacos', icon: <Wheat className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 py-2 px-3 bg-brand-surface/50 rounded-2xl border border-slate-800/50 shadow-sm">
      <ShieldCheck className="w-4 h-4 text-slate-500 ml-1 hidden sm:block" />
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1 hidden sm:block">Solo Aptos Para:</span>
      
      <div className="flex flex-wrap items-center gap-2 flex-1">
        {safetyItems.map((item) => {
          const isActive = conditionFilters.includes(item.id);
          return (
            <button
              key={item.id}
              onClick={() => toggleConditionFilter(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                isActive 
                  ? 'bg-brand-accent/20 text-brand-accent border-brand-accent/50 shadow-[0_0_10px_rgba(110,231,183,0.1)]' 
                  : 'bg-brand-bg/50 text-slate-400 border-slate-800 hover:border-brand-accent/30 hover:text-brand-accent/70'
              }`}
            >
              {isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : item.icon}
              {item.label}
            </button>
          );
        })}
      </div>
      
      {conditionFilters.length > 0 && (
        <button
          onClick={() => setConditionFilters([])}
          className="text-[10px] text-slate-500 hover:text-slate-300 underline underline-offset-4 transition-colors px-2 whitespace-nowrap"
        >
          Limpiar
        </button>
      )}
    </div>
  );
};
