import { createRxDatabase, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';
import { RxDBMigrationPlugin } from 'rxdb/plugins/migration-schema';
import { Product } from '../core/types/product.types';

// Add plugins
addRxPlugin(RxDBMigrationPlugin);

const productSchema = {
  version: 2,
  primaryKey: 'sku',
  type: 'object',
  additionalProperties: true,
  properties: {
    sku: { type: 'string', maxLength: 100 },
    nombre_comercial: { type: 'string' },
    descripcion: { type: 'string' },
    principios_activos: { type: 'array', items: { type: 'string' } },
    posologia: { type: 'string' },
    indicaciones: { type: 'array', items: { type: 'string' } },
    advertencias: { type: 'string' },
    tags_ia: { type: 'array', items: { type: 'string' } },
    categoria_principal: { type: 'string' },
    analisis_componentes: { type: 'string' },
    anotaciones_componentes: { type: 'object' },
    vectores: { type: 'array', items: { type: 'number' } },
    apto_embarazo: { type: 'string' },
    apto_lactancia: { type: 'string' },
    apto_pediatria: { type: 'string' },
    apto_diabeticos: { type: 'string' },
    apto_hipertensos: { type: 'string' },
    apto_celiacos: { type: 'string' },
    sugerencia_complementaria: { type: 'string' },
    skus_relacionados: { type: 'array', items: { type: 'string' } },
    synergy_analyzed: { type: 'boolean' },
    last_synergy_analysis: { type: 'number' },
    locked_by_ai: { type: 'boolean' },
    lock_uid: { type: 'string' },
    lock_timestamp: { type: 'number' },
    source_url: { type: 'string' },
    last_updated: { type: 'number' },
    is_verified: { type: 'boolean' },
    verified_at: { type: 'number' },
    verified_by: { type: 'string' },
    synced: { type: 'boolean' },
    last_synced: { type: 'number' }
  },
  required: ['sku', 'nombre_comercial']
};

let db: any;
let initPromise: Promise<any> | null = null;

export const initDB = async () => {
  if (db) return db;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const database = await createRxDatabase({
      name: 'vademecumdb',
      storage: getRxStorageDexie()
    });

    await database.addCollections({
      products: {
        schema: productSchema,
        migrationStrategies: {
          // Migración de v0 a v1 para añadir campos de sincronización
          1: (oldDoc: any) => {
            oldDoc.synced = oldDoc.synced || false;
            oldDoc.last_synced = oldDoc.last_synced || Date.now();
            return oldDoc;
          },
          // Migración v1 a v2 para bloqueo atómico
          2: (oldDoc: any) => {
            oldDoc.locked_by_ai = oldDoc.locked_by_ai || false;
            return oldDoc;
          }
        }
      },
      pending_tasks: {
        schema: {
          version: 1,
          primaryKey: 'id',
          type: 'object',
          properties: {
            id: { type: 'string', maxLength: 100 },
            type: { type: 'string' },
            payload: { type: 'object' },
            timestamp: { type: 'number' },
            status: { type: 'string', enum: ['pending', 'processing', 'failed'], default: 'pending' },
            retries: { type: 'number', default: 0 },
            lastError: { type: 'string' }
          },
          required: ['id', 'type', 'timestamp', 'status']
        },
        migrationStrategies: {
          // Migración de v0 a v1
          1: (oldDoc: any) => {
            oldDoc.status = oldDoc.status || 'pending';
            oldDoc.retries = oldDoc.retries || 0;
            return oldDoc;
          }
        }
      }
    });

    db = database;
    return db;
  })();

  return initPromise;
};

export const getDB = () => {
  if (!db) {
    console.warn('[DatabaseService] DB not initialized yet');
  }
  return db;
};

/**
 * Helper to wait for DB to be ready if needed
 */
export const waitForDB = async () => {
  let count = 0;
  while (!db && count < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    count++;
  }
  return db;
};
