/**
 * DashboardSearch - Barra de búsqueda del Dashboard
 * Incluye búsqueda y filtros rápidos
 */

import React from 'react';
import { Search, X, Filter, Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface DashboardSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
  onFilterClick?: () => void;
  showFilters?: boolean;
  resultCount?: number;
}

export function DashboardSearch({
  value,
  onChange,
  placeholder = 'Buscar productos...',
  loading = false,
  onFilterClick,
  showFilters = false,
  resultCount,
}: DashboardSearchProps) {
  return (
    <div className="flex gap-2">
      {/* Input de búsqueda */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl",
            "text-sm text-gray-900 placeholder-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500",
            "transition-all"
          )}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
        )}
        {value && !loading && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Botón de filtros */}
      {onFilterClick && (
        <button
          onClick={onFilterClick}
          className={cn(
            "p-2.5 rounded-xl border transition-colors",
            showFilters
              ? "bg-emerald-100 border-emerald-300 text-emerald-700"
              : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
          )}
        >
          <Filter className="w-5 h-5" />
        </button>
      )}

      {/* Contador de resultados */}
      {resultCount !== undefined && (
        <div className="flex items-center px-3 bg-gray-50 rounded-xl border border-gray-200">
          <span className="text-sm text-gray-500">
            {resultCount} resultado{resultCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}

export default DashboardSearch;
