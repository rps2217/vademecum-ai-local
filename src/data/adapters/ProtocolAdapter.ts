/**
 * Adaptador para Protocolos
 * Convierte entre formato local (Dexie) y formato remoto (Supabase)
 */

import type { DbProtocol } from '@/db/schema';
import type { RemoteProtocol, RemoteProtocolIngredient } from './types';

export class ProtocolAdapter {
  /**
   * Convierte formato local (Dexie) a formato remoto (Supabase)
   */
  static toRemote(local: DbProtocol): Record<string, unknown> {
    return {
      id: local.id,
      name: local.nombre,
      description: local.objetivo,
      category: 'general',
      objetivo_principal: local.objetivo,
      duracion_dias: local.duracionDias,
      dificultad: 'media',
      ingredients: (local.ingredientes || []).map(ing => ({
        nombre: ing.id,
        dosis: ing.cantidad,
        momento: ing.momento,
      })),
      contraindicaciones: local.advertencias || [],
      evidencia_level: local.advertencias ? 'B' : 'C',
      is_active: local.tombstone === 0,
      is_featured: false,
      created_at: new Date(local.createdAt).toISOString(),
      updated_at: new Date(local.updatedAt).toISOString(),
    };
  }

  /**
   * Convierte formato remoto (Supabase) a formato local (Dexie)
   */
  static toLocal(remote: RemoteProtocol): Partial<DbProtocol> {
    return {
      id: remote.id,
      nombre: remote.name,
      objetivo: remote.objetivo_principal || remote.description || '',
      ingredientes: (remote.ingredients || []).map((ing: RemoteProtocolIngredient) => ({
        id: ing.nombre,
        cantidad: ing.dosis,
        momento: ing.momento,
      })),
      duracionDias: remote.duracion_dias,
      advertencias: remote.contraindicaciones || [],
    };
  }

  /**
   * Verifica si dos protocolos son iguales
   */
  static areEqual(local: DbProtocol, remote: RemoteProtocol): boolean {
    return (
      local.nombre === remote.name &&
      local.objetivo === (remote.objetivo_principal || remote.description)
    );
  }
}
