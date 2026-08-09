/**
 * FilterChips - Componente de chips/etiquetas filtrables
 *
 * Chips activables que permiten filtrar resultados por múltiples
 * dimensiones de forma combinable (AND lógico).
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface ChipOption {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface FilterChipsProps {
  label: string;
  options: ChipOption[];
  selected: string;
  onSelect: (value: string) => void;
  className?: string;
}

export function FilterChips({
  label,
  options,
  selected,
  onSelect,
  className,
}: FilterChipsProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const isActive = selected === option.value;
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              onClick={() => onSelect(isActive ? '' : option.value)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                'border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
              )}
              aria-pressed={isActive}
            >
              {Icon && <Icon className="w-3 h-3" aria-hidden="true" />}
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
