import React, { useEffect, useState } from 'react';
import { useHardwareDetection } from '../../hooks/useHardwareDetection';

import { TaskProcessorService } from '../../services/TaskProcessorService';
import { AutomationTriggerService } from '../../services/AutomationTriggerService';

interface AppBootstrapperProps {
  children: React.ReactNode;
}

export const AppBootstrapper: React.FC<AppBootstrapperProps> = ({ children }) => {
  const { hardware, isDetecting: isDetectingHardware } = useHardwareDetection();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Database is already initialized in App.tsx via SplashScreen
    TaskProcessorService.start();
    AutomationTriggerService.start();
    setIsReady(true);
  }, []);

  if (isDetectingHardware || !isReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <h2 className="text-lg font-medium">Iniciando Vademécum...</h2>
        <p className="text-sm text-slate-500 mt-2">
          {"Preparando sistema clínico..."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Context Providers para Hardware y DB irían aquí si usamos Context API */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};
