/**
 * DashboardSidebar - Navegación lateral minimalista y contraíble
 */

import React, { useState, useEffect } from 'react';
import { Search, Database, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../../lib/utils';

type ViewType = 'buscar' | 'catalogo' | 'sinergias' | 'ajustes';

interface DashboardSidebarProps {
  active: ViewType;
  onChange: (v: ViewType) => void;
  stats: { total: number; kbMatch: number; sinergias: number };
  defaultCollapsed?: boolean;
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

const SIDEBAR_COLLAPSED_KEY = 'vademecum_sidebar_collapsed';

export function DashboardSidebar({ 
  active, 
  onChange,
  stats,
  defaultCollapsed = false,
}: DashboardSidebarProps) {
  // Cargar estado guardado o usar default
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return stored !== null ? stored === 'true' : defaultCollapsed;
  });

  // Guardar estado cuando cambia
  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  }, [collapsed]);

  const items = [
    { id: 'buscar' as ViewType, label: 'Buscar', icon: Search },
    { id: 'catalogo' as ViewType, label: 'Catálogo', icon: Database },
    { id: 'sinergias' as ViewType, label: 'Sinergias', icon: IconSynergy },
    { id: 'ajustes' as ViewType, label: 'Ajustes', icon: Settings },
  ];

  return (
    <aside 
      className={cn(
        "shrink-0 border-r border-gray-100 bg-gray-50/50 flex flex-col transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Botón colapsar/expandir */}
      <div className="flex justify-end p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "p-1.5 rounded-lg transition-colors",
            "text-gray-400 hover:text-gray-600 hover:bg-gray-200"
          )}
          title={collapsed ? "Expandir menú" : "Colapsar menú"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navegación */}
      <nav className={cn("px-2 space-y-0.5", collapsed && "px-1")}>
        {items.map(item => {
          const Icon = item.icon;
          const isActive = active === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              title={collapsed ? item.label : undefined}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                collapsed && "justify-center px-2",
                isActive 
                  ? "bg-white text-gray-900 shadow-sm" 
                  : "text-gray-500 hover:bg-white/60 hover:text-gray-700"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Stats rápidas */}
      {!collapsed && (
        <div className="p-3 mt-auto border-t border-gray-100">
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
      )}

      {/* Stats colapsado - solo iconos */}
      {collapsed && (
        <div className="p-2 mt-auto border-t border-gray-100">
          <div className="flex flex-col items-center gap-2">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{stats.total}</p>
              <p className="text-[9px] text-gray-400">PROD</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-600">{stats.kbMatch}</p>
              <p className="text-[9px] text-gray-400">KB</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-violet-600">{stats.sinergias}</p>
              <p className="text-[9px] text-gray-400">SIN</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

export default DashboardSidebar;
