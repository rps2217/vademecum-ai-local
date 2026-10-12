/**
 * drugNutrientInteractions - Diccionario farmacológico clínico de mostrador
 * para detección inmediata de interacciones Fármaco Alopático ↔ Principio Activo Natural.
 */

export interface DrugNutrientInteraction {
  id: string;
  drugClass: string;
  commonBrands: string[]; // Nombres comerciales comunes en farmacia (España/LatAm)
  activeSubstances: string[]; // Principios activos de prescripción
  interactingNutrientIds: string[]; // IDs de ingredientes en la KB
  interactingKeywords: string[]; // Palabras clave si el ID no coincide
  severity: 'contraindicado' | 'precaucion';
  effectTitle: string;
  clinicalDescription: string;
  counterAdvice: string;
}

export const DRUG_NUTRIENT_INTERACTIONS: DrugNutrientInteraction[] = [
  {
    id: 'anticoag_ginkgo_vitk',
    drugClass: 'Anticoagulantes orales (AVK / ACOD)',
    commonBrands: ['Sintrom', 'Coumadin', 'Eliquis', 'Xarelto', 'Pradaxa'],
    activeSubstances: ['acenocumarol', 'warfarina', 'apixaban', 'rivaroxaban', 'dabigatran'],
    interactingNutrientIds: ['ginkgo', 'vitamina_k', 'hierba_san_juan', 'sauce_blanco', 'ajo'],
    interactingKeywords: ['ginkgo', 'vitamina k', 'sauce', 'hipérico', 'ajo'],
    severity: 'contraindicado',
    effectTitle: 'Riesgo elevado de sangrado o alteración del INR',
    clinicalDescription: 'Ginkgo biloba, ajo en dosis altas y sauce aumentan el riesgo hemorrágico por antiagregación plaquetaria concomitante. La Vitamina K antagoniza directamente el efecto del Sintrom/Warfarina.',
    counterAdvice: 'Evitar el uso conjunto de Ginkgo o Vitamina K sin monitorización estrecha del INR médico.',
  },
  {
    id: 'isrs_hiperico_triptofano',
    drugClass: 'Antidepresivos ISRS / IRSN',
    commonBrands: ['Prozac', 'Cipralex', 'Seroxat', 'Zoloft', 'Vandral', 'Rexer'],
    activeSubstances: ['fluoxetina', 'escitalopram', 'paroxetina', 'sertralina', 'venlafaxina', 'duloxetina'],
    interactingNutrientIds: ['hierba_san_juan', 'triptofano', '5_htp', 'griffonia'],
    interactingKeywords: ['hipérico', 'san juan', 'triptófano', '5-htp'],
    severity: 'contraindicado',
    effectTitle: 'Síndrome serotoninérgico potencialmente grave',
    clinicalDescription: 'La hierba de San Juan (hipérico) y el 5-HTP/L-Triptófano aumentan de forma sinérgica la serotonina en SNC, pudiendo desencadenar hipertermia, temblores y agitación.',
    counterAdvice: 'Contraindicado asociar hipérico o triptófano con antidepresivos de prescripción.',
  },
  {
    id: 'estatinas_pomelo_levadura',
    drugClass: 'Estatinas (Hipolipemiantes)',
    commonBrands: ['Cardyl', 'Zocor', 'Lipitor', 'Atorvastatina', 'Simvastatina', 'Crestor'],
    activeSubstances: ['atorvastatina', 'simvastatina', 'rosuvastatina', 'pravastatina'],
    interactingNutrientIds: ['levadura_arroz_rojo', 'pomelo', 'coenzima_q10'],
    interactingKeywords: ['levadura arroz rojo', 'monacolina', 'pomelo'],
    severity: 'precaucion',
    effectTitle: 'Sobredosificación de monacolinas o inhibición del CYP3A4',
    clinicalDescription: 'La levadura de arroz rojo contiene monacolina K (estatina natural), duplicando el riesgo de miopatía o rabdomiólisis. Las estatinas depletan la CoQ10 endógena.',
    counterAdvice: 'No combinar con levadura de arroz rojo. Es beneficioso aconsejar suplementación de CoQ10 para mitigar mialgias.',
  },
  {
    id: 'antihipertensivos_regaliz',
    drugClass: 'Antihipertensivos (IECA, ARA-II, Betabloqueantes)',
    commonBrands: ['Enap', 'Cozaar', 'Micardis', 'Emconcor', 'Amlodipino', 'Parapres'],
    activeSubstances: ['enalapril', 'losartan', 'telmisartan', 'bisoprolol', 'amlodipino'],
    interactingNutrientIds: ['regaliz', 'ginseng_coreano', 'guarana'],
    interactingKeywords: ['regaliz', 'ginseng', 'guaraná', 'cafeína'],
    severity: 'precaucion',
    effectTitle: 'Pérdida de control de la tensión arterial',
    clinicalDescription: 'El extracto de regaliz con glicirricina retiene sodio y depleta potasio, aumentando la presión arterial y neutralizando la pauta antihipertensiva.',
    counterAdvice: 'Preferir regaliz desglicirrizado (DGL) en pacientes hipertensos con molestias gástricas.',
  },
  {
    id: 'metformina_b12',
    drugClass: 'Antidiabéticos orales',
    commonBrands: ['Dianben', 'Metformina', 'Janumet', 'Forxiga'],
    activeSubstances: ['metformina', 'glimepirida', 'dapagliflozina'],
    interactingNutrientIds: ['vitamina_b12', 'cromo', 'canela', 'berberina'],
    interactingKeywords: ['vitamina b12', 'berberina', 'cromo'],
    severity: 'precaucion',
    effectTitle: 'Hipoglucemia aditiva o déficit crónico de B12',
    clinicalDescription: 'El tratamiento prolongado con Metformina reduce la absorción ileal de Vitamina B12 hasta en un 30%. La berberina tiene efecto hipoglucemiante aditivo.',
    counterAdvice: 'Vigilar niveles de B12 en toma crónica de Metformina. Precaución con berberina por posible hipoglucemia.',
  },
  {
    id: 'levotiroxina_calcio_hierro',
    drugClass: 'Hormona tiroidea',
    commonBrands: ['Eutirox', 'Levothroid'],
    activeSubstances: ['levotiroxina'],
    interactingNutrientIds: ['calcio', 'hierro', 'magnesio', 'soja'],
    interactingKeywords: ['calcio', 'hierro', 'magnesio', 'soja'],
    severity: 'precaucion',
    effectTitle: 'Quelación y reducción drástica de la absorción',
    clinicalDescription: 'Los suplementos minerales de Calcio, Hierro o Magnesio quelan la levotiroxina en el tubo digestivo impidiendo su absorción.',
    counterAdvice: 'Espaciar la toma de suplementos de calcio/hierro al menos 4 horas respecto al Eutirox en ayunas.',
  },
];
