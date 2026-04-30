import React, { useState, useEffect } from 'react';
import { Product } from '../../core/types/product.types';
import { ClinicalSynergy } from './ClinicalSynergy';
import { X, Sparkles, AlertCircle, ChevronLeft, Home, Lock, Key, Printer } from 'lucide-react';
import { GeminiService } from '../../services/GeminiService';
import { DataService } from '../../services/DataService';
import { SynergyBackgroundService } from '../../services/SynergyBackgroundService';
import { ProductHeader } from './components/ProductHeader';
import { ProductBentoGrid } from './components/ProductBentoGrid';
import { ProductActions } from './components/ProductActions';
import { ProductEditForm } from './components/ProductEditForm';
import { formatArrayToString } from '../../utils/formatters';

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
  const [product, setProduct] = useState<Product>(initialProduct);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isForcingSynergy, setIsForcingSynergy] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'info' | 'error' | 'success' } | null>(null);

  useEffect(() => {
    const handleDbUpdate = async () => {
      const updated = await DataService.getProductBySku(product.sku);
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
        await DataService.saveProduct(updatedProduct);
        
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

  const handleEditClick = () => {
    if (isEditing) {
      setIsEditing(false);
    } else {
      setIsVerifying(false);
      setShowPasswordPrompt(true);
    }
  };

  const handleVerifyClick = () => {
    if (product.is_verified) {
      handleSaveEdit({ ...product, is_verified: false });
    } else {
      setIsVerifying(true);
      setShowPasswordPrompt(true);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'RPS241061') {
      if (isVerifying) {
        handleSaveEdit({ 
          ...product, 
          is_verified: true, 
          verified_at: Date.now(),
          verified_by: 'Rolando Pizarro'
        });
        setIsVerifying(false);
      } else {
        setIsEditing(true);
      }
      setShowPasswordPrompt(false);
      setPassword('');
    } else {
      showStatus('Contraseña incorrecta', 'error');
      setPassword('');
    }
  };

  const handleSaveEdit = async (updatedProduct: Product) => {
    try {
      await DataService.saveProduct(updatedProduct);
      
      setProduct(updatedProduct);
      if (onUpdate) onUpdate(updatedProduct);
      setIsEditing(false);
      showStatus('Cambios guardados correctamente', 'success');
      window.dispatchEvent(new CustomEvent('db_updated'));
    } catch (error) {
      console.error('Error al guardar cambios:', error);
      showStatus('Error al guardar los cambios', 'error');
    }
  };

  const handleProductClick = (newProduct: Product) => {
    setProduct(newProduct);
    const leftCol = document.getElementById('product-detail-left-col');
    if (leftCol) leftCol.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrint = () => {
    const ticketContent = `
      <html>
        <head>
          <style>
            @media print {
              body { width: 80mm; font-family: monospace; font-size: 12px; line-height: 1.4; padding: 5px; color: #000; }
              h3 { margin: 0 0 10px 0; font-size: 18px; text-transform: uppercase; border-bottom: 3px solid #000; padding-bottom: 5px; }
              .posologia-content { font-size: 16px; font-weight: bold; margin: 10px 0; }
              .section-title { font-weight: bold; text-decoration: underline; margin-top: 15px; font-size: 14px; }
              .footer { margin-top: 25px; border-top: 1px dashed #000; padding-top: 10px; font-size: 10px; text-align: center; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h3>${product.nombre_comercial}</h3>
          </div>
          
          <div class="section-title">POSOLOGÍA / MODO DE USO:</div>
          <p class="posologia-content">${product.posologia || 'Consulte con su consultor técnico.'}</p>

          <div class="footer">
            Vademécum Profesional - Consultoría Técnica<br/>
            ${new Date().toLocaleString()}
          </div>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(ticketContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const hasSynergy = !!product.synergy_analyzed;

  const detailContent = (
    <div className={`bg-brand-surface w-full h-full rounded-[2rem] shadow-2xl shadow-brand-primary/20 border border-slate-800 flex flex-col md:flex-row overflow-hidden ${!hasSynergy ? 'max-w-4xl' : ''} ${isEmbedded ? 'animate-none shadow-none border-none' : 'animate-in slide-in-from-right duration-500'}`}>
      
      {/* Columna Izquierda: Detalles del Producto */}
      <div id="product-detail-left-col" className={`w-full p-4 md:p-8 overflow-y-auto relative bg-brand-bg scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent ${hasSynergy ? 'md:w-3/5 border-r border-slate-800' : ''}`}>
        
        {/* Navegación Superior */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-surface/50 hover:bg-brand-surface text-slate-300 hover:text-white transition-all border border-slate-700/50 group shadow-lg"
              title="Volver al listado"
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform text-brand-primary" />
              <span className="font-bold text-xs uppercase tracking-widest">Regresar</span>
            </button>
              
              <button 
                onClick={onClose}
                className="p-2.5 rounded-2xl bg-brand-surface/50 hover:bg-brand-surface text-slate-400 hover:text-brand-primary transition-all border border-slate-700/50 shadow-lg"
                title="Ir al inicio"
              >
                <Home className="w-5 h-5" />
              </button>

              <button 
                onClick={handlePrint}
                className="p-2.5 rounded-2xl bg-brand-surface/50 hover:bg-brand-surface text-slate-400 hover:text-brand-primary transition-all border border-slate-700/50 shadow-lg"
                title="Imprimir Ficha de Consultoría"
              >
                <Printer className="w-5 h-5" />
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
            <div className="absolute top-6 right-6 md:top-8 md:right-8 z-50">
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
              
              {/* Disclaimer de Consultoría */}
              <div className="mt-12 p-6 rounded-[2rem] bg-slate-900/50 border border-slate-800 border-dashed print:border-slate-300 print:text-slate-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-slate-500 mt-0.5 shrink-0 print:text-slate-700" />
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest print:text-slate-700">Aviso de Consultoría de Producto</p>
                    <p className="text-xs text-slate-500 leading-relaxed print:text-slate-700">
                      Esta información se proporciona exclusivamente con fines de consultoría técnica sobre productos naturales y suplementos. 
                      No constituye un diagnóstico médico, tratamiento o prescripción. Consulte siempre con un profesional de la salud calificado 
                      antes de iniciar cualquier régimen de suplementación.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {showPasswordPrompt && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-brand-surface p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl max-w-sm w-full mx-4 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-brand-primary/10 rounded-3xl flex items-center justify-center mb-6 mx-auto">
                <Lock className="w-8 h-8 text-brand-primary" />
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-2">Acceso Restringido</h3>
              <p className="text-slate-500 text-center text-sm mb-6">Ingresa la contraseña maestra para editar este registro.</p>
              
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    autoFocus
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña"
                    className="w-full bg-brand-bg border border-slate-700 rounded-2xl pl-12 pr-4 py-4 text-white focus:border-brand-primary outline-none transition-all shadow-inner"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPasswordPrompt(false)}
                    className="flex-1 px-6 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all border border-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-4 rounded-2xl bg-brand-primary hover:bg-brand-primary/80 text-white font-bold transition-all shadow-lg shadow-brand-primary/20"
                  >
                    Entrar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {hasSynergy && (
          /* Columna Derecha: Sinergia Clínica IA */
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
        )}
      </div>
    );

  if (isEmbedded) {
    return (
      <div className="w-full flex-1">
        {detailContent}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end p-2 md:p-4 bg-brand-bg/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={(e) => e.target === e.currentTarget && onClose()}>
      {detailContent}
    </div>
  );
};

