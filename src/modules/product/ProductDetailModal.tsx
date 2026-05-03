import React, { useEffect } from 'react';
import { Product } from '../../core/types';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';
import { ClinicalSynergy } from './ClinicalSynergy';
import { X, Sparkles, AlertCircle, ChevronLeft, Home, Printer, RefreshCw, Bookmark, ShieldCheck, Info, ShieldAlert } from 'lucide-react';

import { ProductHeader } from './components/ProductHeader';
import { ProductBentoGrid } from './components/ProductBentoGrid';
import { ProductActions } from './components/ProductActions';
import { ProductEditForm } from './components/ProductEditForm';
import { PasswordPrompt } from './components/PasswordPrompt';
import { IngredientInsights } from './components/IngredientInsights';

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
    <div className={`bg-background w-full h-full border-l shadow-2xl flex flex-col md:flex-row overflow-hidden ${isEmbedded ? 'border-none shadow-none' : 'animate-in slide-in-from-right duration-500 ease-out'}`}>
      
      {/* Columna Izquierda: Información Clínica */}
      <div className={`flex flex-col h-full bg-background ${hasSynergy ? 'md:w-3/5 border-r' : 'w-full'}`}>
        
        {/* Header de Navegación Modal */}
        <div className="flex items-center justify-between px-6 h-16 border-b shrink-0 bg-background/80 backdrop-blur sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Volver
            </Button>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2">Ficha Técnica</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => printProductTicket(product)} title="Imprimir">
              <Printer className="h-4 w-4" />
            </Button>
            <Button 
                variant={product.is_verified ? "secondary" : "outline"}
                size="sm" 
                onClick={handleVerifyClick}
                className={product.is_verified ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200' : ''}
              >
              {product.is_verified ? <ShieldCheck className="mr-2 h-4 w-4" /> : <Bookmark className="mr-2 h-4 w-4" />}
              {product.is_verified ? 'Verificado' : 'Verificar'}
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 md:p-10 whitespace-optimized">
            
            {statusMessage && (
              <div className={`mb-8 p-4 rounded-lg flex items-center gap-3 border ${
                statusMessage.type === 'error' ? 'alert-critical' :
                statusMessage.type === 'success' ? 'alert-synergy' :
                'alert-info'
              }`}>
                <Info className="h-5 w-5 shrink-0" />
                <span className="font-medium text-sm">{statusMessage.text}</span>
              </div>
            )}

            <ProductHeader 
              product={product} 
              onTagClick={onTagClick} 
              searchTerm={searchTerm} 
              actions={null} // Actions moved to separate grid or top bar
            />

            {isEditing ? (
              <ProductEditForm 
                product={product} 
                onSave={handleSaveEdit} 
                onCancel={() => setIsEditing(false)} 
              />
            ) : (
              <div className="mt-10 space-y-12">
                <ProductBentoGrid product={product} searchTerm={searchTerm} />
                
                <Separator />
                
                <IngredientInsights product={product} />

                <div className="bg-muted/30 border border-dashed p-6 rounded-xl">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Responsabilidad Profesional</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Este producto y sus sugerencias de sinergia han sido analizados por modelos de inteligencia artificial propietarios. 
                        La decisión clínica final recae exclusivamente en el profesional facultativo. 
                        Consulte siempre la posología oficial según lote y registro vigente.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Footer Actions */}
        {!isEditing && (
          <div className="p-4 border-t bg-muted/10 flex items-center justify-between px-6 h-16 shrink-0">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="font-mono text-[10px] py-1">SKU: {product.sku}</Badge>
              {product.categoria_principal && <Badge variant="outline" className="text-[10px] uppercase tracking-wide">{product.categoria_principal}</Badge>}
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
      </div>

      {showPasswordPrompt && (
        <PasswordPrompt 
          password={password}
          setPassword={setPassword}
          onSubmit={handlePasswordSubmit}
          onCancel={() => setShowPasswordPrompt(false)}
        />
      )}

      {/* Columna Derecha: Sinergia Clínica (Swiss Panel) */}
      {hasSynergy && (
        <div className="w-full md:w-2/5 bg-slate-50/50 flex flex-col h-full animate-in slide-in-from-right duration-700">
          <div className="h-16 flex items-center px-6 border-b shrink-0 bg-slate-100/50">
            <h3 className="text-sm font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              Sinergia e Interacciones Clínicas
            </h3>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-6 md:p-8">
              <div className="mb-8 alert-synergy text-[13px] leading-relaxed">
                Este análisis utiliza el motor RAG vectorial para identificar interacciones farmacológicas y complementos sinérgicos basados en mecanismos de acción documentados.
              </div>
              
              <ErrorBoundary componentName="ClinicalSynergyPanel">
                <ClinicalSynergy product={product} onProductClick={(p) => setProduct(p)} />
              </ErrorBoundary>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );

  return isEmbedded ? (
    <div className="w-full h-full flex flex-col">{detailContent}</div>
  ) : (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/20 backdrop-blur-sm sm:pl-20" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-6xl h-full shadow-2xl">
        {detailContent}
      </div>
    </div>
  );
};
