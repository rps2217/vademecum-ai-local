import React from 'react';
import { Product } from '../../core/types/product.types';
import { ClinicalAssistant } from '../assistant/ClinicalAssistant';
import { X, AlertTriangle, Pill, ShieldAlert } from 'lucide-react';

interface PrescriptionAnalysisModalProps {
  products: Product[];
  onClose: () => void;
}

export const PrescriptionAnalysisModal: React.FC<PrescriptionAnalysisModalProps> = ({ products, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Columna Izquierda: Lista de Medicamentos */}
        <div className="w-full md:w-1/3 p-6 overflow-y-auto border-r border-slate-100 bg-slate-50/50">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-indigo-600" />
                Análisis Cruzado
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {products.length} medicamentos seleccionados
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors md:hidden"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            {products.map(product => (
              <div key={product.sku} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 mt-1">
                    <Pill className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{product.nombre_comercial}</h4>
                    <p className="text-xs text-slate-500 mb-2">{product.principios_activos.join(', ')}</p>
                    
                    {product.advertencias && (
                      <div className="flex items-start gap-1.5 text-amber-700 bg-amber-50 p-2 rounded-lg text-xs">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{product.advertencias}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Columna Derecha: Asistente Clínico */}
        <div className="w-full md:w-2/3 bg-white p-6 flex flex-col relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors hidden md:block z-10"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900">Asistente de Interacciones</h3>
            <p className="text-sm text-slate-500">La IA analizará posibles riesgos al combinar estos medicamentos.</p>
          </div>
          
          <div className="flex-1">
            <ClinicalAssistant contextProducts={products} />
          </div>
        </div>

      </div>
    </div>
  );
};
