import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { Product } from '../core/types';
import { EventBus, EventType } from '../services/EventBus';
import { storage } from '../utils/storage';

const STORAGE_KEY = 'vademecum_tray';

interface TrayContextType {
  tray: Product[];
  toggleProduct: (product: Product) => void;
  clearTray: () => void;
  isInTray: (sku: string) => boolean;
}

const TrayContext = createContext<TrayContextType | undefined>(undefined);

export const TrayProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tray, setTray] = useState<Product[]>(() => storage.get<Product[]>(STORAGE_KEY, []));

  const toggleProduct = useCallback((product: Product) => {
    setTray(prev => {
      const exists = prev.find(p => p.sku === product.sku);
      const newTray = exists 
        ? prev.filter(p => p.sku !== product.sku)
        : [...prev, product];
      return newTray;
    });
  }, []);

  const clearTray = useCallback(() => setTray([]), []);

  const isInTray = useCallback((sku: string) => tray.some(p => p.sku === sku), [tray]);

  // Sincronización con persistencia y eventos
  useEffect(() => {
    storage.set(STORAGE_KEY, tray);
    EventBus.emit(EventType.TRAY_CHANGED, { products: tray });
  }, [tray]);

  const value = useMemo(() => ({
    tray,
    toggleProduct,
    clearTray,
    isInTray
  }), [tray, toggleProduct, clearTray, isInTray]);

  return (
    <TrayContext.Provider value={value}>
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
