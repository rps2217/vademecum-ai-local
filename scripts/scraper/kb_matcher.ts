/**
 * Fase 4: Matcher de principios activos → ingredientes de la KB.
 *
 * Por cada principio activo extraído por Ollama (ej: "Ácido ascórbico",
 * "Extracto de Valeriana", "Passiflora D3"), encuentra el ingrediente
 * correspondiente en la KB local (ej: vitamina_c, valeriana, passiflora).
 *
 * Estrategia de matching (en orden de prioridad):
 *   1. Sinónimos químicos exactos (diccionario: 512 entradas)
 *   2. Match exacto por ID / nombre / nombresAlternativos de la KB
 *   3. Resolución homeopática (D3, C6, T.M.) → extraer base y matchear
 *   4. Blacklist (excipientes/tags/cosméticos) → marcar como no-match
 *   5. Fuzzy Levenshtein (tolerancia a typos) → mejor match >80
 *
 * Salida: knop_matched_data.json (productos + bridge product_ingredients)
 *         knop_match_report.json (estadísticas de matching)
 *
 * Uso:  npx ts-node --transpile-only scripts/scraper/kb_matcher.ts
 */
import fs from 'fs';
import path from 'path';
import { FILES } from './config';
import type { ProcessedProduct } from './processor_ia';

// ─── Reutilizar el módulo homeopático existente ──────────────────────────────

// homeopathic-utils.cjs exporta CommonJS; lo cargamos dinámicamente.
const homeoUtils = require(path.join(
  __dirname,
  '..',
  'homeopathic-utils.cjs',
));
const { hasHomeopathicSuffix, extractHomeopathicBase, resolveHomeopathic, normalize } = homeoUtils;

// ─── Cargar diccionario de categorización ────────────────────────────────────

const CATEGORIZATION = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '..', '..', 'src', 'data', 'principio-categorization.json'),
    'utf-8',
  ),
);

const BLACKLIST = new Set([
  ...CATEGORIZATION.excipientes.items,
  ...CATEGORIZATION.tags.items,
  ...CATEGORIZATION.cosmetico_quimico.items,
]);

const SINONIMOS_QUIMICOS: Record<string, string> =
  CATEGORIZATION.sinonimos_quimicos.mapping;

// ─── Cargar KB local ─────────────────────────────────────────────────────────

interface KbIngredient {
  id: string;
  nombre: string;
  nombresAlternativos: string[];
  nombreCientifico?: string;
  categoria: string;
}

function loadKb(): Map<string, KbIngredient> {
  const kbDir = path.join(__dirname, '..', '..', 'src', 'db', 'seeders', 'data');
  const files = [
    'fitoterapia.json',
    'homeopatia.json',
    'aceites.json',
    'vitaminas_minerales.json',
  ];
  const map = new Map<string, KbIngredient>();
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(kbDir, file), 'utf-8'));
    for (const ing of data.ingredientes) {
      map.set(ing.id, {
        id: ing.id,
        nombre: ing.nombre,
        nombresAlternativos: ing.nombresAlternativos || [],
        nombreCientifico: ing.nombreCientifico || '',
        categoria: ing.categoria || '',
      });
    }
  }
  return map;
}

const KB = loadKb();

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface MatchResult {
  principioText: string;
  ingredientId: string | null;
  matchType: string; // exact | synonym | homeopathic | fuzzy | blacklist | none
  matchScore: number;
  matchedVia: string;
  isMatched: boolean;
}

export interface MatchedProduct extends ProcessedProduct {
  matches: MatchResult[];
  coberturaKb: number;
}

// ─── Helpers de matching ──────────────────────────────────────────────────────

function isBlacklisted(text: string): boolean {
  const t = text.toLowerCase().trim();
  if (BLACKLIST.has(t)) return true;
  const normalized = normalize(t);
  for (const item of BLACKLIST) {
    if (normalize(item) === normalized) return true;
  }
  return false;
}

function findSynonymMatch(text: string): string | null {
  const norm = normalize(text);
  for (const [key, id] of Object.entries(SINONIMOS_QUIMICOS)) {
    if (normalize(key) === norm) return id;
  }
  return null;
}

/** Match exacto por ID, nombre o nombres alternativos de la KB. */
function findExactMatch(text: string): { id: string; score: number; method: string } | null {
  const norm = normalize(text);
  if (!norm) return null;

  for (const [id, ing] of KB) {
    if (normalize(id) === norm)
      return { id, score: 100, method: 'exact_id' };
  }
  for (const [id, ing] of KB) {
    if (normalize(ing.nombre) === norm)
      return { id, score: 98, method: 'exact_nombre' };
  }
  for (const [id, ing] of KB) {
    for (const alt of ing.nombresAlternativos) {
      if (normalize(alt) === norm)
        return { id, score: 96, method: 'exact_alternativo' };
    }
  }
  if (norm.length >= 5) {
    for (const [id, ing] of KB) {
      if (normalize(ing.nombreCientifico || '') === norm)
        return { id, score: 95, method: 'exact_cientifico' };
    }
  }
  return null;
}

/** Distancia de Levenshtein para fuzzy matching. */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0),
  );
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[m][n];
}

/** Fuzzy match con Levenshtein (umbral adaptativo por longitud). */
function findFuzzyMatch(text: string): { id: string; score: number; method: string } | null {
  const norm = normalize(text);
  if (norm.length < 5) return null;

  const threshold = norm.length <= 6 ? 1 : 2;
  let best: { id: string; score: number; method: string } | null = null;

  for (const [id, ing] of KB) {
    const candidates = [ing.nombre, ...ing.nombresAlternativos];
    for (const candidate of candidates) {
      const normCand = normalize(candidate);
      if (!normCand || normCand.length < 3) continue;
      const dist = levenshtein(norm, normCand);
      if (dist <= threshold) {
        const score = Math.round(85 - (dist - 1) * 10);
        if (!best || score > best.score) {
          best = { id, score, method: 'fuzzy_levenshtein' };
        }
      }
    }
  }
  return best;
}

// ─── Matching de un principio activo ─────────────────────────────────────────

function matchPrincipio(principioText: string): MatchResult {
  const text = (principioText || '').trim();
  if (!text) {
    return { principioText, ingredientId: null, matchType: 'none', matchScore: 0, matchedVia: 'empty', isMatched: false };
  }

  // 1. Blacklist (excipientes, tags, cosméticos) → no match
  if (isBlacklisted(text)) {
    return { principioText, ingredientId: null, matchType: 'blacklist', matchScore: 0, matchedVia: 'principios_activos', isMatched: false };
  }

  // 2. Sinónimos químicos (diccionario: ácido ascórbico → vitamina_c)
  const synonymId = findSynonymMatch(text);
  if (synonymId) {
    return { principioText, ingredientId: synonymId, matchType: 'synonym', matchScore: 100, matchedVia: 'principios_activos', isMatched: true };
  }

  // 3. Match exacto (ID, nombre, alternativo, científico)
  const exact = findExactMatch(text);
  if (exact) {
    return { principioText, ingredientId: exact.id, matchType: exact.method.startsWith('exact') ? 'exact' : 'exact', matchScore: exact.score, matchedVia: 'principios_activos', isMatched: true };
  }

  // 4. Resolución homeopática (D3, C6, T.M. → extraer base)
  if (hasHomeopathicSuffix(text)) {
    const homeo = resolveHomeopathic(text, KB);
    if (homeo && homeo.ingredientId) {
      return { principioText, ingredientId: homeo.ingredientId, matchType: 'homeopathic', matchScore: homeo.score, matchedVia: 'principios_activos', isMatched: true };
    }
    // Si era homeopático pero no se resolvió, no intentar fuzzy (evitar falsos)
    return { principioText, ingredientId: null, matchType: 'none', matchScore: 0, matchedVia: 'principios_activos', isMatched: false };
  }

  // 5. Fuzzy Levenshtein (tolerancia a typos)
  const fuzzy = findFuzzyMatch(text);
  if (fuzzy && fuzzy.score >= 75) {
    return { principioText, ingredientId: fuzzy.id, matchType: 'fuzzy', matchScore: fuzzy.score, matchedVia: 'principios_activos', isMatched: true };
  }

  // 6. Sin match = gap de cobertura
  return { principioText, ingredientId: null, matchType: 'none', matchScore: 0, matchedVia: 'principios_activos', isMatched: false };
}

// ─── Matching de todos los productos ─────────────────────────────────────────

export async function runMatcher() {
  console.log('🔗 Iniciando Matcher de principios activos → KB...');
  console.log(`📂 Entrada: ${FILES.PROCESSED}`);
  console.log(`📂 Salida: ${FILES.MATCHED}`);
  console.log(`📊 KB cargada: ${KB.size} ingredientes`);
  console.log(`📊 Diccionario: ${Object.keys(SINONIMOS_QUIMICOS).length} sinónimos, ${BLACKLIST.size} blacklist`);
  console.log('─'.repeat(50));

  if (!fs.existsSync(FILES.PROCESSED)) {
    console.error(`❌ No se encontró ${FILES.PROCESSED}. Ejecuta el procesador IA primero.`);
    return;
  }

  const products: ProcessedProduct[] = JSON.parse(
    fs.readFileSync(FILES.PROCESSED, 'utf-8'),
  );
  const matchedProducts: MatchedProduct[] = [];

  const stats = {
    total: 0,
    matched: 0,
    blacklist: 0,
    gaps: 0,
    byType: {} as Record<string, number>,
  };

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const matches = (product.principios_activos || []).map(matchPrincipio);
    const matchedCount = matches.filter((m) => m.isMatched).length;
    const totalPrincipios = matches.length;
    const cobertura = totalPrincipios > 0
      ? Math.round((matchedCount / totalPrincipios) * 100)
      : 0;

    matchedProducts.push({ ...product, matches, coberturaKb: cobertura });

    stats.total += matches.length;
    for (const m of matches) {
      if (m.isMatched) {
        stats.matched++;
        stats.byType[m.matchType] = (stats.byType[m.matchType] || 0) + 1;
      } else if (m.matchType === 'blacklist') {
        stats.blacklist++;
      } else {
        stats.gaps++;
      }
    }

    if ((i + 1) % 20 === 0 || i === products.length - 1) {
      console.log(
        `[${i + 1}/${products.length}] ${product.nombre_comercial} → ${matchedCount}/${totalPrincipios} matched (${cobertura}%)`,
      );
    }
  }

  fs.writeFileSync(FILES.MATCHED, JSON.stringify(matchedProducts, null, 2));

  // Reporte
  const report = {
    generatedAt: new Date().toISOString(),
    productsTotal: matchedProducts.length,
    principiosTotal: stats.total,
    matched: stats.matched,
    blacklist: stats.blacklist,
    gaps: stats.gaps,
    coverage: stats.total > 0 ? Math.round((stats.matched / stats.total) * 100) : 0,
    byMatchType: stats.byType,
    gapsList: matchedProducts
      .flatMap((p) =>
        p.matches
          .filter((m) => m.matchType === 'none')
          .map((m) => ({ sku: p.sku, producto: p.nombre_comercial, principio: m.principioText })),
      )
      .slice(0, 100),
  };
  fs.writeFileSync(FILES.MATCH_REPORT, JSON.stringify(report, null, 2));

  console.log('\n🎉 MATCHING FINALIZADO.');
  console.log(`📊 Productos: ${matchedProducts.length}`);
  console.log(`📊 Principios: ${stats.total} | Matched: ${stats.matched} | Blacklist: ${stats.blacklist} | Gaps: ${stats.gaps}`);
  console.log(`📊 Cobertura global: ${report.coverage}%`);
  console.log(`📊 Por tipo: ${JSON.stringify(stats.byType)}`);
  console.log(`📋 Reporte: ${FILES.MATCH_REPORT}`);
}

if (require.main === module) {
  runMatcher().catch((err) => {
    console.error('Error fatal:', err);
    process.exit(1);
  });
}
