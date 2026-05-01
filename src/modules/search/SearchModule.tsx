import React, { useState, useRef, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import { useProductSearch } from '../../hooks/useProductSearch';
import { Product, ClinicalSearchInterpretation } from '../../core/types';
// Lazy loading heavy components
const ProductDetailModal = lazy(() => import('../product/ProductDetailModal').then(module => ({ default: module.ProductDetailModal })));
const AIAnalysisModal = lazy(() => import('./components/AIAnalysisModal').then(module => ({ default: module.AIAnalysisModal })));

import { useTray } from '../../context/TrayContext';
import { SearchBar } from './components/SearchBar';
import { SearchResults } from './components/SearchResults';
import { QuickDiscoveryTags } from './components/QuickDiscoveryTags';
import { ScenarioInterpretationOverlay } from './components/ScenarioInterpretationOverlay';
import { RecentlyViewed } from './components/RecentlyViewed';
import { useConsultation } from '../../context/ConsultationContext';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { logger } from '../../services/LoggerService';
import { Brain, LayoutGrid, List } from 'lucide-react';
import { AIService } from '../../services/AIService';
import { COMMON_PATHOLOGIES } from '../../constants/pathologies';
import { SearchConcept } from './components/SearchSuggestions';

export const SearchModule: React.FC = () => {
  const { 
    query, 
    setQuery, 
    results, 
    isSearching, 
  } = useProductSearch();
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  const [interpretation, setInterpretation] = useState<ClinicalSearchInterpretation | null>(null);
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const { toggleProduct, isInTray } = useTray();
  const { selectedProducts } = useConsultation();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useKeyboardShortcuts({
    'Control+k': () => {
      logger.info('Buscador enfocado vía shortcut CTRL+K');
      searchInputRef.current?.focus();
    },
    'Escape': () => {
      if (selectedProduct) setSelectedProduct(null);
      else if (query) setQuery('');
    }
  });

  // Generar sugerencias conceptuales basadas en patologías frecuentes y moléculas en resultados
  const conceptualSuggestions = useMemo(() => {
    if (query.length < 2) return [];
    const normalizedQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    const concepts: SearchConcept[] = [];

    // 1. Patologías comunes
    COMMON_PATHOLOGIES.forEach(p => {
      if (p.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(normalizedQuery)) {
        concepts.push({ id: `path-${p}`, label: p, type: 'pathology' });
      }
    });

    // 2. Moléculas (Principios Activos) de los resultados actuales
    const molecules = new Set<string>();
    results.forEach(p => {
      p.principios_activos?.forEach(m => {
        if (m.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(normalizedQuery)) {
          molecules.add(m);
        }
      });
    });
    Array.from(molecules).slice(0, 5).forEach(m => {
      concepts.push({ id: `mol-${m}`, label: m, type: 'molecule' });
    });

    return concepts.slice(0, 8);
  }, [query, results]);

  // Focus search input on mount and on coming back from detail
  useEffect(() => {
    if (!selectedProduct && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [selectedProduct]);

  // Efecto para interpretación clínica semántica
  useEffect(() => {
    if (query.length < 20) {
      setInterpretation(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsInterpreting(true);
      try {
        const result = await AIService.interpretClinicalSearch(query);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setQuery]);

  const handleClearAll = React.useCallback(() => {
    setQuery('');
    searchInputRef.current?.focus();
  }, [setQuery]);

  const handleProductClick = React.useCallback((product: Product) => {
    setSelectedProduct(product);
  }, []);

  const handleAddToTray = React.useCallback((product: Product) => {
    toggleProduct(product);
  }, [toggleProduct]);

  return (
    <div className="w-full max-w-[1200px] mx-auto pb-20 px-2 sm:px-4 lg:px-6 relative min-h-[70vh] flex flex-col pt-2 bg-brand-bg">
      
      {/* Search Header / Navigation Area */}
      {!selectedProduct && (
        <div className="w-full mb-6">
          <div className="w-full transition-all duration-500 ease-out max-w-4xl mx-auto">
            <SearchBar 
              ref={searchInputRef}
              query={query} 
              setQuery={setQuery} 
              isSearching={isSearching} 
              isInterpreting={isInterpreting}
              suggestions={conceptualSuggestions}
              onSelectConcept={(concept) => {
                setQuery(concept.label);
                // No abrimos detalle aquí porque es un concepto clínico, no un producto
              }}
              onAiQuery={() => setShowAiAnalysis(true)}
            />
            {query.trim() === '' && results.length === 0 && (
              <div className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <QuickDiscoveryTags onSelect={setQuery} />
                <RecentlyViewed onProductClick={handleProductClick} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail View (Integrated instead of Modal) */}
      {selectedProduct ? (
        <div className="w-full animate-in fade-in duration-150">
          <Suspense fallback={null}>
            <ProductDetailModal 
                product={selectedProduct} 
                onClose={() => setSelectedProduct(null)} 
                searchTerm={query}
                onTagClick={(tag) => {
                  setSelectedProduct(null);
                  handleTagClick(tag);
                }}
                isEmbedded={true}
              />
          </Suspense>
        </div>
      ) : (
        /* Resultados e Interpretación */
        query.trim() !== '' && (
          <div className="mt-2 flex-1 animate-in fade-in duration-200">
            <ScenarioInterpretationOverlay 
              interpretation={interpretation}
              onClose={() => setInterpretation(null)}
              onApplyFilters={(f) => {
                setInterpretation(null);
              }}
            />
            
            <div className="flex justify-end mb-2 px-2">
              <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-700">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

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
              onClearFilters={handleClearAll}
              viewMode={viewMode}
            />
          </div>
        )
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

