/**
 * Protocol Seeder
 *
 * Siembra protocolos de suplementación predefinidos en la base de datos.
 * Sigue el mismo patrón que knowledgeSeeder: bulkPut (upsert) + cleanup de
 * registros stale + control de versión en syncMeta.
 *
 * Los protocolos sembrados tienen IDs con prefijo "prot_" para distinguirlos
 * de los creados por el usuario. El cleanup solo elimina protocolos cuyo ID
 * estaba en una siembra anterior pero ya no está en el JSON actual.
 */
import { logger } from '@/lib/logger';

import { db } from '../schema';
import type { DbProtocol } from '../schema';
import { getDeviceId, now } from '../schema';

// ============================================
// VERSIÓN DE PROTOCOLOS (para re-siembra automática)
// ============================================

const PROTOCOL_VERSION_KEY = 'protocol_seed_version';
const PROTOCOL_SEED_IDS_KEY = 'protocol_seed_ids';

interface JsonProtocol {
  id: string;
  nombre: string;
  objetivo: string;
  ingredientes: { id: string; cantidad: string; momento: string }[];
  duracionDias: number;
  advertencias: string[];
  notas?: string;
}

function computeProtocolVersion(count: number): string {
  return `p${count}`;
}

export async function getStoredProtocolVersion(): Promise<string | null> {
  const meta = await db.syncMeta.get(PROTOCOL_VERSION_KEY);
  return (meta?.value as string) ?? null;
}

/**
 * Comprueba si los protocolos están sembrados y actualizados.
 * Requiere que la KB de ingredientes ya esté sembrada (las referencias
 * a ingredientes se validan en seedProtocols, no aquí).
 */
export async function isProtocolSeedUpToDate(): Promise<boolean> {
  const count = await db.protocols.count();
  if (count === 0) return false;

  const data = await import('./data/protocolos.json');
  const current = computeProtocolVersion(data.default?.protocolos?.length ?? 0);
  const stored = await getStoredProtocolVersion();
  if (stored !== current) {
    logger.log(`Protocol version mismatch (stored: ${stored}, current: ${current}), re-seeding needed`);
    return false;
  }
  return true;
}

function transformProtocol(json: JsonProtocol): DbProtocol {
  return {
    id: json.id,
    nombre: json.nombre,
    objetivo: json.objetivo,
    ingredientes: json.ingredientes.map((ing) => ({
      id: ing.id,
      cantidad: ing.cantidad,
      momento: ing.momento,
    })),
    duracionDias: json.duracionDias,
    advertencias: json.advertencias,
    notas: json.notas,
    // Metadatos de sync: lamport 0 = dato seed (no conflictúa con ediciones de usuario)
    lamport: 0,
    deviceId: getDeviceId(),
    updatedAt: now(),
    createdAt: now(),
    tombstone: 0,
  };
}

/**
 * Valida que todos los ingredientes referenciados por los protocolos
 * existen en la KB. Devuelve la lista de IDs inválidos (vacía si todo OK).
 */
export async function validateProtocolReferences(): Promise<string[]> {
  const data = await import('./data/protocolos.json');
  const protocolos: JsonProtocol[] = data.default?.protocolos ?? [];
  const referencedIds = new Set<string>();
  for (const p of protocolos) {
    for (const ing of p.ingredientes) {
      referencedIds.add(ing.id);
    }
  }
  const existing = new Set((await db.ingredients.bulkGet([...referencedIds]))
    .filter((i): i is NonNullable<typeof i> => i != null)
    .map((i) => i.id));
  return [...referencedIds].filter((id) => !existing.has(id));
}

async function getStoredProtocolSeedIds(): Promise<string[]> {
  const meta = await db.syncMeta.get(PROTOCOL_SEED_IDS_KEY);
  return (meta?.value as string[] | undefined) ?? [];
}

/**
 * Elimina protocolos sembrados que ya no están en el JSON actual.
 * Preserva los protocolos creados por el usuario (cuyos IDs no estaban
 * en ninguna siembra previa).
 */
async function cleanupStaleProtocolSeeds(currentIds: string[]): Promise<void> {
  const stored = await getStoredProtocolSeedIds();
  const staleIds = stored.filter((id) => !currentIds.includes(id));
  if (staleIds.length > 0) {
    await db.protocols.bulkDelete(staleIds);
    logger.log(`Cleaned up ${staleIds.length} stale seed protocols`);
  }
  await db.syncMeta.put({
    key: PROTOCOL_SEED_IDS_KEY,
    value: currentIds,
    updatedAt: now(),
  });
}

export async function seedProtocols(): Promise<{ protocols: number }> {
  logger.log('Seeding predefined protocols...');
  const data = await import('./data/protocolos.json');
  const jsonProtocolos: JsonProtocol[] = data.default?.protocolos ?? [];

  if (jsonProtocolos.length === 0) {
    logger.warn('No protocols found in protocolos.json');
    return { protocols: 0 };
  }

  // Validar referencias antes de sembrar
  const invalidRefs = await validateProtocolReferences();
  if (invalidRefs.length > 0) {
    logger.warn(
      `Protocol seed: ${invalidRefs.length} ingredient references not found in KB: ${invalidRefs.join(', ')}. ` +
        'These protocols may reference non-existent ingredients.',
    );
  }

  const protocols = jsonProtocolos.map(transformProtocol);
  await db.protocols.bulkPut(protocols);
  const ids = protocols.map((p) => p.id);
  logger.log(`Protocols seeded: ${protocols.length}`);

  await cleanupStaleProtocolSeeds(ids);

  const version = computeProtocolVersion(protocols.length);
  await db.syncMeta.put({
    key: PROTOCOL_VERSION_KEY,
    value: version,
    updatedAt: now(),
  });
  logger.log(`Protocol version stored: ${version}`);

  return { protocols: protocols.length };
}
