/**
 * ProtocolResultCard - Tarjeta intuitiva de protocolo clínico para el buscador
 */

import type { DbProtocol } from '@/db/schema';
import { Card } from '@/ui/Card';
import { ClipboardList, Calendar, Pill, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProtocolResultCardProps {
  protocol: DbProtocol;
  onClick?: () => void;
  className?: string;
}

export function ProtocolResultCard({ protocol, onClick, className }: ProtocolResultCardProps) {
  const ingCount = protocol.ingredientes?.length || 0;
  const hasWarnings = (protocol.advertencias?.length || 0) > 0;

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
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-300/30 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-400">
            <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Protocolo Clínico</span>
          </div>

          <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{protocol.duracionDias} días</span>
          </div>
        </div>

        <h3 className="font-semibold text-foreground text-[16px] group-hover:text-primary transition-colors">
          {protocol.nombre}
        </h3>

        <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {protocol.objetivo}
        </p>

        {protocol.ingredientes && protocol.ingredientes.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1">
            <span className="text-[11px] text-muted-foreground mr-1">Activos:</span>
            {protocol.ingredientes.slice(0, 3).map((ing, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-foreground capitalize"
              >
                <Pill className="h-2.5 w-2.5 text-primary" />
                {ing.id.replace(/_/g, ' ')}
              </span>
            ))}
            {ingCount > 3 && (
              <span className="text-[11px] text-muted-foreground font-medium">
                +{ingCount - 3} más
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-3.5 flex items-center justify-between border-t border-border/50 pt-2 text-[11px]">
        {hasWarnings ? (
          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
            <AlertCircle className="h-3 w-3" />
            {protocol.advertencias.length} precaución(es)
          </span>
        ) : (
          <span className="text-muted-foreground">Uso estandarizado</span>
        )}
        <span className="text-primary font-medium group-hover:underline">Ver protocolo →</span>
      </div>
    </Card>
  );
}
