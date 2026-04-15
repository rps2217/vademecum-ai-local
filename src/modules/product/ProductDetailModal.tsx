import React, { useState, useEffect } from 'react';
import { Product } from '../../core/types/product.types';
import { ClinicalSynergy } from './ClinicalSynergy';
import { X, Sparkles, AlertCircle, ChevronLeft, Home } from 'lucide-react';
import { GeminiService } from '../../services/GeminiService';
import { FirebaseSyncService } from '../../services/FirebaseSyncService';
import { SynergyBackgroundService } from '../../services/SynergyBackgroundService';
import { getDB } from '../../core/database/db';
import { ProductHeader } from './components/ProductHeader';
import { ProductBentoGrid } from './components/ProductBentoGrid';
import { ProductActions } from './components/ProductActions';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
  onTagClick?: (tag: string) => void;
  onUpdate?: (updatedProduct: Product) => void;
  searchTerm?: string;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product: initialProduct, onClose, onTagClick, onUpdate, searchTerm = '' }) => {
  const [product, setProduct] = useState<Product>(initialProduct);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isForcingSynergy, setIsForcingSynergy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'info' | 'error' | 'success' } | null>(null);

  useEffect(() => {
    const handleDbUpdate = async () => {
      const db = await getDB();
      const updated = await db.get('products', product.sku);
      if (updated) {
        setProduct(updated);
        if (onUpdate) onUpdate(updated);
      }
    };

    window.addEventListener('db_updated', handleDbUpdate);
    return () => window.removeEventListener('db_updated', handleDbUpdate);
  }, [product.sku, onUpdate]);

  const showStatus = (text: string, type: 'info' | 'error' | 'success' = 'info') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleReanalyze = async () => {
    setIsReanalyzing(true);
    setIsSuccess(false);
    try {
      const updatedProduct = await GeminiService.reanalyzeProduct(product);
      if (updatedProduct) {
        const db = await getDB();
        await db.put('products', updatedProduct);
        await FirebaseSyncService.updateProduct(updatedProduct);
        
        setProduct(updatedProduct);
        if (onUpdate) onUpdate(updatedProduct);
        setIsSuccess(true);
        showStatus('Producto reanalizado con éxito', 'success');
        setTimeout(() => setIsSuccess(false), 3000);
      } else {
        showStatus('No se pudo reanalizar el producto. Verifique la conexión.', 'error');
      }
    } catch (error) {
      console.error('Error reanalizando:', error);
      showStatus('Error al conectar con el servicio de IA.', 'error');
    } finally {
      setIsReanalyzing(false);
    }
  };

  const handleForceSynergy = async () => {
    setIsForcingSynergy(true);
    try {
      const started = await SynergyBackgroundService.forceAnalyze(product);
      if (!started) {
        showStatus('El motor está ocupado procesando otro producto.', 'info');
      } else {
        showStatus('Análisis de sinergia iniciado...', 'success');
        // El motor actualizará la DB y disparará eventos
      }
    } catch (error) {
      console.error('Error forzando sinergia:', error);
      showStatus('Error al iniciar el análisis de sinergia.', 'error');
    } finally {
      setIsForcingSynergy(false);
    }
  };

  const handleProductClick = (newProduct: Product) => {
    setProduct(newProduct);
    const leftCol = document.getElementById('product-detail-left-col');
    if (leftCol) leftCol.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end p-2 md:p-4 bg-brand-bg/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-brand-surface w-full h-full rounded-[2rem] shadow-2xl shadow-brand-primary/20 animate-in slide-in-from-right duration-500 border border-slate-800 flex flex-col md:flex-row overflow-hidden">
        
        {/* Columna Izquierda: Detalles del Producto */}
        <div id="product-detail-left-col" className="w-full md:w-3/5 p-4 md:p-8 overflow-y-auto border-r border-slate-800 relative bg-brand-bg scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          
          {/* Navegación Superior */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <button 
                onClick={onClose}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-surface/50 hover:bg-brand-surface text-slate-300 hover:text-white transition-all border border-slate-700/50 group shadow-lg"
                title="Volver al listado"
              >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform text-brand-primary" />
                <span className="font-bold text-xs uppercase tracking-widest">Volver</span>
              </button>
              
              <button 
                onClick={onClose}
                className="p-2.5 rounded-2xl bg-brand-surface/50 hover:bg-brand-surface text-slate-400 hover:text-brand-primary transition-all border border-slate-700/50 shadow-lg"
                title="Ir al inicio"
              >
                <Home className="w-5 h-5" />
              </button>
            </div>

            <div className="md:hidden">
              <button 
                onClick={onClose}
                className="p-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all border border-rose-500/30 shadow-lg"
                title="Cerrar ficha"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {statusMessage && (
            <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-2xl border shadow-2xl animate-in slide-in-from-top duration-300 flex items-center gap-3 ${
              statusMessage.type === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-400' :
              statusMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' :
              'bg-brand-primary/10 border-brand-primary/50 text-brand-primary'
            }`}>
              {statusMessage.type === 'error' && <AlertCircle className="w-5 h-5" />}
              <span className="font-medium">{statusMessage.text}</span>
            </div>
          )}

          <div className="relative">
            <ProductHeader product={product} onTagClick={onTagClick} searchTerm={searchTerm} />
            <div className="absolute top-6 right-6 md:top-8 md:right-8">
              <ProductActions 
                product={product}
                isForcingSynergy={isForcingSynergy}
                isReanalyzing={isReanalyzing}
                isSuccess={isSuccess}
                onForceSynergy={handleForceSynergy}
                onReanalyze={handleReanalyze}
                onClose={onClose}
                hideCloseMobile={true}
              />
            </div>
          </div>

          <ProductBentoGrid product={product} searchTerm={searchTerm} />
        </div>

        {/* Columna Derecha: Sinergia Clínica IA */}
        <div className="w-full md:w-2/5 bg-brand-bg/30 p-6 md:p-10 flex flex-col relative overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all border border-rose-500/30 hidden md:flex items-center justify-center z-10 shadow-xl group"
            title="Cerrar panel"
          >
            <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
          </button>
          
          <div className="mb-8 pr-16">
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

