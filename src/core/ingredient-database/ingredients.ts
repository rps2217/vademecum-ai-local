/**
 * Ingredient Database - Base de datos de ingredientes
 * Homeopatía, Fitoterapia y Suplementos
 */

export interface IngredientInfo {
  id: string;
  name: string;
  scientificName?: string;
  category: 'homeopatia' | 'fitoterapia' | 'suplemento' | 'mineral' | 'vitamin' | 'aminoacido' | 'otro';
  origin: {
    type: 'planta' | 'mineral' | 'animal' | 'sintetico' | 'microorganismo';
    description: string;
  };
  description: string;
  mechanism: string;
  indications: string[];
  contraindications: string[];
  interactions: string[];
  dosage: string;
  sideEffects?: string[];
  synonyms: string[];
  warnings?: string[];
}

export type IngredientDatabase = Record<string, IngredientInfo>;

// Import from extended database
import { 
  getExtendedIngredientDatabase, 
  findExtendedIngredient, 
  getExtendedIngredientStats,
  HOMEOPATHY_DATABASE,
  HERBAL_DATABASE,
  ExtendedIngredientInfo
} from './extended-database';

// Re-export for external use
export { getExtendedIngredientDatabase, findExtendedIngredient, getExtendedIngredientStats, HOMEOPATHY_DATABASE, HERBAL_DATABASE };
export type { ExtendedIngredientInfo };

// Base de datos de ingredientes principales
export const INGREDIENT_DATABASE: IngredientDatabase = {
  'china': {
    id: 'china',
    name: 'China (Canela de China)',
    scientificName: 'Cinchona officinalis',
    category: 'homeopatia',
    origin: {
      type: 'planta',
      description: 'Corteza del árbol nativo de América del Sur. Fuente original de quinina.',
    },
    description: 'Remedio homeopático para debilidad, fatiga y problemas digestivos.',
    mechanism: 'En homeopatía: estimula la capacidad vital del organismo. La quinina actúa como antipirético y antimalárico.',
    indications: ['Fatiga y debilidad general', 'Pérdida de fluidos corporales', 'Distensión abdominal con gases', 'Calambres musculares'],
    contraindications: ['Hipersensibilidad a la quinina', 'Embarazo (precaución)', 'G6PD deficiencia'],
    interactions: ['Warfarina (puede aumentar riesgo de sangrado)', 'Antiarrítmicos (consultar médico)'],
    dosage: 'CH 5 a CH 15: 3-5 gránulos, 2-3 veces al día.',
    synonyms: ['china rubra', 'quina', 'corteza de china', 'cinchona'],
    warnings: ['Contiene quinina natural', 'Consultar con médico si toma anticoagulantes'],
  },
  'arnica': {
    id: 'arnica',
    name: 'Árnica Montana',
    scientificName: 'Arnica montana',
    category: 'homeopatia',
    origin: {
      type: 'planta',
      description: 'Planta herbácea de las montañas de Europa. Familia Asteraceae.',
    },
    description: 'Remedio para traumatismos, golpes y fatiga muscular.',
    mechanism: 'Modula la respuesta inflamatoria y el dolor postraumático. Reduce hematomas.',
    indications: ['Traumatismos y golpes', 'Fatiga muscular', 'Hematomas y moretones', 'Post-operatorio dental', 'Esguinces y distensiones'],
    contraindications: ['Hipersensibilidad a Asteraceae', 'No aplicar sobre heridas abiertas', 'Niños menores de 3 años (tópico)'],
    interactions: ['Puede potenciar efectos de anticoagulantes'],
    dosage: 'CH 5 a CH 9: 3-5 gránulos cada 2-4 horas en fase aguda. Tópico: gel 2-3 veces al día.',
    synonyms: ['arnica montana', 'tabaco de montaña', 'hierba de las caídas'],
    warnings: ['Solo uso tópico en lesiones cerradas', 'No exceder dosis recomendadas'],
  },
  'belladonna': {
    id: 'belladonna',
    name: 'Belladonna',
    scientificName: 'Atropa belladonna',
    category: 'homeopatia',
    origin: {
      type: 'planta',
      description: 'Planta venenosa originaria de Europa. Muy tóxica en estado bruto.',
    },
    description: 'Remedio para procesos agudos con inicio súbito, calor, enrojecimiento y dolor pulsátil.',
    mechanism: 'Modula el sistema nervioso autónomo regulando la fiebre y la inflamación.',
    indications: ['Otitis media aguda', 'Amigdalitis aguda', 'Cefaleas pulsátiles', 'Fiebre alta de inicio súbito', 'Golpe de calor'],
    contraindications: ['Glaucoma', 'Hipertrofia prostática', 'Obstrucción intestinal', 'Embarazo'],
    interactions: ['Potencia efectos de anticolinérgicos', 'Interacciona con antihistamínicos'],
    dosage: 'CH 5 a CH 15: 3-5 gránulos cada 30 minutos a 2 horas según intensidad.',
    synonyms: ['belladonna', 'bella doncella', 'deadly nightshade'],
    warnings: ['TÓXICO en estado bruto', 'Solo usar en diluciones homeopáticas'],
  },
  'nux vomica': {
    id: 'nux-vomica',
    name: 'Nux Vomica',
    scientificName: 'Strychnos nux-vomica',
    category: 'homeopatia',
    origin: {
      type: 'planta',
      description: 'Árbol de India y sudeste asiático. Semillas contienen estricnina.',
    },
    description: 'Remedio para síntomas digestivos por excesos: comida, alcohol, tabaco, estrés.',
    mechanism: 'Regula el sistema nervioso entérico y el eje estrés-digestión.',
    indications: ['Estreñimiento con esfuerzo', 'Náuseas matutinas', 'Reflujo por estrés', 'Resaca', 'Indigestión por excesos', 'Insomnio de tipo NUX'],
    contraindications: ['Embarazo (consultar médico)', 'Enfermedades hepáticas graves', 'Úlcera péptica activa'],
    interactions: ['Potencia estimulantes del sistema nervioso', 'Precaución con antidepresivos'],
    dosage: 'CH 5 a CH 15: 3-5 gránulos, 15 minutos antes de comidas.',
    synonyms: ['nux vómica', 'vómito de nuez', 'strychnine tree'],
    warnings: ['Contiene estricnina en estado bruto', 'Dilución homeopática segura'],
  },
  'curcuma': {
    id: 'curcuma',
    name: 'Cúrcuma',
    scientificName: 'Curcuma longa',
    category: 'fitoterapia',
    origin: {
      type: 'planta',
      description: 'Rizoma del sudeste asiático. Principal especia del curry.',
    },
    description: 'Potente antiinflamatorio y antioxidante natural. El principio activo es la curcumina.',
    mechanism: 'La curcumina inhibe NF-κB, reduciendo citoquinas inflamatorias. Antioxidante que potencia glutatión.',
    indications: ['Artritis y artrosis', 'Dolor articular y muscular', 'Inflamación digestiva', 'Síndrome metabólico', 'Salud hepática', 'Función cognitiva'],
    contraindications: ['Obstrucción biliar', 'Cálculos biliares', 'Cirugía (suspender 2 semanas antes)', 'Embarazo'],
    interactions: ['Potencia efecto de anticoagulantes', 'Mejor absorción con pimienta negra'],
    dosage: 'Extracto 95% curcumina: 500-1000 mg/día en 2 dosis.',
    synonyms: ['turmeric', 'açafrão da terra', 'haridra'],
    warnings: ['Suspender antes de cirugía', 'Consultar médico si toma anticoagulantes'],
  },
  'jengibre': {
    id: 'jengibre',
    name: 'Jengibre',
    scientificName: 'Zingiber officinale',
    category: 'fitoterapia',
    origin: {
      type: 'planta',
      description: 'Rizoma tropical originaria del sudeste asiático. Usado hace más de 5000 años.',
    },
    description: 'Antiinflamatorio natural, antiemético y estimulante digestivo.',
    mechanism: 'Los gingeroles inhiben COX-1 y COX-2. Acción antiemética por bloqueo de receptores 5-HT3.',
    indications: ['Náuseas y vómitos', 'Dispepsia funcional', 'Dolor articular', 'Dolor muscular post-ejercicio', 'Mejora circulación', 'Dolor de garganta'],
    contraindications: ['Cálculos biliares', 'Cirugía (suspender 2 semanas)', 'Embarazo (dosis altas)'],
    interactions: ['Potencia anticoagulantes', 'Puede reducir glucemia'],
    dosage: 'Raíz fresca: 1-2 g/día. Extracto: 250-500 mg 2-3 veces al día.',
    synonyms: ['ginger', 'kion', 'gengibre'],
    warnings: ['Dosis >2g puede causar reflujo', 'No masticar en ayunas'],
  },
  'ginseng': {
    id: 'ginseng',
    name: 'Ginseng',
    scientificName: 'Panax ginseng',
    category: 'fitoterapia',
    origin: {
      type: 'planta',
      description: 'Raíz de Corea, China y Siberia. Mínimo 5-6 años de cultivo.',
    },
    description: 'Adaptógeno que aumenta resistencia al estrés. Mejora rendimiento cognitivo y energía.',
    mechanism: 'Las ginsenósidas modulan eje HPA, reduciendo cortisol. Mejora cognición y función inmune.',
    indications: ['Fatiga física y mental', 'Estrés y burnout', 'Déficit de atención', 'Recuperación post-enfermedad', 'Menopausia'],
    contraindications: ['Embarazo y lactancia', 'Hipertensión no controlada', 'Insomnio severo', 'Niños <12 años'],
    interactions: ['Interacciona con warfarina', 'Potencia estimulantes', 'Precaución con hipoglucemiantes'],
    dosage: 'Extracto (4-7% ginsenósidos): 200-400 mg/día. Ciclos de 2-3 semanas.',
    synonyms: ['panax ginseng', 'ginseng coreano', 'ren shen'],
    warnings: ['Efecto estimulante - no tomar por la tarde', 'Ciclar uso'],
  },
  'valeriana': {
    id: 'valeriana',
    name: 'Valeriana',
    scientificName: 'Valeriana officinalis',
    category: 'fitoterapia',
    origin: {
      type: 'planta',
      description: 'Planta herbácea de Europa. Usada como sedante desde la antigüedad romana.',
    },
    description: 'Sedante natural para insomnio y ansiedad. Mejora calidad del sueño sin resaca.',
    mechanism: 'Los ácidos valerenicos potencian receptores GABA-A, aumentando GABA en sinapsis.',
    indications: ['Insomnio', 'Ansiedad leve a moderada', 'Nerviosismo', 'Calambres musculares nocturnos', 'Tensión muscular por estrés'],
    contraindications: ['Embarazo (1er trimestre)', 'Lactancia', 'Hepatopatías severas'],
    interactions: ['Potencia benzodiacepinas', 'Potencia barbitúricos'],
    dosage: 'Extracto (0.8% ácidos valerenicos): 400-900 mg antes de acostarse.',
    synonyms: ['valerian root', 'hierba de los gatos', 'all-heal'],
    warnings: ['Efecto puede tardar 2-4 semanas', 'No combinar con alcohol'],
  },
  'ashwagandha': {
    id: 'ashwagandha',
    name: 'Ashwagandha',
    scientificName: 'Withania somnifera',
    category: 'fitoterapia',
    origin: {
      type: 'planta',
      description: 'Planta de medicina ayurvédica de India. "Ashwagandha" significa "olor a caballo".',
    },
    description: 'Adaptógeno para estrés crónico, ansiedad, fatiga adrenal y optimización del sueño.',
    mechanism: 'Withanólidos modulan eje HPA, reduciendo cortisol. Activación de receptores GABA.',
    indications: ['Estrés crónico', 'Ansiedad', 'Fatiga adrenal', 'Insomnio adaptativo', 'Baja libido', 'Déficit de atención'],
    contraindications: ['Embarazo', 'Lactancia', 'Hipertiroidismo', 'Enfermedades autoinmunes activas'],
    interactions: ['Potencia benzodiacepinas', 'Puede bajar glucemia'],
    dosage: 'Extracto KSM-66 (5% withanólidos): 300-600 mg/día.',
    synonyms: ['withania', 'ginseng indio', 'winter cherry'],
    warnings: ['Puede causar somnolencia', 'Monitorizar TSH si hay hipotiroidismo'],
  },
  'reishi': {
    id: 'reishi',
    name: 'Reishi',
    scientificName: 'Ganoderma lucidum',
    category: 'fitoterapia',
    origin: {
      type: 'microorganismo',
      description: 'Hongo medicinal chino con más de 2000 años. "El hongo de la inmortalidad".',
    },
    description: 'Inmunomodulador, antioxidante y adaptógeno. Apoya función hepática y cardíaca.',
    mechanism: 'Beta-glucanos activan macrófagos y células NK. Ácidos ganodérmicos modulan inflamación.',
    indications: ['Optimización inmune', 'Alergias', 'Apoyo hepático', 'Colesterol alto', 'Ansiedad y sueño'],
    contraindications: ['Cirugía (suspender 2 semanas)', 'Embarazo', 'Enfermedades autoinmunes activas'],
    interactions: ['Potencia anticoagulantes', 'Precaución con hipoglucemiantes'],
    dosage: 'Extracto (10:1): 1-2 g/día.',
    synonyms: ['ganoderma', 'lingzhi', 'reishi rojo'],
    warnings: ['Calidad variable', 'Efecto anticoagulante leve'],
  },
  'gaba': {
    id: 'gaba',
    name: 'GABA',
    scientificName: 'Ácido gamma-aminobutírico',
    category: 'aminoacido',
    origin: {
      type: 'sintetico',
      description: 'Neurotransmisor inhibitorio principal del SNC. Producido naturalmente en el cerebro.',
    },
    description: 'Sedante y ansiolítico natural. Reduce ansiedad y promueve relajación muscular.',
    mechanism: 'Se une a receptores GABA-A y GABA-B, reduciendo actividad neuronal.',
    indications: ['Ansiedad generalizada', 'Insomnio', 'Estrés', 'Tensión muscular', 'Trastorno de pánico'],
    contraindications: ['Embarazo', 'Lactancia', 'Enfermedad hepática severa'],
    interactions: ['Potencia benzodiacepinas y alcohol'],
    dosage: '250-750 mg 2-3 veces al día. Máximo: 3 g/día.',
    synonyms: ['ácido gamma-aminobutírico', 'gamma-aminobutyric acid'],
    warnings: ['No mezclar con alcohol', 'No conducir después de tomar'],
  },
  'l-teanina': {
    id: 'l-teanina',
    name: 'L-Teanina',
    scientificName: 'L-Teanina',
    category: 'aminoacido',
    origin: {
      type: 'planta',
      description: 'Aminoácido del té verde (Camellia sinensis). Responsable del sabor umami.',
    },
    description: 'Promueve relajación sin somnolencia. Mejora atención y reduce estrés.',
    mechanism: 'Aumenta ondas alfa cerebrales. Eleva GABA, dopamina y serotonina.',
    indications: ['Estrés y ansiedad', 'Mejora de concentración', 'Insomnio', 'Reducción de estrés por cafeína'],
    contraindications: ['Embarazo (datos limitados)', 'Lactancia (datos limitados)'],
    interactions: ['Sinergia con cafeína'],
    dosage: '100-200 mg 1-2 veces al día.',
    synonyms: ['teanina', 'L-theanine', 'suntheanine'],
    warnings: ['Efecto óptimo requiere varias semanas'],
  },
  'nacetilcisteina': {
    id: 'nacetilcisteina',
    name: 'N-Acetilcisteína (NAC)',
    scientificName: 'N-Acetil-L-cisteína',
    category: 'aminoacido',
    origin: {
      type: 'sintetico',
      description: 'Derivado del aminoácido cisteína. Mucolítico usado en medicina. Precursor del glutatión.',
    },
    description: 'Potente antioxidante, hepatoprotector y mucolítico.',
    mechanism: 'Aumenta glutatión (antioxidante). Modula glutamato. Antiinflamatorio.',
    indications: ['Enfermedades hepáticas', 'Enfermedades respiratorias', 'TOC', 'Fertilidad masculina', 'Neuroprotección'],
    contraindications: ['Úlcera péptica activa', 'Asma severa'],
    interactions: ['Precaución con nitroglicerina', 'Precaución con anticoagulantes'],
    dosage: 'Mucolítico: 600 mg 1-2 veces al día.',
    synonyms: ['NAC', 'n-acetyl cysteine', 'mucomyst'],
    warnings: ['Mal aliento y olor sulfuroso', 'Beber agua abundante'],
  },
  'colageno': {
    id: 'colageno',
    name: 'Colágeno',
    scientificName: 'Colágeno hidrolizado',
    category: 'suplemento',
    origin: {
      type: 'animal',
      description: 'Proteína más abundante del cuerpo. Extraído de bovino, porcino o marino.',
    },
    description: 'Proteína estructural para piel, articulaciones y huesos. Suplemento anti-aging popular.',
    mechanism: 'Los péptidos de colágeno estimulan fibroblastos y condrocitos. Favorece síntesis de colágeno propio.',
    indications: ['Salud articular', 'Envejecimiento cutáneo', 'Salud ósea', 'Heridas', 'Cabello y uñas'],
    contraindications: ['Alergia a colágeno de origen', 'Enfermedad renal severa'],
    interactions: ['Vitamina C potencia absorción', 'Puede interactuar con anticoagulantes'],
    dosage: '2.5-10 g/día de péptidos de colágeno.',
    synonyms: ['collagen', 'colágeno hidrolizado', 'colágeno marino'],
    warnings: ['Preferir péptidos de bajo peso molecular', 'Compatible con vitamina C'],
  },
  'vitamina-c': {
    id: 'vitamina-c',
    name: 'Vitamina C',
    scientificName: 'Ácido L-ascórbico',
    category: 'vitamin',
    origin: {
      type: 'sintetico',
      description: 'Vitamina hidrosoluble esencial. Presente en cítricos, kiwis y pimientos.',
    },
    description: 'Antioxidante esencial para colágeno, sistema inmune y absorción de hierro.',
    mechanism: 'Cofactor de prolil y lisil hidroxilasas. Potencia función leucocitaria. Recicla tetrahidrobiopterina.',
    indications: ['Prevención de resfriados', 'Inmunidad', 'Colágeno', 'Absorción de hierro', 'Cicatrización'],
    contraindications: ['Cálculos renales (oxalato)', 'Déficit de G6PD'],
    interactions: ['Aumenta absorción de hierro', 'Mejora absorción de Vitamina E'],
    dosage: 'RDA: 75-90 mg/día. Óptimo: 200-500 mg/día. Máximo: 2000 mg/día.',
    synonyms: ['ascorbic acid', 'ácido ascórbico', 'cevit'],
    warnings: ['Absorción óptima: dosis divididas <500 mg'],
  },
  'vitamina-d': {
    id: 'vitamina-d',
    name: 'Vitamina D',
    scientificName: 'Colecalciferol (D3)',
    category: 'vitamin',
    origin: {
      type: 'sintetico',
      description: 'Vitamina liposoluble que actúa como hormona. Síntetizada por la piel con UV.',
    },
    description: 'Esencial para salud ósea, función inmune y regulación de inflamación.',
    mechanism: 'Se convierte en calcitriol y regula expresión de >200 genes. Modula células T.',
    indications: ['Deficiencia de vitamina D', 'Osteoporosis', 'Función inmune', 'Depresión estacional'],
    contraindications: ['Hipercalcemia', 'Hiperparatiroidismo primario'],
    interactions: ['Potencia efecto de digitálicos', 'Mejora absorción de calcio'],
    dosage: 'Deficiencia: 2000-5000 UI/día. Mantenimiento: 1000-2000 UI/día.',
    synonyms: ['cholecalciferol', 'colecalciferol', 'vitamina D3'],
    warnings: ['Solo suplementar si hay deficiencia confirmada', 'NO autosuplementar'],
  },
  'zinc': {
    id: 'zinc',
    name: 'Zinc',
    scientificName: 'Zinc (Zn)',
    category: 'mineral',
    origin: {
      type: 'mineral',
      description: 'Oligoelemento esencial. Cofactor de >300 enzimas.',
    },
    description: 'Esencial para sistema inmune, cicatrización y síntesis de proteínas.',
    mechanism: 'Cofactor de metaloenzimas. Mantiene dedos de zinc en factores de transcripción.',
    indications: ['Infecciones (resfriado)', 'Acné', 'Cicatrización', 'Alopecia', 'Diarrea (niños)', 'Hipogonadismo'],
    contraindications: ['Enfermedad de Wilson', 'Insuficiencia renal'],
    interactions: ['Inhibe absorción de cobre', 'Reduce absorción de quinolonas'],
    dosage: 'RDA: 8-11 mg/día. Suplemento: 15-30 mg/día. Máximo: 40 mg/día.',
    synonyms: ['zinc gluconate', 'zinc picolinate', 'zinc citrate'],
    warnings: ['NO tomar con leche o fibra', 'Con cobre si uso >25 mg/día prolongado'],
  },
  'magnesio': {
    id: 'magnesio',
    name: 'Magnesio',
    scientificName: 'Magnesio (Mg)',
    category: 'mineral',
    origin: {
      type: 'mineral',
      description: 'Cuarto mineral más abundante. Cofactor de >600 enzimas.',
    },
    description: 'Relajante natural de músculos y nervios. Esencial para energía celular.',
    mechanism: 'Cofactor de ATP. Regula canales iónicos. Relajante muscular (antagonista de calcio).',
    indications: ['Calambres musculares', 'Estreñimiento', 'Migrañas', 'Insomnio', 'Ansiedad', 'Fibromialgia'],
    contraindications: ['Insuficiencia renal', 'Bloqueo cardíaco', 'Miastenia gravis'],
    interactions: ['Reduce absorción de bifosfonatos', 'Sinergia con vitamina D3'],
    dosage: 'RDA: 310-420 mg/día. Suplemento: 200-400 mg/día.',
    synonyms: ['magnesium glycinate', 'magnesio glicinato', 'magnesio citrato'],
    warnings: ['Mejor: glicinato, treonato, citrato', 'Trealato: mejor para cerebro'],
  },
  'coq10': {
    id: 'coq10',
    name: 'CoQ10',
    scientificName: 'Coenzima Q10',
    category: 'suplemento',
    origin: {
      type: 'sintetico',
      description: 'Antioxidante liposoluble producido naturalmente. Concentrado en mitocondrias.',
    },
    description: 'Apoya producción de energía celular. Importante para corazón y función cognitiva.',
    mechanism: 'Transporte electrones en cadena respiratoria. Antioxidante que protege membranas.',
    indications: ['Enfermedad cardiovascular', 'Migrañas', 'Enfermedad periodontal', 'Fatiga', 'Miopatías por estatinas'],
    contraindications: ['Embarazo (datos limitados)', 'Lactancia (datos limitados)'],
    interactions: ['Puede reducir requerimiento de warfarina', 'Sinergia con magnesio'],
    dosage: '100-300 mg/día en 2-3 dosis. Preferir ubiquinol (>40 años).',
    synonyms: ['coenzyme Q10', 'ubiquinol', 'ubiquinona'],
    warnings: ['>40 años: preferir ubiquinol', 'Absorción mejora con grasas'],
  },
  'omega-3': {
    id: 'omega-3',
    name: 'Omega-3',
    scientificName: 'Ácidos grasos omega-3',
    category: 'suplemento',
    origin: {
      type: 'animal',
      description: 'Ácidos grasos esenciales. EPA y DHA de aceite de pescado. ALA de plantas.',
    },
    description: 'Ácidos grasos esenciales para cerebro, corazón y control de inflamación.',
    mechanism: 'EPA y DHA se incorporan a membranas celulares. Precursores de resolvinas y protectinas.',
    indications: ['Salud cardiovascular', 'Triglicéridos altos', 'Inflamación articular', 'Función cognitiva', 'Depresión'],
    contraindications: ['Alergia a pescado', 'Cirugía (precaución)'],
    interactions: ['Potencia anticoagulantes', 'Sinergia con vitamina D3'],
    dosage: 'EPA+DHA: 1000-3000 mg/día.',
    synonyms: ['fish oil', 'aceite de pescado', 'EPA', 'DHA'],
    warnings: ['Calidad: buscar purificado de metales pesados', 'Conservar refrigerado'],
  },
  'probióticos': {
    id: 'probióticos',
    name: 'Probióticos',
    scientificName: 'Lactobacillus, Bifidobacterium',
    category: 'suplemento',
    origin: {
      type: 'microorganismo',
      description: 'Bacterias beneficiosas que colonizan el intestino. Cepas específicas tienen efectos específicos.',
    },
    description: 'Microorganismos beneficiosos para salud intestinal e inmune.',
    mechanism: 'Colonizan intestino y compiten con patógenos. Fortalecen barrera intestinal.',
    indications: ['Prevención de diarrea (antibióticos)', 'Síndrome de intestino irritable', 'Inmunidad', 'Salud vaginal'],
    contraindications: ['Inmunosupresión severa', 'Enfermedad intestinal grave'],
    interactions: ['Antibióticos: tomar en分开 (2h)'],
    dosage: '1-10 mil millones UFC/día.',
    synonyms: ['lactobacillus', 'bifidobacterium', 'flora intestinal'],
    warnings: ['Guardar en refrigerador', 'Cepas no son intercambiables'],
  },
  'iris-versicolor': {
    id: 'iris-versicolor',
    name: 'Iris Versicolor',
    scientificName: 'Iris versicolor',
    category: 'homeopatia',
    origin: {
      type: 'planta',
      description: 'Lirio azul americano. Planta acuática de América del Norte.',
    },
    description: 'Remedio homeopático para migrañas, problemas digestivos y hormonal.',
    mechanism: 'Actúa sobre el sistema nervioso y glandular. Regula metabolismo.',
    indications: ['Migrañas izquierda', 'Problemas digestivos crónicos', 'Desórdenes hormonales', 'Pancreatitis', 'Gastritis crónica'],
    contraindications: ['Hipersensibilidad a Iris'],
    interactions: ['Sin interacciones conocidas'],
    dosage: 'CH 5 a CH 15: 3-5 gránulos, 2-3 veces al día.',
    synonyms: ['iris', 'blue flag', 'lirio azul'],
    warnings: ['No confundir con Iris germanica'],
  },
  'sepia': {
    id: 'sepia',
    name: 'Sepia',
    scientificName: 'Sepia officinalis',
    category: 'homeopatia',
    origin: {
      type: 'animal',
      description: 'Tinta de calamar o jibia. Molusco marino.',
    },
    description: 'Remedio para agotamiento, desórdenes hormonales y uterinos.',
    mechanism: 'Modula eje hipotálamo-hipófisis-gonadal. Regula tono muscular uterino.',
    indications: ['Menopausia', 'Sofocos', 'Desórdenes menstruales', 'Astenia', 'Prolapso uterino', 'Estreñimiento'],
    contraindications: ['Embarazo (solo bajo supervisión)', 'Lactancia'],
    interactions: ['Potencia tratamientos hormonales'],
    dosage: 'CH 5 a CH 15: 3-5 gránulos, 1-2 veces al día.',
    synonyms: ['sepia officinalis', 'tinta de calamar', 'cuttlefish'],
    warnings: ['No usar con Antimonium crudum simultáneamente'],
  },
  'phosphorus': {
    id: 'phosphorus',
    name: 'Phosphorus',
    scientificName: 'Fósforo',
    category: 'homeopatia',
    origin: {
      type: 'mineral',
      description: 'Elemento químico esencial. No es el fósforo radioactivo.',
    },
    description: 'Remedio para hemorragias, ansiedad y problemas respiratorios.',
    mechanism: 'Modula permeabilidad vascular. Actúa sobre SNC y sistema respiratorio.',
    indications: ['Hemorragias (epistaxis)', 'Bronquitis', 'Neumonía', 'Ansiedad anticipatoria', 'Angustia', 'Hepatitis'],
    contraindications: ['Enfermedad ósea activa', 'Insuficiencia renal'],
    interactions: ['Potencia heparina', 'Precaución con digitálicos'],
    dosage: 'CH 5 a CH 15: 3-5 gránulos, 2-4 veces al día.',
    synonyms: ['fosforo', 'phosphorus', 'p'],
    warnings: ['Confundir con fósforo blanco (tóxico)'],
  },
  'sulfur': {
    id: 'sulfur',
    name: 'Sulfur',
    scientificName: 'Azufre',
    category: 'homeopatia',
    origin: {
      type: 'mineral',
      description: 'Elemento químico natural. Presente en aminochácidos y vitaminas del grupo B.',
    },
    description: 'Remedio constitucional para personas con tendencia a problemas cutáneos y digestivos.',
    mechanism: 'Modula respuesta inflamatoria crónica. Actúa sobre piel y mucosas.',
    indications: ['Eccema', 'Dermatitis', 'Psoriasis', 'Acné', 'Estreñimiento crónico', 'Hemorroides', 'Enuresis nocturna'],
    contraindications: ['No usar en fase aguda grave'],
    interactions: ['No dar después de Apis o Rhus-toxicodendron'],
    dosage: 'CH 5 a CH 15: 3-5 gránulos, 1-2 veces al día. Mejor en ayunas.',
    synonyms: ['azufre', 'sulf', 'sulphur'],
    warnings: ['Remedio profundo - efecto duradero', 'Primeros empeoramientos posibles'],
  },
  'rhythm': {
    id: 'rhythm',
    name: 'Rhythm (Natrum Muriaticum)',
    scientificName: 'Natrum muriaticum',
    category: 'homeopatia',
    origin: {
      type: 'mineral',
      description: 'Cloruro de sodio (sal marina). Elemento esencial.',
    },
    description: 'Remedio para migrañas, anemia y desórdenes metabólicos.',
    mechanism: 'Regula balance hídrico celular. Actúa sobre sistema nervioso y sangre.',
    indications: ['Migrañas', 'Anemia', 'Estreñimiento', 'Resfriados frecuentes', 'Alergias', 'Depresión', 'Resaca'],
    contraindications: ['Hipertensión severa'],
    interactions: ['Precaución con litio'],
    dosage: 'CH 5 a CH 15: 3-5 gránulos, 2-3 veces al día.',
    synonyms: ['natrum mur', 'natrum muriaticum', 'sal marina'],
    warnings: ['No tomar con café o menta'],
  },
  'calendula': {
    id: 'calendula',
    name: 'Caléndula',
    scientificName: 'Calendula officinalis',
    category: 'fitoterapia',
    origin: {
      type: 'planta',
      description: 'Flor de la familia Asteraceae. Nativa de Europa.',
    },
    description: 'Antiinflamatorio y cicatrizante natural. Ideal para heridas y quemaduras.',
    mechanism: 'Los triterpenoides reducen inflamación. Favorece granulación y эпителизацию.',
    indications: ['Heridas', 'Quemaduras leves', 'Dermatitis del pañal', 'Gingivitis', 'Úlceras bucales', 'Pie de atleta'],
    contraindications: ['Hipersensibilidad a Asteraceae'],
    interactions: ['Sin interacciones significativas'],
    dosage: 'Tópico: pomada o crema 2-3 veces al día. Infusión para enjuagues.',
    synonyms: ['calendula officinalis', 'maravilla', 'flor de muerto'],
    warnings: ['Uso tópico principalmente', 'Infusión: no tragar'],
  },
  'hamamelis': {
    id: 'hamamelis',
    name: 'Hamamelis',
    scientificName: 'Hamamelis virginiana',
    category: 'fitoterapia',
    origin: {
      type: 'planta',
      description: 'Arbusto de América del Norte. También llamado "avellano de bruja".',
    },
    description: 'Astringente y venotónico. Excelente para problemas circulatorios.',
    mechanism: 'Taninos y flavonoides reducen permeabilidad capilar. Antiinflamatorio.',
    indications: ['Hemorroides', 'Varices', 'Piernas cansadas', 'Flebítis superficial', 'Hematomas', 'Gingivitis'],
    contraindications: ['Hipersensibilidad'],
    interactions: ['Potencia anticoagulantes'],
    dosage: 'Tópico: extracto 2-3 veces al día. Oral: infusión o cápsulas.',
    synonyms: ['hamamelis virginiana', 'witch hazel', 'avellano de bruja'],
    warnings: ['No aplicar sobre heridas abiertas'],
  },
  'melatonina': {
    id: 'melatonina',
    name: 'Melatonina',
    scientificName: 'Melatonina',
    category: 'suplemento',
    origin: {
      type: 'sintetico',
      description: 'Hormona produzida pela glândula pineal. Regulador do sono.',
    },
    description: 'Hormona que regula el ciclo sueño-vigilia. Suplemento para insomnio.',
    mechanism: 'Activa receptores MT1 y MT2 en núcleo supraquiasmático. Sincroniza ritmo circadiano.',
    indications: ['Insomnio', 'Jet lag', 'Trabajo por turnos', 'Envejecimiento', 'Antioxidante'],
    contraindications: ['Embarazo', 'Lactancia', 'Enfermedades autoinmunes'],
    interactions: ['Potencia benzodiacepinas', 'Precaución con inmunosupresores'],
    dosage: '0.5-5 mg, 30-60 minutos antes de dormir.',
    synonyms: ['melatonin', 'hormona del sueño', 'sleep hormone'],
    warnings: ['Dosis alta no es mejor', 'No usar como somnífero crónico'],
  },
  'magnesio-glicinato': {
    id: 'magnesio-glicinato',
    name: 'Magnesio Glicinato',
    scientificName: 'Magnesio glicinato',
    category: 'mineral',
    origin: {
      type: 'mineral',
      description: 'Sal de magnesio quelada con glicina. Alta biodisponibilidad.',
    },
    description: 'Forma de magnesio con alta absorción. Ideal para ansiedad y sueño.',
    mechanism: 'La glicina facilita transporte intestinal. Menor efecto laxante.',
    indications: ['Ansiedad', 'Insomnio', 'Calambres musculares', 'Dolores de cabeza tensionales'],
    contraindications: ['Insuficiencia renal'],
    interactions: ['Sinergia con vitamina B6'],
    dosage: '200-400 mg/día de magnesio elemental.',
    synonyms: ['magnesium glycinate', 'magnesio quelado', 'chelated magnesium'],
    warnings: ['Mejor absorción en ayunas'],
  },
  'espirulina': {
    id: 'espiluna',
    name: 'Espirulina',
    scientificName: 'Arthrospira platensis',
    category: 'suplemento',
    origin: {
      type: 'microorganismo',
      description: 'Cianobacteria (alga azul) cultivada en agua dulce. Consumida hace siglos.',
    },
    description: 'Superalimento rico en proteínas, vitaminas y minerales.',
    mechanism: 'Contiene ficocianina, betacarotenos y hierro biodisponible.',
    indications: ['Deficiencias nutricionales', 'Energía', 'Detoxificación', 'Apoyo inmunológico'],
    contraindications: ['Fenilcetonuria', 'Hipersensibilidad a algas'],
    interactions: ['Precaución con inmunosupresores'],
    dosage: '1-3 g/día.',
    synonyms: ['spirulina', 'arthrospira', 'alga azul'],
    warnings: ['Calidad variable', 'Buscar productos certificados'],
  },
  'lactobacillus-rhamnosus': {
    id: 'lactobacillus-rhamnosus',
    name: 'Lactobacillus rhamnosus',
    scientificName: 'Lactobacillus rhamnosus GG',
    category: 'suplemento',
    origin: {
      type: 'microorganismo',
      description: 'Cepa probiótica aislada originally de intestino humano.',
    },
    description: 'Probiótico estudado para imunidad y saúde gastrointestinal.',
    mechanism: 'Coloniza intestino y refuerza barrera intestinal. Modula respuesta inmune.',
    indications: ['Diarrea por antibióticos', 'Gastroenteritis', 'Prevención de eczemas', 'Intolerancia a lactosa'],
    contraindications: ['Inmunosupresión severa'],
    interactions: ['Antibióticos: separar 2 horas'],
    dosage: '10-20 mil millones UFC/día.',
    synonyms: ['LGG', 'lactobacillus gg', 'rhamnosus gg'],
    warnings: ['Guardar refrigerado', 'Sobrevive a antibióticos'],
  },
  'cordyceps': {
    id: 'cordyceps',
    name: 'Cordyceps',
    scientificName: 'Cordyceps sinensis',
    category: 'fitoterapia',
    origin: {
      type: 'microorganismo',
      description: 'Hongo parásito del Tíbet. "Ostra vegetal" en medicina china.',
    },
    description: 'Hongo adaptógeno para energia, rendimiento deportivo y função renal.',
    mechanism: 'Cordicepina modula ATP y función adrenal. Mejora utilización de oxígeno.',
    indications: ['Fatiga', 'Rendimiento deportivo', 'Función renal', 'Inmunidad', 'Libido'],
    contraindications: ['Embarazo', 'Lactancia', 'Cáncer hormone-dependiente'],
    interactions: ['Precaución con anticoagulantes'],
    dosage: '1-3 g/día de extracto estandarizado.',
    synonyms: ['cordyceps sinensis', 'hongo oruga', 'caterpillar fungus'],
    warnings: ['Calidad muy variable', 'Preferir extracto certificado'],
  },
  'quercetina': {
    id: 'quercetina',
    name: 'Quercetina',
    scientificName: 'Quercetina dihidrato',
    category: 'suplemento',
    origin: {
      type: 'planta',
      description: 'Flavonoide presente en cebollas, manzanas y té verde.',
    },
    description: 'Antioxidante natural con propiedades antialérgicas.',
    mechanism: 'Estabiliza mastocitos e inhibe liberación de histamina. Antioxidante potente.',
    indications: ['Alergias', 'Asthma leve', 'Inflamación', 'Salud cardiovascular', 'COVID-19 (investigación)'],
    contraindications: ['Hipersensibilidad'],
    interactions: ['Mejora absorción con vitamina C', 'Precaución con anticoagulantes'],
    dosage: '500-1000 mg/día.',
    synonyms: ['quercetin', 'bioflavonoide', 'rutósido'],
    warnings: ['Mejor con bromelaína o vitamina C'],
  },
  'resveratrol': {
    id: 'resveratrol',
    name: 'Resveratrol',
    scientificName: 'Trans-resveratrol',
    category: 'suplemento',
    origin: {
      type: 'planta',
      description: 'Polifenol de uvas rojas, Vino tinto y Polygonum cuspidatum.',
    },
    description: 'Polifenol con propiedades antienvejecimiento y cardiovasculares.',
    mechanism: 'Activa sirtuinas (SIRT1). Antioxidante que activa AMPK.',
    indications: ['Envejecimiento', 'Salud cardiovascular', 'Inflamación', 'Neuroprotección'],
    contraindications: ['Embarazo', 'Lactancia'],
    interactions: ['Potencia anticoagulantes', 'Precaución con estrógenos'],
    dosage: '150-500 mg/día.',
    synonyms: ['trans-resveratrol', 'resveratrol polygonum', 'stilbene'],
    warnings: ['Biodisponibilidad baja', 'Buscar formas micronizadas'],
  },
  'vitamina-e': {
    id: 'vitamina-e',
    name: 'Vitamina E',
    scientificName: 'Tocoferol',
    category: 'vitamin',
    origin: {
      type: 'sintetico',
      description: 'Vitamina liposoluble. Presente en aceites vegetales y frutos secos.',
    },
    description: 'Antioxidante liposoluble para piel, immunity y salud cardiovascular.',
    mechanism: 'Protege membranas celulares de oxidación. Antioxidante sinérgico.',
    indications: ['Envejecimiento cutáneo', 'Fibromialgia', 'Prevención de cataracts', 'Riesgo cardiovascular'],
    contraindications: ['Deficiencia de vitamina K', 'Cirugía reciente'],
    interactions: ['Potencia anticoagulantes', 'Sinergia con vitamina C'],
    dosage: 'RDA: 15 mg/día. Suplemento: 200-400 UI/día.',
    synonyms: ['tocopherol', 'tocotrienol', 'alpha-tocopherol'],
    warnings: ['No megadosis', 'Preferir formas naturales'],
  },
  'selenio': {
    id: 'selenio',
    name: 'Selenio',
    scientificName: 'Selenio (Se)',
    category: 'mineral',
    origin: {
      type: 'mineral',
      description: 'Oligoelemento esencial. Cofactor de glutatión peroxidasa.',
    },
    description: 'Antioxidante esencial para tiroides y función inmune.',
    mechanism: 'Cofactor de glutatión peroxidasa. Metabolismo de hormona tiroidea.',
    indications: ['Tiroiditis de Hashimoto', 'Deficiencia de selenio', 'Prevención de cáncer', 'Infertilidad masculina'],
    contraindications: ['Exceso de selenio (selenosis)'],
    interactions: ['Vitamina E potencia efectos', 'Vitamina C mejora absorción'],
    dosage: 'RDA: 55 mcg/día. Suplemento: 100-200 mcg/día.',
    synonyms: ['selenium', 'selenomethionine', 'selenite'],
    warnings: ['NO exceder 400 mcg/día', 'Dosis altas son tóxicas'],
  },
};

// Función para buscar ingrediente por nombre (busca en base local y extendida)
export function findIngredient(query: string): IngredientInfo | null {
  if (!query || query.trim() === '') {
    return null;
  }

  const normalizedQuery = query.toLowerCase().trim();
  
  // Primero buscar en base local (por clave exacta)
  if (INGREDIENT_DATABASE[normalizedQuery]) {
    return INGREDIENT_DATABASE[normalizedQuery];
  }
  
  // Buscar en base local por sinónimos o nombre
  for (const [key, ingredient] of Object.entries(INGREDIENT_DATABASE)) {
    // Verificar sinónimos
    if (ingredient.synonyms.some(s => 
      s.toLowerCase().includes(normalizedQuery) || 
      normalizedQuery.includes(s.toLowerCase())
    )) {
      return ingredient;
    }
    // Verificar nombre
    if (ingredient.name.toLowerCase().includes(normalizedQuery) ||
        normalizedQuery.includes(ingredient.name.toLowerCase())) {
      return ingredient;
    }
    // Verificar palabras individuales del nombre
    const nameWords = ingredient.name.toLowerCase().split(/\s+/);
    if (nameWords.some(word => normalizedQuery.includes(word) && word.length > 3)) {
      return ingredient;
    }
    // Verificar nombre científico
    if (ingredient.scientificName && 
        (ingredient.scientificName.toLowerCase().includes(normalizedQuery) ||
         normalizedQuery.includes(ingredient.scientificName.toLowerCase()))) {
      return ingredient;
    }
  }
  
  // Buscar en base extendida
  const extendedResult = findExtendedIngredient(query);
  if (extendedResult) {
    return extendedResult;
  }
  
  // NO devolver null - el ingrediente simplemente no existe en nuestra KB
  // NO asignar "Phosphorus" ni ningún otro valor por defecto
  return null;
}

// Función para obtener estadísticas (incluye base extendida)
export function getIngredientStats(): { total: number; byCategory: Record<string, number> } {
  const byCategory: Record<string, number> = {};
  let total = 0;
  
  for (const ingredient of Object.values(INGREDIENT_DATABASE)) {
    total++;
    byCategory[ingredient.category] = (byCategory[ingredient.category] || 0) + 1;
  }
  
  // Agregar estadísticas de base extendida
  const extendedStats = getExtendedIngredientStats();
  
  return { 
    total: total + extendedStats.total, 
    byCategory 
  };
}
