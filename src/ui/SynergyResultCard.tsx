/**
 * SynergyResultCard - Tarjeta intuitiva de sinergia/antagonismo para el buscador
 *
 * Muestra visualmente la interacción entre dos sustancias:
 * - Verde/Esmeralda: Sinergia potenciadora
 * - Rojo/Ámbar: Antagonismo o advertencia
 * - Mecanismo en 1-2 líneas sin redundancia
 */

import type { DbSynergy } from '@/db/schema';
import { Card } from '@/ui/Card';
import { Sparkles, AlertTriangle, Link2, Network, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SynergyResultCardProps {
  synergy: DbSynergy;
  ingredientAName?: string;
  ingredientBName?: string;
  onClick?: () => void;
  className?: string;
}

const TYPE_CONFIG = {
  sinergia: {
    label: 'Sinergia',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300/40',
    icon: Sparkles,
  },
  complemento: {
    label: 'Complemento',
    badgeClass: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-300/40',
    icon: Link2,
  },
  interaccion: {
    label: 'Interacción',
    badgeClass: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-300/40',
    icon: Network,
  },
  antagonismo: {
    label: 'Antagonismo',
    badgeClass: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-300/40',
    icon: AlertTriangle,
  },
};

export function SynergyResultCard({
  synergy,
  ingredientAName,
  ingredientBName,
  onClick,
  className,
}: SynergyResultCardProps) {
  const config = TYPE_CONFIG[synergy.tipo] || TYPE_CONFIG.sinergia;
  const Icon = config.icon;

  const nameA = ingredientAName || synergy.ingredienteA.replace(/_/g, ' ');
  const nameB = ingredientBName || synergy.ingredienteB.replace(/_/g, ' ');

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
        {/* Cabecera con Badge de Tipo y Evidencia */}
        <div className="flex items-center justify-between gap-2 pb-2.5">
          <div
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
              config.badgeClass
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{config.label}</span>
          </div>

          <Badge variant="outline" className="text-[11px] font-mono">
            Evidencia {synergy.evidencia}
          </Badge>
        </div>

        {/* Ingredientes conectados */}
        <div className="flex items-center gap-2 font-medium text-foreground text-[15px] pt-1">
          <span className="capitalize font-semibold text-primary">{nameA}</span>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="capitalize font-semibold text-primary">{nameB}</span>
        </div>

        {/* Mecanismo o descripción resumida */}
        {(synergy.mecanismo || synergy.descripcion) && (
          <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {synergy.mecanismo || synergy.descripcion}
          </p>
        )}
      </div>

      {synergy.nivel && (
        <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2 text-[11px] text-muted-foreground">
          <span>Impacto: <strong className="capitalize text-foreground font-medium">{synergy.nivel}</strong></span>
          <span className="text-primary font-medium group-hover:underline">Ver detalles →</span>
        </div>
      )}
    </Card>
  );
}
