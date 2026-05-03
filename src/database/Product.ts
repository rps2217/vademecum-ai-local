import { Model } from '@nozbe/watermelondb';
import { field, text, json, date, readonly } from '@nozbe/watermelondb/decorators';
import { Product as IProduct, MainCategory, SafetyStatus } from '../core/types/product.types';

export default class Product extends Model {
  static table = 'products';

  @text('sku') sku!: string;
  @text('nombre_comercial') nombreComercial!: string;
  @text('descripcion') descripcion!: string;
  
  @text('principios_activos_json') _principiosActivosJson!: string;
  get principiosActivos(): string[] {
    try {
      return JSON.parse(this._principiosActivosJson || '[]');
    } catch {
      return [];
    }
  }

  @text('posologia') posologia!: string;
  
  @text('indicaciones_json') _indicacionesJson!: string;
  get indicaciones(): string[] {
    try {
      return JSON.parse(this._indicacionesJson || '[]');
    } catch {
      return [];
    }
  }

  @text('advertencias') advertencias!: string;
  
  @text('tags_ia_json') _tagsIaJson!: string;
  get tagsIa(): string[] {
    try {
      return JSON.parse(this._tagsIaJson || '[]');
    } catch {
      return [];
    }
  }

  @text('categoria_principal') categoriaPrincipal?: MainCategory;
  @text('analisis_componentes') analisisComponentes?: string;
  
  @text('anotaciones_componentes_json') _anotacionesComponentesJson?: string;
  get anotacionesComponentes(): Record<string, string> {
    try {
      return JSON.parse(this._anotacionesComponentesJson || '{}');
    } catch {
      return {};
    }
  }

  @text('vectores_json') _vectoresJson?: string;
  get vectores(): number[] {
    try {
      return JSON.parse(this._vectoresJson || '[]');
    } catch {
      return [];
    }
  }

  @text('apto_embarazo') aptoEmbarazo!: SafetyStatus;
  @text('apto_lactancia') aptoLactancia!: SafetyStatus;
  @text('apto_pediatria') aptoPediatria!: SafetyStatus;
  @text('apto_diabeticos') aptoDiabeticos!: SafetyStatus;
  @text('apto_hipertensos') aptoHipertensos!: SafetyStatus;
  @text('apto_celiacos') aptoCeliacos!: SafetyStatus;

  @text('sugerencia_complementaria') sugerenciaComplementaria?: string;
  
  @text('skus_relacionados_json') _skusRelacionadosJson?: string;
  get skusRelacionados(): string[] {
    try {
      return JSON.parse(this._skusRelacionadosJson || '[]');
    } catch {
      return [];
    }
  }

  @text('explicacion_clinica') explicacionClinica?: string;
  @field('synergy_analyzed') synergyAnalyzed?: boolean;
  @field('last_synergy_analysis') lastSynergyAnalysis?: number;
  @field('synergy_retries') synergyRetries?: number;
  @field('locked_by_ai') lockedByAi?: boolean;
  @text('lock_uid') lockUid?: string;
  @field('lock_timestamp') lockTimestamp?: number;
  @text('source_url') sourceUrl?: string;
  @field('last_updated') lastUpdated!: number;
  @field('is_verified') isVerified?: boolean;
  @field('verified_at') verifiedAt?: number;
  @text('verified_by') verifiedBy?: string;
  @field('is_synced_cloud') isSyncedCloud?: boolean;
  @field('last_synced_cloud') lastSyncedCloud?: number;

  asJSON(): IProduct {
    return {
      sku: this.sku,
      nombre_comercial: this.nombreComercial,
      descripcion: this.descripcion,
      principios_activos: this.principiosActivos,
      posologia: this.posologia,
      indicaciones: this.indicaciones,
      advertencias: this.advertencias,
      tags_ia: this.tagsIa,
      categoria_principal: this.categoriaPrincipal,
      analisis_componentes: this.analisisComponentes,
      anotaciones_componentes: this.anotacionesComponentes,
      vectores: this.vectores,
      apto_embarazo: this.aptoEmbarazo,
      apto_lactancia: this.aptoLactancia,
      apto_pediatria: this.aptoPediatria,
      apto_diabeticos: this.aptoDiabeticos,
      apto_hipertensos: this.aptoHipertensos,
      apto_celiacos: this.aptoCeliacos,
      sugerencia_complementaria: this.sugerenciaComplementaria || '',
      skus_relacionados: this.skusRelacionados,
      explicacion_clinica: this.explicacionClinica,
      synergy_analyzed: this.synergyAnalyzed,
      last_synergy_analysis: this.lastSynergyAnalysis,
      synergy_retries: this.synergyRetries,
      locked_by_ai: this.lockedByAi,
      lock_uid: this.lockUid,
      lock_timestamp: this.lockTimestamp,
      source_url: this.sourceUrl,
      last_updated: this.lastUpdated,
      is_verified: this.isVerified,
      verified_at: this.verifiedAt,
      verified_by: this.verifiedBy,
      is_synced_cloud: this.isSyncedCloud,
      last_synced_cloud: this.lastSyncedCloud,
    };
  }
}
