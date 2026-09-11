/**
 * Motor de Repertorización Rápida y Materia Médica Homeopática
 */

import { useState } from 'react';
import { MateriaMedicaCard } from './MateriaMedicaCard';
import { Button } from '@/ui/Button';
import { Badge } from '@/ui/Badge';
import { Card } from '@/ui/Card';
import {
  Search,
  Filter,
  X,
  Sparkles,
  TrendingDown,
  TrendingUp,
  FlaskConical,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HomeopathicRemedyData } from '@/types/homeopathy';

interface HomeopathyRepertoryProps {
  remedies: HomeopathicRemedyData[];
  filteredRemedies: HomeopathicRemedyData[];
  stats: {
    total: number;
    systemsMap: Record<string, number>;
    topIndications: string[];
    modalitiesWorse: string[];
    modalitiesBetter: string[];
  };
  query: string;
  setQuery: (q: string) => void;
  system: string;
  setSystem: (s: string) => void;
  indication: string;
  setIndication: (i: string) => void;
  worseWith: string;
  setWorseWith: (w: string) => void;
  betterWith: string;
  setBetterWith: (b: string) => void;
  onOpenDetail: (remedy: HomeopathicRemedyData) => void;
}

const COMMON_WORSE_MODALITIES = [
  { id: 'frío', label: 'Frío' },
  { id: 'calor', label: 'Calor' },
  { id: 'movimiento', label: 'Movimiento' },
  { id: 'noche', label: 'Noche' },
  { id: 'tacto', label: 'Tacto / Presión' },
  { id: 'humedad', label: 'Humedad' },
  { id: 'estrés', label: 'Estrés / Emoción' },
  { id: 'alcohol', label: 'Alcohol / Café' },
];

const COMMON_BETTER_MODALITIES = [
  { id: 'reposo', label: 'Reposo' },
  { id: 'aire', label: 'Aire libre' },
  { id: 'calor', label: 'Calor local' },
  { id: 'frío', label: 'Frío local' },
  { id: 'presión', label: 'Presión fuerte' },
  { id: 'movimiento', label: 'Movimiento lento' },
  { id: 'dormir', label: 'Dormir' },
];

export function HomeopathyRepertory({
  filteredRemedies,
  stats,
  query,
  setQuery,
  system,
  setSystem,
  indication,
  setIndication,
  worseWith,
  setWorseWith,
  betterWith,
  setBetterWith,
  onOpenDetail,
}: HomeopathyRepertoryProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const hasActiveFilters = Boolean(
    query || system || indication || worseWith || betterWith
  );

  const handleResetFilters = () => {
    setQuery('');
    setSystem('');
    setIndication('');
    setWorseWith('');
    setBetterWith('');
  };

  return (
    <div className="space-y-4">
      {/* Barra de Búsqueda y Filtros Rápidos */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por remedio (Arnica, Nux Vomica), síntoma clave, patología o afinidad..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Selector de Sistema */}
        <select
          value={system}
          onChange={(e) => setSystem(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
        >
          <option value="">Todos los sistemas ({stats.total})</option>
          {Object.entries(stats.systemsMap).map(([sys, count]) => (
            <option key={sys} value={sys}>
              {sys.charAt(0).toUpperCase() + sys.slice(1)} ({count})
            </option>
          ))}
        </select>

        {/* Botón Filtros Avanzados */}
        <Button
          variant={showAdvancedFilters ? 'primary' : 'outline'}
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="text-xs h-10 gap-1.5 shrink-0"
        >
          <Filter className="w-3.5 h-3.5" />
          Modalidades & Repertorio
          {(worseWith || betterWith || indication) && (
            <Badge variant="secondary" className="ml-1 bg-white/20 text-white text-[10px] px-1.5 py-0">
              Activos
            </Badge>
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={handleResetFilters}
            className="text-xs h-10 text-muted-foreground hover:text-foreground shrink-0"
            title="Limpiar filtros"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Panel Desplegable de Repertorización Avanzada (Modalidades) */}
      {showAdvancedFilters && (
        <Card className="p-4 sm:p-5 border-blue-500/30 bg-card/90 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              Repertorización por Modalidades Clínicas (Empeora / Mejora)
            </span>
            <button
              onClick={() => setShowAdvancedFilters(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Ocultar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Modalidades que Empeoran */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-red-600 dark:text-red-400">
                <span className="flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" /> ¿Qué agrava el síntoma? (Empeora)
                </span>
                {worseWith && (
                  <button
                    onClick={() => setWorseWith('')}
                    className="text-[11px] underline text-muted-foreground"
                  >
                    Quitar
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_WORSE_MODALITIES.map((mod) => (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => setWorseWith(worseWith === mod.id ? '' : mod.id)}
                    className={cn(
                      'text-xs px-2.5 py-1 rounded-lg border transition-all',
                      worseWith === mod.id
                        ? 'bg-red-500 text-white border-red-500 font-bold shadow-xs'
                        : 'bg-muted/50 hover:bg-red-500/10 hover:border-red-500/30 text-foreground border-border/80'
                    )}
                  >
                    {mod.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Modalidades que Mejoran */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> ¿Qué alivia el síntoma? (Mejora)
                </span>
                {betterWith && (
                  <button
                    onClick={() => setBetterWith('')}
                    className="text-[11px] underline text-muted-foreground"
                  >
                    Quitar
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_BETTER_MODALITIES.map((mod) => (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => setBetterWith(betterWith === mod.id ? '' : mod.id)}
                    className={cn(
                      'text-xs px-2.5 py-1 rounded-lg border transition-all',
                      betterWith === mod.id
                        ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                        : 'bg-muted/50 hover:bg-emerald-500/10 hover:border-emerald-500/30 text-foreground border-border/80'
                    )}
                  >
                    {mod.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Contador de Resultados */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>
          Mostrando <strong>{filteredRemedies.length}</strong> de {stats.total} remedios homeopáticos
        </span>
        {hasActiveFilters && (
          <span className="text-blue-600 dark:text-blue-400 font-medium">
            Filtros aplicados
          </span>
        )}
      </div>

      {/* Grid de Resultados */}
      {filteredRemedies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRemedies.map((remedy) => (
            <MateriaMedicaCard
              key={remedy.id}
              remedy={remedy}
              onOpenDetail={onOpenDetail}
              activeSearch={query}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center space-y-4 border-dashed">
          <FlaskConical className="w-12 h-12 text-muted-foreground mx-auto stroke-1" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">
              No se encontraron remedios con estos criterios
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Prueba a flexibilizar la búsqueda de modalidades o restablecer los filtros de sistema.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleResetFilters}>
            Restablecer todos los filtros
          </Button>
        </Card>
      )}
    </div>
  );
}
