import React from 'react';
import { CheckCircle2, AlertTriangle, ExternalLink, Database } from 'lucide-react';
import { Product } from '../../../core/types/product.types';

interface ScraperResultsProps {
  results: { product: Product | null; error: string | null; url: string }[];
}

export const ScraperResults: React.FC<ScraperResultsProps> = ({ results }) => {
  if (results.length === 0) return null;

  return (
    <div className="bg-brand-surface border border-slate-800 rounded-3xl overflow-hidden shadow-sm animate-in fade-in duration-700">
      <div className="p-6 border-b border-slate-800 bg-brand-surface/50">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-brand-primary" />
          Resultados del Procesamiento
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-brand-bg/50">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Producto</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">SKU</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">URL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {results.map((res, idx) => (
              <tr key={idx} className="hover:bg-brand-bg/30 transition-colors group">
                <td className="px-6 py-4">
                  {res.product ? (
                    <div className="flex items-center gap-2 text-brand-accent">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-tight">Éxito</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-tight">Error</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="max-w-[200px]">
                    <p className="text-sm font-bold text-white truncate">
                      {res.product?.nombre_comercial || '---'}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {res.product?.principios_activos.join(', ') || res.error}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs font-mono text-slate-400">
                    {res.product?.sku || '---'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <a 
                    href={res.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-brand-primary hover:underline group-hover:translate-x-0.5 transition-transform"
                  >
                    Ver fuente <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
