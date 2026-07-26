/**
 * SearchView - Vista de búsqueda de productos
 * Muestra lista de productos con filtros y búsqueda
 */

import React, { useMemo } from 'react';
import type { AnalyzedProduct } from '../../../types';
import { ProductCard } from '../../../product/ProductCard';
import { CategoryFilter } from '../CategoryFilter';
import { EmptyState } from '../EmptyState';

interface ScrapingState {
  [sku: string]: 'idle' | 'scraping' | 'success' | 'error';
}

interface SearchViewProps {
  products: AnalyzedProduct[];
  kb: Record<string, any>;
  query: string;
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  onSelectProduct: (product: AnalyzedProduct) => void;
  onScrapeProduct: (sku: string) => void;
  scrapeStates: ScrapingState;
}

export function SearchView({
  products,
  kb,
  query,
  categories,
  selectedCategory,
  onCategoryChange,
  onSelectProduct,
  onScrapeProduct,
  scrapeStates,
}: SearchViewProps) {
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Filtro de búsqueda
      if (query) {
        const q = query.toLowerCase();
        
        // Buscar por SKU primero
        const matchSku = (p.sku || '').toLowerCase().includes(q);
        const isSkuSearch = /^\d+$/.test(q.replace(/\s/g, ''));
        
        const matchNombre = (p.nombre_comercial || '').toLowerCase().includes(q);
        const matchDesc = (p.descripcion || '').toLowerCase().includes(q);
        const matchIng = (p.principios_activos || []).some((id: string) => 
          String(id).toLowerCase().includes(q)
        );
        const matchMarca = (p.marca || '').toLowerCase().includes(q);
        
        // Si es búsqueda por SKU exacto
        if (isSkuSearch || matchSku) {
          if (matchSku) return true;
        }
        
        // Búsqueda normal
        if (!matchNombre && !matchDesc && !matchIng && !matchMarca) return false;
      }
      
      // Filtro de categoría
      if (selectedCategory !== 'todas') {
        if (p.categoria_principal !== selectedCategory && p.categoria !== selectedCategory) {
          return false;
        }
      }
      
      return true;
    });
  }, [products, query, selectedCategory]);

  if (products.length === 0) {
    return <EmptyState message="Sin productos disponibles" />;
  }

  return (
    <div>
      <CategoryFilter 
        categories={categories} 
        selected={selectedCategory} 
        onSelect={onCategoryChange} 
      />
      
      <div className="mt-3 mb-2 text-xs text-gray-400">
        {filteredProducts.length} medicamento{filteredProducts.length !== 1 ? 's' : ''}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {filteredProducts.map(prod => (
          <ProductCard
            key={prod.sku}
            product={prod}
            kb={kb}
            onSelect={() => onSelectProduct(prod)}
            onScrape={onScrapeProduct}
            scrapeState={scrapeStates[prod.sku] || 'idle'}
          />
        ))}
      </div>

      {filteredProducts.length === 0 && query && (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">No hay resultados para "{query}"</p>
          {/^\d+$/.test(query.replace(/\s/g, '')) && (
            <p className="text-xs mt-2 text-violet-500">
              💡 Este SKU no está en tu base de datos local.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchView;
