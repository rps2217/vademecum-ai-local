/**
 * Select - Componente de seleccion
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options?: SelectOption[];
  label?: string;
  className?: string;
  placeholder?: string;
}

export function Select({ 
  value = '', 
  onChange, 
  options = [], 
  label,
  className,
  placeholder 
}: SelectProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm
          focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1
          disabled:cursor-not-allowed disabled:opacity-50"
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
