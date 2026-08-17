/**
 * AppShell - Contenedor principal, optimizado para mostrador de farmacia.
 *
 * - Sidebar fija en desktop wide, deslizable en mobile/tablet.
 * - Header con búsqueda unificada + atajo ⌘K (command palette real).
 * - Botón "Nuevo" contextual.
 * - Layout que prioriza el área de contenido (el farmacéutico necesita
 *   ver resultados, no chrome de navegación).
 */

import { useState, useMemo, useEffect, Suspense } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTheme } from '@/app/ThemeProvider';
import { useSearch } from '@/contexts/SearchContext';
import { PageLoader } from '@/ui/PageLoader';
import { useSearchIndex } from '@/core/search';
import { SyncStatusBar } from '@/components/sync/SyncStatusBar';
import { CommandPalette } from '@/ui/CommandPalette';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useServiceWorkerUpdate } from '@/hooks/useServiceWorkerUpdate';
import {
  Search, Plus, Settings, Database, Link2, Sparkles, BarChart3,
  Shield, Menu, X, ChevronLeft, ChevronRight, Sun, Moon, Monitor,
  Command, ClipboardList, Package, Home,
  WifiOff, RefreshCw, CloudDownload,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: typeof Search;
  href: string;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Inicio', icon: Home, href: '/' },
  { id: 'search', label: 'Buscar', icon: Search, href: '/search' },
  { id: 'knowledge', label: 'Base de Conocimiento', icon: Database, href: '/knowledge' },
  { id: 'products', label: 'Productos', icon: Package, href: '/products' },
  { id: 'synergies', label: 'Sinergias', icon: Link2, href: '/synergies' },
  { id: 'analysis', label: 'Análisis', icon: BarChart3, href: '/analysis' },
  { id: 'protocols', label: 'Protocolos', icon: ClipboardList, href: '/protocols' },
  { id: 'admin', label: 'Admin', icon: Shield, href: '/admin', badge: 'KB' },
];

function NavContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate: () => void }) {
  const location = useLocation();
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4">
      <ul className="flex flex-col gap-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          return (
            <li key={item.id}>
              <Link
                to={item.href}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-[16px] font-medium transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  'min-h-[48px]',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  collapsed && 'justify-center px-2'
                )}
              >
                <Icon className="h-6 w-6 flex-shrink-0" aria-hidden="true" />
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span className={cn(
                        'rounded-md px-2 py-1 text-xs font-semibold',
                        isActive ? 'bg-background text-foreground' : 'bg-accent text-accent-foreground'
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function AppShell() {
  const { theme, setTheme } = useTheme();
  const isOnline = useOnlineStatus();
  const { needRefresh, offlineReady, updateSW } = useServiceWorkerUpdate();
  const navigate = useNavigate();
  const location = useLocation();
  const { query, setQuery } = useSearch();
  const { ready } = useSearchIndex();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    }
    return false;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Atajos de teclado globales para uso en mostrador de farmacia
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // ⌘K / Ctrl+K — abrir command palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(o => !o);
        return;
      }

      // Ignorar atajos cuando se está escribiendo en un input/textarea/select
      // o cuando hay un modal abierto (contentEditable enriquecido)
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable;

      // Escape — cerrar command palette si está abierto
      if (e.key === 'Escape' && paletteOpen) {
        setPaletteOpen(false);
        return;
      }

      if (isTyping || e.metaKey || e.ctrlKey || e.altKey) return;

      // "/" — enfocar el input de búsqueda
      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('input[type="search"]');
        searchInput?.focus();
        searchInput?.select();
        return;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [paletteOpen]);

  const searchPlaceholder = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith('/synergies')) return 'Buscar sinergias por ingrediente...';
    if (path.startsWith('/products')) return 'Buscar productos por nombre o principio activo...';
    if (path.startsWith('/knowledge')) return 'Buscar por nombre, sinónimo o indicación...';
    if (path.startsWith('/admin')) return 'Buscar ingredientes...';
    if (path.startsWith('/analysis')) return 'Buscar para análisis...';
    return 'Buscar ingredientes, síntomas o patologías...';
  }, [location.pathname]);

  const toggleCollapsed = () => {
    const newValue = !sidebarCollapsed;
    setSidebarCollapsed(newValue);
    localStorage.setItem('sidebar-collapsed', String(newValue));
  };

  const closeSidebar = () => setSidebarOpen(false);

  const isSearchPage = (path: string) =>
    path === '/search' || ['/synergies', '/products', '/knowledge', '/admin', '/analysis'].some(p => path.startsWith(p));

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isSearchPage(location.pathname)) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeSidebar}
          aria-label="Cerrar menú"
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-sidebar bg-sidebar transition-all duration-300',
        sidebarCollapsed ? 'w-20' : 'w-72',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className={cn(
          'flex h-[4.5rem] flex-shrink-0 items-center border-b border-sidebar px-4',
          sidebarCollapsed ? 'justify-center' : 'justify-between'
        )}>
          <Link to="/" className="flex items-center gap-2.5" onClick={closeSidebar}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-sm">
              <Sparkles className="h-6 w-6 text-primary-foreground" aria-hidden="true" />
            </div>
            {!sidebarCollapsed && (
              <span className="text-xl font-semibold text-foreground">Vademecum</span>
            )}
          </Link>
        </div>

        <NavContent collapsed={sidebarCollapsed} onNavigate={closeSidebar} />

        {/* Footer */}
        <div className={cn('flex-shrink-0 border-t border-sidebar p-3', sidebarCollapsed && 'px-2')}>
          {!sidebarCollapsed ? (
            <>
              <Link
                to="/settings"
                onClick={closeSidebar}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-[16px] font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px]"
              >
                <Settings className="h-5 w-5" aria-hidden="true" />
                <span>Configuración</span>
              </Link>
              <div className="mt-2 flex items-center gap-1 rounded-xl bg-sidebar-accent p-1">
                {([
                  { value: 'light', icon: Sun, label: 'Tema claro' },
                  { value: 'auto', icon: Monitor, label: 'Tema automático' },
                  { value: 'dark', icon: Moon, label: 'Tema oscuro' },
                ] as const).map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={cn(
                      'flex flex-1 items-center justify-center rounded-lg py-2.5 transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      theme === value ? 'bg-card text-foreground shadow-sm' : 'text-sidebar-foreground hover:text-foreground'
                    )}
                    aria-label={label}
                    aria-pressed={theme === value}
                    title={label}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Link
                to="/settings"
                onClick={closeSidebar}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-sidebar-foreground transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Configuración"
              >
                <Settings className="h-5 w-5" aria-hidden="true" />
              </Link>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-sidebar-foreground transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
              </button>
            </div>
          )}
        </div>

        {/* Collapse toggle (desktop) */}
        <button
          onClick={toggleCollapsed}
          className="absolute -right-3 top-20 hidden h-6 w-6 items-center justify-center rounded-full border border-sidebar bg-sidebar text-sidebar-foreground shadow-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring lg:flex"
          aria-label={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>

      {/* Main content */}
      <div className={cn('flex min-h-screen flex-col transition-all duration-300', sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72')}>
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-[4.5rem] flex-shrink-0 items-center gap-3 border-b border-header bg-header/95 backdrop-blur px-4 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="flex flex-1 justify-start" role="search">
            <div className="relative w-full max-w-3xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                title="Presiona / para enfocar rápidamente"
                className="h-12 w-full rounded-xl border border-border bg-muted pl-12 pr-24 text-[16px] text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className="pointer-events-auto absolute right-3 top-1/2 -translate-y-1/2 flex h-8 items-center gap-1 rounded-md border border-border bg-card px-2 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground hover:border-primary/50"
                aria-label="Abrir búsqueda rápida (⌘K)"
                title="Búsqueda rápida ⌘K"
              >
                <Command className="h-3.5 w-3.5" aria-hidden="true" />
                <span>K</span>
              </button>
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <SyncStatusBar className="hidden md:flex" />
            <button
              onClick={() => navigate('/admin')}
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-5 text-[16px] font-medium text-primary-foreground shadow-sm transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
              <span className="hidden sm:inline">Nuevo</span>
            </button>
          </div>
        </header>

        <div className="flex items-center border-b border-border px-4 py-2 md:hidden">
          <SyncStatusBar />
        </div>

        {/* Status banners: offline + SW update */}
        {(!isOnline || needRefresh || offlineReady) && (
          <div className="border-b border-border bg-muted/50">
            {!isOnline && (
              <div className="flex items-center gap-2 px-4 py-2 text-sm text-amber-700 dark:text-amber-400">
                <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Sin conexión — modo offline activo. Los datos locales siguen disponibles.</span>
              </div>
            )}
            {needRefresh && (
              <div className="flex items-center justify-between gap-2 px-4 py-2 text-sm">
                <div className="flex items-center gap-2 text-primary">
                  <RefreshCw className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Hay una nueva versión disponible.</span>
                </div>
                <button
                  onClick={() => updateSW()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <RefreshCw className="h-3 w-3" aria-hidden="true" />
                  Actualizar
                </button>
              </div>
            )}
            {offlineReady && (
              <div className="flex items-center gap-2 px-4 py-2 text-sm text-emerald-700 dark:text-emerald-400">
                <CloudDownload className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>App lista para uso sin conexión.</span>
              </div>
            )}
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-10">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      {/* Mobile sidebar close */}
      {sidebarOpen && (
        <button
          onClick={closeSidebar}
          className="fixed right-4 top-4 z-50 rounded-full border border-border bg-card p-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
          aria-label="Cerrar menú"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      )}

      {/* Indicador de índice listo (sutil) */}
      {!ready && (
        <div className="fixed bottom-4 right-4 z-30 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground shadow-md">
          <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
          Indexando base de conocimiento…
        </div>
      )}

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
