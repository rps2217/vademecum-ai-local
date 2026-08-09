/**
 * Sinónimos por indicación para resaltado contextual en fichas.
 *
 * Cuando un farmacéutico selecciona un chip (ej. "ansiedad") y abre la ficha
 * de un ingrediente, estas entradas determinan qué palabras del texto de
 * propiedades y mecanismo se resaltan con destacador amarillo.
 *
 * El mapa cubre las indicaciones más frecuentes. Para indicaciones no listadas,
 * se usa el término literal + su forma sin acentos.
 */

const SYNONYMS: Record<string, string[]> = {
  // --- Sistema nervioso ---
  ansiedad: ['ansiedad', 'ansiolítico', 'ansiolítica', 'ansiolytic', 'GABA', 'sedante', 'tranquilizante', 'relajante', 'cortisol', 'adaptógeno', 'adaptogeno'],
  insomnio: ['insomnio', 'sueño', 'sedante', 'GABA', 'melatonina', 'hipnótico', 'descanso'],
  estrés: ['estrés', 'estres', 'stress', 'cortisol', 'adaptógeno', 'adaptogeno', 'adaptógena', 'relajante'],
  depresion: ['depresión', 'depresion', 'serotonina', 'dopamina', 'antidepresivo', ' ánimo', 'humor'],
  cognitivo: ['cognitivo', 'cognición', 'memoria', 'concentración', 'cerebro', 'nootrópico', 'nootropico'],
  memoria: ['memoria', 'cognitivo', 'cognición', 'cerebro', 'nootrópico', 'nootropico', 'acetilcolina'],
  nerviosismo: ['nervioso', 'nerviosismo', 'sedante', 'GABA', 'calmante', 'relajante'],
  fatiga: ['fatiga', 'cansancio', 'astenia', 'energía', 'energia', 'energizante', 'vitalidad', 'tonificante'],
  energia: ['energía', 'energia', 'energizante', 'vitalidad', 'tonificante', 'estimulante', 'fatiga', 'cansancio'],
  concentracion: ['concentración', 'concentracion', 'foco', 'atención', 'cognitivo', 'nootrópico', 'nootropico'],

  // --- Respiratorio ---
  tos: ['tos', 'antitusivo', 'mucolítico', 'mucolitico', 'expectorante', 'garganta'],
  resfriado: ['resfriado', 'catarro', 'gripe', 'respiratorio', 'inmunidad', 'antiviral'],
  gripe: ['gripe', 'influenza', 'resfriado', 'antiviral', 'inmunidad', 'febrífugo', 'antipirético'],
  bronquitis: ['bronquitis', 'bronquial', 'expectorante', 'mucolítico', 'mucolitico', 'respiratorio'],
  asma: ['asma', 'bronquial', 'broncodilatador', 'antiespasmódico', 'respiratorio'],
  alergias: ['alergia', 'alérgico', 'alergico', 'antihistamínico', 'antihistaminico', 'hipersensibilidad'],
  sinusitis: ['sinusitis', 'sinusal', 'nasal', 'rinitis', 'congestión', 'congestion'],

  // --- Digestivo ---
  digestivo: ['digestivo', 'digestión', 'digestion', 'dispepsia', 'gástrico', 'gastrico', 'estómago', 'estomago'],
  dispepsia: ['dispepsia', 'digestivo', 'digestión', 'digestion', 'indigestión', 'indigestion', 'gástrico', 'gastrico'],
  gastritis: ['gastritis', 'gástrico', 'gastrico', 'estómago', 'estomago', 'úlcera', 'ulcera', 'mucosa'],
  refrijo: ['reflujo', 'refluj', 'gastroesofágico', 'acidez', 'pirosis', 'estómago', 'estomago'],
  estreñimiento: ['estreñimiento', 'estrenimiento', 'constipación', 'constipacion', 'laxante', 'tránsito', 'transito', 'fibra'],
  diarrea: ['diarrea', 'antidiarreico', 'astringente', 'intestinal', 'microbiota', 'probiótico', 'probiotico'],
  intestinal: ['intestinal', 'intestino', 'microbiota', 'probiótico', 'probiotico', 'prebiótico', 'prebiotico', 'flora'],
  nauseas: ['náusea', 'nausea', 'antiedad', 'vómito', 'vomito', 'gástrico', 'gastrico'],
  hepatico: ['hepático', 'hepatico', 'hígado', 'higado', 'colerético', 'coleretico', 'colagogo', 'hepatoprotector'],
  higado_graso: ['hígado', 'higado', 'hepático', 'hepatico', 'graso', 'esteatosis', 'hepatoprotector'],

  // --- Cardiovascular ---
  cardiovascular: ['cardiovascular', 'corazón', 'corazon', 'cardíaco', 'cardiaco', 'vascular', 'circulación', 'circulacion'],
  colesterol: ['colesterol', 'lipídico', 'lipidico', 'hipolipemiante', 'estatina', 'LDL', 'HDL', 'triglicéridos'],
  hipertension: ['hipertensión', 'hipertension', 'tensión', 'tension', 'presión', 'presion', 'vasodilatador', 'sanguínea'],
  circulacion: ['circulación', 'circulacion', 'vascular', 'venoso', 'vena', 'arterial', 'microcirculación', 'microcirculacion'],
  varices: ['varices', 'venoso', 'vena', 'insuficiencia venosa', 'circulación', 'circulacion', 'hemorroides'],
  hipotension: ['hipotensión', 'hipotension', 'tensión', 'tension', 'presión', 'presion', 'tonificante', 'vasoconstrictor'],

  // --- Metabólico ---
  glucosa: ['glucosa', 'glucémico', 'glucemico', 'insulina', 'glucemia', 'hipoglucemiante', 'azúcar', 'azucar'],
  diabetes: ['diabetes', 'diabético', 'diabetico', 'glucosa', 'insulina', 'hipoglucemiante', 'glucémico', 'glucemico'],
  metabolico: ['metabólico', 'metabolico', 'metabolismo', 'glucosa', 'insulina', 'lipídico', 'lipidico'],
  peso: ['peso', 'obesidad', 'saciedad', 'adipogénesis', 'termogénesis', 'termogenesis', 'metabolismo'],
  detox: ['detox', 'depurativo', 'depuración', 'depuracion', 'drenante', 'diurético', 'diuretico', 'antitóxico'],

  // --- Inmunidad ---
  inmunidad: ['inmunidad', 'inmune', 'inmunomodulador', 'inmunodefensa', 'defensas', 'antioxidante'],
  antioxidante: ['antioxidante', 'radical libre', 'oxidativo', 'estrés oxidativo', 'estres oxidativo', 'polifenol', 'flavonoide'],
  infeccion: ['infección', 'infeccion', 'antimicrobiano', 'antibacteriano', 'antiviral', 'antifúngico', 'antifungico', 'antiséptico'],
  candidiasis: ['candidiasis', 'cándida', 'candida', 'antifúngico', 'antifungico', 'hongos', 'micosis'],
  herpes: ['herpes', 'antiviral', 'HSV', 'labial', 'vesícula'],

  // --- Piel ---
  piel: ['piel', 'cutáneo', 'cutaneo', 'dermatológico', 'dermatologico', 'epidermis', 'colágeno', 'colageno'],
  dermatitis: ['dermatitis', 'eczema', 'eccema', 'cutáneo', 'cutaneo', 'piel', 'antiinflamatorio'],
  acne: ['acné', 'acne', 'sebáceo', 'sebaceo', 'seborrea', 'antibacteriano', 'antiinflamatorio'],
  cicatrizacion: ['cicatrización', 'cicatrizacion', 'cicatriz', 'regeneración', 'regeneracion', 'colágeno', 'colageno', 'epitelizante'],
  arrugas: ['arrugas', 'envejecimiento', 'antiedad', 'colágeno', 'colageno', 'elastina', 'antioxidante'],

  // --- Articular / huesos ---
  articular: ['articular', 'articulación', 'articulacion', 'artritis', 'artrosis', 'reumático', 'reumatico', 'inflamación articular'],
  osteoporosis: ['osteoporosis', 'óseo', 'oseo', 'hueso', 'huesos', 'calcio', 'densidad mineral', 'osteoblasto'],
  artritis: ['artritis', 'articular', 'inflamación articular', 'antiinflamatorio', 'reumático', 'reumatico'],
  dolor_muscular: ['muscular', 'músculo', 'musculo', 'mialgia', 'calambre', 'espasmo', 'relajante', 'antiespasmódico'],
  dolor: ['dolor', 'analgésico', 'anestesico', 'analgésico', 'antiinflamatorio', 'calmante'],

  // --- Hormonal / femenino ---
  menopausia: ['menopausia', 'sofoco', 'bochorno', 'estrógeno', 'estrogeno', 'fitoestrógeno', 'fitoestrogeno', 'hormonal'],
  menstrual: ['menstrual', 'menstruación', 'menstruacion', 'dismenorrea', 'cólico', 'colico', 'SPM', 'premenstrual'],
  fertilidad: ['fertilidad', 'fértil', 'fertil', 'reproductivo', 'hormonal', 'estrógeno', 'estrogeno', 'espermatogénesis'],
  hormonal: ['hormonal', 'hormona', 'estrógeno', 'estrogeno', 'progesterona', 'testosterona', 'endocrino'],
  libido: ['libido', 'deseo sexual', 'afrodisíaco', 'afrodisiaco', 'sexual', 'testosterona'],

  // --- Ocular ---
  ocular: ['ocular', 'ojo', 'visión', 'vision', 'macular', 'retina', 'luteína', 'luteina', 'zeaxantina'],
  ojo_seco: ['ojo seco', 'ocular', 'lagrimal', 'lubricante', 'visión', 'vision'],

  // --- Urinario ---
  urinario: ['urinario', 'orina', 'vesical', 'vejiga', 'diurético', 'diuretico', 'renal', 'cistitis'],
  cistitis: ['cistitis', 'urinario', 'vejiga', 'urinario', 'antibacteriano', 'diurético', 'diuretico'],

  // --- Otros ---
  inflamacion: ['inflamación', 'inflamacion', 'antiinflamatorio', 'inflamatorio'],
  anemia: ['anemia', 'hierro', 'hemoglobina', 'eritrocito', 'hematíes', 'hematies', 'férrico', 'ferrico'],
  tiroides: ['tiroides', 'tiroideo', 'hipotiroidismo', 'hipertiroidismo', 'yodo', 'tiroxina'],
  parkinson: ['parkinson', 'dopaminérgico', 'dopaminergico', 'dopamina', 'neurodegenerativo', 'temblor'],
  alzheimer: ['alzheimer', 'acetilcolina', 'colinérgico', 'colinergico', 'neurodegenerativo', 'amiloide', 'memoria'],
};

/**
 * Construye la lista de términos a resaltar para una indicación dada.
 *
 * - Si la indicación está en el mapa de sinónimos, usa esos términos.
 * - Siempre añade el término literal (con y sin acentos) como fallback.
 * - Devuelve términos únicos, sin duplicados.
 */
export function buildHighlightTerms(indication: string | undefined | null): string[] {
  if (!indication) return [];

  const key = indication.toLowerCase().trim();
  const terms = new Set<string>();

  const mapped = SYNONYMS[key];
  if (mapped) {
    for (const t of mapped) {
      if (t.trim()) terms.add(t.trim());
    }
  }

  // Fallback: término literal (en minúsculas) + sin acentos
  const literal = indication.trim().toLowerCase();
  terms.add(literal);
  const noAccents = literal
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (noAccents !== literal) terms.add(noAccents);

  // Palabras individuales de indicaciones compuestas (ej. "dolor muscular" → "dolor", "muscular")
  const words = literal.split(/\s+/).filter(w => w.length >= 4);
  for (const w of words) {
    terms.add(w);
    terms.add(w.normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
  }

  return Array.from(terms);
}

