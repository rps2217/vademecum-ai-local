import React, { useEffect, useState } from 'react';
import { Product } from '../../core/types';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';
import { ClinicalSynergy } from './ClinicalSynergy';
import { X, Sparkles, AlertCircle, ChevronLeft, Home, Printer, RefreshCw, Bookmark, ShieldCheck, Info, ShieldAlert, FileText, Beaker } from 'lucide-react';

import { ProductHeader } from './components/ProductHeader';
import { ProductBentoGrid } from './components/ProductBentoGrid';
import { ProductActions } from './components/ProductActions';
import { ProductEditForm } from './components/ProductEditForm';
import { PasswordPrompt } from './components/PasswordPrompt';
import { IngredientInsights } from './components/IngredientInsights';
import { ProductSafetyProfile } from './components/ProductSafetyProfile';

import { useProductDetail } from './hooks/useProductDetail';
import { printProductTicket } from './utils/printHelpers';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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

  const [activeTab, setActiveTab] = useState<'general' | 'synergy' | 'safety' | 'ingredients'>('general');

  useEffect(() => {
    // Reset scroll when product changes
    const viewport = document.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) viewport.scrollTo({ top: 0, behavior: 'auto' });
  }, [product.sku]);

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
    <div className={`bg-background w-full h-full flex flex-col overflow-hidden ${isEmbedded ? 'border-none shadow-none' : 'border-border/10'}`}>
      
      {/* Header de Navegación Modal */}
      <div className="flex items-center justify-between px-6 h-16 border-b shrink-0 bg-background sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Volver
          </Button>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest text-[#0284c7] px-2 bg-sky-50 rounded py-0.5">Ficha Técnica</span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => printProductTicket(product)} title="Imprimir" className="rounded-xl border-border/80">
            <Printer className="h-4 w-4" />
          </Button>
          <Button 
              variant={product.is_verified ? "secondary" : "outline"}
              size="sm" 
              onClick={handleVerifyClick}
              className={product.is_verified ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 rounded-xl' : 'rounded-xl'}
            >
            {product.is_verified ? <ShieldCheck className="mr-2 h-4 w-4 text-emerald-600" /> : <Bookmark className="mr-2 h-4 w-4" />}
            {product.is_verified ? 'Verificado' : 'Verificar'}
          </Button>
        </div>
      </div>

      {/* Navigation Tab list (Clinical Tabs) */}
      {!isEditing && (
        <div className="flex bg-card p-1 border-b gap-1.5 overflow-x-auto scrollbar-hide shrink-0 px-6 h-12 items-center">
          <button 
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer whitespace-nowrap ${
              activeTab === 'general' 
                ? 'bg-primary/10 text-primary border-transparent' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <FileText className="h-4 w-4" />
            Perfil Clínico
          </button>
          
          <button 
            type="button"
            onClick={() => setActiveTab('synergy')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer whitespace-nowrap ${
              activeTab === 'synergy' 
                ? 'bg-emerald-50 text-emerald-700 border-transparent' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Sparkles className="h-4 w-4 text-emerald-600 animate-pulse" />
            Sinergia y Venta Cruzada
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('safety')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer whitespace-nowrap ${
              activeTab === 'safety' 
                ? 'bg-orange-50 text-orange-700 border-transparent' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <ShieldCheck className="h-4 w-4 text-orange-600" />
            Seguridad Clínica
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('ingredients')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer whitespace-nowrap ${
              activeTab === 'ingredients' 
                ? 'bg-sky-50 text-sky-800 border-transparent' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Beaker className="h-4 w-4 text-sky-600" />
            Compuestos Químicos
          </button>
        </div>
      )}

      {/* Main detail workspace */}
      <div className="flex-1 overflow-hidden relative flex flex-col bg-card">
        <ScrollArea className="flex-1">
          <div className="p-6 md:p-10 whitespace-optimized max-w-7xl mx-auto w-full">
            
            {statusMessage && (
              <div className={`mb-8 p-4 rounded-xl flex items-center gap-3 border ${
                statusMessage.type === 'error' ? 'alert-critical' :
                statusMessage.type === 'success' ? 'alert-synergy' :
                'alert-info'
              }`}>
                <Info className="h-5 w-5 shrink-0 animate-bounce" />
                <span className="font-semibold text-sm">{statusMessage.text}</span>
              </div>
            )}

            {isEditing ? (
              <ProductEditForm 
                product={product} 
                onSave={handleSaveEdit} 
                onCancel={() => setIsEditing(false)} 
              />
            ) : (
              <div className="space-y-6">
                
                {/* Banner Header de Producto: Estilo Premium */}
                <ProductHeader 
                  product={product} 
                  onTagClick={onTagClick} 
                  searchTerm={searchTerm} 
                  actions={null}
                />

                {activeTab === 'general' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <ProductBentoGrid product={product} searchTerm={searchTerm} />
                  </div>
                )}

                {activeTab === 'synergy' && (
                  <div className="space-y-8 animate-in fade-in duration-300 bg-background/40 p-6 rounded-3xl border border-border/50">
                    <div className="mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs sm:text-[13px] leading-relaxed dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-300">
                      <strong>Información de Sinergia y Co-prescripción:</strong> Relaciones clínicas mapeadas detalladamente para mejorar las recomendaciones médicas cruzadas y precauciones entre fármacos.
                    </div>
                    
                    <ErrorBoundary componentName="ClinicalSynergyPanel">
                      <ClinicalSynergy product={product} onProductClick={(p) => setProduct(p)} />
                    </ErrorBoundary>
                  </div>
                )}

                {activeTab === 'safety' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    {product.advertencias && (
                      <div className="alert-critical p-6 sm:p-8 rounded-3xl space-y-3">
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertCircle className="h-6 w-6" />
                          <span className="text-xs font-bold uppercase tracking-widest">Advertencias Especiales y Contraindicaciones de Seguridad</span>
                        </div>
                        <p className="text-sm font-semibold leading-relaxed text-red-900 leading-relaxed italic">
                          {product.advertencias}
                        </p>
                      </div>
                    )}

                    <div className="bg-background/40 p-6 rounded-3xl border border-border/50">
                      <h4 className="text-xs font-black uppercase tracking-widest text-[#0284c7] mb-6 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" /> Categorías de Aptitud Clínica
                      </h4>
                      <ProductSafetyProfile product={product} />
                    </div>
                  </div>
                )}

                {activeTab === 'ingredients' && (
                  <div className="space-y-8 animate-in fade-in duration-300 bg-background/40 p-6 rounded-3xl border border-border/50">
                    <IngredientInsights product={product} />
                  </div>
                )}

                {/* Descargo de Responsabilidad */}
                <div className="bg-muted/45 border border-dashed p-6 rounded-2xl mt-12">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">Responsabilidad Profesional del Clínico</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Este producto y sus sugerencias de sinergia han sido analizados por modelos de inteligencia artificial propietarios de última generación. 
                        La decisión clínica final recae exclusivamente en el profesional facultativo. 
                        Consulte siempre la posología oficial según lote y registro sanitario vigente.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      
      {/* Footer de Acción de la Ficha */}
      {!isEditing && (
        <div className="p-4 border-t bg-muted/60 flex items-center justify-between px-6 h-16 shrink-0 shadow-[0_-1px_10px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="font-mono text-[10px] py-1 bg-card">SKU: {product.sku}</Badge>
            {product.categoria_principal && <Badge variant="outline" className="text-[10px] uppercase tracking-wide bg-card">{product.categoria_principal}</Badge>}
          </div>
          <div className="flex items-center gap-2">
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
      )}

      {showPasswordPrompt && (
        <PasswordPrompt 
          password={password}
          setPassword={setPassword}
          onSubmit={handlePasswordSubmit}
          onCancel={() => setShowPasswordPrompt(false)}
        />
      )}

    </div>
  );

  return isEmbedded ? (
    <div className="w-full h-full flex flex-col">{detailContent}</div>
  ) : (
    <div className="fixed inset-0 z-[100] flex justify-center items-center bg-black/60 p-4 sm:p-6 md:p-8 animate-in fade-in duration-300" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-7xl h-full max-h-[92vh] rounded-3xl overflow-hidden shadow-2xl border border-border/80 bg-background flex flex-col animate-in zoom-in-95 duration-300">
        {detailContent}
      </div>
    </div>
  );
};

