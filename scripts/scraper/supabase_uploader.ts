/**
 * Fase 5: Upload de productos a Supabase.
 *
 * Lee knop_matched_data.json y hace upsert de:
 *   1. Tabla `products` — datos del producto (nombre, principios, safety, etc.)
 *   2. Tabla `product_ingredients` — bridge principioText → ingredientId
 *   3. Tabla `product_ingredient_analysis` — cobertura KB agregada por producto
 *
 * Usa la service role key (bypassa RLS para escritura).
 *
 * Uso:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=sb_secret_... \
 *   npx ts-node --transpile-only scripts/scraper/supabase_uploader.ts
 *
 * Flags:
 *   --dry-run   Muestra lo que subiría sin escribir.
 */
import fs from 'fs';
import { SUPABASE_URL, SUPABASE_KEY, FILES } from './config';
import type { MatchedProduct } from './kb_matcher';

const DRY_RUN = process.argv.includes('--dry-run');

// ─── Supabase REST helpers ────────────────────────────────────────────────────

async function upsertProducts(products: MatchedProduct[]): Promise<number> {
  // Upsert en lotes de 50 (límite de PostgREST para body size)
  const BATCH = 50;
  let upserted = 0;

  for (let i = 0; i < products.length; i += BATCH) {
    const batch = products.slice(i, i + BATCH);
    const rows = batch.map((p) => ({
      sku: p.sku,
      nombre_comercial: p.nombre_comercial,
      fabricante: p.fabricante,
      principios_activos: p.principios_activos,
      categoria: p.categoria,
      indicaciones: p.indicaciones,
      contraindicaciones: p.contraindicaciones,
      embarazo: p.embarazo,
      lactancia: p.lactancia,
      pediatria: p.pediatria,
      hipertension: p.hipertension,
      diabetes: p.diabetes,
      celiacos: p.celiacos,
      posologia: p.posologia,
      source: p.source,
      source_url: p.source_url,
      data: p.data,
      lamport: p.lamport,
      updated_at: new Date().toISOString(),
      tombstone: 0,
    }));

    if (DRY_RUN) {
      upserted += rows.length;
      console.log(`  [DRY] Lote ${i / BATCH + 1}: ${rows.length} productos`);
      continue;
    }

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/products?on_conflict=sku`,
      {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify(rows),
      },
    );
    if (!res.ok) {
      const text = await res.text();
      console.error(`  ❌ Error upsert products lote ${i / BATCH + 1}: ${res.status} ${text.substring(0, 200)}`);
      continue;
    }
    upserted += rows.length;
    console.log(`  ✅ Lote ${i / BATCH + 1}: ${rows.length} productos (${upserted}/${products.length})`);
  }
  return upserted;
}

async function upsertProductIngredients(products: MatchedProduct[]): Promise<number> {
  // Construir todas las filas del bridge
  const rows = products.flatMap((p) =>
    p.matches.map((m) => ({
      producto_sku: p.sku,
      principio_text: m.principioText,
      ingredient_id: m.ingredientId,
      match_type: m.matchType,
      match_score: m.matchScore,
      matched_via: m.matchedVia,
      is_matched: m.isMatched,
    })),
  );

  if (rows.length === 0) {
    console.log('  ⚠️  No hay filas de product_ingredients para subir.');
    return 0;
  }

  // Primero eliminar las filas existentes de estos SKUs (para evitar duplicados)
  const skus = [...new Set(products.map((p) => p.sku))];
  const BATCH_DELETE = 50;
  for (let i = 0; i < skus.length; i += BATCH_DELETE) {
    const batch = skus.slice(i, i + BATCH_DELETE);
    const filter = batch.map((s) => `"${s}"`).join(',');
    if (DRY_RUN) continue;

    await fetch(`${SUPABASE_URL}/rest/v1/product_ingredients?producto_sku=in.(${filter})`, {
      method: 'DELETE',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
  }

  // Insertar en lotes
  const BATCH = 100;
  let upserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);

    if (DRY_RUN) {
      upserted += batch.length;
      continue;
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/product_ingredients`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(batch),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`  ❌ Error upsert bridge lote ${i / BATCH + 1}: ${res.status} ${text.substring(0, 200)}`);
      continue;
    }
    upserted += batch.length;
    if ((i / BATCH + 1) % 5 === 0)
      console.log(`  ✅ Bridge: ${upserted}/${rows.length} filas`);
  }
  if (DRY_RUN) console.log(`  [DRY] ${upserted} filas de bridge`);
  return upserted;
}

async function upsertAnalysis(products: MatchedProduct[]): Promise<number> {
  const rows = products.map((p) => {
    const ingredientesIds = p.matches.filter((m) => m.isMatched).map((m) => m.ingredientId!);
    const sinMatchCount = p.matches.filter((m) => m.matchType === 'none').length;
    const total = p.matches.length;
    const cobertura = total > 0 ? Math.round((ingredientesIds.length / total) * 100) : 0;
    const cats = ingredientesIds
      .map((id) => KB_CATEGORY_CACHE[id] || 'otros')
      .filter((c) => c !== 'otros');
    const categoriaPredominante = cats.length > 0
      ? cats.sort((a, b) =>
          cats.filter((v) => v === a).length - cats.filter((v) => v === b).length,
        )[0]
      : 'otros';

    return {
      producto_sku: p.sku,
      ingredientes_ids: ingredientesIds,
      ingredientes_count: ingredientesIds.length,
      sin_match_count: sinMatchCount,
      cobertura_kb: cobertura,
      categoria_predominante: categoriaPredominante,
      analisis_explicacion: `${ingredientesIds.length}/${total} principios activos matcheados a la KB (${cobertura}% cobertura). ${sinMatchCount} sin match (gaps).`,
    };
  });

  if (DRY_RUN) {
    console.log(`  [DRY] ${rows.length} filas de análisis`);
    return rows.length;
  }

  const BATCH = 50;
  let upserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/product_ingredient_analysis?on_conflict=producto_sku`,
      {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify(batch),
      },
    );
    if (!res.ok) {
      const text = await res.text();
      console.error(`  ❌ Error upsert análisis lote ${i / BATCH + 1}: ${res.status} ${text.substring(0, 200)}`);
      continue;
    }
    upserted += batch.length;
  }
  return upserted;
}

// Cache de categorías de ingredientes (cargado una vez)
const KB_CATEGORY_CACHE: Record<string, string> = {};
function loadKbCategories() {
  const kbDir = 'src/db/seeders/data';
  const files = ['fitoterapia.json', 'homeopatia.json', 'aceites.json', 'vitaminas_minerales.json'];
  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(`${kbDir}/${file}`, 'utf-8'));
      for (const ing of data.ingredientes) {
        KB_CATEGORY_CACHE[ing.id] = ing.categoria || 'otros';
      }
    } catch {
      /* ignore */
    }
  }
}

// ─── Orquestador ─────────────────────────────────────────────────────────────

export async function runUploader() {
  console.log('📤 Iniciando Upload a Supabase...');
  console.log(`📂 Entrada: ${FILES.MATCHED}`);
  console.log(`🌐 Supabase: ${SUPABASE_URL ? 'configurado' : '❌ NO CONFIGURADO'}`);
  if (DRY_RUN) console.log('  ⚠️  MODO DRY-RUN (no escribe)');
  console.log('─'.repeat(50));

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.');
    console.error('   Define las variables de entorno antes de ejecutar.');
    process.exit(1);
  }

  if (!fs.existsSync(FILES.MATCHED)) {
    console.error(`❌ No se encontró ${FILES.MATCHED}. Ejecuta el matcher primero.`);
    return;
  }

  const products: MatchedProduct[] = JSON.parse(
    fs.readFileSync(FILES.MATCHED, 'utf-8'),
  );
  console.log(`📊 ${products.length} productos a subir\n`);

  loadKbCategories();

  // 1. Products
  console.log('📦 Subiendo products...');
  const productsCount = await upsertProducts(products);
  console.log(`   ✅ ${productsCount} productos\n`);

  // 2. Product_ingredients (bridge)
  console.log('🔗 Subiendo product_ingredients...');
  const bridgeCount = await upsertProductIngredients(products);
  console.log(`   ✅ ${bridgeCount} filas bridge\n`);

  // 3. Product_ingredient_analysis
  console.log('📊 Subiendo product_ingredient_analysis...');
  const analysisCount = await upsertAnalysis(products);
  console.log(`   ✅ ${analysisCount} filas análisis\n`);

  console.log('🎉 UPLOAD FINALIZADO.');
  console.log(`📊 Resumen: ${productsCount} productos, ${bridgeCount} bridge, ${analysisCount} análisis`);
}

if (require.main === module) {
  runUploader().catch((err) => {
    console.error('Error fatal:', err);
    process.exit(1);
  });
}
