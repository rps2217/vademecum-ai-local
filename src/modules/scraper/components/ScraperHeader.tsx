import React from 'react';
import { Database } from 'lucide-react';

export const ScraperHeader: React.FC = () => {
  return (
    <header className="space-y-2">
      <div className="inline-flex items-center gap-3">
        <div className="p-2 bg-emerald-500/10 rounded-xl">
          <Database className="w-6 h-6 text-emerald-400" />
        </div>
        <h1 className="text-3xl font-bold text-white">Scraper de Farmacias</h1>
      </div>
      <p className="text-slate-400 text-lg">
        Extrae datos de farmacias y guárdalos directamente en tu base de datos local.
      </p>
    </header>
  );
};
