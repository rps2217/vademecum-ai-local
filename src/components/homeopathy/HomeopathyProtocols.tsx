/**
 * Protocolos y Complejos Homeopáticos de Mostrador
 */

import { useState } from 'react';
import { Card } from '@/ui/Card';
import { Badge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { HOMEOPATHIC_PROTOCOLS } from '@/data/homeopathyProtocols';
import { useCounterTray } from '@/contexts/CounterTrayContext';
import { toast } from 'sonner';
import {
  ClipboardList,
  Plus,
  Check,
  Sparkles,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Activity,
  Thermometer,
  Brain,
  Utensils,
  Wind,
  Baby,
  Moon,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HomeopathicComplexProtocol } from '@/types/homeopathy';

const ICON_MAP: Record<string, typeof Activity> = {
  Activity,
  Thermometer,
  Brain,
  Utensils,
  Wind,
  Baby,
  Moon,
  ShieldAlert,
};

export function HomeopathyProtocols({
  onSelectRemedy,
}: {
  onSelectRemedy?: (remedyId: string) => void;
}) {
  const { addItem, isInTray } = useCounterTray();
  const [expandedId, setExpandedId] = useState<string | null>('trauma-golpes');
  const [activeCategory, setActiveCategory] = useState<string>('todos');

  const categories = [
    { id: 'todos', label: 'Todos los protocolos' },
    { id: 'musculoesqueletico', label: 'Trauma & Músculos' },
    { id: 'nervioso', label: 'Ansiedad & Sueño' },
    { id: 'digestivo', label: 'Digestivo' },
    { id: 'respiratorio', label: 'Respiratorio & Alergia' },
    { id: 'inmune', label: 'Fiebre & Gripe' },
    { id: 'dermatologico', label: 'Dermatología' },
  ];

  const filteredProtocols = HOMEOPATHIC_PROTOCOLS.filter((p) => {
    if (activeCategory === 'todos') return true;
    return p.categoria === activeCategory;
  });

  const handleAddAllToTray = (protocol: HomeopathicComplexProtocol) => {
    let addedCount = 0;
    protocol.remedios.forEach((r) => {
      if (!isInTray(r.id)) {
        addItem({
          id: r.id,
          name: `${r.nombre} ${r.dilucion}`,
          category: 'homeopatia',
          evidence: 'B',
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      toast.success(`Se añadieron ${addedCount} remedios de "${protocol.titulo}" a la bandeja del mostrador`);
    } else {
      toast.info(`Los remedios de "${protocol.titulo}" ya están en la bandeja`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header y Filtro por Categorías */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold font-heading text-foreground flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Protocolos y Fórmulas Clínicas en Mostrador
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Combinaciones sinérgicas recomendadas para las consultas homeopáticas más comunes
          </p>
        </div>
      </div>

      {/* Categorías de Protocolos */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
              activeCategory === cat.id
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid de Protocolos */}
      <div className="grid grid-cols-1 gap-4">
        {filteredProtocols.map((protocol) => {
          const isExpanded = expandedId === protocol.id;
          const IconComp = ICON_MAP[protocol.icono] || Activity;
          const allInTray = protocol.remedios.every((r) => isInTray(r.id));

          return (
            <Card
              key={protocol.id}
              className={cn(
                'transition-all border',
                isExpanded ? 'border-purple-500/40 shadow-sm' : 'border-border/70 hover:border-purple-500/30'
              )}
            >
              {/* Encabezado del protocolo */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setExpandedId(isExpanded ? null : protocol.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setExpandedId(isExpanded ? null : protocol.id);
                  }
                }}
                className="p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer select-none"
              >
                <div className="flex items-start gap-3.5 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-foreground">
                        {protocol.titulo}
                      </h3>
                      <Badge variant="outline" className="text-[11px] capitalize border-purple-500/30 text-purple-600 dark:text-purple-400">
                        {protocol.categoria}
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                      {protocol.indicacionPrincipal}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={allInTray ? 'outline' : 'primary'}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddAllToTray(protocol);
                    }}
                    className="text-xs shrink-0"
                  >
                    {allInTray ? (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        En bandeja
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Cargar protocolo
                      </>
                    )}
                  </Button>
                  <button
                    type="button"
                    aria-label={isExpanded ? 'Contraer' : 'Expandir'}
                    className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Contenido Desplegado */}
              {isExpanded && (
                <div className="px-4 pb-5 pt-1 sm:px-5 border-t border-border/60 space-y-4">
                  {/* Lista de Remedios Componentes */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                      Remedios del protocolo y posología específica
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {protocol.remedios.map((r) => {
                        const inTray = isInTray(r.id);
                        return (
                          <div
                            key={r.id}
                            className="p-3 rounded-xl bg-card border border-border/80 flex flex-col justify-between gap-2"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <button
                                  type="button"
                                  onClick={() => onSelectRemedy?.(r.id)}
                                  className="text-sm font-bold text-foreground hover:text-purple-600 dark:hover:text-purple-400 text-left transition-colors"
                                >
                                  {r.nombre}
                                </button>
                                <Badge variant="secondary" className="text-xs font-mono font-semibold">
                                  {r.dilucion}
                                </Badge>
                              </div>
                              <p className="text-xs text-purple-700 dark:text-purple-300 font-medium">
                                {r.rol}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {r.posologia}
                              </p>
                            </div>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (inTray) {
                                  toast.info(`${r.nombre} ya está en la bandeja`);
                                } else {
                                  addItem({
                                    id: r.id,
                                    name: `${r.nombre} ${r.dilucion}`,
                                    category: 'homeopatia',
                                    evidence: 'B',
                                  });
                                  toast.success(`Añadido ${r.nombre} a la bandeja`);
                                }
                              }}
                              className="w-full text-xs h-8 border border-border/50 justify-center"
                            >
                              {inTray ? (
                                <span className="flex items-center text-emerald-600 dark:text-emerald-400">
                                  <Check className="w-3 h-3 mr-1" /> En mostrador
                                </span>
                              ) : (
                                <span className="flex items-center">
                                  <Plus className="w-3 h-3 mr-1" /> Añadir al mostrador
                                </span>
                              )}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Notas de Posología y Derivación */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20 text-xs space-y-1">
                      <div className="font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5" /> Consejo de mostrador
                      </div>
                      <p className="text-foreground leading-relaxed">
                        {protocol.consejoMostrador}
                      </p>
                      <p className="text-muted-foreground pt-1">
                        <strong>Pauta:</strong> {protocol.reglaPosologia}
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs space-y-1">
                      <div className="font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Criterios de derivación médica
                      </div>
                      <p className="text-foreground leading-relaxed">
                        {protocol.cuandoDerivar}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
