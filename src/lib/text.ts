/**
 * Utilidades de normalización de texto.
 *
 * Todas las búsquedas y comparaciones de texto pasan por aquí para que
 * "estres", "estrés" y "ESTRÉS" coincidan, y para que las indicaciones
 * se muestren con una ortografía consistente en toda la app.
 */

/** Quita acentos/diacríticos, normaliza separadores (guiones bajos → espacio)
 *  y pasa a minúsculas. NFD + remove combining marks. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[_]+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Stopwords en español. Se filtran de los tokens de la consulta del
 * usuario para que no contaminen el score (p.ej. "dolor de muelas" no
 * puntúa por la palabra "de"). No se aplican al indexar (los nombres
 * propios pueden contenerlas).
 */
const STOPWORDS = new Set([
  'de', 'la', 'el', 'en', 'para', 'con', 'del', 'las', 'los', 'un', 'una',
  'unas', 'unos', 'y', 'o', 'u', 'que', 'se', 'su', 'sus', 'al', 'lo', 'le',
  'les', 'me', 'te', 'a', 'e', 'i', 'o', 'por', 'como', 'mas', 'pero', 'si',
]);

/**
 * Genera los tokens de búsqueda de un texto: minúsculas, sin acentos,
 * divididos por espacios y guiones. Tokens vacíos y stopwords se descartan.
 *
 * @param isQuery Si true (por defecto), filtra stopwords. Al indexar
 *   pasar `false` para no perder palabras de nombres propios.
 */
export function tokenize(s: string, isQuery = true): string[] {
  const tokens = normalize(s)
    .split(/[\s\-_/,.;:()]+/)
    .filter(Boolean);
  if (!isQuery) return tokens;
  return tokens.filter((t) => !STOPWORDS.has(t));
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
  // Indicaciones compuestas normalizadas (sin guion bajo)
  'dolor dental': 'dolor dental',
  'dolor muscular': 'dolor muscular',
  'dolor articular': 'dolor articular',
  'dolor neuropatico': 'dolor neuropático',
  'dolor oseo': 'dolor óseo',
  'dolor cronico': 'dolor crónico',
  'litiasis renal': 'litiasis renal',
  'infeccion urinaria': 'infección urinaria',
  'candidiasis vaginal': 'candidiasis vaginal',
  'disfuncion erectil': 'disfunción eréctil',
  'libido bajo': 'libido bajo',
  'glucosa alta': 'glucosa alta',
  'ojo seco': 'ojo seco',
  'vision nocturna': 'visión nocturna',
  'insuficiencia venosa': 'insuficiencia venosa',
  'herpes labial': 'herpes labial',
  'pie de atleta': 'pie de atleta',
  'ulcera peptica': 'úlcera péptica',
  'dermatitis seborreica': 'dermatitis seborreica',
  'higado graso': 'hígado graso',
  'parasitos intestinales': 'parásitos intestinales',
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

/** Escribe en Title Case legible: "aceite_esencial" → "Aceite esencial".
 *  Usa una regex que respeta caracteres acentuados (UTF-16 safe). */
export function humanize(s: string): string {
  return s
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/(^|\s)\S/g, (m) => m.toUpperCase());
}

/**
 * Diccionario de sinónimos de consulta (query expansion).
 *
 * Mapea términos coloquiales que el usuario escribe en el mostrador a las
 * etiquetas/keywords que existen en la KB, de modo que "dolor de muelas"
 * encuentre ingredientes con indicación "dolor dental" sin necesidad de IA.
 *
 * La clave es la palabra normalizada (sin acentos, minúsculas, singular o
 * plural). El valor es la lista de tokens/keywords a inyectar en la búsqueda.
 *
 * Es local, offline e instantáneo. Ampliar conforme se detecten términos
 * frecuentes del mostrador de farmacia.
 */
const QUERY_SYNONYMS: Record<string, string[]> = {
  // Dental / bucal
  muela: ['dental', 'dolor dental', 'bucal'],
  muelas: ['dental', 'dolor dental', 'bucal'],
  diente: ['dental', 'dolor dental', 'bucal'],
  dientes: ['dental', 'dolor dental', 'bucal'],
  caries: ['dental', 'bucal'],
  encias: ['gingival', 'bucal', 'periodontal'],
  gingivitis: ['gingival', 'bucal', 'periodontal'],
  // Respiratorio / ORL
  garganta: ['faringitis', 'dolor de garganta', 'respiratorio'],
  oidos: ['otitis', 'otic'],
  oido: ['otitis', 'otic'],
  nariz: ['nasal', 'rinitis', 'sinusitis'],
  congestion: ['nasal', 'respiratorio', 'sinusitis'],
  catarro: ['resfriado', 'gripe', 'respiratorio'],
  // Digestivo
  estomago: ['gastrico', 'dispepsia', 'digestivo'],
  gastritis: ['gastrico', 'dispepsia', 'digestivo'],
  acidez: ['reflujo', 'ardor', 'digestivo'],
  reflujo: ['reflujo', 'ardor', 'digestivo'],
  vientre: ['intestinal', 'digestivo'],
  estrenimiento: ['estreñimiento', 'laxante', 'digestivo'],
  // Urinario
  orina: ['urinario', 'vejiga'],
  vejiga: ['urinario', 'cistitis'],
  cistitis: ['urinario', 'infección urinaria'],
  riñones: ['renal', 'urinario'],
  rinon: ['renal', 'urinario'],
  // Hepático
  higado: ['hepático', 'hígado graso'],
  // Ocular
  ojos: ['ocular', 'ojo seco', 'visión'],
  ojo: ['ocular', 'ojo seco', 'visión'],
  vista: ['ocular', 'visión', 'visión nocturna'],
  vision: ['ocular', 'visión', 'visión nocturna'],
  // Musculoesquelético
  huesos: ['óseo', 'articular', 'hueso'],
  hueso: ['óseo', 'articular', 'hueso'],
  articulaciones: ['articular', 'artrosis'],
  espalda: ['dolor de espalda', 'lumbar', 'muscular'],
  ciatica: ['ciática', 'dolor neuropático', 'nervio'],
  // Neurológico / ánimo
  cabeza: ['cefalea', 'migraña', 'dolor de cabeza'],
  migrana: ['migraña', 'cefalea'],
  estres: ['estrés', 'ansiedad', 'adaptógeno'],
  nervios: ['ansiedad', 'nervioso', 'calmante'],
  animo: ['depresión', 'ánimo', 'estado de ánimo'],
  sueno: ['insomnio', 'sueño', 'sedante'],
  // Cardiovascular
  tension: ['hipertensión', 'cardiovascular', 'presión'],
  presion: ['hipertensión', 'cardiovascular', 'presión'],
  colesterol_alto: ['colesterol', 'hipolipemiante'],
  trigliceridos: ['colesterol', 'triglicéridos', 'hipolipemiante'],
  // Metabólico / endocrino
  azucar: ['glucosa', 'diabetes', 'glucosa alta'],
  tiroides: ['tiroideo', 'endocrino'],
  // Inmune
  defensas: ['inmunidad', 'inmune', 'inmunidad baja'],
  resfriado: ['resfriado', 'gripe', 'respiratorio'],
  gripe: ['gripe', 'respiratorio', 'inmunidad'],
  // Dermatológico
  piel: ['dermatológico', 'cicatrización', 'piel'],
  eczema: ['eccema', 'dermatitis', 'piel'],
  dermatitis: ['dermatitis', 'eccema', 'piel'],
  psoriasis: ['psoriasis', 'dermatológico', 'piel'],
  // Reproductivo
  menstruacion: ['menstrual', 'dismenorrea'],
  regla: ['menstrual', 'dismenorrea'],
  menopausia: ['menopausia', 'sofocos', 'hormonal'],
  prostata: ['próstata', 'urinario'],
  libido: ['libido', 'libido bajo', 'sexual'],
  // Otros
  peso: ['peso', 'metabólico', 'saciante'],
  retencion: ['retención', 'diurético', 'líquidos'],
};

/**
 * Expande una lista de tokens de consulta con sus sinónimos.
 * Devuelve los tokens originales más los sinónimos inyectados.
 * Los sinónimos se marcan con peso reducido vía el motor de búsqueda.
 */
export function expandQueryTokens(tokens: string[]): string[] {
  if (tokens.length === 0) return tokens;
  const expanded = [...tokens];
  for (const tok of tokens) {
    const syns = QUERY_SYNONYMS[tok];
    if (syns) {
      for (const s of syns) {
        if (!expanded.includes(s)) expanded.push(s);
      }
    }
  }
  return expanded;
}
