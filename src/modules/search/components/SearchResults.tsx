import React from 'react';
import { Database, Search, Target, Sparkles, Plus } from 'lucide-react';
import * as ReactWindow from 'react-window';
import { Product } from '../../../core/types/product.types';
import { ProductCard } from '../../../components/product/ProductCard';
import { ProductSkeleton } from '../../../components/product/ProductSkeleton';
import { getRelatedClinicalTerms } from '../../../constants/clinicalSynonyms';
import { useSettings } from '../../../context/SettingsContext';

const { FixedSizeList: List } = ReactWindow as any;

interface SearchResultsProps {
  results: Product[];
  query: string;
  conditionFilters?: any;
  showOnlyVerified?: boolean;
  isSearching: boolean;
  isInTray: (sku: string) => boolean;
  onProductClick: (product: Product) => void;
  onAddToTray: (product: Product) => void;
  onTagClick: (tag: string) => void;
  onClearFilters: () => void;
  viewMode: 'grid' | 'list';
}

export const SearchResults = React.memo<SearchResultsProps>(({
  results,
  query,
  isSearching,
  isInTray,
  onProductClick,
  onAddToTray,
  onTagClick,
  onClearFilters,
  viewMode
}) => {
  const { settings } = useSettings();
  
  const getGridCols = () => {
    if (viewMode === 'list') return 'grid-cols-1';
    
    // Mapeo explícito para asegurar que Tailwind detecte las clases
    const desktopCols = {
      2: 'lg:grid-cols-2',
      3: 'lg:grid-cols-3',
      4: 'lg:grid-cols-4',
      5: 'lg:grid-cols-5'
    }[settings.gridColumns as 2 | 3 | 4 | 5] || 'lg:grid-cols-4';

    const tabletCols = {
      2: 'md:grid-cols-2',
      3: 'md:grid-cols-2',
      4: 'md:grid-cols-3',
      5: 'md:grid-cols-4'
    }[settings.gridColumns as 2 | 3 | 4 | 5] || 'md:grid-cols-3';

    return `grid-cols-1 sm:grid-cols-2 ${tabletCols} ${desktopCols}`;
  };

  const { exactMatches, relatedMatches } = React.useMemo(() => {
    if (!query.trim()) return { exactMatches: results, relatedMatches: [] };
    
    // Normalizar la query
    const normQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    
    // Términos relacionados (sinónimos clínicos)
    const relatedTerms = getRelatedClinicalTerms(query);
    
    // Regex flexible: Coincidencia al inicio de cualquier palabra o término
    // Esto permite que "murr" coincida con "Murrill" o "Amoxicilina" si se busca amox
    const flexibleRegex = new RegExp(`(^|[^a-z])${normQuery}`, 'i');
    
    // Expresión regular para CUALQUIER término relacionado (sinónimos)
    const relatedRegex = relatedTerms.length > 0 
      ? new RegExp(`(^|[^a-z])(${relatedTerms.join('|')})`, 'i') 
      : null;

    const exact: Product[] = [];
    const related: Product[] = [];
    
    results.forEach(product => {
      const indications = (product.indicaciones || []).map(i => 
        String(i).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      );
      
      const pName = (product.nombre_comercial || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const pPrincipals = (product.principios_activos || []).map(m => m.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));

      // Coincidencia DIRECTA: El término buscado está en las indicaciones, nombre o principio activo
      const isDirectMatch = flexibleRegex.test(pName) || 
                           pPrincipals.some(p => flexibleRegex.test(p)) ||
                           indications.some(i => flexibleRegex.test(i));
      
      // Coincidencia RELACIONADA: Algún sinónimo está en las indicaciones
      const isRelatedMatch = relatedRegex ? indications.some(i => relatedRegex.test(i)) : false;
                      
      if (isDirectMatch) {
        exact.push(product);
      } else if (isRelatedMatch) {
        related.push(product);
      } else {
        // Fallback: Si Fuse lo encontró por similitud (fuzzy), lo mostramos en relacionados
        related.push(product);
      }
    });
    
    return { exactMatches: exact, relatedMatches: related };
  }, [results, query]);

  if (isSearching && results.length === 0) {
    return (
      <div className={`grid ${getGridCols()} gap-4 animate-in fade-in duration-500`}>
        {[...Array(6)].map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (query.trim() === '') {
    return null;
  }

  if (results.length > 0) {
    const renderGrid = (items: Product[], title: string, Icon: any, colorClass: string) => {
      if (items.length === 0) return null;
      return (
        <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className={`p-2 rounded-xl ${colorClass.replace('text-', 'bg-').replace('500', '500/10')}`}>
              <Icon className={`w-4 h-4 ${colorClass}`} />
            </div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-100">
              {title} <span className="ml-2 text-slate-500 font-medium">({items.length})</span>
            </h3>
            <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent ml-4" />
          </div>
          
          <div className={`grid ${getGridCols()} gap-5`}>
            {items.map((product) => (
              <div key={product.sku} className="group">
                <ProductCard 
                  product={product} 
                  onViewDetail={onProductClick}
                  onAddToTray={onAddToTray}
                  isInTray={isInTray(product.sku)}
                  onTagClick={onTagClick}
                  searchTerm={query}
                  viewMode={viewMode}
                />
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div className="w-full">
        <div className="text-sm text-slate-400 mb-8 font-medium px-2 flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-4">
            <span className="bg-white/5 px-3 py-1 rounded-full border border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-300">
              {results.length === 50 ? '50+' : results.length} Hallazgos
            </span>
          </div>
          <button 
            onClick={onClearFilters}
            className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-emerald-500 transition-colors"
          >
            Limpiar búsqueda
          </button>
        </div>
        
        <div className="w-full">
          {renderGrid(exactMatches, "Coincidencias Directas", Target, "text-emerald-400")}
          
          {exactMatches.length > 0 && relatedMatches.length > 0 && (
            <div className="py-8" />
          )}

          {renderGrid(relatedMatches, "Resultados Relacionados", Sparkles, "text-blue-400")}
        </div>
      </div>
    );
  }

  if (!isSearching) {
    return (
      <div className="text-center py-20 bg-brand-surface/30 rounded-3xl border border-slate-800">
        <Search className="w-12 h-12 text-slate-700 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-200">No se encontraron resultados</h3>
        <p className="text-slate-500 mt-2">
          Intenta con otros términos o nombres comerciales.
        </p>
        <button 
          onClick={onClearFilters}
          className="mt-4 px-4 py-2 bg-brand-surface hover:bg-slate-700 text-slate-300 rounded-xl transition-colors text-sm"
        >
          Limpiar búsqueda
        </button>
      </div>
    );
  }

  return null;
});

