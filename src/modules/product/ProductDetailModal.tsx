import React, { useEffect } from 'react';
import { Product } from '../../core/types';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';
import { ClinicalSynergy } from './ClinicalSynergy';
import { X, Sparkles, AlertCircle, ChevronLeft, Home, Printer, RefreshCw } from 'lucide-react';

import { ProductHeader } from './components/ProductHeader';
import { ProductBentoGrid } from './components/ProductBentoGrid';
import { ProductActions } from './components/ProductActions';
import { ProductEditForm } from './components/ProductEditForm';
import { PasswordPrompt } from './components/PasswordPrompt';

import { useProductDetail } from './hooks/useProductDetail';
import { printProductTicket } from './utils/printHelpers';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
  onTagClick?: (tag: string) => void;
  onUpdate?: (updatedProduct: Product) => void;
  searchTerm?: string;
  isEmbedded?: boolean;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ 
  product: initialProduct, 
  onClose, 
  onTagClick, 
  onUpdate, 
  searchTerm = '',
  isEmbedded = false
}) => {
  const {
    product,
    setProduct,
    isReanalyzing,
    isSuccess,
    isForcingSynergy,
    isEditing,
    setIsEditing,
    isVerifying,
    setIsVerifying,
    showPasswordPrompt,
    setShowPasswordPrompt,
    password,
    setPassword,
    statusMessage,
    handleReanalyze,
    handleForceSynergy,
    handleSaveEdit,
    handlePasswordSubmit,
    showStatus
  } = useProductDetail(initialProduct, onUpdate);

  useEffect(() => {
    // Reset scroll when product changes
    const leftCol = document.getElementById('product-detail-left-col');
    if (leftCol) leftCol.scrollTo({ top: 0, behavior: 'auto' });
    
    // Auto-scroll screen if in mobile and embedded
    if (isEmbedded && window.innerWidth < 768) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [product.sku, isEmbedded]);

  const handleEditClick = () => {
    if (isEditing) setIsEditing(false);
    else {
      setIsVerifying(false);
      setShowPasswordPrompt(true);
    }
  };

  const handleVerifyClick = () => {
    if (product.is_verified) handleSaveEdit({ ...product, is_verified: false });
    else {
      setIsVerifying(true);
      setShowPasswordPrompt(true);
    }
  };

  const hasSynergy = !!product.synergy_analyzed;

  const detailContent = (
    <div className={`bg-brand-surface w-full h-full sm:rounded-[2rem] shadow-2xl shadow-brand-primary/20 border-t sm:border border-slate-800 flex flex-col md:flex-row overflow-hidden ${!hasSynergy ? 'max-w-4xl' : ''} ${isEmbedded ? 'animate-none shadow-none border-none' : 'animate-in slide-in-from-bottom sm:slide-in-from-right duration-500'}`}>
      
      {/* Columna Izquierda: Detalles del Producto */}
      <div id="product-detail-left-col" className={`w-full p-4 sm:p-8 overflow-y-auto relative bg-brand-bg scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent ${hasSynergy ? 'md:w-3/5 border-r border-slate-800' : ''}`}>
        
        {/* Navegación Superior */}
        <div className="flex items-center justify-between mb-6 sm:mb-8 sticky top-0 z-[60] bg-brand-bg/80 backdrop-blur-md -mx-4 px-4 py-2 sm:static sm:mx-0 sm:px-0 sm:py-0 sm:bg-transparent">
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl bg-brand-surface/50 hover:bg-brand-surface text-slate-300 hover:text-white transition-all border border-slate-700/50 group shadow-lg"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform text-brand-primary" />
              <span className="font-bold text-[10px] sm:text-xs uppercase tracking-widest">Cerrar</span>
            </button>
              
            <button 
              onClick={onClose}
              className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-brand-surface/50 hover:bg-brand-surface text-slate-400 hover:text-brand-primary transition-all border border-slate-700/50 shadow-lg"
            >
              <Home className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button 
              onClick={() => printProductTicket(product)}
              className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-brand-surface/50 hover:bg-brand-surface text-slate-400 hover:text-brand-primary transition-all border border-slate-700/50 shadow-lg"
            >
              <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          <div className="md:hidden">
            <button 
              onClick={handleReanalyze}
              disabled={isReanalyzing}
              className={`p-2 rounded-xl border transition-all ${isReanalyzing ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-brand-surface border-slate-700'}`}
            >
              {isReanalyzing ? <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" /> : <Sparkles className="w-4 h-4 text-brand-primary" />}
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className={`fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-[100] px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl border shadow-2xl animate-in slide-in-from-top duration-300 flex items-center gap-2 sm:gap-3 w-[90%] sm:w-auto ${
            statusMessage.type === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-400' :
            statusMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' :
            'bg-brand-primary/10 border-brand-primary/50 text-brand-primary'
          }`}>
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span className="font-medium text-xs sm:text-base">{statusMessage.text}</span>
          </div>
        )}

        <div className="relative">
          <ProductHeader product={product} onTagClick={onTagClick} searchTerm={searchTerm} />
          <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-50 hidden sm:block">
            <ProductActions 
              product={product}
              isForcingSynergy={isForcingSynergy}
              isReanalyzing={isReanalyzing}
              isSuccess={isSuccess}
              isEditing={isEditing}
              onForceSynergy={handleForceSynergy}
              onReanalyze={handleReanalyze}
              onEdit={handleEditClick}
              onVerify={handleVerifyClick}
              onClose={onClose}
              hideCloseMobile={true}
            />
          </div>
        </div>

        {isEditing ? (
          <ProductEditForm 
            product={product} 
            onSave={handleSaveEdit} 
            onCancel={() => setIsEditing(false)} 
          />
        ) : (
          <>
            <ProductBentoGrid product={product} searchTerm={searchTerm} />
            <div className="mt-8 pt-8 border-t border-slate-800 flex flex-wrap justify-center gap-3 sm:hidden">
              <ProductActions 
                product={product}
                isForcingSynergy={isForcingSynergy}
                isReanalyzing={isReanalyzing}
                isSuccess={isSuccess}
                isEditing={isEditing}
                onForceSynergy={handleForceSynergy}
                onReanalyze={handleReanalyze}
                onEdit={handleEditClick}
                onVerify={handleVerifyClick}
                onClose={onClose}
                hideCloseMobile={true}
              />
            </div>
            
            <div className="mt-8 sm:mt-12 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] bg-slate-900/50 border border-slate-800 border-dashed">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Aviso de Consultoría</p>
                  <p className="text-[10px] sm:text-xs text-slate-500 leading-relaxed">
                    Esta información es técnica. No constituye diagnóstico médico.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {showPasswordPrompt && (
        <PasswordPrompt 
          password={password}
          setPassword={setPassword}
          onSubmit={handlePasswordSubmit}
          onCancel={() => setShowPasswordPrompt(false)}
        />
      )}

      {/* Columna Derecha: Sinergia */}
      {hasSynergy && (
        <div className="w-full md:w-2/5 bg-brand-bg/30 p-6 md:p-10 flex flex-col relative overflow-y-auto">
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all border border-rose-500/30 hidden md:flex"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="mb-8 pr-16">
            <h3 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-primary" />
              Sinergia Clínica
            </h3>
            <p className="text-sm text-slate-500">Relaciones inteligentes IA.</p>
          </div>
          
          <div className="flex-1">
            <ErrorBoundary componentName="ClinicalSynergyPanel">
              <ClinicalSynergy product={product} onProductClick={(p) => setProduct(p)} />
            </ErrorBoundary>
          </div>
        </div>
      )}
    </div>
  );

  return isEmbedded ? (
    <div className="w-full flex-1">{detailContent}</div>
  ) : (
    <div className="fixed inset-0 z-50 flex justify-end p-2 md:p-4 bg-brand-bg/40 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      {detailContent}
    </div>
  );
};
