import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import { Search, Database, Settings, Loader2, Activity, ShieldCheck, Menu, X, Zap, Snowflake } from 'lucide-react';
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
import { aiLoadStrategy } from '../../services/AILoadStrategy';

import { Button } from '@/components/ui/button';

// Lazy load modules
const SearchModule = lazy(() => import('../../modules/search/SearchModule').then(m => ({ default: m.SearchModule })));
const DatabaseModule = lazy(() => import('../../modules/database/DatabaseModule').then(m => ({ default: m.DatabaseModule })));
const GraphExplorerModule = lazy(() => import('../../modules/graph/GraphExplorerModule').then(m => ({ default: m.GraphExplorerModule })));
const SettingsModule = lazy(() => import('../../modules/settings/SettingsModule').then(m => ({ default: m.SettingsModule })));

const ModuleLoader = () => (
  <div className="flex flex-col items-center justify-center py-24">
    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
    <p className="text-slate-500 text-sm">Cargando...</p>
  </div>
);

interface DashboardProps {
  hardware: HardwareProfile;
}

/**
 * Dashboard - Clean and Simple
 * Main navigation hub for the application
 */
export const Dashboard: React.FC<DashboardProps> = ({ hardware }) => {
  const [activeTab, setActiveTab] = useState<'search' | 'graph' | 'database' | 'settings'>('search');
  const [isAiProcessingEnabled, setIsAiProcessingEnabled] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAccessGranted } = useAuth();

  // Initialize services
  useEffect(() => {
    if (hardware) {
      aiService.configure(hardware);
      // Carga bajo demanda del motor IA - no iniciar automáticamente
      // Cargar nivel óptimo basado en hardware (bajo demanda)
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

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'Control+k': () => {
      // Could open command palette
    },
  });

  const navItems = [
    { id: 'search', label: 'Buscar', icon: Search },
    { id: 'graph', label: 'Venta Cruzada', icon: Activity },
    { id: 'database', label: 'Catálogo', icon: Database },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ] as const;

  return (
    <ConsultationProvider>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <OfflineIndicator />
        
        {/* Header */}
        <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
            
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-slate-900">Vademécum</h1>
                <p className="text-xs text-slate-500">Asistente IA</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    activeTab === item.id
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* AI Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAiProcessing}
                className={`hidden sm:flex items-center gap-2 px-3 ${
                  isAiProcessingEnabled 
                    ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' 
                    : 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                }`}
              >
                {isAiProcessingEnabled ? (
                  <>
                    <Zap className="w-4 h-4" />
                    <span className="text-sm font-medium">IA Activa</span>
                  </>
                ) : (
                  <>
                    <Snowflake className="w-4 h-4" />
                    <span className="text-sm font-medium">IA Pausada</span>
                  </>
                )}
              </Button>
              
              <UserMenu />

              {/* Mobile Menu */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-slate-200 bg-white p-4">
              <nav className="grid grid-cols-2 gap-2">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2 justify-center ${
                      activeTab === item.id
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto">
            <Suspense fallback={<ModuleLoader />}>
              {activeTab === 'search' && <SearchModule />}
              {activeTab === 'graph' && <GraphExplorerModule />}
              {activeTab === 'database' && <DatabaseModule />}
              {activeTab === 'settings' && <SettingsModule />}
            </Suspense>
          </div>
        </main>

        {/* Overlay Layers */}
        <FloatingTray />
        <AIStatusIndicator />
        <ComparisonTray />
        <ClinicalBrainTray />

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Solo para uso profesional de la salud</span>
            </div>
            <div className="flex items-center gap-4">
              <span>{hardware.deviceTier}</span>
              <span>&copy; 2026 Vademécum IA</span>
            </div>
          </div>
        </footer>
      </div>
    </ConsultationProvider>
  );
};
