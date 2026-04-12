import React from 'react';
import { Loader2 } from 'lucide-react';

export const SynergyLoading: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-500">
      <Loader2 className="w-8 h-8 animate-spin mb-4 text-brand-primary" />
      <p className="text-sm font-medium animate-pulse">Cargando sinergias...</p>
    </div>
  );
};
