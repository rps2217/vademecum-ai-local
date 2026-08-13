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
  'unas', 'unos', 'y', 'o', 'u', 'que', 'se', 'al', 'lo', 'le',
  'les', 'me', 'te', 'a', 'e', 'i', 'por', 'mas', 'pero',
  // Pronombres / verbos auxiliares frecuentes en consultas coloquiales
  'no', 'puedo', 'puede', 'pueden', 'tener', 'tengo', 'tiene', 'tienen',
  'muy', 'mucho', 'mucha', 'muchos', 'muchas', 'poco', 'poca',
  'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas',
  'mi', 'mis', 'tu', 'tus', 'su', 'sus', 'nuestro', 'nuestra',
  'cuando', 'donde', 'como', 'porque', 'pues', 'aunque',
  'sin', 'sobre', 'tras', 'ante', 'bajo', 'entre', 'hasta', 'desde',
  'si',
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
 * Distancia de Levenshtein (número de ediciones: inserción, borrado,
 * sustitución) entre dos strings. Implementación iterativa con dos filas
 * (O(m·n) tiempo, O(min(m,n)) espacio).
 *
 * Usada para tolerar errores tipográficos en la consulta del usuario
 * ("valerina" → "valeriana", distancia 1).
 */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = new Array(b.length + 1);
  let curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,      // inserción
        prev[j] + 1,          // borrado
        prev[j - 1] + cost,  // sustitución
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/**
 * Genera bigramas de palabras adyacentes (pares de tokens consecutivos).
 * Permite que frases compuestas como "dolor de cabeza" se indexen/busquen
 * como unidad ("dolor cabeza") además de como tokens sueltos, preservando
 * el sentido compuesto. Las stopwords se eliminan ANTES de formar los
 * bigramas para que "dolor de cabeza" → ["dolor","cabeza"] → "dolor cabeza".
 */
export function bigrams(tokens: string[]): string[] {
  const filtered = tokens.filter((t) => !STOPWORDS.has(t));
  const out: string[] = [];
  for (let i = 0; i < filtered.length - 1; i++) {
    out.push(`${filtered[i]} ${filtered[i + 1]}`);
  }
  return out;
}

/** Tokeniza y además añade bigramas de palabras. Útil al indexar y al
 *  expandir consultas para mejorar el matching de frases compuestas. */
export function tokenizeWithBigrams(s: string, isQuery = true): string[] {
  const tokens = tokenize(s, isQuery);
  return [...tokens, ...bigrams(tokens)];
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
  encia: ['gingival', 'bucal', 'periodontal'],
  gingivitis: ['gingival', 'bucal', 'periodontal'],
  periodontal: ['periodontal', 'gingival', 'bucal'],
  halitosis: ['bucal', 'mal aliento'],
  bruxismo: ['bruxismo', 'mandibular', 'ansiedad'],
  rechinar: ['bruxismo', 'mandibular'],
  // Respiratorio / ORL
  garganta: ['faringitis', 'dolor de garganta', 'respiratorio'],
  faringitis: ['faringitis', 'garganta', 'respiratorio'],
  amigdalitis: ['amigdalitis', 'garganta', 'respiratorio'],
  anginas: ['amigdalitis', 'garganta', 'respiratorio'],
  oidos: ['otitis', 'otic'],
  oido: ['otitis', 'otic'],
  otitis: ['otitis', 'otic'],
  nariz: ['nasal', 'rinitis', 'sinusitis'],
  congestion: ['nasal', 'respiratorio', 'sinusitis'],
  sinusitis: ['sinusitis', 'nasal', 'respiratorio'],
  catarro: ['resfriado', 'gripe', 'respiratorio'],
  tos: ['tos', 'respiratorio', 'balsámico'],
  asma: ['asma', 'respiratorio', 'bronquial'],
  bronquitis: ['bronquial', 'respiratorio', 'tos'],
  // Digestivo
  estomago: ['gástrico', 'dispepsia', 'digestivo'],
  gastritis: ['gástrico', 'dispepsia', 'digestivo'],
  acidez: ['reflujo', 'ardor', 'digestivo'],
  ardor: ['reflujo', 'ardor', 'digestivo'],
  reflujo: ['reflujo', 'ardor', 'digestivo'],
  panza: ['intestinal', 'digestivo', 'abdominal'],
  barriga: ['intestinal', 'digestivo', 'abdominal'],
  vientre: ['intestinal', 'digestivo'],
  estrenimiento: ['estreñimiento', 'laxante', 'digestivo'],
  estreñimiento: ['estreñimiento', 'laxante', 'digestivo'],
  diarrea: ['diarrea', 'digestivo', 'antidiarreico'],
  gases: ['gases', 'flatulencia', 'digestivo', 'carminativo'],
  flatulencia: ['gases', 'flatulencia', 'carminativo'],
  hinchazon: ['hinchazón', 'gases', 'digestivo'],
  nauseas: ['náusea', 'digestivo', 'antinauseoso'],
  vomito: ['náusea', 'vómito', 'digestivo'],
  ulcera: ['úlcera péptica', 'gástrico', 'digestivo'],
  hemorroides: ['hemorroides', 'venoso', 'digestivo'],
  // Urinario
  orina: ['urinario', 'vejiga'],
  vejiga: ['urinario', 'cistitis'],
  cistitis: ['urinario', 'infección urinaria'],
  riñones: ['renal', 'urinario'],
  rinon: ['renal', 'urinario'],
  litiasis: ['litiasis renal', 'renal', 'urinario'],
  calculos: ['litiasis renal', 'renal', 'urinario'],
  calculus: ['litiasis renal', 'renal', 'urinario'],
  miccion: ['urinario', 'vejiga', 'próstata'],
  // Hepático
  higado: ['hepático', 'hígado graso'],
  higado_graso: ['hígado graso', 'hepático'],
  desintoxicar: ['hepático', 'detox', 'depurativo'],
  detox: ['hepático', 'detox', 'depurativo'],
  // Ocular
  ojos: ['ocular', 'ojo seco', 'visión'],
  ojo: ['ocular', 'ojo seco', 'visión'],
  vista: ['ocular', 'visión', 'visión nocturna'],
  vision: ['ocular', 'visión', 'visión nocturna'],
  vista_borrosa: ['ocular', 'visión', 'ojo seco'],
  ojo_seco: ['ojo seco', 'ocular', 'lagrimal'],
  conjuntivitis: ['ocular', 'conjuntivitis'],
  // Musculoesquelético
  huesos: ['óseo', 'articular', 'hueso'],
  hueso: ['óseo', 'articular', 'hueso'],
  articulaciones: ['articular', 'artrosis'],
  articulacion: ['articular', 'artrosis'],
  artrosis: ['artrosis', 'articular'],
  artritis: ['artritis', 'articular', 'inflamación'],
  espalda: ['dolor de espalda', 'lumbar', 'muscular'],
  lumbago: ['lumbar', 'dolor de espalda', 'muscular'],
  ciatica: ['ciática', 'dolor neuropático', 'nervio'],
  ciática: ['ciática', 'dolor neuropático', 'nervio'],
  dolor_espalda: ['dolor de espalda', 'lumbar', 'muscular'],
  lumbar: ['lumbar', 'dolor de espalda'],
  columna: ['dolor de espalda', 'lumbar', 'óseo'],
  fibromialgia: ['fibromialgia', 'dolor muscular', 'muscular'],
  tendinitis: ['tendinitis', 'muscular', 'inflamación'],
  musculos: ['muscular', 'dolor muscular'],
  calambre: ['calambre', 'muscular', 'espasmo'],
  espasmo: ['espasmo', 'muscular', 'calmante'],
  // Neurológico / ánimo
  cabeza: ['cefalea', 'migraña', 'dolor de cabeza'],
  cefalea: ['cefalea', 'migraña', 'dolor de cabeza'],
  migraña: ['migraña', 'cefalea'],
  vertigo: ['vértigo', 'mareo', 'vestibular'],
  mareo: ['vértigo', 'mareo', 'vestibular'],
  memoria: ['cognitivo', 'memoria', 'nootrópico'],
  concentracion: ['cognitivo', 'concentración', 'nootrópico'],
  estres: ['estrés', 'ansiedad', 'adaptógeno'],
  nervios: ['ansiedad', 'nervioso', 'calmante'],
  nerviosismo: ['ansiedad', 'nervioso', 'calmante'],
  animo: ['depresión', 'ánimo', 'estado de ánimo'],
  tristeza: ['depresión', 'ánimo', 'antidepresivo'],
  depresion: ['depresión', 'ánimo', 'antidepresivo'],
  sueno: ['insomnio', 'sueño', 'sedante'],
  dormir: ['insomnio', 'sueño', 'sedante'],
  insomnio: ['insomnio', 'sueño', 'sedante'],
  // Cardiovascular
  tension: ['hipertensión', 'cardiovascular', 'presión'],
  presion: ['hipertensión', 'cardiovascular', 'presión'],
  hipertension: ['hipertensión', 'cardiovascular', 'presión'],
  circulation: ['circulación', 'cardiovascular', 'venoso'],
  circulacion: ['circulación', 'cardiovascular', 'venoso'],
  varices: ['insuficiencia venosa', 'venoso', 'circulación'],
  venas: ['venoso', 'insuficiencia venosa', 'circulación'],
  colesterol_alto: ['colesterol', 'hipolipemiante'],
  trigliceridos: ['colesterol', 'triglicéridos', 'hipolipemiante'],
  corazon: ['cardiovascular', 'cardíaco', 'corazón'],
  // Metabólico / endocrino
  azucar: ['glucosa', 'diabetes', 'glucosa alta'],
  diabetes: ['glucosa', 'diabetes', 'glucosa alta'],
  tiroides: ['tiroideo', 'endocrino'],
  metabolismo: ['metabólico', 'endocrino'],
  peso: ['peso', 'metabólico', 'saciante'],
  obesidad: ['peso', 'metabólico', 'saciante'],
  adelgazar: ['peso', 'metabólico', 'saciante', 'termogénico'],
  // Inmune
  defensas: ['inmunidad', 'inmune', 'inmunidad baja'],
  inmunidad_baja: ['inmunidad', 'inmune'],
  resfriado: ['resfriado', 'gripe', 'respiratorio'],
  gripe: ['gripe', 'respiratorio', 'inmunidad'],
  fiebre: ['fiebre', 'inmunidad', 'antipirético'],
  infeccion: ['inmunidad', 'antimicrobiano', 'antiséptico'],
  hongos: ['antifúngico', 'antimicótico', 'piel'],
  candida: ['candidiasis vaginal', 'antifúngico'],
  candidiasis: ['candidiasis vaginal', 'antifúngico'],
  virus: ['antiviral', 'inmunidad'],
  bacterias: ['antibiótico', 'antimicrobiano', 'inmunidad'],
  parasitos: ['parásitos intestinales', 'antiparasitario'],
  // Dermatológico
  piel: ['dermatológico', 'cicatrización', 'piel'],
  eczema: ['eccema', 'dermatitis', 'piel'],
  dermatitis: ['dermatitis', 'eccema', 'piel'],
  psoriasis: ['psoriasis', 'dermatológico', 'piel'],
  acne: ['acné', 'dermatológico', 'piel'],
  acné: ['acné', 'dermatológico', 'piel'],
  cicatriz: ['cicatrización', 'dermatológico', 'piel'],
  herida: ['cicatrización', 'dermatológico', 'antiséptico'],
  quemadura: ['cicatrización', 'dermatológico', 'piel'],
  sarpullido: ['dermatitis', 'dermatológico', 'piel'],
  picor: ['prurito', 'dermatológico', 'piel'],
  picadura: ['dermatológico', 'antiséptico', 'piel'],
  hongos_piel: ['antifúngico', 'antimicótico', 'piel'],
  // Reproductivo
  menstruacion: ['menstrual', 'dismenorrea'],
  regla: ['menstrual', 'dismenorrea'],
  dismenorrea: ['dismenorrea', 'menstrual'],
  colicos: ['dismenorrea', 'menstrual', 'espasmo'],
  menopausia: ['menopausia', 'sofocos', 'hormonal'],
  sofocos: ['sofocos', 'menopausia', 'hormonal'],
  prostata: ['próstata', 'urinario'],
  libido: ['libido', 'libido bajo', 'sexual'],
  fertilidad: ['fertilidad', 'reproductivo', 'hormonal'],
  disfuncion_erectil: ['disfunción eréctil', 'libido', 'sexual'],
  // Otros
  retencion: ['retención', 'diurético', 'líquidos'],
  retencion_liquidos: ['retención', 'diurético', 'líquidos'],
  anemia: ['anemia', 'hematopoyético'],
  alergia: ['alergia', 'antihistamínico'],
  alergias: ['alergia', 'antihistamínico'],
  antienvejecimiento: ['antioxidante', 'longevidad'],
  longevidad: ['longevidad', 'antioxidante', 'anti-envejecimiento'],
  // Nuevos términos coloquiales (Ronda 16) — enlazan con nuevos ingredientes
  // y formas comunes de consulta en el mostrador
  macular: ['degeneración macular', 'ocular', 'AREDS2'],
  macula: ['degeneración macular', 'ocular', 'AREDS2'],
  dmae: ['degeneración macular', 'ocular', 'AREDS2'],
  degeneracion_macular: ['degeneración macular', 'ocular', 'AREDS2'],
  vista_cansada: ['ocular', 'ojo seco', 'fatiga visual'],
  fatiga_visual: ['ocular', 'ojo seco', 'fatiga visual'],
  luz_azul: ['ocular', 'degeneración macular', 'pantallas'],
  pantallas: ['ocular', 'fatiga visual', 'luz azul'],
  // Urinario
  infeccion_orina: ['infección urinaria', 'cistitis', 'urinario'],
  ardor_orina: ['cistitis', 'infección urinaria', 'urinario'],
  ganas_orinar: ['cistitis', 'infección urinaria', 'vejiga'],
  litiasis_renal: ['litiasis renal', 'cálculos', 'urinario'],
  calculos_renales: ['litiasis renal', 'cálculos', 'urinario'],
  piedra_rinon: ['litiasis renal', 'cálculos', 'urinario'],
  prostatitis: ['prostatitis', 'próstata', 'urinario'],
  // Hepático / digestivo avanzado
  nash: ['hígado graso', 'hepático', 'NAFLD'],
  transaminasas: ['hepático', 'hígado graso', 'transaminasas'],
  // Endocrino
  hipotiroidismo: ['hipotiroidismo', 'tiroideo', 'endocrino'],
  hipotiroides: ['hipotiroidismo', 'tiroideo', 'endocrino'],
  hashimoto: ['Hashimoto', 'hipotiroidismo', 'tiroideo'],
  bocio: ['bocio', 'tiroideo', 'yodo'],
  hipertiroidismo: ['hipertiroidismo', 'tiroideo', 'endocrino'],
  menopausia_sofocos: ['menopausia', 'sofocos', 'hormonal'],
  sofocos_menopausia: ['sofocos', 'menopausia', 'hormonal'],
  // Reproductivo masculino
  fertilidad_masculina: ['fertilidad', 'reproductivo', 'espermatozoide'],
  motilidad_espermatica: ['fertilidad', 'reproductivo', 'espermatozoide'],
  esperma: ['fertilidad', 'reproductivo', 'espermatozoide'],
  disfuncion_sexual: ['libido', 'sexual', 'disfunción eréctil'],
  potencia: ['libido', 'disfunción eréctil', 'sexual'],
  // Metabólico avanzado
  glucosa_alta: ['glucosa', 'diabetes', 'glucosa alta'],
  insulina_resistencia: ['insulina', 'glucosa', 'metabólico'],
  resistencia_insulina: ['insulina', 'glucosa', 'metabólico'],
  metabolic: ['metabólico', 'endocrino'],
  // Musculoesquelético avanzado
  osteoporosis: ['osteoporosis', 'óseo', 'hueso'],
  osteopenia: ['osteopenia', 'óseo', 'osteoporosis'],
  densidad_osea: ['óseo', 'osteoporosis', 'hueso'],
  huesos_debiles: ['óseo', 'osteoporosis', 'hueso'],
  // Inmune / otoño-invierno
  inmunidad_invierno: ['inmunidad', 'inmune', 'inmunidad baja'],
  prevencion_resfriado: ['inmunidad', 'resfriado', 'inmune'],
  // Cardio avanzado
  hipotension: ['hipotensión', 'cardiovascular', 'presión'],
  presion_baja: ['hipotensión', 'cardiovascular', 'presión'],
  // Sueño / nervios avanzado
  ansiedad_social: ['ansiedad', 'nervioso', 'ansiolítico'],
  ataque_panico: ['ansiedad', 'pánico', 'nervioso'],
  panico: ['ansiedad', 'pánico', 'nervioso'],
  foco: ['cognitivo', 'concentración', 'nootrópico'],
  atencion: ['cognitivo', 'concentración', 'nootrópico'],
  rendimiento_mental: ['cognitivo', 'nootrópico', 'memoria'],
  // Piel / estético
  arrugas: ['piel', 'antienvejecimiento', 'colágeno'],
  colageno: ['colágeno', 'piel', 'articular'],
  elastina: ['piel', 'elastina', 'antienvejecimiento'],
  caida_cabello: ['alopecia', 'cabello', 'dermatológico'],
  alopecia: ['alopecia', 'cabello', 'dermatológico'],
  uñas: ['dermatológico', 'uñas', 'colágeno'],
  // Energía / fatiga
  fatiga: ['fatiga', 'energía', 'adaptógeno'],
  cansancio: ['fatiga', 'energía', 'adaptógeno'],
  energia: ['energía', 'fatiga', 'adaptógeno'],
  agotamiento: ['fatiga', 'energía', 'adaptógeno', 'estrés'],
  // Digestivo avanzado
  hinchazon_abdominal: ['gases', 'hinchazón', 'digestivo'],
  estomago_inflamado: ['gástrico', 'inflamación', 'digestivo'],
  flora_intestinal: ['probiótico', 'intestinal', 'microbiota'],
  microbiota: ['probiótico', 'intestinal', 'flora intestinal'],
  // Vitaminas / comunes
  vitaminas: ['vitamina', 'suplemento'],
  suplemento: ['suplemento', 'vitamina', 'nutricional'],
  antioxidantes: ['antioxidante', 'antienvejecimiento'],
  // Nuevos ingredientes Ronda 17 — enlazan consultas coloquiales con la KB
  // Ocular
  arandano: ['mirtilo', 'ocular', 'visión nocturna', 'antocianósidos'],
  arandanos: ['mirtilo', 'ocular', 'visión nocturna'],
  mirtilo: ['mirtilo', 'ocular', 'visión nocturna'],
  bilberry: ['mirtilo', 'ocular', 'visión nocturna'],
  aronia: ['aronia', 'antioxidante', 'ocular', 'antocianinas'],
  chokeberry: ['aronia', 'antioxidante'],
  // Urinario
  olmaria: ['olmaria', 'urinario', 'antiinflamatorio'],
  reina_prados: ['olmaria', 'ulmaria', 'urinario'],
  ulmaria: ['olmaria', 'urinario'],
  // Reproductivo / hormonal
  verbeno: ['verbeno', 'nervioso', 'emenagogo'],
  verbena: ['verbeno', 'nervioso', 'emenagogo'],
  kudzu: ['pueraria', 'menopausia', 'isoflavonas'],
  pueraria: ['pueraria', 'menopausia', 'isoflavonas'],
  // Hepático
  desmodium: ['desmodium', 'hepático', 'hepatoprotector'],
  desmodio: ['desmodium', 'hepático'],
  achicoria: ['achicoria', 'hepático', 'prebiótico', 'inulina'],
  chicoria: ['achicoria', 'hepático'],
  esquizandra: ['esquizandra', 'hepático', 'adaptógeno'],
  schisandra: ['esquizandra', 'hepático', 'adaptógeno'],
  wu_wei_zi: ['esquizandra', 'hepático'],
  // Endocrino
  estevia: ['estevia', 'glucosa', 'endocrino'],
  stevia: ['estevia', 'glucosa', 'endocrino'],
  hierba_dulce: ['estevia', 'glucosa'],
  naranjo: ['naranjo amargo', 'nervioso', 'digestivo'],
  neroli: ['naranjo amargo', 'nervioso', 'sedante'],
  azahar: ['naranjo amargo', 'nervioso', 'sedante'],
  // Cardio / venotónico
  vid: ['sarmiento', 'venotónico', 'OPC'],
  sarmiento: ['sarmiento', 'venotónico', 'OPC'],
  hoja_vid: ['sarmiento', 'venotónico'],
  opc: ['sarmiento', 'venotónico', 'antioxidante'],
  // Probióticos / prebióticos
  lgg: ['lactobacillus rhamnosus', 'probiótico', 'intestinal'],
  probiotico: ['probiótico', 'intestinal', 'inmunidad'],
  probioticos: ['probiótico', 'intestinal', 'inmunidad'],
  flora: ['probiótico', 'intestinal', 'microbiota'],
  prebiotico: ['prebiótico', 'inulina', 'fibra'],
  prebioticos: ['prebiótico', 'inulina', 'fibra'],
  arabinogalactano: ['arabinogalactano', 'prebiótico', 'inmunidad'],
};

/**
 * Expande una lista de tokens de consulta con sus sinónimos y bigramas.
 * Devuelve los tokens originales, seguidos de los bigramas de palabras
 * (para frases compuestas) y finalmente los sinónimos inyectados.
 *
 * El motor de búsqueda marca como "sinónimos" los tokens que aparecen
 * después de los originales+bigramas (peso reducido ×0.5).
 */
export function expandQueryTokens(tokens: string[]): string[] {
  if (tokens.length === 0) return tokens;
  const expanded = [...tokens];
  // Bigramas de la consulta (frases compuestas del usuario)
  for (const bg of bigrams(tokens)) {
    if (!expanded.includes(bg)) expanded.push(bg);
  }
  // Sinónimos coloquiales (últimos → penalizados)
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

/** Devuelve los sinónimos coloquiales de un token (o null si no hay).
 *  Exposición read-only del diccionario para otros módulos (ej. el índice
 *  de patologías de SearchPage quiere expandir muelas→dental). */
export function getQuerySynonyms(token: string): string[] | null {
  return QUERY_SYNONYMS[token] ?? null;
}
