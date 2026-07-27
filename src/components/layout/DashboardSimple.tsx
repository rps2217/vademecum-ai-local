/**
 * DashboardSimple - Interfaz Minimalista
 * Enfoque total en el buscador
 */

import React, { useState, Suspense, lazy } from 'react';
import { Search, Database, Settings, Menu, X, Loader2 } from 'lucide-react';
import { HardwareProfile } from '../../core/types/hardware.types';
import { UserMenu } from './UserMenu';
import { FloatingTray } from '../tray/FloatingTray';
import { OfflineIndicator } from '../common/OfflineIndicator';
import { SettingsProvider } from '../../context/SettingsContext';
import { AuthProvider } from '../../context/AuthContext';

// Lazy load modules
const SearchModuleSimple = lazy(() => 
  import('../../modules/search/SearchModuleSimple').then(m => ({ default: m.SearchModuleSimple }))
);
const DatabaseModule = lazy(() => 
  import('../../modules/database/DatabaseModule').then(m => ({ default: m.DatabaseModule }))
);
const SettingsModule = lazy(() => 
  import('../../modules/settings/SettingsModule').then(m => ({ default: m.SettingsModule }))
);

const ModuleLoader = () => (
  <div className="flex flex-col items-center justify-center py-24">
    <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
  </div>
);

interface DashboardSimpleProps {
  hardware: HardwareProfile;
}

/**
 * DashboardSimple - Minimalista y enfocado
 * Solo lo esencial: buscador + navegación simple
 */
export const DashboardSimple: React.FC<DashboardSimpleProps> = ({ hardware }) => {
  const [activeTab, setActiveTab] = useState<'search' | 'database' | 'settings'>('search');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'search', label: 'Buscar', icon: Search },
    { id: 'database', label: 'Catálogo', icon: Database },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ] as const;

  const renderModule = () => {
    switch (activeTab) {
      case 'search':
        return <SearchModuleSimple />;
      case 'database':
        return <DatabaseModule />;
      case 'settings':
        return <SettingsModule />;
      default:
        return <SearchModuleSimple />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Background sutil */}
      <div className="fixed inset-0 bg-gradient-to-br from-violet-50/50 via-slate-50 to-purple-50/30 -z-10" />
      
      <OfflineIndicator />

      {/* Header minimalista */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Search className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-800">Vademécum IA</span>
          </div>

          {/* Nav Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === item.id
                    ? 'bg-violet-100 text-violet-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </span>
              </button>
            ))}
          </nav>

          {/* User + Mobile toggle */}
          <div className="flex items-center gap-2">
            <UserMenu />
            
            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <nav className="md:hidden border-t border-slate-200 bg-white px-4 py-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === item.id
                    ? 'bg-violet-100 text-violet-700'
                    : 'text-slate-600'
                }`}
              >
                <span className="flex items-center gap-2">
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </span>
              </button>
            ))}
          </nav>
        )}
      </header>

      {/* Providers */}
      <SettingsProvider>
        <AuthProvider>
          {/* Contenido principal */}
          <main className="max-w-6xl mx-auto">
            <Suspense fallback={<ModuleLoader />}>
              {renderModule()}
            </Suspense>
          </main>
        </AuthProvider>
      </SettingsProvider>

      {/* Floating Tray */}
      <FloatingTray />
    </div>
  );
};

export default DashboardSimple;
