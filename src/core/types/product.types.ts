export enum SafetyStatus {
  SI = 'SI',
  NO = 'NO',
  PRECAUCION = 'PRECAUCION',
}

export interface Product {
  sku: string; // Primary Key
  nombre_comercial: string;
  descripcion: string;
  principios_activos: string[];
  posologia: string;
  indicaciones: string[];
  advertencias: string;
  tags_ia: string[]; // Categorías generadas por IA
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
}
