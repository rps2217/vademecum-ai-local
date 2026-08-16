/**
 * Tests de integridad referencial de la Knowledge Base.
 *
 * Valida los JSON semilla (fitoterapia, homeopatia, aceites,
 * vitaminas_minerales, sinergias, patologias) sin necesidad de IndexedDB:
 *   - Sin IDs de ingredientes duplicados entre archivos.
 *   - Sin sinergias huérfanas (que referencian ingredientes inexistentes).
 *   - Sin sinergias auto-referenciales (ingredienteA === ingredienteB).
 *   - Sin IDs de sinergia duplicados.
 *   - Sin pares (A,B) duplicados bidireccionales.
 *   - Sistemas corporales válidos (enum BODY_SYSTEMS) en ingredientes y patologías.
 *   - metadata.total coherente con el número de registros del array.
 *
 * Estos tests protegen contra regresiones al expandir la KB.
 */

import { describe, it, expect } from 'vitest';
import fitoJson from '@/db/seeders/data/fitoterapia.json';
import homeoJson from '@/db/seeders/data/homeopatia.json';
import aceitesJson from '@/db/seeders/data/aceites.json';
import vitJson from '@/db/seeders/data/vitaminas_minerales.json';
import sinergiasJson from '@/db/seeders/data/sinergias.json';
import patologiasJson from '@/db/seeders/data/patologias.json';
import { BODY_SYSTEMS } from '@/types/shared-enums';

const BODY = [...BODY_SYSTEMS];

function ingredientesOf(f: { ingredientes?: unknown[] } | unknown[]): unknown[] {
  return Array.isArray(f) ? f : (f.ingredientes ?? []);
}

const fito = ingredientesOf(fitoJson as never) as { id: string; sistemas?: string[] }[];
const homeo = ingredientesOf(homeoJson as never) as { id: string; sistemas?: string[] }[];
const aceites = ingredientesOf(aceitesJson as never) as { id: string; sistemas?: string[] }[];
const vit = ingredientesOf(vitJson as never) as { id: string; sistemas?: string[] }[];
const sinergias = (sinergiasJson.sinergias ?? []) as {
  id: string; ingredienteA: string; ingredienteB: string; sistemas?: string[];
}[];
const patologias = (patologiasJson.patologias ?? []) as { id: string; sistemas?: string[] }[];

const allIngredients = [...fito, ...homeo, ...aceites, ...vit];
const ingIds = new Set(allIngredients.map(i => i.id));

describe('Integridad referencial de la KB', () => {
  it('no tiene IDs de ingredientes duplicados entre archivos', () => {
    const seen = new Map<string, number>();
    for (const i of allIngredients) seen.set(i.id, (seen.get(i.id) ?? 0) + 1);
    const dups = [...seen.entries()].filter(([, c]) => c > 1);
    expect(dups, `IDs duplicados: ${dups.map(([id]) => id).join(', ')}`).toEqual([]);
  });

  it('no tiene sinergias huérfanas (referencian ingredientes inexistentes)', () => {
    const orphans = sinergias.filter(
      s => !ingIds.has(s.ingredienteA) || !ingIds.has(s.ingredienteB)
    );
    expect(orphans, `Sinergias huérfanas: ${orphans.map(s => s.id).join(', ')}`).toEqual([]);
  });

  it('no tiene sinergias auto-referenciales (ingredienteA === ingredienteB)', () => {
    const self = sinergias.filter(s => s.ingredienteA === s.ingredienteB);
    expect(self, `Auto-referenciales: ${self.map(s => s.id).join(', ')}`).toEqual([]);
  });

  it('no tiene IDs de sinergia duplicados', () => {
    const seen = new Map<string, number>();
    for (const s of sinergias) seen.set(s.id, (seen.get(s.id) ?? 0) + 1);
    const dups = [...seen.entries()].filter(([, c]) => c > 1);
    expect(dups, `IDs duplicados: ${dups.map(([id]) => id).join(', ')}`).toEqual([]);
  });

  it('no tiene pares (A,B) duplicados bidireccionales', () => {
    const pairKey = (a: string, b: string) => [a, b].sort().join('|');
    const pairs = new Map<string, number>();
    for (const s of sinergias) {
      const k = pairKey(s.ingredienteA, s.ingredienteB);
      pairs.set(k, (pairs.get(k) ?? 0) + 1);
    }
    const dups = [...pairs.entries()].filter(([, c]) => c > 1);
    expect(dups, `Pares duplicados: ${dups.map(([k]) => k).join(', ')}`).toEqual([]);
  });

  it('los sistemas corporales de ingredientes son válidos (enum BODY_SYSTEMS)', () => {
    const invalid = new Set<string>();
    for (const i of allIngredients) {
      for (const s of i.sistemas ?? []) {
        if (!BODY.includes(s)) invalid.add(s);
      }
    }
    expect([...invalid], `Sistemas inválidos en ingredientes: ${[...invalid].join(', ')}`).toEqual([]);
  });

  it('los sistemas corporales de patologías son válidos (enum BODY_SYSTEMS)', () => {
    const invalid = new Set<string>();
    for (const p of patologias) {
      for (const s of p.sistemas ?? []) {
        if (!BODY.includes(s)) invalid.add(s);
      }
    }
    expect([...invalid], `Sistemas inválidos en patologías: ${[...invalid].join(', ')}`).toEqual([]);
  });

  it('metadata.total coincide con el número de registros del array', () => {
    const checks: [string, unknown[], number | undefined][] = [
      ['fitoterapia', fito, (fitoJson as { metadata?: { total?: number } }).metadata?.total],
      ['homeopatia', homeo, (homeoJson as { metadata?: { total?: number } }).metadata?.total],
      ['aceites', aceites, (aceitesJson as { metadata?: { total?: number } }).metadata?.total],
      ['vitaminas', vit, (vitJson as { metadata?: { total?: number } }).metadata?.total],
      ['sinergias', sinergias, (sinergiasJson as { metadata?: { total?: number } }).metadata?.total],
      ['patologias', patologias, (patologiasJson as { metadata?: { total?: number } }).metadata?.total],
    ];
    for (const [name, arr, meta] of checks) {
      expect(meta, `${name}: metadata.total debe estar definido`).toBeDefined();
      expect(arr.length, `${name}: array (${arr.length}) ≠ metadata.total (${meta})`).toBe(meta);
    }
  });
});
