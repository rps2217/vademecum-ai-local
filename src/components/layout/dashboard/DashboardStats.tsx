/**
 * DashboardStats - Barra de estadísticas
 * Muestra métricas clave del sistema
 */

import React from 'react';
import { Pill, Sparkles, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface DashboardStatsProps {
  totalProducts: number;
  productsWithKb: number;
  productsWithSynergies: number;
  productsWithAntagonisms: number;
}

export function DashboardStats({
  totalProducts,
  productsWithKb,
  productsWithSynergies,
  productsWithAntagonisms,
}: DashboardStatsProps) {
  const stats = [
    {
      label: 'Productos',
      value: totalProducts,
      icon: Pill,
      color: 'gray',
    },
    {
      label: 'En KB',
      value: productsWithKb,
      icon: CheckCircle,
      color: 'emerald',
      suffix: '%',
      calculate: () => totalProducts > 0 ? Math.round((productsWithKb / totalProducts) * 100) : 0,
    },
    {
      label: 'Sinergias',
      value: productsWithSynergies,
      icon: Sparkles,
      color: 'violet',
    },
    {
      label: 'Interacciones',
      value: productsWithAntagonisms,
      icon: AlertTriangle,
      color: 'amber',
    },
  ];

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const displayValue = stat.calculate ? stat.calculate() : stat.value;
        
        return (
          <div
            key={stat.label}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg shrink-0",
              `bg-${stat.color}-50`
            )}
          >
            <Icon className={cn("w-4 h-4", `text-${stat.color}-600`)} />
            <div className="flex items-baseline gap-0.5">
              <span className={cn("text-sm font-semibold", `text-${stat.color}-700`)}>
                {displayValue}
              </span>
              {stat.suffix && (
                <span className={cn("text-xs", `text-${stat.color}-500`)}>
                  {stat.suffix}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500">{stat.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default DashboardStats;
