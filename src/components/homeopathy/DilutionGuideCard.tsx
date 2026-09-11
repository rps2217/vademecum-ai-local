/**
 * Guía interactiva de Diluciones CH y Posología en Mostrador
 */

import { useState } from 'react';
import { Card } from '@/ui/Card';
import { Badge } from '@/ui/Badge';
import { DILUTION_GUIDES } from '@/data/homeopathyProtocols';
import { Sparkles, Clock, Compass, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DilutionGuideCard() {
  const [selectedIdx, setSelectedIdx] = useState(1); // 9CH por defecto (media)
  const currentGuide = DILUTION_GUIDES[selectedIdx];

  return (
    <Card className="p-5 sm:p-6 border-blue-500/20 bg-gradient-to-br from-card via-card to-blue-500/[0.03]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
            CH
          </div>
          <div>
            <h2 className="text-lg font-bold font-heading text-foreground">
              Guía Rápida de Diluciones Centesimales (CH)
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Regla de oro de Hahnemann y Boiron para la selección de la potencia en mostrador
            </p>
          </div>
        </div>
        <Badge variant="outline" className="border-blue-500/30 text-blue-600 dark:text-blue-400 self-start sm:self-auto">
          Práctica Clínica
        </Badge>
      </div>

      {/* Tabs de Selección de Potencia */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-5">
        {DILUTION_GUIDES.map((guide, idx) => {
          const isSelected = selectedIdx === idx;
          return (
            <button
              key={guide.rango}
              onClick={() => setSelectedIdx(idx)}
              className={cn(
                'text-left p-3.5 rounded-xl border transition-all relative overflow-hidden',
                isSelected
                  ? 'border-blue-500 bg-blue-500/10 dark:bg-blue-900/30 text-foreground shadow-sm ring-1 ring-blue-500/50'
                  : 'border-border/70 hover:border-blue-500/40 hover:bg-muted/40 text-muted-foreground'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={cn('text-xs font-bold uppercase tracking-wider', isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground')}>
                  {guide.rango}
                </span>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
              </div>
              <p className="text-sm font-semibold text-foreground line-clamp-1">
                {guide.nombreNivel}
              </p>
            </button>
          );
        })}
      </div>

      {/* Detalle Explicativo de la Dilución Seleccionada */}
      <div className="bg-card border border-border/80 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Compass className="w-3.5 h-3.5 text-blue-500" />
              ¿Cuándo utilizar esta potencia?
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {currentGuide.indicacionTipo}
            </p>
            <div className="pt-1">
              <span className="text-xs text-muted-foreground font-medium">Ejemplos típicos: </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {currentGuide.ejemplos.map((ej) => (
                  <Badge key={ej} variant="secondary" className="text-xs bg-muted/80 text-foreground">
                    {ej}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              Frecuencia y Posología de Mostrador
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {currentGuide.frecuenciaRecomendada}
            </p>
            <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <span>
                <strong>Regla de espaciamiento:</strong> En cuanto el paciente experimente alivio o mejoría franca, reducir la frecuencia de las tomas hasta suspender.
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-blue-500" />
            Vía sublingual sin deglutir con agua; dejar disolver lentamente 15 min antes o 1h después de comidas.
          </span>
        </div>
      </div>
    </Card>
  );
}
