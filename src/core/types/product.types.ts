export enum SafetyStatus {
  SI = 'SI',
  NO = 'NO',
  PRECAUCION = 'PRECAUCION',
}

export type MainCategory = 'Belleza' | 'Medicamento' | 'Suplemento' | 'Homeopatía' | 'Otro';

export interface Product {
  sku: string; // Primary Key
  nombre_comercial: string;
  descripcion: string;
  principios_activos: string[];
  posologia: string;
  indicaciones: string[];
  advertencias: string;
  tags_ia: string[]; // Categorías generadas por IA
  categoria_principal?: MainCategory; // Clasificación principal
  analisis_componentes?: string; // Análisis de la función de cada componente
  anotaciones_componentes?: Record<string, string>; // { "principio activo": "breve información/anotación" }
  vectores: number[]; // Embeddings pre-calculados
  
  // Semáforo de Seguridad
  apto_embarazo: SafetyStatus;
  apto_lactancia: SafetyStatus;
  apto_pediatria: SafetyStatus;
  apto_diabeticos: SafetyStatus;
  apto_hipertensos: SafetyStatus;
  apto_celiacos: SafetyStatus;
  
  // Sinergia
  sugerencia_complementaria: string;
  skus_relacionados: string[];
  explicacion_clinica?: string;
  synergy_analyzed?: boolean;
  last_synergy_analysis?: number;
  synergy_retries?: number;
  
  // Distributed Locking
  locked_by_ai?: boolean;
  lock_uid?: string;
  lock_timestamp?: number;
  
  // Metadatos del Scraper
  source_url?: string;
  last_updated?: number;
  
  // Validación Profesional
  is_verified?: boolean;
  verified_at?: number;
  verified_by?: string;

  // Sincronización
  synced?: boolean;
  last_synced?: number;
}
