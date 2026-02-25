import React from 'react';
import { Product } from '../../core/types/product.types';
import { ClinicalAssistant } from '../assistant/ClinicalAssistant';
import { X, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Badge } from '../../components/ui/badge';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Columna Izquierda: Detalles del Producto */}
        <div className="w-full md:w-1/2 p-8 overflow-y-auto border-r border-slate-100">
          <div className="flex justify-between items-start mb-6">
            <div>
              <Badge variant="outline" className="mb-2 bg-slate-50 text-slate-500 border-slate-200">
                {product.sku}
              </Badge>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                {product.nombre_comercial}
              </h2>
              <p className="text-lg text-indigo-600 font-medium mt-1">
                {product.principios_activos.join(', ')}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors md:hidden"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            <section>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400" /> Descripción
              </h3>
              <p className="text-slate-600 leading-relaxed">{product.descripcion}</p>
            </section>

            <section>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Indicaciones
              </h3>
              <ul className="list-disc list-inside text-slate-600 space-y-1">
                {product.indicaciones.map((ind, i) => <li key={i}>{ind}</li>)}
              </ul>
            </section>

            <section className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
              <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Advertencias
              </h3>
              <p className="text-amber-800 leading-relaxed text-sm">{product.advertencias}</p>
            </section>

            <section>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
                Posología Recomendada
              </h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-slate-700 font-medium">
                {product.posologia}
              </div>
            </section>
          </div>
        </div>

        {/* Columna Derecha: Asistente Clínico */}
        <div className="w-full md:w-1/2 bg-slate-50 p-6 flex flex-col relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors hidden md:block z-10"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900">Análisis Clínico</h3>
            <p className="text-sm text-slate-500">Consulta interacciones o dudas sobre este medicamento.</p>
          </div>
          
          <div className="flex-1">
            <ClinicalAssistant contextProducts={[product]} />
          </div>
        </div>

      </div>
    </div>
  );
};
