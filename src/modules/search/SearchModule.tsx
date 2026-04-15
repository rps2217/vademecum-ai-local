import React, { useState } from 'react';
import { useProductSearch } from '../../hooks/useProductSearch';
import { Product } from '../../core/types/product.types';
import { ProductDetailModal } from '../product/ProductDetailModal';
import { useTray } from '../../context/TrayContext';
import { SearchBar } from './components/SearchBar';
import { SafetyFilters } from './components/SafetyFilters';
import { QuickPathologyFilters } from './components/QuickPathologyFilters';
import { SearchResults } from './components/SearchResults';
import { AIAnalysisModal } from './components/AIAnalysisModal';

export const SearchModule: React.FC = () => {
  const { 
    query, 
    setQuery, 
    conditionFilters, 
    setConditionFilters, 
    results, 
    isSearching, 
  } = useProductSearch();
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  const { toggleProduct, isInTray } = useTray();

  const handleTagClick = (tag: string) => {
    setQuery(tag);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearAll = () => {
    setQuery('');
    setConditionFilters([]);
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto pb-20 px-4 sm:px-6 lg:px-8 relative">
      {/* Contenedor Sticky para Búsqueda y Filtros */}
      <div className="sticky top-0 z-30 bg-brand-bg/95 backdrop-blur-xl pt-2 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        <SearchBar 
          query={query} 
          setQuery={setQuery} 
          isSearching={isSearching} 
          onAiQuery={() => setShowAiAnalysis(true)}
        />
        <SafetyFilters 
          conditionFilters={conditionFilters} 
          setConditionFilters={setConditionFilters} 
        />
      </div>

      {/* Filtros de Patologías Comunes */}
      {query.trim() === '' && conditionFilters.length === 0 && (
        <QuickPathologyFilters 
          currentQuery={query} 
          onTagClick={handleTagClick} 
        />
      )}

      {/* Resultados */}
      <div className="mt-6">
        <SearchResults 
          results={results}
          query={query}
          conditionFilters={conditionFilters}
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

