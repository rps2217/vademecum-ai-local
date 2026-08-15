/**
 * ProductReplicator — baja el catálogo de productos comerciales y el bridge
 * producto↔ingrediente desde Supabase a IndexedDB (Dexie).
 *
 * Los productos viven solo en Supabase (no hay seeder local). Este replicador
 * los descarga una vez (y tras cambios) para que ProductSearchService pueda
 * indexarlos offline, como el resto de la app.
 *
 * Diseño:
 *  - No compite con SyncService (que sincroniza ingredients/synergies con
 *    detección de conflictos Lamport). Los productos son read-mostly desde
 *    el catálogo scraped, así que se replican con upsert simple por SKU.
 *  - Pagina los 1297 productos en lotes de 500 para no saturar PostgREST.
 *  - Marca el último sync en syncMeta('productReplicatedAt') para re-sincronizar
 *    solo los cambios (updated_at > lastSync) en llamadas posteriores.
 */

import { db } from '@/db';
import type { DbProduct, DbProductIngredient, DbProductIngredientAnalysis } from '@/db/schema';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { getDeviceId } from '@/db/schema';

const SYNC_META_KEY = 'productReplicatedAt';
const PAGE_SIZE = 500;

/** Marca en syncMeta para no reintentar la replicación tras fallos de red.
 *  Un host Supabase inalcanzable (DNS / config errónea) haría que cada arranque
 *  repitiera 3×N fetches fallidos; este flag corta el ciclo. Se resetea solo si
 *  la URL cambia (distinto proyecto) o si el usuario fuerza re-sync. */
const DISABLED_KEY = 'productReplicationDisabled';
const DISABLED_URL_KEY = 'productReplicationDisabledUrl';

export interface ReplicationResult {
  products: number;
  bridge: number;
  analysis: number;
  skipped: boolean;
  reason?: string;
}

/**
 * ¿La replicación está desactivada para el proyecto Supabase actual?
 * Compara la URL guardada con la URL configurada: si cambiaron, se resetea.
 */
async function isReplicationDisabled(): Promise<boolean> {
  const disabled = await db.syncMeta.get(DISABLED_KEY);
  if (!disabled?.value) return false;
  const disabledUrl = (await db.syncMeta.get(DISABLED_URL_KEY))?.value as string | undefined;
  const currentUrl = getSupabaseUrlSafe();
  // Si cambió la URL (p. ej. corregida en Vercel), rehabilitar automáticamente.
  if (disabledUrl && currentUrl && disabledUrl !== currentUrl) return false;
  return true;
}

async function markReplicationDisabled(): Promise<void> {
  const url = getSupabaseUrlSafe() ?? 'unknown';
  await db.syncMeta.bulkPut([
    { key: DISABLED_KEY, value: true, updatedAt: Date.now() },
    { key: DISABLED_URL_KEY, value: url, updatedAt: Date.now() },
  ]);
  logger.warn(`[ProductReplicator] Replicación desactivada por fallo de red (URL: ${url}). Se reintentará si la URL cambia.`);
}

async function clearReplicationDisabled(): Promise<void> {
  await db.syncMeta.delete(DISABLED_KEY);
  await db.syncMeta.delete(DISABLED_URL_KEY);
}

function getSupabaseUrlSafe(): string | null {
  try {
    return import.meta.env.VITE_SUPABASE_URL || null;
  } catch {
    return null;
  }
}

/** Detecta errores de red: fetch rechazado antes de llegar al servidor
 *  (DNS failure, host inalcanzable, CORS de red, etc.). El cliente Supabase
 *  los envuelve como TypeError: Failed to fetch. */
function isNetworkError(error: unknown): boolean {
  if (!error) return false;
  const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network request failed') ||
    msg.includes('load failed');
}

/**
 * Replica (o re-replica) los productos y el bridge desde Supabase.
 *
 * Primera llamada: descarga todo. Llamadas posteriores: solo los cambios
 * desde `productReplicatedAt` (updated_at > lastSync). Si no hay Supabase
 * configurado, las tablas no existen, o hay fallos de red consecutivos,
 * devuelve skipped=true (la app sigue funcionando sin productos).
 */
export async function replicateProducts(): Promise<ReplicationResult> {
  if (!isSupabaseConfigured()) {
    return { products: 0, bridge: 0, analysis: 0, skipped: true, reason: 'Supabase no configurado' };
  }
  const supabase = getSupabase();
  if (!supabase) {
    return { products: 0, bridge: 0, analysis: 0, skipped: true, reason: 'Cliente Supabase no disponible' };
  }
  // Fail-fast: si ya marcamos la replicación como desactivada por fallos de red
  // para esta URL, no reintentar (evita spam de errores en cada arranque).
  if (await isReplicationDisabled()) {
    return { products: 0, bridge: 0, analysis: 0, skipped: true, reason: 'Replicación desactivada por fallos de red previos' };
  }

  const lastSyncMeta = await db.syncMeta.get(SYNC_META_KEY);
  const lastSync = lastSyncMeta?.value as string | undefined;
  const since = lastSync ?? '1970-01-01T00:00:00Z';

  let productCount = 0;
  let bridgeCount = 0;
  let analysisCount = 0;

  // --- Productos (paginado) ---
  try {
    let offset = 0;
    while (true) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('tombstone', 0)
        // gte (no gt): la mayoría de los productos seeded tienen updated_at
        // = '1970-01-01T00:00:00Z' (epoch). Con .gt() se excluyen porque no
        // son estrictamente mayores; con .gte() se incluyen. El upsert es
        // idempotente, así que re-descargar filas sin cambios no daña.
        .gte('updated_at', since)
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) {
        // Si la tabla no existe, no es un error fatal: la app funciona sin productos.
        if (isMissingTableError(error)) {
          logger.warn('[ProductReplicator] Tabla "products" no existe en Supabase. Saltando replicación de productos.');
          return { products: 0, bridge: 0, analysis: 0, skipped: true, reason: 'Tabla products no existe' };
        }
        if (error.code === '401' || (error.message || '').toLowerCase().includes('api key')) {
          logger.error('[ProductReplicator] Autenticación rechazada (401). Verifica VITE_SUPABASE_ANON_KEY en .env.local.');
          return { products: 0, bridge: 0, analysis: 0, skipped: true, reason: 'Autenticación rechazada (401) — verifica VITE_SUPABASE_ANON_KEY' };
        }
        logger.error('[ProductReplicator] Error descargando productos:', error);
        break;
      }
      if (!data || data.length === 0) break;

      const rows: DbProduct[] = data.map((r: Record<string, unknown>) => mapRemoteProduct(r));
      await db.products.bulkPut(rows);
      productCount += rows.length;

      if (data.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }
  } catch (err) {
    if (isNetworkError(err)) {
      await markReplicationDisabled();
      return { products: 0, bridge: 0, analysis: 0, skipped: true, reason: 'Fallo de red (host Supabase inalcanzable)' };
    }
    logger.error('[ProductReplicator] Excepción descargando productos:', err);
  }

  // --- Bridge product_ingredients (paginado) ---
  try {
    let offset = 0;
    while (true) {
      const { data, error } = await supabase
        .from('product_ingredients')
        .select('*')
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) {
        if (isMissingTableError(error)) {
          logger.warn('[ProductReplicator] Tabla "product_ingredients" no existe. Bridge omitido.');
          break;
        }
        logger.error('[ProductReplicator] Error descargando bridge:', error);
        break;
      }
      if (!data || data.length === 0) break;

      const rows: DbProductIngredient[] = data.map((r: Record<string, unknown>) => mapRemoteBridge(r));
      await db.productIngredients.bulkPut(rows);
      bridgeCount += rows.length;

      if (data.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }
  } catch (err) {
    if (isNetworkError(err)) {
      await markReplicationDisabled();
      return { products: productCount, bridge: 0, analysis: 0, skipped: true, reason: 'Fallo de red (host Supabase inalcanzable)' };
    }
    logger.error('[ProductReplicator] Excepción descargando bridge:', err);
  }

  // --- Análisis de cobertura (paginado) ---
  try {
    let offset = 0;
    while (true) {
      const { data, error } = await supabase
        .from('product_ingredient_analysis')
        .select('*')
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) {
        if (isMissingTableError(error)) {
          logger.warn('[ProductReplicator] Tabla "product_ingredient_analysis" no existe. Análisis omitido.');
          break;
        }
        logger.error('[ProductReplicator] Error descargando análisis:', error);
        break;
      }
      if (!data || data.length === 0) break;

      const rows: DbProductIngredientAnalysis[] = data.map((r: Record<string, unknown>) => mapRemoteAnalysis(r));
      await db.productIngredientAnalysis.bulkPut(rows);
      analysisCount += rows.length;

      if (data.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }
  } catch (err) {
    if (isNetworkError(err)) {
      await markReplicationDisabled();
      return { products: productCount, bridge: bridgeCount, analysis: 0, skipped: true, reason: 'Fallo de red (host Supabase inalcanzable)' };
    }
    logger.error('[ProductReplicator] Excepción descargando análisis:', err);
  }

  const nowIso = new Date().toISOString();
  await db.syncMeta.put({ key: SYNC_META_KEY, value: nowIso, updatedAt: Date.now() });
  // Éxito: limpiar flag de desactivado (por si re-sincroniza manualmente tras arreglar la URL).
  await clearReplicationDisabled();

  logger.log(`[ProductReplicator] Replicados ${productCount} productos, ${bridgeCount} bridge, ${analysisCount} análisis.`);
  return { products: productCount, bridge: bridgeCount, analysis: analysisCount, skipped: false };
}

/** ¿Ya se replicaron los productos alguna vez? (para decidir primera carga). */
export async function isProductCatalogReplicated(): Promise<boolean> {
  const meta = await db.syncMeta.get(SYNC_META_KEY);
  return !!meta?.value;
}

/** Mapea una fila remota (snake_case) de products → DbProduct (camelCase). */
function mapRemoteProduct(r: Record<string, unknown>): DbProduct {
  return {
    sku: r.sku as string,
    nombreComercial: (r.nombre_comercial as string) ?? '',
    fabricante: (r.fabricante as string) ?? undefined,
    principiosActivos: (r.principios_activos as string[]) ?? [],
    categoria: (r.categoria as string) ?? undefined,
    indicaciones: (r.indicaciones as string[]) ?? [],
    contraindicaciones: (r.contraindicaciones as string[]) ?? [],
    embarazo: (r.embarazo as DbProduct['embarazo']) ?? 'desconocido',
    lactancia: (r.lactancia as DbProduct['lactancia']) ?? 'desconocido',
    pediatria: (r.pediatria as DbProduct['pediatria']) ?? 'desconocido',
    hipertension: (r.hipertension as DbProduct['hipertension']) ?? 'desconocido',
    diabetes: (r.diabetes as DbProduct['diabetes']) ?? 'desconocido',
    celiacos: (r.celiacos as DbProduct['celiacos']) ?? 'desconocido',
    posologia: (r.posologia as string) ?? undefined,
    source: (r.source as DbProduct['source']) ?? 'supabase',
    sourceUrl: (r.source_url as string) ?? undefined,
    embedding: r.embedding as number[] | undefined,
    data: (r.data as Record<string, unknown>) ?? {},
    lamport: (r.lamport as number) ?? 0,
    deviceId: (r.device_id as string) ?? getDeviceId(),
    updatedAt: new Date((r.updated_at as string) ?? '1970-01-01T00:00:00Z').getTime(),
    createdAt: new Date((r.created_at as string) ?? '1970-01-01T00:00:00Z').getTime(),
    tombstone: (r.tombstone as 0 | 1) ?? 0,
  };
}

/** Mapea una fila remota de product_ingredients → DbProductIngredient.
 *  Genera la PK compuesta id = productoSku + '|' + principioText. */
function mapRemoteBridge(r: Record<string, unknown>): DbProductIngredient {
  const productoSku = r.producto_sku as string;
  const principioText = (r.principio_text as string) ?? '';
  return {
    id: `${productoSku}|${principioText}`,
    productoSku,
    principioText,
    ingredientId: (r.ingredient_id as string | null) ?? null,
    matchType: (r.match_type as string) ?? 'unknown',
    matchScore: (r.match_score as number) ?? 0,
    matchedVia: (r.matched_via as string) ?? 'unknown',
    isMatched: (r.is_matched as boolean) ?? false,
  };
}

function mapRemoteAnalysis(r: Record<string, unknown>): DbProductIngredientAnalysis {
  return {
    productoSku: r.producto_sku as string,
    ingredientesIds: (r.ingredientes_ids as string[]) ?? [],
    ingredientesCount: (r.ingredientes_count as number) ?? 0,
    sinMatchCount: (r.sin_match_count as number) ?? 0,
    coberturaKb: (r.cobertura_kb as number) ?? 0,
    categoriaPredominante: (r.categoria_predominante as string) ?? null,
    analisisExplicacion: (r.analisis_explicacion as string) ?? '',
    updatedAt: new Date((r.updated_at as string) ?? '1970-01-01T00:00:00Z').getTime(),
  };
}

function isMissingTableError(error: { code?: string; message?: string }): boolean {
  if (!error) return false;
  const code = error.code?.toUpperCase();
  const msg = (error.message || '').toLowerCase();
  return code === 'PGRST205' ||
    code === '42P01' ||
    msg.includes('could not find the table') ||
    (msg.includes('relation') && msg.includes('does not exist')) ||
    msg.includes('schema cache miss');
}

export const productReplicator = { replicateProducts, isProductCatalogReplicated };
