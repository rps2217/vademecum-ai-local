import React from 'react';
import { Database, Search, Target, Sparkles, Plus, Info, X } from 'lucide-react';
import { Product } from '../../../core/types/product.types';
import { ProductCard } from '../../../components/product/ProductCard';
import { ProductSkeleton } from '../../../components/product/ProductSkeleton';
import { getRelatedClinicalTerms } from '../../../constants/clinicalSynonyms';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

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
  
  const getGridCols = () => {
    if (viewMode === 'list') return 'grid-cols-1';
    return `grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 px-1 pb-4`;
  };

  const { exactMatches, relatedMatches } = React.useMemo(() => {
    if (!query.trim()) return { exactMatches: results, relatedMatches: [] };
    
    // Normalizar la query
    const normQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    
    // Términos relacionados (sinónimos clínicos)
    const relatedTerms = getRelatedClinicalTerms(query);
    
    // Regex flexible
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

      const isDirectMatch = flexibleRegex.test(pName) || 
                           pPrincipals.some(p => flexibleRegex.test(p)) ||
                           indications.some(i => flexibleRegex.test(i));
      
      const isRelatedMatch = relatedRegex ? indications.some(i => relatedRegex.test(i)) : false;
                      
      if (isDirectMatch) {
        exact.push(product);
      } else if (isRelatedMatch) {
        related.push(product);
      } else {
        related.push(product);
      }
    });
    
    return { exactMatches: exact, relatedMatches: related };
  }, [results, query]);

  if (isSearching && results.length === 0) {
    return (
      <div className={`grid ${getGridCols()} gap-6 animate-in fade-in duration-500`}>
        {[...Array(8)].map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (query.trim() === '') {
    return null;
  }

  if (results.length > 0) {
    const renderGrid = (items: Product[], title: string, Icon: any, colorClass: string, isRelated = false) => {
      if (items.length === 0) return null;
      return (
        <div className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-3 mb-6 px-1">
            <div className={`p-2 rounded-lg bg-background border shadow-sm`}>
              <Icon className={`h-4 w-4 ${colorClass}`} />
            </div>
            <div className="flex items-baseline gap-2">
               <h3 className="text-sm font-bold tracking-tight text-foreground">
                {title}
               </h3>
               <span className="text-xs font-medium text-muted-foreground">({items.length})</span>
            </div>
          </div>
          
          <div className={`grid ${getGridCols()} gap-6`}>
            {items.map((product) => (
              <div key={product.sku}>
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
        <div className="w-full space-y-4">
          {renderGrid(exactMatches, "Coincidencias Directas", Target, "text-emerald-600")}
          
          {exactMatches.length > 0 && relatedMatches.length > 0 && (
            <div className="flex items-center gap-4 py-8">
               <Separator className="flex-1" />
               <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Expansión de búsqueda</Badge>
               <Separator className="flex-1" />
            </div>
          )}

          {renderGrid(relatedMatches, "Resultados Relacionados por Sinergia o Similitud", Sparkles, "text-primary", true)}
        </div>
      </div>
    );
  }

  if (!isSearching) {
    return (
      <div className="mt-12 flex flex-col items-center justify-center py-24 px-6 border border-dashed rounded-3xl bg-muted/20 animate-in fade-in duration-500">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-6">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-bold tracking-tight mb-2">Sin hallazgos clínicos</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm mb-8 leading-relaxed">
          No hemos encontrado productos que coincidan exactamente con "<span className="font-semibold text-foreground">{query}</span>". 
          Pruebe buscando por principio activo o indicación terapéutica general.
        </p>
        <Button variant="outline" onClick={onClearFilters}>
          <X className="mr-2 h-4 w-4" />
          Restablecer Búsqueda
        </Button>
      </div>
    );
  }

  return null;
});

