import React from 'react';
import { Product } from '../../core/types/product.types';
import { ClinicalAssistant } from '../assistant/ClinicalAssistant';
import { X, Info, AlertTriangle, CheckCircle2, Tag } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { formatArrayToString } from '../../utils/formatters';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
  onTagClick?: (tag: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose, onTagClick }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl shadow-indigo-500/10 animate-in zoom-in-95 duration-200 border border-slate-800">
        
        {/* Columna Izquierda: Detalles del Producto */}
        <div className="w-full md:w-1/2 p-8 overflow-y-auto border-r border-slate-800">
          <div className="flex justify-between items-start mb-6">
            <div>
              <Badge variant="outline" className="mb-2 bg-slate-800 text-slate-400 border-slate-700">
                {product.sku}
              </Badge>
              <h2 className="text-3xl font-bold text-white tracking-tight">
                {product.nombre_comercial}
              </h2>
              <p className="text-lg text-indigo-400 font-medium mt-1">
                {formatArrayToString(product.principios_activos, ', ')}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-800 text-slate-400 transition-colors md:hidden"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Tags IA */}
            {Array.isArray(product.tags_ia) && product.tags_ia.length > 0 && (
              <section>
                <div className="flex flex-wrap gap-2">
                  {product.tags_ia.map(tag => (
                    <button
                      key={tag}
                      onClick={() => onTagClick?.(tag)}
                      className="px-3 py-1 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 rounded-lg text-xs font-medium tracking-wide border border-indigo-500/20 transition-colors flex items-center gap-1"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-500" /> Descripción
              </h3>
              <p className="text-slate-300 leading-relaxed">{product.descripcion}</p>
            </section>

            <section>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Indicaciones
              </h3>
              <ul className="list-disc list-inside text-slate-300 space-y-1">
                {(Array.isArray(product.indicaciones) ? product.indicaciones : []).map((ind, i) => {
                  const text = typeof ind === 'object' && ind !== null ? (ind.nombre || ind.tipo || ind.indicacion || JSON.stringify(ind)) : String(ind);
                  return <li key={i}>{text}</li>;
                })}
              </ul>
            </section>

            <section className="bg-amber-500/10 rounded-2xl p-5 border border-amber-500/20">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Advertencias
              </h3>
              <p className="text-amber-200 leading-relaxed text-sm">{product.advertencias}</p>
            </section>

            <section>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3">
                Posología Recomendada
              </h3>
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 text-slate-300 font-medium">
                {product.posologia}
              </div>
            </section>
          </div>
        </div>

        {/* Columna Derecha: Asistente Clínico */}
        <div className="w-full md:w-1/2 bg-slate-950/50 p-6 flex flex-col relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-800 text-slate-400 transition-colors hidden md:block z-10"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="mb-4">
            <h3 className="text-lg font-bold text-white">Análisis Clínico</h3>
            <p className="text-sm text-slate-400">Consulta interacciones o dudas sobre este medicamento.</p>
          </div>
          
          <div className="flex-1">
            <ClinicalAssistant contextProducts={[product]} />
          </div>
        </div>

      </div>
    </div>
  );
};
