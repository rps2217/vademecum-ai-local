/**
 * Base de Datos de Homeopatía - Remedios Homeopáticos
 * 
 * Incluye remedios según la materia médica homeopática:
 * - Nombre del remedio
 * - Origen (mineral, vegetal, animal)
 * - Síntomas principales (clave)
 * - Indicaciones por sistema
 * - Modalidades (peor/mejor con...)
 */

import { IngredientInfo, IngredientCategory, HealthObjective, Contraindicacion } from './types';

// Helper para crear remedio homeopático
function createRemedy(
  id: string,
  nombre: string,
  origen: string,
  descripcion: string,
  sintomasClave: string[],
  indicaciones: string[],
  objetivos: HealthObjective[],
  posologia: string,
  sinergias: { id: string; tipo: 'potenciador' | 'complementario'; desc: string }[],
  opts: {
    modal?: string;
    contraindicaciones?: Contraindicacion[];
  } = {}
): IngredientInfo {
  return {
    id,
    nombre,
    nombre_latin: origen,
    categoria: 'homeopaticos',
    descripcion: `${origen}. ${descripcion}`,
    mecanismo_accion: descripcion,
    beneficios: indicaciones,
    dosis_recomendada: posologia,
    contraindicaciones: opts.contraindicaciones || [],
    sinergias: sinergias.map(s => ({
      ingrediente_id: s.id,
      tipo: s.tipo,
      descripcion: s.desc,
      nivel: 'alto' as const
    })),
    antagonismos: []
  };
}

export const HOMEOPATHY_DATABASE: Record<string, IngredientInfo> = {

  // ==================== REMEDIOS PARA SISTEMA NERVIOSO ====================

  'arnica_homeo': createRemedy(
    'arnica_homeo',
    'Arnica Montana',
    'Vegetal (Compuesta)',
    'El remedio del trauma por excelencia. Para golpes, contusiones y shock.',
    ['Shock traumático', 'Miedo a ser tocado', 'Fatiga extrema', '"Déjame en paz"'],
    ['Golpes', 'Contusiones', 'Traumatismos', 'Post-operatorio', 'Fatiga muscular'],
    ['articula'],
    '5CH: 3 gránulos cada 15 min (agudos), 3x día (crónicos)',
    [
      { id: 'bellis', tipo: 'potenciador', desc: 'Traumatismos tejidos profundos' },
      { id: 'rhux_tox', tipo: 'complementario', desc: 'Huesos y periostio' }
    ],
    { modal: 'Peor: tacto, movimiento, frío. Mejor: acostado, cabeza baja.' }
  ),

  'nux_vomica': createRemedy(
    'nux_vomica',
    'Nux Vomica',
    'Vegetal (Estricnina)',
    'Remedio para trastornos digestivos y irritabilidad. El "tipo A" homeopático.',
    ['Irritable', 'Impaciente', 'Estreñido', 'Nauseas matutinas', 'Resaca'],
    ['Digestión', 'Estreñimiento', 'Náuseas', 'Migraña', 'Estrés'],
    ['digestion', 'cerebro'],
    '9CH: 3 gránulos, 3x día. AGUDOS: cada hora',
    [
      { id: 'lycopodium', tipo: 'potenciador', desc: 'Digestión difícil con gases' },
      { id: 'bryonia', tipo: 'complementario', desc: 'Estreñimiento con sequedad' }
    ],
    { modal: 'Peor: frío,清晨, estrés. Mejor: calor, noche.' }
  ),

  'chamomilla': createRemedy(
    'chamomilla',
    'Chamomilla',
    'Vegetal (Manzanilla)',
    'Para dolor insoportable y niños irritables. Sensibilidad extrema.',
    ['Dolor insoportable', 'Irritabilidad extrema', 'Un lado de la cara rojo', 'Dientes apretados'],
    ['Dolor', 'Cólicos', 'Dentición', 'Otitis', 'Insomnio irritable'],
    ['articula', 'sueno'],
    '9CH: 3 gránulos, 3x día. AGUDOS: cada 30 min',
    [
      { id: 'mag_phos', tipo: 'potenciador', desc: 'Calambres y espasmos' },
      { id: 'belladonna', tipo: 'complementario', desc: 'Inflamación aguda' }
    ],
    { modal: 'Peor: noche, calor, cólicos. Mejor: siendo cargado.' }
  ),

  'ignatia': createRemedy(
    'ignatia',
    'Ignatia Amara',
    'Vegetal (Frijol de San Ignacio)',
    'Para chagrin y pérdidas emocionales. Contradicciones típicas.',
    ['Tristeza', 'Suspiros', 'Nudo en garganta', 'Insomnio por preocupación', 'Contradicciones'],
    ['Duelo', 'Angustia', 'Insomnio', 'Migraña emocional', 'Tos nerviosa'],
    ['cerebro', 'sueno'],
    '9CH: 3 gránulos, 3x día',
    [
      { id: 'nat_mur', tipo: 'potenciador', desc: 'Tristeza con aislamiento' },
      { id: 'pulsatilla', tipo: 'complementario', desc: 'Necesidad de consuelo' }
    ],
    { modal: 'Peor: emociones, café, tabaco. Mejor: distracción, calor.' }
  ),

  'gelsemium': createRemedy(
    'gelsemium',
    'Gelsemium Sempervirens',
    'Vegetal (Gelsemio)',
    'Para debilidad y temblores. Gripal y exámenes.',
    ['Pesadez', 'Temblores', 'Miedo', 'Sin sed', 'Gripal con Postración'],
    ['Gripe', 'Ansiedad anticipatoria', 'Migraña', 'Fiebre', 'Exámenes'],
    ['inmunidad', 'cerebro'],
    '9CH: 3 gránulos, cada hora (agudos), 2x día (prevención)',
    [
      { id: 'belladonna', tipo: 'potenciador', desc: 'Gripe con fiebre alta' },
      { id: 'bryonia', tipo: 'complementario', desc: 'Gripe con sequedad' }
    ],
    { modal: 'Peor: cambio de tiempo, anticipación. Mejor: sudor, acostado.' }
  ),

  ' coffea_cruda': createRemedy(
    'coffea_cruda',
    'Coffea Cruda',
    'Vegetal (Café)',
    'Para hipersensibilidad y sobreexcitación mental.',
    ['Excitación mental', 'Insomnio por ideas', 'Dolores empeoran con frío', 'Euforia'],
    ['Insomnio', 'Excitación', 'Dolor agudo', 'Hipersensibilidad', 'Neuralgia'],
    ['sueno', 'cerebro'],
    '9CH: 3 gránulos, 3x día. AGUDOS: cada hora',
    [
      { id: 'chamomilla', tipo: 'potenciador', desc: 'Dolor insoportable' },
      { id: 'ignatia', tipo: 'complementario', desc: 'Insomnio emocional' }
    ],
    { modal: 'Peor: emociones, contacto, ruido. Mejor: acostado, oscuridad.' }
  ),

  'valeriana_homeo': createRemedy(
    'valeriana_homeo',
    'Valeriana',
    'Vegetal',
    'Para temblores y espasmos con agitation interna.',
    ['Temblor', 'Agitación interna', 'Insomnio', 'Espasmos', 'Pesadillas'],
    ['Insomnio', 'Temblores', 'Espasmos', 'Ansiedad', 'Nerviosismo'],
    ['sueno', 'cerebro'],
    '9CH: 3 gránulos, 3x día',
    [
      { id: 'ignatia', tipo: 'potenciador', desc: 'Insomnio emocional' },
      { id: ' coffea_cruda', tipo: 'complementario', desc: 'Excitación mental' }
    ],
    { modal: 'Peor: noche, sobresaltos. Mejor: movimiento.' }
  ),

  // ==================== REMEDIOS PARA DIGESTIÓN ====================

  'lycopodium': createRemedy(
    'lycopodium',
    'Lycopodium Clavatum',
    'Vegetal (Licopodio)',
    'Para digestiones difíciles con gases. Abdomen distendido.',
    ['Gases', 'Abdomen hinchado', 'Hambre que desaparece rápido', 'Poca sed', 'Derecha>Izquierda'],
    ['Digestión lenta', 'Gases', 'Estreñimiento', 'Hemorroides', 'Cólicos'],
    ['digestion'],
    '9CH: 3 gránulos, 3x día',
    [
      { id: 'carbo_veg', tipo: 'potenciador', desc: 'Gases con flatulencia' },
      { id: 'nux_vomica', tipo: 'complementario', desc: 'Digestión tóxica' }
    ],
    { modal: 'Peor: 16-20h, comidas. Mejor: bebidas calientes, soltar gases.' }
  ),

  'carbo_veg': createRemedy(
    'carbo_veg',
    'Carbo Vegetabilis',
    'Mineral (Carbón vegetal)',
    'El "revividor". Para agotamiento con necesidad de aire.',
    ['Agotamiento extremo', 'Necesita abanico', 'Gases putrefactos', 'Cara fría', 'Pulso débil'],
    ['Indigestión', 'Gases', 'Atonía digestiva', 'Resaca', 'Post-cirugía'],
    ['digestion', 'energia'],
    '9CH: 3 gránulos, cada 15 min (agudos), 3x día (crónicos)',
    [
      { id: 'lycopodium', tipo: 'potenciador', desc: 'Gases crónicos' },
      { id: 'chinensis', tipo: 'complementario', desc: 'Agotamiento con gases' }
    ],
    { modal: 'Peor: noche, grasas, vino. Mejor: abanicarse, eructos.' }
  ),

  'bryonia': createRemedy(
    'bryonia',
    'Bryonia Alba',
    'Vegetal (Nabo salvaje)',
    'Para inflamación con sequedad. Todo empeora con movimiento.',
    ['Sequedad de mucosas', 'Sed intensa', 'Irritabilidad', 'Labios agrietados', 'Estreñimiento'],
    ['Gripe', 'Estreñimiento', 'Neumonía', 'Articulaciones', 'Dolor pleural'],
    ['articula', 'inmunidad'],
    '9CH: 3 gránulos, cada hora (agudos), 3x día (crónicos)',
    [
      { id: 'rhus_tox', tipo: 'potenciador', desc: 'Rigidez articular' },
      { id: 'nux_vomica', tipo: 'complementario', desc: 'Estreñimiento' }
    ],
    { modal: 'Peor: movimiento, calor, tacto. Mejor: presión, acostado, frío.' }
  ),

  'aloe': createRemedy(
    'aloe_homeo',
    'Aloe Socotrina',
    'Vegetal',
    'Para diarrea urgente con gases y hemorroides.',
    ['Diarrea Urgente', 'Hemorroides', 'Gases', 'Sensación de peso pélvico'],
    ['Diarrea', 'Hemorroides', 'Gases', 'Colon irritable'],
    ['digestion'],
    '9CH: 3 gránulos, 3x día',
    [
      { id: 'podophyllum', tipo: 'potenciador', desc: 'Diarrea mañana' },
      { id: 'lycopodium', tipo: 'complementario', desc: 'Gases crónicos' }
    ],
    { modal: 'Peor: madrugada, calor, después de comer. Mejor: fría, aplicaciones frías.' }
  ),

  'podophyllum': createRemedy(
    'podophyllum',
    'Podophyllum Peltatum',
    'Vegetal (Manzana de Mayo)',
    'Para diarrea profusa con debilidad. Alterna con estreñimiento.',
    ['Diarrea explosiva', 'Gruñidos abdominales', 'Debilidad post-diarrea', 'Golpea la cabeza (niños)'],
    ['Diarrea', 'Gastroenteritis', 'Alterna con estreñimiento', 'Dispepsia'],
    ['digestion'],
    '9CH: 3 gránulos, cada hora (agudos), 3x día (crónicos)',
    [
      { id: 'aloe', tipo: 'potenciador', desc: 'Diarrea urgente' },
      { id: 'arsenicum', tipo: 'complementario', desc: 'Diarrea con agotamiento' }
    ],
    { modal: 'Peor: órganay frutas, Bewegung, calientes. Mejor: fricción abdominal.' }
  ),

  // ==================== REMEDIOS PARA INMUNIDAD/INFECCIONES ====================

  'belladonna': createRemedy(
    'belladonna',
    'Belladonna',
    'Vegetal (Belladona)',
    'Para inflamación aguda con calor, enrojecimiento y pulsación.',
    ['Calor intenso', 'Rojo brillante', 'Pulsación', 'Dilatación pupilas', 'Agitación'],
    ['Otitis', 'Amigdalitis', 'Cistitis', 'Faringitis', 'Cefalea pulsátil'],
    ['inmunidad'],
    '9CH: 3 gránulos, cada 15 min (agudos)',
    [
      { id: 'chamomilla', tipo: 'potenciador', desc: 'Dolor de oídos infantil' },
      { id: 'ferrum_phos', tipo: 'complementario', desc: 'Inicio de inflamación' }
    ],
    { modal: 'Peor: noche, tacto, ruido, luz. Mejor: semi-acostado.' }
  ),

  'ferrum_phos': createRemedy(
    'ferrum_phos',
    'Ferrum Phosphoricum',
    'Mineral (Fósfato de Hierro)',
    'El "antibiótico" homeopático. Primera fase de inflamación.',
    ['Enrojecimiento gradual', 'Fiebre ligera', 'Anemia', 'Tos seca', 'Predisposición a hemorragias'],
    ['Otitis (inicio)', 'Faringitis (inicio)', 'Bronquitis', 'Fiebre', 'Hemorragias nasales'],
    ['inmunidad'],
    '9CH: 3 gránulos, cada hora. Prevenir: 9CH, 1x día',
    [
      { id: 'belladonna', tipo: 'potenciador', desc: 'Inflamación aguda' },
      { id: 'aconitum', tipo: 'complementario', desc: 'Inicio repentino' }
    ],
    { modal: 'Peor: noche, izquierda. Mejor: aplicación de frío.' }
  ),

  'mercurius_sol': createRemedy(
    'mercurius_sol',
    'Mercurius Solubilis',
    'Mineral (Mercurio)',
    'Para infecciones con secreciones profusas y mal aliento.',
    ['Salivación excesiva', 'Mal aliento', 'Ganglios inflamados', 'Sudor nocturno', 'Secreciones amarillo-verdosas'],
    ['Amigdalitis', 'Gingivitis', 'Otitis', 'Sinusitis', 'Bronquitis'],
    ['inmunidad'],
    '9CH: 3 gránulos, 3x día',
    [
      { id: 'belladonna', tipo: 'potenciador', desc: 'Inflamación aguda' },
      { id: 'hepar_sulph', tipo: 'complementario', desc: 'Supuración' }
    ],
    { modal: 'Peor: noche, calor cama, sudor. Mejor: temperatura moderada.' }
  ),

  'hepar_sulph': createRemedy(
    'hepar_sulph',
    'Hepar Sulphuris',
    'Mineral (Sulfuro de Calcio)',
    'Para abscessos y supuraciones. Muy sensible al frío.',
    ['Supuración', 'Mal olor', 'Dolores como astilla', 'Hipersensibilidad al frío', 'Irritabilidad'],
    ['Abscesos', 'Otitis supurada', 'Sinusitis', 'Forúnculos', 'Amigdalitis'],
    ['inmunidad', 'articula'],
    '9CH: 3 gránulos, 3x día',
    [
      { id: 'belladonna', tipo: 'potenciador', desc: 'Inflamación' },
      { id: 'silicea', tipo: 'complementario', desc: 'Supuración crónica' }
    ],
    { modal: 'Peor: frío, corriente, tacto. Mejor: calor, envuelto.' }
  ),

  // ==================== REMEDIOS PARA ARTICULACIONES ====================

  'rhus_tox': createRemedy(
    'rhus_tox',
    'Rhus Toxicodendron',
    'Vegetal (Zumaque venenoso)',
    'Para rigidez articular que mejora con movimiento. Primer movimiento muy doloroso.',
    ['Rigidez matutina', 'Mejora con Bewegung', 'Ansiedad nocturna', 'Herpes labial', 'Articulaciones calientes'],
    ['Artrosis', 'Lumbago', 'Esguinces', 'Ciática', 'Fiebre reumática'],
    ['articula'],
    '9CH: 3 gránulos, 3x día',
    [
      { id: 'bryonia', tipo: 'potenciador', desc: 'Rigidez peor con movimiento' },
      { id: 'arnica_homeo', tipo: 'complementario', desc: 'Traumatismos articulares' }
    ],
    { modal: 'Peor: descanso, frío, noche. Mejor: movimiento, calor, aplicaciones calientes.' }
  ),

  'ruta': createRemedy(
    'ruta',
    'Ruta Graveolens',
    'Vegetal (Ruda)',
    'Para tendones y periostio. Sensación de contusión.',
    ['Tendones', 'Periostio', 'Sensación de contusión', 'Fatiga ocular', 'Rigidez peor en reposo'],
    ['Tendinitis', 'Esguinces', 'Ciática', 'Fatiga visual', 'Lumbago'],
    ['articula'],
    '9CH: 3 gránulos, 3x día',
    [
      { id: 'rhus_tox', tipo: 'potenciador', desc: 'Articulaciones' },
      { id: 'arnica_homeo', tipo: 'complementario', desc: 'Traumatismos' }
    ],
    { modal: 'Peor: sentado, frío, humedad. Mejor: calor, Bewegung.' }
  ),

  'causticum': createRemedy(
    'causticum',
    'Causticum',
    'Mineral (Tinta de版画)',
    'Para debilidad muscular y contracturas. Temblores.',
    ['Debilidad muscular', 'Temblores', 'Incontinencia', 'Rigidez', 'Pesadez párpados'],
    ['Parálisis facial', 'Ciática', 'Artrosis', 'Temblores', 'Incontinencia urinaria'],
    ['articula'],
    '9CH: 3 gránulos, 3x día',
    [
      { id: 'rhus_tox', tipo: 'potenciador', desc: 'Rigidez articular' },
      { id: 'plumbum', tipo: 'complementario', desc: 'Parálisis progresiva' }
    ],
    { modal: 'Peor: seco, frío, tormentas. Mejor: lluvia, humidificación.' }
  ),

  // ==================== REMEDIOS PARA PIEL ====================

  'graphites': createRemedy(
    'graphites',
    'Graphites',
    'Mineral (Grafito)',
    'Para eccemas con exudado pegajoso y grietas.',
    ['Eccema con exudado', 'Grietas en pliegues', 'Piel seca', 'Cicatrices queloides', 'Uñas engrosadas'],
    ['Eccema', 'Heridas', 'Grietas', 'Impétigo', 'Psoriasis'],
    ['piel'],
    '9CH: 3 gránulos, 2x día',
    [
      { id: 'petroleum', tipo: 'potenciador', desc: 'Piel seca agrietada' },
      { id: 'sulphur', tipo: 'complementario', desc: 'Eccema crónico' }
    ],
    { modal: 'Peor: frío, noche. Mejor: calor local.' }
  ),

  'sulphur': createRemedy(
    'sulphur',
    'Sulphur',
    'Mineral (Azufre)',
    'El "depurativo" homeopático. Para todo tipo de problemas de piel.',
    ['Piel caliente', 'Ardor', 'Pequeñas heridas', 'Hambre a las 11h', 'Sed de alcohol'],
    ['Eccema', 'Psoriasis', 'Acné', 'Herpes', 'Pie de atleta', 'Tiña'],
    ['piel', 'detox'],
    '9CH: 3 gránulos, 2x día (mañana y noche)',
    [
      { id: 'graphites', tipo: 'potenciador', desc: 'Eccema con exudado' },
      { id: 'arsenicum', tipo: 'complementario', desc: 'Piel quemada' }
    ],
    { modal: 'Peor: cama, calor, baños. Mejor: frío, aplicaciones frías, aire.' }
  ),

  'urtica_urens': createRemedy(
    'urtica_urens',
    'Urtica Urens',
    'Vegetal (Ortiga menor)',
    'Para urticaria y quemaduras leves.',
    ['Urticaria', 'Quemadura leve', 'Picor', 'Edema', 'Reacción alérgica'],
    ['Urticaria', 'Quemaduras', 'Picaduras', 'Edema angioneurótico'],
    ['piel'],
    '9CH: 3 gránulos, cada 15 min (agudos), 3x día (crónicos)',
    [
      { id: 'apis_mellifica', tipo: 'potenciador', desc: 'Picaduras e inflamación' },
      { id: 'cantharis', tipo: 'complementario', desc: 'Quemaduras' }
    ],
    { modal: 'Peor: agua, frío, manipulación. Mejor: acostado.' }
  ),

  'apex_mellifica': createRemedy(
    'apex_mellifica',
    'Apis Mellifica',
    'Animal (Abeja)',
    'Para inflamación con edema y calor. Todo quema y pica.',
    ['Edema', 'Calor rosado', 'Pican', 'Pequeñas ampollas', 'Peor con calor local'],
    ['Picaduras', 'Urticaria', 'Edema', 'Artritis', 'Conjuntivitis'],
    ['inmunidad', 'articula'],
    '9CH: 3 gránulos, cada 15 min (agudos)',
    [
      { id: 'belladonna', tipo: 'potenciador', desc: 'Inflamación roja' },
      { id: 'rhus_tox', tipo: 'complementario', desc: 'Articulaciones con edema' }
    ],
    { modal: 'Peor: calor, tacto, tarde. Mejor: frío, aplicaciones frías.' }
  ),

  // ==================== REMEDIOS PARA MUJER ====================

  'pulsatilla': createRemedy(
    'pulsatilla',
    'Pulsatilla Pratensis',
    'Vegetal (Flor de Pasión)',
    'Para tipología "gentil" con necesidad de afecto. Tímido.',
    ['Tímido', 'Sensible', 'Necesita consuelo', 'Labilidad emocional', 'Sed mínima'],
    ['Menstruación irregular', 'Cistitis', 'Conjuntivitis', 'Otitis', 'Varicela'],
    ['fertilidad', 'sueno'],
    '9CH: 3 gránulos, 3x día',
    [
      { id: 'sepia', tipo: 'potenciador', desc: 'Mujer agotada' },
      { id: 'ignatia', tipo: 'complementario', desc: 'Emociones' }
    ],
    { modal: 'Peor: calor, habitaciones llenas, tarde. Mejor: aire, frío local, consuelo.' }
  ),

  'sepia': createRemedy(
    'sepia',
    'Sepia Officinalis',
    'Animal (Jibia)',
    'Para mujer agotada con sensación de caída de órganos.',
    ['Agotamiento', 'Caída de órganos pélvicos', 'Frigidez', 'Irritabilidad', 'Manchas en cara'],
    ['Menopausia', 'Prolapso', 'Disfunción hormonal', 'Cistitis', 'Estreñimiento'],
    ['fertilidad', 'energia'],
    '9CH: 3 gránulos, 3x día',
    [
      { id: 'pulsatilla', tipo: 'potenciador', desc: 'Mujer sensible' },
      { id: 'ignatia', tipo: 'complementario', desc: 'Irritabilidad' }
    ],
    { modal: 'Peor: frío, humedad, tarde, sienta sola. Mejor: ejercicio, calor, consuelo.' }
  ),

  'caulophyllum': createRemedy(
    'caulophyllum',
    'Caulophyllum Thalictroides',
    'Vegetal (Cohosh Azul)',
    'Para irregularidades menstruales y preparación al parto.',
    ['Menstruación irregular', 'Dolor articular', 'Temblores uterinos', 'Preparación parto'],
    ['Amenorrea', 'Dismenorrea', 'Preparación parto', 'Artralgia menstrual'],
    ['fertilidad'],
    '9CH: 3 gránulos, 3x día',
    [
      { id: 'pulsatilla', tipo: 'potenciador', desc: 'Irregularidad menstrual' },
      { id: 'cimicifuga', tipo: 'complementario', desc: 'Dolor menstrual' }
    ],
    { modal: 'Peor: frío, noche. Mejor: calor.' }
  ),

  // ==================== REMEDIOS PARA VÍAS RESPIRATORIAS ====================

  'aconitum': createRemedy(
    'aconitum',
    'Aconitum Napellus',
    'Vegetal (Acónito)',
    'Para inicio repentino de enfermedad. Miedo intenso.',
    ['Inicio repentino', 'Miedo intenso', 'Sed de agua fría', 'Palpitaciones', 'Ojos sensibles'],
    ['Resfriado (inicio)', 'Fiebre', 'Crisis de angustia', 'Otitis (inicio)', 'Cólicos renales'],
    ['inmunidad', 'cerebro'],
    '9CH: 3 gránulos, cada 15 min (muy agudo)',
    [
      { id: 'belladonna', tipo: 'potenciador', desc: 'Fiebre alta' },
      { id: 'ferrum_phos', tipo: 'complementario', desc: 'Inicio de inflamación' }
    ],
    { modal: 'Peor: frío, noche, seco. Mejor: sudor, aire.' }
  ),

  'allium_cepa': createRemedy(
    'allium_cepa',
    'Allium Cepa',
    'Vegetal (Cebolla)',
    'Para resfriados con rinorrea acuosa y ojos llorosos.',
    ['Rinorrea acuosa', 'Lagrimeo', 'Estornudos', 'Picor de nariz', 'Tos seca irritativa'],
    ['Resfriado', 'Rinitis alérgica', 'Fiebre del heno', 'Tos irritativa'],
    ['inmunidad'],
    '9CH: 3 gránulos, cada hora',
    [
      { id: 'euphrasia', tipo: 'potenciador', desc: 'Ojos irritados' },
      { id: 'nux_vomica', tipo: 'complementario', desc: 'Resfriado con estornudos' }
    ],
    { modal: 'Peor: habitaciones, noche, frio húmedo. Mejor: aire libre, frío.' }
  ),

  'euphrasia': createRemedy(
    'euphrasia',
    'Euphrasia Officinalis',
    'Vegetal (Eufrasia)',
    'Para ojos irritados con secreción leve y tos seca.',
    ['Ojos rojos', 'Secreción ocular leve', 'Fotofobia', 'Tos seca', 'Estornudos'],
    ['Conjuntivitis', 'Irritación ocular', 'Resfriado', 'Sarampión', 'Sarampión'],
    ['inmunidad'],
    '9CH: 3 gránulos, cada hora',
    [
      { id: 'allium_cepa', tipo: 'potenciador', desc: 'Resfriado' },
      { id: 'belladonna', tipo: 'complementario', desc: 'Conjuntivitis aguda' }
    ],
    { modal: 'Peor: luz, indoors, noche. Mejor: oscuridad, sombra.' }
  ),

  'antimonium_tart': createRemedy(
    'antimonium_tart',
    'Antimonium Tartaricum',
    'Mineral (Tartrato de Antimonio)',
    'Para mucosidad con dificultad para expectorar.',
    ['Mocos', 'Ruidos pulmonares', 'Somnolencia', 'Náuseas', 'Poca tos'],
    ['Bronquitis', 'Neumonía', 'EPOC', 'Asma', 'Tos con mucosidad'],
    ['inmunidad'],
    '9CH: 3 gránulos, cada hora',
    [
      { id: 'ipecacuanha', tipo: 'potenciador', desc: 'Tos con náuseas' },
      { id: 'pulsatilla', tipo: 'complementario', desc: 'Tos blanda' }
    ],
    { modal: 'Peor: acostado, calor. Mejor: expectoración, sentado.' }
  ),

  // ==================== REMEDIOS DE PRIMEROS AUXILIOS ====================

  'arnica_dolore': createRemedy(
    'arnica_dolore',
    'Arnica + Dolore (Compuesto)',
    'Compuesto',
    'Tónico para músculos y articulaciones tras esfuerzo o golpes.',
    ['Dolor muscular', 'Golpes', 'Cansancio', 'Rigidez', 'Contusiones'],
    ['Esfuerzo físico', 'Golpes', 'Fatiga muscular', 'Lumbago', 'Ciática'],
    ['articula', 'energia'],
    '5CH: 3 gránulos, 3x día',
    [
      { id: 'arnica_homeo', tipo: 'potenciador', desc: 'Traumatismos' },
      { id: 'rhus_tox', tipo: 'complementario', desc: 'Rigidez articular' }
    ]
  ),

  'cantharis': createRemedy(
    'cantharis',
    'Cantharis Vesicatoria',
    'Animal (Escaravelho mex)',
    'Para quemaduras con ampollas y sensación de ardor.',
    ['Quemaduras', 'Ampollas', 'Pican', 'Cistitis con ardor', 'Agitación'],
    ['Quemaduras', 'Ampollas', 'Cistitis', 'Impétigo'],
    ['piel', 'inmunidad'],
    '9CH: 3 gránulos, cada 15 min (agudos)',
    [
      { id: 'urtica_urens', tipo: 'potenciador', desc: 'Quemaduras leves' },
      { id: 'apex_mellifica', tipo: 'complementario', desc: 'Quemaduras con edema' }
    ],
    { modal: 'Peor: tacto, agua. Mejor: aplicaciones frías.' }
  ),

  'ledum_pal': createRemedy(
    'ledum_pal',
    'Ledum Palustre',
    'Vegetal (Lédum)',
    'Para picaduras frías con edema. No mejora con calor local.',
    ['Picaduras', 'Edema', 'Moratones', 'Heridas punzantes', 'Ojos azules'],
    ['Picaduras', 'Esguinces', 'Contusiones', 'Ojos inyectados'],
    ['articula', 'inmunidad'],
    '9CH: 3 gránulos, cada hora',
    [
      { id: 'apex_mellifica', tipo: 'potenciador', desc: 'Picaduras' },
      { id: 'arnica_homeo', tipo: 'complementario', desc: 'Traumatismos' }
    ],
    { modal: 'Peor: calor, tacto, noche. Mejor: aplicaciones frías.' }
  ),
};

// Funciones helper
export function getHomeopathyBySystem(system: string): IngredientInfo[] {
  const keywords: Record<string, string[]> = {
    'nervioso': ['sueno', 'cerebro'],
    'digestivo': ['digestion'],
    'inmune': ['inmunidad'],
    'articula': ['articula'],
    'piel': ['piel'],
    'femenino': ['fertilidad'],
    'respiratorio': ['inmunidad'],
  };
  
  const objetivos = keywords[system.toLowerCase()] || [];
  return Object.values(HOMEOPATHY_DATABASE).filter(ing => 
    objetivos.some(o => ing.objetivos_salud.includes(o as HealthObjective))
  );
}

export function searchHomeopathy(term: string): IngredientInfo[] {
  const normalized = term.toLowerCase();
  return Object.values(HOMEOPATHY_DATABASE).filter(
    ing => 
      ing.nombre.toLowerCase().includes(normalized) ||
      ing.descripcion.toLowerCase().includes(normalized) ||
      ing.beneficios.some(b => b.toLowerCase().includes(normalized))
  );
}

export const homeopathyCount = Object.keys(HOMEOPATHY_DATABASE).length;
