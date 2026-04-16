import React, { createContext, useContext, useState, useCallback } from 'react';
import { Product } from '../core/types/product.types';

interface ComparisonContextType {
  comparisonList: Product[];
  addToComparison: (product: Product) => void;
  removeFromComparison: (sku: string) => void;
  clearComparison: () => void;
  isInComparison: (sku: string) => boolean;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export const ComparisonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [comparisonList, setComparisonList] = useState<Product[]>([]);

  const addToComparison = useCallback((product: Product) => {
    setComparisonList(prev => {
      if (prev.find(p => p.sku === product.sku)) return prev;
      if (prev.length >= 3) {
        alert('Máximo 3 productos para comparación simultánea.');
        return prev;
      }
      return [...prev, product];
    });
  }, []);

  const removeFromComparison = useCallback((sku: string) => {
    setComparisonList(prev => prev.filter(p => p.sku !== sku));
  }, []);

  const clearComparison = useCallback(() => {
    setComparisonList([]);
  }, []);

  const isInComparison = useCallback((sku: string) => {
    return comparisonList.some(p => p.sku === sku);
  }, [comparisonList]);

  return (
    <ComparisonContext.Provider value={{ 
      comparisonList, 
      addToComparison, 
      removeFromComparison, 
      clearComparison,
      isInComparison
    }}>
      {children}
    </ComparisonContext.Provider>
  );
};

export const useComparison = () => {
  const context = useContext(ComparisonContext);
  if (!context) throw new Error('useComparison must be used within a ComparisonProvider');
  return context;
};
