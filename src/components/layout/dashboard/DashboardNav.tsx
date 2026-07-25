/**
 * DashboardNav - Navegación del Dashboard
 * Tabs para cambiar entre vistas
 */

import React from 'react';
import { Search, Database, Sparkles, Settings } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface DashboardNavProps {
  activeView: 'buscar' | 'catalogo' | 'sinergias' | 'ajustes';
  onViewChange: (view: 'buscar' | 'catalogo' | 'sinergias' | 'ajustes') => void;
}

const navItems = [
  { id: 'buscar' as const, label: 'Buscar', icon: Search },
  { id: 'catalogo' as const, label: 'Catálogo', icon: Database },
  { id: 'sinergias' as const, label: 'Sinergias', icon: Sparkles },
  { id: 'ajustes' as const, label: 'Ajustes', icon: Settings },
];

export function DashboardNav({ activeView, onViewChange }: DashboardNavProps) {
  return (
    <nav className="flex gap-1 p-1 bg-gray-100 rounded-xl">
      {navItems.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onViewChange(id)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeView === id
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Icon className="w-4 h-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </nav>
  );
}

export default DashboardNav;
