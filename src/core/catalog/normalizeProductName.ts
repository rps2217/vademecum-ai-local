/**
 * Normalización de nombres de productos comerciales.
 *
 * Los productos llegan de Supabase con nombres en mayúsculas, minúsculas o
 * mezclados (p. ej. "ARNICA UNGÜENTO 35GR", "magnesio quelado 400MG",
 * "Valeriana Extracto"). Esta función produce un Title Case consistente
 * que se persiste en Supabase (migración única) para que todos los
 * dispositivos reciban nombres ya normalizados.
 *
 * Reglas:
 *   1. Colapsar espacios múltiples y trim.
 *   2. Title Case respetando acentos (UTF-16 safe).
 *   3. Preservar minúsculas en unidades de medida (mg, ml, ui, etc.) y
 *      sus prefijos numéricos ("400MG" → "400mg").
 *   4. Preservar siglas/vitaminas con letra+numero ("B6", "D3", "C200").
 *   5. Lowercase de conectores ("DE", "Y", "CON" → "de", "y", "con").
 *   6. Idempotente: un nombre ya normalizado no cambia al aplicarle de nuevo.
 */

/** Conectores que van en minúsculas aunque estén en posición de capitalización. */
const LOWERCASE_WORDS = new Set([
  'de', 'del', 'la', 'las', 'el', 'los', 'y', 'o', 'u', 'con', 'sin',
  'para', 'en', 'al', 'un', 'una', 'unos', 'unas', 'por', 'segun', 'según',
  // "x" es abreviatura coloquial de "por" en farmacia ("500 mg x 90 porciones")
  'x',
]);

/** Unidades de medida que van en minúsculas, con variantes normalizadas. */
const UNIT_NORMALIZE: Record<string, string> = {
  mg: 'mg', mgs: 'mg',
  ml: 'ml', mls: 'ml', cc: 'ml',
  ui: 'ui', iu: 'ui',
  mcg: 'mcg', ug: 'mcg',
  kg: 'kg', g: 'g', gr: 'g', grs: 'g', gs: 'g', grm: 'g',
  l: 'l', m: 'm',
};

/** Sufijos de dilución homeopática (preservar como están: C200, D4, CH30). */
const DILUTION_RE = /^[cdch]+-?\d+$/i;

/** Token forma "letra(s)+número(s)" (B6, D3, B12) — preservar original. */
const ALPHANUM_TOKEN_RE = /^[a-z]+\d+$/i;

/** Token con unidades pegadas a número: "400mg", "35gr", "125ml". */
const NUMBER_UNIT_RE = /^(\d+(?:[.,]\d+)?)([a-z]+)$/i;

/**
 * Aplica Title Case a una palabra, respetando las reglas de unidades,
 * siglas y conectores. No modifica siglas todo-mayúsculas (OMS, OTC) ni
 * diluciones homeopáticas.
 */
function normalizeToken(token: string, isFirst: boolean): string {
  if (token.length === 0) return token;

  const lower = token.toLowerCase();

  // Dilución homeopática (C200, D4, CH30) → preservar original
  if (DILUTION_RE.test(token)) return token;

  // Vitamina/sigla letra+número (B6, D3, B12) → preservar original
  if (ALPHANUM_TOKEN_RE.test(token)) return token;

  // Número + unidad pegados ("400mg", "35gr", "125ml") → número + unidad normalizada
  const numUnit = token.match(NUMBER_UNIT_RE);
  if (numUnit) {
    const num = numUnit[1];
    const unit = numUnit[2].toLowerCase();
    return UNIT_NORMALIZE[unit] ? `${num}${UNIT_NORMALIZE[unit]}` : `${num}${unit}`;
  }

  // Unidad suelta en cualquier capitalización (MG, Mg, GR, gr, ml…) → normalizada
  if (UNIT_NORMALIZE[lower]) return UNIT_NORMALIZE[lower];

  // Conector → minúscula (salvo que sea la primera palabra)
  if (!isFirst && LOWERCASE_WORDS.has(lower)) return lower;

  // Sigla real: 2-3 letras, todo mayúsculas, SIN acentos (OMS, OTC, DNA).
  // 4+ letras en mayúsculas (COMP, UNGÜENTO, PRÓPOLIS) suelen ser abreviaturas
  // o palabras en mayúsculas → se capitalizan como Title Case.
  const hasAccent = /[áéíóúü]/i.test(token);
  if (token.length <= 3 && token === token.toUpperCase() && !/[0-9]/.test(token) && !hasAccent) {
    return token;
  }

  // Title Case respetando acentos
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/**
 * Normaliza el nombre comercial de un producto a Title Case consistente.
 *
 * Idempotente: aplicar dos veces produce el mismo resultado que una.
 *
 * @example
 * normalizeProductName('ARNICA UNGÜENTO 35GR')  // → 'Arnica Ungüento 35g'
 * normalizeProductName('magnesio quelado 400MG') // → 'Magnesio Quelado 400mg'
 * normalizeProductName('Vitamina B6 100 Comp')   // → 'Vitamina B6 100 Comp'
 * normalizeProductName('ACEITE de Masaje 125 mL') // → 'Aceite de Masaje 125ml'
 */
export function normalizeProductName(raw: string): string {
  if (!raw) return raw;

  // Colapsar espacios múltiples, tabs y trim
  const collapsed = raw.replace(/\s+/g, ' ').trim();
  if (collapsed.length === 0) return collapsed;

  const tokens = collapsed.split(' ');
  const result = tokens.map((tok, i) => normalizeToken(tok, i === 0));

  return result.join(' ');
}
