/**
 * ProtocolsModule - Módulo de Protocolos de Suplementación
 * 
 * UI para generar y visualizar protocolos de suplementación
 * basados en objetivos de salud.
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, X, Clock, AlertTriangle, 
  Sun, Moon, Apple, Pill, Heart, Shield
} from 'lucide-react';
import { 
  protocolService, 
  type ProtocolObjective, 
  type SupplementProtocol 
} from '../../core/protocols/ProtocolService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '../../lib/utils';

const MOMENTO_ICONS: Record<string, React.ReactNode> = {
  manana: <Sun className="w-4 h-4" />,
  mediodia: <Sun className="w-4 h-4" />,
  tarde: <Sun className="w-4 h-4" />,
  noche: <Moon className="w-4 h-4" />,
  con_comidas: <Apple className="w-4 h-4" />,
};

const MOMENTO_LABELS: Record<string, string> = {
  manana: 'Mañana (en ayunas)',
  mediodia: 'Mediodía',
  tarde: 'Tarde',
  noche: 'Noche (antes de dormir)',
  con_comidas: 'Con las comidas',
};

const MOMENTO_COLORS: Record<string, string> = {
  manana: 'bg-amber-100 text-amber-700 border-amber-200',
  mediodia: 'bg-orange-100 text-orange-700 border-orange-200',
  tarde: 'bg-blue-100 text-blue-700 border-blue-200',
  noche: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  con_comidas: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

interface ProtocolsModuleProps {
  onClose?: () => void;
  onSelectIngredient?: (ingredientId: string) => void;
}

export function ProtocolsModule({ onClose, onSelectIngredient }: ProtocolsModuleProps) {
  const [objetivos, setObjetivos] = useState<ProtocolObjective[]>([]);
  const [protocolo, setProtocolo] = useState<SupplementProtocol | null>(null);
  const [selectedObjective, setSelectedObjective] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setObjetivos(protocolService.getObjectives());
  }, []);

  const handleGenerateProtocol = async (objetivoId: string) => {
    setIsLoading(true);
    setSelectedObjective(objetivoId);
    try {
      const protocol = await protocolService.generateProtocol(objetivoId);
      setProtocolo(protocol);
    } catch (error) {
      console.error('Error generando protocolo:', error);
    }
    setIsLoading(false);
  };

  const getCategoryColor = (categoria: string) => {
    const colors: Record<string, string> = {
      fitoterapia: 'bg-emerald-100 text-emerald-700',
      homeopatia: 'bg-violet-100 text-violet-700',
      vitaminas: 'bg-blue-100 text-blue-700',
      minerales: 'bg-slate-100 text-slate-700',
      aminoacidos: 'bg-indigo-100 text-indigo-700',
      probioticos: 'bg-teal-100 text-teal-700',
      prebioticos: 'bg-green-100 text-green-700',
      enzimas: 'bg-orange-100 text-orange-700',
    };
    return colors[categoria] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4 bg-black/40 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="w-full max-w-4xl max-h-[90vh] bg-card rounded-3xl shadow-2xl border border-border overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200 flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-border bg-gradient-to-r from-teal-500/10 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Protocolos de Suplementación</h2>
                <p className="text-sm text-muted-foreground">Rutinas personalizadas según tu objetivo de salud</p>
              </div>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-muted rounded-xl transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!protocolo ? (
            /* Selector de Objetivos */
            <div className="space-y-6">
              <p className="text-muted-foreground">
                Selecciona un objetivo de salud para generar un protocolo de suplementación personalizado:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {objetivos.map((obj) => (
                  <button
                    key={obj.id}
                    onClick={() => handleGenerateProtocol(obj.id)}
                    disabled={isLoading}
                    className={cn(
                      "p-5 rounded-2xl border text-left transition-all hover:scale-[1.02] hover:shadow-lg",
                      "bg-muted/50 hover:bg-muted border-border",
                      isLoading && selectedObjective !== obj.id && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-600/20 flex items-center justify-center text-2xl">
                        {obj.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-foreground mb-1">{obj.nombre}</h3>
                        <p className="text-sm text-muted-foreground">{obj.descripcion}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Protocolo Generado */
            <div className="space-y-8">
              {/* Header del protocolo */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{protocolo.objetivo.icon}</div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{protocolo.objetivo.nombre}</h3>
                    <p className="text-sm text-muted-foreground">{protocolo.objetivo.descripcion}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setProtocolo(null)}
                >
                  Cambiar objetivo
                </Button>
              </div>

              {/* Duración */}
              <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-xl">
                <Clock className="w-5 h-5 text-teal-500" />
                <span className="text-sm font-medium">
                  Duración recomendada: <strong>{protocolo.duracion}</strong>
                </span>
              </div>

              {/* Ingredientes */}
              <section>
                <h4 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Pill className="w-5 h-5 text-teal-500" />
                  Suplementos Recomendados
                </h4>
                
                <div className="space-y-3">
                  {protocolo.ingredientes.map((ing) => (
                    <div 
                      key={ing.id}
                      className="p-4 bg-muted/50 rounded-xl border border-border hover:border-teal-500/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h5 className="font-bold text-foreground">{ing.nombre}</h5>
                            <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold', getCategoryColor(ing.categoria))}>
                              {ing.categoria}
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              Evidencia {ing.evidencia}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{ing.dosis}</p>
                          <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium", MOMENTO_COLORS[ing.momento])}>
                            {MOMENTO_ICONS[ing.momento]}
                            {MOMENTO_LABELS[ing.momento]}
                          </div>
                        </div>
                        {onSelectIngredient && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSelectIngredient(ing.id)}
                          >
                            Buscar productos
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Sinergias */}
              {protocolo.sinergias.length > 0 && (
                <section>
                  <h4 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-rose-500" />
                    Sinergias Detectadas
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {protocolo.sinergias.map((syn, idx) => (
                      <div 
                        key={idx}
                        className="p-4 bg-rose-50/50 rounded-xl border border-rose-200"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {syn.ingredientes.map(ing => (
                            <span key={ing} className="px-2 py-1 bg-rose-100 text-rose-700 rounded-lg text-xs font-medium">
                              {ing}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm text-rose-700">{syn.beneficio}</p>
                        <Badge variant="secondary" className="mt-2 text-[10px]">
                          {syn.tipo}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Advertencias */}
              {protocolo.advertencias.length > 0 && (
                <section>
                  <h4 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    Advertencias
                  </h4>
                  
                  <div className="space-y-2">
                    {protocolo.advertencias.map((adv, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-amber-800">{adv}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Disclaimer */}
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl border border-border">
                <Shield className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  <strong>Nota importante:</strong> Este protocolo es solo informativo y no sustituye el consejo 
                  médico profesional. Consulta con tu médico o farmacéutico antes de iniciar cualquier 
                  suplementación, especialmente si tomas medicamentos o tienes condiciones de salud preexistentes.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
