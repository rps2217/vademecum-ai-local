/**
 * DashboardHeader - Header minimalista del dashboard
 */

import React from 'react';
import { Search, X, Cloud, CloudOff, Pill } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface DashboardHeaderProps {
  productCount: number;
  connected: boolean;
  query: string;
  onQueryChange: (q: string) => void;
}

export function DashboardHeader({ 
  productCount, 
  connected,
  query,
  onQueryChange,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Pill className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-gray-900 tracking-tight">Vademecum</span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Buscar medicamento..."
              className="w-full pl-9 pr-8 py-2 bg-gray-50 border-0 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
            />
            {query && (
              <button 
                onClick={() => onQueryChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded"
              >
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
            connected ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"
          )}>
            {connected ? <Cloud className="w-3 h-3" /> : <CloudOff className="w-3 h-3" />}
            {connected ? 'Nube' : 'Local'}
          </div>
          <span className="text-xs text-gray-400">{productCount} meds</span>
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;
