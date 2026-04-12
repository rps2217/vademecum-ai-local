import React from 'react';
import { Clock, Link as LinkIcon } from 'lucide-react';

interface SynergyEmptyProps {
  isAnalyzing: boolean;
}

export const SynergyEmpty: React.FC<SynergyEmptyProps> = ({ isAnalyzing }) => {
  if (isAnalyzing) {
    return (
      <div className="bg-brand-surface/30 rounded-3xl p-8 border border-slate-800/50 text-center space-y-4">
        <div className="w-12 h-12 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center mx-auto">
          <Clock className="w-6 h-6 animate-pulse" />
        </div>
        <h3 className="text-lg font-bold text-slate-300">Análisis en Segundo Plano</h3>
        <p className="text-sm text-slate-500 max-w-xs mx-auto">
          La IA local está analizando este producto en segundo plano para encontrar relaciones clínicas. Vuelve en unos momentos.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/30 rounded-3xl p-8 border border-slate-800/50 text-center space-y-4">
      <div className="w-12 h-12 bg-slate-800 text-slate-600 rounded-full flex items-center justify-center mx-auto">
        <LinkIcon className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-bold text-slate-400">Sin Sinergias Directas</h3>
      <p className="text-sm text-slate-500 max-w-xs mx-auto">
        No se han encontrado productos complementarios o similares en tu base de datos local para este medicamento.
      </p>
    </div>
  );
};
