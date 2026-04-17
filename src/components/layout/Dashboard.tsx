import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Activity, Search, Database, Settings, Globe, Monitor, Cpu, Loader2, Command, FileSearch, ShieldAlert } from 'lucide-react';
import { HardwareProfile } from '../../core/types/hardware.types';
import { AIService } from '../../services/AIService';
import { FirebaseSyncService } from '../../services/FirebaseSyncService';
import { QuotaMonitorService } from '../../services/QuotaMonitorService';
import { useAuth } from '../../context/AuthContext';
import { UserMenu } from './UserMenu';
import { FloatingTray } from '../tray/FloatingTray';
import { AIStatusIndicator } from '../AIStatusIndicator';
import { CommandPalette } from '../navigation/CommandPalette';
import { ComparisonTray } from '../comparison/ComparisonTray';
import { Product } from '../../core/types/product.types';
import { ProductDetailModal } from '../../modules/product/ProductDetailModal';
import { InsightsDashboard } from '../../modules/dashboard/components/InsightsDashboard';
import { ConsultationProvider } from '../../context/ConsultationContext';
import { ClinicalBrainTray } from '../tray/ClinicalBrainTray';

// Lazy load modules
const SearchModule = lazy(() => import('../../modules/search/SearchModule').then(m => ({ default: m.SearchModule })));
const DatabaseModule = lazy(() => import('../../modules/database/DatabaseModule').then(m => ({ default: m.DatabaseModule })));
const AIEngineModule = lazy(() => import('../../modules/ai/AIEngineModule').then(m => ({ default: m.AIEngineModule })));
const SettingsModule = lazy(() => import('../../modules/settings/SettingsModule').then(m => ({ default: m.SettingsModule })));
const BatchScraper = lazy(() => import('../../modules/scraper/BatchScraper').then(m => ({ default: m.BatchScraper })));
const PDFExtractionModule = lazy(() => import('../../modules/scraper/PDFExtractionModule').then(m => ({ default: m.PDFExtractionModule })));
const SetupModule = lazy(() => import('../../modules/setup/SetupModule').then(m => ({ default: m.SetupModule })));
const GraphExplorerModule = lazy(() => import('../../modules/graph/GraphExplorerModule').then(m => ({ default: m.GraphExplorerModule })));

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
  const [activeTab, setActiveTab] = useState<'insights' | 'search' | 'graph' | 'database' | 'ai-engine' | 'scraper' | 'pdf-reader' | 'setup' | 'settings'>('search');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { isAccessGranted } = useAuth();

  // Atajo de teclado CMD+K / CTRL+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (hardware) {
      AIService.configure(hardware);
      AIService.startEngine().catch(console.error);
    }
  }, [hardware]);

  useEffect(() => {
    if (isAccessGranted) {
      const unsubscribe = FirebaseSyncService.startSync();
      QuotaMonitorService.start();
      return () => unsubscribe();
    }
  }, [isAccessGranted]);

  const navItems = [
    { id: 'insights', label: 'Dashboard', icon: Activity },
    { id: 'search', label: 'Buscador', icon: Search },
    { id: 'graph', label: 'Grafo IA', icon: Globe },
    { id: 'database', label: 'Base de Datos', icon: Database },
    { id: 'ai-engine', label: 'Motor de IA', icon: Cpu },
    { id: 'scraper', label: 'Scraper Masivo', icon: Globe },
    { id: 'pdf-reader', label: 'Lector PDF', icon: FileSearch },
    { id: 'setup', label: 'Instalación PC', icon: Monitor },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ] as const;

  return (
    <ConsultationProvider>
      <div className="min-h-screen bg-brand-bg text-slate-200 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Navegación Principal y Header Compacto */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 sm:mb-8 gap-4">
          
          {/* Logo / Icono */}
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center p-2 bg-brand-primary/10 rounded-xl border border-brand-primary/20">
              <Activity className="w-5 h-5 text-brand-primary" />
            </div>
          </div>

          {/* Tabs */}
          <div className="inline-flex bg-brand-surface/50 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-sm overflow-x-auto max-w-full no-scrollbar">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === item.id 
                    ? 'bg-brand-surface text-brand-primary shadow-lg shadow-brand-primary/10 border border-slate-700' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-brand-surface/50'
                }`}
              >
                <item.icon className="w-3.5 h-3.5 sm:w-4 h-4" />
                <span className={activeTab === item.id ? 'block' : 'hidden sm:block'}>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Acceso Profesional */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-surface/50 border border-slate-800 text-slate-500 hover:text-slate-300 transition-all group"
            >
              <Command className="w-3.5 h-3.5 group-hover:text-brand-primary transition-colors" />
              <span className="text-[10px] font-bold uppercase tracking-widest">CMD + K</span>
            </button>
            <UserMenu />
          </div>
        </div>

        {/* Contenido Dinámico con Suspense */}
        <div className="mb-16">
          <Suspense fallback={<ModuleLoader />}>
            {activeTab === 'insights' && <InsightsDashboard onNavigate={(tab: any) => setActiveTab(tab)} />}
            {activeTab === 'search' && <SearchModule />}
            {activeTab === 'graph' && <GraphExplorerModule />}
            {activeTab === 'database' && <DatabaseModule />}
            {activeTab === 'ai-engine' && <AIEngineModule />}
            {activeTab === 'scraper' && <BatchScraper />}
            {activeTab === 'pdf-reader' && <PDFExtractionModule />}
            {activeTab === 'setup' && <SetupModule />}
            {activeTab === 'settings' && <SettingsModule />}
          </Suspense>
        </div>

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

        {/* Disclaimer Institucional */}
        <div className="fixed bottom-0 left-0 w-full bg-brand-surface border-t border-slate-800 py-1.5 z-[100] hidden md:block">
          <div className="max-w-7xl mx-auto px-6 flex justify-center">
            <p className="text-[10px] text-slate-500 flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-brand-primary" />
              Esta herramienta explora opciones de fármacos, suplementos y homeopatía (sinergias y alternativas). No es un sistema de diagnóstico ni sustituye la prescripción médica profesional.
            </p>
          </div>
        </div>
      </div>
      </div>
    </ConsultationProvider>
  );
};
