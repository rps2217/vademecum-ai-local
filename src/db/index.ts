/**
 * Database Module - Vademecum AI
 *
 * Capa de datos local basada en Dexie (IndexedDB).
 */

// Schema y configuración
export {
  db,
  VademecumDB,
  generateId,
  now,
  synergyHash,
  getDeviceId,
  nextLamport,
  updateLamport,
  DB_VERSION,
} from './schema';

export type {
  // Entidades
  DbProduct,
  DbIngredient as Ingredient,
  DbSynergy as Synergy,
  DbProtocol,
  DbOutboxOp,
  DbSnapshot,
  DbSyncMeta,
  DbSearchHistory,

  // Tipos auxiliares
  SafetyStatus,
  ProductSource,
  IngredientCategory,
  BodySystem,
  EvidenceLevel,
  SynergyType,
  SynergyLevel,
  SyncOpType,
  SyncTable,
  OutboxStatus,
  SnapshotType,
  IngredientSafety,
  ProtocolIngredient,
} from './schema';

// Seeders - funciones básicas para populate inicial
import { db } from './schema';

export async function seedDatabase(): Promise<void> {
  console.log('Database ready');
}

export async function clearDatabase(): Promise<void> {
  await db.ingredients.clear();
  await db.synergies.clear();
  await db.products.clear();
  await db.protocols.clear();
}

export async function getSeedStats() {
  return {
    ingredients: await db.ingredients.count(),
    synergies: await db.synergies.count(),
    products: await db.products.count(),
    protocols: await db.protocols.count(),
  };
}
