/**
 * SearchView - Vista de búsqueda con filtros avanzados
 * Búsqueda inteligente con chips y autocompletado
 */

import React, { useMemo, useState, useCallback } from 'react';
import type { AnalyzedProduct } from '../../../types';
import { ProductCardSimple } from '../../../product/ProductCardSimple';
import { SearchBar } from '../SearchBar';
import { EmptyState } from '../EmptyState';
import { categorizationService, PRODUCT_TYPES, type ProductType, type TherapeuticFunction, type BodySystem } from '../../../../core/categorization';

interface ScrapingState {
  [sku: string]: 'idle' | 'scraping' | 'success' | 'error';
}

interface SearchViewProps {
  products: AnalyzedProduct[];
  kb: Record<string, any>;
  query: string;
  // Filtros
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
  // Estados para filtros múltiples
  const [selectedTypes, setSelectedTypes] = useState<ProductType[]>([]);
  const [selectedFunctions, setSelectedFunctions] = useState<TherapeuticFunction[]>([]);
  const [selectedSystems, setSelectedSystems] = useState<BodySystem[]>([]);

  // Calcular categorías para productos
  const productsWithCategories = useMemo(() => {
    return products.map(p => ({
      product: p,
      categories: categorizationService.categorizeProduct(p, kb),
    }));
  }, [products, kb]);

  // Filtrar productos con búsqueda simple
  const filteredProducts = useMemo(() => {
    let result = productsWithCategories;

    // Búsqueda simple con ordenamiento por relevancia
    if (query && query.length >= 1) {
      const q = query.toLowerCase();
      
      // Ordenar: exacta > inicio > contiene > kb
      result = result
        .map(({ product, categories }) => {
          const nombre = (product.nombre_comercial || '').toLowerCase();
          const principios = (product.principios_activos || []).map(p => p.toLowerCase());
          
          let priority = 0;
          
          // Coincidencia exacta en nombre
          if (nombre === q) priority = 4;
          // Nombre empieza con query
          else if (nombre.startsWith(q)) priority = 3;
          // Nombre contiene query
          else if (nombre.includes(q)) priority = 2;
          // Principio activo contiene query
          else if (principios.some(p => p.includes(q))) priority = 1;
          
          return { product, categories, priority };
        })
        .filter(r => r.priority > 0)
        .sort((a, b) => b.priority - a.priority || b.categories.coverage - a.categories.coverage)
        .map(r => ({ product: r.product, categories: r.categories }));
    }

    // Filtros por tipo
    if (selectedTypes.length > 0) {
      result = result.filter(({ categories }) => 
        categories.type && selectedTypes.includes(categories.type)
      );
    }

    // Filtros por función
    if (selectedFunctions.length > 0) {
      result = result.filter(({ categories }) =>
        selectedFunctions.some(fn => categories.functions.includes(fn))
      );
    }

    // Filtros por sistema
    if (selectedSystems.length > 0) {
      result = result.filter(({ categories }) =>
        selectedSystems.some(sys => categories.systems.includes(sys))
      );
    }

    return result.map(({ product }) => product);
  }, [productsWithCategories, query, selectedTypes, selectedFunctions, selectedSystems, fuseIndex]);

  // Handlers para chips
  const handleTypeToggle = useCallback((type: ProductType) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
    onTypeChange(null);
  }, [onTypeChange]);

  const handleFunctionToggle = useCallback((fn: TherapeuticFunction) => {
    setSelectedFunctions(prev =>
      prev.includes(fn)
        ? prev.filter(f => f !== fn)
        : [...prev, fn]
    );
    onFunctionChange(null);
  }, [onFunctionChange]);

  const handleSystemToggle = useCallback((system: BodySystem) => {
    setSelectedSystems(prev =>
      prev.includes(system)
        ? prev.filter(s => s !== system)
        : [...prev, system]
    );
    onSystemChange(null);
  }, [onSystemChange]);

  const handleClearFilters = useCallback(() => {
    setSelectedTypes([]);
    setSelectedFunctions([]);
    setSelectedSystems([]);
    onTypeChange(null);
    onFunctionChange(null);
    onSystemChange(null);
  }, [onTypeChange, onFunctionChange, onSystemChange]);

  const hasActiveFilters = selectedTypes.length > 0 || selectedFunctions.length > 0 || selectedSystems.length > 0;

  if (products.length === 0) {
    return <EmptyState message="Sin productos disponibles" />;
  }

  return (
    <div className="space-y-4">
      <SearchBar
        query={query}
        onQueryChange={(q) => {
          // Buscar en appStore está manejado por el padre a través de searchQuery
          // Por ahora usamos window para comunicar cambios
          const event = new CustomEvent('searchChange', { detail: q });
          window.dispatchEvent(event);
        }}
        products={products}
        kb={kb}
        selectedTypes={selectedTypes}
        selectedFunctions={selectedFunctions}
        selectedSystems={selectedSystems}
        onTypeToggle={handleTypeToggle}
        onFunctionToggle={handleFunctionToggle}
        onSystemToggle={handleSystemToggle}
        onClearFilters={handleClearFilters}
      />

      {/* Contador de resultados */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">
            {filteredProducts.length}
          </span>
          <span className="text-sm text-gray-500">
            producto{filteredProducts.length !== 1 ? 's' : ''}
          </span>
          {query && (
            <span className="text-xs text-gray-400">
              para "{query}"
            </span>
          )}
        </div>
        
        {hasActiveFilters && (
          <div className="flex items-center gap-1 flex-wrap">
            {selectedTypes.map(type => (
              <span key={type} className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                {PRODUCT_TYPES[type]}
              </span>
            ))}
            {selectedFunctions.map(fn => (
              <span key={fn} className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs rounded-full">
                {fn}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Grid de productos */}
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

      {/* Estado vacío */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            Sin resultados
          </h3>
          <p className="text-sm text-gray-500">
            {query 
              ? `No encontramos productos para "${query}"`
              : 'No hay productos que coincidan con los filtros'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchView;
