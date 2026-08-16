#!/usr/bin/env node
/**
 * Auditoría de matches producto ↔ ingrediente de la KB.
 *
 * Descarga todos los `product_ingredients` de Supabase (vía REST API con fetch,
 * sin dependencias) y verifica que cada match (principioText → ingredientId)
 * sea correcto.
 *
 * Uso:
 *   SUPABASE_URL=https://tu-proyecto.supabase.co \
 *   SUPABASE_ANON_KEY=sb_publishable_... \
 *   node scripts/audit-product-ingredient-matches.js
 *
 * Flags:
 *   --verbose    Muestra cada match auditado.
 *   --fix        Genera JSON con correcciones para aplicar.
 *   --limit=N    Procesa solo los primeros N productos.
 */

const fs = require('fs');
const path = require('path');

// --- Configuración desde entorno ------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const VERBOSE = process.argv.includes('--verbose');
const FIX = process.argv.includes('--fix');
const LIMIT_ARG = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split('=')[1], 10) : undefined;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Faltan credenciales. Define SUPABASE_URL y SUPABASE_ANON_KEY.');
  process.exit(1);
}

const OUTPUT_DIR = path.join(__dirname, 'output');

// --- Supabase REST helper --------------------------------------------------
async function supabaseSelect(table, columns, offset, pageSize) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(columns)}&order=producto_sku&limit=${pageSize}&offset=${offset}`;
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

// --- Cargar KB local + diccionario de categorización ----------------------

function loadCategorization() {
  const catPath = path.join(__dirname, '..', 'src', 'data', 'principio-categorization.json');
  const cat = JSON.parse(fs.readFileSync(catPath, 'utf-8'));
  const blacklist = new Set([
    ...cat.excipientes.items,
    ...cat.tags.items,
    ...cat.cosmetico_quimico.items,
  ]);
  return { blacklist, sinonimos: cat.sinonimos_quimicos.mapping };
}

function loadKbIngredients() {
  const kbDir = path.join(__dirname, '..', 'src', 'db', 'seeders', 'data');
  const files = ['fitoterapia.json', 'homeopatia.json', 'aceites.json', 'vitaminas_minerales.json'];
  const map = new Map();

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(kbDir, file), 'utf-8'));
    for (const ing of data.ingredientes) {
      map.set(ing.id, { id: ing.id, nombre: ing.nombre, sinonimos: ing.sinonimos || [], categoria: ing.categoria || '' });
    }
  }
  return map;
}

// --- Normalización y matching ----------------------------------------------
function normalize(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const STOPWORDS = new Set([
  'de', 'la', 'el', 'los', 'las', 'del', 'al', 'en', 'y', 'o', 'con', 'para',
  'por', 'a', 'e', 'i', 'u', 'que', 'se', 'su', 'es', 'un', 'una', 'unos',
  'unas', 'the', 'of', 'and', 'for', 'with', 'in', 'on', 'at', 'to',
]);

function tokenize(text) {
  return normalize(text).split(/\s+/).filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

function similarityScore(principioText, ing) {
  const normP = normalize(principioText);
  const normN = normalize(ing.nombre);
  const normId = normalize(ing.id);

  if (normP === normN || normP === normId) return 100;

  for (const sin of ing.sinonimos) {
    if (normP === normalize(sin)) return 95;
  }

  if (normN.includes(normP) && normP.length >= 4) return 85;
  if (normP.includes(normN) && normN.length >= 4) return 85;

  const tokensP = new Set(tokenize(principioText));
  const tokensI = new Set(tokenize(ing.nombre + ' ' + ing.sinonimos.join(' ')));
  if (tokensP.size > 0 && tokensI.size > 0) {
    let intersection = 0;
    for (const t of tokensP) { if (tokensI.has(t)) intersection++; }
    const union = tokensP.size + tokensI.size - intersection;
    const jaccard = intersection / union;
    if (jaccard > 0) return Math.round(jaccard * 80);
  }

  const prefix = normP.slice(0, 5);
  if (prefix.length >= 5 && (normN.startsWith(prefix) || normId.startsWith(prefix))) return 60;

  return 0;
}

function findBestMatch(principioText, kb) {
  let best = null;
  for (const [id, ing] of kb) {
    const score = similarityScore(principioText, ing);
    if (score > 0 && (!best || score > best.score)) {
      best = { ingredientId: id, score, nombre: ing.nombre };
    }
  }
  if (best && best.score > 50) return best;
  return null;
}

// --- Helpers de categorización (desde principio-categorization.json) -------

function normalizeForMatch(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isBlacklisted(text, blacklist) {
  const t = text.toLowerCase().trim();
  if (blacklist.has(t)) return true;
  const normalized = normalizeForMatch(text);
  for (const item of blacklist) {
    if (normalizeForMatch(item) === normalized) return true;
  }
  return false;
}

function findSynonymMatch(text, sinonimos) {
  const norm = normalizeForMatch(text);
  for (const [key, id] of Object.entries(sinonimos)) {
    if (normalizeForMatch(key) === norm) return id;
  }
  return null;
}

// --- Auditoría principal ---------------------------------------------------
async function main() {
  console.log('📥 Cargando KB local...');
  const kb = loadKbIngredients();
  console.log(`   ${kb.size} ingredientes en la KB`);
  const { blacklist, sinonimos } = loadCategorization();
  console.log(`   ${blacklist.size} excipientes/tags/químicos en blacklist`);
  console.log(`   ${Object.keys(sinonimos).length} sinónimos químicos mapeados\n`);

  console.log('📥 Descargando product_ingredients desde Supabase...');
  let allRows = [];
  let offset = 0;
  const PAGE_SIZE = 1000;

  while (true) {
    const data = await supabaseSelect('product_ingredients', 'producto_sku,ingredient_id,principio_text,match_type,match_score,matched_via,is_matched', offset, PAGE_SIZE);
    if (!data || data.length === 0) break;
    allRows.push(...data);
    offset += PAGE_SIZE;
    if (data.length < PAGE_SIZE) break;
    if (LIMIT && allRows.length >= LIMIT) { allRows = allRows.slice(0, LIMIT); break; }
    process.stdout.write(`\r   ${allRows.length} filas descargadas...`);
  }
  console.log(`\n   ${allRows.length} filas de product_ingredients descargadas\n`);

  const principioCache = new Map();
  const issues = [];
  const fixes = [];
  const stats = { total: allRows.length, matched: 0, unmatched: 0, correctos: 0, falsosPositivos: 0, gapsCubribles: 0, gapsReales: 0, matchesMejorables: 0, excipienteTag: 0, sinonimoResuelto: 0 };

  for (const row of allRows) {
    if (row.is_matched && row.ingredient_id) stats.matched++;
    else stats.unmatched++;

    // 1) ¿Es excipiente/tag/químico cosmético? → no debe matchear
    if (isBlacklisted(row.principio_text, blacklist)) {
      stats.excipienteTag++;
      if (row.is_matched && row.ingredient_id) {
        stats.falsosPositivos++;
        issues.push({
          tipo: 'falso_positivo',
          categoria: 'excipiente_tag',
          productoSku: row.producto_sku,
          principioText: row.principio_text,
          ingredientIdActual: row.ingredient_id,
          ingredientIdSugerido: null,
          nombreSugerido: null,
          scoreActual: row.match_score || 0, scoreSugerido: 0,
          explicacion: `"${row.principio_text}" es excipiente/tag/químico cosmético (en blacklist) pero está matcheado a "${kb.get(row.ingredient_id)?.nombre || row.ingredient_id}". Debería ser is_matched=false.`,
        });
        if (FIX) {
          fixes.push({ producto_sku: row.producto_sku, principio_text: row.principio_text, matched_via: row.matched_via, ingredient_id_old: row.ingredient_id, ingredient_id_new: null, match_type_new: 'none', match_score_new: 0, is_matched_new: false });
        }
      } else {
        stats.correctos++;
      }
      continue;
    }

    // 2) ¿Tiene sinónimo químico mapeado? → usar ese ID directo
    const synId = findSynonymMatch(row.principio_text, sinonimos);
    if (synId) {
      const synIng = kb.get(synId);
      stats.sinonimoResuelto++;
      if (row.is_matched && row.ingredient_id === synId) {
        stats.correctos++;
      } else if (row.is_matched && row.ingredient_id !== synId) {
        stats.falsosPositivos++;
        issues.push({
          tipo: 'falso_positivo',
          categoria: 'sinonimo_mal_matcheado',
          productoSku: row.producto_sku,
          principioText: row.principio_text,
          ingredientIdActual: row.ingredient_id,
          ingredientIdSugerido: synId,
          nombreSugerido: synIng?.nombre || synId,
          scoreActual: row.match_score || 0, scoreSugerido: 100,
          explicacion: `"${row.principio_text}" es sinónimo químico de "${synIng?.nombre || synId}" (${synId}) pero está matcheado a "${kb.get(row.ingredient_id)?.nombre || row.ingredient_id}".`,
        });
        if (FIX) {
          fixes.push({ producto_sku: row.producto_sku, principio_text: row.principio_text, matched_via: row.matched_via, ingredient_id_old: row.ingredient_id, ingredient_id_new: synId, match_type_new: 'synonym', match_score_new: 100, is_matched_new: true });
        }
      } else {
        stats.gapsCubribles++;
        issues.push({ tipo: 'gap_cubrible', categoria: 'sinonimo_no_matcheado', productoSku: row.producto_sku, principioText: row.principio_text, ingredientIdActual: null, ingredientIdSugerido: synId, nombreSugerido: synIng?.nombre || synId, scoreActual: 0, scoreSugerido: 100, explicacion: `"${row.principio_text}" sin match, pero es sinónimo de "${synIng?.nombre || synId}" (${synId})` });
        if (FIX) { fixes.push({ producto_sku: row.producto_sku, principio_text: row.principio_text, matched_via: row.matched_via, ingredient_id_old: null, ingredient_id_new: synId, match_type_new: 'synonym', match_score_new: 100, is_matched_new: true }); }
      }
      continue;
    }

    // 3) Búsqueda normal por similitud de texto
    if (!principioCache.has(row.principio_text)) {
      principioCache.set(row.principio_text, findBestMatch(row.principio_text, kb));
    }
    const sugerido = principioCache.get(row.principio_text);
    const scoreActual = row.match_score || 0;
    const ingActual = row.ingredient_id ? kb.get(row.ingredient_id) : null;

    if (VERBOSE) {
      console.log(`  [${row.producto_sku}] "${row.principio_text}" -> actual: ${row.ingredient_id || 'NULL'} (${scoreActual}) | sugerido: ${sugerido?.ingredientId || 'NULL'} (${sugerido?.score || 0})`);
    }

    if (row.is_matched && row.ingredient_id && ingActual) {
      const scoreRecomputed = similarityScore(row.principio_text, ingActual);

      if (scoreRecomputed < 50) {
        stats.falsosPositivos++;
        issues.push({
          tipo: 'falso_positivo',
          categoria: 'similitud_baja',
          productoSku: row.producto_sku,
          principioText: row.principio_text,
          ingredientIdActual: row.ingredient_id,
          ingredientIdSugerido: sugerido?.ingredientId || null,
          nombreSugerido: sugerido?.nombre || null,
          scoreActual, scoreSugerido: sugerido?.score || 0,
          explicacion: sugerido
            ? `"${row.principio_text}" -> "${ingActual.nombre}" (${row.ingredient_id}) score ${scoreRecomputed}, pero mejor match: "${sugerido.nombre}" (${sugerido.ingredientId}) score ${sugerido.score}`
            : `"${row.principio_text}" -> "${ingActual.nombre}" (${row.ingredient_id}) score ${scoreRecomputed}, sin mejor match en KB`,
        });
        if (FIX && sugerido) {
          fixes.push({ producto_sku: row.producto_sku, principio_text: row.principio_text, matched_via: row.matched_via, ingredient_id_old: row.ingredient_id, ingredient_id_new: sugerido.ingredientId, match_type_new: sugerido.score >= 95 ? 'exact' : sugerido.score >= 80 ? 'synonym' : 'fuzzy', match_score_new: sugerido.score, is_matched_new: true });
        }
      } else if (sugerido && sugerido.ingredientId !== row.ingredient_id && sugerido.score > scoreRecomputed + 10) {
        stats.matchesMejorables++;
        issues.push({ tipo: 'match_mejorable', productoSku: row.producto_sku, principioText: row.principio_text, ingredientIdActual: row.ingredient_id, ingredientIdSugerido: sugerido.ingredientId, nombreSugerido: sugerido.nombre, scoreActual, scoreSugerido: sugerido.score, explicacion: `"${row.principio_text}" -> "${ingActual.nombre}" (score ${scoreRecomputed}), pero "${sugerido.nombre}" tiene score mayor (${sugerido.score})` });
        if (FIX) { fixes.push({ producto_sku: row.producto_sku, principio_text: row.principio_text, matched_via: row.matched_via, ingredient_id_old: row.ingredient_id, ingredient_id_new: sugerido.ingredientId, match_type_new: sugerido.score >= 95 ? 'exact' : sugerido.score >= 80 ? 'synonym' : 'fuzzy', match_score_new: sugerido.score, is_matched_new: true }); }
      } else {
        stats.correctos++;
      }
    } else if (!row.is_matched || !row.ingredient_id) {
      if (sugerido) {
        stats.gapsCubribles++;
        issues.push({ tipo: 'gap_cubrible', productoSku: row.producto_sku, principioText: row.principio_text, ingredientIdActual: null, ingredientIdSugerido: sugerido.ingredientId, nombreSugerido: sugerido.nombre, scoreActual: 0, scoreSugerido: sugerido.score, explicacion: `"${row.principio_text}" sin match, pero existe en KB: "${sugerido.nombre}" (${sugerido.ingredientId}) score ${sugerido.score}` });
        if (FIX) { fixes.push({ producto_sku: row.producto_sku, principio_text: row.principio_text, matched_via: row.matched_via, ingredient_id_old: null, ingredient_id_new: sugerido.ingredientId, match_type_new: sugerido.score >= 95 ? 'exact' : sugerido.score >= 80 ? 'synonym' : 'fuzzy', match_score_new: sugerido.score, is_matched_new: true }); }
      } else {
        stats.gapsReales++;
        if (row.principio_text.length >= 3 && !/^\d/.test(row.principio_text)) {
          issues.push({ tipo: 'gap_real', productoSku: row.producto_sku, principioText: row.principio_text, ingredientIdActual: null, ingredientIdSugerido: null, nombreSugerido: null, scoreActual: 0, scoreSugerido: 0, explicacion: `"${row.principio_text}" sin match y no está en KB. Posible ingrediente a añadir.` });
        }
      }
    }
  }

  // --- Reporte -------------------------------------------------------------
  console.log('═'.repeat(70));
  console.log('  REPORTE DE AUDITORÍA — Matches producto ↔ KB');
  console.log('═'.repeat(70));
  console.log(`  Total filas auditadas:     ${stats.total}`);
  console.log(`  Matches existentes:        ${stats.matched}`);
  console.log(`  Sin match (gaps):          ${stats.unmatched}`);
  console.log('─'.repeat(70));
  console.log(`  ✅ Matches correctos:      ${stats.correctos}`);
  console.log(`  ❌ Falsos positivos:       ${stats.falsosPositivos}`);
  console.log(`  ⚠  Gaps cubribles:         ${stats.gapsCubribles} (existen en KB pero no matcheados)`);
  console.log(`  🔍 Gaps reales:            ${stats.gapsReales} (no están en KB)`);
  console.log(`  🔄 Matches mejorables:     ${stats.matchesMejorables}`);
  console.log('─'.repeat(70));
  console.log(`  📋 Excipientes/tags (blacklist): ${stats.excipienteTag} (${stats.excipienteTag - (stats.falsosPositivos - (issues.filter(i => i.categoria === 'sinonimo_mal_matcheado').length))} correctamente no-matcheados)`);
  console.log(`  🧪 Sinónimos químicos resueltos: ${stats.sinonimoResuelto}`);
  console.log('═'.repeat(70));

  function printGroup(tipo, label, maxItems) {
    const filtered = issues.filter((i) => i.tipo === tipo);
    if (filtered.length === 0) return;
    const byPrincipio = new Map();
    for (const issue of filtered) {
      if (!byPrincipio.has(issue.principioText)) byPrincipio.set(issue.principioText, []);
      byPrincipio.get(issue.principioText).push(issue);
    }
    const sorted = [...byPrincipio.entries()].sort((a, b) => b[1].length - a[1].length);
    console.log(`\n${label}`);
    for (const [principio, items] of sorted.slice(0, maxItems)) {
      const i = items[0];
      if (tipo === 'gap_real') {
        console.log(`  "${principio}" (${items.length}x)`);
      } else {
        console.log(`  "${principio}" (${items.length}x) → actual: ${i.ingredientIdActual || 'NULL'} | sugerido: ${i.ingredientIdSugerido || 'NINGUNO'} (${i.nombreSugerido || ''}) [${i.scoreSugerido}]`);
      }
    }
  }

  printGroup('falso_positivo', '❌ FALSOS POSITIVOS (matches incorrectos):', 30);
  printGroup('gap_cubrible', '⚠  GAPS CUBRIBLES (existen en KB pero no matcheados):', 30);
  printGroup('gap_real', '🔍 GAPS REALES (no están en KB — candidatos a añadir):', 50);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const reportPath = path.join(OUTPUT_DIR, 'audit-matches-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({ stats, issues }, null, 2));
  console.log(`\n📄 Reporte completo: ${reportPath}`);

  if (FIX && fixes.length > 0) {
    const fixesPath = path.join(OUTPUT_DIR, 'audit-matches-fixes.json');
    fs.writeFileSync(fixesPath, JSON.stringify(fixes, null, 2));
    console.log(`🔧 Correcciones (${fixes.length}): ${fixesPath}`);
  }
  console.log('');
}

main().catch((err) => { console.error('Error fatal:', err); process.exit(1); });
