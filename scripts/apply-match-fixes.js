#!/usr/bin/env node
/**
 * Aplica correcciones a los matches producto ↔ ingrediente en Supabase.
 *
 * Lee el JSON de correcciones generado por audit-product-ingredient-matches.js
 * (--fix) y actualiza las filas en product_ingredients.
 *
 * Además, re-referencia los product_ingredients que apuntaban a los IDs
 * eliminados en la consolidación de duplicados (diente_de_leon→diente_leon, etc.)
 * al ID canónico correspondiente.
 *
 * Uso:
 *   SUPABASE_URL=https://tu-proyecto.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=sb_secret_... \
 *   node scripts/apply-match-fixes.js
 *
 * Flags:
 *   --rebase   Solo re-referencia los IDs consolidados (no aplica fixes de auditoría).
 *   --dry-run  Muestra los cambios sin escribir en Supabase.
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const REBASE_ONLY = process.argv.includes('--rebase');
const DRY_RUN = process.argv.includes('--dry-run');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Faltan credenciales. Define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

// Mapeo de IDs eliminados → canónicos (de la consolidación de duplicados)
const CONSOLIDACION = {
  'diente_de_leon': 'diente_leon',
  'olivo_hoja': 'olivo',
  'cola_de_caballo': 'cola_caballo',
  'vara_de_oro': 'solidago',
  'marrubium': 'marrubio',
  'picrorhiza': 'picrorrhiza',
  'guggul': 'guggulu',
  'damiana_hoja': 'damiana',
  'ylang_ylang': 'ilang_ilang',
  'clavo_aceite': 'clavo',
  'l_triptofano': 'triptofano',
  'pqq_pyrroloquinoline': 'pqq',
  'nmn_nicotinamide': 'nmn',
  'lactobacillus_acidophilus': 'l_acidophilus',
  'bifidobacterium_longum': 'b_longum',
  'lúpulo': 'lupulo',
};

async function supabaseUpdate(table, filters, updates) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    params.set(k, `eq.${v}`);
  }
  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase ${res.status}: ${body}`);
  }
  return res.json();
}

async function supabaseSelect(table, columns, filters) {
  const params = new URLSearchParams();
  params.set('select', columns);
  for (const [k, v] of Object.entries(filters)) {
    params.set(k, `eq.${v}`);
  }
  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase ${res.status}: ${body}`);
  }
  return res.json();
}

async function rebaseConsolidatedIds() {
  console.log('🔄 Re-referenciando IDs consolidados en product_ingredients...\n');

  let totalUpdated = 0;
  for (const [oldId, newId] of Object.entries(CONSOLIDACION)) {
    // Buscar filas que apuntan al ID antiguo
    const rows = await supabaseSelect(
      'product_ingredients',
      'producto_sku,principio_text,ingredient_id,matched_via',
      { ingredient_id: oldId }
    );

    if (rows.length === 0) {
      console.log(`  ${oldId} → ${newId}: 0 filas (nada que actualizar)`);
      continue;
    }

    console.log(`  ${oldId} → ${newId}: ${rows.length} filas a actualizar`);

    if (DRY_RUN) {
      for (const r of rows) {
        console.log(`    [DRY] ${r.producto_sku} | "${r.principio_text}" | ${r.ingredient_id} → ${newId}`);
      }
      totalUpdated += rows.length;
      continue;
    }

    // Actualizar todas las filas que apuntan al ID antiguo
    const result = await supabaseUpdate(
      'product_ingredients',
      { ingredient_id: oldId },
      { ingredient_id: newId }
    );
    totalUpdated += result.length;
    console.log(`    ✅ ${result.length} filas actualizadas`);
  }

  console.log(`\nTotal filas re-referenciadas: ${totalUpdated}`);
}

async function applyAuditFixes() {
  const fixesPath = path.join(__dirname, 'output', 'audit-matches-fixes.json');
  if (!fs.existsSync(fixesPath)) {
    console.log('⚠  No se encontró audit-matches-fixes.json.');
    console.log('   Ejecuta primero: node scripts/audit-product-ingredient-matches.js --fix');
    return;
  }

  const fixes = JSON.parse(fs.readFileSync(fixesPath, 'utf-8'));
  console.log(`🔧 Aplicando ${fixes.length} correcciones de auditoría...\n`);

  let applied = 0;
  let errors = 0;

  for (const fix of fixes) {
    if (DRY_RUN) {
      console.log(`  [DRY] ${fix.producto_sku} | "${fix.principio_text}" | ${fix.ingredient_id_old || 'NULL'} → ${fix.ingredient_id_new}`);
      applied++;
      continue;
    }

    try {
      // La PK es (producto_sku, principio_text, matched_via)
      await supabaseUpdate(
        'product_ingredients',
        {
          producto_sku: fix.producto_sku,
          principio_text: fix.principio_text,
          matched_via: fix.matched_via,
        },
        {
          ingredient_id: fix.ingredient_id_new,
          match_type: fix.match_type_new,
          match_score: fix.match_score_new,
          is_matched: fix.is_matched_new,
        }
      );
      applied++;
    } catch (err) {
      errors++;
      if (errors <= 5) {
        console.error(`  ❌ Error en ${fix.producto_sku} | "${fix.principio_text}": ${err.message}`);
      }
    }
  }

  console.log(`\nCorrecciones aplicadas: ${applied}`);
  console.log(`Errores: ${errors}`);
}

async function main() {
  console.log('═'.repeat(60));
  console.log('  APLICACIÓN DE CORRECCIONES — Matches Supabase');
  console.log('═'.repeat(60));
  if (DRY_RUN) console.log('  ⚠  MODO DRY-RUN (no escribe en Supabase)\n');

  // Siempre re-referenciar los IDs consolidados
  await rebaseConsolidatedIds();

  // Aplicar fixes de auditoría si no es --rebase
  if (!REBASE_ONLY) {
    console.log('');
    await applyAuditFixes();
  }

  console.log('\n✅ Listo!');
}

main().catch((err) => { console.error('Error fatal:', err); process.exit(1); });
