/**
 * InteractionChecker - Analiza combinaciones de ingredientes.
 *
 * Busca sinergias/antagonismos entre un conjunto de ingredientes,
 * evalúa seguridad por perfil de cliente, y detecta red flags.
 */

import { db } from '@/db';
import type { DbIngredient, DbSynergy } from '@/db/schema';
import type { SafetyVerdict } from '@/contexts/ClientProfileContext';

export interface InteractionResult {
  synergies: DbSynergy[];
  warnings: SafetyWarning[];
  untested: string[][];
}

export interface SafetyWarning {
  ingredientId: string;
  ingredientName: string;
  verdict: Exclude<SafetyVerdict, 'apto'>;
  reason: string;
}

const BENEFICIAL_TYPES = new Set(['sinergia', 'potenciador', 'complementario', 'complemento', 'cofactor']);
const RISK_TYPES = new Set(['antagonismo', 'interaccion']);

/**
 * Busca todas las relaciones (sinergias/antagonismos) entre un conjunto de ingredientes.
 * Devuelve solo las relaciones donde AMBOS ingredientes están en el conjunto.
 */
export async function findInteractions(ingredientIds: string[]): Promise<DbSynergy[]> {
  if (ingredientIds.length < 2) return [];

  const idSet = new Set(ingredientIds);
  const all = await db.synergies
    .where('ingredienteA')
    .anyOf(ingredientIds)
    .toArray();

  return all.filter((s) => idSet.has(s.ingredienteB) && s.tombstone === 0);
}

/**
 * Evalúa la seguridad de los ingredientes según el veredicto del perfil de cliente.
 */
export function evaluateWarnings(
  ingredients: DbIngredient[],
  evaluateSafety: (ing: DbIngredient) => SafetyVerdict | null,
): SafetyWarning[] {
  const warnings: SafetyWarning[] = [];
  for (const ing of ingredients) {
    const verdict = evaluateSafety(ing);
    if (!verdict || verdict === 'apto') continue;
    const reason = verdict === 'contraindicado'
      ? 'Contraindicado para el perfil de cliente activo'
      : 'Precaución para el perfil de cliente activo';
    warnings.push({ ingredientId: ing.id, ingredientName: ing.nombre, verdict, reason });
  }
  return warnings;
}

/**
 * Identifica pares de ingredientes sin relación conocida en la KB.
 */
export function findUntestedPairs(
  ingredientIds: string[],
  found: DbSynergy[],
): string[][] {
  const tested = new Set(
    found.map((s) => [s.ingredienteA, s.ingredienteB].sort().join('||')),
  );
  const untested: string[][] = [];
  for (let i = 0; i < ingredientIds.length; i++) {
    for (let j = i + 1; j < ingredientIds.length; j++) {
      const key = [ingredientIds[i], ingredientIds[j]].sort().join('||');
      if (!tested.has(key)) {
        untested.push([ingredientIds[i], ingredientIds[j]]);
      }
    }
  }
  return untested;
}

export function isBeneficial(s: DbSynergy): boolean {
  return BENEFICIAL_TYPES.has(s.tipo);
}

export function isRisky(s: DbSynergy): boolean {
  return RISK_TYPES.has(s.tipo);
}
