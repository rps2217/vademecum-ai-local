import React, { memo, CSSProperties } from 'react';
import * as ReactWindow from 'react-window';
const List = (ReactWindow as any).List || (ReactWindow as any).default?.List || ReactWindow;
import { Product } from '../../../core/types/product.types';
import { Trash2, Cloud, Monitor, Sparkles } from 'lucide-react';

interface ProductMobileListProps {
  products: Product[];
  isLoading: boolean;
  onDelete: (sku: string) => void;
}

interface MobileRowData {
  products: Product[];
  onDelete: (sku: string) => void;
}

interface MobileRowProps {
  index: number;
  style: CSSProperties;
  data: MobileRowData;
}

const MobileRow = memo(({ index, style, data }: MobileRowProps) => {
  const { products, onDelete } = data;
  const p = products[index];

  if (!p) return null;

  return (
    <div style={style} className="p-4 hover:bg-slate-800/20 transition-colors border-b border-slate-800 bg-brand-surface">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            {p.is_synced_cloud ? (
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Monitor className="w-3.5 h-3.5 text-slate-600" />
            )}
            {p.synergy_analyzed && <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
          </div>
          <span className="font-mono text-[10px] text-slate-500 tracking-tighter">{p.sku}</span>
        </div>
        <button onClick={() => onDelete(p.sku)} className="p-2 text-slate-600 hover:text-red-400">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <h3 className="font-bold text-slate-100 leading-tight mb-2 pr-8 truncate font-sans tracking-tight">{p.nombre_comercial}</h3>
      <div className="flex flex-wrap gap-1 overflow-hidden h-[24px]">
        {(Array.isArray(p.principios_activos) ? p.principios_activos : []).slice(0, 3).map((pa, idx) => (
          <span key={idx} className="text-[9px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded-md border border-slate-700 font-medium whitespace-nowrap">
            {pa}
          </span>
        ))}
      </div>
    </div>
  );
});

export const ProductMobileList: React.FC<ProductMobileListProps> = ({ products, isLoading, onDelete }) => {
  return (
    <div className="block md:hidden">
      {isLoading ? (
        <div className="p-10 text-center text-slate-500 italic">Cargando datos...</div>
      ) : products.length === 0 ? (
        <div className="p-10 text-center text-slate-500">No hay registros.</div>
      ) : (
        <List
          height={600}
          itemCount={products.length}
          itemSize={130}
          width="100%"
          itemData={{ products, onDelete }}
        >
          {MobileRow}
        </List>
      )}
    </div>
  );
};
