import React, { useState, useRef, useEffect } from 'react';
import { useProductSearch } from '../../hooks/useProductSearch';
import { Product } from '../../core/types/product.types';
import { ProductDetailModal } from '../product/ProductDetailModal';
import { useTray } from '../../context/TrayContext';
import { SearchBar } from './components/SearchBar';
import { SafetyFilters } from './components/SafetyFilters';
import { QuickPathologyFilters } from './components/QuickPathologyFilters';
import { SearchResults } from './components/SearchResults';
import { AIAnalysisModal } from './components/AIAnalysisModal';
import { useConsultation } from '../../context/ConsultationContext';
import { Brain, Sparkles } from 'lucide-react';

export const SearchModule: React.FC = () => {
  const { 
    query, 
    setQuery, 
    conditionFilters, 
    setConditionFilters, 
    showOnlyVerified,
    setShowOnlyVerified,
    results, 
    isSearching, 
  } = useProductSearch();
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  const { toggleProduct, isInTray } = useTray();
  const { selectedProducts } = useConsultation();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handleTagClick = React.useCallback((tag: string) => {
    setQuery(tag);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setQuery]);

  const handleClearAll = React.useCallback(() => {
    setQuery('');
    setConditionFilters([]);
    setShowOnlyVerified(false);
    searchInputRef.current?.focus();
  }, [setQuery, setConditionFilters, setShowOnlyVerified]);

  return (
    <div className="w-full max-w-[1400px] mx-auto pb-20 px-4 sm:px-6 lg:px-8 relative">
      {/* Contenedor Sticky para Búsqueda y Filtros */}
      <div className="sticky top-0 z-30 bg-brand-bg/95 backdrop-blur-xl pt-2 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        <SearchBar 
          ref={searchInputRef}
          query={query} 
          setQuery={setQuery} 
          isSearching={isSearching} 
          onAiQuery={() => setShowAiAnalysis(true)}
        />
        <SafetyFilters 
          conditionFilters={conditionFilters} 
          setConditionFilters={setConditionFilters} 
          showOnlyVerified={showOnlyVerified}
          setShowOnlyVerified={setShowOnlyVerified}
        />
      </div>

      {/* Filtros de Patologías Comunes */}
      {query.trim() === '' && conditionFilters.length === 0 && (
        <div className="space-y-8 animate-in fade-in duration-700">
          {selectedProducts.length > 0 && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-rose-500/20 rounded-2xl">
                  <Brain className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Cerebro Clínico Activo</h4>
                  <p className="text-xs text-slate-400">Tienes {selectedProducts.length} productos seleccionados para análisis de interacción.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-primary animate-pulse" />
                <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">Listo para procesar</span>
              </div>
            </div>
          )}
          <QuickPathologyFilters 
            currentQuery={query} 
            onTagClick={handleTagClick} 
          />
        </div>
      )}

      {/* Resultados */}
      <div className="mt-6">
        <SearchResults 
          results={results}
          query={query}
          conditionFilters={conditionFilters}
          showOnlyVerified={showOnlyVerified}
          isSearching={isSearching}
          isInTray={isInTray}
          onProductClick={setSelectedProduct}
          onAddToTray={toggleProduct}
          onTagClick={handleTagClick}
          onClearFilters={handleClearAll}
        />
      </div>

      {/* Modal de Análisis IA */}
      {showAiAnalysis && (
        <AIAnalysisModal 
          query={query}
          results={results}
          onClose={() => setShowAiAnalysis(false)}
        />
      )}

      {/* Modal de Detalle Individual */}
      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          searchTerm={query}
          onTagClick={(tag) => {
            setSelectedProduct(null);
            handleTagClick(tag);
          }}
        />
      )}
    </div>
  );
};

