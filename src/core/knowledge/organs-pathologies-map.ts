/**
 * Mapeo de Órganos y Patologías a Categorías/Ingredientes
 * Sistema de búsqueda por órganos del cuerpo humano
 */

export interface OrganMapping {
  organ: string;
  aliases: string[];
  pathologies: string[];
  categories: string[];
  ingredients: string[];
  description: string;
}

export const ORGANS_PATHOLOGIES_MAP: OrganMapping[] = [
  // Sistema Digestivo
  {
    organ: 'hígado',
    aliases: ['hepatico', 'hepática', 'liver', 'hepatic', 'figado', 'fígado'],
    pathologies: ['hepatitis', 'cirrosis', 'esteatosis', 'hígado graso', 'vesícula', 'cálculos biliares', 'ictericia', 'detox', 'desintoxicación'],
    categories: ['hepatoprotector', 'digestivo', 'colerético', 'colagogo'],
    ingredients: ['cardo mariano', 'alcachofa', 'diente de leon', 'colina', 'metionina', 'nacetilcisteina', 'sam-e', 'schisandra', 'curcuma'],
    description: 'El hígado es el órgano más grande del cuerpo, responsable de más de 500 funciones vitales.'
  },
  {
    organ: 'estómago',
    aliases: ['gastrico', 'gástrica', 'gastro', 'stomach', 'gastric', 'estomago', 'estómago'],
    pathologies: ['gastritis', 'úlcera', 'reflujo', 'acidez', 'dispepsia', 'náuseas', 'vómitos', 'ardor', 'indigestión'],
    categories: ['gastroprotector', 'antiácido', 'digestivo'],
    ingredients: ['regaliz', 'manzanilla', 'melisa', 'aloe vera', 'calendula', 'nacetilcisteina'],
    description: 'El estómago almacena alimentos y los mezcla con ácidos digestivos.'
  },
  {
    organ: 'intestino',
    aliases: ['intestinal', 'intestinos', 'bowel', 'gut', 'flora intestinal', 'colon'],
    pathologies: ['estreñimiento', 'diarrea', 'síndrome intestino irritable', 'sii', 'gases', 'flatulencia', 'colon irritable', 'divertículos'],
    categories: ['laxante', 'antiflatulento', 'prebiótico', 'probiótico'],
    ingredients: ['psyllium', 'inulina', 'fibra', 'probióticos', 'lactobacillus', 'bifidobacterium', 'manzanilla', 'menta piperita', 'regaliz'],
    description: 'El intestino es donde se absorbe la mayoría de nutrientes y se elimina desechos.'
  },
  {
    organ: 'páncreas',
    aliases: ['pancreatico', 'pancreática', 'pancreas', 'pancreatic'],
    pathologies: ['pancreatitis', 'diabetes', 'insulinorresistencia', 'glucosa alta', 'azúcar alta'],
    categories: ['pancreático', 'antidiabético', 'regulador glucosa'],
    ingredients: ['cromo', 'magnesio', 'canela', 'alfa lipoico', 'cromo'],
    description: 'El páncreas produce insulina y enzimas digestivas.'
  },
  {
    organ: 'vesícula',
    aliases: ['vesicular', 'vesicula biliar', 'gallbladder', 'bile'],
    pathologies: ['cálculos biliares', 'colelitiasis', 'colecistitis', 'discinesia biliar'],
    categories: ['colerético', 'colagogo', 'litolítico'],
    ingredients: ['alcachofa', 'cardo mariano', 'menta piperita', 'curcuma'],
    description: 'La vesícula almacena bilis producida por el hígado.'
  },

  // Sistema Respiratorio
  {
    organ: 'pulmón',
    aliases: ['pulmonar', 'lung', 'pulmonary', 'pulmones'],
    pathologies: ['tos', 'bronquitis', 'asma', 'gripe', 'resfriado', 'neumonía', 'enfisema', 'epoc', 'alergia respiratoria', 'sinusitis', 'rinitis', 'faringitis', 'amigdalitis'],
    categories: ['expectorante', 'antitusivo', 'antiviral', 'inmunomodulador'],
    ingredients: ['equinacea', 'propoleo', 'tomillo', 'hisopo', 'gordolobo', 'pelargonio', 'ajo', 'zinc', 'vitamina c'],
    description: 'Los pulmones intercambian oxígeno y dióxido de carbono.'
  },
  {
    organ: 'nariz',
    aliases: ['nasal', 'sinus', 'sinusal', 'sinuses', 'rinitis', 'sinusitis'],
    pathologies: ['sinusitis', 'rinitis', 'congestión nasal', 'alergia nasal', 'poliposis'],
    categories: ['descongestionante', 'antialérgico'],
    ingredients: ['plantago', 'pelargonio', 'equinacea', 'vitamina c', 'quercetina'],
    description: 'La nariz filtra, calienta y humedece el aire que respiramos.'
  },
  {
    organ: 'garganta',
    aliases: ['faringe', 'faringeo', 'fauces', 'throat', 'pharynx', 'laringe', 'laryngeal'],
    pathologies: ['faringitis', 'laringitis', 'amigdalitis', 'dolor garganta', 'tos seca', 'ronquera'],
    categories: ['antiséptico', 'antiinflamatorio', 'emoliente'],
    ingredients: ['propoleo', 'salvia', 'tomillo', 'equinacea', 'regaliz'],
    description: 'La garganta conecta la boca con el esófago y la tráquea.'
  },

  // Sistema Cardiovascular
  {
    organ: 'corazón',
    aliases: ['cardiaco', 'cardíaca', 'corazon', 'heart', 'cardiac', 'cardiovascular'],
    pathologies: ['insuficiencia cardíaca', 'arritmia', 'palpitaciones', 'angina', 'infarto', 'cardiopatía', 'taquicardia', 'bradicardia'],
    categories: ['cardiotónico', 'antiarrítmico', 'vasodilatador'],
    ingredients: ['espino blanco', 'muérdago', 'coq10', 'magnesio', 'potasio', 'omega-3', 'ajo'],
    description: 'El corazón bombea sangre a todo el cuerpo.'
  },
  {
    organ: 'arterias',
    aliases: ['arterial', 'arteries', 'vascular', 'vasculatura'],
    pathologies: ['aterosclerosis', 'arteriosclerosis', 'hipertensión', 'presión alta', 'colesterol alto', 'triglicéridos altos'],
    categories: ['vasodilatador', 'antihipertensivo', 'hipolipemiante'],
    ingredients: ['ajo', 'espino blanco', 'olivo', 'omega-3', 'coq10', 'curcuma', 'resveratrol'],
    description: 'Las arterias transportan sangre oxigenada desde el corazón.'
  },
  {
    organ: 'venas',
    aliases: ['venoso', 'venosa', 'veins', 'venous', 'circulación', 'circulacion'],
    pathologies: ['varices', 'hemorroides', 'flebitis', 'trombosis', 'piernas pesadas', 'edema', 'hinchazón'],
    categories: ['venotónico', 'anticoagulante', 'antiinflamatorio'],
    ingredients: ['hamamelis', 'castaño Indias', 'espino blanco', 'gotu kola', 'omega-3'],
    description: 'Las venas devuelven la sangre al corazón.'
  },

  // Sistema Nervioso
  {
    organ: 'cerebro',
    aliases: ['cerebral', 'encefalo', 'encéfalo', 'brain', 'cognitive', 'cognitivo', 'mental'],
    pathologies: ['memoria', 'concentración', 'demencia', 'alzheimer', 'parkinson', 'ictus', 'stroke', 'deterioro cognitivo', 'niebla mental'],
    categories: ['nootrópico', 'neuroprotector', 'estimulante cognitivo'],
    ingredients: ['ginkgo', 'bacopa', 'omega-3', 'curcuma', 'l-teanina', 'phosphatidylserine'],
    description: 'El cerebro controla pensamiento, memoria, emociones y movimientos.'
  },
  {
    organ: 'nervios',
    aliases: ['nervioso', 'neuralgia', 'neuropatia', 'neuropatía', 'nerve', 'nerves'],
    pathologies: ['neuropatía', 'ciática', 'dolor neuropático', 'neuralgia', 'túnel carpiano', 'radiculopatía'],
    categories: ['neuroprotector', 'analgésico', 'antiinflamatorio'],
    ingredients: ['alfa lipoico', 'vitamina b1', 'b12', 'magnesio'],
    description: 'Los nervios transmiten señales eléctricas por todo el cuerpo.'
  },
  {
    organ: 'sueño',
    aliases: ['dormir', 'insomnio', 'sleep', 'sueño', 'melatonina', 'noche'],
    pathologies: ['insomnio', 'dificultad conciliar sueño', 'sueño fragmentado', 'pesadillas', 'jet lag', 'trastorno sueño'],
    categories: ['sedante', 'hipnótico', 'regulador ritmo circadiano'],
    ingredients: ['melatonina', 'valeriana', 'pasiflora', 'l-teanina', 'gaba', 'magnesio', 'tila', 'glicina'],
    description: 'El sueño es esencial para la recuperación del cuerpo y cerebro.'
  },
  {
    organ: 'ansiedad',
    aliases: ['ansioso', 'angustia', 'nervios', 'anxiety', 'stress', 'estrés', 'nerviosismo'],
    pathologies: ['ansiedad', 'estrés', 'ataques pánico', 'fobia', 'preocupación excesiva', 'nerviosismo'],
    categories: ['ansiolítico', 'adaptógeno'],
    ingredients: ['ashwagandha', 'kava', 'pasiflora', 'l-teanina', 'magnesio', 'gaba', 'rodiola', 'valeriana', 'griffonia', '5htp'],
    description: 'La ansiedad es una respuesta natural al estrés.'
  },
  {
    organ: 'depresión',
    aliases: ['depresion', 'depressive', 'depression', 'tristeza', 'melancolía'],
    pathologies: ['depresión', 'tristeza', 'falta motivación', 'apatía', 'trastorno afectivo'],
    categories: ['antidepresivo', 'euforizante', 'regulador serotonina'],
    ingredients: ['5htp', 'griffonia', 'sam-e', 'hipérico', 'gaba', 'omega-3', 'vitamina d', 'tirosina'],
    description: 'La depresión afecta el estado de ánimo, pensamientos y comportamiento.'
  },

  // Sistema Musculoesquelético
  {
    organ: 'huesos',
    aliases: ['óseo', 'bone', 'bones', 'osteoporosis', 'osseous'],
    pathologies: ['osteoporosis', 'osteopenia', 'fracturas', 'fragilidad ósea', 'déficit calcio'],
    categories: ['remineralizante', 'anti-resortivo'],
    ingredients: ['calcio', 'vitamina d', 'vitamina k2', 'magnesio', 'boro', 'colageno', 'silicio'],
    description: 'Los huesos proporcionan estructura y protección al cuerpo.'
  },
  {
    organ: 'articulaciones',
    aliases: ['articular', 'joint', 'joints', 'artritis', 'artrose', 'artrosis'],
    pathologies: ['artritis', 'artrosis', 'osteoartritis', 'artritis reumatoide', 'dolor articular', 'rigidez', 'inflamación articular'],
    categories: ['antiinflamatorio', 'condroprotector', 'analgésico'],
    ingredients: ['glucosamina', 'condroitina', 'colageno', 'msm', 'harpagofito', 'curcuma', 'omega-3'],
    description: 'Las articulaciones conectan huesos y permiten el movimiento.'
  },
  {
    organ: 'músculos',
    aliases: ['muscular', 'muscle', 'muscles', 'musculo', 'músculo'],
    pathologies: ['calambres', 'dolores musculares', 'fatiga muscular', 'fibromialgia', 'miopatía', 'tirones'],
    categories: ['relajante muscular', 'antiinflamatorio', 'energizante'],
    ingredients: ['magnesio', 'potasio', 'creatina', 'coq10', 'omega-3', 'vitamina d'],
    description: 'Los músculos permiten el movimiento del cuerpo.'
  },

  // Sistema Urinario
  {
    organ: 'riñón',
    aliases: ['renal', 'kidney', 'renales', 'kidneys', 'rinon'],
    pathologies: ['insuficiencia renal', 'cálculos renales', 'piedras', 'nefritis', 'infección renal', 'pielonefritis'],
    categories: ['diurético', 'nefroprotector', 'litolítico'],
    ingredients: ['cola de caballo', 'gayuba', 'ortiga', 'abedul', 'vara de oro'],
    description: 'Los riñones filtran la sangre y eliminan desechos.'
  },
  {
    organ: 'vejiga',
    aliases: ['vesical', 'bladder', 'cistitis'],
    pathologies: ['cistitis', 'infección urinaria', 'cistitis intersticial', 'incontinencia', 'vejiga hiperactiva'],
    categories: ['antiséptico urinario', 'antiinflamatorio'],
    ingredients: ['gayuba', 'cranberry', 'uva ursi', 'ortiga', 'propoleo'],
    description: 'La vejiga almacena orina antes de ser eliminada.'
  },
  {
    organ: 'próstata',
    aliases: ['prostatico', 'prostatitis', 'prostate', 'hiperplasia benigna', 'hpb'],
    pathologies: ['prostatitis', 'hipertrofia prostática', 'próstata agrandada', 'dificultad orinar'],
    categories: ['antiprostatico', 'antiinflamatorio', 'antioxidante'],
    ingredients: ['saw palmetto', 'ortiga', 'semillas calabaza', 'zinc', 'licopeno'],
    description: 'La próstata produce líquido seminal.'
  },

  // Sistema Endocrino
  {
    organ: 'tiroides',
    aliases: ['tiroideo', 'thyroid', 'tiroides', 'hipotiroidismo', 'hipertiroidismo'],
    pathologies: ['hipotiroidismo', 'hipertiroidismo', 'tiroiditis', 'hashimoto', 'bocio'],
    categories: ['regulador tiroideo', 'antitiroideo'],
    ingredients: ['selenio', 'zinc', 'vitamina d', 'l tirosina', 'ashwagandha'],
    description: 'La tiroides regula el metabolismo y la energía.'
  },
  {
    organ: 'suprarrenales',
    aliases: ['adrenal', 'adrenalina', 'cortisol', 'suprarrenal'],
    pathologies: ['fatiga adrenal', 'insuficiencia suprarrenal', 'síndrome cushing'],
    categories: ['adaptógeno', 'regulador cortisol', 'anti-estres'],
    ingredients: ['ashwagandha', 'rodiola', 'ginseng', 'magnesio', 'fosfatidilserina'],
    description: 'Las suprarrenales producen hormonas del estrés.'
  },

  // Sistema Inmunológico
  {
    organ: 'inmune',
    aliases: ['inmunologico', 'inmunológico', 'immune', 'immunity', 'defensas', 'inmunidad'],
    pathologies: ['inmunodeficiencia', 'infecciones recurrentes', 'autoinmunidad', 'alergias', 'inmunidad baja'],
    categories: ['inmunomodulador', 'inmunoestimulante'],
    ingredients: ['equinacea', 'propoleo', 'vitamina c', 'vitamina d', 'zinc', 'selenio', 'reishi'],
    description: 'El sistema inmune protege contra infecciones y enfermedades.'
  },

  // Sistema Reproductor
  {
    organ: 'ováros',
    aliases: ['ovario', 'ovarios', 'ovarian', 'hormonas femeninas', 'estrogeno', 'progesterona'],
    pathologies: ['síndrome ovario poliquístico', 'menopausia', 'sofocos', 'irregularidades menstruales'],
    categories: ['regulador hormonal', 'fitoestrogeno'],
    ingredients: ['isoflavonas', 'omega-3', 'magnesio', 'vitamina b6'],
    description: 'Los ovarios producen óvulos y hormonas femeninas.'
  },
  {
    organ: 'testículos',
    aliases: ['testiculo', 'testosterona', 'testosterone', 'masculino', 'fertilidad masculina'],
    pathologies: ['hipogonadismo', 'infertilidad masculina', 'baja testosterona', 'disfunción eréctil'],
    categories: ['androgeno', 'anabolizante', 'fertilizante'],
    ingredients: ['zinc', 'magnesio', 'vitamina d', 'ashwagandha', 'l carnitina', 'coq10'],
    description: 'Los testículos producen testosterona y esperma.'
  },

  // Piel y Anexos
  {
    organ: 'piel',
    aliases: ['cutaneous', 'dermis', 'epidermis', 'skin'],
    pathologies: ['eccema', 'dermatitis', 'psoriasis', 'acné', 'heridas', 'cicatrices', 'envejecimiento', 'arrugas', 'manchas'],
    categories: ['dermatoprotector', 'cicatrizante', 'antiaging', 'antiacné'],
    ingredients: ['colageno', 'vitamina c', 'vitamina e', 'zinc', 'biotina', 'resveratrol', 'astaxantina'],
    description: 'La piel es el órgano más grande del cuerpo.'
  },
  {
    organ: 'cabello',
    aliases: ['pelo', 'hair', 'alopecia', 'calvicie', 'canas'],
    pathologies: ['alopecia', 'caída cabello', 'cabello quebradizo', 'canas prematuras', 'caspa'],
    categories: ['anticaída', 'fortalecedor', 'anticaspa'],
    ingredients: ['biotina', 'zinc', 'colageno', 'silicio', 'hierro'],
    description: 'El cabello protege el cuero cabelludo y ayuda a regular temperatura.'
  },
  {
    organ: 'uñas',
    aliases: ['unguis', 'nails', 'nail'],
    pathologies: ['uñas frágiles', 'uñas quebradizas', 'hongos uñas', 'onicomicosis'],
    categories: ['fortalecedor', 'antimicótico'],
    ingredients: ['biotina', 'colageno', 'silicio', 'zinc', 'hierro'],
    description: 'Las uñas protegen las puntas de los dedos.'
  },

  // Órganos de los Sentidos
  {
    organ: 'ojos',
    aliases: ['ocular', 'vision', 'visión', 'vista', 'eyes', 'ocular'],
    pathologies: ['degeneración macular', 'cataratas', 'glaucoma', 'ojo seco', 'fatiga visual', 'retinopatía'],
    categories: ['neuroprotector ocular', 'antioxidante ocular', 'lubricante'],
    ingredients: ['luteina', 'zeaxantina', 'astaxantina', 'zinc', 'omega-3', 'vitamina a', 'coq10', 'ginkgo'],
    description: 'Los ojos permiten la visión del mundo.'
  },
  {
    organ: 'oído',
    aliases: ['auditivo', 'audicion', 'hearing', 'ears', 'otico', 'ótico', 'tinnitus', 'acúfenos'],
    pathologies: ['tinnitus', 'acúfenos', 'pérdida audición', 'vértigo', 'mareos', 'enfermedad meniere', 'otitis'],
    categories: ['otoprotector', 'antivertiginoso', 'vasodilatador auditivo'],
    ingredients: ['ginkgo', 'zinc', 'magnesio', 'coq10', 'alfa lipoico', 'vitamina b12'],
    description: 'El oído permite la audición y el equilibrio.'
  },

  // Salud General
  {
    organ: 'energía',
    aliases: ['fatiga', 'cansancio', 'astenia', 'energia', 'fatiga cronica', 'low energy', 'fatigue'],
    pathologies: ['fatiga', 'cansancio', 'astenia', 'burnout', 'agotamiento', 'letargo', 'somnolencia'],
    categories: ['energizante', 'adaptógeno', 'tonificante'],
    ingredients: ['ginseng', 'maca', 'coq10', 'magnesio', 'vitaminas grupo b', 'hierro', 'ashwagandha', 'cordyceps'],
    description: 'La energía permite realizar actividades diarias.'
  },
  {
    organ: 'antioxidante',
    aliases: ['antioxidante', 'antioxidantes', 'antioxidant', 'radicales libres', 'estrés oxidativo'],
    pathologies: ['estrés oxidativo', 'envejecimiento prematuro', 'daño celular', 'inflamación crónica'],
    categories: ['antioxidante', 'antiaging', 'citoprotector'],
    ingredients: ['vitamina c', 'vitamina e', 'resveratrol', 'astaxantina', 'coq10', 'alfa lipoico', 'selenio', 'zinc'],
    description: 'Los antioxidantes protegen contra el daño de radicales libres.'
  },
  {
    organ: 'detox',
    aliases: ['desintoxicación', 'detoxificacion', 'limpieza', 'purificacion', 'detoxification', 'cleanse'],
    pathologies: ['acumulación toxinas', 'exposición metales pesados', 'sobrecarga hepática', 'colon tapizado'],
    categories: ['desintoxicante', 'quelante', 'drenante'],
    ingredients: ['clorella', 'spirulina', 'curcuma', 'cardo mariano', 'nacetilcisteina', 'alfa lipoico', 'psyllium'],
    description: 'La desintoxicación elimina sustancias nocivas del cuerpo.'
  },
  {
    organ: 'peso',
    aliases: ['obesidad', 'sobrepeso', 'adelgazar', 'bajar peso', 'metabolismo', 'weight', 'slim'],
    pathologies: ['obesidad', 'sobrepeso', 'metabolismo lento', 'dificultad perder peso', 'retención líquidos'],
    categories: ['termogénico', 'supresor apetito', 'quemador grasa', 'metabólico'],
    ingredients: ['green tea', 'cafeína', 'cromo', 'l carnitina', 'fibra', 'capsaicina'],
    description: 'El control de peso implica dieta, ejercicio y metabolismo.'
  }
];

// Función para buscar por órgano o patología
export function findByOrganOrPathology(query: string): OrganMapping[] {
  const normalizedQuery = query.toLowerCase().trim();
  
  return ORGANS_PATHOLOGIES_MAP.filter(mapping => {
    // Buscar en nombre del órgano
    if (mapping.organ.toLowerCase().includes(normalizedQuery)) return true;
    
    // Buscar en alias
    if (mapping.aliases.some(alias => alias.toLowerCase().includes(normalizedQuery))) return true;
    
    // Buscar en patologías
    if (mapping.pathologies.some(path => path.toLowerCase().includes(normalizedQuery))) return true;
    
    return false;
  });
}

// Función para obtener todos los órganos disponibles
export function getAllOrgans(): string[] {
  return ORGANS_PATHOLOGIES_MAP.map(m => m.organ);
}

// Función para obtener todas las patologías disponibles
export function getAllPathologies(): string[] {
  const pathologies = new Set<string>();
  ORGANS_PATHOLOGIES_MAP.forEach(m => {
    m.pathologies.forEach(p => pathologies.add(p));
  });
  return Array.from(pathologies).sort();
}

// Función para buscar ingredientes relacionados con un órgano
export function getIngredientsForOrgan(organQuery: string): string[] {
  const results = findByOrganOrPathology(organQuery);
  const ingredients = new Set<string>();
  results.forEach(r => {
    r.ingredients.forEach(i => ingredients.add(i));
  });
  return Array.from(ingredients);
}
