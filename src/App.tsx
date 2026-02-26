import React, { useState } from 'react';
import { AppBootstrapper } from './core/bootstrapper/AppBootstrapper';
import { SearchModule } from './modules/search/SearchModule';
import { DatabaseModule } from './modules/database/DatabaseModule';
import { SettingsModule } from './modules/settings/SettingsModule';
import { Activity, DownloadCloud, Search, Database, Settings } from 'lucide-react';
import { WebScraperManager } from './services/WebScraperManager';
import { ScraperProgress } from './components/scraper/ScraperProgress';
import { TrayProvider } from './context/TrayContext';
import { FloatingTray } from './components/tray/FloatingTray';
import { SplashScreen } from './components/SplashScreen';
import { HardwareProfile } from './core/types/hardware.types';

interface DashboardProps {
  hardware: HardwareProfile;
}

function Dashboard({ hardware }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'database' | 'settings'>('search');

  const handleStartBackgroundSync = () => {
    WebScraperManager.startBackgroundSync(hardware);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8 text-center relative">
        <div className="absolute right-0 top-0">
          <button
            onClick={handleStartBackgroundSync}
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 rounded-xl text-sm font-medium transition-colors border border-slate-200 hover:border-indigo-200 shadow-sm"
            title="Extraer nuevos productos desde la web en segundo plano"
          >
            <DownloadCloud className="w-4 h-4" />
            Auto-Scraping Web
          </button>
        </div>

        <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-2xl mb-6">
          <Activity className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
          Vademécum Inteligente
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Consulta de medicamentos con razonamiento clínico local. Rápido, seguro y sin conexión a internet.
        </p>
      </header>

      {/* Navegación Principal */}
      <div className="flex justify-center mb-12">
        <div className="inline-flex bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'search' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <Search className="w-4 h-4" />
            Buscador
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'database' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <Database className="w-4 h-4" />
            Base de Datos
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'settings' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <Settings className="w-4 h-4" />
            Configuración
          </button>
        </div>
      </div>

      {/* Contenido Dinámico */}
      <div className="mb-16">
        {activeTab === 'search' && <SearchModule />}
        {activeTab === 'database' && <DatabaseModule />}
        {activeTab === 'settings' && <SettingsModule />}
      </div>

      <ScraperProgress />
      <FloatingTray />
    </div>
  );
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
        <Dashboard hardware={hardware!} />
      </TrayProvider>
    </AppBootstrapper>
  );
}
