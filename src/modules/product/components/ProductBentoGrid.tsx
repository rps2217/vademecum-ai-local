import React from 'react';
import { Info, Cpu, CheckCircle2, AlertTriangle, ShieldCheck, Stethoscope } from 'lucide-react';
import { Product } from '../../../core/types/product.types';
import { ProductSafetyProfile } from './ProductSafetyProfile';
import { HighlightText } from '../../../components/ui/HighlightText';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface ProductBentoGridProps {
  product: Product;
  searchTerm?: string;
}

export const ProductBentoGrid: React.FC<ProductBentoGridProps> = ({ product, searchTerm = '' }) => {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      
      {/* Sección 1: Definición Clínica */}
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Info className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Resumen Descriptivo</span>
          </div>
          <div className="text-2xl font-medium leading-relaxed text-foreground/90">
            <HighlightText text={product.descripcion} searchTerm={searchTerm} />
          </div>
        </div>

        <div className="bg-muted/30 p-8 rounded-2xl space-y-4 flex flex-col justify-center border-l-4 border-primary">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Stethoscope className="h-6 w-6 text-emerald-600" />
            <span className="text-sm font-bold uppercase tracking-widest text-emerald-600">Posología Base</span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            <HighlightText text={product.posologia} searchTerm={searchTerm} />
          </div>
        </div>
      </div>

      <Separator className="my-8" />

      {/* Sección 2: Farmacodinámica e Indicaciones */}
      <div className="grid md:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
            <span className="text-sm font-bold uppercase tracking-widest">Indicaciones Clínicas</span>
          </div>
          <ul className="grid grid-cols-1 gap-4">
            {(Array.isArray(product.indicaciones) ? product.indicaciones : []).map((ind, i) => {
              if (!ind) return null;
              const text = typeof ind === 'object' ? ((ind as any).nombre || (ind as any).tipo || (ind as any).indicacion || JSON.stringify(ind)) : String(ind);
              return (
                <li key={i} className="flex items-center gap-4 group bg-accent/20 p-4 rounded-xl border border-border">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                    <HighlightText text={text} searchTerm={searchTerm} />
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="bg-background p-8 rounded-3xl border border-dashed space-y-6">
          <div className="flex items-center gap-2 text-primary">
            <Cpu className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Mecanismo de Acción IA</span>
          </div>
          <div className="text-xs font-mono leading-relaxed text-muted-foreground bg-card p-6 rounded-lg border border-border">
            <HighlightText text={product.analisis_componentes || 'Análisis no disponible'} searchTerm={searchTerm} />
          </div>
        </div>
      </div>

      {/* Sección 3: Seguridad y Contraindicaciones */}
      <div className="grid md:grid-cols-2 gap-8">
         <div className="alert-critical p-8 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-6 w-6" />
              <span className="text-sm font-bold uppercase tracking-widest">Advertencias y Contraindicaciones</span>
            </div>
            <div className="text-lg font-bold leading-relaxed text-red-900 italic">
              <HighlightText text={product.advertencias} searchTerm={searchTerm} />
            </div>
          </div>

          <ProductSafetyProfile product={product} />
      </div>
    </div>
  );
};
