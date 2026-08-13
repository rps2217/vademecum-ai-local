/**
 * AnalysisPage - Checker de interacciones del mostrador
 *
 * El farmacéutico selecciona 2-5 ingredientes y obtiene:
 * 1. Sinergias beneficiosas detectadas (verde)
 * 2. Antagonismos/interacciones de riesgo (rojo)
 * 3. Red flags de contraindicaciones por perfil de cliente
 * 4. Pares sin datos en la KB (amarillo)
 */

import { useState, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import type { DbIngredient, DbSynergy } from '@/db/schema';
import { Card } from '@/ui/Card';
import { Badge } from '@/ui/Badge';
import { useClientProfile } from '@/contexts/ClientProfileContext';
import { ClientProfileSelector } from '@/ui/ClientProfileSelector';
import { findInteractions, evaluateWarnings, findUntestedPairs, isBeneficial } from '@/core/analysis';
import type { SafetyWarning } from '@/core/analysis';
import {
  Search, Plus, X, AlertTriangle, CheckCircle2, ShieldAlert,
  FlaskConical, ArrowRight, Layers, Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const MAX_INGREDIENTS = 5;

interface AnalysisResult {
  synergies: DbSynergy[];
  warnings: SafetyWarning[];
  untested: string[][];
  ingredients: DbIngredient[];
}

export function AnalysisPage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { evaluateSafety } = useClientProfile();

  const selectedIngredients = useLiveQuery(
    () => db.ingredients.bulkGet(selectedIds) as Promise<(DbIngredient | undefined)[]>,
    [selectedIds],
  );

  const searchResults = useLiveQuery<DbIngredient[]>(
    () => {
      if (!searchQuery.trim()) return Promise.resolve([]);
      const q = searchQuery.toLowerCase();
      return db.ingredients
        .filter((ing) => {
          if (selectedIds.includes(ing.id)) return false;
          if (ing.tombstone === 1) return false;
          return ing.nombre.toLowerCase().includes(q)
            || ing.sinonimos.some((s) => s.toLowerCase().includes(q));
        })
        .limit(8)
        .toArray();
    },
    [searchQuery, selectedIds],
  );

  const handleAdd = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev;
      if (prev.length >= MAX_INGREDIENTS) {
        toast.warning(`Máximo ${MAX_INGREDIENTS} ingredientes`);
        return prev;
      }
      return [...prev, id];
    });
    setSearchQuery('');
  }, []);

  const handleRemove = useCallback((id: string) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const analysis = useLiveQuery(
    async () => {
      if (!selectedIngredients || selectedIngredients.length < 2) return null;
      const validIngredients = selectedIngredients.filter((x): x is DbIngredient => x !== undefined);
      if (validIngredients.length < 2) return null;

      const synergies = await findInteractions(selectedIds);
      const warnings = evaluateWarnings(validIngredients, evaluateSafety);
      const untested = findUntestedPairs(selectedIds, synergies);
      const result: AnalysisResult = { synergies, warnings, untested, ingredients: validIngredients };
      return result;
    },
    [selectedIds, selectedIngredients, evaluateSafety],
  );

  const beneficial = useMemo(
    () => analysis?.synergies.filter(isBeneficial) ?? [],
    [analysis],
  );
  const risky = useMemo(
    () => analysis?.synergies.filter((s) => !isBeneficial(s)) ?? [],
    [analysis],
  );
  const ingredientNameMap = useMemo(() => {
    const m = new Map<string, string>();
    analysis?.ingredients.forEach((ing) => m.set(ing.id, ing.nombre));
    return m;
  }, [analysis]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Análisis de interacciones</h1>
        <p className="text-muted-foreground mt-1">
          Selecciona 2 a 5 ingredientes para verificar sinergias, antagonismos y seguridad
        </p>
      </div>

      <ClientProfileSelector />

      {/* Selector de ingredientes */}
      <Card className="p-4">
        <div className="space-y-3">
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedIngredients?.filter((x): x is DbIngredient => x !== undefined).map((ing) => (
                <span
                  key={ing.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium"
                >
                  {ing.nombre}
                  <button
                    onClick={() => handleRemove(ing.id)}
                    className="hover:bg-primary/20 rounded p-0.5"
                    aria-label={`Quitar ${ing.nombre}`}
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {selectedIds.length < MAX_INGREDIENTS && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar ingrediente para añadir..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
              {searchResults && searchResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-background border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {searchResults.map((ing) => (
                    <button
                      key={ing.id}
                      onClick={() => handleAdd(ing.id)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted text-left transition-colors"
                    >
                      <div>
                        <span className="text-sm font-medium">{ing.nombre}</span>
                        <span className="text-xs text-muted-foreground ml-2">{ing.categoria}</span>
                      </div>
                      <Plus className="w-4 h-4 text-primary" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedIds.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Añade al menos 2 ingredientes para iniciar el análisis
            </p>
          )}
          {selectedIds.length === 1 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Añade 1 ingrediente más para iniciar el análisis
            </p>
          )}
        </div>
      </Card>

      {/* Resultados del análisis */}
      {analysis && (
        <div className="space-y-4">
          {/* Resumen */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xl font-bold">{beneficial.length}</p>
                <p className="text-xs text-muted-foreground">Sinergias</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xl font-bold">{risky.length}</p>
                <p className="text-xs text-muted-foreground">Riesgos</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <ShieldAlert className="w-5 h-5 text-amber-600" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xl font-bold">{analysis.warnings.length}</p>
                <p className="text-xs text-muted-foreground">Alertas perfil</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Info className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xl font-bold">{analysis.untested.length}</p>
                <p className="text-xs text-muted-foreground">Sin datos</p>
              </div>
            </Card>
          </div>

          {/* Red flags */}
          {analysis.warnings.length > 0 && (
            <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-950/20">
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="w-5 h-5 text-red-600" aria-hidden="true" />
                <h3 className="font-semibold text-red-800 dark:text-red-400">
                  Alertas de seguridad para el cliente
                </h3>
              </div>
              <div className="space-y-2">
                {analysis.warnings.map((w) => (
                  <div key={w.ingredientId} className="flex items-center justify-between p-2 rounded-lg bg-white/50 dark:bg-black/20">
                    <span className="text-sm font-medium">{w.ingredientName}</span>
                    <Badge variant={w.verdict === 'contraindicado' ? 'danger' : 'warning'}>
                      {w.verdict === 'contraindicado' ? 'Contraindicado' : 'Precaución'}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Sinergias beneficiosas */}
          {beneficial.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" aria-hidden="true" />
                <h3 className="font-semibold">Sinergias beneficiosas</h3>
              </div>
              <div className="space-y-3">
                {beneficial.map((syn) => (
                  <SynergyCard key={syn.id} synergy={syn} nameMap={ingredientNameMap} beneficial />
                ))}
              </div>
            </Card>
          )}

          {/* Riesgos */}
          {risky.length > 0 && (
            <Card className="p-4 border-red-200">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-600" aria-hidden="true" />
                <h3 className="font-semibold text-red-800 dark:text-red-400">
                  Interacciones de riesgo
                </h3>
              </div>
              <div className="space-y-3">
                {risky.map((syn) => (
                  <SynergyCard key={syn.id} synergy={syn} nameMap={ingredientNameMap} beneficial={false} />
                ))}
              </div>
            </Card>
          )}

          {/* Pares sin datos */}
          {analysis.untested.length > 0 && (
            <Card className="p-4 bg-muted/30">
              <div className="flex items-center gap-2 mb-3">
                <FlaskConical className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                <h3 className="font-semibold text-muted-foreground">
                  Combinaciones sin datos en la KB
                </h3>
              </div>
              <div className="space-y-1.5">
                {analysis.untested.map(([a, b], i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{ingredientNameMap.get(a) ?? a}</span>
                    <ArrowRight className="w-3 h-3" aria-hidden="true" />
                    <span>{ingredientNameMap.get(b) ?? b}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Todo limpio */}
          {beneficial.length === 0 && risky.length === 0 && analysis.warnings.length === 0 && analysis.untested.length === 0 && (
            <Card className="p-6 text-center">
              <Layers className="w-8 h-8 text-muted-foreground mx-auto mb-2" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                No se encontraron interacciones registradas entre estos ingredientes.
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function SynergyCard({ synergy, nameMap, beneficial }: {
  synergy: DbSynergy;
  nameMap: Map<string, string>;
  beneficial: boolean;
}) {
  const nameA = nameMap.get(synergy.ingredienteA) ?? synergy.ingredienteA;
  const nameB = nameMap.get(synergy.ingredienteB) ?? synergy.ingredienteB;

  return (
    <div className={cn(
      'p-3 rounded-lg border',
      beneficial ? 'border-green-200 bg-green-50 dark:bg-green-950/20' : 'border-red-200 bg-red-50 dark:bg-red-950/20',
    )}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-semibold">{nameA}</span>
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
        <span className="text-sm font-semibold">{nameB}</span>
        <Badge variant={beneficial ? 'success' : 'danger'} className="ml-auto">
          {synergy.tipo}
        </Badge>
      </div>
      {synergy.descripcion && (
        <p className="text-sm text-muted-foreground">{synergy.descripcion}</p>
      )}
      {synergy.mecanismo && (
        <p className="text-xs text-muted-foreground mt-1">
          <span className="font-medium">Mecanismo:</span> {synergy.mecanismo}
        </p>
      )}
    </div>
  );
}
