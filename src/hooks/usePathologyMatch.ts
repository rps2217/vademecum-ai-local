/**
 * usePathologyMatch — Índice invertido de patologías + matching por query
 *
 * Extraído de SearchPage.tsx (hallazgo 5.7). Encapsula:
 * - Carga de patologías (useLiveQuery)
 * - Índice invertido token → Set<pathologyId> (O(tokens) por query)
 * - Matching por score de tokens + sinónimos coloquiales
 *
 * Retorna la patología que mejor coincide con el query/indicación.
 */

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import type { DbPathology } from '@/db/schema';
import { normalize, tokenize, getQuerySynonyms } from '@/lib/text';

export function usePathologyMatch(query: string, indication: string) {
  const allPathologies = useLiveQuery(() => db.pathologies.toArray(), []);

  const pathologyByIndication = useMemo(() => {
    const m = new Map<string, DbPathology>();
    if (allPathologies) {
      for (const p of allPathologies) m.set(p.id, p);
    }
    return m;
  }, [allPathologies]);

  const pathologyIndex = useMemo(() => {
    const idx = new Map<string, Set<string>>();
    if (!allPathologies) return idx;
    const add = (id: string, text: string) => {
      for (const tok of tokenize(text)) {
        let set = idx.get(tok);
        if (!set) { set = new Set(); idx.set(tok, set); }
        set.add(id);
      }
    };
    for (const p of allPathologies) {
      add(p.id, p.id);
      add(p.id, p.nombre);
      for (const s of p.sistemas ?? []) add(p.id, s);
      for (const s of p.sintomas ?? []) add(p.id, s);
    }
    return idx;
  }, [allPathologies]);

  const matchedPathology = useMemo(() => {
    if (!allPathologies || allPathologies.length === 0) return null;
    if (indication && pathologyByIndication.has(indication)) {
      return pathologyByIndication.get(indication)!;
    }
    if (query.length < 2) return null;

    const qTokens = tokenize(query);
    if (qTokens.length === 0) return null;

    const nq = normalize(query);
    const exact = allPathologies.find(p => p.id === nq);
    if (exact) return exact;

    const scores = new Map<string, number>();
    for (const tok of qTokens) {
      const ids = pathologyIndex.get(tok);
      if (ids) {
        for (const id of ids) {
          scores.set(id, (scores.get(id) ?? 0) + 1);
        }
      }
      const syns = getQuerySynonyms(tok);
      if (syns) {
        for (const s of syns) {
          for (const st of tokenize(s)) {
            const ids2 = pathologyIndex.get(st);
            if (ids2) {
              for (const id of ids2) {
                scores.set(id, (scores.get(id) ?? 0) + 0.5);
              }
            }
          }
        }
      }
    }

    if (scores.size === 0) return null;
    let bestId: string | null = null;
    let bestScore = 0;
    for (const [id, score] of scores) {
      if (score > bestScore) {
        bestScore = score;
        bestId = id;
      }
    }
    if (bestId && bestScore >= 0.5) {
      const p = pathologyByIndication.get(bestId);
      if (p) {
        const np = normalize(p.nombre);
        if (np === nq || np.includes(nq) || nq.includes(np)) return p;
        return p;
      }
    }
    return null;
  }, [allPathologies, pathologyByIndication, pathologyIndex, indication, query]);

  return { matchedPathology, allPathologies };
}
