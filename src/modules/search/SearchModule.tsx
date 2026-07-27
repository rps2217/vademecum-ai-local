import React, { useState, useRef, useEffect, useMemo, Suspense, lazy } from 'react';
import { useProductSearch } from './hooks/useProductSearch';
import { Product } from '../../core/types';

const ProductDetailModal = lazy(() => import('../product/ProductDetailModal').then(module => ({ default: module.ProductDetailModal })));

import { useTray } from '../../context/TrayContext';
import { SearchBar } from './components/SearchBar';
import { SearchResults } from './components/SearchResults';
import { SemanticSearchPanel } from './components/SemanticSearchPanel';
import { HeroSearch } from './components/HeroSearch';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { Search, Grid3X3, List as ListIcon, X, Loader2, Sparkles, Brain, TrendingUp, Clock, FileText } from 'lucide-react';
import { historyService } from '../../services/HistoryService';
import { dataService } from '../../services/DataService';
import { useStore } from '../../store/useStore';
import { searchService } from '../../services/SearchService';
import { logger } from '../../services/LoggerService';
import { supabaseSyncService } from '../../services/SupabaseSyncService';
import { ProtocolCard, ProtocolDetail } from '../protocols/components';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Protocol } from '../../core/types/schema.types';

/**
 * SearchModule - Hero Search Interface
 * El buscador es el protagonista absoluto
 */
export const SearchModule: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isSemanticSearchOpen, setIsSemanticSearchOpen] = useState(false);
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
  
  // Protocols state
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [isLoadingProtocols, setIsLoadingProtocols] = useState(true);

  // Abrir búsqueda semántica con Ctrl+Shift+S
  useKeyboardShortcuts({
    'Control+Shift+S': () => setIsSemanticSearchOpen(true),
  });

  // Update recent terms
  useEffect(() => {
    setRecentTerms(historyService.getRecentTerms());
  }, []);

  // Load all products
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoadingAll(true);
      try {
        const allProds = await dataService.getProducts();
        setAllProducts(allProds);
      } catch (error) {
        logger.error('Error loading products', 'SearchModule', error);
      }
      setIsLoadingAll(false);
    };
    loadProducts();
  }, []);

  // Load protocols from Supabase
  useEffect(() => {
    const loadProtocols = async () => {
      setIsLoadingProtocols(true);
      try {
        const data = await supabaseSyncService.fetchProtocols();
        setProtocols(data.slice(0, 3)); // Solo los primeros 3 para mostrar
      } catch (error) {
        logger.error('Error loading protocols', 'SearchModule', error);
      }
      setIsLoadingProtocols(false);
    };
    loadProtocols();
  }, []);

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
        // Primero esperar a que el índice esté listo
        await searchService.initializeIndex();
        
        const indexed = searchService.getAllIndexedProducts();
        logger.debug('Productos del índice: ' + indexed.length, 'SearchModule');
        logger.debug('Productos del store: ' + products.length, 'SearchModule');
        
        if (indexed.length > 0) {
          setAllProducts(indexed);
        } else if (products.length > 0) {
          // Fallback al store si el índice está vacío
          logger.debug('Usando fallback del store', 'SearchModule');
          setAllProducts(products);
        } else {
          // Intentar obtener directamente de la BD
          logger.debug('Buscando en DataService...', 'SearchModule');
          const fromService = await dataService.getAllProducts();
          logger.debug('Productos de DataService: ' + fromService.length, 'SearchModule');
          setAllProducts(fromService);
        }
      } catch (error) {
        logger.error('Error cargando productos', 'SearchModule', error);
        // Último fallback
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
      {/* Hero Search - EL PROTAGONISTA ABSOLUTO */}
      <div className="relative min-h-[70vh] flex flex-col items-center justify-center px-4 py-12">
        {/* Fondo decorativo con gradiente radial */}
        <div className="absolute inset-0 bg-gradient-to-b from-violet-50/50 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-radial from-violet-200/20 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        {/* Logo minimalista */}
        <div className="mb-8 text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight mb-2">
            Vademécum <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">IA</span>
          </h1>
          <p className="text-slate-500 text-lg">
            Tu asistente inteligente de suplementación
          </p>
        </div>

        {/* HERO SEARCH - El input más importante */}
        <div className="w-full max-w-3xl relative z-10">
          <HeroSearch 
            onSearch={(q) => setQuery(q)}
            onSelectIngredient={(ing) => logger.info(('Selected:', ing)}
            placeholder="¿Qué necesitas? Ej: algo para dormir, ansiedad, defensas..."
          />
        </div>

        {/* Stats rápidos */}
        <div className="mt-8 flex items-center gap-8 text-sm text-slate-500 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>+2,196 productos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
            <span>+200 ingredientes KB</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <span>40+ sinergias</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>5 protocolos</span>
          </div>
        </div>

        {/* Protocolos Destacados */}
        {!hasQuery && protocols.length > 0 && (
          <div className="mt-12 w-full max-w-5xl relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-bold text-slate-800">Protocolos Destacados</h3>
              </div>
              <button className="text-sm text-violet-600 hover:text-violet-700 font-medium">
                Ver todos →
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {protocols.map(protocol => (
                <ProtocolCard
                  key={protocol.id}
                  protocol={protocol}
                  onClick={setSelectedProtocol}
                />
              ))}
            </div>
          </div>
        )}
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

      {/* Protocol Detail Modal */}
      {selectedProtocol && (
        <ProtocolDetail
          protocol={selectedProtocol}
          onClose={() => setSelectedProtocol(null)}
          onStartProtocol={(protocol) => {
            logger.info(('Iniciar protocolo:', protocol);
            setSelectedProtocol(null);
          }}
        />
      )}

      {/* Semantic Search Panel */}
      {isSemanticSearchOpen && (
        <SemanticSearchPanel
          onClose={() => setIsSemanticSearchOpen(false)}
          onSelectIngredient={(ingredient) => {
            // Cuando se selecciona un ingrediente, buscar productos que lo contengan
            setQuery(ingredient.nombre);
            setIsSemanticSearchOpen(false);
          }}
        />
      )}
    </div>
  );
};

