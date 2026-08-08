/**
 * Knowledge Base Seeder
 * Carga los datos de la KB en la base de datos Dexie.
 */
import { logger } from '@/lib/logger';
import { BODY_SYSTEMS } from '@/types/shared-enums';

import { db } from '../schema';
import type { 
  DbIngredient, 
  DbSynergy,
  DbPathology,
  IngredientCategory, 
  BodySystem, 
  EvidenceLevel,
  SynergyType,
  SynergyLevel
} from '../schema';
import { getDeviceId, now } from '../schema';

// ============================================
// VERSIÓN DE LA KB (para re-siembra automática)
// ============================================
//
// Se calcula dinámicamente desde los datos JSON. Cuando se añaden,
// eliminan o modifican entradas, el total cambia y la versión cambia,
// forzando una re-siembra automática en el próximo arranque de la app.
// Esto es crítico para despliegues en Vercel: los usuarios existentes
// reciben los nuevos datos sin necesidad de borrar IndexedDB.
//
// Formato: "v{fito}-{homeo}-{aceites}-{vitaminas}-{sinergias}-{patologias}"

const KB_VERSION_KEY = 'kb_seed_version';

async function computeKbVersion(): Promise<string> {
  const [fito, homeo, aceites, vitaminas, sinergias, patologias] = await Promise.all([
    import('./data/fitoterapia.json'),
    import('./data/homeopatia.json'),
    import('./data/aceites.json'),
    import('./data/vitaminas_minerales.json'),
    import('./data/sinergias.json'),
    import('./data/patologias.json'),
  ]);
  const counts = [
    fito.default?.ingredientes?.length ?? 0,
    homeo.default?.ingredientes?.length ?? 0,
    aceites.default?.ingredientes?.length ?? 0,
    vitaminas.default?.ingredientes?.length ?? 0,
    sinergias.default?.sinergias?.length ?? 0,
    patologias.default?.patologias?.length ?? 0,
  ];
  return `v${counts.join('-')}`;
}

export async function getStoredKbVersion(): Promise<string | null> {
  const meta = await db.syncMeta.get(KB_VERSION_KEY);
  return (meta?.value as string) ?? null;
}

export async function getCurrentKbVersion(): Promise<string> {
  return computeKbVersion();
}

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

interface JsonPathology {
  id: string;
  nombre: string;
  definicion: string;
  causas: string[];
  sintomas: string[];
  sistemas?: string[];
  tratamientoAlopatico: {
    primeraLinea: string[];
    mecanismo: string;
    efectosSecundarios: string[];
  };
  tratamientoNatural: {
    fitoterapia: string[];
    suplementos: string[];
    homeopatia: string[];
    aceites: string[];
    cuandoPreferir: string;
  };
  prevencion: string[];
  cuandoConsultar: string;
  evidencia?: string;
  fuentes?: string[];
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
  const validSystems = BODY_SYSTEMS as readonly string[];
  if (!sistemas) return [];
  return sistemas
    .map(s => s.toLowerCase().trim())
    .filter(s => validSystems.includes(s)) as BodySystem[];
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

function transformPathology(json: JsonPathology): DbPathology {
  return {
    id: json.id,
    nombre: json.nombre,
    definicion: json.definicion,
    causas: json.causas || [],
    sintomas: json.sintomas || [],
    sistemas: mapSystems(json.sistemas),
    tratamientoAlopatico: {
      primeraLinea: json.tratamientoAlopatico?.primeraLinea || [],
      mecanismo: json.tratamientoAlopatico?.mecanismo || '',
      efectosSecundarios: json.tratamientoAlopatico?.efectosSecundarios || [],
    },
    tratamientoNatural: {
      fitoterapia: json.tratamientoNatural?.fitoterapia || [],
      suplementos: json.tratamientoNatural?.suplementos || [],
      homeopatia: json.tratamientoNatural?.homeopatia || [],
      aceites: json.tratamientoNatural?.aceites || [],
      cuandoPreferir: json.tratamientoNatural?.cuandoPreferir || '',
    },
    prevencion: json.prevencion || [],
    cuandoConsultar: json.cuandoConsultar || '',
    evidencia: mapEvidenceLevel(json.evidencia),
    fuentes: json.fuentes || [],
    lamport: 0,
    deviceId: getDeviceId(),
    updatedAt: now(),
    createdAt: now(),
    tombstone: 0,
  };
}

async function loadPatologias(): Promise<string[]> {
  try {
    const data = await import('./data/patologias.json');
    if (!data.default?.patologias || !Array.isArray(data.default.patologias)) {
      logger.error('Patologias: datos inválidos o estructura incorrecta');
      return [];
    }
    const pathologies = data.default.patologias.map(transformPathology);
    await db.pathologies.bulkPut(pathologies);
    logger.log(`Patologias: ${pathologies.length} patologias cargadas`);
    return pathologies.map(p => p.id);
  } catch (err) {
    logger.error('Error loading patologias:', err);
    throw new Error(`Failed to load patologias: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

async function loadFitoterapia(): Promise<string[]> {
  try {
    const data = await import('./data/fitoterapia.json');
    if (!data.default?.ingredientes || !Array.isArray(data.default.ingredientes)) {
      logger.error('Fitoterapia: datos inválidos o estructura incorrecta');
      return [];
    }
    const ingredients = data.default.ingredientes.map(transformIngredient);
    await db.ingredients.bulkPut(ingredients);
    logger.log(`Fitoterapia: ${ingredients.length} ingredientes cargados`);
    return ingredients.map(i => i.id);
  } catch (err) {
    logger.error('Error loading fitoterapia:', err);
    throw new Error(`Failed to load fitoterapia: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

async function loadHomeopatia(): Promise<string[]> {
  try {
    const data = await import('./data/homeopatia.json');
    if (!data.default?.ingredientes || !Array.isArray(data.default.ingredientes)) {
      logger.error('Homeopatia: datos inválidos o estructura incorrecta');
      return [];
    }
    const ingredients = data.default.ingredientes.map(transformIngredient);
    await db.ingredients.bulkPut(ingredients);
    logger.log(`Homeopatia: ${ingredients.length} ingredientes cargados`);
    return ingredients.map(i => i.id);
  } catch (err) {
    logger.error('Error loading homeopatia:', err);
    throw new Error(`Failed to load homeopatia: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

async function loadAceites(): Promise<string[]> {
  try {
    const data = await import('./data/aceites.json');
    if (!data.default?.ingredientes || !Array.isArray(data.default.ingredientes)) {
      logger.error('Aceites: datos inválidos o estructura incorrecta');
      return [];
    }
    const ingredients = data.default.ingredientes.map(transformIngredient);
    await db.ingredients.bulkPut(ingredients);
    logger.log(`Aceites esenciales: ${ingredients.length} ingredientes cargados`);
    return ingredients.map(i => i.id);
  } catch (err) {
    logger.error('Error loading aceites:', err);
    throw new Error(`Failed to load aceites: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

async function loadVitaminas(): Promise<string[]> {
  try {
    const data = await import('./data/vitaminas_minerales.json');
    if (!data.default?.ingredientes || !Array.isArray(data.default.ingredientes)) {
      logger.error('Vitaminas: datos inválidos o estructura incorrecta');
      return [];
    }
    const ingredients = data.default.ingredientes.map(transformIngredient);
    await db.ingredients.bulkPut(ingredients);
    logger.log(`Vitaminas y minerales: ${ingredients.length} ingredientes cargados`);
    return ingredients.map(i => i.id);
  } catch (err) {
    logger.error('Error loading vitaminas:', err);
    throw new Error(`Failed to load vitaminas: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

async function loadSinergias(): Promise<string[]> {
  try {
    const data = await import('./data/sinergias.json');
    if (!data.default?.sinergias || !Array.isArray(data.default.sinergias)) {
      logger.error('Sinergias: datos inválidos o estructura incorrecta');
      return [];
    }
    const synergies = data.default.sinergias.map(transformSynergy);
    await db.synergies.bulkPut(synergies);
    logger.log(`Sinergias: ${synergies.length} sinergias cargadas`);
    return synergies.map(s => s.id);
  } catch (err) {
    logger.error('Error loading sinergias:', err);
    throw new Error(`Failed to load sinergias: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

// Limpia registros sembrados obsoletos: elimina de la DB los registros cuyo ID
// estaba en una siembra anterior pero ya no está en la siembra actual.
// Preserva los registros creados por el usuario (cuyos IDs no estaban en
// ninguna siembra previa).
const KB_SEED_IDS_KEY = 'kb_seed_ids';

async function getStoredSeedIds(): Promise<{ ingredients: string[]; synergies: string[]; pathologies: string[] }> {
  const meta = await db.syncMeta.get(KB_SEED_IDS_KEY);
  const value = meta?.value as { ingredients: string[]; synergies: string[]; pathologies?: string[] } | undefined;
  return {
    ingredients: value?.ingredients ?? [],
    synergies: value?.synergies ?? [],
    pathologies: value?.pathologies ?? [],
  };
}

async function cleanupStaleSeedRecords(
  currentIngredientIds: string[],
  currentSynergyIds: string[],
  currentPathologyIds: string[],
): Promise<void> {
  const stored = await getStoredSeedIds();

  // IDs que estaban sembrados antes pero ya no están en el JSON actual
  const staleIngredientIds = stored.ingredients.filter(id => !currentIngredientIds.includes(id));
  const staleSynergyIds = stored.synergies.filter(id => !currentSynergyIds.includes(id));
  const stalePathologyIds = (stored.pathologies || []).filter(id => !currentPathologyIds.includes(id));

  if (staleIngredientIds.length > 0) {
    await db.ingredients.bulkDelete(staleIngredientIds);
    logger.log(`Cleaned up ${staleIngredientIds.length} stale seed ingredients`);
  }
  if (staleSynergyIds.length > 0) {
    await db.synergies.bulkDelete(staleSynergyIds);
    logger.log(`Cleaned up ${staleSynergyIds.length} stale seed synergies`);
  }
  if (stalePathologyIds.length > 0) {
    await db.pathologies.bulkDelete(stalePathologyIds);
    logger.log(`Cleaned up ${stalePathologyIds.length} stale seed pathologies`);
  }

  // Guardar la lista actual de IDs sembrados para la próxima limpieza
  await db.syncMeta.put({
    key: KB_SEED_IDS_KEY,
    value: { ingredients: currentIngredientIds, synergies: currentSynergyIds, pathologies: currentPathologyIds },
    updatedAt: now(),
  });
}

export async function seedKnowledgeBase(): Promise<{
  ingredients: number;
  synergies: number;
  pathologies: number;
}> {
  logger.log('Seeding knowledge base...');
  const [fitoIds, homeoIds, aceitesIds, vitaminasIds, synergyIds, pathologyIds] = await Promise.all([
    loadFitoterapia(),
    loadHomeopatia(),
    loadAceites(),
    loadVitaminas(),
    loadSinergias(),
    loadPatologias(),
  ]);
  const ingredientIds = [...fitoIds, ...homeoIds, ...aceitesIds, ...vitaminasIds];
  const totalIngredients = ingredientIds.length;
  const totalSynergies = synergyIds.length;
  const totalPathologies = pathologyIds.length;
  logger.log(`KB seeded: ${totalIngredients} ingredients, ${totalSynergies} synergies, ${totalPathologies} pathologies`);

  // Eliminar registros sembrados que ya no están en el JSON actual
  await cleanupStaleSeedRecords(ingredientIds, synergyIds, pathologyIds);

  // Guardar la versión de la KB para detectar futuras actualizaciones
  const version = await computeKbVersion();
  await db.syncMeta.put({
    key: KB_VERSION_KEY,
    value: version,
    updatedAt: now(),
  });
  logger.log(`KB version stored: ${version}`);

  return { ingredients: totalIngredients, synergies: totalSynergies, pathologies: totalPathologies };
}

export async function isKnowledgeBaseSeeded(): Promise<boolean> {
  const count = await db.ingredients.count();
  if (count === 0) return false;

  // Comparar versión almacenada con la versión actual de los JSON.
  // Si no coinciden, la KB está desactualizada y debe re-sembrarse.
  const stored = await getStoredKbVersion();
  const current = await computeKbVersion();
  if (stored !== current) {
    logger.log(`KB version mismatch (stored: ${stored}, current: ${current}), re-seeding needed`);
    return false;
  }
  return true;
}

export async function getKnowledgeStats() {
  const ingredients = await db.ingredients.count();
  const synergies = await db.synergies.count();
  const pathologies = await db.pathologies.count();
  const categories = await db.ingredients.orderBy('categoria').uniqueKeys();
  return {
    totalIngredients: ingredients,
    totalSynergies: synergies,
    totalPathologies: pathologies,
    categories: categories.length,
  };
}
