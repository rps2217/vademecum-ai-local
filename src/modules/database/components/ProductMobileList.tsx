import React, { memo, CSSProperties } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Product } from '../../../core/types/product.types';
import { Trash2, Cloud, Monitor, Sparkles, ChevronRight } from 'lucide-react';
import { useStore } from '../../../store/useStore';

interface ProductMobileListProps {
  products: Product[];
  isLoading: boolean;
  onDelete: (sku: string) => void;
}

interface MobileRowData {
  products: Product[];
  onDelete: (sku: string) => void;
  onView: (sku: string) => void;
}

interface MobileRowProps {
  index: number;
  style: CSSProperties;
  data: MobileRowData;
}

const MobileRow = memo(({ index, style, data }: MobileRowProps) => {
  const { products, onDelete, onView } = data;
  const p = products[index];

  if (!p) return null;

  return (
    <div 
      style={style} 
      className="p-4 hover:bg-muted/50 transition-colors border-b border-border bg-card cursor-pointer group flex flex-col justify-center"
      onClick={() => onView(p.sku)}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            {p.is_synced_cloud ? (
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Monitor className="w-3.5 h-3.5 text-muted-foreground" />
            )}
            {p.synergy_analyzed && <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
          </div>
          <span className="font-mono text-[10px] text-muted-foreground tracking-tighter">{p.sku}</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(p.sku); }} 
            className="p-2 text-muted-foreground hover:text-red-400"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
      <h3 className="font-bold text-foreground leading-tight mb-2 pr-8 truncate font-sans tracking-tight group-hover:text-primary transition-colors">{p.nombre_comercial}</h3>
      <div className="flex flex-wrap gap-1 overflow-hidden h-[24px]">
        {(Array.isArray(p.principios_activos) ? p.principios_activos : []).slice(0, 3).map((pa, idx) => (
          <span key={idx} className="text-[9px] px-1.5 py-0.5 bg-card text-muted-foreground rounded-md border border-border font-medium whitespace-nowrap">
            {pa}
          </span>
        ))}
      </div>
    </div>
  );
});

export const ProductMobileList: React.FC<ProductMobileListProps> = ({ products, isLoading, onDelete }) => {
  const setViewedProduct = useStore(state => state.setViewedProduct);
  return (
    <div className="block md:hidden">
      {isLoading ? (
        <div className="p-10 text-center text-muted-foreground italic">Cargando datos...</div>
      ) : products.length === 0 ? (
        <div className="p-10 text-center text-muted-foreground">No hay registros.</div>
      ) : (
        <List
          height={600}
          itemCount={products.length}
          itemSize={130}
          width="100%"
          itemData={{ products, onDelete, onView: setViewedProduct }}
        >
          {MobileRow}
        </List>
      )}
    </div>
  );
};

