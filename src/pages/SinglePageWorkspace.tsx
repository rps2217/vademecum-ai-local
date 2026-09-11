/**
 * SinglePageWorkspace - Módulo Único Integrado (Single Page Application Workspace)
 *
 * Reúne todas las páginas y herramientas de la aplicación en una sola pantalla única,
 * evitando que el usuario se complique o se pierda navegando entre distintas páginas.
 */

import { useMemo, Suspense } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { PageLoader } from '@/ui/PageLoader';
import { AdminGate } from '@/ui/AdminGate';
import {
  Info,
  Home,
  FlaskConical,
  Database,
  Package,
  Link2,
  BarChart3,
  ClipboardList,
  Shield,
  Settings,
} from 'lucide-react';

import { HomePage } from './HomePage';
import { SearchPage } from './SearchPage';
import { HomeopathyPage } from './HomeopathyPage';
import { KnowledgePage } from './KnowledgePage';
import { ProductsPage } from './ProductsPage';
import { SynergiesPage } from './SynergiesPage';
import { AnalysisPage } from './AnalysisPage';
import { ProtocolsPage } from './ProtocolsPage';
import { AdminPage } from './AdminPage';
import { SettingsPage } from './SettingsPage';

export type WorkspaceTab =
  | 'info'
  | 'home'
  | 'homeopathy'
  | 'knowledge'
  | 'products'
  | 'synergies'
  | 'analysis'
  | 'protocols'
  | 'admin'
  | 'settings'
  | 'all';

interface TabDefinition {
  id: WorkspaceTab;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  description: string;
}

const WORKSPACE_TABS: TabDefinition[] = [
  {
    id: 'info',
    label: 'Información & Buscador',
    shortLabel: 'Info & Buscador',
    icon: Info,
    badge: 'v2.1',
    description: 'Buscador omnipresente e información del sistema',
  },
  {
    id: 'home',
    label: 'Inicio Mostrador',
    shortLabel: 'Inicio',
    icon: Home,
    description: 'Dashboard principal de accesos rápidos y estadísticas',
  },
  {
    id: 'homeopathy',
    label: 'Homeopatía CH',
    shortLabel: 'Homeopatía',
    icon: FlaskConical,
    badge: '118 CH',
    description: 'Materia médica homeopática y potencias centesimales',
  },
  {
    id: 'knowledge',
    label: 'Base de Conocimiento',
    shortLabel: 'Base Conocimiento',
    icon: Database,
    badge: '634 KB',
    description: 'Fichas de activos, fitoterapia, vitaminas y minerales',
  },
  {
    id: 'products',
    label: 'Catálogo de Productos',
    shortLabel: 'Productos',
    icon: Package,
    description: 'Especialidades farmacéuticas y marcas comerciales',
  },
  {
    id: 'synergies',
    label: 'Red de Sinergias',
    shortLabel: 'Sinergias',
    icon: Link2,
    badge: '805',
    description: 'Interacciones positivas y potenciamiento de activos',
  },
  {
    id: 'analysis',
    label: 'Análisis de Interacciones',
    shortLabel: 'Análisis',
    icon: BarChart3,
    description: 'Verificador de compatibilidad y seguridad del paciente',
  },
  {
    id: 'protocols',
    label: 'Protocolos Clínicos',
    shortLabel: 'Protocolos',
    icon: ClipboardList,
    badge: '12',
    description: 'Guías de actuación clínica estandarizadas para farmacia',
  },
  {
    id: 'admin',
    label: 'Gestión & Admin',
    shortLabel: 'Admin',
    icon: Shield,
    badge: 'PIN',
    description: 'Panel de administración de la base de conocimiento',
  },
  {
    id: 'settings',
    label: 'Configuración',
    shortLabel: 'Ajustes',
    icon: Settings,
    description: 'Preferencias de tema, seguridad y sincronización',
  },
];

export function SinglePageWorkspace() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Determinar la pestaña activa según la URL actual o searchParams
  const getTabFromPath = (path: string): WorkspaceTab => {
    const cleanPath = path.replace(/^\//, '');
    if (!cleanPath) return 'info';
    if (cleanPath === 'search' || cleanPath === 'info') return 'info';
    if (cleanPath === 'homeopathy' || cleanPath === 'homeopatia') return 'homeopathy';
    if (cleanPath === 'knowledge') return 'knowledge';
    if (cleanPath === 'products') return 'products';
    if (cleanPath === 'synergies') return 'synergies';
    if (cleanPath === 'analysis') return 'analysis';
    if (cleanPath === 'protocols') return 'protocols';
    if (cleanPath === 'admin') return 'admin';
    if (cleanPath === 'settings') return 'settings';
    if (cleanPath === 'all') return 'all';
    return 'info';
  };

  const currentTab = useMemo(() => {
    const paramTab = searchParams.get('tab') as WorkspaceTab | null;
    if (paramTab && WORKSPACE_TABS.some((t) => t.id === paramTab)) {
      return paramTab;
    }
    return getTabFromPath(location.pathname);
  }, [location.pathname, searchParams]);

  const handleSelectTab = (tabId: WorkspaceTab) => {
    // Sincronizar URL suavemente sin recargar la página
    const targetPath = tabId === 'info' ? '/info' : `/${tabId}`;
    if (location.pathname !== targetPath) {
      navigate(`${targetPath}${location.search}`, { replace: true });
    } else {
      setSearchParams({ tab: tabId }, { replace: true });
    }
  };

  return (
    <div className="space-y-4 max-w-[100rem] mx-auto pb-12 px-1 sm:px-3">
      {/* BARRA DE BOTONES/PESTAÑAS ÚNICAS NAVEGABLES MINIMALISTA */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-1 scrollbar-none border-b border-border/60">
        {WORKSPACE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelectTab(tab.id)}
              className={cn(
                'flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border shrink-0',
                isActive
                  ? 'bg-primary text-primary-foreground border-primary shadow-2xs font-semibold'
                  : 'bg-background/90 text-foreground border-border/80 hover:bg-muted hover:border-primary/40'
              )}
            >
              <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-primary-foreground' : 'text-primary')} />
              <span>{tab.shortLabel}</span>
              {tab.badge && (
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded-md text-[10px] font-bold',
                    isActive
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-primary/10 text-primary'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <main className="min-h-[60vh] transition-all">
        <Suspense fallback={<PageLoader message="Cargando módulo..." />}>
          {currentTab === 'info' && <SearchPage />}
          {currentTab === 'home' && <HomePage />}
          {currentTab === 'homeopathy' && <HomeopathyPage />}
          {currentTab === 'knowledge' && <KnowledgePage />}
          {currentTab === 'products' && <ProductsPage />}
          {currentTab === 'synergies' && <SynergiesPage />}
          {currentTab === 'analysis' && <AnalysisPage />}
          {currentTab === 'protocols' && <ProtocolsPage />}
          {currentTab === 'admin' && (
            <AdminGate>
              <AdminPage />
            </AdminGate>
          )}
          {currentTab === 'settings' && <SettingsPage />}
        </Suspense>
      </main>
    </div>
  );
}
