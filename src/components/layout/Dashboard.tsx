import React, { useState, useEffect, Suspense, lazy, useMemo, useCallback } from 'react';
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

import { SearchBar } from '../../modules/search/components/SearchBar';
import { useSearch } from '../../context/SearchContext';
import { COMMON_PATHOLOGIES } from '../../constants/pathologies';
import { SearchConcept } from '../../modules/search/components/SearchSuggestions';
import { searchService } from '../../services/SearchService';
import { logger } from '../../services/LoggerService';

const AIAnalysisModal = lazy(() => import('../../modules/search/components/AIAnalysisModal').then(m => ({ default: m.AIAnalysisModal })));

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
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  const { isAccessGranted } = useAuth();
  const { query, setQuery, isSearching } = useSearch();
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const [isAiProcessingEnabled, setIsAiProcessingEnabled] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  // Focus global search bar
  const focusSearch = useCallback(() => {
    searchInputRef.current?.focus();
    if (activeTab !== 'search') setActiveTab('search');
  }, [activeTab]);

  // Global keyboard shortcuts
  useKeyboardShortcuts({
    'Control+k': () => setIsCommandPaletteOpen(prev => !prev),
    'Meta+k': () => setIsCommandPaletteOpen(prev => !prev),
    'Control+f': focusSearch,
    'Meta+f': focusSearch,
  });

  // Conceptual Suggestions Logic (Lifted from module)
  const conceptualSuggestions = useMemo(() => {
    if (query.length < 2) return [];
    const normalizedQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const concepts: SearchConcept[] = [];

    // 1. Pathologies
    COMMON_PATHOLOGIES.forEach(p => {
      if (p.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(normalizedQuery)) {
        concepts.push({ id: `path-${p}`, label: p, type: 'pathology' });
      }
    });

    // 2. Sample molecules from index (simplified)
    const all = searchService.getAllIndexedProducts();
    const molecules = new Set<string>();
    all.slice(0, 50).forEach(p => { // Fast peek
      p.principios_activos?.forEach(m => {
        if (m.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(normalizedQuery)) {
          molecules.add(m);
        }
      });
    });
    Array.from(molecules).slice(0, 5).forEach(m => {
      concepts.push({ id: `mol-${m}`, label: m, type: 'molecule' });
    });

    return concepts.slice(0, 8);
  }, [query]);

  // Auto-navigate to search when query changes from non-search tab
  useEffect(() => {
    if (query.trim().length > 0 && activeTab !== 'search') {
      setActiveTab('search');
    }
  }, [query]);

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

  // Atajos de teclado globales - Removido el anterior para usar el unificado arriba

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

        {/* Top Header - Restored */}
        <header className="sticky top-0 z-[60] bg-brand-bg/80 backdrop-blur-xl border-b border-slate-800 px-4 py-4 sm:px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-12 items-center gap-4">
            {/* Simple Logo Icon */}
            <div className="col-span-1 flex items-center">
              <div className="w-9 h-9 rounded-xl bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20">
                <Activity className="w-5 h-5 text-brand-primary" />
              </div>
            </div>

            {/* Persistent Global Search */}
            <div className="col-span-11 md:col-span-5 lg:col-span-6 px-0 sm:px-4">
              <SearchBar 
                ref={searchInputRef}
                query={query} 
                setQuery={setQuery} 
                isSearching={isSearching}
                suggestions={conceptualSuggestions}
                onSelectConcept={(concept) => setQuery(concept.label)}
                onAiQuery={() => setShowAiAnalysis(true)}
                className="!scale-90 sm:!scale-100 transition-transform origin-left"
              />
            </div>

            {/* Navigation Tabs (Original Style) */}
            <nav className="hidden lg:flex col-span-3 items-center p-1 bg-brand-surface rounded-2xl border border-slate-800">
              <button 
                onClick={() => setActiveTab('search')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'search' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'text-slate-500 hover:text-white'
                }`}
              >
                <Search className="w-4 h-4" />
                <span className="hidden md:inline">Buscador</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('graph')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'graph' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'text-slate-500 hover:text-white'
                }`}
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden md:inline">Sinergias</span>
              </button>

              <button 
                onClick={() => setActiveTab('database')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'database' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'text-slate-500 hover:text-white'
                }`}
              >
                <Database className="w-4 h-4" />
                <span className="hidden md:inline">Base de Datos</span>
              </button>

              <button 
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'settings' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'text-slate-500 hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span className="hidden md:inline">Ajustes</span>
              </button>
            </nav>

            {/* Actions Indicator */}
            <div className="col-span-11 md:col-span-6 lg:col-span-2 flex items-center justify-end gap-3">
              <div className="hidden lg:block h-8 w-px bg-slate-800 mx-1" />
              <button 
                onClick={toggleAiProcessing}
                className={`p-2 rounded-xl border transition-all ${
                  isAiProcessingEnabled 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : 'bg-sky-500/10 border-sky-500/20 text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.1)]'
                }`}
                title={isAiProcessingEnabled ? "IA Activa" : "IA Pausada (Modo Frío)"}
              >
                {isAiProcessingEnabled ? <Zap className="w-4 h-4" /> : <Snowflake className="w-4 h-4 animate-pulse" />}
              </button>
              <UserMenu />
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-4 pb-24 md:p-6 md:pb-20">
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
        <nav className="fixed bottom-0 left-0 w-full z-[70] md:hidden bg-brand-surface/80 backdrop-blur-xl border-t border-slate-800 px-2 py-3 pb-safe shadow-2xl">
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

        <Suspense fallback={null}>
          {showAiAnalysis && (
            <AIAnalysisModal 
              query={query}
              results={searchService.getLatestResults()}
              onClose={() => setShowAiAnalysis(false)}
            />
          )}
        </Suspense>

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
    </ConsultationProvider>
  );
};
