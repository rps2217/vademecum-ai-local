/**
 * Tarjeta de Materia Médica Homeopática con Keynotes y Modalidades
 */

import { useState } from 'react';
import { Card } from '@/ui/Card';
import { Badge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { useCounterTray } from '@/contexts/CounterTrayContext';
import { toast } from 'sonner';
import {
  Sparkles,
  Plus,
  Check,
  TrendingDown,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HomeopathicRemedyData } from '@/types/homeopathy';

interface MateriaMedicaCardProps {
  remedy: HomeopathicRemedyData;
  onOpenDetail: (remedy: HomeopathicRemedyData) => void;
  activeSearch?: string;
}

export function MateriaMedicaCard({
  remedy,
  onOpenDetail,
}: MateriaMedicaCardProps) {
  const { addItem, isInTray } = useCounterTray();
  const inTray = isInTray(remedy.id);
  const [selectedDilution, setSelectedDilution] = useState<number>(
    remedy.dilucionesCH?.[0] || 9
  );

  const handleAddToTray = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inTray) {
      toast.info(`${remedy.nombre} ya está en la bandeja del mostrador`);
      return;
    }

    addItem({
      id: remedy.id,
      name: `${remedy.nombre} ${selectedDilution}CH`,
      category: 'homeopatia',
      evidence: remedy.nivelEvidencia,
    });
    toast.success(`Añadido ${remedy.nombre} ${selectedDilution}CH a la bandeja`);
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onOpenDetail(remedy)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenDetail(remedy);
        }
      }}
      className="p-4 sm:p-5 flex flex-col justify-between gap-4 hover:border-blue-500/40 transition-all cursor-pointer group hover:shadow-sm"
    >
      {/* Encabezado del Remedio */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {remedy.nombre}
              </h3>
              {remedy.nivelEvidencia && (
                <Badge
                  variant={remedy.nivelEvidencia === 'A' ? 'default' : 'secondary'}
                  className="text-[10px] font-bold px-1.5 py-0"
                >
                  Evidencia {remedy.nivelEvidencia}
                </Badge>
              )}
            </div>
            {remedy.nombreCientifico && remedy.nombreCientifico !== remedy.nombre && (
              <p className="text-xs text-muted-foreground italic font-serif">
                {remedy.nombreCientifico} {remedy.familia ? `· ${remedy.familia}` : ''}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail(remedy);
            }}
            className="p-1 text-muted-foreground hover:text-foreground"
            title="Ver ficha completa"
          >
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* Descripción Clínica */}
        <p className="text-xs sm:text-sm text-foreground/90 line-clamp-2 leading-relaxed">
          {remedy.descripcion}
        </p>

        {/* Síntomas Clave (Keynotes) */}
        {remedy.sintomasClave && remedy.sintomasClave.length > 0 && (
          <div className="pt-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Keynotes / Síntomas Clave
            </div>
            <div className="flex flex-wrap gap-1.5">
              {remedy.sintomasClave.slice(0, 3).map((sintoma) => (
                <span
                  key={sintoma}
                  className="text-xs px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-800 dark:text-amber-300 font-medium border border-amber-500/20"
                >
                  {sintoma}
                </span>
              ))}
              {remedy.sintomasClave.length > 3 && (
                <span className="text-[11px] text-muted-foreground self-center">
                  +{remedy.sintomasClave.length - 3} más
                </span>
              )}
            </div>
          </div>
        )}

        {/* Modalidades (Empeora / Mejora) */}
        {remedy.modalidades && (
          <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
            {remedy.modalidades.empeora && remedy.modalidades.empeora.length > 0 && (
              <div className="p-2 rounded-lg bg-red-500/5 border border-red-500/15 space-y-0.5">
                <span className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" /> Empeora:
                </span>
                <p className="text-foreground text-[11px] line-clamp-1">
                  {remedy.modalidades.empeora.slice(0, 3).join(', ')}
                </p>
              </div>
            )}
            {remedy.modalidades.mejora && remedy.modalidades.mejora.length > 0 && (
              <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/15 space-y-0.5">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Mejora:
                </span>
                <p className="text-foreground text-[11px] line-clamp-1">
                  {remedy.modalidades.mejora.slice(0, 3).join(', ')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer con Diluciones y Botón Mostrador */}
      <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Selector de Dilución CH */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground font-medium">Potencia:</span>
          <div className="flex items-center gap-1">
            {(remedy.dilucionesCH || [5, 7, 9, 15, 30]).map((dil) => (
              <button
                key={dil}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDilution(Number(dil));
                }}
                className={cn(
                  'text-[11px] font-mono px-1.5 py-0.5 rounded border transition-colors',
                  selectedDilution === Number(dil)
                    ? 'bg-blue-600 text-white border-blue-600 font-bold'
                    : 'bg-muted/60 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                )}
              >
                {dil}CH
              </button>
            ))}
          </div>
        </div>

        {/* Botón Bandeja del Mostrador */}
        <Button
          size="sm"
          variant={inTray ? 'outline' : 'primary'}
          onClick={handleAddToTray}
          className="text-xs h-8 shrink-0"
        >
          {inTray ? (
            <>
              <Check className="w-3.5 h-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
              En bandeja
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Añadir {selectedDilution}CH
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
