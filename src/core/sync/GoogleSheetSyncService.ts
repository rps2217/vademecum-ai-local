/**
 * GoogleSheetSyncService - Servicio de replicación y sincronización ligera
 * con Google Sheets a través de Google Apps Script (Web App JSON).
 *
 * Ventajas sobre Supabase para catálogos:
 *  - Sin suspensiones por inactividad (Google Sheets nunca se "apaga").
 *  - 100% gratuito sin cuotas de base de datos activa.
 *  - Fácil de editar en una simple hoja de cálculo por farmacéuticos o gestores.
 *  - Compatible con caché HTTP local en IndexedDB y fallback offline total.
 */

import { db } from '@/db';
import type { DbProduct, DbProductIngredient } from '@/db/schema';
import { logger } from '@/lib/logger';
import { getDeviceId } from '@/db/schema';

const GAS_URL_KEY = 'gas_sync_webapp_url';
const GAS_LAST_SYNC_KEY = 'gas_last_synced_at';

export interface GasSyncResponse {
  version: string;
  updatedAt: string;
  counts: {
    products: number;
    ingredients?: number;
    synergies?: number;
  };
  products?: Array<{
    id?: string;
    sku: string;
    name: string;
    brand?: string;
    dosage_form?: string;
    price?: number;
    url?: string;
    tags?: string[];
    is_active?: boolean;
    ingredients_raw?: string[];
  }>;
  productIngredients?: Array<{
    product_sku: string;
    raw_name: string;
    ingredient_id?: string | null;
    is_active_substance?: boolean;
    confidence?: number;
  }>;
}

export interface GasSyncResult {
  success: boolean;
  message: string;
  productsSynced: number;
  bridgeSynced: number;
  timestamp: number;
}

export class GoogleSheetSyncService {
  /**
   * Obtiene la URL configurada del Web App de Google Apps Script
   */
  async getWebAppUrl(): Promise<string> {
    const meta = await db.syncMeta.get(GAS_URL_KEY);
    return (meta?.value as string) || (import.meta.env.VITE_GOOGLE_SHEETS_API_URL as string) || '';
  }

  /**
   * Guarda o actualiza la URL del script
   */
  async setWebAppUrl(url: string): Promise<void> {
    const trimmed = url.trim();
    await db.syncMeta.put({
      key: GAS_URL_KEY,
      value: trimmed,
      updatedAt: Date.now(),
    });
  }

  /**
   * Fecha de la última sincronización
   */
  async getLastSyncTime(): Promise<number | null> {
    const meta = await db.syncMeta.get(GAS_LAST_SYNC_KEY);
    return (meta?.value as number) || null;
  }

  /**
   * Prueba la conectividad con el Web App de Google Apps Script
   */
  async testConnection(targetUrl?: string): Promise<{ success: boolean; message: string; version?: string }> {
    const url = targetUrl || (await this.getWebAppUrl());
    if (!url) {
      return { success: false, message: 'No hay URL de Google Apps Script configurada.' };
    }

    try {
      // El script de Google devuelve un ping rápido al invocar ?action=ping
      const testUrl = new URL(url);
      testUrl.searchParams.set('action', 'ping');

      const response = await fetch(testUrl.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        return { success: false, message: `Error HTTP ${response.status}: ${response.statusText}` };
      }

      const data = await response.json();
      if (data && data.status === 'ok') {
        return {
          success: true,
          message: `Conexión exitosa. Versión de hoja: ${data.version || '1.0'}`,
          version: data.version,
        };
      }

      return { success: true, message: 'Respuesta recibida correctamente de Google Sheets.' };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Error al conectar con el Web App de Google.',
      };
    }
  }

  /**
   * Sincroniza el catálogo desde Google Sheets a IndexedDB
   */
  async syncCatalog(customUrl?: string): Promise<GasSyncResult> {
    const url = customUrl || (await this.getWebAppUrl());
    if (!url) {
      return {
        success: false,
        message: 'Configura la URL de tu Google Apps Script en Ajustes.',
        productsSynced: 0,
        bridgeSynced: 0,
        timestamp: Date.now(),
      };
    }

    const deviceId = getDeviceId();
    const now = Date.now();

    try {
      logger.info('Iniciando sincronización desde Google Sheets...');
      const fetchUrl = new URL(url);
      fetchUrl.searchParams.set('action', 'getCatalog');

      const response = await fetch(fetchUrl.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Error en Google Apps Script (${response.status}): ${response.statusText}`);
      }

      const payload: GasSyncResponse = await response.json();

      if (!payload || !payload.products) {
        throw new Error('Formato de respuesta inválido o sin productos en la hoja.');
      }

      let productsSynced = 0;
      let bridgeSynced = 0;

      // 1. Replicar productos a la tabla Dexie `products`
      const dbProducts: DbProduct[] = payload.products.map((p) => {
        const id = p.id || `gas_${p.sku}`;
        return {
          id,
          sku: p.sku,
          name: p.name,
          brand: p.brand || null,
          dosage_form: p.dosage_form || null,
          price: p.price ?? null,
          url: p.url || null,
          tags: Array.isArray(p.tags) ? p.tags : [],
          is_active: p.is_active !== false,
          ingredients_raw: Array.isArray(p.ingredients_raw) ? p.ingredients_raw : [],
          lamport: now,
          deviceId,
          updatedAt: now,
          tombstone: 0,
        };
      });

      if (dbProducts.length > 0) {
        await db.products.bulkPut(dbProducts);
        productsSynced = dbProducts.length;
      }

      // 2. Replicar bridge producto-ingrediente si viene incluido
      if (payload.productIngredients && payload.productIngredients.length > 0) {
        // Obtenemos mapa de sku -> id
        const skuToId = new Map<string, string>();
        dbProducts.forEach((p) => skuToId.set(p.sku, p.id));

        const bridgeRecords: DbProductIngredient[] = [];
        payload.productIngredients.forEach((pi, idx) => {
          const productId = skuToId.get(pi.product_sku);
          if (!productId) return;

          bridgeRecords.push({
            id: `gas_pi_${pi.product_sku}_${idx}`,
            product_id: productId,
            raw_name: pi.raw_name,
            ingredient_id: pi.ingredient_id || null,
            is_active_substance: pi.is_active_substance !== false,
            confidence: pi.confidence ?? 0.8,
            lamport: now,
            deviceId,
            updatedAt: now,
            tombstone: 0,
          });
        });

        if (bridgeRecords.length > 0) {
          await db.productIngredients.bulkPut(bridgeRecords);
          bridgeSynced = bridgeRecords.length;
        }
      }

      // Registrar timestamp de sincronización
      await db.syncMeta.put({
        key: GAS_LAST_SYNC_KEY,
        value: now,
        updatedAt: now,
      });

      return {
        success: true,
        message: `Sincronizados ${productsSynced} productos y ${bridgeSynced} relaciones de ingredientes.`,
        productsSynced,
        bridgeSynced,
        timestamp: now,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido de sincronización';
      logger.error('Fallo en sincronización con Google Sheets:', err);
      return {
        success: false,
        message: msg,
        productsSynced: 0,
        bridgeSynced: 0,
        timestamp: now,
      };
    }
  }
}

export const googleSheetSyncService = new GoogleSheetSyncService();
