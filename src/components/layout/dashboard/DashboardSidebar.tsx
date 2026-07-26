/**
 * DashboardSidebar - Navegación lateral minimalista
 */

import React from 'react';
import { Search, Database, Settings } from 'lucide-react';
import { cn } from '../../../lib/utils';

type ViewType = 'buscar' | 'catalogo' | 'sinergias' | 'ajustes';

interface DashboardSidebarProps {
  active: ViewType;
  onChange: (v: ViewType) => void;
  stats: { total: number; kbMatch: number; sinergias: number };
}

// Icono SVG para Sinergias
const IconSynergy = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="6" cy="12" r="3"/>
    <circle cx="18" cy="12" r="3"/>
    <circle cx="12" cy="6" r="3"/>
    <path d="M12 9v3M8.5 10.5L9.5 9.5M15.5 10.5L14.5 9.5"/>
  </svg>
);

export function DashboardSidebar({ 
  active, 
  onChange,
  stats,
}: DashboardSidebarProps) {
  const items = [
    { id: 'buscar' as ViewType, label: 'Buscar', icon: Search },
    { id: 'catalogo' as ViewType, label: 'Catálogo', icon: Database },
    { id: 'sinergias' as ViewType, label: 'Sinergias', icon: IconSynergy },
    { id: 'ajustes' as ViewType, label: 'Ajustes', icon: Settings },
  ];

  return (
    <aside className="w-56 shrink-0 border-r border-gray-100 bg-gray-50/50">
      <nav className="p-3 space-y-0.5">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              active === item.id 
                ? "bg-white text-gray-900 shadow-sm" 
                : "text-gray-500 hover:bg-white/60 hover:text-gray-700"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Stats rápidas */}
      <div className="p-3 mt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 font-medium mb-2">RESUMEN</p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Productos</span>
            <span className="font-semibold text-gray-900">{stats.total}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">En KB</span>
            <span className="font-semibold text-emerald-600">{stats.kbMatch}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Sinergias</span>
            <span className="font-semibold text-violet-600">{stats.sinergias}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default DashboardSidebar;
