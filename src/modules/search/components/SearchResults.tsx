import React from 'react';
import { Database, Search } from 'lucide-react';
import { Product } from '../../../core/types/product.types';
import { ProductCard } from '../../../components/product/ProductCard';
import { ProductSkeleton } from '../../../components/product/ProductSkeleton';

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

export const SearchResults: React.FC<SearchResultsProps> = ({
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
    return (
      <div>
        <p className="text-sm text-slate-400 mb-4 font-medium px-2 flex items-center justify-between">
          <span>
            {results.length === 50 ? 'Más de 50' : results.length} resultados 
            {query.trim() && ` para "${query}"`}
          </span>
          <button 
            onClick={onClearFilters}
            className="text-emerald-500 hover:text-emerald-400 hover:underline"
          >
            Limpiar búsqueda
          </button>
        </p>
        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'} gap-4`}>
          {results.map((product) => (
            <ProductCard 
              key={product.sku} 
              product={product} 
              onViewDetail={onProductClick}
              onAddToTray={onAddToTray}
              isInTray={isInTray(product.sku)}
              onTagClick={onTagClick}
              searchTerm={query}
            />
          ))}
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
};

