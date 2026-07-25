/**
 * Vademecum AI - Aplicación Principal
 * 
 * Dashboard completo con navegación a todos los módulos.
 */

import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/layout/Dashboard';
import { useHardwareDetection } from './hooks/useHardwareDetection';
import { useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAccessGranted, checkAccess } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const init = async () => {
      await checkAccess();
      setChecking(false);
    };
    init();
  }, [checkAccess]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Cargando Vademécum IA...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  const { hardware, isLoading: hardwareLoading } = useHardwareDetection();

  if (hardwareLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Inicializando sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthGate>
      <Dashboard hardware={hardware} />
    </AuthGate>
  );
}
