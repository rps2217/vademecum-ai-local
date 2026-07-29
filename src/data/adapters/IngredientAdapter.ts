/**
 * Adaptador para Ingredientes
 * Convierte entre formato local (Dexie) y formato remoto (Supabase)
 */

import type { DbIngredient } from '@/db/schema';
import type { RemoteIngredient } from './types';

export class IngredientAdapter {
  /**
   * Convierte formato local (Dexie) a formato remoto (Supabase)
   * IMPORTANTE: No incluye el campo 'id' porque Supabase genera UUID automáticamente
   */
  static toRemote(local: DbIngredient): Record<string, unknown> {
    // Extraer contraindicaciones de seguridad
    const contraindications: string[] = [];
    if (local.seguridad) {
      if (local.seguridad.embarazo === 'evitar' || local.seguridad.embarazo === 'contraindicado') {
        contraindications.push('Embarazo');
      }
      if (local.seguridad.lactancia === 'evitar' || local.seguridad.lactancia === 'contraindicado') {
        contraindications.push('Lactancia');
      }
      if (local.seguridad.pediatria === 'evitar' || local.seguridad.pediatria === 'contraindicado') {
        contraindications.push('Pediatría');
      }
    }

    // Extraer warnings de propiedades
    const warnings = local.propiedades?.filter(p => 
      p.toLowerCase().includes('advertencia') || 
      p.toLowerCase().includes('precaución')
    ) || [];

    // Obtener nombre científico de sinónimos
    const scientificName = local.sinonimos?.find(s => 
      s.includes(' ') && 
      (s.includes('officinalis') || s.includes('extract') || /^[A-Z][a-z]+ [a-z]+/.test(s))
    );

    // NO incluir 'id' - es UUID y Supabase lo genera automáticamente
    // Asegurar que description no sea null
    const description = local.propiedades?.[0] 
      || local.indicaciones?.[0]
      || `Ingrediente ${local.nombre}`;

    return {
      ingredient_key: local.id,
      name: local.nombre,
      scientific_name: scientificName || null,
      category: local.categoria,
      origin_type: 'medicinal',
      origin_description: null,
      description: description,
      mechanism: local.propiedades?.find(p => 
        p.toLowerCase().includes('mecanismo')
      )?.replace(/^Mecanismo:?\s*/i, '') || null,
      indications: local.indicaciones || [],
      contraindications: contraindications,
      interactions: local.interacciones || [],
      dosage: null,
      side_effects: null,
      synonyms: local.sinonimos || [],
      warnings: warnings.length > 0 ? warnings : null,
      created_at: new Date(local.createdAt).toISOString(),
      updated_at: new Date(local.updatedAt).toISOString(),
    };
  }

  /**
   * Convierte formato remoto (Supabase) a formato local (Dexie)
   */
  static toLocal(remote: RemoteIngredient): Partial<DbIngredient> {
    return {
      id: remote.ingredient_key || remote.id,
      nombre: remote.name,
      sinonimos: (remote.synonyms?.length ? remote.synonyms : [remote.name]) as string[],
      categoria: this.mapCategory(remote.category),
      sistemas: [], // Supabase no tiene este campo
      indicaciones: remote.indications || [],
      evidencia: 'C', // Valor por defecto
      propiedades: [
        remote.description,
        remote.mechanism ? `Mecanismo: ${remote.mechanism}` : null,
        remote.dosage ? `Dosificación: ${remote.dosage}` : null,
      ].filter(Boolean) as string[],
      seguridad: this.extractSafety(remote),
      interacciones: remote.interactions || [],
      fuentes: remote.warnings ? [remote.warnings] : [],
    };
  }

  /**
   * Extrae información de seguridad del registro remoto
   */
  private static extractSafety(remote: RemoteIngredient): DbIngredient['seguridad'] {
    const contraindications = remote.contraindications || [];
    
    return {
      embarazo: contraindications.some(c => c.toLowerCase().includes('embarazo'))
        ? 'evitar'
        : undefined,
      lactancia: contraindications.some(c => c.toLowerCase().includes('lactancia'))
        ? 'evitar'
        : undefined,
      pediatria: contraindications.some(c => 
        c.toLowerCase().includes('pedia') || c.toLowerCase().includes('niño')
      )
        ? 'evitar'
        : undefined,
    };
  }

  /**
   * Mapea categoría de Supabase a Dexie
   */
  private static mapCategory(category: string): DbIngredient['categoria'] {
    const categoryMap: Record<string, DbIngredient['categoria']> = {
      'fitoterapia': 'fitoterapia',
      'homeopatia': 'homeopatia',
      'aceite_esencial': 'aceite_esencial',
      'vitamina': 'vitamina',
      'vitaminas': 'vitamina',
      'mineral': 'mineral',
      'minerales': 'mineral',
      'probiotico': 'probiotico',
      'aminoacido': 'aminoacido',
    };

    return categoryMap[category.toLowerCase()] || 'fitoterapia';
  }

  /**
   * Verifica si dos ingredientes son iguales
   */
  static areEqual(local: DbIngredient, remote: RemoteIngredient): boolean {
    return (
      local.nombre === remote.name &&
      local.categoria === remote.category &&
      JSON.stringify(local.indicaciones.sort()) === JSON.stringify((remote.indications || []).sort())
    );
  }

  /**
   * Obtiene el ID para búsqueda en Supabase
   */
  static getRemoteId(ingredient: DbIngredient): string {
    return ingredient.id; // Usar el mismo ID
  }
}
