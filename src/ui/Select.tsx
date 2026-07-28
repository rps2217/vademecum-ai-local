/**
 * Select - Componente de selección
 */

import * as React from 'react';

interface SelectProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
}

const SelectContext = React.createContext<{ value: string; onChange: (v: string) => void } | null>(null);

export function Select({ children, value = '', onValueChange }: SelectProps) {
  return (
    <SelectContext.Provider value={{ value, onChange: onValueChange || (() => {}) }}>
      <select
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
        className="px-4 py-2 border rounded-lg bg-background"
      >
        {children}
      </select>
    </SelectContext.Provider>
  );
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  return <option value={value}>{children}</option>;
}

export function SelectTrigger({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <>{placeholder}</>;
}
