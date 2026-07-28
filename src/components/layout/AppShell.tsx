/**
 * AppShell - Contenedor principal de la aplicación
 * 
 * Layout base que incluye:
 * - Sidebar con navegación
 * - Header con búsqueda y acciones
 * - Área de contenido principal
 */

import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTheme } from '@/app/ThemeProvider';
import {
  Search,
  Plus,
  Settings,
  Database,
  Link2,
  Sparkles,
  BarChart3,
  Shield,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: typeof Search;
  href: string;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Inicio', icon: Search, href: '/' },
  { id: 'search', label: 'Buscar', icon: Search, href: '/search' },
  { id: 'knowledge', label: 'Base de Conocimiento', icon: Database, href: '/knowledge' },
  { id: 'synergies', label: 'Sinergias', icon: Link2, href: '/synergies' },
  { id: 'analysis', label: 'Análisis', icon: BarChart3, href: '/analysis' },
  { id: 'admin', label: 'Admin', icon: Shield, href: '/admin', badge: 'KB' },
];

export function AppShell() {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    }
    return false;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleCollapsed = () => {
    const newValue = !sidebarCollapsed;
    setSidebarCollapsed(newValue);
    localStorage.setItem('sidebar-collapsed', String(newValue));
  };

  const NavContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <nav className="flex-1 px-2 py-4 space-y-1">
      {NAV_ITEMS.map((item) => {
        const isActive = location.pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.id}
            to={item.href}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
              isActive
                ? "bg-primary text-primary-foreground font-medium"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed && "justify-center px-2"
            )}
          >
            <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary-foreground")} />
            {!collapsed && (
              <>
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-overlay lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen bg-sidebar-background border-r border-sidebar-border transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-64",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center h-16 px-4 border-b border-sidebar-border",
          sidebarCollapsed ? "justify-center" : "justify-between"
        )}>
          {!sidebarCollapsed && (
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg">Vademecum</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <NavContent collapsed={sidebarCollapsed} />

        {/* Sidebar footer */}
        <div className={cn(
          "p-4 border-t border-sidebar-border",
          sidebarCollapsed && "px-2"
        )}>
          {!sidebarCollapsed ? (
            <>
              <Link
                to="/settings"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span>Configuración</span>
              </Link>
              
              {/* Theme selector */}
              <div className="flex items-center gap-1 mt-3 px-3 py-2">
                <button
                  onClick={() => setTheme('light')}
                  className={cn(
                    "p-1.5 rounded transition-colors",
                    theme === 'light' ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent"
                  )}
                  title="Tema claro"
                >
                  <Sun className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setTheme('auto')}
                  className={cn(
                    "p-1.5 rounded transition-colors",
                    theme === 'auto' ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent"
                  )}
                  title="Tema automático"
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={cn(
                    "p-1.5 rounded transition-colors",
                    theme === 'dark' ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent"
                  )}
                  title="Tema oscuro"
                >
                  <Moon className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Link
                to="/settings"
                className="p-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              >
                <Settings className="w-5 h-5" />
              </Link>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          )}
        </div>

        {/* Collapse toggle (desktop) */}
        <button
          onClick={toggleCollapsed}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 items-center justify-center bg-sidebar-background border border-sidebar-border rounded-full shadow-sm hover:bg-sidebar-accent transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </aside>

      {/* Main content area */}
      <div
        className={cn(
          "min-h-screen transition-all duration-300",
          sidebarCollapsed ? "lg:pl-16" : "lg:pl-64"
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-header-background border-b border-header-border backdrop-blur-sm">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Search (desktop) */}
            <div className="hidden lg:flex flex-1 max-w-xl">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Buscar ingredientes, síntomas..."
                  className="w-full pl-10 pr-4 py-2 bg-muted border-0 rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Quick add button */}
              <button className="hidden sm:flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors">
                <Plus className="w-4 h-4" />
                <span className="hidden md:inline">Nuevo</span>
              </button>

              {/* Mobile search button */}
              <button className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile sidebar close button */}
      {sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(false)}
          className="fixed top-4 right-4 z-50 lg:hidden p-2 bg-background rounded-full shadow-lg border"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
