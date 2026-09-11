/**
 * Tipos específicos para el Dashboard y Repertorio de Homeopatía
 */

import type { BodySystem, EvidenceLevel, IngredientSafety } from './shared-enums';

export interface HomeopathicModalities {
  empeora: string[];
  mejora: string[];
}

export interface HomeopathicRemedyData {
  id: string;
  nombre: string;
  nombresAlternativos?: string[];
  nombreCientifico?: string;
  familia?: string;
  categoria: 'homeopatia';
  sistemas: BodySystem[];
  indicaciones: string[];
  descripcion: string;
  mecanismoAccion?: string;
  nivelEvidencia: EvidenceLevel;
  dilucionesCH: number[];
  sintomasClave: string[];
  modalidades?: HomeopathicModalities;
  afinidad?: string[];
  constelaciones?: string[];
  advertencias?: string[];
  interaccionesMedicamentosas?: string[];
  seguridad?: IngredientSafety;
}

export interface HomeopathicComplexProtocol {
  id: string;
  titulo: string;
  categoria: string;
  indicacionPrincipal: string;
  icono: string;
  color: string;
  remedios: {
    id: string;
    nombre: string;
    dilucion: string;
    rol: string;
    posologia: string;
  }[];
  reglaPosologia: string;
  consejoMostrador: string;
  cuandoDerivar: string;
}

export interface DilutionGuide {
  rango: string;
  nombreNivel: string;
  indicacionTipo: string;
  ejemplos: string[];
  frecuenciaRecomendada: string;
  accionFisiologica: string;
}
