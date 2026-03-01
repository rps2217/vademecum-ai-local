import React, { useState } from 'react';
import { Product, SafetyStatus } from '../../core/types/product.types';
import { ClinicalAssistant } from '../assistant/ClinicalAssistant';
import { X, Info, AlertTriangle, CheckCircle2, Tag, RefreshCw, Loader2, Baby, Heart, ShieldCheck, Activity, Droplets, Wheat } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { formatArrayToString } from '../../utils/formatters';
import { GeminiService } from '../../services/GeminiService';
import { getDB } from '../../core/database/db';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
  onTagClick?: (tag: string) => void;
  onUpdate?: (updatedProduct: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product: initialProduct, onClose, onTagClick, onUpdate }) => {
  const [product, setProduct] = useState<Product>(initialProduct);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleReanalyze = async () => {
    setIsReanalyzing(true);
    setIsSuccess(false);
    try {
      const updatedProduct = await GeminiService.reanalyzeProduct(product);
      if (updatedProduct) {
        const db = await getDB();
        await db.put('products', updatedProduct);
        setProduct(updatedProduct);
        if (onUpdate) onUpdate(updatedProduct);
        setIsSuccess(true);
        setTimeout(() => setIsSuccess(false), 3000);
      } else {
        alert('No se pudo reanalizar el producto.');
      }
    } catch (error) {
      console.error('Error reanalizando:', error);
      alert('Ocurrió un error al reanalizar el producto.');
    } finally {
      setIsReanalyzing(false);
    }
  };

  const getSafetyConfig = (status: SafetyStatus) => {
    switch (status) {
      case SafetyStatus.SI:
        return { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: <CheckCircle2 className="w-4 h-4" />, label: 'Apto' };
      case SafetyStatus.NO:
        return { color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: <AlertTriangle className="w-4 h-4" />, label: 'No Apto' };
      case SafetyStatus.PRECAUCION:
        return { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: <Info className="w-4 h-4" />, label: 'Precaución' };
      default:
        return { color: 'text-slate-400 bg-slate-500/10 border-slate-500/20', icon: <Info className="w-4 h-4" />, label: 'Desconocido' };
    }
  };

  const safetyItems = [
    { id: 'embarazo', label: 'Embarazo', status: product.apto_embarazo, icon: <Heart className="w-4 h-4" /> },
    { id: 'lactancia', label: 'Lactancia', status: product.apto_lactancia, icon: <Droplets className="w-4 h-4" /> },
    { id: 'pediatria', label: 'Pediatría', status: product.apto_pediatria, icon: <Baby className="w-4 h-4" /> },
    { id: 'diabeticos', label: 'Diabéticos', status: product.apto_diabeticos, icon: <Activity className="w-4 h-4" /> },
    { id: 'hipertensos', label: 'Hipertensos', status: product.apto_hipertensos, icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'celiacos', label: 'Celíacos', status: product.apto_celiacos, icon: <Wheat className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end p-2 md:p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-slate-900 w-full h-full rounded-[2rem] shadow-2xl shadow-indigo-500/20 animate-in slide-in-from-right duration-500 border border-slate-800 flex flex-col md:flex-row overflow-hidden">
        
        {/* Columna Izquierda: Detalles del Producto */}
        <div className="w-full md:w-3/5 p-6 md:p-12 overflow-y-auto border-r border-slate-800 relative bg-slate-900/50 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <div className="flex justify-between items-start mb-8">
            <div className="flex-1">
              <Badge variant="outline" className="mb-3 bg-slate-800 text-slate-400 border-slate-700 px-3 py-1">
                {product.sku}
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight">
                {product.nombre_comercial}
              </h2>
              <p className="text-xl text-indigo-400 font-medium mt-2">
                {formatArrayToString(product.principios_activos, ', ')}
              </p>
            </div>
            <div className="flex items-center gap-3 ml-4">
              <button 
                onClick={handleReanalyze}
                disabled={isReanalyzing}
                title="Re-analizar y completar con IA"
                className={`p-2.5 rounded-xl transition-all disabled:opacity-50 border ${
                  isSuccess 
                    ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' 
                    : 'text-indigo-400 border-slate-700 bg-slate-800 hover:bg-slate-700'
                }`}
              >
                {isReanalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : isSuccess ? <CheckCircle2 className="w-5 h-5" /> : <RefreshCw className="w-5 h-5" />}
              </button>
              <button 
                onClick={onClose}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition-all border border-slate-700 md:hidden"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="space-y-10">
            {/* Perfil de Seguridad (Semáforo) */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Perfil de Seguridad
                </h3>
                {/* Mini Leyenda */}
                <div className="flex items-center gap-3 text-[9px] uppercase tracking-wider font-bold opacity-60">
                  <div className="flex items-center gap-1 text-emerald-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Apto
                  </div>
                  <div className="flex items-center gap-1 text-amber-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Precaución
                  </div>
                  <div className="flex items-center gap-1 text-red-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" /> Riesgo
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {safetyItems.map((item) => {
                  const config = getSafetyConfig(item.status);
                  return (
                    <div 
                      key={item.id} 
                      className={`flex flex-col gap-2 p-3 rounded-2xl border transition-all ${config.color}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="opacity-60">{item.icon}</div>
                        <div>{config.icon}</div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">{item.label}</span>
                        <span className="text-xs font-bold">{config.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Tags IA */}
            {Array.isArray(product.tags_ia) && product.tags_ia.length > 0 && (
              <section>
                <div className="flex flex-wrap gap-2">
                  {product.tags_ia.map(tag => (
                    <button
                      key={tag}
                      onClick={() => onTagClick?.(tag)}
                      className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 rounded-xl text-xs font-semibold tracking-wide border border-indigo-500/20 transition-all flex items-center gap-1.5"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      {tag}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <Info className="w-4 h-4" /> Descripción
              </h3>
              <p className="text-slate-300 leading-relaxed text-lg">{product.descripcion}</p>
            </section>

            <section className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Indicaciones
              </h3>
              <ul className="grid grid-cols-1 gap-2">
                {(Array.isArray(product.indicaciones) ? product.indicaciones : []).map((ind, i) => {
                  if (!ind) return null;
                  const text = typeof ind === 'object' ? ((ind as any).nombre || (ind as any).tipo || (ind as any).indicacion || JSON.stringify(ind)) : String(ind);
                  return (
                    <li key={i} className="flex items-start gap-3 text-slate-300 bg-slate-800/30 p-3 rounded-xl border border-slate-800/50">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                      <span className="text-sm">{text}</span>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="bg-amber-500/5 rounded-2xl p-6 border border-amber-500/10 space-y-3">
              <h3 className="text-xs font-bold text-amber-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Advertencias Críticas
              </h3>
              <p className="text-amber-200/80 leading-relaxed text-sm font-medium">{product.advertencias}</p>
            </section>

            <section className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">
                Posología y Administración
              </h3>
              <div className="bg-indigo-500/5 rounded-2xl p-5 border border-indigo-500/10 text-indigo-100 font-medium leading-relaxed">
                {product.posologia}
              </div>
            </section>
          </div>
        </div>

        {/* Columna Derecha: Asistente Clínico */}
        <div className="w-full md:w-2/5 bg-slate-950/30 p-6 md:p-10 flex flex-col relative">
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 transition-all border border-slate-700/50 hidden md:flex items-center justify-center z-10"
            title="Cerrar panel"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="mb-8 pr-12">
            <h3 className="text-2xl font-bold text-white mb-1">Análisis Clínico IA</h3>
            <p className="text-sm text-slate-500">Consulta interacciones, dudas o farmacocinética.</p>
          </div>
          
          <div className="flex-1 min-h-0">
            <ClinicalAssistant contextProducts={[product]} />
          </div>
        </div>

      </div>
    </div>
  );
};
