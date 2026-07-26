import React, { useEffect, useState } from 'react';
import { useHardwareDetection } from '../../hooks/useHardwareDetection';
import { logger } from '../../services/LoggerService';

import { taskProcessorService } from '../../services/TaskProcessorService';
import { automationTriggerService } from '../../services/AutomationTriggerService';
import { seedDrugData } from '../../services/drugInteractionService';
import { dataService } from '../../services/DataService';
import { useStore } from '../../store/useStore';
import { drugFamiliesCollection } from '../../database';
import { Q } from '@nozbe/watermelondb';

interface AppBootstrapperProps {
  children: React.ReactNode;
}

export const AppBootstrapper: React.FC<AppBootstrapperProps> = ({ children }) => {
  const { hardware, isDetecting: isDetectingHardware } = useHardwareDetection();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      // Database is already initialized in App.tsx via SplashScreen
      taskProcessorService.start();
      automationTriggerService.start();

      // Seed data if empty
      const families = await drugFamiliesCollection.query().fetch();
      if (families.length === 0) {
        await seedDrugData();
      }

      // Cargar productos en Zustand store
      const products = await dataService.getAllProducts();
      useStore.getState().setProducts(products);
      logger.debug('Productos cargados en store: ' + products.length, 'AppBootstrapper');

      setIsReady(true);
    };
    initialize();
  }, []);

  if (isDetectingHardware || !isReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <h2 className="text-lg font-medium">Iniciando Vademécum...</h2>
        <p className="text-sm text-muted-foreground mt-2">
          {"Preparando sistema clínico..."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Context Providers para Hardware y DB irían aquí si usamos Context API */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};
