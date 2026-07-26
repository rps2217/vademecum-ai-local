/**
 * AntagonismAlerts - Componente de Alertas de Antagonismos
 * 
 * Muestra alertas cuando se detectan combinaciones peligrosas
 * entre ingredientes.
 */

import React from 'react';
import { AlertTriangle, AlertCircle, Info, X, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { AntagonismRelation } from '../../core/knowledge-base';

interface AntagonismAlertsProps {
  antagonisms: AntagonismRelation[];
  ingredientsMap?: Map<string, string>; // id -> nombre
  onDismiss?: (id: string) => void;
  className?: string;
  compact?: boolean;
}

export function AntagonismAlerts({ 
  antagonisms, 
  ingredientsMap,
  onDismiss, 
  className,
  compact = false 
}: AntagonismAlertsProps) {
  if (!antagonisms || antagonisms.length === 0) {
    return null;
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'alta':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: AlertTriangle,
          iconColor: 'text-red-500',
        };
      case 'media':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-800',
          icon: AlertCircle,
          iconColor: 'text-amber-500',
        };
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: Info,
          iconColor: 'text-blue-500',
        };
    }
  };

  const getIngredientName = (id: string) => {
    if (ingredientsMap && ingredientsMap.has(id)) {
      return ingredientsMap.get(id);
    }
    // Formatear el ID para mostrar
    return id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  if (compact) {
    return (
      <div className={cn('space-y-2', className)}>
        {antagonisms.slice(0, 3).map((antag) => {
          const colors = getSeverityColor(antag.severidad);
          const Icon = colors.icon;
          
          return (
            <div
              key={antag.id}
              className={cn(
                'flex items-center gap-2 p-2 rounded-lg text-sm',
                colors.bg,
                colors.text
              )}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0', colors.iconColor)} />
              <span className="font-medium">
                {getIngredientName(antag.ingredienteA)} + {getIngredientName(antag.ingredienteB)}
              </span>
            </div>
          );
        })}
        {antagonisms.length > 3 && (
          <p className="text-xs text-gray-500 text-center">
            +{antagonisms.length - 3} más...
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2 pb-2 border-b">
        <AlertTriangle className="w-5 h-5 text-red-500" />
        <h3 className="font-semibold text-gray-900">
          Alertas de Interacciones
        </h3>
        <span className="ml-auto text-sm text-gray-500">
          {antagonisms.length} detectada{antagonisms.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      {antagonisms.map((antag) => {
        const colors = getSeverityColor(antag.severidad);
        const Icon = colors.icon;
        
        return (
          <div
            key={antag.id}
            className={cn(
              'p-4 rounded-xl border',
              colors.bg,
              colors.border,
              colors.text
            )}
          >
            <div className="flex items-start gap-3">
              <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', colors.iconColor)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">
                    {getIngredientName(antag.ingredienteA)}
                  </span>
                  <span className="text-xs opacity-60">+</span>
                  <span className="font-semibold text-sm">
                    {getIngredientName(antag.ingredienteB)}
                  </span>
                </div>
                
                <p className="text-sm mb-2">{antag.descripcion}</p>
                
                {antag.mecanismo && (
                  <p className="text-xs opacity-80 mb-2">
                    <span className="font-medium">Mecanismo:</span> {antag.mecanismo}
                  </p>
                )}
                
                {antag.recomendacion && (
                  <div className="mt-2 p-2 bg-white/50 rounded-lg">
                    <p className="text-xs font-medium">Recomendación:</p>
                    <p className="text-xs mt-1">{antag.recomendacion}</p>
                  </div>
                )}
                
                {onDismiss && (
                  <button
                    onClick={() => onDismiss(antag.id)}
                    className={cn(
                      'mt-2 text-xs opacity-60 hover:opacity-100',
                      'flex items-center gap-1'
                    )}
                  >
                    <X className="w-3 h-3" />
                    Ignorar
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Hook para verificar antagonismos entre ingredientes seleccionados
 */
export function useAntagonismChecker() {
  const checkAntagonisms = React.useCallback(
    (ingredientIds: string[], antagonisms: AntagonismRelation[]) => {
      const found: AntagonismRelation[] = [];
      
      for (let i = 0; i < ingredientIds.length; i++) {
        for (let j = i + 1; j < ingredientIds.length; j++) {
          const idA = ingredientIds[i];
          const idB = ingredientIds[j];
          
          const antagonism = antagonisms.find(
            (a) =>
              (a.ingredienteA === idA && a.ingredienteB === idB) ||
              (a.ingredienteA === idB && a.ingredienteB === idA)
          );
          
          if (antagonism) {
            found.push(antagonism);
          }
        }
      }
      
      return found;
    },
    []
  );

  const getAntagonismSeverity = React.useCallback(
    (antagonisms: AntagonismRelation[]) => {
      if (antagonisms.some((a) => a.severidad === 'alta')) {
        return 'alta';
      }
      if (antagonisms.some((a) => a.severidad === 'media')) {
        return 'media';
      }
      return 'baja';
    },
    []
  );

  return {
    checkAntagonisms,
    getAntagonismSeverity,
  };
}
