import React from 'react';
import { Product } from '../core/types/product.types';
import { useStore } from '../store/useStore';

export const ComparisonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export const useComparison = () => {
  const comparisonList = useStore((state) => state.comparisonList);
  const addToComparison = useStore((state) => state.addToComparison);
  const removeFromComparison = useStore((state) => state.removeFromComparison);
  const clearComparison = useStore((state) => state.clearComparison);
  const isInComparisonStore = useStore((state) => state.isInComparison);

  return {
    comparisonList,
    addToComparison,
    removeFromComparison,
    clearComparison,
    isInComparison: (sku: string) => isInComparisonStore(sku),
  };
};
