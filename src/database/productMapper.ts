import { Product } from '../core/types/product.types';
import ProductModel from './Product';

/**
 * Applies a Product DTO's fields onto a WatermelonDB ProductModel record.
 * This is the single source of truth for the Product → WatermelonDB mapping.
 * 
 * Used by DataService.saveProduct, DataService.importProducts, and any
 * future code that needs to write Product data to WatermelonDB.
 * 
 * @param record  The WatermelonDB ProductModel record to mutate (inside a writer callback)
 * @param product The Product DTO with the source data
 * @param options.includeSku  Set to true when creating a new record (SKU is immutable after creation)
 */
export function applyProductToRecord(
  record: ProductModel,
  product: Product,
  options: { includeSku?: boolean } = {}
): void {
  if (options.includeSku) {
    record.sku = product.sku;
  }

  // --- Identity ---
  record.nombreComercial = product.nombre_comercial;
  record.descripcion = product.descripcion;

  // --- Composition (JSON-serialized arrays/objects) ---
  record._principiosActivosJson = JSON.stringify(product.principios_activos || []);
  record._indicacionesJson = JSON.stringify(product.indicaciones || []);
  record._tagsIaJson = JSON.stringify(product.tags_ia || []);
  record._anotacionesComponentesJson = JSON.stringify(product.anotaciones_componentes || {});
  record._vectoresJson = JSON.stringify(product.vectores || []);
  record._skusRelacionadosJson = JSON.stringify(product.skus_relacionados || []);

  // --- Clinical text ---
  record.posologia = product.posologia || '';
  record.advertencias = product.advertencias || '';
  record.categoriaPrincipal = product.categoria_principal;
  record.analisisComponentes = product.analisis_componentes;
  record.sugerenciaComplementaria = product.sugerencia_complementaria;
  record.explicacionClinica = product.explicacion_clinica;

  // --- Safety profile ---
  record.aptoEmbarazo = product.apto_embarazo;
  record.aptoLactancia = product.apto_lactancia;
  record.aptoPediatria = product.apto_pediatria;
  record.aptoDiabeticos = product.apto_diabeticos;
  record.aptoHipertensos = product.apto_hipertensos;
  record.aptoCeliacos = product.apto_celiacos;

  // --- Synergy state ---
  record.synergyAnalyzed = product.synergy_analyzed;
  record.lastSynergyAnalysis = product.last_synergy_analysis;
  record.synergyRetries = product.synergy_retries;

  // --- Distributed lock ---
  record.lockedByAi = product.locked_by_ai;
  record.lockUid = product.lock_uid;
  record.lockTimestamp = product.lock_timestamp;

  // --- Metadata ---
  record.sourceUrl = product.source_url;
  record.lastUpdated = product.last_updated || Date.now();
  record.isVerified = product.is_verified;
  record.verifiedAt = product.verified_at;
  record.verifiedBy = product.verified_by;
  record.isSyncedCloud = product.is_synced_cloud;
  record.lastSyncedCloud = product.last_synced_cloud;
}
