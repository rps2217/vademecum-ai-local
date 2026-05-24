import React from 'react';
import { Info, Cpu, CheckCircle2, AlertTriangle, ShieldCheck, Stethoscope } from 'lucide-react';
import { Product } from '../../../core/types/product.types';
import { HighlightText } from '../../../components/ui/HighlightText';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface ProductBentoGridProps {
  product: Product;
  searchTerm?: string;
}

export const ProductBentoGrid: React.FC<ProductBentoGridProps> = ({ product, searchTerm = '' }) => {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      
      {/* Sección 1: Definición Clínica y Dosificación */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <div className="md:col-span-2 bg-gradient-to-br from-card to-muted/10 p-6 md:p-8 rounded-3xl border border-border/60 shadow-sm space-y-4 hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-2 text-[#0284c7]">
            <Info className="h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Resumen Descriptivo Clínico</span>
          </div>
          <p className="text-lg sm:text-xl font-medium leading-relaxed text-foreground/90">
            <HighlightText text={product.descripcion} searchTerm={searchTerm} />
          </p>
        </div>

        <div className="bg-sky-50/50 p-6 md:p-8 rounded-3xl space-y-4 flex flex-col justify-center border border-sky-100 hover:border-sky-200 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-2 text-sky-700">
            <Stethoscope className="h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Posología de Referencia</span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-sky-900 tracking-tight leading-tight">
            <HighlightText text={product.posologia} searchTerm={searchTerm} />
          </p>
          <span className="text-[10px] font-bold text-sky-600/80 uppercase">Dosificación sugerida por protocolo clínico</span>
        </div>
      </div>

      <Separator className="border-border/60" />

      {/* Sección 2: Farmacodinámica e Indicaciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
        <div className="space-y-4 bg-card p-6 md:p-8 rounded-3xl border border-border/60 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Indicaciones Clínicas Autorizadas</span>
          </div>
          <ul className="grid grid-cols-1 gap-3">
            {(Array.isArray(product.indicaciones) ? product.indicaciones : []).map((ind, i) => {
              if (!ind) return null;
              const text = typeof ind === 'object' ? ((ind as any).nombre || (ind as any).tipo || (ind as any).indicacion || JSON.stringify(ind)) : String(ind);
              return (
                <li key={i} className="flex items-center gap-3.5 group bg-muted/20 p-4 rounded-2xl border border-transparent hover:border-emerald-100 hover:bg-emerald-50/20 transition-all duration-300">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 shadow-sm shadow-emerald-400" />
                  <span className="text-sm font-bold text-foreground group-hover:text-amber-950 transition-colors leading-snug">
                    <HighlightText text={text} searchTerm={searchTerm} />
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="bg-card p-6 md:p-8 rounded-3xl border border-border/60 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-primary">
            <Cpu className="h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#0284c7]">Mecanismo de Acción (IA Analizado)</span>
          </div>
          <div className="text-xs font-mono leading-relaxed text-slate-700 bg-muted/30 p-5 rounded-2xl border border-border/50 max-h-[300px] overflow-y-auto">
            <HighlightText text={product.analisis_componentes || 'Análisis no disponible'} searchTerm={searchTerm} />
          </div>
        </div>
      </div>
    </div>
  );
};

