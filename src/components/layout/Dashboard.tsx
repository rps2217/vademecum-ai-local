import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import { Search, Database, Settings, Loader2, Activity, ShieldCheck, Menu, X, Zap, Snowflake, Brain, Sparkles } from 'lucide-react';
import { HardwareProfile } from '../../core/types/hardware.types';
import { aiService } from '../../services/AIService';
import { cloudSyncService } from '../../services/CloudSyncService';
import { taskProcessorService } from '../../services/TaskProcessorService';
import { useAuth } from '../../context/AuthContext';
import { UserMenu } from './UserMenu';
import { FloatingTray } from '../tray/FloatingTray';
import { AIStatusIndicator } from '../AIStatusIndicator';
import { ComparisonTray } from '../comparison/ComparisonTray';
import { ClinicalBrainTray } from '../tray/ClinicalBrainTray';
import { OfflineIndicator } from '../common/OfflineIndicator';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { ConsultationProvider } from '../../context/ConsultationContext';
import { logger } from '../../services/LoggerService';
import { SemanticSearchPanel } from '../../modules/search/components/SemanticSearchPanel';
import { ProtocolsModule } from '../../modules/protocols/ProtocolsModule';

import { Button } from '@/components/ui/button';

// Lazy load modules
const SearchModule = lazy(() => import('../../modules/search/SearchModule').then(m => ({ default: m.SearchModule })));
const DatabaseModule = lazy(() => import('../../modules/database/DatabaseModule').then(m => ({ default: m.DatabaseModule })));
const GraphExplorerModule = lazy(() => import('../../modules/graph/GraphExplorerModule').then(m => ({ default: m.GraphExplorerModule })));
const SettingsModule = lazy(() => import('../../modules/settings/SettingsModule').then(m => ({ default: m.SettingsModule })));

const ModuleLoader = () => (
  <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center mb-4 animate-pulse">
      <Brain className="w-6 h-6 text-white animate-float" />
    </div>
    <p className="text-slate-500 text-sm font-medium">Cargando módulo...</p>
  </div>
);

interface DashboardProps {
  hardware: HardwareProfile;
}

/**
 * Dashboard - Medical Futurism Design
 * Sophisticated and modern interface for healthcare professionals
 */
export const Dashboard: React.FC<DashboardProps> = ({ hardware }) => {
  const [activeTab, setActiveTab] = useState<'search' | 'graph' | 'database' | 'settings'>('search');
  const [isAiProcessingEnabled, setIsAiProcessingEnabled] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSemanticSearchOpen, setIsSemanticSearchOpen] = useState(false);
  const [isProtocolsOpen, setIsProtocolsOpen] = useState(false);
  const { isAccessGranted } = useAuth();

  // Initialize services
  useEffect(() => {
    if (hardware) {
      aiService.configure(hardware);
    }
  }, [hardware]);

  useEffect(() => {
    if (isAccessGranted) {
      cloudSyncService.init();
    }
  }, [isAccessGranted]);

  useEffect(() => {
    setIsAiProcessingEnabled(taskProcessorService.getStatus());
  }, []);

  // Toggle AI processing
  const toggleAiProcessing = useCallback(() => {
    const newState = !isAiProcessingEnabled;
    taskProcessorService.setEnabled(newState);
    setIsAiProcessingEnabled(newState);
    if (!newState) {
      logger.info('Procesamiento IA pausado por el usuario', 'Sistema');
    } else {
      logger.success('IA local reactivada', 'Sistema');
    }
  }, [isAiProcessingEnabled]);

  useKeyboardShortcuts({
    'Control+k': () => {},
  });

  const navItems = [
    { id: 'search', label: 'Buscar', icon: Search },
    { id: 'graph', label: 'Venta Cruzada', icon: Activity },
    { id: 'database', label: 'Catálogo', icon: Database },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ] as const;

  return (
    <ConsultationProvider>
      <div className="min-h-screen flex flex-col relative">
        {/* Background gradient mesh */}
        <div className="fixed inset-0 gradient-mesh -z-10" />
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-100/30 via-transparent to-transparent -z-10" />
        
        <OfflineIndicator />
        
        {/* Header - Glass effect */}
        <header className="sticky top-0 z-50 w-full">
          <div className="mx-4 mt-4 rounded-2xl glass-strong">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
              
              {/* Logo */}
              <div className="flex items-center gap-3 group cursor-pointer">
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-teal-400 to-teal-600 opacity-30 blur-sm -z-10 group-hover:opacity-50 transition-opacity" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">Vademécum</h1>
                  <p className="text-xs text-slate-500 font-medium">Asistente IA Clínico</p>
                </div>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2.5 ${
                      activeTab === item.id
                        ? 'text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {activeTab === item.id && (
                      <div className="absolute inset-0 gradient-primary rounded-xl shadow-lg shadow-teal-500/20" />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'animate-fade-in' : ''}`} />
                      {item.label}
                    </span>
                  </button>
                ))}
              </nav>

              {/* Actions */}
              <div className="flex items-center gap-3">
                {/* Protocols Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsProtocolsOpen(true)}
                  className="hidden xl:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500/10 to-emerald-500/10 text-teal-700 border border-teal-200 hover:from-teal-500/20 hover:to-emerald-500/20 transition-all duration-300 btn-press"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-semibold">Protocolos</span>
                </Button>
                
                {/* Semantic Search Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSemanticSearchOpen(true)}
                  className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 text-violet-700 border border-violet-200 hover:from-violet-500/20 hover:to-purple-500/20 transition-all duration-300 btn-press"
                >
                  <Brain className="w-4 h-4" />
                  <span className="text-sm font-semibold">Búsqueda IA</span>
                </Button>
                
                {/* AI Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleAiProcessing}
                  className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 btn-press ${
                    isAiProcessingEnabled 
                      ? 'bg-gradient-to-r from-teal-500/10 to-teal-600/10 text-teal-700 border border-teal-200 hover:from-teal-500/20 hover:to-teal-600/20' 
                      : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  {isAiProcessingEnabled ? (
                    <>
                      <div className="relative">
                        <Zap className="w-4 h-4" />
                        <div className="absolute inset-0 animate-ping opacity-75">
                          <Zap className="w-4 h-4 text-teal-500" />
                        </div>
                      </div>
                      <span className="text-sm font-semibold">IA Activa</span>
                    </>
                  ) : (
                    <>
                      <Snowflake className="w-4 h-4" />
                      <span className="text-sm font-semibold">IA Pausada</span>
                    </>
                  )}
                </Button>
                
                <UserMenu />

                {/* Mobile Menu */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors btn-press"
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5 text-slate-700" /> : <Menu className="w-5 h-5 text-slate-700" />}
                </button>
              </div>
            </div>
          
            {/* Mobile Navigation */}
            {isMobileMenuOpen && (
              <div className="md:hidden px-4 pb-4 animate-fade-in-up">
                <nav className="grid grid-cols-2 gap-2">
                  {navItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`px-4 py-4 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-3 justify-center btn-press ${
                        activeTab === item.id
                          ? 'gradient-primary text-white shadow-lg shadow-teal-500/30'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 relative">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <Suspense fallback={<ModuleLoader />}>
              <div className="animate-fade-in-up">
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

        {/* Semantic Search Panel */}
        {isSemanticSearchOpen && (
          <SemanticSearchPanel
            onClose={() => setIsSemanticSearchOpen(false)}
          />
        )}

        {/* Protocols Module */}
        {isProtocolsOpen && (
          <ProtocolsModule
            onClose={() => setIsProtocolsOpen(false)}
          />
        )}

        {/* Footer - Glass effect */}
        <footer className="mt-auto">
          <div className="mx-4 mb-4 rounded-xl glass">
            <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span className="text-sm font-medium text-slate-600">Solo para uso profesional de la salud</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                <span className="px-2.5 py-1 bg-slate-100 rounded-lg">{hardware.deviceTier}</span>
                <span className="text-slate-400">•</span>
                <span>&copy; 2026 Vademécum IA</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </ConsultationProvider>
  );
};
