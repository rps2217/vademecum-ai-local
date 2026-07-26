/**
 * Schema Unificado para Ingredientes
 * 
 * Define la estructura común para todos los tipos de ingredientes
 * en la base de conocimiento de Vademecum AI.
 */

/**
 * Categorías principales de ingredientes
 */
export type IngredientCategory = 
  | 'fitoterapia'      // Plantas medicinales
  | 'homeopatia'        // Remedios homeopáticos
  | 'aceite_esencial'   // Aceites para aromaterapia
  | 'vitaminas'         // Vitaminas
  | 'minerales'         // Minerales y oligoelementos
  | 'aminoacidos'       // Aminoácidos y proteínas
  | 'probioticos'       // Bacterias beneficiosas
  | 'prebioticos'       // Fibras prebióticas
  | 'enzimas'           // Enzimas digestivas
  | 'otros';            // Otros suplementos

/**
 * Sistemas corporales donde actúa el ingrediente
 */
export type BodySystem = 
  | 'nervioso'          // Sistema nervioso
  | 'digestivo'         // Sistema digestivo
  | 'inmune'            // Sistema inmunológico
  | 'cardiovascular'     // Sistema cardiovascular
  | 'respiratorio'      // Sistema respiratorio
  | 'musculoesqueletico' // Sistema musculoesquelético
  | 'endocrino'         // Sistema endocrino/hormonal
  | 'dermatologico'     // Piel y anexos
  | 'urinario'          // Sistema urinario
  | 'reproductivo'      // Sistema reproductor
  | 'ocular'            // Salud ocular
  | 'hepatico'          // Hígado y detoxificación
  | 'metabolico';       // Metabolismo general

/**
 * Indicaciones terapéuticas comunes
 */
export type Indication =
  | 'ansiedad'
  | 'insomnio'
  | 'estres'
  | 'depresion'
  | 'fatiga'
  | 'memoria'
  | 'concentracion'
  | 'dolor'
  | 'inflamacion'
  | 'inmunidad'
  | 'digestion'
  | 'nauseas'
  | 'constipacion'
  | 'diabetes'
  | 'colesterol'
  | 'presion_arterial'
  | 'corazon'
  | 'articulaciones'
  | 'huesos'
  | 'menopausia'
  | 'antioxidante'
  | 'desintoxicacion'
  | 'energia'
  | 'sexual'
  | 'piel'
  | 'cabello'
  | 'antienvejecimiento';

/**
 * Nivel de evidencia científica
 */
export type EvidenceLevel = 
  | 'A'   // Ensayos clínicos sólidos
  | 'B'   // Estudios preliminares
  | 'C'   // Evidencia tradicional/anecdótica
  | 'D'   // Evidencia limitada
  | 'unknown';

/**
 * Nivel de sinergia
 */
export type SynergyLevel = 'alto' | 'medio' | 'bajo';

/**
 * Tipo de relación sinérgica
 */
export type SynergyType = 
  | 'potenciador'       // Potencia el efecto
  | 'complementario'    // Completa el efecto
  | 'cofactor'          // Es necesario como cofactor
  | 'secuencial'        // Actúa en secuencia
  | 'bioactivador';      // Activa procesos biológicos

/**
 * Ingrediente base (schema común)
 */
export interface BaseIngredient {
  /** ID único del ingrediente */
  id: string;
  
  /** Nombre principal en español */
  nombre: string;
  
  /** Nombres alternativos (sinónimos) */
  nombresAlternativos?: string[];
  
  /** Nombre científico en latín */
  nombreCientifico?: string;
  
  /** Familia botánica/zoológica/mineral */
  familia?: string;
  
  /** Categoría principal */
  categoria: IngredientCategory;
  
  /** Sistemas corporales donde actúa */
  sistemas?: BodySystem[];
  
  /** Indicaciones terapéuticas */
  indicaciones?: Indication[];
  
  /** Descripción breve */
  descripcion: string;
  
  /** Mecanismo de acción */
  mecanismoAccion?: string;
  
  /** Nivel de evidencia científica */
  nivelEvidencia?: EvidenceLevel;
  
  /** Advertencias generales */
  advertencias?: string[];
  
  /** Público objetivo o uso principal */
  tags?: string[];
  
  /** Metadata */
  metadata?: {
    fechaCreacion?: string;
    fechaActualizacion?: string;
    version?: string;
    fuente?: string;
    autor?: string;
  };
}

/**
 * Ingrediente fitoterapéutico
 */
export interface FitoterapiaIngredient extends BaseIngredient {
  categoria: 'fitoterapia';
  
  /** Parte usada de la planta */
  parteUsada?: 'raiz' | 'hoja' | 'flor' | 'semilla' | 'corteza' | 'fruto' | 'todo' | 'rizoma';
  
  /** Forma de presentación */
  formasPresentacion?: string[];
  
  /** Tiempo de生效 (efecto) */
  tiempoEfecto?: string;
  
  /** Duración del tratamiento recomendado */
  duracionTratamiento?: string;
  
  /** Interacciones con medicamentos */
  interaccionesMedicamentosas?: string[];
}

/**
 * Remedio homeopático
 */
export interface HomeopatiaIngredient extends BaseIngredient {
  categoria: 'homeopatia';
  
  /** Diluciones disponibles */
  dilucionesCH?: number[];
  
  /** Síntomas clave (keynotes) */
  sintomasClave?: string[];
  
  /** Modalidades (qué empeora/mejora) */
  modalidades?: {
    empeora?: string[];
    mejora?: string[];
  };
  
  /** Afinidad por órganos/sistemas */
  afinidad?: string[];
  
  /** Constelaciones (grupos de remedios relacionados) */
  constelaciones?: string[];
}

/**
 * Aceite esencial
 */
export interface AceiteEsencialIngredient extends BaseIngredient {
  categoria: 'aceite_esencial';
  
  /** Parte de la planta destilada */
  parteDestilada?: string;
  
  /** Método de extracción */
  metodoExtraccion?: string[];
  
  /** Quimiotipo principal */
  quimiotipo?: string;
  
  /** Dilución recomendada */
  dilucionRecomendada?: string;
  
  /** Precauciones de uso tópico */
  precaucionesTopico?: string[];
  
  /** Métodos de uso */
  metodosUso?: ('inhalacion' | 'topico' | 'oral' | 'difusion' | 'bano')[];
  
  /** Compatibilidad con otros aceites */
  compatibilidad?: string[];
}

/**
 * Suplemento nutricional
 */
export interface SuplementoIngredient extends BaseIngredient {
  categoria: IngredientCategory;
  
  /** Dosis diaria recomendada */
  dosisDiaria?: string;
  
  /** Dosis máxima */
  dosisMaxima?: string;
  
  /** Forma química */
  formaQuimica?: string;
  
  /** Biodisponibilidad */
  biodisponibilidad?: string;
  
  /** Mejor momento para tomar */
  momentoToma?: string[];
  
  /** Con qué tomar (mejora absorción) */
  tomarCon?: string[];
  
  /** Con qué evitar */
  evitarCon?: string[];
}

/**
 * Unión de todos los tipos de ingredientes
 */
export type Ingredient = 
  | FitoterapiaIngredient 
  | HomeopatiaIngredient 
  | AceiteEsencialIngredient 
  | SuplementoIngredient;

/**
 * Relación sinérgica entre ingredientes
 */
export interface SynergyRelation {
  /** ID único de la relación */
  id: string;
  
  /** Ingrediente origen */
  ingredienteA: string;
  
  /** Ingrediente destino */
  ingredienteB: string;
  
  /** Tipo de sinergia */
  tipo: SynergyType;
  
  /** Nivel de evidencia de la sinergia */
  nivelEvidencia?: EvidenceLevel;
  
  /** Descripción de la sinergia */
  descripcion: string;
  
  /** Beneficios de la combinación */
  beneficios?: string[];
  
  /** Precauciones al combinar */
  precauciones?: string[];
  
  /** Mecanismo de la sinergia */
  mecanismo?: string;
  
  /** Categorías de los ingredientes (para filtrado rápido) */
  categorias: [IngredientCategory, IngredientCategory];
  
  /** Sistemas donde aplica la sinergia */
  sistemas?: BodySystem[];
}

/**
 * Relación antagónica entre ingredientes
 */
export interface AntagonismRelation {
  /** ID único de la relación */
  id: string;
  
  /** Ingrediente A */
  ingredienteA: string;
  
  /** Ingrediente B */
  ingredienteB: string;
  
  /** Descripción del antagonismo */
  descripcion: string;
  
  /** Nivel de severidad */
  severidad: 'alta' | 'media' | 'baja';
  
  /** Alternativas seguras */
  alternativas?: string[];
}

/**
 * Índice de búsqueda por ingrediente
 */
export interface IngredientIndex {
  /** ID del ingrediente */
  id: string;
  
  /** Términos de búsqueda (normalizados) */
  terminos: string[];
  
  /** Categoría */
  categoria: IngredientCategory;
  
  /** Nombre principal */
  nombre: string;
}

/**
 * Exportar todas las interfaces
 */
export type {
  FitoterapiaIngredient,
  HomeopatiaIngredient,
  AceiteEsencialIngredient,
  SuplementoIngredient
};
