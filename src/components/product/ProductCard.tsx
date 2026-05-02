import React from 'react';
import { Product, SafetyStatus } from '../../core/types/product.types';
import { Badge } from '../ui/badge';
import { AlertTriangle, CheckCircle2, Info, Plus, Check, ShieldCheck, Brain, Printer } from 'lucide-react';
import { formatArrayToString } from '../../utils/formatters';
import { HighlightText } from '../ui/HighlightText';
import { useConsultation } from '../../context/ConsultationContext';
import { useSettings } from '../../context/SettingsContext';

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
  const { settings } = useSettings();
  const isSelectedForBrain = isInConsultation(product.sku);

  const getLineClamp = () => {
    if (viewMode === 'list') return 'line-clamp-2';
    
    // Mapeo explícito
    const clamps = {
      2: 'line-clamp-12',
      3: 'line-clamp-8',
      4: 'line-clamp-4',
      5: 'line-clamp-3'
    };
    
    return clamps[settings.gridColumns as keyof typeof clamps] || 'line-clamp-4';
  };

  const getTextSize = () => {
    if (viewMode === 'list') return { title: 'text-sm', principles: 'text-[11px]', indications: 'text-[11px]' };
    
    const sizes = {
      2: { title: 'text-xl', principles: 'text-sm', indications: 'text-[15px]' },
      3: { title: 'text-lg', principles: 'text-xs', indications: 'text-[13px]' },
      4: { title: 'text-sm', principles: 'text-[11px]', indications: 'text-[11px]' },
      5: { title: 'text-xs', principles: 'text-[9px]', indications: 'text-[10px]' }
    };
    
    const cols = settings.gridColumns as keyof typeof sizes;
    return sizes[cols] || sizes[4];
  };

  const sizes = getTextSize();

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
    <div className={`group relative flex ${viewMode === 'list' ? 'flex-row gap-3 sm:gap-4' : 'flex-col h-full'} bg-white/5 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-white/5 hover:border-brand-primary/40 hover:bg-brand-primary/[0.03] transition-all duration-300`}>
      
      <div 
        className={`flex justify-between items-start ${viewMode === 'list' ? 'mb-0' : 'mb-2'} cursor-pointer relative z-10 w-full`}
        onClick={() => onViewDetail?.(product)}
      >
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex flex-wrap items-center gap-1.5 mb-1 text-[10px]">
            {product.is_verified && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold uppercase tracking-widest text-[7px]">
                Verificado
              </span>
            )}
            {product.categoria_principal && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-bold uppercase tracking-widest text-[7px]">
                {product.categoria_principal}
              </span>
            )}
          </div>
          <h3 className={`${sizes.title} font-bold text-white leading-snug group-hover:text-brand-primary transition-colors line-clamp-1`}>
            <HighlightText text={capitalizeFirst(product.nombre_comercial)} searchTerm={searchTerm} />
          </h3>
          <p className={`${sizes.principles} text-slate-500 font-medium truncate italic`}>
            <HighlightText text={capitalizeFirst(formatArrayToString(product.principios_activos, ', '))} searchTerm={searchTerm} />
          </p>
        </div>
      </div>

      <div className={`flex-1 cursor-pointer relative z-10 flex flex-col`} onClick={() => onViewDetail?.(product)}>
        {/* Indicaciones - Large and clear Area */}
        <div className="mt-2 p-3 rounded-xl bg-white/[0.03] border border-white/5 group-hover:border-brand-primary/20 transition-all">
          <p className="text-[8px] uppercase font-black tracking-[0.2em] text-slate-600 mb-2">Indicaciones Principales</p>
          <div className={`${sizes.indications} text-slate-300 ${getLineClamp()} leading-relaxed font-medium`}>
            <HighlightText text={capitalizeFirst(formatArrayToString(product.indicaciones, ' • '))} searchTerm={searchTerm} />
          </div>
        </div>
      </div>

      {/* Footer Area - Minimal */}
      <div className="mt-3 flex items-center justify-between relative z-10">
        <div className="flex flex-wrap gap-1">
           {Array.isArray(product.tags_ia) && product.tags_ia.slice(0, 2).map(tag => (
              <span key={tag} className="text-[9px] text-slate-600 font-bold uppercase">#{tag}</span>
           ))}
        </div>
        
        <div className="flex items-center gap-2">
           <button
             onClick={(e) => {
               e.stopPropagation();
               onAddToTray?.(product);
             }}
             className={`p-1.5 rounded-lg transition-all ${
               isInTray 
                 ? 'bg-emerald-500 text-slate-950' 
                 : 'bg-white/5 text-slate-500 hover:bg-brand-primary/20 hover:text-brand-primary'
             }`}
             title={isInTray ? 'En Lista' : 'Añadir a Consulta'}
           >
             {isInTray ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
           </button>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';
