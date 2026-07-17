import React, { useState, useRef, useEffect, useMemo, Suspense, lazy } from 'react';
import { useProductSearch } from './hooks/useProductSearch';
import { Product } from '../../core/types';

const ProductDetailModal = lazy(() => import('../product/ProductDetailModal').then(module => ({ default: module.ProductDetailModal })));

import { useTray } from '../../context/TrayContext';
import { SearchBar } from './components/SearchBar';
import { SearchResults } from './components/SearchResults';
import { QuickDiscoveryTags } from './components/QuickDiscoveryTags';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { Search, Grid3X3, List as ListIcon, X, Loader2 } from 'lucide-react';
import { historyService } from '../../services/HistoryService';
import { useStore } from '../../store/useStore';
import { searchService } from '../../services/SearchService';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/**
 * SearchModule - Simplified and Clean
 * Main interface for searching and browsing medications
 */
export const SearchModule: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    query, 
    setQuery, 
    isSearching,
    results,
  } = useProductSearch(false);
  
  const { viewedProductSku, setViewedProduct, products } = useStore();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [recentTerms, setRecentTerms] = useState<string[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoadingAll, setIsLoadingAll] = useState(true);
  
  const { toggleProduct, isInTray } = useTray();

  // Sync viewedProductSku from store
  useEffect(() => {
    if (viewedProductSku) {
      const p = products.find(p => p.sku === viewedProductSku);
      if (p) setSelectedProduct(p);
    } else {
      setSelectedProduct(null);
    }
  }, [viewedProductSku, products]);

  // Update recent terms
  useEffect(() => {
    setRecentTerms(historyService.getRecentTerms());
  }, []);

  // Load all products when no search query
  useEffect(() => {
    const loadAllProducts = async () => {
      setIsLoadingAll(true);
      try {
        const indexed = searchService.getAllIndexedProducts();
        if (indexed.length > 0) {
          setAllProducts(indexed);
          console.log('[SearchModule] Productos cargados del indice:', indexed.length);
        } else {
          // Fallback: get from Zustand store
          setAllProducts(products);
          console.log('[SearchModule] Productos del store:', products.length);
        }
      } catch (error) {
        console.error('[SearchModule] Error cargando productos:', error);
        setAllProducts(products);
      }
      setIsLoadingAll(false);
    };
    
    if (!query.trim()) {
      loadAllProducts();
    }
  }, [query, products]);

  // Keyboard shortcuts
  const shortcuts = useMemo(() => ({
    'Escape': () => {
      if (selectedProduct) setViewedProduct(null);
      else if (query) setQuery('');
    }
  }), [selectedProduct, query, setQuery, setViewedProduct]);

  useKeyboardShortcuts(shortcuts);

  // Track search
  useEffect(() => {
    if (results.length > 0 && !isSearching && query.length > 2) {
      const timer = setTimeout(() => {
        historyService.trackSearchTerm(query);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [query, results, isSearching]);

  const handleClear = () => {
    setQuery('');
    searchInputRef.current?.focus();
  };

  const handleProductClick = (product: Product) => {
    setViewedProduct(product.sku);
  };

  const handleAddToTray = (product: Product) => {
    toggleProduct(product);
  };

  const handleTagClick = (tag: string) => {
    setQuery(tag);
  };

  const hasResults = results.length > 0;
  const hasQuery = query.trim().length > 0;

  return (
    <div className="w-full min-h-screen bg-slate-50/50">
      {/* Hero Search Section */}
      <div className="bg-gradient-to-b from-white to-slate-50 border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 pt-8 pb-6">
          {/* Logo & Title */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <Search className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900">
                Vademécum
              </h1>
            </div>
            <p className="text-slate-500 text-sm">
              Busque por nombre, principio activo o indicación
            </p>
          </div>

          {/* Search Input */}
          <div className="relative">
            <SearchBar 
              ref={searchInputRef}
              query={query} 
              setQuery={setQuery} 
              isSearching={isSearching}
              className="bg-white shadow-lg border-slate-200"
            />
            {hasQuery && (
              <button
                onClick={handleClear}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            )}
          </div>

          {/* Quick Categories */}
          {!hasQuery && (
            <QuickDiscoveryTags onSelect={setQuery} />
          )}
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {isSearching ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
            <p className="text-slate-500">Buscando medicamentos...</p>
          </div>
        ) : hasResults ? (
          <>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-slate-900">
                  {results.length} {results.length === 1 ? 'resultado' : 'resultados'}
                </h2>
                {hasQuery && (
                  <Badge variant="muted">
                    para "{query}"
                  </Badge>
                )}
              </div>
              
              {/* View Toggle */}
              <div className="flex items-center bg-white rounded-xl border border-slate-200 p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'list' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Results */}
            <SearchResults 
              results={results}
              query={query}
              conditionFilters={[]}
              showOnlyVerified={false}
              isSearching={isSearching}
              isInTray={isInTray}
              onProductClick={handleProductClick}
              onAddToTray={handleAddToTray}
              onTagClick={handleTagClick}
              onClearFilters={handleClear}
              viewMode={viewMode}
            />
          </>
        ) : hasQuery && !isSearching ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Sin resultados
            </h3>
            <p className="text-slate-500 mb-4">
              No encontramos medicamentos para "{query}"
            </p>
            <Button variant="outline" onClick={handleClear}>
              Limpiar búsqueda
            </Button>
          </div>
        ) : !hasQuery && !isLoadingAll && allProducts.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-slate-900">
                  {allProducts.length} productos disponibles
                </h2>
              </div>
              <div className="flex items-center bg-white rounded-xl border border-slate-200 p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'grid'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'list'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            <SearchResults
              results={allProducts}
              query=""
              conditionFilters={[]}
              showOnlyVerified={false}
              isSearching={false}
              isInTray={isInTray}
              onProductClick={handleProductClick}
              onAddToTray={handleAddToTray}
              onTagClick={handleTagClick}
              onClearFilters={handleClear}
              viewMode={viewMode}
            />
          </>
        ) : !hasQuery && !isLoadingAll && allProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Sin productos
            </h3>
            <p className="text-slate-500 mb-4">
              No hay productos en el catálogo. Intenta recargar la página.
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Recargar
            </Button>
          </div>
        ) : null}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <Suspense fallback={null}>
          <ProductDetailModal 
            product={selectedProduct} 
            onClose={() => setViewedProduct(null)} 
            searchTerm={query}
            onTagClick={handleTagClick}
            isEmbedded={true}
          />
        </Suspense>
      )}
    </div>
  );
};

