import React, { useState, useEffect } from 'react';
import { SearchModule } from '../../modules/search/SearchModule';
import { DatabaseModule } from '../../modules/database/DatabaseModule';
import { AIEngineModule } from '../../modules/ai/AIEngineModule';
import { SettingsModule } from '../../modules/settings/SettingsModule';
import { BatchScraper } from '../../modules/scraper/BatchScraper';
import { SetupModule } from '../../modules/setup/SetupModule';
import { Activity, Search, Database, Settings, Globe, Monitor, Cpu } from 'lucide-react';
import { HardwareProfile } from '../../core/types/hardware.types';
import { AIService } from '../../services/AIService';
import { FirebaseSyncService } from '../../services/FirebaseSyncService';
import { QuotaMonitorService } from '../../services/QuotaMonitorService';
import { useAuth } from '../../context/AuthContext';
import { UserMenu } from './UserMenu';
import { FloatingTray } from '../tray/FloatingTray';
import { AIStatusIndicator } from '../AIStatusIndicator';

interface DashboardProps {
  hardware: HardwareProfile;
}

export const Dashboard: React.FC<DashboardProps> = ({ hardware }) => {
  const [activeTab, setActiveTab] = useState<'search' | 'database' | 'ai-engine' | 'scraper' | 'setup' | 'settings'>('search');
  const { isAccessGranted } = useAuth();

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
    { id: 'search', label: 'Buscador', icon: Search },
    { id: 'database', label: 'Base de Datos', icon: Database },
    { id: 'ai-engine', label: 'Motor de IA', icon: Cpu },
    { id: 'scraper', label: 'Scraper Masivo', icon: Globe },
    { id: 'setup', label: 'Instalación PC', icon: Monitor },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ] as const;

  return (
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
          <div className="flex items-center">
            <UserMenu />
          </div>
        </div>

        {/* Contenido Dinámico */}
        <div className="mb-16">
          {activeTab === 'search' && <SearchModule />}
          {activeTab === 'database' && <DatabaseModule />}
          {activeTab === 'ai-engine' && <AIEngineModule />}
          {activeTab === 'scraper' && <BatchScraper />}
          {activeTab === 'setup' && <SetupModule />}
          {activeTab === 'settings' && <SettingsModule />}
        </div>

        <FloatingTray />
        <AIStatusIndicator />
      </div>
    </div>
  );
};
