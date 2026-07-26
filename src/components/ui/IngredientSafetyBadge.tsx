/**
 * IngredientSafetyBadge - Badge que indica el estado de seguridad de un ingrediente
 * 
 * Muestra un indicador visual cuando un ingrediente tiene antagonismos conocidos
 * o cuando es seguro combinar.
 */

import React, { useMemo } from 'react';
import { AlertTriangle, ShieldCheck, Info } from 'lucide-react';
import { synergyEngineV2 } from '../../core/knowledge-base';
import { findIngredientByAny } from '../../core/ingredient-database/SynonymsService';
import { cn } from '../../lib/utils';

interface IngredientSafetyBadgeProps {
  ingredientName: string;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function IngredientSafetyBadge({ 
  ingredientName, 
  className,
  showLabel = false,
  size = 'sm'
}: IngredientSafetyBadgeProps) {
  const safetyInfo = useMemo(() => {
    const found = findIngredientByAny(ingredientName);
    if (!found?.id) {
      return { status: 'unknown' as const, antagonisms: [], antagonismCount: 0 };
    }
    
    const antagonisms = synergyEngineV2.getAntagonismsFor(found.id);
    const hasHighSeverity = antagonisms.some(a => a.severidad === 'alta');
    const hasMediumSeverity = antagonisms.some(a => a.severidad === 'media');
    
    let status: 'safe' | 'warning' | 'danger' | 'unknown' = 'unknown';
    if (antagonisms.length > 0) {
      status = hasHighSeverity ? 'danger' : hasMediumSeverity ? 'warning' : 'safe';
    } else {
      status = 'safe';
    }
    
    return { status, antagonisms, antagonismCount: antagonisms.length };
  }, [ingredientName]);

  const sizeClasses = {
    sm: 'w-5 h-5 text-[10px]',
    md: 'w-6 h-6 text-xs',
    lg: 'w-7 h-7 text-sm',
  };

  const labelSizeClasses = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  };

  if (safetyInfo.status === 'unknown') {
    return null;
  }

  if (safetyInfo.status === 'safe') {
    if (!showLabel) return null;
    return (
      <div className={cn('flex items-center gap-1 text-emerald-600', className)}>
        <ShieldCheck className={sizeClasses[size]} />
        {showLabel && <span className={labelSizeClasses[size]}>Seguro</span>}
      </div>
    );
  }

  const isDanger = safetyInfo.status === 'danger';
  
  return (
    <div 
      className={cn(
        'flex items-center gap-1 cursor-help group relative',
        isDanger ? 'text-red-500' : 'text-amber-500',
        className
      )}
      title={
        safetyInfo.antagonisms.length > 0
          ? `${safetyInfo.antagonismCount} interacción(es) antagonística(s): ${safetyInfo.antagonisms.map(a => a.ingredienteB).join(', ')}`
          : 'Ver detalles de seguridad'
      }
    >
      <div className={cn(
        'rounded-full flex items-center justify-center',
        isDanger ? 'bg-red-100' : 'bg-amber-100',
        sizeClasses[size]
      )}>
        <AlertTriangle className={cn(sizeClasses[size], isDanger ? 'text-red-500' : 'text-amber-500')} />
      </div>
      {showLabel && (
        <span className={cn(labelSizeClasses[size], 'font-medium')}>
          {safetyInfo.antagonismCount} alerta{safetyInfo.antagonismCount !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}

/**
 * Hook para verificar seguridad de múltiples ingredientes
 */
export function useIngredientSafety(ingredientNames: string[]) {
  return useMemo(() => {
    const results: Array<{
      name: string;
      status: 'safe' | 'warning' | 'danger' | 'unknown';
      antagonisms: any[];
    }> = [];

    for (const name of ingredientNames) {
      const found = findIngredientByAny(name);
      if (!found?.id) {
        results.push({ name, status: 'unknown', antagonisms: [] });
        continue;
      }
      
      const antagonisms = synergyEngineV2.getAntagonismsFor(found.id);
      const hasHighSeverity = antagonisms.some((a: any) => a.severidad === 'alta');
      const hasMediumSeverity = antagonisms.some((a: any) => a.severidad === 'media');
      
      let status: 'safe' | 'warning' | 'danger' | 'unknown' = 'safe';
      if (antagonisms.length > 0) {
        status = hasHighSeverity ? 'danger' : hasMediumSeverity ? 'warning' : 'safe';
      }
      
      results.push({ name, status, antagonisms });
    }
    
    return results;
  }, [ingredientNames]);
}
