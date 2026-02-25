import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Product } from '../core/types/product.types';

interface TrayContextType {
  tray: Product[];
  toggleProduct: (product: Product) => void;
  clearTray: () => void;
  isInTray: (sku: string) => boolean;
}

const TrayContext = createContext<TrayContextType | undefined>(undefined);

export const TrayProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tray, setTray] = useState<Product[]>([]);

  const toggleProduct = (product: Product) => {
    setTray(prev => {
      if (prev.find(p => p.sku === product.sku)) {
        return prev.filter(p => p.sku !== product.sku);
      }
      return [...prev, product];
    });
  };

  const clearTray = () => setTray([]);

  const isInTray = (sku: string) => tray.some(p => p.sku === sku);

  return (
    <TrayContext.Provider value={{ tray, toggleProduct, clearTray, isInTray }}>
      {children}
    </TrayContext.Provider>
  );
};

export const useTray = () => {
  const context = useContext(TrayContext);
  if (context === undefined) {
    throw new Error('useTray must be used dentro de un TrayProvider');
  }
  return context;
};
