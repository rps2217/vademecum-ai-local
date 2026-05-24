import React from 'react';
import { Product } from '../core/types';
import { useStore } from '../store/useStore';

export const ConsultationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export const useConsultation = () => {
  const selectedProducts = useStore((state) => state.selectedProducts);
  const addToConsultation = useStore((state) => state.addToConsultation);
  const removeFromConsultation = useStore((state) => state.removeFromConsultation);
  const clearConsultation = useStore((state) => state.clearConsultation);
  const isInConsultationStore = useStore((state) => state.isInConsultation);

  return {
    selectedProducts,
    addToConsultation,
    removeFromConsultation,
    clearConsultation,
    isInConsultation: (sku: string) => isInConsultationStore(sku),
  };
};
