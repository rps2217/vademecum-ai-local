import React, { useState, useRef, useEffect, useMemo, Suspense, lazy } from 'react';
import { useProductSearch } from './hooks/useProductSearch';
import { Product } from '../../core/types';

const ProductDetailModal = lazy(() => import('../product/ProductDetailModal').then(module => ({ default: module.ProductDetailModal })));

import { useTray } from '../../context/TrayContext';
import { SearchBar } from './components/SearchBar';
import { SearchResults } from './components/SearchResults';
import { QuickDiscoveryTags } from './components/QuickDiscoveryTags';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { Search, Grid3X3, List as ListIcon, X, Loader2, Sparkles } from 'lucide-react';
import { historyService } from '../../services/HistoryService';
import { useStore } from '../../store/useStore';
import { searchService } from '../../services/SearchService';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/**
 * SearchModule - Modern Medical Interface
 * Sophisticated search experience for healthcare professionals
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
        } else {
          setAllProducts(products);
        }
      } catch (error) {
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
    <div className="w-full">
      {/* Hero Search Section - Glass morphism */}
      <div className="relative">
        {/* Decorative background */}
        <div className="absolute inset-x-0 -top-20 h-40 bg-gradient-to-b from-teal-500/5 to-transparent pointer-events-none" />
        
        <div className="max-w-3xl mx-auto px-4 pt-8 pb-10">
          {/* Logo & Title */}
          <div className="text-center mb-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-xl shadow-teal-500/30 transform hover:scale-105 transition-transform">
                  <Search className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-teal-400 to-teal-600 opacity-30 blur-xl -z-10" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">
              Vademécum <span className="text-gradient">Inteligente</span>
            </h1>
            <p className="text-slate-500 text-base font-medium">
              Busque por nombre, principio activo o indicación médica
            </p>
          </div>

          {/* Search Input - Floating card style */}
          <div className="relative group animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500/20 to-teal-600/20 rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative">
              <SearchBar 
                ref={searchInputRef}
                query={query} 
                setQuery={setQuery} 
                isSearching={isSearching}
                className="bg-white/95 backdrop-blur-lg border-0 shadow-xl rounded-2xl"
              />
            </div>
            {hasQuery && (
              <button
                onClick={handleClear}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 hover:bg-slate-100 rounded-xl transition-all group/clear"
              >
                <X className="w-5 h-5 text-slate-400 group-hover/clear:text-slate-600 transition-colors" />
              </button>
            )}
          </div>

          {/* Quick Categories - Floating tags */}
          {!hasQuery && (
            <div className="mt-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <QuickDiscoveryTags onSelect={setQuery} />
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {isSearching ? (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/30">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <div className="absolute inset-0 rounded-full bg-teal-400 animate-ping opacity-20" />
            </div>
            <p className="mt-4 text-slate-500 font-medium">Buscando medicamentos...</p>
          </div>
        ) : hasResults ? (
          <>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6 animate-fade-in-up">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-teal-600" />
                  <h2 className="text-xl font-bold text-slate-900">
                    {results.length} {results.length === 1 ? 'resultado' : 'resultados'}
                  </h2>
                </div>
                {hasQuery && (
                  <Badge className="bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100">
                    para "{query}"
                  </Badge>
                )}
              </div>
              
              {/* View Toggle - Glass style */}
              <div className="flex items-center glass rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 rounded-lg transition-all duration-300 ${
                    viewMode === 'grid' 
                      ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg' 
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 rounded-lg transition-all duration-300 ${
                    viewMode === 'list' 
                      ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg' 
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
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
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in-up">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
                <Search className="w-10 h-10 text-slate-400" />
              </div>
              <div className="absolute -inset-4 rounded-full border-2 border-dashed border-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Sin resultados
            </h3>
            <p className="text-slate-500 mb-6 max-w-md">
              No encontramos medicamentos para "{query}". Intenta con otros términos de búsqueda.
            </p>
            <Button 
              variant="outline" 
              onClick={handleClear}
              className="px-6 border-teal-200 text-teal-700 hover:bg-teal-50 hover:border-teal-300"
            >
              <X className="w-4 h-4 mr-2" />
              Limpiar búsqueda
            </Button>
          </div>
        ) : !hasQuery && !isLoadingAll && allProducts.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-6 animate-fade-in-up">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                  <h2 className="text-xl font-bold text-slate-900">
                    {allProducts.length.toLocaleString()} productos disponibles
                  </h2>
                </div>
              </div>
              <div className="flex items-center glass rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 rounded-lg transition-all duration-300 ${
                    viewMode === 'grid'
                      ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 rounded-lg transition-all duration-300 ${
                    viewMode === 'list'
                      ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
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
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in-up">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
              <Search className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Sin productos
            </h3>
            <p className="text-slate-500 mb-6 max-w-md">
              No hay productos en el catálogo. Intenta recargar la página para sincronizar.
            </p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="px-6 border-teal-200 text-teal-700 hover:bg-teal-50"
            >
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

