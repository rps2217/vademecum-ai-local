/**
 * AppShell - Contenedor principal, optimizado para mostrador de farmacia.
 *
 * - Sidebar fija en desktop wide, deslizable en mobile/tablet.
 * - Header con búsqueda unificada + atajo ⌘K (command palette real).
 * - Botón "Nuevo" contextual.
 * - Layout que prioriza el área de contenido (el farmacéutico necesita
 *   ver resultados, no chrome de navegación).
 */

import { useState, useMemo, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTheme } from '@/app/ThemeProvider';
import { useSearch } from '@/contexts/SearchContext';
import { useSearchIndex } from '@/core/search';
import { SyncStatusBar } from '@/components/sync/SyncStatusBar';
import { CommandPalette } from '@/ui/CommandPalette';
import {
  Search, Plus, Settings, Database, Link2, Sparkles, BarChart3,
  Shield, Menu, X, ChevronLeft, ChevronRight, Sun, Moon, Monitor,
  Command,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: typeof Search;
  href: string;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Buscar', icon: Search, href: '/' },
  { id: 'knowledge', label: 'Base de Conocimiento', icon: Database, href: '/knowledge' },
  { id: 'synergies', label: 'Sinergias', icon: Link2, href: '/synergies' },
  { id: 'analysis', label: 'Análisis', icon: BarChart3, href: '/analysis' },
  { id: 'admin', label: 'Admin', icon: Shield, href: '/admin', badge: 'KB' },
];

function NavContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate: () => void }) {
  const location = useLocation();
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4">
      <ul className="flex flex-col gap-1">
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
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive
                    ? 'bg-primary text-primary-foreground font-medium shadow-sm'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  collapsed && 'justify-center px-2'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span className={cn(
                        'rounded px-1.5 py-0.5 text-xs font-medium',
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
    path === '/' || ['/synergies', '/knowledge', '/admin', '/analysis'].some(p => path.startsWith(p));

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isSearchPage(location.pathname)) {
      navigate(`/?q=${encodeURIComponent(query.trim())}`);
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
        sidebarCollapsed ? 'w-16' : 'w-64',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className={cn(
          'flex h-16 flex-shrink-0 items-center border-b border-sidebar px-4',
          sidebarCollapsed ? 'justify-center' : 'justify-between'
        )}>
          <Link to="/" className="flex items-center gap-2" onClick={closeSidebar}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
            </div>
            {!sidebarCollapsed && (
              <span className="text-lg font-semibold text-foreground">Vademecum</span>
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
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Settings className="h-5 w-5" aria-hidden="true" />
                <span>Configuración</span>
              </Link>
              <div className="mt-2 flex items-center gap-1 rounded-lg bg-sidebar-accent p-1">
                {([
                  { value: 'light', icon: Sun, label: 'Tema claro' },
                  { value: 'auto', icon: Monitor, label: 'Tema automático' },
                  { value: 'dark', icon: Moon, label: 'Tema oscuro' },
                ] as const).map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={cn(
                      'flex flex-1 items-center justify-center rounded-md py-1.5 transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      theme === value ? 'bg-card text-foreground shadow-sm' : 'text-sidebar-foreground hover:text-foreground'
                    )}
                    aria-label={label}
                    aria-pressed={theme === value}
                    title={label}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Link
                to="/settings"
                onClick={closeSidebar}
                className="rounded-lg p-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Configuración"
              >
                <Settings className="h-5 w-5" aria-hidden="true" />
              </Link>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="rounded-lg p-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
      <div className={cn('flex min-h-screen flex-col transition-all duration-300', sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64')}>
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 flex-shrink-0 items-center gap-3 border-b border-header bg-header/95 backdrop-blur px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="flex flex-1 justify-start" role="search">
            <div className="relative w-full max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                title="Presiona / para enfocar rápidamente"
                className="h-10 w-full rounded-lg border border-border bg-muted pl-10 pr-20 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className="pointer-events-auto absolute right-2 top-1/2 -translate-y-1/2 flex h-6 items-center gap-0.5 rounded border border-border bg-card px-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground hover:border-primary/50"
                aria-label="Abrir búsqueda rápida (⌘K)"
                title="Búsqueda rápida ⌘K"
              >
                <Command className="h-3 w-3" aria-hidden="true" />
                <span>K</span>
              </button>
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <SyncStatusBar className="hidden md:flex" />
            <button
              onClick={() => navigate('/admin')}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Nuevo</span>
            </button>
          </div>
        </header>

        <div className="flex items-center border-b border-border px-4 py-2 md:hidden">
          <SyncStatusBar />
        </div>

        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
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
