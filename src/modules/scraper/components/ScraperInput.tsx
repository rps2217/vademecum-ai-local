import React from 'react';
import { Link, Search, Loader2 } from 'lucide-react';

interface ScraperInputProps {
  url: string;
  setUrl: (url: string) => void;
  isFetching: boolean;
  onFetch: () => void;
}

export const ScraperInput: React.FC<ScraperInputProps> = ({ url, setUrl, isFetching, onFetch }) => {
  return (
    <div className="bg-brand-surface border border-slate-800 rounded-3xl p-6 md:p-8 mb-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-brand-primary/10 rounded-xl">
          <Link className="w-5 h-5 text-brand-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Importar desde URL</h2>
          <p className="text-sm text-slate-500">Pega el link de la ficha del producto para extraer su información con IA.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-500" />
          </div>
          <input
            type="url"
            className="block w-full pl-12 pr-4 py-4 bg-brand-bg border border-slate-800 rounded-2xl text-white focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all placeholder:text-slate-600"
            placeholder="https://www.ejemplo.com/producto-farmaceutico"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <button
          onClick={onFetch}
          disabled={isFetching || !url}
          className="px-8 py-4 bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-50 text-brand-bg font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20 min-w-[160px]"
        >
          {isFetching ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Extrayendo...</span>
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              <span>Analizar URL</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
