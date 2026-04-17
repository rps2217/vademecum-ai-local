import React, { useEffect, useState } from 'react';
import { useHardwareDetection } from '../../hooks/useHardwareDetection';
import { SQLiteService } from '../../core/database/sqliteService';

interface AppBootstrapperProps {
  children: React.ReactNode;
}

export const AppBootstrapper: React.FC<AppBootstrapperProps> = ({ children }) => {
  const { hardware, isDetecting: isDetectingHardware } = useHardwareDetection();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
        await SQLiteService.initialize();
        setIsReady(true);
    };
    init();
  }, []);

  if (isDetectingHardware || !isReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <h2 className="text-lg font-medium">Iniciando Vademécum...</h2>
        <p className="text-sm text-slate-500 mt-2">
          {isDetectingHardware ? 'Analizando capacidades del sistema...' : 'Preparando base de datos local...'}
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
