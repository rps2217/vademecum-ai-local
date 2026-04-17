import React, { useState, useRef, useEffect } from 'react';
import { useProductSearch } from '../../hooks/useProductSearch';
import { Product } from '../../core/types/product.types';
import { ProductDetailModal } from '../product/ProductDetailModal';
import { useTray } from '../../context/TrayContext';
import { SearchBar } from './components/SearchBar';
import { SearchResults } from './components/SearchResults';
import { AIAnalysisModal } from './components/AIAnalysisModal';
import { useConsultation } from '../../context/ConsultationContext';
import { Brain } from 'lucide-react';

export const SearchModule: React.FC = () => {
  const { 
    query, 
    setQuery, 
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
    searchInputRef.current?.focus();
  }, [setQuery]);

  return (
    <div className="w-full max-w-[1000px] mx-auto pb-20 px-4 sm:px-6 lg:px-8 relative min-h-[70vh] flex flex-col pt-10">
      
      {/* Sección principal de búsqueda (Google Style) */}
      <div className={`transition-all duration-700 ease-in-out flex flex-col items-center justify-center ${query.trim() === '' && results.length === 0 ? 'mt-[20vh]' : 'mt-0 mb-6'}`}>
        
        {query.trim() === '' && results.length === 0 && (
           <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="inline-flex items-center justify-center p-4 bg-brand-primary/10 rounded-3xl border border-brand-primary/20 mb-6 shadow-[0_0_40px_rgba(59,130,246,0.15)]">
               <Brain className="w-12 h-12 text-brand-primary" />
             </div>
             <h1 className="text-5xl sm:text-6xl font-extrabold text-white mb-6 tracking-tight">
               Vademécum <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-indigo-400">IA</span>
             </h1>
             <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
               Escribe un medicamento, síntoma o enfermedad para explorar <span className="text-brand-primary">alternativas</span>, <span className="text-indigo-400">complementos farmacéuticos</span> o posibles <span className="text-rose-400">sinergias</span>.
             </p>
           </div>
        )}

        <div className={`w-full transition-all duration-500 ${query.trim() === '' && results.length === 0 ? 'max-w-2xl' : 'max-w-3xl'}`}>
          <SearchBar 
            ref={searchInputRef}
            query={query} 
            setQuery={setQuery} 
            isSearching={isSearching} 
            onAiQuery={() => setShowAiAnalysis(true)}
          />
          {query.trim() === '' && results.length === 0 && (
            <div className="flex justify-center gap-3 mt-8">
              <button onClick={() => setQuery('Hipertensión')} className="px-4 py-2 rounded-full bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-sm text-slate-300 transition-colors">
                Hipertensión
              </button>
              <button onClick={() => setQuery('Dolor de cabeza severo')} className="px-4 py-2 rounded-full bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-sm text-slate-300 transition-colors">
                Dolor de cabeza crónico
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Resultados */}
      {query.trim() !== '' && (
        <div className="mt-6 flex-1 animate-in fade-in duration-500">
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

