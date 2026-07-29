/**
 * Adaptador para Sinergias
 * Convierte entre formato local (Dexie) y formato remoto (Supabase)
 */

import type { DbSynergy } from '@/db/schema';
import type { RemoteSynergy } from './types';

export class SynergyAdapter {
  /**
   * Convierte formato local (Dexie) a formato remoto (Supabase)
   */
  static toRemote(local: DbSynergy): Record<string, unknown> {
    return {
      id: local.id,
      ingrediente1: local.ingredienteA,
      ingrediente2: local.ingredienteB,
      tipo_relacion: this.mapTipoToRemote(local.tipo),
      intensidad: local.nivel,
      descripcion: local.descripcion || local.mecanismo,
      evidencia: local.evidencia,
      created_at: new Date().toISOString(),
      updated_at: new Date(local.updatedAt).toISOString(),
    };
  }

  /**
   * Convierte formato remoto (Supabase) a formato local (Dexie)
   */
  static toLocal(remote: RemoteSynergy): Partial<DbSynergy> {
    return {
      id: remote.id,
      ingredienteA: remote.ingrediente1,
      ingredienteB: remote.ingrediente2,
      tipo: this.mapTipoFromRemote(remote.tipo_relacion),
      nivel: this.mapNivel(remote.intensidad),
      mecanismo: remote.descripcion,
      evidencia: this.mapEvidencia(remote.evidencia),
      fuentes: [],
    };
  }

  /**
   * Mapea tipo local a remoto
   */
  private static mapTipoToRemote(tipo: DbSynergy['tipo']): string {
    const tipoMap: Record<DbSynergy['tipo'], string> = {
      'sinergia': 'sinergia',
      'antagonismo': 'antagonismo',
      'interaccion': 'interaccion',
      'complemento': 'complemento',
    };
    return tipoMap[tipo] || 'sinergia';
  }

  /**
   * Mapea tipo remoto a local
   */
  static mapTipoFromRemote(tipo: string): DbSynergy['tipo'] {
    const tipoMap: Record<string, DbSynergy['tipo']> = {
      'sinergia': 'sinergia',
      'potenciador': 'sinergia',
      'antagonismo': 'antagonismo',
      'interaccion': 'interaccion',
      'interacción': 'interaccion',
      'complemento': 'complemento',
      'complementario': 'complemento',
    };
    return tipoMap[tipo.toLowerCase()] || 'sinergia';
  }

  /**
   * Mapea nivel de evidencia
   */
  static mapNivel(nivel?: string): DbSynergy['nivel'] {
    if (!nivel) return 'medio';
    
    const nivelMap: Record<string, DbSynergy['nivel']> = {
      'alto': 'alto',
      'critico': 'alto',
      'medio': 'medio',
      'bajo': 'bajo',
    };
    
    return nivelMap[nivel.toLowerCase()] || 'medio';
  }

  /**
   * Mapea nivel de evidencia
   */
  static mapEvidencia(evidencia?: string): DbSynergy['evidencia'] {
    if (!evidencia) return 'C';
    
    const evidenciaMap: Record<string, DbSynergy['evidencia']> = {
      'A': 'A',
      'B': 'B',
      'C': 'C',
      'D': 'D',
    };
    
    return evidenciaMap[evidencia.toUpperCase()] || 'C';
  }

  /**
   * Genera un ID determinista para una sinergia
   */
  static generateId(ingA: string, ingB: string): string {
    const sorted = [ingA, ingB].sort();
    return `${sorted[0]}_${sorted[1]}`;
  }
}
