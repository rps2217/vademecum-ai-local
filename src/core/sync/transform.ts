/**
 * Utilidades de transformación de formato entre local (camelCase) y Supabase (snake_case).
 */

import type {
  DbIngredient,
  DbSynergy,
  DbPathology,
} from '@/db/schema';

/**
 * Convierte una clave camelCase a snake_case.
 * Maneja sufijos de palabra (ingredienteA → ingrediente_a) y
 * grupos de mayúsculas consecutivas (httpURL → http_url).
 */
function toSnakeCase(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .toLowerCase();
}

/** Convierte una clave snake_case a camelCase (ingrediente_a → ingredienteA). */
function toCamelCase(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

/**
 * Convierte un valor de timestamp remoto (ISO string o epoch ms) a epoch ms
 * (el formato que usa Dexie). Devuelve 0 si el valor es inválido/ausente.
 */
function toEpochMs(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value) {
    const ms = new Date(value).getTime();
    return Number.isNaN(ms) ? 0 : ms;
  }
  return 0;
}

/**
 * Transforma un payload local (camelCase, con timestamps epoch ms)
 * al formato que espera Supabase (snake_case, con updated_at ISO string).
 */
export function toSupabaseFormat(payload: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    const snakeKey = toSnakeCase(key);
    // updatedAt, createdAt y lastSyncAt son number (epoch ms) en Dexie pero las
    // columnas remotas son TIMESTAMPTZ.
    if ((key === 'updatedAt' || key === 'createdAt' || key === 'lastSyncAt') && typeof value === 'number') {
      result[snakeKey] = new Date(value).toISOString();
    } else {
      result[snakeKey] = value;
    }
  }
  return result;
}

/**
 * Transforma una fila remota de `ingredients` (snake_case, ISO timestamps)
 * al formato local `DbIngredient` (camelCase, epoch ms).
 *
 * Es el inverso de `toSupabaseFormat` para ingredientes. Centraliza el mapeo
 * que antes vivía inline en `SyncService.mergeRemoteIngredient`, donde se
 * perdían `posologia` y `embedding` (data-loss al descargar).
 */
export function fromSupabaseIngredient(remote: Record<string, unknown>): DbIngredient {
  return {
    id: remote.id as string,
    nombre: remote.nombre as string,
    sinonimos: (remote.sinonimos as string[]) || [],
    categoria: remote.categoria as DbIngredient['categoria'],
    familia: (remote.familia as string | undefined) ?? undefined,
    sistemas: (remote.sistemas as DbIngredient['sistemas']) || [],
    indicaciones: (remote.indicaciones as string[]) || [],
    evidencia: (remote.evidencia as DbIngredient['evidencia']) || 'C',
    propiedades: (remote.propiedades as string[]) || [],
    posologia: (remote.posologia as string | undefined) ?? undefined,
    seguridad: (remote.seguridad as DbIngredient['seguridad']) || {},
    interacciones: (remote.interacciones as string[]) || [],
    fuentes: (remote.fuentes as string[]) || [],
    embedding: (remote.embedding as number[] | undefined) ?? undefined,
    lamport: (remote.lamport as number) || 0,
    deviceId: (remote.device_id as string) ?? '',
    updatedAt: toEpochMs(remote.updated_at),
    createdAt: toEpochMs(remote.created_at),
    tombstone: (remote.tombstone as 0 | 1) || 0,
  };
}

/**
 * Transforma una fila remota de `synergies` al formato local `DbSynergy`.
 * Inverso de `toSupabaseFormat` para sinergias.
 */
export function fromSupabaseSynergy(remote: Record<string, unknown>): DbSynergy {
  return {
    id: remote.id as string,
    ingredienteA: (remote.ingrediente_a as string) ?? '',
    ingredienteB: (remote.ingrediente_b as string) ?? '',
    tipo: (remote.tipo as DbSynergy['tipo']) || 'sinergia',
    nivel: (remote.nivel as DbSynergy['nivel']) || 'medio',
    mecanismo: (remote.mecanismo as string | undefined) ?? undefined,
    evidencia: (remote.evidencia as DbSynergy['evidencia']) || 'C',
    descripcion: (remote.descripcion as string | undefined) ?? undefined,
    fuentes: (remote.fuentes as string[]) || [],
    lamport: (remote.lamport as number) || 0,
    deviceId: (remote.device_id as string) ?? '',
    updatedAt: toEpochMs(remote.updated_at),
    tombstone: (remote.tombstone as 0 | 1) || 0,
  };
}

/**
 * Transforma una fila remota de `pathologies` al formato local `DbPathology`.
 * Inverso de `toSupabaseFormat` para patologías.
 */
export function fromSupabasePathology(remote: Record<string, unknown>): DbPathology {
  return {
    id: remote.id as string,
    nombre: remote.nombre as string,
    definicion: (remote.definicion as string) ?? '',
    causas: (remote.causas as string[]) || [],
    sintomas: (remote.sintomas as string[]) || [],
    sistemas: (remote.sistemas as DbPathology['sistemas']) || [],
    tratamientoAlopatico: (remote.tratamiento_alopatico as DbPathology['tratamientoAlopatico']) || {
      primeraLinea: [],
      mecanismo: '',
      efectosSecundarios: [],
    },
    tratamientoNatural: (remote.tratamiento_natural as DbPathology['tratamientoNatural']) || {
      fitoterapia: [],
      suplementos: [],
      homeopatia: [],
      aceites: [],
      cuandoPreferir: '',
    },
    prevencion: (remote.prevencion as string[]) || [],
    cuandoConsultar: (remote.cuando_consultar as string) ?? '',
    epidemiologia: (remote.epidemiologia as string | undefined) ?? undefined,
    factoresRiesgo: (remote.factores_riesgo as string[]) || undefined,
    diagnostico: (remote.diagnostico as string | undefined) ?? undefined,
    criteriosDiagnostico: (remote.criterios_diagnostico as string[]) || undefined,
    escalasClinicas: (remote.escalas_clinicas as DbPathology['escalasClinicas']) || undefined,
    diagnosticoDiferencial: (remote.diagnostico_diferencial as string[]) || undefined,
    pronostico: (remote.pronostico as string | undefined) ?? undefined,
    poblacionesEspeciales: (remote.poblaciones_especiales as DbPathology['poblacionesEspeciales']) || undefined,
    alertasFarmaceuticas: (remote.alertas_farmaceuticas as string[]) || undefined,
    evidencia: (remote.evidencia as DbPathology['evidencia']) || 'C',
    fuentes: (remote.fuentes as string[]) || [],
    lamport: (remote.lamport as number) || 0,
    deviceId: (remote.device_id as string) ?? '',
    updatedAt: toEpochMs(remote.updated_at),
    createdAt: toEpochMs(remote.created_at),
    tombstone: (remote.tombstone as 0 | 1) || 0,
  };
}

/** Convierte un objeto remoto snake_case a camelCase (genérico, para metadatos). */
export function fromSnakeCase<T = Record<string, unknown>>(remote: Record<string, unknown>): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(remote)) {
    result[toCamelCase(key)] = value;
  }
  return result as T;
}

