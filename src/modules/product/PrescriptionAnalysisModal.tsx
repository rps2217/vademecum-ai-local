import React from 'react';
import { Product } from '../../core/types/product.types';
import { ClinicalAssistant } from '../assistant/ClinicalAssistant';
import { X, AlertTriangle, Pill, ShieldAlert } from 'lucide-react';
import { formatArrayToString } from '../../utils/formatters';

interface PrescriptionAnalysisModalProps {
  products: Product[];
  onClose: () => void;
}

export const PrescriptionAnalysisModal: React.FC<PrescriptionAnalysisModalProps> = ({ products, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex justify-end p-2 md:p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full h-full rounded-[2rem] shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col md:flex-row overflow-hidden border border-slate-200">
        
        {/* Columna Izquierda: Lista de Medicamentos */}
        <div className="w-full md:w-1/3 p-6 md:p-10 overflow-y-auto border-r border-slate-100 bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                <ShieldAlert className="w-8 h-8 text-indigo-600" />
                Análisis Cruzado
              </h2>
              <p className="text-base text-slate-500 mt-2">
                {products.length} medicamentos seleccionados
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-3 rounded-xl bg-white hover:bg-slate-100 text-slate-500 transition-all border border-slate-200 md:hidden"
            >
              <X className="w-8 h-8" />
            </button>
          </div>

          <div className="space-y-6">
            {products.map(product => (
              <div key={product.sku} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-5">
                  <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 mt-1">
                    <Pill className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-bold text-slate-900 truncate">{product.nombre_comercial}</h4>
                    <p className="text-sm text-slate-500 mb-4">{formatArrayToString(product.principios_activos, ', ')}</p>
                    
                    {product.advertencias && (
                      <div className="flex items-start gap-3 text-amber-700 bg-amber-50 p-4 rounded-xl text-sm border border-amber-100">
                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{product.advertencias}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Columna Derecha: Asistente Clínico */}
        <div className="w-full md:w-2/3 bg-white p-6 md:p-12 flex flex-col relative">
          <button 
            onClick={onClose}
            className="absolute top-10 right-10 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 transition-all border border-slate-200 hidden md:flex items-center justify-center z-10"
            title="Cerrar análisis"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="mb-10 pr-16">
            <h3 className="text-3xl font-bold text-slate-900 mb-2">Asistente de Interacciones</h3>
            <p className="text-lg text-slate-500">Análisis inteligente de riesgos al combinar estos fármacos.</p>
          </div>
          
          <div className="flex-1 min-h-0">
            <ClinicalAssistant contextProducts={products} />
          </div>
        </div>

      </div>
    </div>
  );
};
