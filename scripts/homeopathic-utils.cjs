// ═══════════════════════════════════════════════════════════════════════════
// Utilidades para detección y normalización de diluciones homeopáticas
// ═══════════════════════════════════════════════════════════════════════════
//
// Los productos homeopáticos declaran el principio activo seguido de una
// dilución (D3, C6, C30, CH9, X6, Q1, T.M./TM = tintura madre). El algoritmo
// de matching por similitud de texto confunde esos tokens con IDs de la KB
// (p.ej. "Passiflora D3" → vitamina_d3, "Calcium carbonicum C6" →
// kali_carbonicum). Estas utilidades extraen el nombre base antes de comparar
// para que "Passiflora D3" se resuelva a "passiflora".
//
// Formatos soportados:
//   D{n}   D3 D6 D9 D12 D30      (decimales hahnemannianos)
//   C{n}   C6 C9 C12 C30 C200    (centesimales hahnemannianos)
//   CH{n}  CH3 CH6 CH9           (centesimales hahnemannianas explícito)
//   X{n}   X3 X6                 (decimales, notación americana)
//   Q{n}   Q1 Q3                 (cincuentamilesimales / LM)
//   MK / M / MK{n}              (korsakovianas)
//   T.M. / TM / T.M             (tintura madre)
//   DH{n}  DH3 DH6              (decimales hahnemannianas explícito)

'use strict';

// Sufijo de dilución al final del texto (opcionalmente con puntuación extra).
// Captura el sufijo completo para poder removerlo y dejar solo el nombre base.
const DILUTION_SUFFIX = /[\s/]*\b(?:D|C|CH|DH|X|Q|LM|MK|M|K|CH|CK)\d{1,4}\b\.?$/i;
const TINCTURE_SUFFIX = /[\s/]*\bT\.?\s*M\.?$/i;
const DILUTION_SUFFIX_LOOSE = /[\s/]*\b(?:D|C|CH|DH|X|Q|LM|MK|M|K)\d{1,4}(?:\s*[·.])?$/i;

// Patrón combinado: dilución numérica O tintura madre.
const HOMEOPATHIC_SUFFIX = new RegExp(
  '(?:' +
  DILUTION_SUFFIX_LOOSE.source.replace(/[\s/]*\\b/, '').replace(/\\?\$?$/, '') +
  '|' +
  TINCTURE_SUFFIX.source.replace(/[\s/]*\\b/, '').replace(/\\?\$?$/, '') +
  ')\\s*\\.?$',
  'i'
);

// Palabras que indican que el "D3"/"C6" final NO es una dilución homeopática
// sino parte del nombre (p.ej. "Vitamina D3", "Vitamina C", "Vitamina B12").
const NON_HOMEOPATHIC_HINTS = /\bvitamina[s]?\b|\bvit\.?\b|\bvitamina\s+[a-z]/i;

// ¿El texto termina con un sufijo de dilución homeopática?
function hasHomeopathicSuffix(text) {
  if (!text) return false;
  const t = String(text).trim();
  // Excluir vitaminas: "Vitamina D3" NO es homeopático
  if (NON_HOMEOPATHIC_HINTS.test(t)) return false;
  // Dilución numérica: D3, C6, C30, CH9, X6, Q1, DH3
  if (/\b(?:D|C|CH|DH|X|Q|LM|MK|K)\d{1,4}\b\.?$/i.test(t)) return true;
  // Tintura madre
  if (/\bT\.?\s*M\.?$/i.test(t)) return true;
  // M+n (korsakoviano de alta potencia) — exigir número para no confundir
  if (/\bM\d{1,4}\b\.?$/i.test(t)) return true;
  return false;
}

// Extrae el nombre base removiendo el sufijo de dilución.
// "Passiflora D3" → "Passiflora"
// "Calcium carbonicum C6" → "Calcium carbonicum"
// "Coffea C200" → "Coffea"
// "Passiflora T.M." → "Passiflora"
// "Sulfur D10" → "Sulfur"
function extractHomeopathicBase(text) {
  if (!text) return text;
  let base = String(text).trim();
  // Remover sufijo de dilución numérica
  base = base.replace(/\s+(?:D|C|CH|DH|X|Q|LM|MK|K)\d{1,4}\s*\.?$/i, '');
  // Remover tintura madre
  base = base.replace(/\s+T\.?\s*M\.?\s*\.?$/i, '');
  // Remover M+n (korsakoviano)
  base = base.replace(/\s+M\d{1,4}\s*\.?$/i, '');
  return base.trim() || String(text).trim();
}

// Normaliza un texto (sin acentos, minúsculas, guiones→espacios) para matching.
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

// Devuelve los sinónimos de un ingrediente buscando en ambos campos:
// `sinonimos` (formato del audit script) y `nombresAlternativos` (formato KB).
function getSynonyms(ing) {
  return (ing.sinonimos || []).concat(ing.nombresAlternativos || []);
}

// Score de similitud por tokens (Jaccard) entre el nombre base y un ingrediente.
// Incluye regla de prefijo de ID para nombres homeopáticos latinos cortos:
// "apis" → "apis_mellifica", "china" → "china_officinalis", "berberis" →
// "berberis_homeo". Verifica intersección de tokens para evitar "china" →
// "capuchina" (substring sin coincidencia de token completo).
function tokenScore(baseText, ing) {
  const normBase = normalize(baseText);
  const normN = normalize(ing.nombre);
  const normI = normalize(ing.id);
  const syns = getSynonyms(ing);

  if (normBase === normN) return 100;
  if (normBase === normI) return 100;

  for (const sin of syns) {
    if (normBase === normalize(sin)) return 96;
  }

  // Prefijo de ID: "apis" es prefijo de "apis mellifica" (ID normalizado).
  // Requiere longitud >= 4 para evitar matches triviales.
  if (normBase.length >= 4 && normI.startsWith(normBase + ' ')) return 92;
  if (normBase.length >= 4 && normI.startsWith(normBase)) {
    const after = normI.slice(normBase.length);
    if (after === '' || after.startsWith(' ')) return 92;
  }

  // Contención con verificación de tokens (evita "china" → "capuchina")
  if (normBase.length >= 5 && (normN.includes(normBase) || normBase.includes(normN))) {
    const baseTokens = new Set(tokenize(baseText));
    const ingTokens = new Set(tokenize(ing.nombre + ' ' + syns.join(' ')));
    if (baseTokens.size > 0 && ingTokens.size > 0) {
      let intersection = 0;
      for (const t of baseTokens) { if (ingTokens.has(t)) intersection++; }
      if (intersection > 0) {
        const union = baseTokens.size + ingTokens.size - intersection;
        return Math.round((intersection / union) * 90);
      }
    }
    return 70;
  }

  // Jaccard sobre tokens
  const baseTokens = new Set(tokenize(baseText));
  const ingTokens = new Set(tokenize(ing.nombre + ' ' + syns.join(' ')));
  if (baseTokens.size > 0 && ingTokens.size > 0) {
    let intersection = 0;
    for (const t of baseTokens) { if (ingTokens.has(t)) intersection++; }
    if (intersection > 0) {
      const union = baseTokens.size + ingTokens.size - intersection;
      return Math.round((intersection / union) * 90);
    }
  }

  return 0;
}

// Busca el nombre base en la KB por ID, nombre, sinónimo o similitud de tokens.
// Acepta un `scorer` opcional (function(text, ing) => number) para reutilizar
// el similarityScore del script llamador. Devuelve { ingredientId, nombre,
// score, method } o null.
function matchHomeopathicBase(baseText, kb, scorer) {
  if (!baseText) return null;
  const normBase = normalize(baseText);
  if (!normBase) return null;

  // Si se pasa un scorer externo, usarlo para encontrar el mejor match
  if (scorer) {
    let best = null;
    for (const [id, ing] of kb) {
      const score = scorer(baseText, ing);
      if (score > 0 && (!best || score > best.score)) {
        best = { ingredientId: id, nombre: ing.nombre, score, method: 'homeo_scorer' };
      }
    }
    if (best && best.score >= 80) return best;
    return null;
  }

  // 1) Match exacto por ID normalizado
  for (const [id, ing] of kb) {
    if (normalize(id) === normBase) {
      return { ingredientId: id, nombre: ing.nombre, score: 100, method: 'homeo_id' };
    }
  }

  // 2) Match exacto por nombre normalizado
  for (const [id, ing] of kb) {
    if (normalize(ing.nombre) === normBase) {
      return { ingredientId: id, nombre: ing.nombre, score: 98, method: 'homeo_nombre' };
    }
  }

  // 3) Match por sinónimo del ingrediente (ambos formatos)
  for (const [id, ing] of kb) {
    for (const sin of getSynonyms(ing)) {
      if (normalize(sin) === normBase) {
        return { ingredientId: id, nombre: ing.nombre, score: 96, method: 'homeo_sinonimo' };
      }
    }
  }

  // 4) Similitud por tokens (Jaccard)
  let best = null;
  for (const [id, ing] of kb) {
    const score = tokenScore(baseText, ing);
    if (score > 0 && (!best || score > best.score)) {
      best = { ingredientId: id, nombre: ing.nombre, score, method: 'homeo_tokens' };
    }
  }
  if (best && best.score >= 80) return best;

  return null;
}

// Resuelve un principio homeopático: extrae el nombre base y lo busca en la KB.
// Devuelve { ingredientId, nombre, score, method, base } o null si no hay match.
// `scorer` opcional: function(baseText, ing) => number (reutiliza similarityScore).
function resolveHomeopathic(principioText, kb, scorer) {
  if (!hasHomeopathicSuffix(principioText)) return null;
  const base = extractHomeopathicBase(principioText);
  if (!base || base === String(principioText).trim()) return null;
  const match = matchHomeopathicBase(base, kb, scorer);
  if (!match) return null;
  return { ...match, base };
}

module.exports = {
  hasHomeopathicSuffix,
  extractHomeopathicBase,
  matchHomeopathicBase,
  resolveHomeopathic,
  normalize,
};
