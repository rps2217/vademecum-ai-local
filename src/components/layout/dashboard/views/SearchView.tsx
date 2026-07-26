/**
 * SearchView - Vista de búsqueda de productos
 * Muestra lista de productos con filtros y búsqueda
 */

import React, { useMemo } from 'react';
import type { AnalyzedProduct } from '../../../types';
import { ProductCardSimple } from '../../../product/ProductCardSimple';
import { HierarchicalCategoryFilter } from '../HierarchicalCategoryFilter';
import { EmptyState } from '../EmptyState';
import { categorizationService, type ProductCategories } from '../../../../core/categorization';
import { PRODUCT_TYPES, THERAPEUTIC_FUNCTIONS, BODY_SYSTEMS, type ProductType, type TherapeuticFunction, type BodySystem } from '../../../../core/categorization';

interface ScrapingState {
  [sku: string]: 'idle' | 'scraping' | 'success' | 'error';
}

interface SearchViewProps {
  products: AnalyzedProduct[];
  kb: Record<string, any>;
  query: string;
  // Filtros jerárquicos
  selectedType: ProductType | null;
  selectedFunction: TherapeuticFunction | null;
  selectedSystem: BodySystem | null;
  onTypeChange: (type: ProductType | null) => void;
  onFunctionChange: (fn: TherapeuticFunction | null) => void;
  onSystemChange: (system: BodySystem | null) => void;
  onSelectProduct: (product: AnalyzedProduct) => void;
  onScrapeProduct: (sku: string) => void;
  scrapeStates: ScrapingState;
}

export function SearchView({
  products,
  kb,
  query,
  selectedType,
  selectedFunction,
  selectedSystem,
  onTypeChange,
  onFunctionChange,
  onSystemChange,
  onSelectProduct,
  onScrapeProduct,
  scrapeStates,
}: SearchViewProps) {
  // Calcular categorías para cada producto
  const productsWithCategories = useMemo(() => {
    return products.map(p => ({
      product: p,
      categories: categorizationService.categorizeProduct(p, kb)
    }));
  }, [products, kb]);

  // Filtrar productos
  const filteredProducts = useMemo(() => {
    return productsWithCategories
      .filter(({ product, categories }) => {
        // Filtro de búsqueda
        if (query) {
          const q = query.toLowerCase();
          const matchSku = (product.sku || '').toLowerCase().includes(q);
          const matchNombre = (product.nombre_comercial || '').toLowerCase().includes(q);
          const matchIng = (product.principios_activos || []).some((id: string) => 
            String(id).toLowerCase().includes(q)
          );
          if (!matchSku && !matchNombre && !matchIng) return false;
        }
        
        // Filtro por tipo
        if (selectedType && categories.type !== selectedType) {
          return false;
        }
        
        // Filtro por función
        if (selectedFunction && !categories.functions.includes(selectedFunction)) {
          return false;
        }
        
        // Filtro por sistema
        if (selectedSystem && !categories.systems.includes(selectedSystem)) {
          return false;
        }
        
        return true;
      })
      .map(({ product }) => product);
  }, [productsWithCategories, query, selectedType, selectedFunction, selectedSystem]);

  // Calcular contadores para el filtro
  const counts = useMemo(() => {
    const typeCounts: Record<ProductType, number> = {} as any;
    const functionCounts: Record<TherapeuticFunction, number> = {} as any;
    const systemCounts: Record<BodySystem, number> = {} as any;

    for (const { categories } of productsWithCategories) {
      if (categories.type) {
        typeCounts[categories.type] = (typeCounts[categories.type] || 0) + 1;
      }
      for (const fn of categories.functions) {
        functionCounts[fn] = (functionCounts[fn] || 0) + 1;
      }
      for (const sys of categories.systems) {
        systemCounts[sys] = (systemCounts[sys] || 0) + 1;
      }
    }

    return { types: typeCounts, functions: functionCounts, systems: systemCounts };
  }, [productsWithCategories]);

  if (products.length === 0) {
    return <EmptyState message="Sin productos disponibles" />;
  }

  return (
    <div className="space-y-4">
      <HierarchicalCategoryFilter
        selectedType={selectedType}
        selectedFunction={selectedFunction}
        selectedSystem={selectedSystem}
        onTypeChange={onTypeChange}
        onFunctionChange={onFunctionChange}
        onSystemChange={onSystemChange}
        counts={counts}
      />
      
      <div className="text-xs text-gray-400">
        {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredProducts.map(prod => (
          <ProductCardSimple
            key={prod.sku}
            product={prod}
            onSelect={() => onSelectProduct(prod)}
            onScrape={onScrapeProduct}
            scrapeState={scrapeStates[prod.sku] || 'idle'}
          />
        ))}
      </div>

      {filteredProducts.length === 0 && query && (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">No hay resultados para "{query}"</p>
        </div>
      )}
    </div>
  );
}

export default SearchView;
