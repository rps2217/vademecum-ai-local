import React, { createContext, useContext } from 'react';
import { useStore } from '../store/useStore';

export const TrayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export const useTray = () => {
  const tray = useStore((state) => state.tray);
  const toggleTrayProduct = useStore((state) => state.toggleTrayProduct);
  const clearTray = useStore((state) => state.clearTray);
  const isInTrayStore = useStore((state) => state.isInTray);

  return {
    tray,
    toggleProduct: toggleTrayProduct,
    clearTray,
    isInTray: (sku: string) => isInTrayStore(sku),
  };
};
