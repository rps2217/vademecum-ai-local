/**
 * SearchModule - Búsqueda Minimalista
 * El buscador es el protagonista absoluto
 */

import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import { useProductSearch } from './hooks/useProductSearch';
import { Product } from '../../core/types';
import { HeroSearchSimple } from './components/HeroSearchSimple';
import { Search, Grid3X3, List, Loader2, Plus, Check } from 'lucide-react';
import { useTray } from '../../context/TrayContext';
import { useStore } from '../../store/useStore';
import { cn } from '../../lib/utils';

const ProductDetailModal = lazy(() => 
  import('../product/ProductDetailModal').then(m => ({ default: m.ProductDetailModal }))
);

export const SearchModuleSimple: React.FC = () => {
  const { query, setQuery, isSearching, results } = useProductSearch(false);
  const { viewedProductSku, setViewedProduct, products } = useStore();
  const { toggleProduct, isInTray } = useTray();
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Sync selected product
  useEffect(() => {
    if (viewedProductSku) {
      const p = products.find(p => p.sku === viewedProductSku);
      if (p) setSelectedProduct(p);
    } else {
      setSelectedProduct(null);
    }
  }, [viewedProductSku, products]);

  // Handlers
  const handleProductClick = useCallback((product: Product) => {
    setViewedProduct(product.sku);
  }, [setViewedProduct]);

  const handleAddToTray = useCallback((product: Product) => {
    toggleProduct(product);
  }, [toggleProduct]);

  const hasResults = results.length > 0;
  const hasQuery = query.trim().length > 0;

  return (
    <div className="w-full min-h-screen flex flex-col">
      {/* Header minimalista */}
      <div className="flex-shrink-0 py-6 px-4">
        <h1 className="text-center text-3xl font-bold text-slate-800 mb-6">
          Vademécum <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">IA</span>
        </h1>
        
        {/* Buscador protagonista */}
        <HeroSearchSimple 
          onSearch={(q) => setQuery(q)}
          onSelectProduct={(p) => {
            // Buscar producto en resultados
            const found = products.find(prod => prod.sku === p.sku);
            if (found) handleProductClick(found);
          }}
        />

        {/* Stats */}
        {!hasQuery && (
          <div className="flex justify-center gap-6 mt-6 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              +2,196 productos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-violet-500" />
              +200 ingredientes
            </span>
          </div>
        )}
      </div>

      {/* Resultados */}
      <div className="flex-1 px-4 pb-8">
        {isSearching ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-3" />
            <p className="text-slate-500">Buscando...</p>
          </div>
        ) : hasResults ? (
          <>
            {/* Header de resultados */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-600">
                <span className="font-semibold text-slate-800">{results.length}</span> resultados
                {hasQuery && <span className="text-slate-400"> para "{query}"</span>}
              </p>
              
              {/* Toggle vista */}
              <div className="flex bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-2 rounded-md transition-all",
                    viewMode === 'grid' ? 'bg-white shadow text-violet-600' : 'text-slate-500'
                  )}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-2 rounded-md transition-all",
                    viewMode === 'list' ? 'bg-white shadow text-violet-600' : 'text-slate-500'
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Grid de productos */}
            <div className={cn(
              "grid gap-4",
              viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
            )}>
              {results.map((product) => (
                <ProductCard
                  key={product.sku}
                  product={product}
                  viewMode={viewMode}
                  isInTray={isInTray(product.sku)}
                  onView={() => handleProductClick(product)}
                  onAdd={() => handleAddToTray(product)}
                />
              ))}
            </div>
          </>
        ) : hasQuery && !isSearching ? (
          <div className="text-center py-20">
            <p className="text-slate-500 mb-2">No encontramos resultados para "{query}"</p>
            <p className="text-sm text-slate-400">Intenta con otros términos</p>
          </div>
        ) : null}
      </div>

      {/* Modal de detalle */}
      {selectedProduct && (
        <Suspense fallback={null}>
          <ProductDetailModal 
            product={selectedProduct} 
            onClose={() => setViewedProduct(null)} 
            searchTerm={query}
            onTagClick={(tag) => setQuery(tag)}
            isEmbedded={true}
          />
        </Suspense>
      )}
    </div>
  );
};

// Producto card simple
interface ProductCardProps {
  product: Product;
  viewMode: 'grid' | 'list';
  isInTray: boolean;
  onView: () => void;
  onAdd: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, viewMode, isInTray, onView, onAdd }) => {
  const principles = product.principios_activos || [];
  const firstPrinciple = principles[0] || '';

  return (
    <div 
      className={cn(
        "bg-white rounded-xl border border-slate-200 p-4",
        "hover:border-violet-300 hover:shadow-lg hover:shadow-violet-500/10",
        "transition-all duration-200 cursor-pointer",
        viewMode === 'list' && "flex items-center gap-4"
      )}
      onClick={onView}
    >
      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-slate-800 line-clamp-2 mb-1">
          {product.nombre_comercial || product.sku}
        </h3>
        {firstPrinciple && (
          <p className="text-sm text-slate-500 line-clamp-1">{firstPrinciple}</p>
        )}
        {principles.length > 1 && (
          <p className="text-xs text-slate-400 mt-1">+{principles.length - 1} más</p>
        )}
      </div>

      {/* Botón agregar */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAdd();
        }}
        className={cn(
          "flex-shrink-0 p-2.5 rounded-xl transition-all",
          isInTray 
            ? "bg-emerald-100 text-emerald-600" 
            : "bg-violet-100 text-violet-600 hover:bg-violet-200"
        )}
      >
        {isInTray ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
      </button>
    </div>
  );
};

export default SearchModuleSimple;
