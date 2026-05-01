import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Search, Database, Settings, Loader2, Command, Activity, ShieldAlert, Monitor, Globe, Share2, Zap, Snowflake } from 'lucide-react';
import { HardwareProfile } from '../../core/types/hardware.types';
import { aiService } from '../../services/AIService';
import { cloudSyncService } from '../../services/CloudSyncService';
import { taskProcessorService } from '../../services/TaskProcessorService';
import { useAuth } from '../../context/AuthContext';
import { UserMenu } from './UserMenu';
import { FloatingTray } from '../tray/FloatingTray';
import { AIStatusIndicator } from '../AIStatusIndicator';
import { CommandPalette } from '../navigation/CommandPalette';
import { ComparisonTray } from '../comparison/ComparisonTray';
import { Product } from '../../core/types/product.types';
import { ProductDetailModal } from '../../modules/product/ProductDetailModal';
import { ConsultationProvider } from '../../context/ConsultationContext';
import { ClinicalBrainTray } from '../tray/ClinicalBrainTray';
import { OfflineIndicator } from '../common/OfflineIndicator';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

// Lazy load modules
const SearchModule = lazy(() => import('../../modules/search/SearchModule').then(m => ({ default: m.SearchModule })));
const DatabaseModule = lazy(() => import('../../modules/database/DatabaseModule').then(m => ({ default: m.DatabaseModule })));
const GraphExplorerModule = lazy(() => import('../../modules/graph/GraphExplorerModule').then(m => ({ default: m.GraphExplorerModule })));
const SettingsModule = lazy(() => import('../../modules/settings/SettingsModule').then(m => ({ default: m.SettingsModule })));

const ModuleLoader = () => (
  <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
    <Loader2 className="w-10 h-10 text-brand-primary animate-spin mb-4" />
    <p className="text-slate-500 font-medium tracking-wide uppercase text-[10px]">Cargando módulo...</p>
  </div>
);

interface DashboardProps {
  hardware: HardwareProfile;
}

export const Dashboard: React.FC<DashboardProps> = ({ hardware }) => {
  const [activeTab, setActiveTab] = useState<'search' | 'graph' | 'database' | 'settings'>('search');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { isAccessGranted } = useAuth();

  const [isAiProcessingEnabled, setIsAiProcessingEnabled] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Sincronizar estado inicial
    setIsAiProcessingEnabled(taskProcessorService.getStatus());
  }, []);

  const toggleAiProcessing = () => {
    const newState = !isAiProcessingEnabled;
    taskProcessorService.setEnabled(newState);
    setIsAiProcessingEnabled(newState);
    if (!newState) {
      logger.info('Procesamiento IA pausado manualmente (Modo Enfriamiento)', 'Sistema');
    } else {
      logger.success('Procesamiento IA reanudado', 'Sistema');
    }
  };

  // Atajos de teclado globales
  useKeyboardShortcuts({
    'Control+k': () => setIsCommandPaletteOpen(prev => !prev),
    'Meta+k': () => setIsCommandPaletteOpen(prev => !prev),
  });

  useEffect(() => {
    if (hardware) {
      aiService.configure(hardware);
      aiService.startEngine().catch(console.error);
    }
  }, [hardware]);

  useEffect(() => {
    if (isAccessGranted) {
      cloudSyncService.init(); // Inicialización reactiva
    }
  }, [isAccessGranted]);

  const navItems = [
    { id: 'search', label: 'Buscador', icon: Search },
    { id: 'graph', label: 'Explorador de Sinergias', icon: Share2 },
    { id: 'database', label: 'Base de Datos', icon: Database },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ] as const;

  return (
    <ConsultationProvider>
      <div className="min-h-screen bg-brand-bg text-slate-200 selection:bg-brand-primary/30 selection:text-white">
        <OfflineIndicator />
        
        {/* Static Atmospheric Background - High Performance */}
        <div className="atmospheric-bg">
          <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-brand-primary/5 to-transparent pointer-events-none" />
          <div className="spotlight w-[500px] h-[500px] bg-brand-primary/10 -top-48 -left-48" />
          <div className="spotlight w-[400px] h-[400px] bg-blue-500/5 top-1/4 right-0" />
        </div>

        {/* Top Header - Simplified */}
        <header className={`sticky top-0 z-[60] bg-brand-bg border-b border-white/5 px-4 py-2 sm:px-6 transition-all duration-500 ease-in-out ${
          isScrolled && activeTab === 'search' ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        }`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Simple Logo Icon */}
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/10">
                <Activity className="w-4 h-4 text-emerald-500" />
              </div>
            </div>

            {/* Navigation Tabs (Minimalist) */}
            <nav className="flex items-center p-1 bg-white/5 rounded-2xl border border-white/5 mx-2">
              <button 
                onClick={() => setActiveTab('search')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'search' ? 'bg-brand-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Buscador</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('graph')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'graph' ? 'bg-brand-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sinergias</span>
              </button>

              <button 
                onClick={() => setActiveTab('database')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'database' ? 'bg-brand-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Base de Datos</span>
              </button>

              <button 
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'settings' ? 'bg-brand-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ajustes</span>
              </button>
            </nav>

            {/* Simple Actions */}
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleAiProcessing}
                className={`p-1.5 rounded-xl border transition-all ${
                  isAiProcessingEnabled 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : 'bg-sky-500/10 border-sky-500/20 text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.1)]'
                }`}
                title={isAiProcessingEnabled ? "IA Activa" : "IA Pausada (Modo Frío)"}
              >
                {isAiProcessingEnabled ? <Zap className="w-3.5 h-3.5" /> : <Snowflake className="w-3.5 h-3.5 animate-pulse" />}
              </button>
              
              <UserMenu />
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-4 pb-24 md:pb-20 transition-all duration-300">
          {/* Contenido Dinámico con Suspense */}
          <Suspense fallback={<ModuleLoader />}>
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
              {activeTab === 'search' && <SearchModule />}
              {activeTab === 'graph' && <GraphExplorerModule />}
              {activeTab === 'database' && <DatabaseModule />}
              {activeTab === 'settings' && <SettingsModule />}
            </div>
          </Suspense>
        </main>

        {/* Mobile Bottom Navigation - Enhanced Glass */}
        <nav className={`fixed bottom-0 left-0 w-full z-[70] md:hidden bg-slate-950/40 backdrop-blur-2xl border-t border-white/5 px-2 py-3 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.5)] transition-all duration-500 ${
          isScrolled && activeTab === 'search' ? 'translate-y-full' : 'translate-y-0'
        }`}>
          <div className="flex items-center justify-around">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1.5 relative px-3 transition-colors duration-300 ${
                  activeTab === item.id ? 'text-brand-primary' : 'text-slate-500'
                }`}
              >
                <div className={`p-2 rounded-2xl transition-all duration-500 ${
                  activeTab === item.id ? 'bg-brand-primary/20 text-brand-primary scale-110' : 'hover:bg-white/5'
                }`}>
                  <item.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest opacity-80">{item.label.split(' ')[0]}</span>
                {activeTab === item.id && (
                  <div className="absolute -top-3 w-1 h-1 bg-brand-primary rounded-full shadow-[0_0_10px_#f97316]" />
                )}
              </button>
            ))}
          </div>
        </nav>

        <FloatingTray />
        <AIStatusIndicator />
        <ComparisonTray />
        <ClinicalBrainTray />

        <CommandPalette 
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onSelectProduct={setSelectedProduct}
          onNavigate={(tab) => {
            setActiveTab(tab);
            setIsCommandPaletteOpen(false);
          }}
        />

        {selectedProduct && (
          <ProductDetailModal 
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
          />
        )}

        {/* Footer estilo POS (Mint Green) */}
        <div className={`fixed bottom-0 left-0 w-full bg-[#10b981] font-medium py-1.5 z-[100] hidden md:block border-t border-[#059669] transition-all duration-500 ${
          isScrolled && activeTab === 'search' ? 'translate-y-full' : 'translate-y-0'
        }`}>
          <div className="max-w-7xl mx-auto px-6 flex justify-center items-center text-[#064e3b] text-[11px]">
               <span 
                 onClick={() => setActiveTab('search')}
                 className="flex items-center gap-1.5 hover:text-black cursor-pointer font-bold uppercase tracking-widest"
               >
                 <Search className="w-4 h-4" /> Abrir Buscador
               </span>
          </div>
        </div>
      </div>
    </ConsultationProvider>
  );
};
