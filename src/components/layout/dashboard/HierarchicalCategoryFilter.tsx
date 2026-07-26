/**
 * HierarchicalCategoryFilter - Filtro jerárquico de categorías
 * Tres niveles: Tipo → Función → Sistema
 */

import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Filter } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { 
  PRODUCT_TYPE_LABELS, 
  THERAPEUTIC_FUNCTION_LABELS, 
  BODY_SYSTEM_LABELS,
  type ProductType,
  type TherapeuticFunction,
  type BodySystem 
} from '../../../core/categorization';

interface HierarchicalCategoryFilterProps {
  selectedType: ProductType | null;
  selectedFunction: TherapeuticFunction | null;
  selectedSystem: BodySystem | null;
  onTypeChange: (type: ProductType | null) => void;
  onFunctionChange: (fn: TherapeuticFunction | null) => void;
  onSystemChange: (system: BodySystem | null) => void;
  counts?: {
    types: Record<ProductType, number>;
    functions: Record<TherapeuticFunction, number>;
    systems: Record<BodySystem, number>;
  };
}

export function HierarchicalCategoryFilter({
  selectedType,
  selectedFunction,
  selectedSystem,
  onTypeChange,
  onFunctionChange,
  onSystemChange,
  counts
}: HierarchicalCategoryFilterProps) {
  const [expandedLevel, setExpandedLevel] = useState<'type' | 'function' | 'system' | null>('type');

  const toggleLevel = (level: 'type' | 'function' | 'system') => {
    setExpandedLevel(expandedLevel === level ? null : level);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
        <Filter className="w-4 h-4" />
        <span className="font-medium">Filtrar por categoría</span>
      </div>

      {/* Nivel 1: Tipo de producto */}
      <div>
        <button
          onClick={() => toggleLevel('type')}
          className="flex items-center justify-between w-full text-left py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <span className="text-xs font-medium text-gray-700">
            Tipo {selectedType && `• ${PRODUCT_TYPE_LABELS[selectedType]?.name}`}
          </span>
          {expandedLevel === 'type' ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {expandedLevel === 'type' && (
          <div className="pl-2 space-y-1">
            <FilterButton
              label="Todos"
              active={selectedType === null}
              onClick={() => onTypeChange(null)}
              count={counts?.types ? Object.values(counts.types).reduce((a, b) => a + b, 0) : undefined}
            />
            {(Object.keys(PRODUCT_TYPE_LABELS) as ProductType[]).map(type => {
              const info = PRODUCT_TYPE_LABELS[type];
              return (
                <FilterButton
                  key={type}
                  label={`${info.icon} ${info.name}`}
                  active={selectedType === type}
                  onClick={() => onTypeChange(type)}
                  count={counts?.types?.[type]}
                  color={info.color}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Nivel 2: Función terapéutica */}
      <div>
        <button
          onClick={() => toggleLevel('function')}
          className="flex items-center justify-between w-full text-left py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <span className="text-xs font-medium text-gray-700">
            Función {selectedFunction && `• ${THERAPEUTIC_FUNCTION_LABELS[selectedFunction]?.name}`}
          </span>
          {expandedLevel === 'function' ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {expandedLevel === 'function' && (
          <div className="pl-2 space-y-1 max-h-60 overflow-y-auto">
            <FilterButton
              label="Todas"
              active={selectedFunction === null}
              onClick={() => onFunctionChange(null)}
            />
            {(Object.keys(THERAPEUTIC_FUNCTION_LABELS) as TherapeuticFunction[]).map(fn => {
              const info = THERAPEUTIC_FUNCTION_LABELS[fn];
              return (
                <FilterButton
                  key={fn}
                  label={info.name}
                  active={selectedFunction === fn}
                  onClick={() => onFunctionChange(fn)}
                  count={counts?.functions?.[fn]}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Nivel 3: Sistema corporal */}
      <div>
        <button
          onClick={() => toggleLevel('system')}
          className="flex items-center justify-between w-full text-left py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <span className="text-xs font-medium text-gray-700">
            Sistema {selectedSystem && `• ${BODY_SYSTEM_LABELS[selectedSystem]?.name}`}
          </span>
          {expandedLevel === 'system' ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {expandedLevel === 'system' && (
          <div className="pl-2 space-y-1">
            <FilterButton
              label="Todos"
              active={selectedSystem === null}
              onClick={() => onSystemChange(null)}
            />
            {(Object.keys(BODY_SYSTEM_LABELS) as BodySystem[]).map(system => {
              const info = BODY_SYSTEM_LABELS[system];
              return (
                <FilterButton
                  key={system}
                  label={`${info.icon} ${info.name}`}
                  active={selectedSystem === system}
                  onClick={() => onSystemChange(system)}
                  count={counts?.systems?.[system]}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Limpiar filtros */}
      {(selectedType || selectedFunction || selectedSystem) && (
        <button
          onClick={() => {
            onTypeChange(null);
            onFunctionChange(null);
            onSystemChange(null);
          }}
          className="w-full mt-2 py-2 px-3 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}

function FilterButton({ 
  label, 
  active, 
  onClick, 
  count,
  color 
}: { 
  label: string; 
  active: boolean; 
  onClick: () => void;
  count?: number;
  color?: string;
}) {
  const colorClasses: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
    violet: 'bg-violet-50 text-violet-700 hover:bg-violet-100',
    slate: 'bg-slate-50 text-slate-700 hover:bg-slate-100',
    pink: 'bg-pink-50 text-pink-700 hover:bg-pink-100',
    red: 'bg-red-50 text-red-700 hover:bg-red-100',
    amber: 'bg-amber-50 text-amber-700 hover:bg-amber-100',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs transition-colors",
        active 
          ? "bg-gray-900 text-white" 
          : color && colorClasses[color]
            ? colorClasses[color]
            : "bg-gray-50 text-gray-600 hover:bg-gray-100"
      )}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className={cn(
          "px-1.5 py-0.5 rounded text-[10px]",
          active ? "bg-white/20" : "bg-gray-200"
        )}>
          {count}
        </span>
      )}
    </button>
  );
}

export default HierarchicalCategoryFilter;
