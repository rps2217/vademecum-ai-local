/**
 * Interaction Engine
 * 
 * Motor de detección de interacciones entre pacientes y productos/ingredientes.
 * Verifica:
 * - Alergias del paciente
 * - Interacciones con medicamentos actuales
 * - Contraindicaciones por condición crónica
 * - Embarazo, lactancia, edad
 */

import { db } from '@/db';
import type {
  DbPatient,
  DbPatientAllergy,
  DbPatientCondition,
  DbPatientMedication,
  DbSynergy,
  SafetyStatus,
} from '@/db/schema';
import { logger } from '@/lib/logger';

// ============================================
// TIPOS
// ============================================

export type InteractionSeverity = 'info' | 'warning' | 'moderate' | 'severe' | 'critical';

export interface Interaction {
  id: string;
  type: InteractionType;
  severity: InteractionSeverity;
  title: string;
  description: string;
  source: string;
  relatedItem: string;
  recommendation?: string;
}

export type InteractionType =
  | 'alergia'
  | 'interaccion_medicamentosa'
  | 'contraindicacion'
  | 'embarazo'
  | 'lactancia'
  | 'pediatria'
  | 'condicion_cronica';

export interface PatientProfile {
  patient: DbPatient;
  allergies: DbPatientAllergy[];
  conditions: DbPatientCondition[];
  medications: DbPatientMedication[];
}

export interface ProductCheck {
  principiosActivos: string[];
  ingredienteIds?: string[];
  embarazo?: SafetyStatus;
  lactancia?: SafetyStatus;
  pediatria?: SafetyStatus;
  hipertension?: SafetyStatus;
  diabetes?: SafetyStatus;
}

// ============================================
// INTERACTION ENGINE
// ============================================

export class InteractionEngine {
  /**
   * Obtiene el perfil completo de un paciente
   */
  async getPatientProfile(patientId: string): Promise<PatientProfile | null> {
    const patient = await db.patients.get(patientId);
    if (!patient) return null;

    const [allergies, conditions, medications] = await Promise.all([
      db.patientAllergies.where('pacienteId').equals(patientId).toArray(),
      db.patientConditions.where('pacienteId').equals(patientId).toArray(),
      db.patientMedications
        .where('pacienteId')
        .equals(patientId)
        .filter(m => m.activo)
        .toArray(),
    ]);

    return { patient, allergies, conditions, medications };
  }

  /**
   * Verifica un producto/ingrediente contra el perfil del paciente
   */
  async checkProductVsPatient(
    patientId: string,
    product: ProductCheck
  ): Promise<Interaction[]> {
    const profile = await this.getPatientProfile(patientId);
    if (!profile) return [];

    const interactions: Interaction[] = [];

    // 1. Verificar alergias
    const allergyInteractions = this.checkAllergies(
      profile.allergies,
      product.principiosActivos
    );
    interactions.push(...allergyInteractions);

    // 2. Verificar interacciones con medicamentos actuales
    const medInteractions = await this.checkMedicationInteractions(
      profile.medications,
      product.principiosActivos,
      product.ingredienteIds
    );
    interactions.push(...medInteractions);

    // 3. Verificar contraindicaciones por condición
    const conditionInteractions = this.checkConditionContraindications(
      profile.conditions,
      product
    );
    interactions.push(...conditionInteractions);

    // 4. Verificar embarazo/lactancia/pediatría
    if (profile.patient.fechaNacimiento) {
      const age = this.calculateAge(profile.patient.fechaNacimiento);
      if (age < 18 && product.pediatria) {
        interactions.push(this.createInteraction(
          'pediatria',
          this.mapSafetyToSeverity(product.pediatria),
          'No recomendado para pediátricos',
          `El producto tiene restricciones para uso en niños según la edad del paciente (${age} años)`,
          'producto'
        ));
      }
    }

    if (product.embarazo && product.embarazo !== 'apto') {
      interactions.push(this.createInteraction(
        'embarazo',
        this.mapSafetyToSeverity(product.embarazo),
        'Contraindicado en embarazo',
        `Este producto no es ${product.embarazo === 'contraindicado' ? 'recomendado' : 'aconsejado'} durante el embarazo`,
        'producto'
      ));
    }

    if (product.lactancia && product.lactancia !== 'apto') {
      interactions.push(this.createInteraction(
        'lactancia',
        this.mapSafetyToSeverity(product.lactancia),
        'Contraindicado en lactancia',
        `Este producto no es ${product.lactancia === 'contraindicado' ? 'recomendado' : 'aconsejado'} durante la lactancia`,
        'producto'
      ));
    }

    return interactions;
  }

  /**
   * Verifica alergias contra principios activos
   */
  private checkAllergies(
    allergies: DbPatientAllergy[],
    principiosActivos: string[]
  ): Interaction[] {
    const interactions: Interaction[] = [];

    for (const allergy of allergies) {
      for (const principio of principiosActivos) {
        if (this.matchAllergen(allergy.sustancia, principio)) {
          interactions.push({
            id: `alergia-${allergy.id}`,
            type: 'alergia',
            severity: this.mapAllergySeverity(allergy.severidad),
            title: `Alergia a ${allergy.sustancia}`,
            description: `El paciente tiene alergia documentada a "${allergy.sustancia}" que coincide con "${principio}"`,
            source: 'paciente',
            relatedItem: principio,
            recommendation: allergy.severidad === 'grave' || allergy.severidad === 'severa'
              ? 'NO RECOMENDAR - Riesgo de reacción alérgica severa'
              : 'Utilizar con precaución extrema - Considerar alternativa',
          });
        }
      }
    }

    return interactions;
  }

  /**
   * Verifica interacciones con medicamentos actuales
   */
  private async checkMedicationInteractions(
    medications: DbPatientMedication[],
    principiosActivos: string[],
    ingredienteIds?: string[]
  ): Promise<Interaction[]> {
    const interactions: Interaction[] = [];

    for (const medication of medications) {
      const principiosAChequear = [
        medication.principioActivo,
        ...principiosActivos,
      ].filter(Boolean) as string[];

      for (const principio of principiosAChequear) {
        const synergias = await db.synergies
          .where('tombstone')
          .equals(0)
          .toArray();

        for (const sinergia of synergias) {
          const tieneInteraccion = this.detectSynergyInteraction(
            sinergia,
            principio,
            medication.principioActivo,
            ingredienteIds
          );

          if (tieneInteraccion) {
            if (sinergia.tipo === 'antagonismo') {
              interactions.push({
                id: `interaccion-${sinergia.id}`,
                type: 'interaccion_medicamentosa',
                severity: 'severe',
                title: `Interacción con ${medication.nombre}`,
                description: `El principio activo "${principio}" puede interactuar con "${medication.principioActivo || medication.nombre}"`,
                source: 'base_conocimiento',
                relatedItem: sinergia.id,
                recommendation: 'Consultar con médico antes de combinar. Posible reducción de eficacia o efectos adversos.',
              });
            } else {
              interactions.push({
                id: `sinergia-${sinergia.id}`,
                type: 'interaccion_medicamentosa',
                severity: 'info',
                title: `Posible sinergia con ${medication.nombre}`,
                description: `${sinergia.descripcion || 'Existe una relación sinérgica documentada entre estos componentes'}`,
                source: 'base_conocimiento',
                relatedItem: sinergia.id,
              });
            }
          }
        }
      }
    }

    return interactions;
  }

  /**
   * Detecta si hay interacción sinérgica
   */
  private detectSynergyInteraction(
    synergy: DbSynergy,
    principioA: string,
    principioB: string | undefined,
    ingredienteIds?: string[]
  ): boolean {
    if (!principioB) return false;

    const ingredienteA = principioA.toLowerCase();
    const ingredienteB = principioB.toLowerCase();

    if (ingredienteIds && ingredienteIds.length > 0) {
      const matchesA = ingredienteIds.includes(synergy.ingredienteA) ||
        synergy.ingredienteA.toLowerCase().includes(ingredienteA);
      const matchesB = ingredienteIds.includes(synergy.ingredienteB) ||
        synergy.ingredienteB.toLowerCase().includes(ingredienteB);

      if ((matchesA && matchesB) || 
          (matchesA && synergy.ingredienteB.toLowerCase().includes(ingredienteB)) ||
          (matchesB && synergy.ingredienteA.toLowerCase().includes(ingredienteA))) {
        return true;
      }
    }

    const synergyA = synergy.ingredienteA.toLowerCase();
    const synergyB = synergy.ingredienteB.toLowerCase();

    return (synergyA.includes(ingredienteA) && synergyB.includes(ingredienteB)) ||
           (synergyA.includes(ingredienteB) && synergyB.includes(ingredienteA));
  }

  /**
   * Verifica contraindicaciones por condición crónica
   */
  private checkConditionContraindications(
    conditions: DbPatientCondition[],
    product: ProductCheck
  ): Interaction[] {
    const interactions: Interaction[] = [];

    const conditionRules: Record<string, { field: keyof ProductCheck; severity: InteractionSeverity; message: string }> = {
      'diabetes': {
        field: 'diabetes',
        severity: 'severe',
        message: 'Contraindicado en pacientes diabéticos',
      },
      'hipertension': {
        field: 'hipertension',
        severity: 'moderate',
        message: 'Puede afectar la presión arterial',
      },
    };

    for (const condition of conditions) {
      const condicion = condition.condicion.toLowerCase();
      const rule = conditionRules[condicion];

      if (rule) {
        const productStatus = product[rule.field];

        if (productStatus === 'contraindicado' || productStatus === 'evitar') {
          interactions.push(this.createInteraction(
            'contraindicacion',
            rule.severity,
            rule.message,
            `Paciente con condición: ${condition.condicion}. ${rule.message}`,
            'condicion_cronica'
          ));
        }
      }
    }

    return interactions;
  }

  /**
   * Crea una interacción estructurada
   */
  private createInteraction(
    type: InteractionType,
    severity: InteractionSeverity,
    title: string,
    description: string,
    source: string
  ): Interaction {
    return {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      title,
      description,
      source,
      relatedItem: '',
    };
  }

  /**
   * Verifica si un alérgeno coincide con un principio activo
   */
  private matchAllergen(allergen: string, principio: string): boolean {
    const normalizedAllergen = allergen.toLowerCase().trim();
    const normalizedPrincipio = principio.toLowerCase().trim();

    if (normalizedAllergen === normalizedPrincipio) return true;

    if (normalizedPrincipio.includes(normalizedAllergen) ||
        normalizedAllergen.includes(normalizedPrincipio)) return true;

    const commonMappings: Record<string, string[]> = {
      'penicilina': ['amoxicilina', 'ampicilina', 'penicilina', 'penicilinas'],
      'aspirina': ['aspirina', 'ácido acetilsalicílico', 'salicilato'],
      'aines': ['ibuprofeno', 'naproxeno', 'diclofenaco', 'celecoxib'],
      'sulfa': ['sulfamidas', 'sulfasalazina', 'trimetoprim'],
      'codeína': ['codeína', 'morfina', 'opiáceos', 'opioides'],
    };

    for (const [, synonyms] of Object.entries(commonMappings)) {
      const matchesAllergen = synonyms.some(s => normalizedAllergen.includes(s));
      const matchesPrincipio = synonyms.some(s => normalizedPrincipio.includes(s));
      if (matchesAllergen && matchesPrincipio) return true;
    }

    return false;
  }

  /**
   * Calcula la edad desde timestamp de nacimiento
   */
  private calculateAge(birthTimestamp: number): number {
    const birth = new Date(birthTimestamp);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  /**
   * Mapea severidad de alergia a severity de interacción
   */
  private mapAllergySeverity(severity: string): InteractionSeverity {
    switch (severity) {
      case 'severa':
      case 'grave':
        return 'critical';
      case 'moderada':
        return 'severe';
      case 'leve':
        return 'warning';
      default:
        return 'warning';
    }
  }

  /**
   * Mapea SafetyStatus a InteractionSeverity
   */
  private mapSafetyToSeverity(status: SafetyStatus): InteractionSeverity {
    switch (status) {
      case 'contraindicado':
        return 'severe';
      case 'evitar':
        return 'moderate';
      default:
        return 'info';
    }
  }

  /**
   * Obtiene resumen de interacciones
   */
  getSeveritySummary(interactions: Interaction[]): {
    critical: number;
    severe: number;
    moderate: number;
    warning: number;
    info: number;
    total: number;
    canProceed: boolean;
  } {
    const summary = {
      critical: 0,
      severe: 0,
      moderate: 0,
      warning: 0,
      info: 0,
      total: interactions.length,
      canProceed: true,
    };

    for (const interaction of interactions) {
      summary[interaction.severity]++;
      if (interaction.severity === 'critical' || interaction.severity === 'severe') {
        summary.canProceed = false;
      }
    }

    return summary;
  }
}

// Singleton
export const interactionEngine = new InteractionEngine();
