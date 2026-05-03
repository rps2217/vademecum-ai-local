import React from 'react';
import { Beaker, Search, ExternalLink, Hash } from 'lucide-react';

interface PrincipleData {
  name: string;
  count: number;
}

interface ActivePrinciplesTableProps {
  principles: PrincipleData[];
  isLoading: boolean;
  onSelect: (name: string) => void;
}

export const ActivePrinciplesTable: React.FC<ActivePrinciplesTableProps> = ({ 
  principles, 
  isLoading, 
  onSelect 
}) => {
  return (
    <div className="w-full overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Header */}
          <div className="flex bg-slate-900 text-slate-400 border-b border-slate-700 font-bold text-sm h-12">
            <div className="flex-1 px-6 flex items-center uppercase tracking-wider text-[10px]">Principio Activo</div>
            <div className="w-[150px] px-6 flex items-center justify-center uppercase tracking-wider text-[10px]">Productos</div>
            <div className="w-[150px] px-6 flex items-center justify-end uppercase tracking-wider text-[10px]">Acciones</div>
          </div>

          {/* Body */}
          {isLoading ? (
            <div className="h-[400px] flex items-center justify-center text-slate-500 border-b border-slate-800 italic">
              Cargando principios...
            </div>
          ) : principles.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center text-slate-500 border-b border-slate-800">
              No hay registros.
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {principles.map((p) => (
                <div 
                  key={p.name} 
                  className="flex border-b border-slate-800 hover:bg-slate-800/20 transition-colors bg-brand-surface group"
                >
                  <div className="flex-1 px-6 py-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                      <Beaker className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-white font-sans tracking-tight">
                      {p.name}
                    </span>
                  </div>
                  
                  <div className="w-[150px] px-6 flex items-center justify-center">
                    <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 rounded-full text-xs font-mono ring-1 ring-slate-700">
                      {p.count}
                    </span>
                  </div>

                  <div className="w-[150px] px-6 flex items-center justify-end gap-2">
                    <button 
                      onClick={() => onSelect(p.name)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/10 text-brand-primary rounded-lg text-xs font-bold hover:bg-brand-primary/20 transition-colors"
                    >
                      <Search className="w-3.5 h-3.5" />
                      Explorar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
