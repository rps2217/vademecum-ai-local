import React, { useState, useRef, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import { useProductSearch } from './hooks/useProductSearch';
import { Product, ClinicalSearchInterpretation } from '../../core/types';
// Lazy loading heavy components
const ProductDetailModal = lazy(() => import('../product/ProductDetailModal').then(module => ({ default: module.ProductDetailModal })));
const AIAnalysisModal = lazy(() => import('./components/AIAnalysisModal').then(module => ({ default: module.AIAnalysisModal })));

import { useTray } from '../../context/TrayContext';
import { SearchBar } from './components/SearchBar';
import { SearchResults } from './components/SearchResults';
import { QuickDiscoveryTags } from './components/QuickDiscoveryTags';
import { ScenarioInterpretationOverlay } from './components/ScenarioInterpretationOverlay';
import { useConsultation } from '../../context/ConsultationContext';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { logger } from '../../services/LoggerService';
import { Brain, LayoutGrid, List, History, Sparkles, Filter } from 'lucide-react';
import { aiService } from '../../services/AIService';
import { historyService } from '../../services/HistoryService';
import { searchService } from '../../services/SearchService';
import { COMMON_PATHOLOGIES } from '../../constants/pathologies';
import { SearchConcept } from './components/SearchSuggestions';
import { AnimatePresence } from 'motion/react';
import { useStore } from '../../store/useStore';

import { useSearch } from '../../context/SearchContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export const SearchModule: React.FC = () => {
  const [useSemantic, setUseSemantic] = useState(false);
  const { 
    query, 
    setQuery, 
    isSearching,
    results,
  } = useProductSearch(useSemantic);
  
  const { isSearching: globalIsSearching, setIsSearching } = useSearch();
  const { viewedProductSku, setViewedProduct, products } = useStore();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  const [interpretation, setInterpretation] = useState<ClinicalSearchInterpretation | null>(null);
  const [activeFilters, setActiveFilters] = useState<{ avoid: string[]; prefer: string[] } | null>(null);
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [recentTerms, setRecentTerms] = useState<string[]>([]);
  
  const { toggleProduct, isInTray } = useTray();
  const { selectedProducts } = useConsultation();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync viewedProductSku from store
  useEffect(() => {
    if (viewedProductSku) {
      const p = products.find(p => p.sku === viewedProductSku);
      if (p) setSelectedProduct(p);
    } else {
      setSelectedProduct(null);
    }
  }, [viewedProductSku, products]);

  // Update recent terms on mount and when changed
  useEffect(() => {
    setRecentTerms(historyService.getRecentTerms());
    const update = () => setRecentTerms(historyService.getRecentTerms());
    window.addEventListener('history_updated', update);
    return () => window.removeEventListener('history_updated', update);
  }, []);

  // Track search term when results are found
  useEffect(() => {
    if (results.length > 0 && !isSearching && query.length > 2) {
      const timer = setTimeout(() => {
          historyService.trackSearchTerm(query);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [query, results, isSearching]);

  // Interpretar filtros IA
  const filteredResults = useMemo(() => {
    let base = [...results];
    if (!activeFilters) return base;
    
    return base.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      const getTextToSearch = (p: Product) => {
        return [
          p.nombre_comercial,
          ...(p.principios_activos || []),
          ...(p.indicaciones || []),
          p.descripcion || '',
          p.advertencias || ''
        ].join(' ').toLowerCase();
      };

      const textA = getTextToSearch(a);
      const textB = getTextToSearch(b);

      activeFilters.avoid.forEach(term => {
        const t = term.toLowerCase();
        if (textA.includes(t)) scoreA -= 20;
        if (textB.includes(t)) scoreB -= 20;
      });

      activeFilters.prefer.forEach(term => {
        const t = term.toLowerCase();
        if (textA.includes(t)) scoreA += 10;
        if (textB.includes(t)) scoreB += 10;
      });

      if (a.is_verified) scoreA += 5;
      if (b.is_verified) scoreB += 5;

      return scoreB - scoreA;
    });
  }, [results, activeFilters]);

  const shortcuts = useMemo(() => ({
    'Escape': () => {
      if (selectedProduct) setViewedProduct(null);
      else if (query) setQuery('');
    }
  }), [selectedProduct, query, setQuery, setViewedProduct]);

  useKeyboardShortcuts(shortcuts);

  // Efecto para interpretación clínica semántica
  useEffect(() => {
    if (query.length < 20) {
      setInterpretation(null);
      if (query.length === 0) setActiveFilters(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsInterpreting(true);
      try {
        const result = await aiService.interpretClinicalSearch(query);
        if (result && result.isScenario) {
          setInterpretation(result);
        } else {
          setInterpretation(null);
        }
      } catch (err) {
        console.error('Error interpretando consulta:', err);
      } finally {
        setIsInterpreting(false);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleTagClick = React.useCallback((tag: string) => {
    setQuery(tag);
    setActiveFilters(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setQuery]);

  const handleClearAll = React.useCallback(() => {
    setQuery('');
    setActiveFilters(null);
    searchInputRef.current?.focus();
  }, [setQuery]);

  const handleProductClick = React.useCallback((product: Product) => {
    setViewedProduct(product.sku);
  }, [setViewedProduct]);

  const handleAddToTray = React.useCallback((product: Product) => {
    toggleProduct(product);
  }, [toggleProduct]);

  return (
    <div className="w-full pb-20 relative min-h-[70vh] flex flex-col pt-4 whitespace-optimized">
      
      {/* Detail View (Integrated Overlay) */}
      {selectedProduct ? (
        <div className="w-full -mt-8 md:-mt-12 animate-in fade-in duration-300">
          <Suspense fallback={null}>
            <ProductDetailModal 
                product={selectedProduct} 
                onClose={() => setViewedProduct(null)} 
                searchTerm={query}
                onTagClick={(tag) => {
                  setViewedProduct(null);
                  handleTagClick(tag);
                }}
                isEmbedded={true}
              />
          </Suspense>
        </div>
      ) : (
        /* Search Board */
        <div className="w-full flex-1">
          {query.trim() === '' && results.length === 0 ? (
            <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Recently Viewed / History */}
              <div className="grid md:grid-cols-2 gap-12">
                
                <QuickDiscoveryTags onSelect={setQuery} />
              </div>
            </div>
          ) : (
            /* Results & Interpretations */
            <div className="space-y-6 animate-in fade-in duration-300">
              <AnimatePresence>
                {interpretation && (
                  <ScenarioInterpretationOverlay 
                    interpretation={interpretation}
                    onClose={() => setInterpretation(null)}
                    onApplyFilters={(f) => {
                      setActiveFilters(f);
                      setInterpretation(null);
                      logger.success('Protocolo clínico optimizado para la consulta');
                    }}
                  />
                )}
              </AnimatePresence>

              {activeFilters && (
                 <div className="flex items-center justify-between p-4 rounded-xl alert-synergy border-dashed">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        <Brain className="w-4 h-4" />
                        Filtros Clínicos Inteligentes
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setActiveFilters(null)}
                      className="text-[10px] font-bold uppercase"
                    >
                      Restablecer Búsqueda
                    </Button>
                 </div>
              )}
              
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-bold tracking-tight">Resultados encontrados</h2>
                  <Badge variant="outline" className="rounded-full px-3">{filteredResults.length}</Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant={useSemantic ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUseSemantic(!useSemantic)}
                    className="text-xs"
                  >
                    <Sparkles className="w-3 h-3 mr-2" />
                    {useSemantic ? 'Búsqueda IA' : 'Búsqueda Texto'}
                  </Button>
                  <div className="flex border rounded-lg p-1 bg-muted/30">
                    <Button 
                      variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                      size="icon" 
                      onClick={() => setViewMode('grid')}
                      className="h-8 w-8 rounded-md"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                      size="icon" 
                      onClick={() => setViewMode('list')}
                      className="h-8 w-8 rounded-md"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <SearchResults 
                results={filteredResults}
                query={query}
                conditionFilters={[]}
                showOnlyVerified={false}
                isSearching={isSearching}
                isInTray={isInTray}
                onProductClick={handleProductClick}
                onAddToTray={handleAddToTray}
                onTagClick={handleTagClick}
                onClearFilters={handleClearAll}
                viewMode={viewMode}
              />
            </div>
          )}
        </div>
      )}

      {/* Modal de Análisis IA */}
      <Suspense fallback={null}>
        {showAiAnalysis && (
          <AIAnalysisModal 
            query={query}
            results={results}
            onClose={() => setShowAiAnalysis(false)}
          />
        )}
      </Suspense>
    </div>
  );
};

