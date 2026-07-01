import React, { useState, useEffect, Suspense, lazy, useMemo, useCallback } from 'react';
import { Search, Database, Settings, Loader2, ShieldAlert, Share2, Zap, Snowflake, Menu, X, Leaf } from 'lucide-react';
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
    <p className="text-muted-foreground font-medium">Cargando...</p>
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

  const { viewedProductSku, setViewedProduct } = useStore();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [isAiProcessingEnabled, setIsAiProcessingEnabled] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (viewedProductSku) {
      dataService.getProductBySku(viewedProductSku).then(p => {
        if (p) setSelectedProduct(p as unknown as Product);
      });
    } else {
      setSelectedProduct(null);
    }
  }, [viewedProductSku]);

  const focusSearch = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (activeTab !== 'search') setActiveTab('search');
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  }, [activeTab]);

  useKeyboardShortcuts({
    'Control+k': () => setIsCommandPaletteOpen(prev => !prev),
    'Meta+k': () => setIsCommandPaletteOpen(prev => !prev),
    'Control+f': focusSearch,
    'Meta+f': focusSearch,
  });

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
      logger.info('Procesamiento IA pausado', 'Sistema');
    } else {
      logger.success('IA reactivada', 'Sistema');
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
    { id: 'search', label: 'Inicio', icon: Leaf },
    { id: 'database', label: 'Catálogo', icon: Database },
    { id: 'graph', label: 'Venta Cruzada', icon: Share2 },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ] as const;

  return (
    <ConsultationProvider>
      <div className="min-h-screen bg-stone-50 text-stone-900">
        <OfflineIndicator />
        
        {/* Header */}
        <header className="sticky top-0 z-50 w-full bg-white border-b border-stone-200 shadow-sm">
          <div className="container flex h-14 items-center justify-between gap-4">
            
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100">
                <Leaf className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-sm font-bold text-stone-900">Vademécum</h1>
                <p className="text-[10px] text-stone-500">Suplementos & Fitoterapia</p>
              </div>
            </div>

            {/* Search Bar - Always visible */}
            <div className="flex-1 max-w-2xl px-4 hidden md:block">
               <SearchBar 
                  ref={searchInputRef}
                  query={query} 
                  setQuery={setQuery} 
                  isSearching={isSearching}
                  suggestions={conceptualSuggestions}
                  onSelectConcept={(concept) => setQuery(concept.label)}
                  onAiQuery={() => setShowAiAnalysis(true)}
                  className="w-full"
                />
            </div>

            {/* Nav */}
            <div className="flex items-center gap-1">
              <div className="hidden sm:flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
                {navItems.map(item => (
                  <Button 
                    key={item.id}
                    variant="ghost" 
                    size="sm"
                    className={`h-9 px-3 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === item.id ? 'bg-white text-emerald-700 shadow-sm font-semibold' : 'text-stone-600 hover:text-stone-900'}`}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="text-xs">{item.label}</span>
                  </Button>
                ))}
              </div>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleAiProcessing}
                title={isAiProcessingEnabled ? "IA Activa" : "IA Pausada"}
                className={`h-9 w-9 rounded-lg ${isAiProcessingEnabled ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}`}
              >
                {isAiProcessingEnabled ? <Zap className="h-4 w-4" /> : <Snowflake className="h-4 w-4" />}
              </Button>
              
              <UserMenu />

              <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 rounded-lg" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                 {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 top-14 z-40 bg-white md:hidden">
            <div className="flex flex-col p-4 space-y-4">
              <SearchBar 
                query={query} 
                setQuery={setQuery} 
                isSearching={isSearching}
                suggestions={conceptualSuggestions}
                onSelectConcept={(concept) => { setQuery(concept.label); setIsMobileMenuOpen(false); }}
                onAiQuery={() => { setShowAiAnalysis(true); setIsMobileMenuOpen(false); }}
              />
              <div className="grid grid-cols-2 gap-2">
                {navItems.map(item => (
                  <Button 
                    key={item.id} 
                    variant={activeTab === item.id ? "default" : "outline"}
                    className="h-14 flex flex-col gap-1 rounded-xl"
                    onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-xs">{item.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Search */}
        <div className="md:hidden px-4 py-3 bg-white border-b border-stone-200">
          <SearchBar 
            query={query} 
            setQuery={setQuery} 
            isSearching={isSearching}
            suggestions={conceptualSuggestions}
            onSelectConcept={(concept) => setQuery(concept.label)}
            onAiQuery={() => setShowAiAnalysis(true)}
            className="w-full"
          />
        </div>

        <main className="container py-6 md:py-8">
          <div className="max-w-6xl mx-auto min-h-[60vh]">
            <Suspense fallback={<ModuleLoader />}>
              <div className="animate-in fade-in duration-300">
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

        {/* Footer */}
        <footer className="w-full border-t border-stone-200 bg-white py-4 mt-12">
          <div className="container flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-stone-500">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Información orientativa. Consulta con un profesional.</span>
            </div>
            <div>
              &copy; 2026 Vademécum - Suplementos & Fitoterapia
            </div>
          </div>
        </footer>
      </div>
    </ConsultationProvider>
  );
};
