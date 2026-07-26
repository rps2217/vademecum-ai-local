/**
 * useProducts - Hook para gestión de productos
 * Encapsula la lógica de estado y operaciones con productos
 */

import { useState, useCallback, useMemo } from 'react';
import type { AnalyzedProduct } from '../types';
import { getCombinedKnowledgeBase } from '../core/knowledge-base';
import { synergyGraphService } from '../core/knowledge-base/SynergyGraph';
import { knowledgeService, type ProductAnalysis } from '../services/KnowledgeService';
import { productCategorizationService } from '../services/ProductCategorizationService';

interface UseProductsOptions {
  initialProducts?: AnalyzedProduct[];
}

interface UseProductsReturn {
  products: AnalyzedProduct[];
  filteredProducts: AnalyzedProduct[];
  searchQuery: string;
  selectedCategory: string;
  isLoading: boolean;
  stats: {
    total: number;
    withKb: number;
    withSynergies: number;
    withAntagonisms: number;
  };
  setProducts: (products: AnalyzedProduct[]) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  analyzeProduct: (product: AnalyzedProduct) => AnalyzedProduct;
  searchProducts: (query: string) => AnalyzedProduct[];
  filterByCategory: (category: string) => AnalyzedProduct[];
}

export function useProducts(options: UseProductsOptions = {}): UseProductsReturn {
  const [products, setProducts] = useState<AnalyzedProduct[]>(options.initialProducts || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [isLoading, setIsLoading] = useState(false);

  const kb = useMemo(() => getCombinedKnowledgeBase(), []);

  // Analizar un producto con la KB
  const analyzeProduct = useCallback((product: AnalyzedProduct): AnalyzedProduct => {
    const result = knowledgeService.analyzeProduct({
      sku: product.sku,
      nombre_comercial: product.nombre_comercial,
      principios_activos: product.principios_activos
    });
    
    // Obtener categorización
    const categorization = productCategorizationService.getCategorizationDetails(product);
    
    return {
      ...product,
      ingredientes_encontrados: result.ingredientes_kb || [],
      cobertura_kb: result.cobertura_kb || 0,
      sinergias_detectadas: result.sinergias?.map(s => s.descripcion) || [],
      kbAnalysis: result,
      categorias_inferidas: categorization.categories,
      categoryLabels: categorization.categoryLabels,
    };
  }, []);

  // Filtrar productos por búsqueda
  const searchProducts = useCallback((query: string): AnalyzedProduct[] => {
    if (!query.trim()) return products;
    
    const queryLower = query.toLowerCase();
    return products.filter(p => {
      const matchNombre = p.nombre_comercial?.toLowerCase().includes(queryLower);
      const matchSku = p.sku?.toLowerCase().includes(queryLower);
      const matchPrincipios = p.principios_activos?.some(pa => 
        pa.toLowerCase().includes(queryLower)
      );
      const matchDescripcion = p.descripcion?.toLowerCase().includes(queryLower);
      
      return matchNombre || matchSku || matchPrincipios || matchDescripcion;
    });
  }, [products]);

  // Filtrar productos por categoría
  const filterByCategory = useCallback((category: string): AnalyzedProduct[] => {
    if (category === 'todas') return products;
    
    return products.filter(p => 
      p.categoria_principal?.toLowerCase() === category.toLowerCase()
    );
  }, [products]);

  // Productos filtrados combinados
  const filteredProducts = useMemo(() => {
    let result = products;
    
    if (searchQuery.trim()) {
      result = searchProducts(searchQuery);
    }
    
    if (selectedCategory !== 'todas') {
      result = filterByCategory(selectedCategory);
    }
    
    return result;
  }, [products, searchQuery, selectedCategory, searchProducts, filterByCategory]);

  // Estadísticas
  const stats = useMemo(() => ({
    total: products.length,
    withKb: products.filter(p => p.cobertura_kb > 0).length,
    withSynergies: products.filter(p => p.sinergias_detectadas?.length > 0).length,
    withAntagonisms: products.filter(p => 
      p.principios_activos?.some(pa => {
        const found = kb[pa.toLowerCase()];
        return found?.antagonismos?.length > 0;
      })
    ).length,
  }), [products, kb]);

  return {
    products,
    filteredProducts,
    searchQuery,
    selectedCategory,
    isLoading,
    stats,
    setProducts,
    setSearchQuery,
    setSelectedCategory,
    analyzeProduct,
    searchProducts,
    filterByCategory,
  };
}

export default useProducts;
