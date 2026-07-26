/**
 * EmptyState - Estado vacío genérico
 * Componente para mostrar cuando no hay datos
 */

import React from 'react';
import { Package } from 'lucide-react';

interface EmptyStateProps {
  message: string;
  icon?: React.ReactNode;
}

export function EmptyState({ message, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
        {icon || <Package className="w-6 h-6" />}
      </div>
      <p className="text-sm">{message}</p>
    </div>
  );
}

export default EmptyState;
