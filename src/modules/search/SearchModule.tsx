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
    searchInputRef.current?.focus();
  }, [setQuery]);

  return (
    <div className="w-full max-w-[1000px] mx-auto pb-20 px-4 sm:px-6 lg:px-8 relative min-h-[70vh] flex flex-col pt-10">
      
      <div className={`transition-all duration-1000 ease-in-out flex flex-col items-center justify-center ${query.trim() === '' && results.length === 0 ? 'mt-[15vh]' : 'mt-0 mb-8'}`}>
        
        {query.trim() === '' && results.length === 0 && (
           <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 relative">
             {/* Atmospheric Background Glow */}
             <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand-primary/10 blur-[120px] rounded-full pointer-events-none -z-10" />
             
             <div className="relative inline-flex items-center justify-center p-6 bg-brand-surface/40 backdrop-blur-3xl rounded-[2.5rem] border border-slate-800/50 mb-10 shadow-2xl overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
               <Brain className="w-16 h-16 text-brand-primary relative z-10" />
             </div>
             
             <h1 className="text-6xl sm:text-7xl font-extrabold text-white mb-8 tracking-tighter">
               Vademécum <span className="text-brand-primary">IA</span>
             </h1>
             <p className="text-slate-500 text-xl max-w-2xl mx-auto leading-relaxed font-medium">
               Explora la farmacopea con <span className="text-slate-300">inteligencia artificial local</span>. Identifica sinergias, contraindicaciones y alternativas clínicas al instante.
             </p>
           </div>
        )}

        <div className={`w-full transition-all duration-700 ease-out ${query.trim() === '' && results.length === 0 ? 'max-w-3xl' : 'max-w-4xl'}`}>
          <SearchBar 
            ref={searchInputRef}
            query={query} 
            setQuery={setQuery} 
            isSearching={isSearching} 
            isInterpreting={isInterpreting}
            onAiQuery={() => setShowAiAnalysis(true)}
          />
          {query.trim() === '' && results.length === 0 && (
            <QuickDiscoveryTags onSelect={setQuery} />
          )}
        </div>
      </div>

      {/* Resultados e Interpretación */}
      {query.trim() !== '' && (
        <div className="mt-6 flex-1 animate-in fade-in duration-500">
          <ScenarioInterpretationOverlay 
            interpretation={interpretation}
            onClose={() => setInterpretation(null)}
            onApplyFilters={(f) => {
              // Por ahora solo cerramos, en el futuro esto podría filtrar los resultados
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
      )}

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

