import React, { memo } from 'react';
import * as ReactWindow from 'react-window';
const List = (ReactWindow as any).List || (ReactWindow as any).FixedSizeList;
import { Product } from '../../../core/types/product.types';
import { Cloud, Monitor, Sparkles, RefreshCw, CheckCircle, Trash2, CloudOff } from 'lucide-react';

interface ProductTableProps {
  products: Product[];
  isLoading: boolean;
  onDelete: (sku: string) => void;
}

const Row = memo(({ index, style, data }: any) => {
  const { products, onDelete } = data;
  const p = products[index];

  return (
    <div style={style} className="flex border-b border-slate-800 hover:bg-slate-800/20 transition-colors bg-brand-surface group">
      <div className="w-[120px] px-6 flex items-center shrink-0">
        {p.synced ? (
          <div className="flex items-center gap-2 text-emerald-400" title="Respaldado en la nube">
            <Cloud className="w-4 h-4" />
            <CheckCircle className="w-3 h-3" />
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-600" title="Solo local (Pendiente de respaldo)">
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
      <div className="w-[120px] px-6 flex items-center font-mono text-[10px] text-slate-500 shrink-0">
        {p.sku}
      </div>
      <div className="flex-1 px-6 flex items-center font-bold text-white leading-tight min-w-[200px]">
        {p.nombre_comercial}
      </div>
      <div className="w-[200px] px-6 flex items-center text-slate-400 text-xs truncate shrink-0">
        {Array.isArray(p.principios_activos) ? p.principios_activos.join(', ') : ''}
      </div>
      <div className="w-[100px] px-6 flex items-center justify-end shrink-0">
        <button onClick={() => onDelete(p.sku)} className="p-1.5 text-slate-600 hover:text-red-500 transition-colors">
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
        <div className="flex bg-slate-900 text-slate-400 border-b border-slate-700 font-bold text-sm h-12">
          <div className="w-[120px] px-6 flex items-center shrink-0">Cloud</div>
          <div className="w-[120px] px-6 flex items-center shrink-0">Sinergia</div>
          <div className="w-[120px] px-6 flex items-center shrink-0">SKU</div>
          <div className="flex-1 px-6 flex items-center min-w-[200px]">Producto</div>
          <div className="w-[200px] px-6 flex items-center shrink-0">Compuestos</div>
          <div className="w-[100px] px-6 flex items-center justify-end shrink-0">Acciones</div>
        </div>
        
        {/* Body */}
        {isLoading ? (
          <div className="h-[400px] flex items-center justify-center text-slate-500 border-b border-slate-800">
            Cargando datos...
          </div>
        ) : products.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center text-slate-500 border-b border-slate-800">
            No hay registros.
          </div>
        ) : (
            <List
              height={600}
              itemCount={products.length}
              itemSize={64}
              width="100%"
              itemData={{ products, onDelete }}
            >
              {Row as any}
            </List>
        )}
      </div>
    </div>
  );
};
