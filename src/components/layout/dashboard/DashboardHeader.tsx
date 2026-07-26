/**
 * DashboardHeader - Header minimalista del dashboard
 */

import React from 'react';
import { Cloud, CloudOff, Pill } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { SecurityAlertsBadge } from '../../ui/SecurityAlerts';
import { SemanticSearchStatus } from '../../ui/SemanticSearchStatus';

interface DashboardHeaderProps {
  productCount: number;
  connected: boolean;
  query?: string;
  onQueryChange?: (q: string) => void;
}

export function DashboardHeader({ 
  productCount, 
  connected,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Pill className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-gray-900 tracking-tight">Vademecum</span>
            <span className="ml-1 text-xs text-emerald-600 font-medium">AI</span>
          </div>
        </div>

        {/* Buscador eliminado - ahora está en SearchView */}

        {/* Status */}
        <div className="flex items-center gap-3">
          {/* Estado de Búsqueda Semántica */}
          <SemanticSearchStatus />
          
          {/* Alertas de Seguridad */}
          <SecurityAlertsBadge />
          
          <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
            connected ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"
          )}>
            {connected ? <Cloud className="w-3 h-3" /> : <CloudOff className="w-3 h-3" />}
            {connected ? 'Nube' : 'Local'}
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-50 text-violet-600 rounded-full text-xs font-medium">
            <span className="font-bold">{productCount}</span>
            <span>productos</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;
