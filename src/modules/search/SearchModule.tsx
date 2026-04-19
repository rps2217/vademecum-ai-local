import React, { useState, useRef, useEffect } from 'react';
import { useProductSearch } from '../../hooks/useProductSearch';
import { Product } from '../../core/types/product.types';
import { ProductDetailModal } from '../product/ProductDetailModal';
import { useTray } from '../../context/TrayContext';
import { SearchBar } from './components/SearchBar';
import { SearchResults } from './components/SearchResults';
import { AIAnalysisModal } from './components/AIAnalysisModal';
import { QuickDiscoveryTags } from './components/QuickDiscoveryTags';
import { ScenarioInterpretationOverlay } from './components/ScenarioInterpretationOverlay';
import { useConsultation } from '../../context/ConsultationContext';
import { Brain } from 'lucide-react';
import { AIService } from '../../services/AIService';

export const SearchModule: React.FC = () => {
  const { 
    query, 
    setQuery, 
    results, 
    isSearching, 
  } = useProductSearch();
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  const [interpretation, setInterpretation] = useState<any>(null);
  const [isInterpreting, setIsInterpreting] = useState(false);
  
  const { toggleProduct, isInTray } = useTray();
  const { selectedProducts } = useConsultation();
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="w-full max-w-[1200px] mx-auto pb-20 px-2 sm:px-4 lg:px-6 relative min-h-[70vh] flex flex-col pt-2">
      
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
              suggestions={results.slice(0, 10)}
              onSelectProduct={(product) => {
                setSelectedProduct(product);
                setQuery('');
              }}
              onAiQuery={() => setShowAiAnalysis(true)}
            />
            {query.trim() === '' && results.length === 0 && (
              <div className="mt-4">
                <QuickDiscoveryTags onSelect={setQuery} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail View (Integrated instead of Modal) */}
      {selectedProduct ? (
        <div className="w-full animate-in fade-in slide-in-from-right-4 duration-300">
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
        </div>
      ) : (
        /* Resultados e Interpretación */
        query.trim() !== '' && (
          <div className="mt-2 flex-1 animate-in fade-in duration-500">
            <ScenarioInterpretationOverlay 
              interpretation={interpretation}
              onClose={() => setInterpretation(null)}
              onApplyFilters={(f) => {
                setInterpretation(null);
              }}
            />
            
            <SearchResults 
              results={results}
              query={query}
              conditionFilters={[]}
              showOnlyVerified={false}
              isSearching={isSearching}
              isInTray={isInTray}
              onProductClick={setSelectedProduct}
              onAddToTray={toggleProduct}
              onTagClick={handleTagClick}
              onClearFilters={handleClearAll}
            />
          </div>
        )
      )}

      {/* Modal de Análisis IA */}
      {showAiAnalysis && (
        <AIAnalysisModal 
          query={query}
          results={results}
          onClose={() => setShowAiAnalysis(false)}
        />
      )}
    </div>
  );
};

