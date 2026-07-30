/**
 * Knowledge Base Seeder
 * Carga los datos de la KB en la base de datos Dexie.
 */
import { logger } from '@/lib/logger';

import { db } from '../schema';
import type { 
  DbIngredient, 
  DbSynergy, 
  IngredientCategory, 
  BodySystem, 
  EvidenceLevel,
  SynergyType,
  SynergyLevel
} from '../schema';
import { getDeviceId, now } from '../schema';

interface JsonIngredient {
  id: string;
  nombre: string;
  nombresAlternativos?: string[];
  nombreCientifico?: string;
  familia?: string;
  categoria: string;
  sistemas?: string[];
  indicaciones?: string[];
  descripcion?: string;
  mecanismoAccion?: string;
  nivelEvidencia?: string;
  parteUsada?: string;
  tiempoEfecto?: string;
  duracionTratamiento?: string;
  advertencias?: string[];
  interaccionesMedicamentosas?: string[];
  tags?: string[];
}

interface JsonSynergy {
  id: string;
  ingredienteA: string;
  ingredienteB: string;
  tipo: string;
  nivelEvidencia?: string;
  descripcion?: string;
  mecanismo?: string;
  beneficios?: string[];
}

function mapEvidenceLevel(level?: string): EvidenceLevel {
  const map: Record<string, EvidenceLevel> = {
    'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D',
    'alto': 'A', 'medio': 'B', 'bajo': 'C',
  };
  return map[level || ''] || 'C';
}

function mapCategory(cat: string): IngredientCategory {
  const map: Record<string, IngredientCategory> = {
    'fitoterapia': 'fitoterapia',
    'homeopatia': 'homeopatia',
    'aceite_esencial': 'aceite_esencial',
    'vitamina': 'vitamina',
    'vitaminas': 'vitamina',
    'mineral': 'mineral',
    'minerales': 'mineral',
    'probiotico': 'probiotico',
    'probioticos': 'probiotico',
    'prebiotico': 'prebiotico',
    'prebioticos': 'prebiotico',
    'enzima': 'enzima',
    'enzimas': 'enzima',
    'aminoacido': 'aminoacido',
    'aminoacidos': 'aminoacido',
  };
  return map[cat] || 'fitoterapia';
}

function mapSystems(sistemas?: string[]): BodySystem[] {
  const validSystems: BodySystem[] = [
    'nervioso', 'digestivo', 'inmune', 'cardiovascular',
    'respiratorio', 'musculoesqueletico', 'endocrino'
  ];
  if (!sistemas) return [];
  return sistemas
    .map(s => s.toLowerCase().trim())
    .filter(s => validSystems.includes(s as BodySystem)) as BodySystem[];
}

function mapSynergyType(tipo: string): SynergyType {
  const map: Record<string, SynergyType> = {
    'sinergia': 'sinergia',
    'potenciador': 'sinergia',
    'complemento': 'complemento',
    'complementario': 'complemento',
    'interaccion': 'interaccion',
    'antagonismo': 'antagonismo',
  };
  return map[tipo] || 'sinergia';
}

function mapSynergyLevel(nivel?: string): SynergyLevel {
  if (!nivel) return 'medio';
  const lower = nivel.toLowerCase();
  if (lower.includes('alto') || lower.includes('critico')) return 'alto';
  if (lower.includes('bajo')) return 'bajo';
  return 'medio';
}

function transformIngredient(json: JsonIngredient): DbIngredient {
  const sinonimos = [
    json.nombre,
    ...(json.nombresAlternativos || []),
    json.nombreCientifico,
  ].filter(Boolean) as string[];

  return {
    id: json.id,
    nombre: json.nombre,
    sinonimos,
    categoria: mapCategory(json.categoria),
    familia: json.familia,
    sistemas: mapSystems(json.sistemas),
    indicaciones: json.indicaciones || [],
    evidencia: mapEvidenceLevel(json.nivelEvidencia),
    propiedades: [
      json.descripcion,
      json.mecanismoAccion,
      json.parteUsada ? `Parte usada: ${json.parteUsada}` : undefined,
      json.tiempoEfecto ? `Tiempo de efecto: ${json.tiempoEfecto}` : undefined,
      json.duracionTratamiento ? `Duracion: ${json.duracionTratamiento}` : undefined,
    ].filter(Boolean) as string[],
    seguridad: {
      embarazo: json.advertencias?.some(a => a.toLowerCase().includes('embarazo'))
        ? 'evitar' : undefined,
      lactancia: json.advertencias?.some(a => a.toLowerCase().includes('lactancia'))
        ? 'evitar' : undefined,
      pediatria: json.advertencias?.some(a => 
        a.toLowerCase().includes('pediatria') || a.toLowerCase().includes('nino')
      ) ? 'evitar' : undefined,
    },
    interacciones: json.interaccionesMedicamentosas || [],
    fuentes: json.tags || [],
    lamport: 0,
    deviceId: getDeviceId(),
    updatedAt: now(),
    createdAt: now(),
    tombstone: 0,
  };
}

function transformSynergy(json: JsonSynergy): DbSynergy {
  return {
    id: json.id,
    ingredienteA: json.ingredienteA,
    ingredienteB: json.ingredienteB,
    tipo: mapSynergyType(json.tipo),
    nivel: mapSynergyLevel(json.nivelEvidencia),
    mecanismo: json.mecanismo || json.descripcion,
    evidencia: mapEvidenceLevel(json.nivelEvidencia),
    descripcion: json.descripcion,
    fuentes: json.beneficios || [],
    lamport: 0,
    deviceId: getDeviceId(),
    updatedAt: now(),
    tombstone: 0,
  };
}

async function loadFitoterapia(): Promise<number> {
  try {
    const data = await import('./data/fitoterapia.json');
    if (!data.default?.ingredientes || !Array.isArray(data.default.ingredientes)) {
      logger.error('Fitoterapia: datos inválidos o estructura incorrecta');
      return 0;
    }
    const ingredients = data.default.ingredientes.map(transformIngredient);
    await db.ingredients.bulkPut(ingredients);
    logger.log(`Fitoterapia: ${ingredients.length} ingredientes cargados`);
    return ingredients.length;
  } catch (err) {
    logger.error('Error loading fitoterapia:', err);
    throw new Error(`Failed to load fitoterapia: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

async function loadHomeopatia(): Promise<number> {
  try {
    const data = await import('./data/homeopatia.json');
    if (!data.default?.ingredientes || !Array.isArray(data.default.ingredientes)) {
      logger.error('Homeopatia: datos inválidos o estructura incorrecta');
      return 0;
    }
    const ingredients = data.default.ingredientes.map(transformIngredient);
    await db.ingredients.bulkPut(ingredients);
    logger.log(`Homeopatia: ${ingredients.length} ingredientes cargados`);
    return ingredients.length;
  } catch (err) {
    logger.error('Error loading homeopatia:', err);
    throw new Error(`Failed to load homeopatia: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

async function loadAceites(): Promise<number> {
  try {
    const data = await import('./data/aceites.json');
    if (!data.default?.ingredientes || !Array.isArray(data.default.ingredientes)) {
      logger.error('Aceites: datos inválidos o estructura incorrecta');
      return 0;
    }
    const ingredients = data.default.ingredientes.map(transformIngredient);
    await db.ingredients.bulkPut(ingredients);
    logger.log(`Aceites esenciales: ${ingredients.length} ingredientes cargados`);
    return ingredients.length;
  } catch (err) {
    logger.error('Error loading aceites:', err);
    throw new Error(`Failed to load aceites: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

async function loadVitaminas(): Promise<number> {
  try {
    const data = await import('./data/vitaminas_minerales.json');
    if (!data.default?.ingredientes || !Array.isArray(data.default.ingredientes)) {
      logger.error('Vitaminas: datos inválidos o estructura incorrecta');
      return 0;
    }
    const ingredients = data.default.ingredientes.map(transformIngredient);
    await db.ingredients.bulkPut(ingredients);
    logger.log(`Vitaminas y minerales: ${ingredients.length} ingredientes cargados`);
    return ingredients.length;
  } catch (err) {
    logger.error('Error loading vitaminas:', err);
    throw new Error(`Failed to load vitaminas: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

async function loadSinergias(): Promise<number> {
  try {
    const data = await import('./data/sinergias.json');
    if (!data.default?.sinergias || !Array.isArray(data.default.sinergias)) {
      logger.error('Sinergias: datos inválidos o estructura incorrecta');
      return 0;
    }
    const synergies = data.default.sinergias.map(transformSynergy);
    await db.synergies.bulkPut(synergies);
    logger.log(`Sinergias: ${synergies.length} sinergias cargadas`);
    return synergies.length;
  } catch (err) {
    logger.error('Error loading sinergias:', err);
    throw new Error(`Failed to load sinergias: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export async function seedKnowledgeBase(): Promise<{
  ingredients: number;
  synergies: number;
}> {
  logger.log('Seeding knowledge base...');
  const [fito, homeo, aceites, vitaminas, sinergias] = await Promise.all([
    loadFitoterapia(),
    loadHomeopatia(),
    loadAceites(),
    loadVitaminas(),
    loadSinergias(),
  ]);
  const totalIngredients = fito + homeo + aceites + vitaminas;
  logger.log(`KB seeded: ${totalIngredients} ingredients, ${sinergias} synergies`);
  return { ingredients: totalIngredients, synergies: sinergias };
}

export async function isKnowledgeBaseSeeded(): Promise<boolean> {
  const count = await db.ingredients.count();
  return count > 0;
}

export async function getKnowledgeStats() {
  const ingredients = await db.ingredients.count();
  const synergies = await db.synergies.count();
  const categories = await db.ingredients.orderBy('categoria').uniqueKeys();
  return {
    totalIngredients: ingredients,
    totalSynergies: synergies,
    categories: categories.length,
  };
}
