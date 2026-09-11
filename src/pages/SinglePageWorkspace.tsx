/**
 * SinglePageWorkspace - Módulo Único Integrado (Single Page Application Workspace)
 *
 * Reúne todas las páginas y herramientas de la aplicación en una sola pantalla única,
 * evitando que el usuario se complique o se pierda navegando entre distintas páginas.
 */

import { useState, useMemo, Suspense } from 'react';
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
  Layers,
  Maximize2,
  Minimize2,
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
    if (paramTab && (WORKSPACE_TABS.some((t) => t.id === paramTab) || paramTab === 'all')) {
      return paramTab;
    }
    return getTabFromPath(location.pathname);
  }, [location.pathname, searchParams]);

  // Modo de visualización: 'tabbed' (una pestaña activa) o 'continuous' (todas las secciones en una sola página larga)
  const [isContinuousView, setIsContinuousView] = useState(false);

  const handleSelectTab = (tabId: WorkspaceTab) => {
    if (tabId === 'all') {
      setIsContinuousView(true);
      setSearchParams({ tab: 'all' }, { replace: true });
    } else {
      setIsContinuousView(false);
      // Sincronizar URL suavemente sin recargar la página
      const targetPath = tabId === 'info' ? '/info' : `/${tabId}`;
      if (location.pathname !== targetPath) {
        navigate(`${targetPath}${location.search}`, { replace: true });
      } else {
        setSearchParams({ tab: tabId }, { replace: true });
      }
    }
  };

  return (
    <div className="space-y-6 max-w-[120rem] mx-auto pb-16 px-1 sm:px-3">
      {/* ===== HEADER DE MOSTRADOR ÚNICO INTEGRADO ===== */}
      <section
        className="rounded-2xl border border-primary/20 bg-gradient-to-r from-card via-card to-primary/5 p-4 sm:p-5 shadow-xs space-y-4"
        aria-label="Controles del Mostrador Único"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm shrink-0">
              <Layers className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-heading text-lg sm:text-2xl font-bold text-foreground tracking-tight">
                  Mostrador Único Vademecum
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                  Página Única Integrada
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Accede a todos los módulos y herramientas desde una sola pantalla sin complicaciones.
              </p>
            </div>
          </div>

          {/* Selector de Modo de Vista */}
          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsContinuousView(false);
                if (currentTab === 'all') handleSelectTab('info');
              }}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border',
                !isContinuousView
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                  : 'bg-background text-muted-foreground border-border hover:bg-muted'
              )}
            >
              <Minimize2 className="h-3.5 w-3.5" />
              <span>Modo Pestañas</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsContinuousView(true);
                handleSelectTab('all');
              }}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border',
                isContinuousView
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                  : 'bg-background text-muted-foreground border-border hover:bg-muted'
              )}
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Ver Todo Integrado</span>
            </button>
          </div>
        </div>

        {/* BARRA DE BOTONES/PESTAÑAS ÚNICAS NAVEGABLES */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {WORKSPACE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = !isContinuousView && currentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border shrink-0',
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary/20'
                    : 'bg-background/90 text-foreground border-border/80 hover:bg-muted hover:border-primary/40'
                )}
                title={tab.description}
              >
                <Icon className={cn('h-4 w-4', isActive ? 'text-primary-foreground' : 'text-primary')} />
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
      </section>

      {/* ===== CONTENIDO DE LA PÁGINA ÚNICA ===== */}
      {!isContinuousView ? (
        /* VISTA POR PESTAÑA UNIFICADA (Renderizado instantáneo sin cambiar de página) */
        <main className="min-h-[60vh] transition-all">
          <Suspense fallback={<PageLoader message="Cargando módulo de mostrador..." />}>
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
      ) : (
        /* VISTA CONTINUA INTEGRADA (Todas las páginas apiladas en una sola pantalla) */
        <main className="space-y-12 divide-y divide-border/60">
          <section id="section-info" className="pt-2 space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Info className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">1. Información de la Aplicación y Buscador</h2>
            </div>
            <SearchPage />
          </section>

          <section id="section-home" className="pt-8 space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Home className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">2. Resumen e Inicio del Mostrador</h2>
            </div>
            <HomePage />
          </section>

          <section id="section-homeopathy" className="pt-8 space-y-3">
            <div className="flex items-center gap-2 px-1">
              <FlaskConical className="h-5 w-5 text-indigo-500" />
              <h2 className="text-lg font-bold text-foreground">3. Módulo de Homeopatía CH</h2>
            </div>
            <HomeopathyPage />
          </section>

          <section id="section-knowledge" className="pt-8 space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Database className="h-5 w-5 text-purple-500" />
              <h2 className="text-lg font-bold text-foreground">4. Base de Conocimiento</h2>
            </div>
            <KnowledgePage />
          </section>

          <section id="section-products" className="pt-8 space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Package className="h-5 w-5 text-emerald-500" />
              <h2 className="text-lg font-bold text-foreground">5. Catálogo de Productos Comerciales</h2>
            </div>
            <ProductsPage />
          </section>

          <section id="section-synergies" className="pt-8 space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Link2 className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-bold text-foreground">6. Red de Sinergias</h2>
            </div>
            <SynergiesPage />
          </section>

          <section id="section-analysis" className="pt-8 space-y-3">
            <div className="flex items-center gap-2 px-1">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-bold text-foreground">7. Comprobador de Interacciones</h2>
            </div>
            <AnalysisPage />
          </section>

          <section id="section-protocols" className="pt-8 space-y-3">
            <div className="flex items-center gap-2 px-1">
              <ClipboardList className="h-5 w-5 text-sky-500" />
              <h2 className="text-lg font-bold text-foreground">8. Protocolos Clínicos</h2>
            </div>
            <ProtocolsPage />
          </section>

          <section id="section-admin" className="pt-8 space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Shield className="h-5 w-5 text-rose-500" />
              <h2 className="text-lg font-bold text-foreground">9. Administración y Gestión KB</h2>
            </div>
            <AdminGate>
              <AdminPage />
            </AdminGate>
          </section>

          <section id="section-settings" className="pt-8 space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Settings className="h-5 w-5 text-slate-500" />
              <h2 className="text-lg font-bold text-foreground">10. Configuración</h2>
            </div>
            <SettingsPage />
          </section>
        </main>
      )}
    </div>
  );
}
