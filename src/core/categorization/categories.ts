/**
 * Categorías Jerárquicas para Vademecum AI
 * Sistema de clasificación: Tipo → Función → Patología
 */

// ==================== NIVEL 1: TIPO (MACRO) ====================
export const PRODUCT_TYPES = {
  FITOTERAPIA: 'fitoterapia',
  HOMEOPATIA: 'homeopatia',
  SUPLEMENTO: 'suplemento',
  DISPOSITIVO: 'dispositivo',
  COSMETICO: 'cosmetico',
  MEDICAMENTO: 'medicamento',
  ALIMENTO: 'alimento',
} as const;

export type ProductType = typeof PRODUCT_TYPES[keyof typeof PRODUCT_TYPES];

export const PRODUCT_TYPE_LABELS: Record<ProductType, { name: string; icon: string; color: string }> = {
  [PRODUCT_TYPES.FITOTERAPIA]: { name: 'Fitoterapia', icon: '🌿', color: 'emerald' },
  [PRODUCT_TYPES.HOMEOPATIA]: { name: 'Homeopatía', icon: '🏠', color: 'blue' },
  [PRODUCT_TYPES.SUPLEMENTO]: { name: 'Suplemento', icon: '💊', color: 'violet' },
  [PRODUCT_TYPES.DISPOSITIVO]: { name: 'Dispositivo', icon: '🔧', color: 'slate' },
  [PRODUCT_TYPES.COSMETICO]: { name: 'Cosmético', icon: '✨', color: 'pink' },
  [PRODUCT_TYPES.MEDICAMENTO]: { name: 'Medicamento', icon: '💉', color: 'red' },
  [PRODUCT_TYPES.ALIMENTO]: { name: 'Alimento', icon: '🥗', color: 'amber' },
};

// ==================== NIVEL 2: FUNCIÓN/TERAPIA ====================
export const THERAPEUTIC_FUNCTIONS = {
  // Sistema musculoesquelético
  ANTIINFLAMATORIO: 'antiinflamatorio',
  ANALGESICO: 'analgesico',
  CONDROPROTECTOR: 'condroprotector',
  RELAJANTE_MUSCULAR: 'relajante_muscular',
  
  // Sistema nervioso
  ANSIOLITICO: 'ansiolitico',
  ANTIDEPRESIVO: 'antidepresivo',
  NEUROPROTECTOR: 'neuroprotector',
  SEDANTE: 'sedante',
  
  // Sistema inmunológico
  INMUNOMODULADOR: 'inmunomodulador',
  INMUNOESTIMULANTE: 'inmunoestimulante',
  ANTIINFECCIOSO: 'antiinfeccioso',
  
  // Sistema digestivo
  DIGESTIVO: 'digestivo',
  HEPATOPROTECTOR: 'hepatoprotector',
  PROBIOTICO: 'probiotico',
  LAXANTE: 'laxante',
  
  // Sistema cardiovascular
  CARDIOVASCULAR: 'cardiovascular',
  HIPOTENSOR: 'hipotensor',
  ANTICOAGULANTE: 'anticoagulante',
  
  // Sistema respiratorio
  RESPIRATORIO: 'respiratorio',
  BRONCODILATADOR: 'broncodilatador',
  MUCOLITICO: 'mucolitico',
  
  // Sistema dermatológico
  DERMATOLOGICO: 'dermatologico',
  CICATRIZANTE: 'cicatrizante',
  
  // Sistema metabólico
  METABOLICO: 'metabolico',
  ANTIOXIDANTE: 'antioxidante',
  TERMOGENICO: 'termogenico',
  
  // Sistema endocrino
  ENDOCRINO: 'endocrino',
  HORMONAL: 'hormonal',
  
  // Otros
  DIURÉTICO: 'diuretico',
  DESINTÓXICANTE: 'desintoxicante',
  ANTIALERGICO: 'antialergico',
  VITAMÍNICO: 'vitaminico',
  MINERAL: 'mineral',
} as const;

export type TherapeuticFunction = typeof THERAPEUTIC_FUNCTIONS[keyof typeof THERAPEUTIC_FUNCTIONS];

export const THERAPEUTIC_FUNCTION_LABELS: Record<TherapeuticFunction, { name: string; category: string }> = {
  [THERAPEUTIC_FUNCTIONS.ANTIINFLAMATORIO]: { name: 'Antiinflamatorio', category: 'musculoesqueletico' },
  [THERAPEUTIC_FUNCTIONS.ANALGESICO]: { name: 'Analgésico', category: 'musculoesqueletico' },
  [THERAPEUTIC_FUNCTIONS.CONDROPROTECTOR]: { name: 'Condroprotector', category: 'musculoesqueletico' },
  [THERAPEUTIC_FUNCTIONS.RELAJANTE_MUSCULAR]: { name: 'Relajante muscular', category: 'musculoesqueletico' },
  [THERAPEUTIC_FUNCTIONS.ANSIOLITICO]: { name: 'Ansiolítico', category: 'nervioso' },
  [THERAPEUTIC_FUNCTIONS.ANTIDEPRESIVO]: { name: 'Antidepresivo', category: 'nervioso' },
  [THERAPEUTIC_FUNCTIONS.NEUROPROTECTOR]: { name: 'Neuroprotector', category: 'nervioso' },
  [THERAPEUTIC_FUNCTIONS.SEDANTE]: { name: 'Sedante', category: 'nervioso' },
  [THERAPEUTIC_FUNCTIONS.INMUNOMODULADOR]: { name: 'Inmunomodulador', category: 'inmune' },
  [THERAPEUTIC_FUNCTIONS.INMUNOESTIMULANTE]: { name: 'Inmunoestimulante', category: 'inmune' },
  [THERAPEUTIC_FUNCTIONS.ANTIINFECCIOSO]: { name: 'Antiinfeccioso', category: 'inmune' },
  [THERAPEUTIC_FUNCTIONS.DIGESTIVO]: { name: 'Digestivo', category: 'digestivo' },
  [THERAPEUTIC_FUNCTIONS.HEPATOPROTECTOR]: { name: 'Hepatoprotector', category: 'digestivo' },
  [THERAPEUTIC_FUNCTIONS.PROBIOTICO]: { name: 'Probiótico', category: 'digestivo' },
  [THERAPEUTIC_FUNCTIONS.LAXANTE]: { name: 'Laxante', category: 'digestivo' },
  [THERAPEUTIC_FUNCTIONS.CARDIOVASCULAR]: { name: 'Cardiovascular', category: 'cardiovascular' },
  [THERAPEUTIC_FUNCTIONS.HIPOTENSOR]: { name: 'Hipotensor', category: 'cardiovascular' },
  [THERAPEUTIC_FUNCTIONS.ANTICOAGULANTE]: { name: 'Anticoagulante', category: 'cardiovascular' },
  [THERAPEUTIC_FUNCTIONS.RESPIRATORIO]: { name: 'Respiratorio', category: 'respiratorio' },
  [THERAPEUTIC_FUNCTIONS.BRONCODILATADOR]: { name: 'Broncodilatador', category: 'respiratorio' },
  [THERAPEUTIC_FUNCTIONS.MUCOLITICO]: { name: 'Mucolítico', category: 'respiratorio' },
  [THERAPEUTIC_FUNCTIONS.DERMATOLOGICO]: { name: 'Dermatológico', category: 'dermatologico' },
  [THERAPEUTIC_FUNCTIONS.CICATRIZANTE]: { name: 'Cicatrizante', category: 'dermatologico' },
  [THERAPEUTIC_FUNCTIONS.METABOLICO]: { name: 'Metabólico', category: 'metabolico' },
  [THERAPEUTIC_FUNCTIONS.ANTIOXIDANTE]: { name: 'Antioxidante', category: 'metabolico' },
  [THERAPEUTIC_FUNCTIONS.TERMOGENICO]: { name: 'Termogénico', category: 'metabolico' },
  [THERAPEUTIC_FUNCTIONS.ENDOCRINO]: { name: 'Endocrino', category: 'endocrino' },
  [THERAPEUTIC_FUNCTIONS.HORMONAL]: { name: 'Hormonal', category: 'endocrino' },
  [THERAPEUTIC_FUNCTIONS.DIURÉTICO]: { name: 'Diurético', category: 'otros' },
  [THERAPEUTIC_FUNCTIONS.DESINTÓXICANTE]: { name: 'Desintoxicante', category: 'otros' },
  [THERAPEUTIC_FUNCTIONS.ANTIALERGICO]: { name: 'Antialérgico', category: 'otros' },
  [THERAPEUTIC_FUNCTIONS.VITAMÍNICO]: { name: 'Vitamínico', category: 'nutricional' },
  [THERAPEUTIC_FUNCTIONS.MINERAL]: { name: 'Mineral', category: 'nutricional' },
};

// ==================== NIVEL 3: SISTEMAS DEL CUERPO ====================
export const BODY_SYSTEMS = {
  MUSCULOESQUELETICO: 'musculoesqueletico',
  NERVIOSO: 'nervioso',
  INMUNE: 'inmune',
  DIGESTIVO: 'digestivo',
  CARDIOVASCULAR: 'cardiovascular',
  RESPIRATORIO: 'respiratorio',
  DERMATOLOGICO: 'dermatologico',
  METABOLICO: 'metabolico',
  ENDOCRINO: 'endocrino',
  GENITOURINARIO: 'genitourinario',
  SENSORIAL: 'sensorial',
} as const;

export type BodySystem = typeof BODY_SYSTEMS[keyof typeof BODY_SYSTEMS];

export const BODY_SYSTEM_LABELS: Record<BodySystem, { name: string; icon: string }> = {
  [BODY_SYSTEMS.MUSCULOESQUELETICO]: { name: 'Musculoesquelético', icon: '🦴' },
  [BODY_SYSTEMS.NERVIOSO]: { name: 'Nervioso', icon: '🧠' },
  [BODY_SYSTEMS.INMUNE]: { name: 'Inmune', icon: '🛡️' },
  [BODY_SYSTEMS.DIGESTIVO]: { name: 'Digestivo', icon: '🫃' },
  [BODY_SYSTEMS.CARDIOVASCULAR]: { name: 'Cardiovascular', icon: '❤️' },
  [BODY_SYSTEMS.RESPIRATORIO]: { name: 'Respiratorio', icon: '🫁' },
  [BODY_SYSTEMS.DERMATOLOGICO]: { name: 'Dermatológico', icon: '🧬' },
  [BODY_SYSTEMS.METABOLICO]: { name: 'Metabólico', icon: '⚡' },
  [BODY_SYSTEMS.ENDOCRINO]: { name: 'Endocrino', icon: '🧪' },
  [BODY_SYSTEMS.GENITOURINARIO]: { name: 'Genitourinario', icon: '🧬' },
  [BODY_SYSTEMS.SENSORIAL]: { name: 'Sensorial', icon: '👁️' },
};

// ==================== MAPEOS KB → CATEGORÍAS ====================
export const KB_FAMILY_TO_TYPE: Record<string, ProductType> = {
  'vitamina': PRODUCT_TYPES.FITOTERAPIA,
  'mineral': PRODUCT_TYPES.FITOTERAPIA,
  'aminoacido': PRODUCT_TYPES.SUPLEMENTO,
  'acido_graso': PRODUCT_TYPES.SUPLEMENTO,
  'probiótico': PRODUCT_TYPES.SUPLEMENTO,
  'prebiótico': PRODUCT_TYPES.SUPLEMENTO,
  'enzima': PRODUCT_TYPES.SUPLEMENTO,
  'extracto_vegetal': PRODUCT_TYPES.FITOTERAPIA,
  'planta_medicinal': PRODUCT_TYPES.FITOTERAPIA,
  'aceite_esencial': PRODUCT_TYPES.FITOTERAPIA,
  'homeopático': PRODUCT_TYPES.HOMEOPATIA,
  'dilucion': PRODUCT_TYPES.HOMEOPATIA,
};

export const KB_PROPERTY_TO_FUNCTION: Record<string, TherapeuticFunction> = {
  'antiinflamatorio': THERAPEUTIC_FUNCTIONS.ANTIINFLAMATORIO,
  'analgesico': THERAPEUTIC_FUNCTIONS.ANALGESICO,
  'antioxidante': THERAPEUTIC_FUNCTIONS.ANTIOXIDANTE,
  'inmunoestimulante': THERAPEUTIC_FUNCTIONS.INMUNOESTIMULANTE,
  'inmunosupresor': THERAPEUTIC_FUNCTIONS.INMUNOMODULADOR,
  'digestivo': THERAPEUTIC_FUNCTIONS.DIGESTIVO,
  'hepatoprotector': THERAPEUTIC_FUNCTIONS.HEPATOPROTECTOR,
  'cardioprotector': THERAPEUTIC_FUNCTIONS.CARDIOVASCULAR,
  'neuroprotector': THERAPEUTIC_FUNCTIONS.NEUROPROTECTOR,
  'ansiolitico': THERAPEUTIC_FUNCTIONS.ANSIOLITICO,
  'sedante': THERAPEUTIC_FUNCTIONS.SEDANTE,
  'antidepresivo': THERAPEUTIC_FUNCTIONS.ANTIDEPRESIVO,
  'broncodilatador': THERAPEUTIC_FUNCTIONS.BRONCODILATADOR,
  'diuretico': THERAPEUTIC_FUNCTIONS.DIURÉTICO,
  'cicatrizante': THERAPEUTIC_FUNCTIONS.CICATRIZANTE,
};

// ==================== HELPERS ====================
export function getFunctionsByCategory(category: string): TherapeuticFunction[] {
  return Object.entries(THERAPEUTIC_FUNCTION_LABELS)
    .filter(([_, data]) => data.category === category)
    .map(([key]) => key as TherapeuticFunction);
}

export function getTypeLabel(type: ProductType): string {
  return PRODUCT_TYPE_LABELS[type]?.name || type;
}

export function getFunctionLabel(fn: TherapeuticFunction): string {
  return THERAPEUTIC_FUNCTION_LABELS[fn]?.name || fn;
}

export function getSystemLabel(system: BodySystem): string {
  return BODY_SYSTEM_LABELS[system]?.name || system;
}
