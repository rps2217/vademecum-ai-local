/**
 * Migración única: normaliza los nombres comerciales de TODOS los productos
 * en Supabase (la fuente de verdad del catálogo).
 *
 * Una vez ejecutado, los dispositivos reciben nombres ya normalizados en cada
 * replicación → no necesitan normalizar en el cliente (menos CPU, sin riesgo
 * de inconsistencias entre dispositivos si la lógica cambia).
 *
 * Uso:
 *   SUPABASE_URL=https://tu-proyecto.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=sb_secret_... \
 *   npx tsx scripts/migrate-normalize-products.ts
 *
 * Flags opcionales:
 *   --dry-run   Muestra los cambios que haría sin escribir en Supabase.
 *   --limit=N   Procesa solo los primeros N productos (para pruebas).
 *
 * Seguridad:
 *   La service role key bypassa RLS → NO commitear la key ni exportarla en
 *   variables del shell que se logueen. Este script no imprime la key.
 *
 * Idempotente: ejecutarlo de nuevo no rompe nada (un nombre ya normalizado
 * no cambia, por lo que no se actualiza ni se incrementa su lamport).
 */

import { createClient } from '@supabase/supabase-js';
import { normalizeProductName } from '../src/core/catalog/normalizeProductName';

// --- Configuración desde entorno ------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT_ARG = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = LIMIT_ARG ? Number.parseInt(LIMIT_ARG.split('=')[1], 10) : undefined;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Faltan credenciales. Define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.');
  console.error('   Ejemplo: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=sb_secret_... npx tsx scripts/migrate-normalize-products.ts');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  global: { headers: { 'x-client-info': 'vademecum-migrate' } },
});

interface RemoteProduct {
  sku: string;
  nombre_comercial: string;
  lamport: number;
}

interface UpdatePayload {
  sku: string;
  nombre_comercial: string;
  lamport: number;
  device_id: string;
  updated_at: string;
}

async function main(): Promise<void> {
  const mode = DRY_RUN ? '[DRY-RUN]' : '[APLICAR]';
  console.log(`${mode} Migración de normalización de nombres de productos`);
  console.log(`   Supabase: ${SUPABASE_URL}`);
  if (LIMIT) console.log(`   Límite: ${LIMIT} productos`);
  console.log('');

  // 1. Descargar todos los productos (paginado: Supabase limita a 1000 por query)
  const PAGE_SIZE = 1000;
  const products: RemoteProduct[] = [];
  let offset = 0;

  while (true) {
    let pageQuery = supabase
      .from('products')
      .select('sku, nombre_comercial, lamport')
      .eq('tombstone', 0)
      .order('sku')
      .range(offset, offset + PAGE_SIZE - 1);
    if (LIMIT && offset + PAGE_SIZE > LIMIT) {
      pageQuery = pageQuery.limit(LIMIT - offset);
    }

    const { data: page, error: fetchErr } = await pageQuery;
    if (fetchErr) {
      console.error('❌ Error al descargar productos:', fetchErr.message);
      process.exit(1);
    }
    if (!page || page.length === 0) break;
    products.push(...(page as RemoteProduct[]));
    if (page.length < PAGE_SIZE) break; // última página
    if (LIMIT && products.length >= LIMIT) break;
    offset += PAGE_SIZE;
  }

  if (products.length === 0) {
    console.log('No hay productos para procesar.');
    return;
  }

  console.log(`📥 ${products.length} productos descargados. Calculando cambios…`);

  // 2. Calcular qué productos cambiaron (idempotente: los ya normalizados se saltan)
  const toUpdate: UpdatePayload[] = [];
  const now = new Date().toISOString();
  let changedCount = 0;
  const sampleChanges: { sku: string; antes: string; despues: string }[] = [];

  for (const p of products as RemoteProduct[]) {
    const original = p.nombre_comercial ?? '';
    const normalized = normalizeProductName(original);
    if (normalized !== original) {
      changedCount++;
      toUpdate.push({
        sku: p.sku,
        nombre_comercial: normalized,
        lamport: (p.lamport ?? 0) + 1, // incrementar para que se replique a dispositivos
        device_id: 'migration-normalize', // NOT NULL en Supabase; marca el origen del cambio
        updated_at: now,
      });
      if (sampleChanges.length < 8) {
        sampleChanges.push({ sku: p.sku, antes: original, despues: normalized });
      }
    }
  }

  console.log(`   ${changedCount} productos con cambios detectados.`);
  console.log(`   ${products.length - changedCount} ya estaban normalizados (sin cambios).`);
  console.log('');

  if (sampleChanges.length > 0) {
    console.log('Muestra de cambios:');
    for (const s of sampleChanges) {
      console.log(`   • [${s.sku}] "${s.antes}" → "${s.despues}"`);
    }
    console.log('');
  }

  if (changedCount === 0) {
    console.log('✅ No hay cambios que aplicar. Todos los nombres ya están normalizados.');
    return;
  }

  if (DRY_RUN) {
    console.log(`[DRY-RUN] Se habrían actualizado ${changedCount} productos. No se escribieron cambios.`);
    return;
  }

  // 3. Aplicar updates en lotes (PostgREST limita el body size)
  const BATCH = 200;
  let done = 0;
  for (let i = 0; i < toUpdate.length; i += BATCH) {
    const batch = toUpdate.slice(i, i + BATCH);
    const { error: updateErr } = await supabase
      .from('products')
      .upsert(batch, { onConflict: 'sku' });

    if (updateErr) {
      console.error(`❌ Error al actualizar lote ${i / BATCH + 1}:`, updateErr.message);
      process.exit(1);
    }
    done += batch.length;
    process.stdout.write(`\r   Actualizados ${done}/${changedCount}…`);
  }
  console.log('');
  console.log(`✅ Migración completada: ${changedCount} productos normalizados en Supabase.`);
  console.log('   Los dispositivos recibirán los nombres limpios en el próximo sync (lamport incrementado).');
}

main().catch((err) => {
  console.error('❌ Error inesperado:', err);
  process.exit(1);
});
