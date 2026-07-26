/**
 * Base de Datos de Aceites Esenciales - Aromaterapia
 * 
 * Incluye aceites esenciales con:
 * - Nombre común y científico
 * - Método de extracción
 * - Propiedades terapéuticas
 * - Usos principales
 * - Dilución recomendada
 * - Precauciones
 */

import { IngredientInfo, IngredientCategory, HealthObjective, Contraindicacion } from './types';

// Helper para crear aceite esencial
function createOil(
  id: string,
  nombre: string,
  nombreCientifico: string,
  descripcion: string,
  propiedades: string[],
  objetivos: HealthObjective[],
  usos: string[],
  dilucion: string,
  sinergias: { id: string; tipo: 'potenciador' | 'complementario'; desc: string }[],
  opts: {
    metodo?: string;
    nota?: 'alta' | 'media' | 'baja';
    precauciones?: string[];
    contraindicaciones?: Contraindicacion[];
  } = {}
): IngredientInfo {
  return {
    id,
    nombre,
    nombre_latin: nombreCientifico,
    categoria: 'aceites_esenciales',
    descripcion,
    mecanismo_accion: propiedades.join(', '),
    beneficios: usos,
    dosis_recomendada: dilucion,
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

export const ESSENTIAL_OILS_DATABASE: Record<string, IngredientInfo> = {

  // ==================== ACEITES RELAJANTES ====================

  'lavanda': createOil(
    'lavanda',
    'Lavanda Fina',
    'Lavandula angustifolia',
    'El aceite esencial más versátil. Relaja, regenera y calma.',
    ['Antiespasmódico', 'Sedante', 'Regenerador cutáneo', 'Analgésico', 'Antiinflamatorio'],
    ['sueno', 'articula', 'piel'],
    ['Insomnio', 'Ansiedad', 'Heridas', 'Quemaduras', 'Dolor muscular', 'Picaduras'],
    'Dilución 2-5% para piel. Puro en diffusers.',
    [
      { id: 'manzanilla', tipo: 'potenciador', desc: 'Relajación profunda' },
      { id: 'vetiver', tipo: 'potenciador', desc: 'Ansiedad e insomnio' }
    ],
    { 
      metodo: 'Destilación vapor', 
      nota: 'alta',
      precauciones: ['No usar en primeros 3 meses embarazo', 'Posible sensibilización'],
      contraindicaciones: [
        { condicion: 'Embarazo', nivel: 'precaucion', descripcion: 'Primer trimestre' }
      ]
    }
  ),

  'manzanilla': createOil(
    'manzanilla',
    'Manzanilla Romana',
    'Chamaemelum nobile',
    'Potente antiinflamatorio y sedante. Ideal para pieles sensibles.',
    ['Antiinflamatorio', 'Sedante', 'Antiespasmódico', 'Analgesico', 'Antipruriginoso'],
    ['articula', 'sueno', 'piel'],
    ['Dermatitis', 'Eccema', 'Insomnio', 'Cólicos', 'Migraña', 'Neuralgia'],
    'Dilución 2-3% para piel.',
    [
      { id: 'lavanda', tipo: 'potenciador', desc: 'Piel y relajación' },
      { id: 'neroli', tipo: 'complementario', desc: 'Ansiedad' }
    ],
    { 
      metodo: 'Destilación vapor', 
      nota: 'alta',
      precauciones: ['Alergia a asteráceas'],
      contraindicaciones: [
        { condicion: 'Embarazo', nivel: 'precaucion', descripcion: 'Alta concentración' }
      ]
    }
  ),

  'vetiver': createOil(
    'vetiver',
    'Vetiver',
    'Vetiveria zizanoides',
    'Relajante profundo. Ancla la mente y reduce ansiedad.',
    ['Sedante', 'Tónico', 'Regenerador cutáneo', 'Antiespasmódico', 'Inmunomodulador'],
    ['sueno', 'cerebro'],
    ['Insomnio', 'Ansiedad', 'Stress', 'Trauma', 'Reconstituyente'],
    'Dilución 2-5% para piel.',
    [
      { id: 'lavanda', tipo: 'potenciador', desc: 'Relajación' },
      { id: 'cedro', tipo: 'potenciador', desc: 'Ancla emocional' }
    ],
    { 
      metodo: 'Destilación raíz', 
      nota: 'baja',
      precauciones: ['No carcinogénico seguro']
    }
  ),

  'cedro': createOil(
    'cedro',
    'Cedro del Atlas',
    'Cedrus atlantica',
    'Relaja y reconforta. Ancla emociones.',
    ['Sedante', 'Antiespasmódico', 'Tónico linfático', 'Diurético', 'Antiséptico respiratorio'],
    ['sueno', 'articula'],
    ['Insomnio', 'Ansiedad', 'Celulitis', 'Tos seca', 'Laringitis'],
    'Dilución 3-5% para piel.',
    [
      { id: 'lavanda', tipo: 'potenciador', desc: 'Relajación' },
      { id: 'vetiver', tipo: 'potenciador', desc: 'Ancla emocional' }
    ],
    { 
      metodo: 'Destilación vapor', 
      nota: 'baja',
      precauciones: ['No usar en epilepsia'],
      contraindicaciones: [
        { condicion: 'Embarazo', nivel: 'precaucion', descripcion: 'Primer trimestre' }
      ]
    }
  ),

  'neroli': createOil(
    'neroli',
    'Neroli (Azahar)',
    'Citrus aurantium amara',
    'Relaja profundamente. Excelente para piel madura.',
    ['Sedante', 'Regenerador cutáneo', 'Antiinflamatorio', 'Antiséptico', 'Tónico nervioso'],
    ['sueno', 'antiedad', 'piel'],
    ['Ansiedad', 'Insomnio', 'Estrés', 'Piel madura', 'Cicatrices'],
    'Dilución 2-5% para piel.',
    [
      { id: 'lavanda', tipo: 'potenciador', desc: 'Relajación' },
      { id: 'manzanilla', tipo: 'complementario', desc: 'Piel sensible' }
    ],
    { 
      metodo: 'Enflorado', 
      nota: 'alta',
      precauciones: ['Skin sensitizing if oxidized']
    }
  ),

  // ==================== ACEITES ENERGIZANTES ====================

  'romero': createOil(
    'romero',
    'Romero CT Cineol',
    'Rosmarinus officinalis',
    'Estimulante mental y físico. Mejora memoria y concentración.',
    ['Estimulante', 'Antiespasmódico', 'Hepatoprotector', 'Antirreumático', 'Antiséptico'],
    ['energia', 'articula', 'cerebro'],
    ['Fatiga mental', 'Mala circulación', 'Dolores musculares', 'Cefalea', 'Resfriado'],
    'Dilución 3-5% para piel.',
    [
      { id: 'menta', tipo: 'potenciador', desc: 'Concentración' },
      { id: 'eucalipto', tipo: 'complementario', desc: 'Vías respiratorias' }
    ],
    { 
      metodo: 'Destilación vapor', 
      nota: 'alta',
      precauciones: ['No usar en epilepsia', 'No usar en hipertensión'],
      contraindicaciones: [
        { condicion: 'Embarazo', nivel: 'absoluta', descripcion: 'Abortivo' },
        { condicion: 'Epilepsia', nivel: 'absoluta', descripcion: 'Puede provocar convulsiones' }
      ]
    }
  ),

  'menta': createOil(
    'menta',
    'Menta Piperita',
    'Mentha piperita',
    'Refrescante y estimulante. Alivia dolor y mejora concentración.',
    ['Analgésico', 'Refrescante', 'Estimulante', 'Antiemético', 'Antiséptico'],
    ['energia', 'articula', 'digestion'],
    ['Cefalea', 'Náuseas', 'Dolor muscular', 'Congestión', 'Mala digestión'],
    'Dilución 2-3% para piel. 1 gota en diffusers.',
    [
      { id: 'romero', tipo: 'potenciador', desc: 'Concentración' },
      { id: 'jengibre', tipo: 'complementario', desc: 'Náuseas' }
    ],
    { 
      metodo: 'Destilación vapor', 
      nota: 'alta',
      precauciones: ['No aplicar cerca ojos', 'Diluir bien', 'No usar en niños <6 años'],
      contraindicaciones: [
        { condicion: 'Embarazo', nivel: 'precaucion', descripcion: 'Alta concentración' },
        { condicion: 'Lactancia', nivel: 'precaucion', descripcion: 'Posible transferencia' },
        { condicion: 'Corazón', nivel: 'precaucion', descripcion: 'Palpitaciones si usado en exceso' }
      ]
    }
  ),

  'limon': createOil(
    'limon',
    'Limón',
    'Citrus limon',
    'Estimulante y purificante. Mejora concentración.',
    ['Estimulante', 'Antiséptico', 'Purificante', 'Tónico circulatorio', 'Digestivo'],
    ['energia', 'cerebro', 'detox'],
    ['Fatiga', 'Estreñimiento', 'Aromatizante', 'Mala circulación', 'Olor ambiental'],
    'Dilución 2-3% para piel. fotosensibilizante.',
    [
      { id: 'romero', tipo: 'potenciador', desc: 'Concentración' },
      { id: 'lavanda', tipo: 'complementario', desc: 'Equilibrio' }
    ],
    { 
      metodo: 'Expresión', 
      nota: 'alta',
      precauciones: ['FOTOSENSIBILIZANTE', 'No aplicar antes de exposición solar', 'Oxida fácilmente'],
      contraindicaciones: [
        { condicion: 'Piel fotosensible', nivel: 'absoluta', descripcion: 'No aplicar antes de sol' }
      ]
    }
  ),

  'eucalipto': createOil(
    'eucalipto',
    'Eucalipto Globulus',
    'Eucalyptus globulus',
    'Descongestionante respiratorio por excelencia.',
    ['Descongestionante', 'Antiséptico', 'Antiviral', 'Antibacteriano', 'Febrífugo'],
    ['inmunidad', 'energia'],
    ['Resfriado', 'Tos', 'Congestión nasal', 'Sinusitis', 'Bronquitis', 'Fiebre'],
    'Dilución 3-5% para piel. 3-5 gotas en diffusers.',
    [
      { id: 'menta', tipo: 'potenciador', desc: 'Descongestionante' },
      { id: 'ravintsara', tipo: 'potenciador', desc: 'Inmunidad' }
    ],
    { 
      metodo: 'Destilación vapor', 
      nota: 'alta',
      precauciones: ['No usar en niños <6 años', 'No usar en asmáticos (broncoespasmo)'],
      contraindicaciones: [
        { condicion: 'Embarazo', nivel: 'precaucion', descripcion: 'Primer trimestre' },
        { condicion: 'Asma', nivel: 'precaucion', descripcion: 'Puede empeorar' }
      ]
    }
  ),

  // ==================== ACEITES ANTIINFLAMATORIOS ====================

  'gaulteria': createOil(
    'gaulteria',
    'Gaulteria (Wintergreen)',
    'Gaultheria procumbens',
    'Potente analgésico natural. Similar al salicilato de metilo.',
    ['Analgésico', 'Antiinflamatorio', 'Antirreumático', 'Vasodilatador', 'Descongestionante'],
    ['articula', 'articula'],
    ['Dolor articular', 'Ciática', 'Tendinitis', 'Cefalea tensional', 'Reuma', 'Calambres'],
    'Dilución 5-10% para piel. MAX 30% en zonas pequeñas.',
    [
      { id: 'lavanda', tipo: 'potenciador', desc: 'Relajación muscular' },
      { id: 'menta', tipo: 'complementario', desc: 'Frío analgésico' }
    ],
    { 
      metodo: 'Destilación vapor (hojas)', 
      nota: 'media',
      precauciones: ['ALTO contenido metil salicilato', 'NO usar con anticoagulantes'],
      contraindicaciones: [
        { condicion: 'Alergia aspirina', nivel: 'absoluta', descripcion: 'Contiene salicilato' },
        { condicion: 'Embarazo', nivel: 'absoluta', descripcion: 'Contraindicado' },
        { condicion: 'Anticoagulantes', nivel: 'absoluta', descripcion: 'Riesgo sangrado' },
        { condicion: 'Niños <6 años', nivel: 'absoluta', descripcion: 'Contraindicado' }
      ]
    }
  ),

  'jengibre': createOil(
    'jengibre',
    'Jengibre',
    'Zingiber officinale',
    'Calentador y antiinflamatorio. Ideal para músculos.',
    ['Antiinflamatorio', 'Calentador', 'Analgésico', 'Antiemético', 'Tónico digestivo'],
    ['articula', 'digestion'],
    ['Dolores musculares', 'Artritis', 'Náuseas', 'Digestión lenta', 'Mala circulación'],
    'Dilución 3-5% para piel.',
    [
      { id: 'curcuma', tipo: 'potenciador', desc: 'Antiinflamatorio interno' },
      { id: 'lavanda', tipo: 'complementario', desc: 'Dolor muscular' }
    ],
    { 
      metodo: 'Destilación vapor', 
      nota: 'media',
      precauciones: ['Piel sensibilizante si oxidado'],
      contraindicaciones: [
        { condicion: 'Embarazo', nivel: 'precaucion', descripcion: 'Alta concentración' }
      ]
    }
  ),

  'curcuma': createOil(
    'curcuma',
    'Curcuma',
    'Curcuma longa',
    'Antiinflamatorio potente. Complemento natural.',
    ['Antiinflamatorio', 'Antioxidante', 'Analgésico', 'Antiséptico', 'Regenerador'],
    ['articula', 'articula'],
    ['Artritis', 'Dolor articular', 'Miositis', 'Cicatrización', 'Eccema'],
    'Dilución 2-5% para piel.',
    [
      { id: 'jengibre', tipo: 'potenciador', desc: 'Antiinflamatorio' },
      { id: 'manzanilla', tipo: 'complementario', desc: 'Piel' }
    ],
    { 
      metodo: 'Destilación vapor', 
      nota: 'media',
      precauciones: ['Fotosensibilizante en alta concentración']
    }
  ),

  // ==================== ACEITES ANTISÉPTICOS ====================

  'tea_tree': createOil(
    'tea_tree',
    'Tea Tree',
    'Melaleuca alternifolia',
    'Antiséptico de amplio espectro. Seguro y versátil.',
    ['Antiséptico', 'Antifúngico', 'Antiviral', 'Antiinflamatorio', 'Inmunomodulador'],
    ['inmunidad', 'articula'],
    ['Heridas', 'Acné', 'Hongos', 'Picaduras', 'Psoriasis', 'Verrugas'],
    'Dilución 5-10% para piel. Puro en superficies.',
    [
      { id: 'lavanda', tipo: 'potenciador', desc: 'Heridas' },
      { id: 'canela', tipo: 'potenciador', desc: 'Antimicrobiano potente' }
    ],
    { 
      metodo: 'Destilación vapor', 
      nota: 'media',
      precauciones: ['Posible sensibilización'],
      contraindicaciones: [
        { condicion: 'Embarazo', nivel: 'precaucion', descripcion: 'Primer trimestre' }
      ]
    }
  ),

  'canela': createOil(
    'canela',
    'Canela de Ceylán',
    'Cinnamomum verum',
    'Potente antimicrobiano. Estimulante y.calentador.',
    ['Antimicrobiano', 'Antiséptico', 'Antifúngico', 'Calentador', 'Tónico circulatorio'],
    ['inmunidad', 'energia'],
    ['Infecciones', 'Mala circulación', 'Frío', 'Fatiga', 'Hongos'],
    'Dilución MAX 1% para piel (muy sensibilizante).',
    [
      { id: 'tea_tree', tipo: 'potenciador', desc: 'Antiséptico' },
      { id: 'limon', tipo: 'complementario', desc: 'Circulación' }
    ],
    { 
      metodo: 'Destilación corteza', 
      nota: 'alta',
      precauciones: ['MUY sensibilizante', 'Irritante puro', 'NO usar en diffusers directamente'],
      contraindicaciones: [
        { condicion: 'Embarazo', nivel: 'absoluta', descripcion: 'Abortivo' },
        { condicion: 'Piel sensible', nivel: 'absoluta', descripcion: 'No directo' },
        { condicion: 'Niños', nivel: 'absoluta', descripcion: 'No recomendado' }
      ]
    }
  ),

  'palmarosa': createOil(
    'palmarosa',
    'Palmarosa',
    'Cymbopogon martinii',
    'Antiséptico suave. Excelente para piel.',
    ['Antiséptico', 'Antifúngico', 'Regenerador cutáneo', 'Hidratante', 'Emoliente'],
    ['inmunidad', 'articula'],
    ['Acné', 'Heridas', 'Pie de atleta', 'Piel seca', 'Cicatrización'],
    'Dilución 3-5% para piel.',
    [
      { id: 'tea_tree', tipo: 'potenciador', desc: 'Antiséptico' },
      { id: 'lavanda', tipo: 'complementario', desc: 'Piel' }
    ],
    { 
      metodo: 'Destilación vapor', 
      nota: 'media'
    }
  ),

  'ravintsara': createOil(
    'ravintsara',
    'Ravintsara',
    'Cinnamomum camphora',
    'Antiviral e inmunológico. El "aceite del东盟".',
    ['Antiviral', 'Inmunomodulador', 'Expectorante', 'Neurotónico', 'Relajante'],
    ['inmunidad', 'sueno'],
    ['Resfriado', 'Gripe', 'Herpes', 'Fatiga', 'Insomnio', 'Stress'],
    'Dilución 3-5% para piel. 3-5 gotas en diffusers.',
    [
      { id: 'eucalipto', tipo: 'potenciador', desc: 'Antiviral respiratorio' },
      { id: 'lavanda', tipo: 'complementario', desc: 'Sueño y stress' }
    ],
    { 
      metodo: 'Destilación vapor (hojas)', 
      nota: 'alta',
      precauciones: ['No confundir con ravensara (más irritante)']
    }
  ),

  'origen': createOil(
    'origen',
    'Orégano',
    'Origanum compactum',
    'Potente antibacteriano y antifúngico.',
    ['Antibacteriano', 'Antifúngico', 'Antiparasitario', 'Inmunoestimulante', 'Calentador'],
    ['inmunidad'],
    ['Infecciones', 'Hongos', 'Parásitos', 'Resfriado', 'Gripe'],
    'Dilución 1-3% para piel. NO usar diffusers.',
    [
      { id: 'canela', tipo: 'potenciador', desc: 'Antimicrobiano potente' },
      { id: 'tea_tree', tipo: 'complementario', desc: 'Antiséptico suave' }
    ],
    { 
      metodo: 'Destilación vapor', 
      nota: 'alta',
      precauciones: ['MUY irritante puro', 'Solo uso corto'],
      contraindicaciones: [
        { condicion: 'Embarazo', nivel: 'absoluta', descripcion: 'Abortivo' },
        { condicion: 'Niños', nivel: 'absoluta', descripcion: 'No recomendado' },
        { condicion: 'Piel sensible', nivel: 'absoluta', descripcion: 'Contraindicado' }
      ]
    }
  ),

  // ==================== ACEITES PARA PIEL ====================

  'inca_inchi': createOil(
    'inca_inchi',
    'Aceite de Inca Inchi (Sacha Inchi)',
    'Plukenetia volubilis',
    'Rico en Omega 3-6-9. Regenerador cutáneo excepcional.',
    ['Regenerador', 'Nutritivo', 'Antioxidante', 'Emoliente', 'Protector'],
    ['articula', 'articula'],
    ['Piel seca', 'Cicatrices', 'Eccema', 'Psoriasis', 'Arrugas'],
    '100% puro como carrier. few drops.',
    [
      { id: 'lavanda', tipo: 'potenciador', desc: 'Regeneración' },
      { id: 'rosehip', tipo: 'complementario', desc: 'Antiedad' }
    ],
    { 
      metodo: 'Prensado en frío', 
      nota: 'baja',
      precauciones: ['Almacenar fresco y oscuro']
    }
  ),

  'rosehip': createOil(
    'rosehip',
    'Rosa Mosqueta',
    'Rosa rubiginosa',
    'Potente regenerador. Reductora de cicatrices.',
    ['Regenerador', 'Antiaging', 'Cicatrizante', 'Antioxidante', 'Emoliente'],
    ['articula', 'articula'],
    ['Cicatrices', 'Arrugas', 'Manchas', 'Estrías', 'Quemaduras', 'Piel seca'],
    '100% puro como carrier. few drops.',
    [
      { id: 'lavanda', tipo: 'potenciador', desc: 'Cicatrices' },
      { id: 'neroli', tipo: 'complementario', desc: 'Piel madura' }
    ],
    { 
      metodo: 'Prensado en frío semillas', 
      nota: 'media',
      precauciones: ['Rico en ácido transretinoico natural', 'Fotosensibilizante'],
      contraindicaciones: [
        { condicion: 'Acné activo', nivel: 'precaucion', descripcion: 'Puede empeorar' }
      ]
    }
  ),

  'argania': createOil(
    'argania',
    'Argán',
    'Argania spinosa',
    'El "oro líquido". Nutritivo y antiaging.',
    ['Nutritivo', 'Antiaging', 'Emoliente', 'Antioxidante', 'Protectivo'],
    ['articula', 'articula'],
    ['Piel seca', 'Cabello seco', 'Uñas frágiles', 'Arrugas', 'Estrías'],
    '100% puro como carrier. few drops.',
    [
      { id: 'lavanda', tipo: 'potenciador', desc: 'Cabello' },
      { id: 'rosehip', tipo: 'complementario', desc: 'Antiaging' }
    ],
    { 
      metodo: 'Prensado en frío', 
      nota: 'media'
    }
  ),

  'cacao': createOil(
    'cacao',
    'Manteca de Cacao',
    'Theobroma cacao',
    'Nutritiva y relajante. Ideal para piel seca.',
    ['Nutritivo', 'Emoliente', 'Hidratante', 'Antiinflamatorio', 'Aromaterapéutico'],
    ['articula', 'articula'],
    ['Piel muy seca', 'Labios', 'Estrías', 'Masajes', 'Prevención estrías'],
    'Pure as carrier. few drops.',
    [
      { id: 'lavanda', tipo: 'potenciador', desc: 'Relajante' },
      { id: 'rosehip', tipo: 'complementario', desc: 'Cicatrices' }
    ],
    { 
      metodo: 'Prensado en frío', 
      nota: 'baja'
    }
  ),

  // ==================== ACEITES DIGESTIVOS ====================

  'hinojo': createOil(
    'hinojo',
    'Hinojo Dulce',
    'Foeniculum vulgare',
    'Digestivo y calmante. Reduce gases.',
    ['Carminativo', 'Antispasmódico', 'Digestivo', 'Diurético', 'Emenagog'],
    ['digestion'],
    ['Gases', 'Cólicos', 'Digestión lenta', 'Náuseas', 'Estreñimiento'],
    'Dilución 2-3% para piel.',
    [
      { id: 'jengibre', tipo: 'potenciador', desc: 'Digestión' },
      { id: 'menta', tipo: 'complementario', desc: 'Gases' }
    ],
    { 
      metodo: 'Destilación vapor', 
      nota: 'media',
      precauciones: ['Puedo actuar como estrógeno'],
      contraindicaciones: [
        { condicion: 'Embarazo', nivel: 'absoluta', descripcion: 'Abortivo' },
        { condicion: 'Epilepsia', nivel: 'precaucion', descripcion: 'Puede provocar convulsiones' },
        { condicion: 'Cáncer hormono-dependiente', nivel: 'absoluta', descripcion: 'No usar' }
      ]
    }
  ),

  'cardamomo': createOil(
    'cardamomo',
    'Cardamomo',
    'Elettaria cardamomum',
    'Digestivo suave. Alivia náuseas y gases.',
    ['Carminativo', 'Digestivo', 'Antiemético', 'Antiséptico', 'Aromatizante'],
    ['digestion'],
    ['Náuseas', 'Gases', 'Indigestión', 'Halitosis', 'Vómitos'],
    'Dilución 2-3% para piel. 1-2 gotas internamente (con supervisión).',
    [
      { id: 'jengibre', tipo: 'potenciador', desc: 'Náuseas' },
      { id: 'hinojo', tipo: 'complementario', desc: 'Gases' }
    ],
    { 
      metodo: 'Destilación vapor', 
      nota: 'alta'
    }
  ),

  // ==================== ACEITES HORMONALES ====================

  'salvia_esclarea': createOil(
    'salvia_esclarea',
    'Salvia Esclarea',
    'Salvia sclarea',
    'Regulador hormonal. Relaja y equilibra.',
    ['Regulador hormonal', 'Relajante', 'Antiespasmódico', 'Neurotónico', 'Antiinflamatorio'],
    ['fertilidad', 'sueno'],
    ['Menopausia', 'Menstruación irregular', 'Sofocos', 'Insomnio', 'Estrés'],
    'Dilución 3-5% para piel.',
    [
      { id: 'lavanda', tipo: 'potenciador', desc: 'Relajación' },
      { id: 'salvia', tipo: 'complementario', desc: 'Equilibrio hormonal' }
    ],
    { 
      metodo: 'Destilación vapor', 
      nota: 'media',
      precauciones: ['NO confundir con Salvia officinalis (tóxica)'],
      contraindicaciones: [
        { condicion: 'Embarazo', nivel: 'absoluta', descripcion: 'Parto' },
        { condicion: 'Cáncer hormono-dependiente', nivel: 'absoluta', descripcion: 'No usar' }
      ]
    }
  ),

  'incienso': createOil(
    'incienso',
    'Incienso (Boswellia)',
    'Boswellia carterii',
    'Antiinflamatorio y reconn心理健康. Eleva el espíritu.',
    ['Antiinflamatorio', 'Inmunoestimulante', 'Reumann', 'Antiespasmódico', 'Elevador'],
    ['articula', 'articula', 'sueno'],
    ['Artrosis', 'Artrosis', 'Asma', 'Bronquitis', 'Meditación', 'Depresión'],
    'Dilución 3-5% para piel.',
    [
      { id: 'lavanda', tipo: 'potenciador', desc: 'Relajación' },
      { id: 'eucalipto', tipo: 'complementario', desc: 'Vías respiratorias' }
    ],
    { 
      metodo: 'Resina destilada', 
      nota: 'alta'
    }
  ),
};

// Funciones helper
export function getOilsByCategory(category: string): IngredientInfo[] {
  const categoryKeywords: Record<string, string[]> = {
    'relajante': ['sueno'],
    'energizante': ['energia'],
    'antiinflamatorio': ['articula'],
    'antisetico': ['inmunidad'],
    'piel': ['articula'],
    'digestivo': ['digestion'],
    'hormonal': ['fertilidad'],
  };

  const objetivos = categoryKeywords[category.toLowerCase()] || [];
  return Object.values(ESSENTIAL_OILS_DATABASE).filter(ing =>
    objetivos.some(o => ing.objetivos_salud.includes(o as HealthObjective))
  );
}

export function searchOils(term: string): IngredientInfo[] {
  const normalized = term.toLowerCase();
  return Object.values(ESSENTIAL_OILS_DATABASE).filter(
    ing =>
      ing.nombre.toLowerCase().includes(normalized) ||
      ing.descripcion.toLowerCase().includes(normalized) ||
      ing.beneficios.some(b => b.toLowerCase().includes(normalized))
  );
}

export const oilsCount = Object.keys(ESSENTIAL_OILS_DATABASE).length;
