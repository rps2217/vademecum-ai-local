/**
 * Tipos de la Base de Conocimiento
 */

export interface IngredientInfo {
  id: string;
  nombre: string;
  nombre_latin?: string;
  categoria: IngredientCategory;
  descripcion: string;
  mecanismo_accion: string;
  beneficios: string[];
  fuentes_alimentarias?: string[];
  dosis_recomendada?: string;
  interacciones?: string[];
  contraindicaciones?: Contraindicacion[];
  sinergias: SynergyRelation[];
  antagonismos?: AntagonismRelation[];
  objetivos_salud: HealthObjective[];
}

export type IngredientCategory = 
  | 'vitaminas' 
  | 'minerales' 
  | 'aminoacidos' 
  | 'botanicos' 
  | 'enzimas' 
  | 'acidos_grasos' 
  | 'probioticos' 
  | 'antioxidantes'
  | 'extractos'
  | 'otros';

export interface Contraindicacion {
  condicion: string;
  nivel: 'absoluta' | 'relativa' | 'precaución';
  descripcion: string;
}

export type HealthObjective = 
  | 'inmunidad'
  | 'energia'
  | 'sueno'
  | 'articula'
  | 'cerebro'
  | 'deporte'
  | 'digestion'
  | 'corazon'
  | 'piel'
  | 'antiedad'
  | 'vision'
  | 'huesos'
  | 'peso'
  | 'fertilidad'
  | 'detox';

export interface SynergyRelation {
  ingrediente_id: string;
  tipo: 'potenciador' | 'complementario' | 'cofactor';
  descripcion: string;
  nivel: 'alto' | 'medio' | 'bajo';
}

export interface AntagonismRelation {
  ingrediente_id: string;
  tipo: 'competidor' | 'inhibidor' | 'bloqueador';
  descripcion: string;
  nivel: 'alto' | 'medio' | 'bajo';
}
