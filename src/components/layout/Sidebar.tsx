import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils/cn';
import {
  Search,
  Package,
  Network,
  FileText,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { to: '/', icon: Search, label: 'Buscar' },
  { to: '/products', icon: Package, label: 'Productos' },
  { to: '/synergies', icon: Network, label: 'Sinergias' },
  { to: '/protocols', icon: FileText, label: 'Protocolos' },
  { to: '/admin', icon: Shield, label: 'Admin' },
  { to: '/settings', icon: Settings, label: 'Ajustes' },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        'flex flex-col border-r border-[var(--border)] bg-[var(--bg-elevated)] transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-[var(--border)] px-4">
        {!collapsed && (
          <span className="text-lg font-bold text-[var(--color-primary-600)]">Vademécum AI</span>
        )}
        <button
          onClick={onToggle}
          className="rounded-md p-1.5 hover:bg-[var(--color-neutral-100)] text-[var(--fg-muted)]"
          aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[var(--color-primary-100)] text-[var(--color-primary-700)]'
                  : 'text-[var(--fg-muted)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--fg)]',
                collapsed && 'justify-center px-2'
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-[var(--border)] p-4">
        {!collapsed && (
          <p className="text-xs text-[var(--fg-muted)]">
            v2.0.0 — PWA Local-first
          </p>
        )}
      </div>
    </aside>
  );
}
