/**
 * Base de Datos de Fitoterapia - Plantas Medicinales
 * 
 * Incluye plantas medicinales con:
 * - Nombres comunes y científicos
 * - Parte usada
 * - Indicaciones terapéuticas
 * - Modo de preparación
 * - Contraindicaciones
 * - Interacciones
 */

import { IngredientInfo, IngredientCategory, HealthObjective, Contraindicacion } from './types';

// Helper para crear ingrediente fitoterapéutico
function createPhyto(
  id: string,
  nombre: string,
  nombreCientifico: string,
  descripcion: string,
  parteUsada: string,
  indicaciones: string[],
  objetivos: HealthObjective[],
  preparacion: string,
  sinergias: { id: string; tipo: 'potenciador' | 'complementario'; desc: string }[],
  opts: {
    dosis?: string;
    contraindicaciones?: Contraindicacion[];
    interacciones?: string[];
  } = {}
): IngredientInfo {
  return {
    id,
    nombre,
    nombre_latin: nombreCientifico,
    categoria: 'botanicos',
    descripcion,
    mecanismo_accion: descripcion,
    beneficios: indicaciones,
    dosis_recomendada: opts.dosis || dosis,
    contraindicaciones: opts.contraindicaciones || [],
    interacciones: opts.interacciones,
    sinergias: sinergias.map(s => ({
      ingrediente_id: s.id,
      tipo: s.tipo,
      descripcion: s.desc,
      nivel: 'alto' as const
    })),
    antagonismos: []
  };
}

const dosis = 'según preparación';

export const PHYTOTHERAPY_DATABASE: Record<string, IngredientInfo> = {

  // ==================== PLANTAS PARA SISTEMA NERVIOSO ====================
  
  'valeriana': createPhyto(
    'valeriana',
    'Valeriana',
    'Valeriana officinalis',
    'Planta sedante y ansiolítica natural. успокаивает нервную систему.',
    'Raíz',
    ['Insomnio', 'Ansiedad', 'Nerviosismo', 'Stress', 'Irritabilidad'],
    ['sueno', 'cerebro'],
    'Decocción: 1-2g de raíz en 200ml de agua, 3x día',
    [
      { id: 'pasiflora', tipo: 'potenciador', desc: 'Efecto sedante sinérgico' },
      { id: 'melisa', tipo: 'complementario', desc: 'Combinación para ansiedad' }
    ],
    { dosis: '400-900mg extracto/ día', contraindicaciones: [
      { condicion: 'Embarazo', nivel: 'precaucion', descripcion: 'No recomendado durante el embarazo' },
      { condicion: 'Lactancia', nivel: 'precaucion', descripcion: 'No recomendado durante lactancia' },
      { condicion: 'Cirugía', nivel: 'precaucion', descripcion: 'Suspender 2 semanas antes de cirugía' }
    ], interacciones: ['Benzodiacepinas', 'Barbitúricos', 'Alcohol'] }
  ),

  'pasiflora': createPhyto(
    'pasiflora',
    'Pasiflora',
    'Passiflora incarnata',
    'Planta con propiedades ansiolíticas y sedantes. Excelente para ansiedad y nerviosismo.',
    'Parte aérea',
    ['Ansiedad', 'Insomnio', 'Nerviosismo', 'Palpitaciones nerviosas'],
    ['sueno', 'cerebro'],
    'Infusión: 1-2g en 200ml, 3x día',
    [
      { id: 'valeriana', tipo: 'potenciador', desc: 'Efecto sedante sinérgico' },
      { id: 'espino_blanco', tipo: 'complementario', desc: 'Para ansiedad con componente cardíaco' }
    ],
    { dosis: '200-400mg extracto/ día' }
  ),

  'melisa': createPhyto(
    'melisa',
    'Melisa (Toronjil)',
    'Melissa officinalis',
    'Planta con propiedades sedantes y antivirales. Ideal para estrés y ansiedad.',
    'Hojas',
    ['Ansiedad', 'Insomnio', 'Estrés', 'Herpes labial', 'Digestión nerviosa'],
    ['sueno', 'cerebro', 'inmunidad'],
    'Infusión: 1.5-4.5g en 200ml, 3x día',
    [
      { id: 'valeriana', tipo: 'potenciador', desc: 'Combinación sedante' },
      { id: 'lavanda', tipo: 'complementario', desc: 'Efecto relajante' }
    ],
    { dosis: '600-1200mg extracto/ día', contraindicaciones: [
      { condicion: 'Hipotiroidismo', nivel: 'precaucion', descripcion: 'Puede interferir con tratamiento tiroideo' }
    ]}
  ),

  'hipérico': createPhyto(
    'hipérico',
    'Hipérico (Hierba de San Juan)',
    'Hypericum perforatum',
    'Antidepresivo natural para depresión leve-moderada. Regula neurotransmisores.',
    'Sumidad florida',
    ['Depresión leve', 'Ansiedad', 'Trastornos del sueño', 'Menopausia'],
    ['cerebro', 'sueno'],
    'Infusión: 1-2g, 2-3x día',
    [
      { id: 'ginkgo', tipo: 'complementario', desc: 'Función cognitiva' },
      { id: 'maca', tipo: 'complementario', desc: 'Equilibrio hormonal' }
    ],
    { dosis: '300-900mg extracto (0.3% hipericina)/ día', contraindicaciones: [
      { condicion: 'Embarazo', nivel: 'absoluta', descripcion: 'Contraindicado en embarazo' },
      { condicion: 'Antidepresivos', nivel: 'absoluta', descripcion: 'Interacción grave con ISRS' },
      { condicion: 'Anticonceptivos', nivel: 'absoluta', descripcion: 'Reduce eficacia' }
    ], interacciones: ['ISRS', 'Anticoagulantes', 'Anticonceptivos', 'Antirretrovirales'] }
  ),

  'ginkgo': createPhyto(
    'ginkgo',
    'Ginkgo biloba',
    'Ginkgo biloba',
    'Mejora circulación cerebral y memoria. Antioxidante neuroprotector.',
    'Hojas',
    ['Memoria', 'Concentración', 'Vértigo', 'Zumbido de oídos', 'Circulación'],
    ['cerebro'],
    'Infusión: 1-2g, 2x día',
    [
      { id: 'bacopa', tipo: 'potenciador', desc: 'Mejora memoria sinérgica' },
      { id: 'vinpocetina', tipo: 'complementario', desc: 'Circulación cerebral' }
    ],
    { dosis: '120-240mg extracto (24% flavonoides)/ día', contraindicaciones: [
      { condicion: 'Epilepsia', nivel: 'precaucion', descripcion: 'Puede provocar convulsiones' },
      { condicion: 'Anticoagulantes', nivel: 'precaucion', descripcion: 'Riesgo de sangrado' }
    ]}
  ),

  'bacopa': createPhyto(
    'bacopa',
    'Bacopa (Brahmi)',
    'Bacopa monnieri',
    'Nootrópico ayurvédico que mejora memoria y función cognitiva.',
    'Planta entera',
    ['Memoria', 'Aprendizaje', 'Concentración', 'Estrés oxidativo'],
    ['cerebro'],
    'Polvo: 1-3g/ día',
    [
      { id: 'ginkgo', tipo: 'potenciador', desc: 'Mejora cognitiva sinérgica' },
      { id: 'ashwagandha', tipo: 'complementario', desc: 'Adaptógeno cognitivo' }
    ],
    { dosis: '300-450mg extracto/ día' }
  ),

  'ashwagandha': createPhyto(
    'ashwagandha',
    'Ashwagandha',
    'Withania somnifera',
    'Adaptógeno ayurvédico que reduce estrés y fatiga. Regula cortisol.',
    'Raíz',
    ['Estrés', 'Fatiga', 'Ansiedad', 'Insomnio', 'Rendimiento físico'],
    ['energia', 'cerebro', 'sueno'],
    'Decocción: 2-3g de raíz, 2x día',
    [
      { id: 'rhodiola', tipo: 'potenciador', desc: 'Adaptógenos combinados' },
      { id: 'maca', tipo: 'complementario', desc: 'Energía y vitalidad' }
    ],
    { dosis: '300-600mg extracto/ día', contraindicaciones: [
      { condicion: 'Embarazo', nivel: 'absoluta', descripcion: 'Puede causar aborto' },
      { condicion: 'Tiroides', nivel: 'precaucion', descripcion: 'Puede afectar función tiroidea' }
    ]}
  ),

  'rhodiola': createPhyto(
    'rhodiola',
    'Rodiola',
    'Rhodiola rosea',
    'Adaptógeno que mejora resistencia al estrés y rendimiento mental.',
    'Raíz',
    ['Fatiga', 'Estrés', 'Rendimiento', 'Depresión leve', 'Memoria'],
    ['energia', 'cerebro'],
    'Infusión: 200-400mg, 2x día',
    [
      { id: 'ashwagandha', tipo: 'potenciador', desc: 'Adaptógenos sinérgicos' },
      { id: 'ginseng', tipo: 'complementario', desc: 'Energía física' }
    ],
    { dosis: '200-400mg extracto (3% rosavinas)/ día', contraindicaciones: [
      { condicion: 'Bipolares', nivel: 'precaucion', descripcion: 'Riesgo de manía' }
    ]}
  ),

  // ==================== PLANTAS PARA SISTEMA DIGESTIVO ====================

  'jengibre': createPhyto(
    'jengibre',
    'Jengibre',
    'Zingiber officinale',
    'Antiemético y antiinflamatorio natural. Mejora digestión y reduce náuseas.',
    'Rizoma',
    ['Náuseas', 'Digestión lenta', 'Inflamación', 'Dolor articular'],
    ['digestion', 'articula'],
    'Infusión: 0.5-1g, 2-3x día',
    [
      { id: 'curcuma', tipo: 'potenciador', desc: 'Antiinflamatorio sinérgico' },
      { id: 'manzanilla', tipo: 'complementario', desc: 'Digestión suave' }
    ],
    { dosis: '0.5-1g polvo/ día', contraindicaciones: [
      { condicion: 'Cálculos biliares', nivel: 'precaucion', descripcion: 'Puede empeorar' },
      { condicion: 'Anticoagulantes', nivel: 'precaucion', descripcion: 'Riesgo de sangrado' }
    ]}
  ),

  'manzanilla': createPhyto(
    'manzanilla',
    'Manzanilla',
    'Matricaria chamomilla',
    'Planta digestiva y calmante. Ideal para problemas gastrointestinales.',
    'Capítulos florales',
    ['Digestión', 'Gastritis', 'Cólicos', 'Ansiedad', 'Insomnio'],
    ['digestion', 'sueno'],
    'Infusión: 2-3g en 200ml, 3-4x día',
    [
      { id: 'melisa', tipo: 'potenciador', desc: 'Efecto calmante' },
      { id: 'menta', tipo: 'complementario', desc: 'Digestión completa' }
    ],
    { dosis: '3-6g/ día' }
  ),

  'menta': createPhyto(
    'menta',
    'Menta',
    'Mentha piperita',
    'Carminativo y digestivo. Alivia síndrome del intestino irritable.',
    'Hojas',
    ['Digestión', 'Hinchazón', 'SII', 'Cefalea tensional', 'Náuseas'],
    ['digestion'],
    'Infusión: 1-2g, 3x día',
    [
      { id: 'hinojo', tipo: 'potenciador', desc: 'Carminativo sinérgico' },
      { id: 'jengibre', tipo: 'complementario', desc: 'Digestión completa' }
    ],
    { dosis: '3-6g/ día', contraindicaciones: [
      { condicion: 'ERGE', nivel: 'precaucion', descripcion: 'Puede empeorar reflujo' }
    ]}
  ),

  'hinojo': createPhyto(
    'hinojo',
    'Hinojo',
    'Foeniculum vulgare',
    'Carminativo y galactógeno. Alivia gases y cólicos.',
    'Frutos (semillas)',
    ['Gases', 'Cólicos', 'Digestión lenta', 'Lactancia'],
    ['digestion'],
    'Infusión: 2-3g, 3x día',
    [
      { id: 'menta', tipo: 'potenciador', desc: 'Carminativo combinado' },
      { id: 'anís', tipo: 'complementario', desc: 'Digestión infantil' }
    ],
    { dosis: '3-6g/ día' }
  ),

  'aloe_vera': createPhyto(
    'aloe_vera',
    'Aloe Vera',
    'Aloe barbadensis miller',
    'Planta regeneradora y antiinflamatoria. Cicatrizante natural.',
    'Gel de hojas',
    ['Digestión', 'Heridas', 'Quemaduras', 'Piel', 'Estreñimiento'],
    ['digestion', 'piel'],
    'Zumo: 30ml, 2x día',
    [
      { id: 'calendula', tipo: 'potenciador', desc: 'Regeneración de piel' },
      { id: 'curcuma', tipo: 'complementario', desc: 'Antiinflamatorio interno' }
    ],
    { dosis: '30-100ml zumo/ día', contraindicaciones: [
      { condicion: 'Embarazo', nivel: 'absoluta', descripcion: 'Estimulante uterino' },
      { condicion: 'Lactancia', nivel: 'absoluta', descripcion: 'No recomendado' }
    ], interacciones: ['Antidiabéticos', 'Diuréticos', 'Laxantes'] }
  ),

  'cúrcuma': createPhyto(
    'curcuma',
    'Cúrcuma',
    'Curcuma longa',
    'Potente antiinflamatorio y antioxidante. Activa AMPK.',
    'Rizoma',
    ['Inflamación', 'Dolor articular', 'Digestión', 'Hígado', 'Piel'],
    ['articula', 'digestion', 'corazon'],
    'Infusión: 1-2g con pimienta negra',
    [
      { id: 'jengibre', tipo: 'potenciador', desc: 'Antiinflamatorio sinérgico' },
      { id: 'pimienta_negra', tipo: 'potenciador', desc: 'Aumenta biodisponibilidad 2000%' }
    ],
    { dosis: '500-1000mg extracto/ día', contraindicaciones: [
      { condicion: 'Cálculos biliares', nivel: 'precaucion', descripcion: 'Puede empeorar' },
      { condicion: 'Anticoagulantes', nivel: 'precaucion', descripcion: 'Riesgo de sangrado' }
    ]}
  ),

  'cardomomo': createPhyto(
    'cardomomo',
    'Cardamomo',
    'Elettaria cardamomum',
    'Aromático digestivo. Alivia náuseas y flatulencia.',
    'Frutos',
    ['Digestión', 'Halitosis', 'Náuseas', 'Resfriados'],
    ['digestion'],
    'Infusión: 0.5-1g, 2x día',
    [
      { id: 'jengibre', tipo: 'potenciador', desc: 'Antiemético' },
      { id: 'canela', tipo: 'complementario', desc: 'Digestión cálida' }
    ],
    { dosis: '1-1.5g/ día' }
  ),

  'canela': createPhyto(
    'canela',
    'Canela',
    'Cinnamomum verum',
    'Reguladora de glucosa y antiinflamatoria. Mejora sensibilidad a insulina.',
    'Corteza',
    ['Glucosa', 'Metabolismo', 'Digestión', 'Antioxidante'],
    ['peso'],
    'Infusión: 1-2g, 2x día',
    [
      { id: 'berberina', tipo: 'potenciador', desc: 'Control glucémico' },
      { id: 'cromo', tipo: 'complementario', desc: 'Metabolismo de glucosa' }
    ],
    { dosis: '1-3g/ día', contraindicaciones: [
      { condicion: 'Embarazo', nivel: 'precaucion', descripcion: 'En grandes cantidades' },
      { condicion: 'Anticoagulantes', nivel: 'precaucion', descripcion: 'Riesgo de sangrado' }
    ]}
  ),

  // ==================== PLANTAS PARA SISTEMA INMUNE ====================

  'equinacea': createPhyto(
    'equinacea',
    'Equinácea',
    'Echinacea purpurea',
    'Inmunoestimulante natural. Previene y trata resfriados.',
    'Raíz y parte aérea',
    ['Resfriados', 'Gripes', 'Infecciones', 'Refuerzo inmune'],
    ['inmunidad'],
    'Decocción: 1-2g, 3x día',
    [
      { id: 'propoleo', tipo: 'potenciador', desc: 'Sinergia antimicrobiana' },
      { id: 'jengibre', tipo: 'complementario', desc: 'Resfriados' }
    ],
    { dosis: '300-500mg extracto/ día', contraindicaciones: [
      { condicion: 'Autoinmunes', nivel: 'precaucion', descripcion: 'Puede empeorar' },
      { condicion: 'Inmunosupresión', nivel: 'precaucion', descripcion: 'No recomendado' }
    ]}
  ),

  'propoleo': createPhyto(
    'propoleo',
    'Propóleo',
    'Propolis',
    'Antimicrobiano y cicatrizante natural. Fortalece defensas.',
    'Resina apícola',
    ['Infecciones', 'Garganta', 'Heridas', 'Hongos', 'Antiviral'],
    ['inmunidad', 'piel'],
    'Tintura: 20-30 gotas, 3x día',
    [
      { id: 'equinacea', tipo: 'potenciador', desc: 'Inmunoestimulante' },
      { id: 'tomillo', tipo: 'complementario', desc: 'Antiséptico respiratorio' }
    ],
    { dosis: '200-500mg/ día', contraindicaciones: [
      { condicion: 'Alergia apícola', nivel: 'absoluta', descripcion: 'Contraindicado' },
      { condicion: 'Asma', nivel: 'precaucion', descripcion: 'Puede empeorar' }
    ]}
  ),

  'ajo': createPhyto(
    'ajo',
    'Ajo',
    'Allium sativum',
    'Antimicrobiano natural y protector cardiovascular. Inmunomodulador.',
    'Bulbo',
    ['Infecciones', 'Colesterol', 'Presión arterial', 'Antiviral'],
    ['inmunidad', 'corazon'],
    'Crudo o en cápsulas',
    [
      { id: 'equinacea', tipo: 'potenciador', desc: 'Inmunoestimulante' },
      { id: 'espino_blanco', tipo: 'complementario', desc: 'Salud cardiovascular' }
    ],
    { dosis: '600-1200mg extracto/ día', contraindicaciones: [
      { condicion: 'Cirugía', nivel: 'precaucion', descripcion: 'Suspender 2 semanas antes' },
      { condicion: 'Anticoagulantes', nivel: 'precaucion', descripcion: 'Riesgo de sangrado' }
    ], interacciones: ['Warfarina', 'Aspirina', 'Antihipertensivos'] }
  ),

  'sauco': createPhyto(
    'sauco',
    'Sauco',
    'Sambucus nigra',
    'Antiviral natural para gripes y resfriados. Sudorífico.',
    'Flores y bayas',
    ['Gripes', 'Resfriados', 'Fiebre', 'Sinusitis', 'Inflamación'],
    ['inmunidad'],
    'Infusión flores: 3-5g, 3x día',
    [
      { id: 'equinacea', tipo: 'potenciador', desc: 'Inmunoestimulante' },
      { id: 'jengibre', tipo: 'complementario', desc: 'Antiviral completo' }
    ],
    { dosis: '500-1000mg extracto bayas/ día' }
  ),

  'tomillo': createPhyto(
    'tomillo',
    'Tomillo',
    'Thymus vulgaris',
    'Antiséptico respiratorio. Expectorante y antibacteriano.',
    'Hojas y flores',
    ['Tos', 'Bronquitis', 'Garganta', 'Antiséptico', 'Digestión'],
    ['inmunidad', 'digestion'],
    'Infusión: 1-2g, 3x día',
    [
      { id: 'equinacea', tipo: 'potenciador', desc: 'Resfriados' },
      { id: 'propoleo', tipo: 'complementario', desc: 'Garganta' }
    ],
    { dosis: '2-4g/ día' }
  ),

  'grindelia': createPhyto(
    'grindelia',
    'Grindelia',
    'Grindelia robusta',
    'Expectorante y antiespasmódico para vías respiratorias.',
    'Parte aérea',
    ['Tos', 'Asma', 'Bronquitis', 'Faringitis'],
    ['inmunidad'],
    'Infusión: 2-4g, 3x día',
    [
      { id: 'tomillo', tipo: 'potenciador', desc: 'Expectorante' },
      { id: 'drosera', tipo: 'complementario', desc: 'Antitusígeno' }
    ],
    { dosis: '3-6g/ día' }
  ),

  'drosera': createPhyto(
    'drosera',
    'Drosera',
    'Drosera rotundifolia',
    'Antitusígeno natural. Calma tos irritativa.',
    'Planta entera',
    ['Tos seca', 'Tos irritativa', 'Bronquitis', 'Laringitis'],
    ['inmunidad'],
    'Tintura: 20-40 gotas, 3x día',
    [
      { id: 'grindelia', tipo: 'potenciador', desc: 'Expectorante' },
      { id: 'tomillo', tipo: 'complementario', desc: 'Antiséptico respiratorio' }
    ],
    { dosis: '2-4ml tintura/ día' }
  ),

  // ==================== PLANTAS PARA SISTEMA CARDIOVASCULAR ====================

  'espino_blanco': createPhyto(
    'espino_blanco',
    'Espino Blanco',
    'Crataegus oxyacantha',
    'Cardiotónico natural. Mejora circulación y regula presión.',
    'Flores y hojas',
    ['Corazón', 'Presión arterial', 'Palpitaciones', 'Ansiedad cardíaca'],
    ['corazon'],
    'Infusión: 1-2g, 3x día',
    [
      { id: 'valeriana', tipo: 'potenciador', desc: 'Ansiedad cardíaca' },
      { id: 'ajo', tipo: 'complementario', desc: 'Colesterol' }
    ],
    { dosis: '250-500mg extracto/ día', contraindicaciones: [
      { condicion: 'Insuficiencia cardíaca', nivel: 'precaucion', descripcion: 'Usar con supervisión' }
    ]}
  ),

  'oliva': createPhyto(
    'oliva',
    'Hoja de Olivo',
    'Olea europaea',
    'Hipotensor y antioxidante. Mejora circulación y glucosa.',
    'Hojas',
    ['Presión arterial', 'Antioxidante', 'Glucosa', 'Colesterol'],
    ['corazon', 'peso'],
    'Infusión: 2-4g, 2x día',
    [
      { id: 'espino_blanco', tipo: 'potenciador', desc: 'Cardiovascular' },
      { id: 'canela', tipo: 'complementario', desc: 'Glucosa' }
    ],
    { dosis: '500-1000mg extracto/ día' }
  ),

  'ajo_negro': createPhyto(
    'ajo_negro',
    'Ajo Negro',
    'Allium sativum fermentado',
    'Ajo fermentado con mayor biodisponibilidad. Sin olor fuerte.',
    'Bulbo fermentado',
    ['Colesterol', 'Presión arterial', 'Antioxidante', 'Inmunidad'],
    ['corazon', 'inmunidad'],
    '1-3 dientes/ día o cápsulas',
    [
      { id: 'espino_blanco', tipo: 'potenciador', desc: 'Cardiovascular' },
      { id: 'oliva', tipo: 'complementario', desc: 'Presión arterial' }
    ],
    { dosis: '300-600mg extracto/ día' }
  ),

  'cacao': createPhyto(
    'cacao',
    'Cacao Puro',
    'Theobroma cacao',
    'Antioxidante rico en flavanoles. Beneficio cardiovascular.',
    'Semillas',
    ['Corazón', 'Ánimo', 'Antioxidante', 'Presión'],
    ['corazon'],
    'Polvo: 10-20g/ día',
    [
      { id: 'canela', tipo: 'potenciador', desc: 'Glucosa' },
      { id: 'maca', tipo: 'complementario', desc: 'Energía' }
    ],
    { dosis: '10-20g polvo puro/ día' }
  ),

  // ==================== PLANTAS PARA SISTEMA URINARIO ====================

  'gayuba': createPhyto(
    'gayuba',
    'Gayuba (Uva de oso)',
    'Arctostaphylos uva-ursi',
    'Antiséptico urinario natural. Trata infecciones de orina.',
    'Hojas',
    ['Infecciones urinarias', 'Cistitis', 'Diurético'],
    ['inmunidad'],
    'Decocción: 2-4g, 3x día',
    [
      { id: 'arándano', tipo: 'potenciador', desc: 'Prevención cistitis' },
      { id: 'abreo', tipo: 'complementario', desc: 'Antiséptico urinario' }
    ],
    { dosis: '3-6g/ día', contraindicaciones: [
      { condicion: 'Embarazo', nivel: 'absoluta', descripcion: 'Contraindicado' },
      { condicion: 'Lactancia', nivel: 'absoluta', descripcion: 'No recomendado' }
    ]}
  ),

  'arándano': createPhyto(
    'arándano',
    'Arándano Rojo',
    'Vaccinium macrocarpon',
    'Previne infecciones urinarias. Acidifica la orina.',
    'Fruto',
    ['Cistitis', 'Infecciones urinarias', 'Prevención'],
    ['inmunidad'],
    'Zumo: 300-400ml/ día o cápsulas',
    [
      { id: 'gayuba', tipo: 'potenciador', desc: 'Tratamiento cistitis' },
      { id: 'd-manosa', tipo: 'complementario', desc: 'Prevención cistitis' }
    ],
    { dosis: '300-500mg extracto/ día' }
  ),

  'abrótano': createPhyto(
    'abrótano',
    'Abroto (Abreo)',
    'Barosma betulina',
    'Diurético y antiséptico urinario.',
    'Hojas',
    ['Infecciones urinarias', 'Cistitis', 'Retención de líquidos'],
    ['inmunidad'],
    'Tintura: 20-30 gotas, 3x día',
    [
      { id: 'gayuba', tipo: 'potenciador', desc: 'Antiséptico urinario' },
      { id: 'arándano', tipo: 'complementario', desc: 'Prevención' }
    ],
    { dosis: '1-2ml tintura/ día' }
  ),

  // ==================== PLANTAS PARA PIEL ====================

  'calendula': createPhyto(
    'calendula',
    'Caléndula',
    'Calendula officinalis',
    'Cicatrizante y antiinflamatoria. Ideal para heridas y eczemas.',
    'Flores',
    ['Heridas', 'Eccemas', 'Quemaduras', 'Dermatitis', 'Úlceras'],
    ['piel'],
    'Infusión para uso tópico o pomada',
    [
      { id: 'aloe_vera', tipo: 'potenciador', desc: 'Regeneración cutánea' },
      { id: 'hipérico', tipo: 'complementario', desc: 'Cicatrización' }
    ],
    { dosis: '1-2g infusión uso tópico, 3-4x día' }
  ),

  'hipérico_aceite': createPhyto(
    'hipérico_aceite',
    'Aceite de Hipérico',
    'Hypericum perforatum',
    'Cicatrizante y analgésico tópico. Para quemaduras y neuralgias.',
    'Flores en aceite',
    ['Heridas', 'Quemaduras', 'Neuralgias', 'Músculos', 'Dolor'],
    ['articula', 'piel'],
    'Aplicar topicamente 2-3x día',
    [
      { id: 'calendula', tipo: 'potenciador', desc: 'Cicatrización' },
      { id: 'arnica', tipo: 'complementario', desc: 'Dolor muscular' }
    ],
    { contraindicaciones: [
      { condicion: 'Fotosensibilidad', nivel: 'precaucion', descripcion: 'Puede causar reacciones fotosensibles' }
    ]}
  ),

  'lavanda': createPhyto(
    'lavanda',
    'Lavanda',
    'Lavandula angustifolia',
    'Calmante y cicatrizante. Antiséptico suave.',
    'Flores',
    ['Heridas', 'Quemaduras', 'Estrés', 'Insomnio', 'Picaduras'],
    ['sueno', 'piel'],
    'Aceite esencial diluido o infusión',
    [
      { id: 'melisa', tipo: 'potenciador', desc: 'Calmante' },
      { id: 'tea_tree', tipo: 'complementario', desc: 'Antiséptico' }
    ],
    { dosis: '2-4 gotas aceite esencial diluido, 3x día' }
  ),

  'tea_tree': createPhyto(
    'tea_tree',
    'Tea Tree (Melaleuca)',
    'Melaleuca alternifolia',
    'Antiséptico y antifúngico potente. Para heridas y hongos.',
    'Hojas (aceite esencial)',
    ['Heridas', 'Hongos', 'Acné', 'Picaduras', 'Antiviral'],
    ['piel'],
    'Aceite esencial diluido al 1-5%',
    [
      { id: 'lavanda', tipo: 'potenciador', desc: 'Antiséptico suave' },
      { id: 'propoleo', tipo: 'complementario', desc: 'Antimicrobiano' }
    ],
    { contraindicaciones: [
      { condicion: 'Embarazo', nivel: 'precaucion', descripcion: 'No usar aceite esencial internamente' }
    ]}
  ),

  // ==================== PLANTAS PARA SISTEMA MUSCULOESQUELÉTICO ====================

  'arnica': createPhyto(
    'arnica',
    'Árnica',
    'Arnica montana',
    'Antiinflamatorio y analgésico tópico. Para golpes y contusiones.',
    'Flores',
    ['Golpes', 'Contusiones', 'Dolores musculares', 'Hematomas', 'Artrosis'],
    ['articula'],
    'Pomada o gel tópico',
    [
      { id: 'hipérico_aceite', tipo: 'potenciador', desc: 'Cicatrizante' },
      { id: 'cúrcuma', tipo: 'complementario', desc: 'Antiinflamatorio interno' }
    ],
    { contraindicaciones: [
      { condicion: 'Heridas abiertas', nivel: 'absoluta', descripcion: 'No aplicar sobre heridas' },
      { condicion: 'Embarazo', nivel: 'precaucion', descripcion: 'Uso tópico solo con supervisión' }
    ]}
  ),

  'harpagofito': createPhyto(
    'harpagofito',
    'Harpagofito',
    'Harpagophytum procumbens',
    'Antiinflamatorio natural para articulaciones. Trata artrosis.',
    'Raíz secundaria',
    ['Artrosis', 'Artritis', 'Dolor articular', 'Lumbalgia', 'Tendinitis'],
    ['articula'],
    'Decocción: 1-2g, 2x día',
    [
      { id: 'cúrcuma', tipo: 'potenciador', desc: 'Antiinflamatorio sinérgico' },
      { id: 'colageno', tipo: 'complementario', desc: 'Articulaciones' }
    ],
    { dosis: '1.5-3g extracto/ día', contraindicaciones: [
      { condicion: 'Embarazo', nivel: 'absoluta', descripcion: 'Contraindicado' },
      { condicion: 'Úlceras', nivel: 'precaucion', descripcion: 'Puede irritar estómago' }
    ], interacciones: ['Anticoagulantes', 'Antidiabéticos', 'Antiinflamatorios'] }
  ),

  'ortosifón': createPhyto(
    'ortosifón',
    'Ortosifón (Té de Java)',
    'Orthosiphon stamineus',
    'Diurético natural. Elimina líquidos y toxinas.',
    'Hojas',
    ['Retención de líquidos', 'Celulitis', 'Presión arterial', 'Hígado'],
    ['peso', 'detox'],
    'Infusión: 2-4g, 2x día',
    [
      { id: 'hinojo', tipo: 'potenciador', desc: 'Diurético suave' },
      { id: 'alcachofa', tipo: 'complementario', desc: 'Depurativo' }
    ],
    { dosis: '4-8g/ día' }
  ),

  'cola_de_caballo': createPhyto(
    'cola_de_caballo',
    'Cola de Caballo',
    'Equisetum arvense',
    'Diurético y remineralizante. Rico en sílice.',
    'Tallos estériles',
    ['Retención de líquidos', 'Huesos', 'Uñas', 'Piel', 'Cistitis'],
    ['huesos', 'detox'],
    'Infusión: 2-4g, 3x día',
    [
      { id: 'ortosifón', tipo: 'potenciador', desc: 'Diurético' },
      { id: 'avena', tipo: 'complementario', desc: 'Remineralizante' }
    ],
    { dosis: '3-6g/ día', contraindicaciones: [
      { condicion: 'Corazón', nivel: 'precaucion', descripcion: 'No usar en insuficiencia cardíaca' }
    ]}
  ),

  // ==================== PLANTAS PARA SISTEMA ENDOCRINO ====================

  'maca': createPhyto(
    'maca',
    'Maca',
    'Lepidium meyenii',
    'Adaptógeno andino. Regula hormonas y aumenta libido.',
    'Raíz',
    ['Energía', 'Libido', 'Fertilidad', 'Menopausia', 'Estrés'],
    ['energia', 'fertilidad'],
    'Polvo: 1-3 cucharadas/ día',
    [
      { id: 'ashwagandha', tipo: 'potenciador', desc: 'Adaptógenos combinados' },
      { id: 'tongkat_ali', tipo: 'complementario', desc: 'Testosterona' }
    ],
    { dosis: '1.5-3g/ día' }
  ),

  'saw_palmetto': createPhyto(
    'saw_palmetto',
    'Saw Palmetto',
    'Serenoa repens',
    'Para hiperplasia prostática benigna. Regula DHT.',
    'Frutos',
    ['Próstata', 'HBP', 'Caída cabello', 'Libido'],
    ['fertilidad'],
    'Cápsulas: 160mg, 2x día',
    [
      { id: 'ortiga_raiz', tipo: 'potenciador', desc: 'Próstata' },
      { id: 'maca', tipo: 'complementario', desc: 'Energía sexual' }
    ],
    { dosis: '320mg extracto/ día' }
  ),

  'ortiga_raiz': createPhyto(
    'ortiga_raiz',
    'Ortiga (Raíz)',
    'Urtica dioica',
    'Antiandrogénica. Trata HBP y caída androgenética.',
    'Raíz',
    ['Próstata', 'HBP', 'Caída cabello', 'Alergias'],
    ['fertilidad'],
    'Tintura o cápsulas',
    [
      { id: 'saw_palmetto', tipo: 'potenciador', desc: 'Próstata' },
      { id: 'saw_palmetto', tipo: 'complementario', desc: 'Caída cabello' }
    ],
    { dosis: '120-300mg extracto/ día' }
  ),

  'salvia': createPhyto(
    'salvia',
    'Salvia',
    'Salvia officinalis',
    'Reguladora hormonal. Alivia síntomas menopausia.',
    'Hojas',
    ['Menopausia', 'Sudoración', 'Sofocos', 'Digestión', 'Memoria'],
    ['fertilidad', 'cerebro'],
    'Infusión: 1-2g, 2x día',
    [
      { id: 'maca', tipo: 'potenciador', desc: 'Hormonas' },
      { id: 'lúpulo', tipo: 'complementario', desc: 'Menopausia' }
    ],
    { dosis: '1-2g infusión/ día', contraindicaciones: [
      { condicion: 'Embarazo', nivel: 'absoluta', descripcion: 'Abortiva' },
      { condicion: 'Epilepsia', nivel: 'precaucion', descripcion: 'Puede provocar convulsiones' }
    ]}
  ),

  'lúpulo': createPhyto(
    'lúpulo',
    'Lúpulo',
    'Humulus lupulus',
    'Sedante y reguladora hormonal. Para menopausia y ansiedad.',
    'Conos',
    ['Insomnio', 'Menopausia', 'Ansiedad', 'Sofocos'],
    ['sueno', 'fertilidad'],
    'Infusión: 0.5-1g, 2x día',
    [
      { id: 'salvia', tipo: 'potenciador', desc: 'Menopausia' },
      { id: 'valeriana', tipo: 'complementario', desc: 'Insomnio' }
    ],
    { dosis: '0.5-1g/ día' }
  ),

  // ==================== PLANTAS PARA DEPURACIÓN ====================

  'alcachofa': createPhyto(
    'alcachofa',
    'Alcachofa',
    'Cynara scolymus',
    'Depurativa y hepatoprotectora. Mejora función hepática.',
    'Hojas',
    ['Hígado', 'Colesterol', 'Digestión', 'Depuración', 'Celulitis'],
    ['detox', 'digestion', 'peso'],
    'Infusión o extracto',
    [
      { id: 'cardo_mariano', tipo: 'potenciador', desc: 'Hepatoprotector' },
      { id: 'ortosifón', tipo: 'complementario', desc: 'Diurético' }
    ],
    { dosis: '2-5g hojas/ día' }
  ),

  'cardo_mariano': createPhyto(
    'cardo_mariano',
    'Cardo Mariano',
    'Silybum marianum',
    'Hepatoprotector potentísimo. Regenera células hepáticas.',
    'Frutos (semillas)',
    ['Hígado', 'Depuración', 'Resaca', 'Cirrosis', 'Hígado graso'],
    ['detox'],
    'Infusión o extracto',
    [
      { id: 'alcachofa', tipo: 'potenciador', desc: 'Función hepática' },
      { id: 'diente_león', tipo: 'complementario', desc: 'Depuración' }
    ],
    { dosis: '140-280mg silimarina/ día', contraindicaciones: [
      { condicion: 'Embarazo', nivel: 'precaucion', descripcion: 'Usar con precaución' }
    ]}
  ),

  'diente_león': createPhyto(
    'diente_león',
    'Diente de León',
    'Taraxacum officinale',
    'Depurativo y diurético suave. Rico en potasio.',
    'Raíz y hojas',
    ['Hígado', 'Depuración', 'Retención', 'Digestión', 'Piel'],
    ['detox', 'digestion'],
    'Infusión: 2-4g, 2x día',
    [
      { id: 'cardo_mariano', tipo: 'potenciador', desc: 'Hepatoprotector' },
      { id: 'cola_de_caballo', tipo: 'complementario', desc: 'Diurético' }
    ],
    { dosis: '3-6g/ día' }
  ),

  'boldo': createPhyto(
    'boldo',
    'Boldo',
    'Peumus boldus',
    'Hepatoprotector y colerético. Estimula bilis.',
    'Hojas',
    ['Hígado', 'Vesícula', 'Digestión', 'Gases'],
    ['detox', 'digestion'],
    'Infusión: 1-2g, 2x día',
    [
      { id: 'cardo_mariano', tipo: 'potenciador', desc: 'Hepatoprotector' },
      { id: 'alcachofa', tipo: 'complementario', desc: 'Digestión' }
    ],
    { dosis: '2-4g/ día', contraindicaciones: [
      { condicion: 'Obstrucción biliar', nivel: 'absoluta', descripcion: 'Contraindicado' },
      { condicion: 'Embarazo', nivel: 'absoluta', descripcion: 'Contraindicado' }
    ]}
  ),

};

// Funciones helper
export function getPhytotherapyByObjective(objective: HealthObjective): IngredientInfo[] {
  return Object.values(PHYTOTHERAPY_DATABASE).filter(
    ing => ing.objetivos_salud.includes(objective)
  );
}

export function searchPhytotherapy(term: string): IngredientInfo[] {
  const normalized = term.toLowerCase();
  return Object.values(PHYTOTHERAPY_DATABASE).filter(
    ing => 
      ing.nombre.toLowerCase().includes(normalized) ||
      ing.nombre_latin?.toLowerCase().includes(normalized) ||
      ing.descripcion.toLowerCase().includes(normalized) ||
      ing.beneficios.some(b => b.toLowerCase().includes(normalized))
  );
}

export const phytotherapyCount = Object.keys(PHYTOTHERAPY_DATABASE).length;
