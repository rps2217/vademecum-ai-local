import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Search, Database, Settings, Loader2, Command, Activity, ShieldAlert, Monitor, Globe, Share2 } from 'lucide-react';
import { HardwareProfile } from '../../core/types/hardware.types';
import { AIService } from '../../services/AIService';
import { FirebaseSyncService } from '../../services/FirebaseSyncService';
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
      FirebaseSyncService.init(); // Inicialización reactiva
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
      <div className="min-h-screen bg-brand-bg text-slate-200 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Navegación Principal y Header al estilo Pharmacológico / POS */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 sm:mb-8 gap-4 bg-brand-surface rounded-2xl p-4 shadow-md border border-slate-700/50">
          
          {/* Logo / Info Sucursal */}
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center justify-center p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
          </div>

          {/* Tabs */}
          <div className="inline-flex bg-slate-900/50 p-1.5 rounded-xl border border-slate-700 backdrop-blur-sm overflow-x-auto max-w-full no-scrollbar">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === item.id 
                    ? 'bg-brand-primary text-white shadow-lg border border-orange-400/50' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
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
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white transition-all group"
            >
              <Command className="w-3.5 h-3.5 group-hover:text-brand-accent transition-colors" />
              <span className="text-[10px] font-bold uppercase tracking-widest">CMD+K</span>
            </button>
            <UserMenu />
          </div>
        </div>

        {/* Contenido Dinámico con Suspense */}
        <div className="mb-16">
          <Suspense fallback={<ModuleLoader />}>
            {activeTab === 'search' && <SearchModule />}
            {activeTab === 'graph' && <GraphExplorerModule />}
            {activeTab === 'database' && <DatabaseModule />}
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

        {/* Footer estilo POS (Mint Green) */}
        <div className="fixed bottom-0 left-0 w-full bg-[#10b981] font-medium py-1.5 z-[100] hidden md:block border-t border-[#059669]">
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
      </div>
    </ConsultationProvider>
  );
};
