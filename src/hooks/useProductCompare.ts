/**
 * useProductCompare - Hook para comparar productos
 */

import { useState, useCallback } from 'react';
import type { AnalyzedProduct } from '../types';

const MAX_COMPARE = 4;

interface UseProductCompareReturn {
  compareList: AnalyzedProduct[];
  addToCompare: (product: AnalyzedProduct) => boolean;
  removeFromCompare: (sku: string) => void;
  clearCompare: () => void;
  isInCompare: (sku: string) => boolean;
  canAddMore: boolean;
  canCompare: boolean;
}

export function useProductCompare(): UseProductCompareReturn {
  const [compareList, setCompareList] = useState<AnalyzedProduct[]>([]);

  const addToCompare = useCallback((product: AnalyzedProduct): boolean => {
    if (compareList.length >= MAX_COMPARE) return false;
    if (compareList.some(p => p.sku === product.sku)) return false;

    setCompareList(prev => [...prev, product]);
    return true;
  }, [compareList]);

  const removeFromCompare = useCallback((sku: string) => {
    setCompareList(prev => prev.filter(p => p.sku !== sku));
  }, []);

  const clearCompare = useCallback(() => {
    setCompareList([]);
  }, []);

  const isInCompare = useCallback((sku: string): boolean => {
    return compareList.some(p => p.sku === sku);
  }, [compareList]);

  return {
    compareList,
    addToCompare,
    removeFromCompare,
    clearCompare,
    isInCompare,
    canAddMore: compareList.length < MAX_COMPARE,
    canCompare: compareList.length >= 2,
  };
}

export default useProductCompare;
