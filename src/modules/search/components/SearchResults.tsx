import React from 'react';
import { Database, Search, Target, Sparkles } from 'lucide-react';
import * as ReactWindow from 'react-window';
import { Product } from '../../../core/types/product.types';
import { ProductCard } from '../../../components/product/ProductCard';
import { ProductSkeleton } from '../../../components/product/ProductSkeleton';

const { FixedSizeList: List } = ReactWindow as any;

interface SearchResultsProps {
  results: Product[];
  query: string;
  conditionFilters?: any;
  showOnlyVerified?: boolean;
  isSearching: boolean;
  isInTray: (sku: string) => boolean;
  onProductClick: (product: Product) => void;
  onAddToTray: (product: Product) => void;
  onTagClick: (tag: string) => void;
  onClearFilters: () => void;
  viewMode: 'grid' | 'list';
}

export const SearchResults = React.memo<SearchResultsProps>(({
  results,
  query,
  isSearching,
  isInTray,
  onProductClick,
  onAddToTray,
  onTagClick,
  onClearFilters,
  viewMode
}) => {
  const { exactMatches, relatedMatches } = React.useMemo(() => {
    if (!query.trim()) return { exactMatches: results, relatedMatches: [] };
    
    const normQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const exact: Product[] = [];
    const related: Product[] = [];
    
    results.forEach(product => {
      const name = (product.nombre_comercial || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const indications = (product.indicaciones || []).map(i => String(i).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
      const principals = (product.principios_activos || []).map(m => m.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
      
      const isExact = name.includes(normQuery) || 
                      indications.some(i => i.includes(normQuery)) || 
                      principals.some(p => p.includes(normQuery));
                      
      if (isExact) exact.push(product); else related.push(product);
    });
    
    return { exactMatches: exact, relatedMatches: related };
  }, [results, query]);

  if (isSearching && results.length === 0) {
    return (
      <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'} gap-4 animate-in fade-in duration-500`}>
        {[...Array(6)].map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (query.trim() === '') {
    return null;
  }

  if (results.length > 0) {
    const renderGrid = (items: Product[], title: string, Icon: any, colorClass: string) => {
      if (items.length === 0) return null;
      return (
        <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className={`p-2 rounded-xl ${colorClass.replace('text-', 'bg-').replace('500', '500/10')}`}>
              <Icon className={`w-4 h-4 ${colorClass}`} />
            </div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-100">
              {title} <span className="ml-2 text-slate-500 font-medium">({items.length})</span>
            </h3>
            <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent ml-4" />
          </div>
          
          <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'} gap-5`}>
            {items.map((product) => (
              <div key={product.sku} className="group">
                <ProductCard 
                  product={product} 
                  onViewDetail={onProductClick}
                  onAddToTray={onAddToTray}
                  isInTray={isInTray(product.sku)}
                  onTagClick={onTagClick}
                  searchTerm={query}
                  viewMode={viewMode}
                />
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div className="w-full">
        <div className="text-sm text-slate-400 mb-8 font-medium px-2 flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-4">
            <span className="bg-white/5 px-3 py-1 rounded-full border border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-300">
              {results.length === 50 ? '50+' : results.length} Hallazgos
            </span>
          </div>
          <button 
            onClick={onClearFilters}
            className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-emerald-500 transition-colors"
          >
            Limpiar búsqueda
          </button>
        </div>
        
        <div className="w-full">
          {renderGrid(exactMatches, "Coincidencias Directas", Target, "text-emerald-400")}
          
          {exactMatches.length > 0 && relatedMatches.length > 0 && (
            <div className="py-8" />
          )}

          {renderGrid(relatedMatches, "Resultados Relacionados", Sparkles, "text-blue-400")}
        </div>
      </div>
    );
  }

  if (!isSearching) {
    return (
      <div className="text-center py-20 bg-brand-surface/30 rounded-3xl border border-slate-800">
        <Search className="w-12 h-12 text-slate-700 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-200">No se encontraron resultados</h3>
        <p className="text-slate-500 mt-2">
          Intenta con otros términos o nombres comerciales.
        </p>
        <button 
          onClick={onClearFilters}
          className="mt-4 px-4 py-2 bg-brand-surface hover:bg-slate-700 text-slate-300 rounded-xl transition-colors text-sm"
        >
          Limpiar búsqueda
        </button>
      </div>
    );
  }

  return null;
});

