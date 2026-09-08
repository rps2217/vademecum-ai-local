/**
 * PathologyResultCard - Tarjeta intuitiva de patología clínica para el buscador
 */

import type { DbPathology } from '@/db/schema';
import { Badge } from '@/ui/Badge';
import { Card } from '@/ui/Card';
import { Stethoscope, AlertTriangle, ChevronRight, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PathologyResultCardProps {
  pathology: DbPathology;
  onClick?: () => void;
  className?: string;
}

export function PathologyResultCard({ pathology, onClick, className }: PathologyResultCardProps) {
  const hasAlerts = (pathology.alertasFarmaceuticas?.length || 0) > 0;
  const hasRedFlags = Boolean(pathology.cuandoConsultar);

  return (
    <Card
      onClick={onClick}
      className={cn(
        'group relative flex flex-col justify-between overflow-hidden p-4 text-left transition-all',
        onClick && 'cursor-pointer hover:border-primary/50 hover:shadow-md',
        className
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-2 pb-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 border border-purple-300/30 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-400">
            <Stethoscope className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Condición Clínica</span>
          </div>

          {pathology.sistemas && pathology.sistemas.length > 0 && (
            <Badge variant="outline" className="text-[11px] capitalize">
              {pathology.sistemas[0]}
            </Badge>
          )}
        </div>

        <h3 className="font-semibold text-foreground text-[16px] group-hover:text-primary transition-colors">
          {pathology.nombre}
        </h3>

        <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {pathology.definicion || 'Cuadro clínico identificado en la base de conocimiento.'}
        </p>

        {pathology.sintomas && pathology.sintomas.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1">
            <span className="text-[11px] text-muted-foreground mr-1">Síntomas:</span>
            {pathology.sintomas.slice(0, 3).map((sintoma, idx) => (
              <span
                key={idx}
                className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-foreground capitalize"
              >
                {sintoma}
              </span>
            ))}
            {pathology.sintomas.length > 3 && (
              <span className="text-[11px] text-muted-foreground font-medium">
                +{pathology.sintomas.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-3.5 flex items-center justify-between border-t border-border/50 pt-2 text-[11px]">
        {hasRedFlags ? (
          <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
            <AlertTriangle className="h-3 w-3" />
            Signos de alarma
          </span>
        ) : hasAlerts ? (
          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
            <Activity className="h-3 w-3" />
            Alertas disponibles
          </span>
        ) : (
          <span className="text-muted-foreground">Protocolo disponible</span>
        )}
        <span className="text-primary font-medium group-hover:underline inline-flex items-center gap-0.5">
          Ficha clínica <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </Card>
  );
}
