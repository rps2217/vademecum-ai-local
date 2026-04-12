import React, { useState } from 'react';
import { AppBootstrapper } from './core/bootstrapper/AppBootstrapper';
import { TrayProvider } from './context/TrayContext';
import { SplashScreen } from './components/SplashScreen';
import { HardwareProfile } from './core/types/hardware.types';
import { useAuth } from './context/AuthContext';
import { AccessGate } from './components/AccessGate';
import { Dashboard } from './components/layout/Dashboard';

function AuthConsumer({ hardware }: { hardware: HardwareProfile }) {
  const { isAccessGranted } = useAuth();

  if (!isAccessGranted) {
    return <AccessGate />;
  }

  return <Dashboard hardware={hardware} />;
}

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [hardware, setHardware] = useState<HardwareProfile | null>(null);

  if (!isInitialized) {
    return (
      <SplashScreen 
        onComplete={(detectedHardware) => {
          setHardware(detectedHardware);
          setIsInitialized(true);
        }} 
      />
    );
  }

  return (
    <AppBootstrapper>
      <TrayProvider>
        <AuthConsumer hardware={hardware!} />
      </TrayProvider>
    </AppBootstrapper>
  );
}
