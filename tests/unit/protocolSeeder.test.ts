/**
 * Tests de integridad de los protocolos predefinidos.
 *
 * Valida el JSON semilla (protocolos.json) sin necesidad de IndexedDB:
 *   - Sin IDs de protocolo duplicados.
 *   - Todos los ingredientes referenciados existen en la KB.
 *   - Sin ingredientes duplicados dentro del mismo protocolo.
 *   - Campos obligatorios presentes (nombre, objetivo, duracionDias, advertencias).
 *   - momento tiene un valor válido.
 *   - duracionDias es un número positivo.
 *   - metadata.total coherente con el número de protocolos.
 */

import { describe, it, expect } from 'vitest';
import protocolosJson from '@/db/seeders/data/protocolos.json';
import fitoJson from '@/db/seeders/data/fitoterapia.json';
import homeoJson from '@/db/seeders/data/homeopatia.json';
import aceitesJson from '@/db/seeders/data/aceites.json';
import vitJson from '@/db/seeders/data/vitaminas_minerales.json';

function ingredientesOf(f: { ingredientes?: unknown[] } | unknown[]): unknown[] {
  return Array.isArray(f) ? f : (f.ingredientes ?? []);
}

const fito = ingredientesOf(fitoJson as never) as { id: string }[];
const homeo = ingredientesOf(homeoJson as never) as { id: string }[];
const aceites = ingredientesOf(aceitesJson as never) as { id: string }[];
const vit = ingredientesOf(vitJson as never) as { id: string }[];

const ingIds = new Set([...fito, ...homeo, ...aceites, ...vit].map((i) => i.id));

interface JsonProtocolIngredient {
  id: string;
  cantidad: string;
  momento: string;
}

interface JsonProtocol {
  id: string;
  nombre: string;
  objetivo: string;
  ingredientes: JsonProtocolIngredient[];
  duracionDias: number;
  advertencias: string[];
  notas?: string;
}

const protocolos = (protocolosJson.protocolos ?? []) as JsonProtocol[];

const VALID_MOMENTOS = ['', 'mañana', 'mediodía', 'tarde', 'noche', 'ayunas', 'comidas'];

describe('Integridad de protocolos predefinidos', () => {
  it('metadata.total coincide con el número de protocolos', () => {
    expect(protocolosJson.metadata?.total).toBe(protocolos.length);
  });

  it('tiene al menos 10 protocolos predefinidos', () => {
    expect(protocolos.length).toBeGreaterThanOrEqual(10);
  });

  it('no tiene IDs de protocolo duplicados', () => {
    const seen = new Map<string, number>();
    for (const p of protocolos) seen.set(p.id, (seen.get(p.id) ?? 0) + 1);
    const dups = [...seen.entries()].filter(([, c]) => c > 1);
    expect(dups, `IDs duplicados: ${dups.map(([id]) => id).join(', ')}`).toEqual([]);
  });

  it('todos los IDs tienen prefijo prot_', () => {
    const bad = protocolos.filter((p) => !p.id.startsWith('prot_'));
    expect(bad, `IDs sin prefijo: ${bad.map((p) => p.id).join(', ')}`).toEqual([]);
  });

  it('todos los ingredientes referenciados existen en la KB', () => {
    const missing: string[] = [];
    for (const p of protocolos) {
      for (const ing of p.ingredientes) {
        if (!ingIds.has(ing.id)) {
          missing.push(`${p.id} → ${ing.id}`);
        }
      }
    }
    expect(missing, `Ingredientes inexistentes: ${missing.join(', ')}`).toEqual([]);
  });

  it('no tiene ingredientes duplicados dentro del mismo protocolo', () => {
    const dups: string[] = [];
    for (const p of protocolos) {
      const seen = new Map<string, number>();
      for (const ing of p.ingredientes) seen.set(ing.id, (seen.get(ing.id) ?? 0) + 1);
      for (const [id, c] of seen) if (c > 1) dups.push(`${p.id} → ${id} (${c}x)`);
    }
    expect(dups, `Ingredientes duplicados: ${dups.join(', ')}`).toEqual([]);
  });

  it('todos los protocolos tienen campos obligatorios', () => {
    const incomplete: string[] = [];
    for (const p of protocolos) {
      if (!p.nombre || !p.objetivo || !p.duracionDias || !p.advertencias) {
        incomplete.push(p.id);
      }
    }
    expect(incomplete, `Protocolos incompletos: ${incomplete.join(', ')}`).toEqual([]);
  });

  it('todos los protocolos tienen al menos un ingrediente', () => {
    const empty = protocolos.filter((p) => p.ingredientes.length === 0);
    expect(empty, `Sin ingredientes: ${empty.map((p) => p.id).join(', ')}`).toEqual([]);
  });

  it('todos los protocolos tienen al menos una advertencia', () => {
    const noWarn = protocolos.filter((p) => p.advertencias.length === 0);
    expect(noWarn, `Sin advertencias: ${noWarn.map((p) => p.id).join(', ')}`).toEqual([]);
  });

  it('duracionDias es un número positivo', () => {
    const bad = protocolos.filter((p) => p.duracionDias <= 0);
    expect(bad, `Duración inválida: ${bad.map((p) => p.id).join(', ')}`).toEqual([]);
  });

  it('todos los momentos tienen valores válidos', () => {
    const bad: string[] = [];
    for (const p of protocolos) {
      for (const ing of p.ingredientes) {
        if (!VALID_MOMENTOS.includes(ing.momento)) {
          bad.push(`${p.id} → ${ing.id}: "${ing.momento}"`);
        }
      }
    }
    expect(bad, `Momentos inválidos: ${bad.join(', ')}`).toEqual([]);
  });

  it('todos los ingredientes tienen cantidad definida', () => {
    const bad: string[] = [];
    for (const p of protocolos) {
      for (const ing of p.ingredientes) {
        if (!ing.cantidad || ing.cantidad.trim() === '') {
          bad.push(`${p.id} → ${ing.id}`);
        }
      }
    }
    expect(bad, `Sin cantidad: ${bad.join(', ')}`).toEqual([]);
  });
});
