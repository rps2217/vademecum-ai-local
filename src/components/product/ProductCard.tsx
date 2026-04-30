import React from 'react';
import { Product, SafetyStatus } from '../../core/types/product.types';
import { Badge } from '../ui/badge';
import { AlertTriangle, CheckCircle2, Info, Plus, Check, ShieldCheck, Brain, Printer } from 'lucide-react';
import { formatArrayToString } from '../../utils/formatters';
import { HighlightText } from '../ui/HighlightText';
import { useConsultation } from '../../context/ConsultationContext';

interface ProductCardProps {
  product: Product;
  onViewDetail?: (product: Product) => void;
  onAddToTray?: (product: Product) => void;
  isInTray?: boolean;
  onTagClick?: (tag: string) => void;
  searchTerm?: string;
  viewMode: 'grid' | 'list';
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({ product, onViewDetail, onAddToTray, isInTray, onTagClick, searchTerm = '', viewMode }) => {
  const { addToConsultation, removeFromConsultation, isInConsultation } = useConsultation();
  const isSelectedForBrain = isInConsultation(product.sku);

  const getSafetyIcon = (status: SafetyStatus) => {
    switch (status) {
      case SafetyStatus.SI: return <CheckCircle2 className="w-3 h-3 text-emerald-500" />;
      case SafetyStatus.NO: return <AlertTriangle className="w-3 h-3 text-red-500" />;
      case SafetyStatus.PRECAUCION: return <Info className="w-3 h-3 text-amber-500" />;
    }
  };

  const getSafetyColor = (status: SafetyStatus) => {
    switch (status) {
      case SafetyStatus.SI: return 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10';
      case SafetyStatus.NO: return 'text-red-400 bg-red-500/5 border-red-500/10';
      case SafetyStatus.PRECAUCION: return 'text-amber-400 bg-amber-500/5 border-amber-500/10';
    }
  };

  const capitalizeFirst = (text: string) => {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  const handlePrintTicket = () => {
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
      // Esperar un poco a que cargue si hubiera imágenes, aunque aquí no hay
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const isGroundingSource = product.source_url === 'google_search' || product.source_url?.includes('google_search');

  return (
    <div className={`group relative flex ${viewMode === 'list' ? 'flex-row gap-3 sm:gap-4' : 'flex-col h-full'} bg-brand-surface rounded-xl p-3 sm:p-4 shadow-sm border border-slate-700/40 hover:border-emerald-500/40 transition-colors duration-200`}>
      
      <div 
        className={`flex justify-between items-start ${viewMode === 'list' ? 'mb-0' : 'mb-3'} cursor-pointer relative z-10 w-full`}
        onClick={() => onViewDetail?.(product)}
      >
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            {product.is_verified && (
              <span className="flex items-center gap-1 px-1 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[6px] sm:text-[7px] font-black text-emerald-400 uppercase tracking-widest">
                VERIFICADO
              </span>
            )}
          </div>
          <h3 className="text-sm sm:text-base font-bold text-white leading-tight group-hover:text-emerald-500 transition-colors line-clamp-2">
            <HighlightText text={capitalizeFirst(product.nombre_comercial)} searchTerm={searchTerm} />
          </h3>
          <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5 truncate">
            <HighlightText text={capitalizeFirst(formatArrayToString(product.principios_activos, ', '))} searchTerm={searchTerm} />
          </p>
        </div>
        <div className="text-[8px] sm:text-[9px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 whitespace-nowrap">
          {product.sku.substring(0, 8)}
        </div>
      </div>

      <div className={`mb-3 sm:mb-4 flex-1 cursor-pointer flex ${viewMode === 'list' ? 'hidden sm:flex flex-row gap-6' : 'flex-col gap-3'} relative z-10`} onClick={() => onViewDetail?.(product)}>
        {/* Indicaciones */}
        <div>
          <p className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-slate-600 mb-1">Indicaciones</p>
          <div className="text-[10px] sm:text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
            <HighlightText text={capitalizeFirst(formatArrayToString(product.indicaciones, ' • '))} searchTerm={searchTerm} />
          </div>
        </div>

        {/* Semáforo Integrado */}
        <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
          {[
            { label: 'EMB', status: product.apto_embarazo },
            { label: 'LAC', status: product.apto_lactancia },
            { label: 'PED', status: product.apto_pediatria }
          ].map((item, i) => (
            <div key={i} className={`flex flex-col sm:flex-row items-center justify-between px-1.5 sm:px-2 py-1 rounded-lg border text-[7px] sm:text-[8px] font-bold tracking-tighter ${getSafetyColor(item.status)}`}>
              <span className="mb-0.5 sm:mb-0">{item.label}</span>
              {getSafetyIcon(item.status)}
            </div>
          ))}
        </div>
      </div>

      {/* Tags de IA - Minimal - Hidden on small mobile to save space if needed, or smaller */}
      {Array.isArray(product.tags_ia) && product.tags_ia.length > 0 && (
        <div className={`mb-3 sm:mb-4 flex flex-wrap gap-1 relative z-10 ${viewMode === 'list' ? 'hidden sm:flex' : ''}`}>
          {product.tags_ia.slice(0, 2).map(tag => (
            <button 
              key={tag} 
              onClick={(e) => {
                e.stopPropagation();
                onTagClick?.(tag);
              }}
              className="px-1.5 sm:px-2 py-0.5 rounded bg-slate-800/50 border border-slate-700/50 text-[7px] sm:text-[8px] font-bold text-slate-500 hover:text-emerald-500 transition-colors uppercase tracking-tight"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Botones de Acción - Compactos */}
      <div className={`mt-auto pt-3 sm:pt-4 border-t border-slate-800/60 flex items-center gap-1.5 sm:gap-2 relative z-10 ${viewMode === 'list' ? 'ml-auto' : ''}`}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToTray?.(product);
          }}
          className={`flex items-center justify-center gap-1.5 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3 rounded-lg text-[8px] sm:text-[9px] font-bold uppercase tracking-tight transition-colors flex-1 min-w-[70px] sm:min-w-0 ${
            isInTray 
              ? 'bg-emerald-500 text-slate-950' 
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
          }`}
        >
          {isInTray ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          <span className="truncate">{isInTray ? 'En Lista' : 'Comparar'}</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isSelectedForBrain) {
                removeFromConsultation(product.sku);
              } else {
                addToConsultation(product);
              }
            }}
            className={`h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-lg transition-colors ${
              isSelectedForBrain 
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' 
                : 'bg-slate-800 text-slate-500 hover:text-emerald-500'
            }`}
            title={isSelectedForBrain ? 'Quitar del análisis' : 'Analizar Sinergias'}
          >
            <Brain className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isSelectedForBrain ? 'animate-pulse' : ''}`} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrintTicket();
            }}
            className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-lg bg-slate-800 text-slate-500 hover:text-white transition-colors"
            title="Imprimir Ticket (80mm)"
          >
            <Printer className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';
