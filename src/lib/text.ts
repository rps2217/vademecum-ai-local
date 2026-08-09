/**
 * Utilidades de normalización de texto.
 *
 * Todas las búsquedas y comparaciones de texto pasan por aquí para que
 * "estres", "estrés" y "ESTRÉS" coincidan, y para que las indicaciones
 * se muestren con una ortografía consistente en toda la app.
 */

/** Quita acentos/diacríticos y pasa a minúsculas. NFD + remove combining marks. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Genera los tokens de búsqueda de un texto: minúsculas, sin acentos,
 * divididos por espacios y guiones. Tokens vacíos se descartan.
 */
export function tokenize(s: string): string[] {
  return normalize(s)
    .split(/[\s\-_/,.;:()]+/)
    .filter(Boolean);
}

/**
 * Mapeo de variantes mal escritas / sin acentos a la forma canónica
 * que se mostrará al usuario. Se aplica al sembrar y al buscar.
 *
 * Ampliar conforme se detecten nuevas variantes en la KB.
 */
const CANONICAL_INDICATIONS: Record<string, string> = {
  depresion: 'depresión',
  estres: 'estrés',
  ansiedad: 'ansiedad',
  insomnio: 'insomnio',
  fatiga: 'fatiga',
  inmunidad: 'inmunidad',
  cognitivo: 'cognitivo',
  cardiovascular: 'cardiovascular',
  respiratorio: 'respiratorio',
  antioxidante: 'antioxidante',
  hepatico: 'hepático',
  cicatrizacion: 'cicatrización',
  inflamacion: 'inflamación',
  coagulacion: 'coagulación',
  menopausia: 'menopausia',
  migraña: 'migraña',
  digestion: 'digestión',
  retencion: 'retención',
  circulacion: 'circulación',
  concentracion: 'concentración',
  relajacion: 'relajación',
  energetico: 'energético',
  energia: 'energía',
  metabolico: 'metabólico',
  colesterol: 'colesterol',
  glucosa: 'glucosa',
  intestinal: 'intestinal',
  muscular: 'muscular',
  articular: 'articular',
  dermatologico: 'dermatológico',
  hormonal: 'hormonal',
  ovulacion: 'ovulación',
  fertilidad: 'fertilidad',
  menstrual: 'menstrual',
  urinario: 'urinario',
  ocular: 'ocular',
  digestivo: 'digestivo',
};

/** Devuelve la forma canónica de una indicación (con acentos correctos). */
export function canonicalIndication(raw: string): string {
  const key = normalize(raw);
  return CANONICAL_INDICATIONS[key] ?? raw.trim();
}

/**
 * Normaliza un array de indicaciones: canonicaliza cada una, elimina
 * duplicados canónicos y ordena alfabéticamente.
 */
export function normalizeIndications(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of list) {
    const canon = canonicalIndication(raw);
    const key = normalize(canon);
    if (key && !seen.has(key)) {
      seen.add(key);
      out.push(canon);
    }
  }
  return out.sort((a, b) => a.localeCompare(b, 'es'));
}

/** Escribe en Title Case legible: "aceite_esencial" → "Aceite esencial". */
export function humanize(s: string): string {
  return s
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
