import React, { useState } from 'react';
import { Product, SafetyStatus } from '../../core/types/product.types';
import { ClinicalSynergy } from './ClinicalSynergy';
import { X, Info, AlertTriangle, CheckCircle2, Tag, RefreshCw, Loader2, Baby, Heart, ShieldCheck, Activity, Droplets, Wheat, Sparkles, Cpu } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { formatArrayToString } from '../../utils/formatters';
import { GeminiService } from '../../services/GeminiService';
import { FirebaseSyncService } from '../../services/FirebaseSyncService';
import { SynergyBackgroundService } from '../../services/SynergyBackgroundService';
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
  const [isForcingSynergy, setIsForcingSynergy] = useState(false);

  const handleReanalyze = async () => {
    setIsReanalyzing(true);
    setIsSuccess(false);
    try {
      const updatedProduct = await GeminiService.reanalyzeProduct(product);
      if (updatedProduct) {
        const db = await getDB();
        await db.put('products', updatedProduct);
        
        // Sincronizar con Firestore (si es admin)
        await FirebaseSyncService.updateProduct(updatedProduct);
        
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

  const handleForceSynergy = async () => {
    setIsForcingSynergy(true);
    try {
      const started = await SynergyBackgroundService.forceAnalyze(product);
      if (!started) {
        alert('El motor está ocupado o el producto ya fue analizado.');
      } else {
        // Recargar el producto desde la DB local
        const db = await getDB();
        const updated = await db.get('products', product.sku);
        if (updated) {
          setProduct(updated);
          if (onUpdate) onUpdate(updated);
        }
      }
    } catch (error) {
      console.error('Error forzando sinergia:', error);
    } finally {
      setIsForcingSynergy(false);
    }
  };

  const handleProductClick = (newProduct: Product) => {
    setProduct(newProduct);
    // Scroll to top of the left column
    const leftCol = document.getElementById('product-detail-left-col');
    if (leftCol) leftCol.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getSafetyConfig = (status: SafetyStatus) => {
    switch (status) {
      case SafetyStatus.SI:
        return { color: 'text-brand-accent bg-brand-accent/10 border-brand-accent/20', icon: <CheckCircle2 className="w-4 h-4" />, label: 'Apto' };
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
    <div className="fixed inset-0 z-50 flex justify-end p-2 md:p-4 bg-brand-bg/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-brand-surface w-full h-full rounded-[2rem] shadow-2xl shadow-brand-primary/20 animate-in slide-in-from-right duration-500 border border-slate-800 flex flex-col md:flex-row overflow-hidden">
        
        {/* Columna Izquierda: Detalles del Producto */}
        <div id="product-detail-left-col" className="w-full md:w-3/5 p-4 md:p-8 overflow-y-auto border-r border-slate-800 relative bg-brand-bg scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          
          {/* Header Block (Destacado) */}
          <div className="bg-brand-surface border border-slate-800 rounded-3xl p-6 md:p-8 mb-6 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            
            <div className="flex justify-between items-start relative z-10">
              <div className="flex-1 pr-4">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <Badge variant="outline" className="bg-brand-bg text-slate-400 border-slate-700 px-3 py-1 text-xs tracking-wider font-mono">
                    {product.sku}
                  </Badge>
                  {product.categoria_principal && product.categoria_principal !== 'Otro' && (
                    <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-3 py-1 text-xs tracking-wider font-bold uppercase">
                      {product.categoria_principal}
                    </Badge>
                  )}
                  {Array.isArray(product.tags_ia) && product.tags_ia.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {product.tags_ia.slice(0, 3).map(tag => (
                        <span key={tag} className="px-2.5 py-1 bg-brand-primary/10 text-brand-primary rounded-lg text-[10px] font-bold uppercase tracking-wider border border-brand-primary/20">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-5">
                  {product.nombre_comercial}
                </h2>
                
                <div className="inline-flex items-center gap-2.5 bg-brand-primary/10 border border-brand-primary/20 px-4 py-2.5 rounded-2xl">
                  <Activity className="w-5 h-5 text-brand-primary" />
                  <span className="text-lg md:text-xl text-brand-primary font-bold">
                    {formatArrayToString(product.principios_activos, ', ')}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col gap-3 shrink-0">
                <button 
                  onClick={handleForceSynergy}
                  disabled={isForcingSynergy || product.synergy_analyzed}
                  title={product.synergy_analyzed ? "Sinergia ya analizada" : "Forzar análisis de sinergia local"}
                  className={`p-3 rounded-2xl transition-all disabled:opacity-50 border shadow-sm ${
                    product.synergy_analyzed 
                      ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' 
                      : 'text-indigo-400 border-slate-700 bg-brand-bg hover:bg-slate-700 hover:text-indigo-300'
                  }`}
                >
                  {isForcingSynergy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Cpu className="w-5 h-5" />}
                </button>
                <button 
                  onClick={handleReanalyze}
                  disabled={isReanalyzing}
                  title="Re-analizar y completar con IA (Nube)"
                  className={`p-3 rounded-2xl transition-all disabled:opacity-50 border shadow-sm ${
                    isSuccess 
                      ? 'text-brand-accent border-brand-accent/30 bg-brand-accent/10' 
                      : 'text-brand-primary border-slate-700 bg-brand-bg hover:bg-slate-700 hover:text-brand-primary/80'
                  }`}
                >
                  {isReanalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : isSuccess ? <CheckCircle2 className="w-5 h-5" /> : <RefreshCw className="w-5 h-5" />}
                </button>
                <button 
                  onClick={onClose}
                  className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition-all border border-slate-700 md:hidden shadow-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Bento Grid de Información */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            
            {/* Descripción */}
            <div className="col-span-1 md:col-span-2 bg-brand-surface border border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                <Info className="w-4 h-4" /> Descripción
              </h3>
              <p className="text-slate-300 leading-relaxed text-base md:text-lg">{product.descripcion}</p>
            </div>

            {/* Análisis de Componentes */}
            {product.analisis_componentes && (
              <div className="col-span-1 md:col-span-2 bg-brand-surface border border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                  <Cpu className="w-4 h-4 text-indigo-400" /> Análisis de Componentes
                </h3>
                <div className="text-slate-300 leading-relaxed text-sm md:text-base whitespace-pre-wrap">
                  {product.analisis_componentes}
                </div>
              </div>
            )}

            {/* Indicaciones */}
            <div className="bg-brand-surface border border-slate-800 rounded-3xl p-6 shadow-sm">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-5">
                <CheckCircle2 className="w-4 h-4 text-brand-accent" /> Indicaciones
              </h3>
              <ul className="space-y-3">
                {(Array.isArray(product.indicaciones) ? product.indicaciones : []).map((ind, i) => {
                  if (!ind) return null;
                  const text = typeof ind === 'object' ? ((ind as any).nombre || (ind as any).tipo || (ind as any).indicacion || JSON.stringify(ind)) : String(ind);
                  return (
                    <li key={i} className="flex items-start gap-3 text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-accent mt-2 shrink-0" />
                      <span className="text-sm font-medium leading-relaxed">{text}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Posología */}
            <div className="bg-brand-surface border border-slate-800 rounded-3xl p-6 shadow-sm">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-5">
                Posología
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed font-medium">
                {product.posologia}
              </p>
            </div>

            {/* Advertencias */}
            <div className="col-span-1 md:col-span-2 bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6 md:p-8 shadow-sm">
              <h3 className="text-xs font-bold text-amber-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4" /> Advertencias Críticas
              </h3>
              <p className="text-amber-200/90 leading-relaxed text-sm md:text-base font-medium">{product.advertencias}</p>
            </div>

            {/* Perfil de Seguridad */}
            <div className="col-span-1 md:col-span-2 bg-brand-surface border border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Perfil de Seguridad
                </h3>
                <div className="flex items-center gap-3 text-[9px] uppercase tracking-wider font-bold opacity-80 bg-brand-bg px-3 py-1.5 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-1.5 text-brand-accent">
                    <div className="w-2 h-2 rounded-full bg-brand-accent" /> Apto
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <div className="w-2 h-2 rounded-full bg-amber-500" /> Precaución
                  </div>
                  <div className="flex items-center gap-1.5 text-red-400">
                    <div className="w-2 h-2 rounded-full bg-red-500" /> Riesgo
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {safetyItems.map((item) => {
                  const config = getSafetyConfig(item.status);
                  return (
                    <div 
                      key={item.id} 
                      className={`flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl border transition-all text-center ${config.color}`}
                    >
                      <div className="p-2 rounded-full bg-brand-bg/50">{config.icon}</div>
                      <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Sinergia Clínica IA */}
        <div className="w-full md:w-2/5 bg-brand-bg/30 p-6 md:p-10 flex flex-col relative overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 p-2.5 rounded-xl bg-brand-surface/50 hover:bg-brand-surface text-slate-400 transition-all border border-slate-700/50 hidden md:flex items-center justify-center z-10"
            title="Cerrar panel"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="mb-8 pr-12">
            <h3 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-primary" />
              Sinergia Clínica
            </h3>
            <p className="text-sm text-slate-500">Relaciones inteligentes entre productos de tu Vademécum.</p>
          </div>
          
          <div className="flex-1">
            <ClinicalSynergy 
              product={product} 
              onProductClick={handleProductClick}
            />
          </div>
        </div>

      </div>
    </div>
  );
};
