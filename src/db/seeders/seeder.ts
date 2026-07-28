/**
 * Seeder - Poblar base de datos con datos iniciales
 * 
 * Carga los datos de la Knowledge Base en IndexedDB.
 */

import { db, generateId, now, getDeviceId, type DbIngredient, type DbSynergy } from '../schema';
import { logger } from '../../services/LoggerService';

/**
 * Datos de fitoterapia (plantas medicinales)
 */
import fitoterapiaData from './data/fitoterapia.json';
import homeopatiaData from './data/homeopatia.json';
import aceitesData from './data/aceites.json';
import vitaminasData from './data/vitaminas.json';
import sinergiasData from './data/sinergias.json';

interface SeederOptions {
  force?: boolean; // Forzar re-seed aunque ya existan datos
}

/**
 * Poblar la base de datos con datos iniciales
 */
export async function seedDatabase(options: SeederOptions = {}): Promise<void> {
  const { force = false } = options;
  
  logger.info('Iniciando seeding de base de datos...', 'Seeder');

  try {
    // Verificar si ya hay datos
    const existingCount = await db.ingredients.where('tombstone').equals(0).count();
    
    if (existingCount > 0 && !force) {
      logger.info(`Ya existen ${existingCount} ingredientes. Saltando seeding.`, 'Seeder');
      return;
    }

    if (force) {
      logger.info('Forzando re-seeding...', 'Seeder');
      await clearDatabase();
    }

    const deviceId = getDeviceId();
    const timestamp = now();

    // Insertar ingredientes de fitoterapia
    const fitoterapiaIngredients = (fitoterapiaData as any[]).map((item: any): DbIngredient => ({
      id: item.id || generateId(),
      nombre: item.nombre,
      sinonimos: item.sinonimos || [],
      categoria: 'fitoterapia' as const,
      familia: item.familia,
      sistemas: item.sistemas || [],
      indicaciones: item.indicaciones || [],
      evidencia: (item.evidenceLevel || item.evidencia || 'C') as DbIngredient['evidencia'],
      propiedades: item.propiedades || [],
      seguridad: {
        embarazo: item.advertencias?.embarazo,
        lactancia: item.advertencias?.lactancia,
        pediatria: item.advertencias?.pedia,
      },
      interacciones: item.interacciones || [],
      fuentes: item.fuentes || ['Vademecum AI KB'],
      lamport: 1,
      deviceId,
      updatedAt: timestamp,
      createdAt: timestamp,
      tombstone: 0,
    }));

    // Insertar homeopatía
    const homeopatiaIngredients = (homeopatiaData as any[]).map((item: any): DbIngredient => ({
      id: item.id || generateId(),
      nombre: item.nombre,
      sinonimos: item.sinonimos || [],
      categoria: 'homeopatia' as const,
      familia: item.familia,
      sistemas: item.sistemas || [],
      indicaciones: item.indicaciones || [],
      evidencia: 'C' as const,
      propiedades: item.propiedades || [],
      seguridad: { },
      interacciones: [],
      fuentes: item.fuentes || ['Vademecum AI KB'],
      lamport: 1,
      deviceId,
      updatedAt: timestamp,
      createdAt: timestamp,
      tombstone: 0,
    }));

    // Insertar aceites esenciales
    const aceitesIngredients = (aceitesData as any[]).map((item: any): DbIngredient => ({
      id: item.id || generateId(),
      nombre: item.nombre,
      sinonimos: item.sinonimos || [],
      categoria: 'aceite_esencial' as const,
      familia: item.familia,
      sistemas: item.sistemas || [],
      indicaciones: item.indicaciones || [],
      evidencia: (item.evidencia || 'C') as DbIngredient['evidencia'],
      propiedades: item.propiedades || [],
      seguridad: {
        embarazo: item.advertencias?.embarazo,
        lactancia: item.advertencias?.lactancia,
      },
      interacciones: item.interacciones || [],
      fuentes: item.fuentes || ['Vademecum AI KB'],
      lamport: 1,
      deviceId,
      updatedAt: timestamp,
      createdAt: timestamp,
      tombstone: 0,
    }));

    // Insertar vitaminas/minerales
    const vitaminasIngredients = (vitaminasData as any[]).map((item: any): DbIngredient => ({
      id: item.id || generateId(),
      nombre: item.nombre,
      sinonimos: item.sinonimos || [],
      categoria: 'vitamina' as const,
      familia: item.familia || item.tipoQuimico,
      sistemas: item.sistemas || [],
      indicaciones: item.indicaciones || [],
      evidencia: (item.evidenceLevel || 'A') as DbIngredient['evidencia'],
      propiedades: item.propiedades || [],
      seguridad: {
        embarazo: item.advertencias?.embarazo,
        lactancia: item.advertencias?.lactancia,
      },
      interacciones: item.interacciones || [],
      fuentes: item.fuentes || ['Vademecum AI KB'],
      lamport: 1,
      deviceId,
      updatedAt: timestamp,
      createdAt: timestamp,
      tombstone: 0,
    }));

    // Combinar todos los ingredientes
    const allIngredients = [
      ...fitoterapiaIngredients,
      ...homeopatiaIngredients,
      ...aceitesIngredients,
      ...vitaminasIngredients,
    ];

    // Bulk insert ingredientes
    await db.ingredients.bulkPut(allIngredients);
    logger.info(`Insertados ${allIngredients.length} ingredientes`, 'Seeder');

    // Insertar sinergias
    const synergies = (sinergiasData as any[]).map((item: any): DbSynergy => ({
      id: item.id || generateId(),
      ingredienteA: item.ingredienteA,
      ingredienteB: item.ingredienteB,
      tipo: item.tipo as DbSynergy['tipo'],
      nivel: item.nivel as DbSynergy['nivel'],
      mecanismo: item.mecanismo,
      evidencia: (item.evidenceLevel || item.nivelEvidencia || 'C') as DbSynergy['evidencia'],
      descripcion: item.descripcion,
      fuentes: item.fuentes || ['Vademecum AI KB'],
      lamport: 1,
      deviceId,
      updatedAt: timestamp,
      tombstone: 0,
    }));

    await db.synergies.bulkPut(synergies);
    logger.info(`Insertadas ${synergies.length} sinergias`, 'Seeder');

    logger.success('Seeding completado exitosamente', 'Seeder');
  } catch (error) {
    logger.error('Error en seeding', 'Seeder', error);
    throw error;
  }
}

/**
 * Limpiar base de datos (soft delete de todo)
 */
export async function clearDatabase(): Promise<void> {
  const timestamp = now();
  const deviceId = getDeviceId();

  await Promise.all([
    db.ingredients.toCollection().modify({ tombstone: 1, updatedAt: timestamp, deviceId }),
    db.synergies.toCollection().modify({ tombstone: 1, updatedAt: timestamp, deviceId }),
    db.products.toCollection().modify({ tombstone: 1, updatedAt: timestamp, deviceId }),
    db.protocols.toCollection().modify({ tombstone: 1, updatedAt: timestamp, deviceId }),
  ]);

  logger.info('Base de datos limpiada', 'Seeder');
}

/**
 * Obtener estadísticas del seeding
 */
export async function getSeedStats(): Promise<{
  ingredients: number;
  synergies: number;
  products: number;
  protocols: number;
}> {
  const [ingredients, synergies, products, protocols] = await Promise.all([
    db.ingredients.where('tombstone').equals(0).count(),
    db.synergies.where('tombstone').equals(0).count(),
    db.products.where('tombstone').equals(0).count(),
    db.protocols.where('tombstone').equals(0).count(),
  ]);

  return { ingredients, synergies, products, protocols };
}
