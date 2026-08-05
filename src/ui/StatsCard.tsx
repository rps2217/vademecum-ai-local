/**
 * StatsCard - Tarjeta de estadísticas
 * 
 * Componente para mostrar métricas en el dashboard.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function StatsCard({
  title,
  value,
  change,
  changeLabel = 'vs. anterior',
  icon,
  className,
}: StatsCardProps) {
  const getTrendIcon = () => {
    if (change === undefined || change === 0) {
      return <Minus className="w-4 h-4" />;
    }
    return change > 0 ? (
      <TrendingUp className="w-4 h-4" />
    ) : (
      <TrendingDown className="w-4 h-4" />
    );
  };

  const getTrendColor = () => {
    if (change === undefined || change === 0) {
      return 'text-muted-foreground';
    }
    return change > 0 ? 'text-success' : 'text-danger';
  };

  return (
    <div
      className={cn(
        'bg-card rounded-xl border border-border p-6',
        'transition-shadow duration-200 hover:shadow-md',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
        
        {icon && (
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            {icon}
          </div>
        )}
      </div>

      {change !== undefined && (
        <div className="mt-4 flex items-center gap-1">
          <span className={cn('flex items-center gap-1 text-sm font-medium', getTrendColor())}>
            {getTrendIcon()}
            {change > 0 ? '+' : ''}{change}%
          </span>
          <span className="text-xs text-muted-foreground">{changeLabel}</span>
        </div>
      )}
    </div>
  );
}
