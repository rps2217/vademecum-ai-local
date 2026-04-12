import React, { useState, useEffect } from 'react';
import { AppBootstrapper } from './core/bootstrapper/AppBootstrapper';
import { SearchModule } from './modules/search/SearchModule';
import { DatabaseModule } from './modules/database/DatabaseModule';
import { SettingsModule } from './modules/settings/SettingsModule';
import { Activity, DownloadCloud, Search, Database, Settings, FileText, Globe, Monitor } from 'lucide-react';
import { TrayProvider } from './context/TrayContext';
import { FloatingTray } from './components/tray/FloatingTray';
import { SplashScreen } from './components/SplashScreen';
import { HardwareProfile } from './core/types/hardware.types';
import { AIService } from './services/AIService';
import { BatchScraper } from './modules/scraper/BatchScraper';
import { AIStatusIndicator } from './components/AIStatusIndicator';
import { SetupModule } from './modules/setup/SetupModule';
import { useAuth } from './context/AuthContext';
import { FirebaseSyncService } from './services/FirebaseSyncService';
import { LogIn, LogOut, User as UserIcon, Loader2, Cloud, RefreshCw, Lock } from 'lucide-react';
import { AccessGate } from './components/AccessGate';

function UserMenu() {
  const { user, login, logout, isAdmin, loading } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudHasData, setCloudHasData] = useState<boolean | null>(null);

  useEffect(() => {
    if (user) {
      FirebaseSyncService.checkCloudData().then(setCloudHasData);
    }
  }, [user]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const count = await FirebaseSyncService.uploadLocalProducts();
      setCloudHasData(true);
      alert(`¡Sincronización exitosa! Se han subido/actualizado ${count} productos en la nube.`);
    } catch (error) {
      console.error("Error syncing:", error);
      alert("Hubo un error al sincronizar con la nube.");
    } finally {
      setIsSyncing(false);
    }
  };

  if (loading) return null;

  // If not logged in with Google, show a discreet login for the admin
  if (!user) {
    return (
      <button
        onClick={login}
        className="p-2 text-slate-700 hover:text-brand-primary transition-colors"
        title="Acceso Administrador"
      >
        <Lock className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {isAdmin && cloudHasData === false && (
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center gap-2 px-4 py-2 bg-brand-accent text-brand-bg rounded-xl text-sm font-bold hover:bg-brand-accent/80 transition-all disabled:opacity-50"
        >
          {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Sincronizar Nube
        </button>
      )}
      <div className="flex items-center gap-3 bg-brand-surface border border-slate-800 px-4 py-2 rounded-xl">
        <div className="w-6 h-6 rounded-full bg-brand-primary/20 flex items-center justify-center">
          <UserIcon className="w-3.5 h-3.5 text-brand-primary" />
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none mb-1">
            {isAdmin ? 'Administrador' : 'Profesional'}
          </p>
          <p className="text-xs font-bold text-white leading-none truncate max-w-[120px]">
            {user.displayName || user.email}
          </p>
        </div>
        <button
          onClick={logout}
          className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
          title="Cerrar Sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

interface DashboardProps {
  hardware: HardwareProfile;
}

function Dashboard({ hardware }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'database' | 'scraper' | 'setup' | 'settings'>('search');
  const { user, isAccessGranted } = useAuth();

  useEffect(() => {
    if (hardware) {
      // Configurar el perfil de hardware
      AIService.configure(hardware);
      // Iniciar el motor en segundo plano automáticamente para el clúster distribuido
      AIService.startEngine().catch(console.error);
    }
  }, [hardware]);

  useEffect(() => {
    if (isAccessGranted) {
      const unsubscribe = FirebaseSyncService.startSync();
      return () => unsubscribe();
    }
  }, [isAccessGranted]);

  return (
    <div className="min-h-screen bg-brand-bg text-slate-200 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col items-center relative">
          <div className="absolute top-0 right-0">
            <UserMenu />
          </div>
          <div className="inline-flex items-center justify-center p-3 bg-brand-primary/10 rounded-2xl mb-6 border border-brand-primary/20">
            <Activity className="w-8 h-8 text-brand-primary" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-3">
            Vademécum Inteligente
          </h1>
        </header>

        {/* Navegación Principal */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-brand-surface/50 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-sm overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'search' 
                  ? 'bg-brand-surface text-brand-primary shadow-lg shadow-brand-primary/10 border border-slate-700' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-brand-surface/50'
              }`}
            >
              <Search className="w-4 h-4" />
              Buscador
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'database' 
                  ? 'bg-brand-surface text-brand-primary shadow-lg shadow-brand-primary/10 border border-slate-700' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-brand-surface/50'
              }`}
            >
              <Database className="w-4 h-4" />
              Base de Datos
            </button>
            <button
              onClick={() => setActiveTab('scraper')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'scraper' 
                  ? 'bg-brand-surface text-brand-primary shadow-lg shadow-brand-primary/10 border border-slate-700' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-brand-surface/50'
              }`}
            >
              <Globe className="w-4 h-4" />
              Scraper Masivo
            </button>
            <button
              onClick={() => setActiveTab('setup')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'setup' 
                  ? 'bg-brand-surface text-brand-primary shadow-lg shadow-brand-primary/10 border border-slate-700' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-brand-surface/50'
              }`}
            >
              <Monitor className="w-4 h-4" />
              Instalación PC
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'settings' 
                  ? 'bg-brand-surface text-brand-primary shadow-lg shadow-brand-primary/10 border border-slate-700' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-brand-surface/50'
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
          {activeTab === 'setup' && <SetupModule />}
          {activeTab === 'settings' && <SettingsModule />}
        </div>

        <FloatingTray />
        <AIStatusIndicator />
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
        <AuthConsumer hardware={hardware!} />
      </TrayProvider>
    </AppBootstrapper>
  );
}

function AuthConsumer({ hardware }: { hardware: HardwareProfile }) {
  const { isAccessGranted } = useAuth();

  if (!isAccessGranted) {
    return <AccessGate />;
  }

  return <Dashboard hardware={hardware} />;
}
