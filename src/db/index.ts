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
  DbIngredient,
  DbSynergy,
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

// Hooks React
export {
  useIngredients,
  useIngredient,
  useSearchIngredients,
  useSynergies,
  useSynergiesFor,
  useProducts,
  useProduct,
  useProtocols,
  useDbStats,
  useSearchHistory,
  useDbReady,
  useQuery,
} from './hooks';

// Seeders
export {
  seedDatabase,
  clearDatabase,
  getSeedStats,
} from './seeders/seeder';
