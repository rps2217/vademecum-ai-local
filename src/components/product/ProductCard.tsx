import React from 'react';
import { Product, SafetyStatus } from '../../core/types/product.types';
import { Badge } from '../ui/badge';
import { AlertTriangle, CheckCircle2, Info, Plus, Check, ShieldCheck, Brain, Printer, ArrowUpRight } from 'lucide-react';
import { formatArrayToString } from '../../utils/formatters';
import { HighlightText } from '../ui/HighlightText';
import { useConsultation } from '../../context/ConsultationContext';
import { useSettings } from '../../context/SettingsContext';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

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
  const { isInConsultation } = useConsultation();
  const { settings } = useSettings();
  const isSelectedForBrain = isInConsultation(product.sku);

  const capitalizeFirst = (text: string) => {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  return (
    <div 
      className={cn(
        "group relative flex flex-col bg-card hover:bg-accent/5 transition-all duration-300 border-2 border-transparent hover:border-accent shadow-sm hover:shadow-md cursor-pointer overflow-hidden",
        viewMode === 'list' ? 'flex-row min-h-[120px] rounded-xl' : 'h-full rounded-2xl p-6'
      )}
      onClick={() => onViewDetail?.(product)}
    >
      {/* Indicadores Clínicos Superiores */}
      <div className="flex flex-wrap gap-2 mb-4">
        {product.is_verified && (
          <Badge variant="success" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5">
            Verificado
          </Badge>
        )}
        {product.categoria_principal && (
          <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5">
            {product.categoria_principal}
          </Badge>
        )}
      </div>

      {/* Título y Molécula Principal */}
      <div className="space-y-1 mb-4 flex-1">
        <h3 className="text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-1">
          <HighlightText text={capitalizeFirst(product.nombre_comercial)} searchTerm={searchTerm} />
        </h3>
        <p className="text-xs font-medium text-muted-foreground italic line-clamp-1">
          <HighlightText text={capitalizeFirst(formatArrayToString(product.principios_activos, ', '))} searchTerm={searchTerm} />
        </p>
      </div>

      {/* Cuerpo de Indicaciones */}
      <div className="bg-muted/30 rounded-xl p-4 mb-4 border group-hover:border-accent transition-colors">
        <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
          <Info className="h-3 w-3" />
          Indicaciones
        </p>
        <div className="text-[13px] leading-relaxed font-medium text-foreground line-clamp-3">
          {product.indicaciones.map((ind, idx) => (
            <React.Fragment key={idx}>
              <HighlightText text={capitalizeFirst(ind)} searchTerm={searchTerm} />
              {idx < product.indicaciones.length - 1 && (
                <span className="mx-1.5 text-primary">•</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Footer del Card */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex -space-x-1">
           {Array.isArray(product.tags_ia) && product.tags_ia.slice(0, 3).map(tag => (
              <span key={tag} className="text-[9px] text-muted-foreground font-bold uppercase mr-3">
                #{tag}
              </span>
           ))}
        </div>
        
        <div className="flex items-center gap-2">
           <Button
             variant={isInTray ? "default" : "outline"}
             size="icon"
             className={cn(
               "h-9 w-9 rounded-xl transition-all",
               isInTray ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200" : ""
             )}
             onClick={(e) => {
               e.stopPropagation();
               onAddToTray?.(product);
             }}
           >
             {isInTray ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
           </Button>
           
           <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-muted/50 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowUpRight className="h-4 w-4" />
           </div>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';
