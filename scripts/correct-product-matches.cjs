#!/usr/bin/env node
/**
 * Corrige los matches producto ↔ ingrediente en Supabase.
 *
 * El algoritmo de matching original era muy agresivo: matcheaba excipientes,
 * tags genéricos y químicos cosméticos a ingredientes aleatorios de la KB.
 * De 6841 matches, 4853 (71%) eran falsos positivos.
 *
 * Este script aplica correcciones en 3 fases:
 *
 * FASE 1 — Re-referenciar IDs consolidados:
 *   Los 15 IDs eliminados en la consolidación de duplicados se re-referencian
 *   al ID canónico (cola_de_caballo → cola_caballo, etc.).
 *
 * FASE 2 — Desmatchear excipientes/tags/químicos (blacklist):
 *   Excipientes farmacéuticos (agua, glicerina, gelatina, estearato de magnesio),
 *   tags genéricos (suplemento, natural, homeopático) y químicos cosméticos
 *   (colorantes, conservantes, emulsionantes) se desmatchean
 *   (is_matched=false, ingredient_id=null, match_type='none').
 *
 * FASE 3 — Corregir matches a ingredientes reales:
 *   Mapa manual de sinónimos químicos (ácido ascórbico → vitamina_c,
 *   cianocobalamina → vitamina_b12, etc.) y corrección de matches obvios
 *   (Vitamina D → vitamina_d3, no d_glucarato).
 *
 * Uso:
 *   SUPABASE_URL=https://tu-proyecto.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=sb_secret_... \
 *   node scripts/correct-product-matches.cjs
 *
 * Flags:
 *   --dry-run   Muestra los cambios sin escribir en Supabase.
 *   --phase=1   Solo ejecuta la fase indicada (1, 2, o 3).
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const DRY_RUN = process.argv.includes('--dry-run');
const PHASE_ARG = process.argv.find((a) => a.startsWith('--phase='));
const ONLY_PHASE = PHASE_ARG ? parseInt(PHASE_ARG.split('=')[1], 10) : null;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Faltan credenciales. Define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

// ═══════════════════════════════════════════════════════════════════════════
// FASE 1: Mapeo de IDs consolidados
// ═══════════════════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════════════════
// FASE 2 + 3: Diccionario maestro de categorización (src/data/principio-categorization.json)
// ═══════════════════════════════════════════════════════════════════════════

const CATEGORIZATION = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'principio-categorization.json'), 'utf-8')
);

const BLACKLIST = new Set([
  ...CATEGORIZATION.excipientes.items,
  ...CATEGORIZATION.tags.items,
  ...CATEGORIZATION.cosmetico_quimico.items,
]);

function isBlacklisted(text) {
  const t = text.toLowerCase().trim();
  // Match exacto
  if (BLACKLIST.has(t)) return true;
  // Normalizar para match (sin acentos, guiones→espacios)
  const normalized = t
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]/g, ' ');
  for (const item of BLACKLIST) {
    const itemNorm = item
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[_-]/g, ' ');
    if (normalized === itemNorm) return true;
  }
  return false;
}


const SINONIMOS_QUIMICOS = CATEGORIZATION.sinonimos_quimicos.mapping;


// ═══════════════════════════════════════════════════════════════════════════
// Supabase helpers
// ═══════════════════════════════════════════════════════════════════════════
async function supabaseSelectAll(table, columns) {
  let allRows = [];
  let offset = 0;
  const PAGE = 1000;
  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(columns)}&order=producto_sku&limit=${PAGE}&offset=${offset}`;
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!res.ok) throw new Error(`Select ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!data || data.length === 0) break;
    allRows.push(...data);
    offset += PAGE;
    if (data.length < PAGE) break;
    process.stdout.write(`\r   ${allRows.length} filas...`);
  }
  console.log('');
  return allRows;
}

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
  if (!res.ok) throw new Error(`Update ${res.status}: ${await res.text()}`);
  return res.json();
}

// ═══════════════════════════════════════════════════════════════════════════
// Normalización para matching de sinónimos
// ═══════════════════════════════════════════════════════════════════════════
function normalize(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findSynonymMatch(text) {
  const norm = normalize(text);
  for (const [key, id] of Object.entries(SINONIMOS_QUIMICOS)) {
    if (normalize(key) === norm) return id;
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// Ejecución
// ═══════════════════════════════════════════════════════════════════════════
async function main() {
  console.log('═'.repeat(60));
  console.log('  CORRECCIÓN DE MATCHES — Supabase product_ingredients');
  console.log('═'.repeat(60));
  if (DRY_RUN) console.log('  ⚠  MODO DRY-RUN (no escribe)\n');

  // Descargar todos los product_ingredients
  console.log('📥 Descargando product_ingredients...');
  const rows = await supabaseSelectAll(
    'product_ingredients',
    'producto_sku,ingredient_id,principio_text,match_type,match_score,matched_via,is_matched'
  );
  console.log(`   ${rows.length} filas descargadas\n`);

  const stats = {
    fase1_rebasados: 0,
    fase2_desmatheados: 0,
    fase3_corregidos: 0,
    fase3_ya_correctos: 0,
    sin_cambio: 0,
  };

  // Agrupar cambios por tipo para batch updates
  const updatesRebase = []; // fase 1
  const updatesBlacklist = []; // fase 2
  const updatesSynonym = []; // fase 3

  for (const row of rows) {
    const principio = row.principio_text;
    const currentId = row.ingredient_id;

    // FASE 1: Re-referenciar IDs consolidados
    if (currentId && currentId in CONSOLIDACION) {
      const newId = CONSOLIDACION[currentId];
      if (!ONLY_PHASE || ONLY_PHASE === 1) {
        updatesRebase.push({ row, newId, type: 'rebase' });
      }
      continue;
    }

    // FASE 2: Desmatchear excipientes/tags/químicos
    if (currentId && isBlacklisted(principio)) {
      if (!ONLY_PHASE || ONLY_PHASE === 2) {
        updatesBlacklist.push({ row, type: 'blacklist' });
      }
      continue;
    }

    // FASE 3: Corregir matches con sinónimos químicos
    if (currentId) {
      const correctId = findSynonymMatch(principio);
      if (correctId && correctId !== currentId) {
        if (!ONLY_PHASE || ONLY_PHASE === 3) {
          updatesSynonym.push({ row, newId: correctId, type: 'synonym' });
        }
        continue;
      }
      // Si ya está matcheado al ID correcto, no hacer nada
    }

    stats.sin_cambio++;
  }

  // --- Aplicar FASE 1 ---
  if (updatesRebase.length > 0 && (!ONLY_PHASE || ONLY_PHASE === 1)) {
    console.log(`\nFASE 1: Re-referenciar ${updatesRebase.length} IDs consolidados`);
    let applied = 0;
    for (const u of updatesRebase) {
      if (DRY_RUN) {
        if (applied < 10) console.log(`  [DRY] ${u.row.producto_sku} | "${u.row.principio_text}" | ${u.row.ingredient_id} → ${u.newId}`);
        applied++;
        continue;
      }
      try {
        await supabaseUpdate('product_ingredients', {
          producto_sku: u.row.producto_sku,
          principio_text: u.row.principio_text,
          matched_via: u.row.matched_via,
        }, { ingredient_id: u.newId });
        applied++;
      } catch (err) {
        if (applied < 5) console.error(`  ❌ ${u.row.producto_sku}: ${err.message}`);
      }
    }
    stats.fase1_rebasados = applied;
    console.log(`  ✅ ${applied} filas re-referenciadas`);
  }

  // --- Aplicar FASE 2 ---
  if (updatesBlacklist.length > 0 && (!ONLY_PHASE || ONLY_PHASE === 2)) {
    console.log(`\nFASE 2: Desmatchear ${updatesBlacklist.length} excipientes/tags/químicos`);
    let applied = 0;
    for (const u of updatesBlacklist) {
      if (DRY_RUN) {
        if (applied < 15) console.log(`  [DRY] ${u.row.producto_sku} | "${u.row.principio_text}" | ${u.row.ingredient_id} → NULL (blacklist)`);
        applied++;
        continue;
      }
      try {
        await supabaseUpdate('product_ingredients', {
          producto_sku: u.row.producto_sku,
          principio_text: u.row.principio_text,
          matched_via: u.row.matched_via,
        }, { ingredient_id: null, match_type: 'none', match_score: 0, is_matched: false });
        applied++;
      } catch (err) {
        if (applied < 5) console.error(`  ❌ ${u.row.producto_sku}: ${err.message}`);
      }
    }
    stats.fase2_desmatheados = applied;
    console.log(`  ✅ ${applied} filas desmatheadas (is_matched=false)`);
  }

  // --- Aplicar FASE 3 ---
  if (updatesSynonym.length > 0 && (!ONLY_PHASE || ONLY_PHASE === 3)) {
    console.log(`\nFASE 3: Corregir ${updatesSynonym.length} matches con sinónimos químicos`);
    let applied = 0;
    for (const u of updatesSynonym) {
      if (DRY_RUN) {
        if (applied < 20) console.log(`  [DRY] ${u.row.producto_sku} | "${u.row.principio_text}" | ${u.row.ingredient_id} → ${u.newId}`);
        applied++;
        continue;
      }
      try {
        await supabaseUpdate('product_ingredients', {
          producto_sku: u.row.producto_sku,
          principio_text: u.row.principio_text,
          matched_via: u.row.matched_via,
        }, { ingredient_id: u.newId, match_type: 'synonym', match_score: 95, is_matched: true });
        applied++;
      } catch (err) {
        if (applied < 5) console.error(`  ❌ ${u.row.producto_sku}: ${err.message}`);
      }
    }
    stats.fase3_corregidos = applied;
    console.log(`  ✅ ${applied} matches corregidos`);
  }

  // --- Resumen ---
  console.log('\n' + '═'.repeat(60));
  console.log('  RESUMEN');
  console.log('═'.repeat(60));
  console.log(`  FASE 1 — IDs consolidados re-referenciados: ${stats.fase1_rebasados}`);
  console.log(`  FASE 2 — Excipientes/tags desmatheados:     ${stats.fase2_desmatheados}`);
  console.log(`  FASE 3 — Matches corregidos (sinónimos):   ${stats.fase3_corregidos}`);
  console.log(`  Sin cambio necesario:                       ${stats.sin_cambio}`);
  console.log('═'.repeat(60));
}

main().catch((err) => { console.error('Error fatal:', err); process.exit(1); });
