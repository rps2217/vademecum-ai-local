import React, { memo, CSSProperties } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Product } from '../../../core/types/product.types';
import { Cloud, Monitor, Sparkles, RefreshCw, CheckCircle, Trash2, CloudOff } from 'lucide-react';

interface ProductTableProps {
  products: Product[];
  isLoading: boolean;
  onDelete: (sku: string) => void;
}

interface RowData {
  products: Product[];
  onDelete: (sku: string) => void;
}

interface RowProps {
  index: number;
  style: CSSProperties;
  data: RowData;
}

const Row = memo(({ index, style, data }: RowProps) => {
  const { products, onDelete } = data;
  const p = products[index];

  if (!p) return null;

  return (
    <div style={style} className="flex border-b border-border hover:bg-card transition-colors bg-card group">
      <div className="w-[120px] px-6 flex items-center shrink-0">
        {p.is_synced_cloud ? (
          <div className="flex items-center gap-2 text-emerald-400" title="Respaldado en la nube">
            <Cloud className="w-4 h-4" />
            <CheckCircle className="w-3 h-3" />
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground" title="Solo local (Pendiente de respaldo)">
            <Monitor className="w-4 h-4" />
            <CloudOff className="w-3 h-3 opacity-50" />
          </div>
        )}
      </div>
      <div className="w-[120px] px-6 flex items-center shrink-0">
        {p.synergy_analyzed ? (
          <div className="flex items-center gap-2 text-amber-500" title="Analizado por IA">
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">OK</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-700" title="Pendiente de análisis">
            <RefreshCw className="w-4 h-4 opacity-30" />
            <span className="text-[10px] font-bold uppercase tracking-tighter opacity-30">PND</span>
          </div>
        )}
      </div>
      <div className="w-[120px] px-6 flex items-center font-mono text-[10px] text-muted-foreground shrink-0">
        {p.sku}
      </div>
      <div className="flex-1 px-6 flex items-center font-bold text-foreground leading-tight min-w-[200px] font-sans tracking-tight">
        {p.nombre_comercial}
      </div>
      <div className="w-[200px] px-6 flex items-center text-muted-foreground text-xs truncate shrink-0">
        {Array.isArray(p.principios_activos) ? p.principios_activos.join(', ') : ''}
      </div>
      <div className="w-[100px] px-6 flex items-center justify-end shrink-0">
        <button onClick={() => onDelete(p.sku)} className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

export const ProductTable: React.FC<ProductTableProps> = ({ products, isLoading, onDelete }) => {
  return (
    <div className="hidden md:block overflow-x-auto">
      <div className="min-w-[860px]">
        {/* Header */}
        <div className="flex bg-card text-muted-foreground border-b border-border font-bold text-sm h-12">
          <div className="w-[120px] px-6 flex items-center shrink-0 uppercase tracking-wider text-[10px]">Cloud</div>
          <div className="w-[120px] px-6 flex items-center shrink-0 uppercase tracking-wider text-[10px]">Sinergia</div>
          <div className="w-[120px] px-6 flex items-center shrink-0 uppercase tracking-wider text-[10px]">SKU</div>
          <div className="flex-1 px-6 flex items-center min-w-[200px] uppercase tracking-wider text-[10px]">Producto</div>
          <div className="w-[200px] px-6 flex items-center shrink-0 uppercase tracking-wider text-[10px]">Compuestos</div>
          <div className="w-[100px] px-6 flex items-center justify-end shrink-0 uppercase tracking-wider text-[10px]">Acciones</div>
        </div>
        
        {/* Body */}
        {isLoading ? (
          <div className="h-[400px] flex items-center justify-center text-muted-foreground border-b border-border italic">
            Cargando datos...
          </div>
        ) : products.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center text-muted-foreground border-b border-border">
            No hay registros.
          </div>
        ) : (
          <List
            height={400}
            itemCount={products.length}
            itemSize={64}
            width="100%"
            itemData={{ products, onDelete }}
          >
            {Row}
          </List>
        )}
      </div>
    </div>
  );
};
