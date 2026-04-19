import React, { createContext, useContext, useState, useCallback } from 'react';
import { Product } from '../core/types/product.types';

interface ConsultationContextType {
  selectedProducts: Product[];
  addToConsultation: (product: Product) => void;
  removeFromConsultation: (sku: string) => void;
  clearConsultation: () => void;
  isInConsultation: (sku: string) => boolean;
}

const ConsultationContext = createContext<ConsultationContextType | undefined>(undefined);

export const ConsultationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

  const addToConsultation = useCallback((product: Product) => {
    setSelectedProducts(prev => {
      if (prev.some(p => p.sku === product.sku)) return prev;
      if (prev.length >= 5) {
        alert('Máximo 5 productos para análisis simultáneo.');
        return prev;
      }
      return [...prev, product];
    });
  }, []);

  const removeFromConsultation = useCallback((sku: string) => {
    setSelectedProducts(prev => prev.filter(p => p.sku !== sku));
  }, []);

  const clearConsultation = useCallback(() => {
    setSelectedProducts([]);
  }, []);

  const isInConsultation = useCallback((sku: string) => {
    return selectedProducts.some(p => p.sku === sku);
  }, [selectedProducts]);

  // Memoizamos el valor del contexto para evitar re-renderizados innecesarios de los consumidores
  const contextValue = React.useMemo(() => ({
    selectedProducts,
    addToConsultation,
    removeFromConsultation,
    clearConsultation,
    isInConsultation
  }), [selectedProducts, addToConsultation, removeFromConsultation, clearConsultation, isInConsultation]);

  return (
    <ConsultationContext.Provider value={contextValue}>
      {children}
    </ConsultationContext.Provider>
  );
};

export const useConsultation = () => {
  const context = useContext(ConsultationContext);
  if (!context) {
    throw new Error('useConsultation must be used within a ConsultationProvider');
  }
  return context;
};
