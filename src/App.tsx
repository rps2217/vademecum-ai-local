import React, { useState, useEffect } from 'react';
import { AppBootstrapper } from './core/bootstrapper/AppBootstrapper';
import { SearchModule } from './modules/search/SearchModule';
import { DatabaseModule } from './modules/database/DatabaseModule';
import { SettingsModule } from './modules/settings/SettingsModule';
import { Activity, DownloadCloud, Search, Database, Settings, FileText, Globe } from 'lucide-react';
import { TrayProvider } from './context/TrayContext';
import { FloatingTray } from './components/tray/FloatingTray';
import { SplashScreen } from './components/SplashScreen';
import { HardwareProfile } from './core/types/hardware.types';
import { AIService } from './services/AIService';
import { BatchScraper } from './modules/scraper/BatchScraper';

interface DashboardProps {
  hardware: HardwareProfile;
}

function Dashboard({ hardware }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'database' | 'scraper' | 'settings'>('search');

  useEffect(() => {
    if (hardware) {
      // Solo configuramos el perfil de hardware, NO iniciamos el motor pesado.
      AIService.configure(hardware);
    }
  }, [hardware]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center relative">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl mb-6 border border-indigo-500/20">
            <Activity className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-3">
            Vademécum Inteligente
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Consulta de medicamentos con razonamiento clínico local. Rápido, seguro y sin conexión a internet.
          </p>
        </header>

        {/* Navegación Principal */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-sm overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'search' 
                  ? 'bg-slate-800 text-indigo-400 shadow-lg shadow-indigo-500/10 border border-slate-700' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              <Search className="w-4 h-4" />
              Buscador
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'database' 
                  ? 'bg-slate-800 text-indigo-400 shadow-lg shadow-indigo-500/10 border border-slate-700' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              <Database className="w-4 h-4" />
              Base de Datos
            </button>
            <button
              onClick={() => setActiveTab('scraper')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'scraper' 
                  ? 'bg-slate-800 text-indigo-400 shadow-lg shadow-indigo-500/10 border border-slate-700' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              <Globe className="w-4 h-4" />
              Scraper Masivo
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'settings' 
                  ? 'bg-slate-800 text-indigo-400 shadow-lg shadow-indigo-500/10 border border-slate-700' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
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
          {activeTab === 'scraper' && <BatchScraper />}
          {activeTab === 'settings' && <SettingsModule />}
        </div>

        <FloatingTray />
      </div>
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
