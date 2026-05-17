import React, { useState, useEffect, Suspense, lazy, useMemo, useCallback } from 'react';
import { Search, Database, Settings, Loader2, Command, Activity, ShieldAlert, Monitor, Globe, Share2, Zap, Snowflake, Menu, X } from 'lucide-react';
import { HardwareProfile } from '../../core/types/hardware.types';
import { aiService } from '../../services/AIService';
import { cloudSyncService } from '../../services/CloudSyncService';
import { taskProcessorService } from '../../services/TaskProcessorService';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/DataService';
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
import { useStore } from '../../store/useStore';

import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

const AIAnalysisModal = lazy(() => import('../../modules/search/components/AIAnalysisModal').then(m => ({ default: m.AIAnalysisModal })));

// Lazy load modules
const SearchModule = lazy(() => import('../../modules/search/SearchModule').then(m => ({ default: m.SearchModule })));
const DatabaseModule = lazy(() => import('../../modules/database/DatabaseModule').then(m => ({ default: m.DatabaseModule })));
const GraphExplorerModule = lazy(() => import('../../modules/graph/GraphExplorerModule').then(m => ({ default: m.GraphExplorerModule })));
const SettingsModule = lazy(() => import('../../modules/settings/SettingsModule').then(m => ({ default: m.SettingsModule })));

const ModuleLoader = () => (
  <div className="flex flex-col items-center justify-center py-24 animate-in fade-in duration-500">
    <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
    <p className="text-muted-foreground font-medium tracking-tight text-xs uppercase">Sincronizando con base clínica...</p>
  </div>
);

interface DashboardProps {
  hardware: HardwareProfile;
}

export const Dashboard: React.FC<DashboardProps> = ({ hardware }) => {
  const [activeTab, setActiveTab] = useState<'search' | 'graph' | 'database' | 'settings'>('search');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  const { isAccessGranted } = useAuth();
  const { query, setQuery, isSearching } = useSearch();
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Zustand Store
  const { viewedProductSku, setViewedProduct } = useStore();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [isAiProcessingEnabled, setIsAiProcessingEnabled] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync viewedProductSku from store to local selectedProduct for the modal
  useEffect(() => {
    if (viewedProductSku) {
      dataService.getProductBySku(viewedProductSku).then(p => {
        if (p) setSelectedProduct(p as unknown as Product);
      });
    } else {
      setSelectedProduct(null);
    }
  }, [viewedProductSku]);

  // Focus top bar search when leaving hero mode
  useEffect(() => {
    if (query.trim().length > 0 && activeTab === 'search') {
      // Delay focus slightly to ensure top SearchBar is active / un-hidden
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [query, activeTab]);

  // Focus global search bar
  const focusSearch = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (activeTab !== 'search') setActiveTab('search');
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  }, [activeTab]);

  // Global keyboard shortcuts
  useKeyboardShortcuts({
    'Control+k': () => setIsCommandPaletteOpen(prev => !prev),
    'Meta+k': () => setIsCommandPaletteOpen(prev => !prev),
    'Control+f': focusSearch,
    'Meta+f': focusSearch,
  });

  // Conceptual Suggestions Logic
  const conceptualSuggestions = useMemo(() => {
    if (query.length < 2) return [];
    const normalizedQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const concepts: SearchConcept[] = [];

    COMMON_PATHOLOGIES.forEach(p => {
      if (p.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(normalizedQuery)) {
        concepts.push({ id: `path-${p}`, label: p, type: 'pathology' });
      }
    });

    const all = searchService.getAllIndexedProducts();
    const molecules = new Set<string>();
    all.slice(0, 50).forEach(p => {
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

  useEffect(() => {
    if (query.trim().length > 0 && activeTab !== 'search') {
      setActiveTab('search');
    }
  }, [query]);

  useEffect(() => {
    setIsAiProcessingEnabled(taskProcessorService.getStatus());
  }, []);

  const toggleAiProcessing = () => {
    const newState = !isAiProcessingEnabled;
    taskProcessorService.setEnabled(newState);
    setIsAiProcessingEnabled(newState);
    if (!newState) {
      logger.info('Procesamiento IA pausado por el usuario', 'Sistema');
    } else {
      logger.success('IA local reactivada', 'Sistema');
    }
  };

  useEffect(() => {
    if (hardware) {
      aiService.configure(hardware);
      aiService.startEngine().catch(console.error);
    }
  }, [hardware]);

  useEffect(() => {
    if (isAccessGranted) {
      cloudSyncService.init();
    }
  }, [isAccessGranted]);

  const navItems = [
    { id: 'search', label: 'Buscador', icon: Search },
    { id: 'graph', label: 'Venta Cruzada', icon: Share2 },
    { id: 'database', label: 'Catálogo', icon: Database },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ] as const;

  return (
    <ConsultationProvider>
      <div className="min-h-screen bg-background text-foreground">
        <OfflineIndicator />
        
        {/* Top Header - Swiss Precision */}
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background shadow-md">
          <div className="container flex h-16 items-center justify-between gap-4">
            
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center">
                <Activity className="h-7 w-7 text-primary" />
              </div>
            </div>

            <div className={`flex-1 max-w-4xl px-4 hidden md:block w-full transition-opacity duration-300 ${activeTab === 'search' && query.trim() === '' && !viewedProductSku ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
               <div className="relative group w-full">
                 <div className="absolute -inset-1 bg-primary rounded-2xl blur-lg opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
                 <SearchBar 
                    ref={searchInputRef}
                    query={query} 
                    setQuery={setQuery} 
                    isSearching={isSearching}
                    suggestions={conceptualSuggestions}
                    onSelectConcept={(concept) => setQuery(concept.label)}
                    onAiQuery={() => setShowAiAnalysis(true)}
                    className="relative bg-card border-border shadow-none w-full"
                  />
               </div>
            </div>

            {/* Actions & User */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 mr-2 bg-muted p-1.5 rounded-2xl border border-border">
                {navItems.map(item => (
                  <Button 
                    key={item.id}
                    variant="ghost" 
                    className={`h-11 px-4 rounded-xl transition-all flex items-center gap-2 ${activeTab === item.id ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-card'}`}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="font-semibold text-sm">{item.label}</span>
                  </Button>
                ))}
                
                <Separator orientation="vertical" className="h-6 mx-2 bg-border" />
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleAiProcessing}
                  title={isAiProcessingEnabled ? "IA Activa" : "IA Pausada"}
                  className={`h-11 w-11 rounded-xl transition-all ${isAiProcessingEnabled ? 'text-emerald-500 bg-emerald-100 hover:bg-emerald-200 border border-emerald-200' : 'text-amber-500 bg-amber-100 hover:bg-amber-200 border border-amber-200'}`}
                >
                  {isAiProcessingEnabled ? <Zap className="h-5 w-5" /> : <Snowflake className="h-5 w-5" />}
                </Button>
              </div>
              
              <UserMenu />

              {/* Mobile Menu Icon */}
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                 {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
          
          {/* Removed Search Sub-header to match image layout */}
        </header>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 top-16 z-40 bg-background md:hidden animate-in slide-in-from-top duration-300">
            <div className="flex flex-col p-6 space-y-4">
              <SearchBar 
                query={query} 
                setQuery={setQuery} 
                isSearching={isSearching}
                suggestions={conceptualSuggestions}
                onSelectConcept={(concept) => { setQuery(concept.label); setIsMobileMenuOpen(false); }}
                onAiQuery={() => { setShowAiAnalysis(true); setIsMobileMenuOpen(false); }}
              />
              <div className="grid grid-cols-2 gap-4 mt-8">
                {navItems.map(item => (
                  <Button 
                    key={item.id} 
                    variant={activeTab === item.id ? "default" : "outline"}
                    className="h-20 flex flex-col gap-2 rounded-xl"
                    onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                  >
                    <item.icon className="h-6 w-6" />
                    <span className="text-xs font-semibold">{item.label}</span>
                  </Button>
                ))}
              </div>
              <div className="pt-8 flex items-center justify-between">
                <span className="text-sm font-medium">IA Local</span>
                <Button 
                  variant="outline" 
                  onClick={toggleAiProcessing}
                  className={isAiProcessingEnabled ? 'border-emerald-500 text-emerald-600' : 'border-amber-500 text-amber-600'}
                >
                  {isAiProcessingEnabled ? 'Activa' : 'En pausa'}
                </Button>
              </div>
            </div>
          </div>
        )}

        <main className="container py-8 md:py-12">
          {/* High White Space Module Container */}
          <div className="max-w-6xl mx-auto min-h-[60vh]">
            <Suspense fallback={<ModuleLoader />}>
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                {activeTab === 'search' && <SearchModule />}
                {activeTab === 'graph' && <GraphExplorerModule />}
                {activeTab === 'database' && <DatabaseModule />}
                {activeTab === 'settings' && <SettingsModule />}
              </div>
            </Suspense>
          </div>
        </main>

        {/* Overlay Layers */}
        <FloatingTray />
        <AIStatusIndicator />
        <ComparisonTray />
        <ClinicalBrainTray />

        <CommandPalette 
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onSelectProduct={(p) => setViewedProduct(p.sku)}
          onNavigate={(tab) => {
            setActiveTab(tab);
            setIsCommandPaletteOpen(false);
          }}
        />

        {selectedProduct && (
          <ProductDetailModal 
            product={selectedProduct}
            onClose={() => setViewedProduct(null)}
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

        {/* Clinical Disclaimer Static */}
        <footer className="w-full border-t bg-muted py-4 mt-20">
          <div className="container flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-3 w-3" />
              <span>Solo para uso profesional de la salud</span>
            </div>
            <div className="flex items-center gap-6">
              <span>IA Local Activa</span>
              <span>Hardware: {hardware.deviceTier} ({hardware.logicalProcessors} núcleos)</span>
            </div>
            <div>
              &copy; 2026 Vademécum Inteligente SL
            </div>
          </div>
        </footer>
      </div>
    </ConsultationProvider>
  );
};
