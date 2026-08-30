/**
 * CounterTrayContext - Bandeja de Orientación y Consulta Rápida de Mostrador.
 *
 * Permite al farmacéutico acumular de 1 a 4 ingredientes seleccionados
 * para evaluar en tiempo real:
 *   - Sinergias cruzadas (potenciación, complemento)
 *   - Antagonismos o incompatibilidades
 *   - Seguridad frente al perfil del cliente activo
 *   - Posología conjunta sugerida y resumen para el cliente (1 clic para copiar)
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import type { DbIngredient, DbSynergy } from '@/db/schema';
import { db } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useClientProfile, type SafetyVerdict } from './ClientProfileContext';

export interface EvaluatedSynergy {
  synergy: DbSynergy;
  ingredientA: DbIngredient;
  ingredientB: DbIngredient;
}

export interface TraySafetyItem {
  ingredient: DbIngredient;
  verdict: SafetyVerdict | null;
}

interface CounterTrayContextValue {
  items: DbIngredient[];
  addItem: (ingredient: DbIngredient) => void;
  removeItem: (ingredientId: string) => void;
  toggleItem: (ingredient: DbIngredient) => void;
  clearTray: () => void;
  isInTray: (ingredientId: string) => boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  synergies: EvaluatedSynergy[];
  antagonisms: EvaluatedSynergy[];
  safetyEvaluations: TraySafetyItem[];
  hasSafetyWarnings: boolean;
  totalCount: number;
}

const CounterTrayContext = createContext<CounterTrayContextValue | null>(null);

export function CounterTrayProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<DbIngredient[]>(() => {
    try {
      const saved = sessionStorage.getItem('vademecum_counter_tray');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isOpen, setIsOpen] = useState(false);
  const { evaluateSafety } = useClientProfile();

  // Persistir en sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('vademecum_counter_tray', JSON.stringify(items));
    } catch {
      // Ignorar errores de quota
    }
  }, [items]);

  // Si se añade un primer elemento, abrir la bandeja automáticamente
  const addItem = useCallback((ingredient: DbIngredient) => {
    setItems((prev) => {
      if (prev.some((item) => item.id === ingredient.id)) return prev;
      if (prev.length >= 4) {
        return [...prev.slice(1), ingredient];
      }
      return [...prev, ingredient];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((ingredientId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== ingredientId));
  }, []);

  const toggleItem = useCallback((ingredient: DbIngredient) => {
    setItems((prev) => {
      const exists = prev.some((item) => item.id === ingredient.id);
      if (exists) {
        return prev.filter((item) => item.id !== ingredient.id);
      }
      if (prev.length >= 4) {
        return [...prev.slice(1), ingredient];
      }
      return [...prev, ingredient];
    });
    setIsOpen(true);
  }, []);

  const clearTray = useCallback(() => {
    setItems([]);
  }, []);

  const isInTray = useCallback(
    (ingredientId: string) => {
      return items.some((item) => item.id === ingredientId);
    },
    [items]
  );

  const itemIds = useMemo(() => items.map((i) => i.id), [items]);
  const itemMap = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  // Consultar base de datos de sinergias de forma reactiva con useLiveQuery
  const rawSynergies = useLiveQuery(async () => {
    if (itemIds.length < 2) return [];
    const direct = await db.synergies.where('ingredienteA').anyOf(itemIds).toArray();
    const reverse = await db.synergies.where('ingredienteB').anyOf(itemIds).toArray();
    const all = [...direct, ...reverse];
    const seen = new Set<string>();
    return all.filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }, [itemIds]);

  const { evaluatedSynergies, evaluatedAntagonisms } = useMemo(() => {
    if (!rawSynergies || itemIds.length < 2) {
      return { evaluatedSynergies: [], evaluatedAntagonisms: [] };
    }

    const syns: EvaluatedSynergy[] = [];
    const antags: EvaluatedSynergy[] = [];

    for (const s of rawSynergies) {
      const hasA = itemIds.includes(s.ingredienteA);
      const hasB = itemIds.includes(s.ingredienteB);

      if (hasA && hasB) {
        const ingA = itemMap.get(s.ingredienteA);
        const ingB = itemMap.get(s.ingredienteB);
        if (ingA && ingB) {
          const pair = { synergy: s, ingredientA: ingA, ingredientB: ingB };
          if (s.tipo === 'antagonismo') {
            antags.push(pair);
          } else {
            syns.push(pair);
          }
        }
      }
    }

    return { evaluatedSynergies: syns, evaluatedAntagonisms: antags };
  }, [rawSynergies, itemIds, itemMap]);

  // Evaluaciones de seguridad
  const safetyEvaluations: TraySafetyItem[] = useMemo(() => {
    return items.map((ing) => ({
      ingredient: ing,
      verdict: evaluateSafety(ing),
    }));
  }, [items, evaluateSafety]);

  const hasSafetyWarnings = safetyEvaluations.some(
    (s) => s.verdict === 'contraindicado' || s.verdict === 'precaucion'
  );

  return (
    <CounterTrayContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        toggleItem,
        clearTray,
        isInTray,
        isOpen,
        setIsOpen,
        synergies: evaluatedSynergies,
        antagonisms: evaluatedAntagonisms,
        safetyEvaluations,
        hasSafetyWarnings,
        totalCount: items.length,
      }}
    >
      {children}
    </CounterTrayContext.Provider>
  );
}

const fallbackContextValue: CounterTrayContextValue = {
  items: [],
  addItem: () => {},
  removeItem: () => {},
  toggleItem: () => {},
  clearTray: () => {},
  isInTray: () => false,
  isOpen: false,
  setIsOpen: () => {},
  synergies: [],
  antagonisms: [],
  safetyEvaluations: [],
  totalCount: 0,
};

export function useCounterTray() {
  const ctx = useContext(CounterTrayContext);
  return ctx ?? fallbackContextValue;
}
