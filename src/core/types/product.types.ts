/**
 * Estado de seguridad para diferentes perfiles de pacientes.
 */
export enum SafetyStatus {
  /** Permitido sin restricciones conocidas. */
  SI = 'SI',
  /** No recomendado o contraindicado. */
  NO = 'NO',
  /** Requiere supervisión profesional o precaución especial. */
  PRECAUCION = 'PRECAUCION',
}

/**
 * Clasificación principal del ítem en el Vademécum.
 */
export type MainCategory = 'Belleza' | 'Medicamento' | 'Suplemento' | 'Homeopatía' | 'Otro';

/**
 * Representa un producto o entidad dentro del Vademécum Clínico.
 */
export interface Product {
  /** Identificador único (SKU). Actúa como clave primaria. */
  sku: string;
  /** Nombre comercial del producto. */
  nombre_comercial: string;
  /** Resumen técnico de la composición y propósito. */
  descripcion: string;
  /** Lista de principios activos o compuestos químicos/naturales. */
  principios_activos: string[];
  /** Instrucciones de uso y dosificación recomendada. */
  posologia: string;
  /** Lista de condiciones o patologías para las que se indica. */
  indicaciones: string[];
  /** Restricciones, efectos secundarios o advertencias de seguridad. */
  advertencias: string;
  /** Etiquetas semánticas generadas por IA para búsqueda rápida. */
  tags_ia: string[];
  /** Categoría regulada o comercial. */
  categoria_principal?: MainCategory;
  /** Desglose técnico de la función de cada componente. */
  analisis_componentes?: string;
  /** Notas específicas de los componentes (ej. origen, concentración). */
  anotaciones_componentes?: Record<string, string>;
  /** Embeddings vectoriales para búsqueda semántica. */
  vectores: number[];
  
  // Semáforo de Seguridad (Safety indicators)
  /** Seguridad en mujeres gestantes. */
  apto_embarazo: SafetyStatus;
  /** Seguridad durante el periodo de lactancia. */
  apto_lactancia: SafetyStatus;
  /** Seguridad en niños y adolescentes. */
  apto_pediatria: SafetyStatus;
  /** Seguridad para pacientes con Diabetes. */
  apto_diabeticos: SafetyStatus;
  /** Seguridad para pacientes con Hipertensión. */
  apto_hipertensos: SafetyStatus;
  /** Seguridad para pacientes con Celiaquía. */
  apto_celiacos: SafetyStatus;
  
  // Análisis de Sinergia y Relaciones
  /** Sugerencia de productos que potencian el efecto. */
  sugerencia_complementaria: string;
  /** Lista de SKUs relacionados por uso o composición. */
  skus_relacionados: string[];
  /** Fundamentación clínica de las relaciones sugeridas. */
  explicacion_clinica?: string;
  /** Indica si ya fue procesado por el motor de sinergias. */
  synergy_analyzed?: boolean;
  /** Fecha del último análisis de sinergia realizado. */
  last_synergy_analysis?: number;
  /** Intentos fallidos de análisis de sinergia. */
  synergy_retries?: number;
  
  // Control de Acceso Distribuido (Locking)
  /** Indica si la IA está editando este campo actualmente. */
  locked_by_ai?: boolean;
  /** ID del proceso/usuario que posee el bloqueo. */
  lock_uid?: string;
  /** Marca de tiempo del bloqueo para evitar "deadlocks". */
  lock_timestamp?: number;
  
  // Metadatos de Origen
  /** URL de donde se extrajo la información original. */
  source_url?: string;
  /** Última vez que se actualizó el registro. */
  last_updated?: number;
  
  // Auditoría y Validación Profesional
  /** Indica si un profesional ha verificado la veracidad del contenido. */
  is_verified?: boolean;
  /** Fecha de la última verificación. */
  verified_at?: number;
  /** ID del profesional verificador. */
  verified_by?: string;

  // Estado de Sincronización
  /** Indica si el registro local coincide con la nube. */
  synced?: boolean;
  /** Última vez que se subió/bajó de la nube. */
  last_synced?: number;
}
