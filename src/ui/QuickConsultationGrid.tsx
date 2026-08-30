/**
 * QuickConsultationGrid - Tablero de Motivos Frecuentes de Mostrador (1-Clic).
 *
 * Permite al consultor de farmacia iniciar la atención con un solo toque,
 * sin escribir nada en el teclado.
 */

import { memo } from 'react';
import {
  Moon, Brain, Utensils, Shield, Bone, Wind, Zap, HeartPulse, ShieldCheck, Sparkles, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface QuickReason {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  icon: typeof Moon;
  accentColor: string;
  activeColor: string;
  examples: string;
}

export const FREQUENT_CONSULTATION_REASONS: QuickReason[] = [
  {
    id: 'insomnio',
    tag: 'insomnio',
    title: 'Insomnio y Sueño',
    subtitle: 'Conciliación, despertares nocturnos',
    icon: Moon,
    accentColor: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-500/15',
    activeColor: 'bg-indigo-600 text-white border-indigo-600 shadow-md',
    examples: 'Melatonina, Valeriana, Pasiflora',
  },
  {
    id: 'ansiedad',
    tag: 'ansiedad',
    title: 'Estrés y Ansiedad',
    subtitle: 'Nerviosismo, sobrecarga, relajación',
    icon: Brain,
    accentColor: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-200 dark:border-purple-800/60 hover:bg-purple-500/15',
    activeColor: 'bg-purple-600 text-white border-purple-600 shadow-md',
    examples: 'Ashwagandha, L-Teanina, Melisa',
  },
  {
    id: 'dispepsia',
    tag: 'dispepsia',
    title: 'Digestión y Gases',
    subtitle: 'Pesadez, hinchazón, reflujo',
    icon: Utensils,
    accentColor: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-200 dark:border-amber-800/60 hover:bg-amber-500/15',
    activeColor: 'bg-amber-600 text-white border-amber-600 shadow-md',
    examples: 'Manzanilla, Menta, Cardo Mariano',
  },
  {
    id: 'inmunidad',
    tag: 'inmunidad',
    title: 'Defensas e Inmunidad',
    subtitle: 'Prevención invernal, convalecencia',
    icon: Shield,
    accentColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-500/15',
    activeColor: 'bg-emerald-600 text-white border-emerald-600 shadow-md',
    examples: 'Equinácea, Propóleo, Vitamina C',
  },
  {
    id: 'articular',
    tag: 'articular',
    title: 'Dolor e Inflamación',
    subtitle: 'Molestias articulares, rigidez',
    icon: Bone,
    accentColor: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-200 dark:border-rose-800/60 hover:bg-rose-500/15',
    activeColor: 'bg-rose-600 text-white border-rose-600 shadow-md',
    examples: 'Cúrcuma, Harpagofito, Colágeno',
  },
  {
    id: 'tos',
    tag: 'tos',
    title: 'Tos y Respiratorio',
    subtitle: 'Garganta, mucosidad, irritación',
    icon: Wind,
    accentColor: 'text-teal-600 dark:text-teal-400 bg-teal-500/10 border-teal-200 dark:border-teal-800/60 hover:bg-teal-500/15',
    activeColor: 'bg-teal-600 text-white border-teal-600 shadow-md',
    examples: 'Tomillo, Drosera, Eucalipto',
  },
  {
    id: 'fatiga',
    tag: 'fatiga',
    title: 'Cansancio y Energía',
    subtitle: 'Astenia, agotamiento, vitalidad',
    icon: Zap,
    accentColor: 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-200 dark:border-yellow-800/60 hover:bg-yellow-500/15',
    activeColor: 'bg-yellow-600 text-white border-yellow-600 shadow-md',
    examples: 'Ginseng, CoQ10, Vitamina B12',
  },
  {
    id: 'circulacion',
    tag: 'circulacion',
    title: 'Piernas y Circulación',
    subtitle: 'Pesadez, varices, retorno venoso',
    icon: HeartPulse,
    accentColor: 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-200 dark:border-red-800/60 hover:bg-red-500/15',
    activeColor: 'bg-red-600 text-white border-red-600 shadow-md',
    examples: 'Castaño de Indias, Vid Roja',
  },
  {
    id: 'piel',
    tag: 'piel',
    title: 'Piel y Dermatología',
    subtitle: 'Eccemas, irritación, sequedad',
    icon: ShieldCheck,
    accentColor: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-200 dark:border-cyan-800/60 hover:bg-cyan-500/15',
    activeColor: 'bg-cyan-600 text-white border-cyan-600 shadow-md',
    examples: 'Biotina, Zinc, Aceite de Onagra',
  },
  {
    id: 'cognitivo',
    tag: 'cognitivo',
    title: 'Memoria y Foco',
    subtitle: 'Concentración, estudio, lucidez',
    icon: Sparkles,
    accentColor: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-200 dark:border-blue-800/60 hover:bg-blue-500/15',
    activeColor: 'bg-blue-600 text-white border-blue-600 shadow-md',
    examples: 'Ginkgo Biloba, Bacopa, Omega-3',
  },
];

interface Props {
  activeTag: string;
  onSelectTag: (tag: string) => void;
}

export const QuickConsultationGrid = memo(function QuickConsultationGrid({
  activeTag,
  onSelectTag,
}: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <span>⚡ Motivos Frecuentes en Mostrador</span>
          <span className="text-[10px] font-normal text-muted-foreground/80 lowercase">(acceso directo a 1 clic)</span>
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {FREQUENT_CONSULTATION_REASONS.map((reason) => {
          const isActive = activeTag === reason.tag;
          const Icon = reason.icon;

          return (
            <button
              key={reason.id}
              onClick={() => onSelectTag(isActive ? '' : reason.tag)}
              className={cn(
                'relative flex flex-col items-start p-2.5 rounded-xl border text-left transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group select-none min-h-[78px] justify-between',
                isActive
                  ? reason.activeColor
                  : cn('bg-card text-foreground', reason.accentColor)
              )}
              aria-pressed={isActive}
            >
              <div className="flex items-center justify-between w-full gap-1">
                <div
                  className={cn(
                    'p-1.5 rounded-lg shrink-0 transition-colors',
                    isActive ? 'bg-white/20 text-white' : 'bg-background/80'
                  )}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </div>
                {isActive && (
                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white/20 text-white text-[10px]">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </div>

              <div className="w-full mt-1.5">
                <h4
                  className={cn(
                    'font-heading font-semibold text-xs leading-tight truncate',
                    isActive ? 'text-white' : 'text-foreground'
                  )}
                >
                  {reason.title}
                </h4>
                <p
                  className={cn(
                    'text-[10px] truncate leading-normal mt-0.5',
                    isActive ? 'text-white/80' : 'text-muted-foreground'
                  )}
                >
                  {reason.examples}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});
