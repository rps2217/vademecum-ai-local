import React, { useState } from 'react';
import { AppBootstrapper } from './core/bootstrapper/AppBootstrapper';
import { TrayProvider } from './context/TrayContext';
import { SplashScreen } from './components/SplashScreen';
import { HardwareProfile } from './core/types/hardware.types';
import { useAuth } from './context/AuthContext';
import { AccessGate } from './components/AccessGate';
import { Dashboard } from './components/layout/Dashboard';
import { EventTracer } from './components/debug/EventTracer';
import { LiveRegion } from './hooks/useAccessibility';

import { SearchProvider } from './context/SearchContext';
import { SettingsProvider } from './context/SettingsContext';

function AuthConsumer({ hardware }: { hardware: HardwareProfile }) {
  const { isAccessGranted } = useAuth();

  if (!isAccessGranted) {
    return <AccessGate />;
  }

  return (
    <SettingsProvider>
      <SearchProvider>
        <Dashboard hardware={hardware} />
      </SearchProvider>
    </SettingsProvider>
  );
}

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [hardware, setHardware] = useState<HardwareProfile | null>(null);

  return (
    <>
      {/* Skip Links for Keyboard Navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg"
      >
        Saltar al contenido principal
      </a>

      {/* Live Region for Screen Reader Announcements */}
      <LiveRegion />

      {/* App Content */}
      {isInitialized ? (
        <AppBootstrapper>
          <TrayProvider>
            <AuthConsumer hardware={hardware!} />
            <EventTracer />
          </TrayProvider>
        </AppBootstrapper>
      ) : (
        <SplashScreen 
          onComplete={async (detectedHardware) => {
            setHardware(detectedHardware);
            setIsInitialized(true);
          }} 
        />
      )}
    </>
  );
}
