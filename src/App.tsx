import React, { useState } from 'react';
import { AppBootstrapper } from './core/bootstrapper/AppBootstrapper';
import { TrayProvider } from './context/TrayContext';
import { SplashScreen } from './components/SplashScreen';
import { HardwareProfile } from './core/types/hardware.types';
import { useAuth } from './context/AuthContext';
import { AccessGate } from './components/AccessGate';
import { Dashboard } from './components/layout/Dashboard';
import { EventTracer } from './components/debug/EventTracer';

import { SearchProvider } from './context/SearchContext';

function AuthConsumer({ hardware }: { hardware: HardwareProfile }) {
  const { isAccessGranted } = useAuth();

  if (!isAccessGranted) {
    return <AccessGate />;
  }

  return (
    <SearchProvider>
      <Dashboard hardware={hardware} />
    </SearchProvider>
  );
}

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [hardware, setHardware] = useState<HardwareProfile | null>(null);

  if (!isInitialized) {
    return (
      <SplashScreen 
        onComplete={async (detectedHardware) => {
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
        <EventTracer />
      </TrayProvider>
    </AppBootstrapper>
  );
}
