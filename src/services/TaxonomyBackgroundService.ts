import { AIService } from './AIService';
import { DataService } from './DataService';

export interface TaxonomyStatus {
  isProcessing: boolean;
  progress: string;
  totalTags: number;
  processedTags: number;
  updatedProducts: number;
  lastLog?: { msg: string; type: 'info' | 'success' | 'warn' | 'error' };
}

export class TaxonomyBackgroundService {
  private static status: TaxonomyStatus = {
    isProcessing: false,
    progress: '',
    totalTags: 0,
    processedTags: 0,
    updatedProducts: 0
  };

  private static listeners: Array<(status: TaxonomyStatus) => void> = [];

  static subscribe(listener: (status: TaxonomyStatus) => void) {
    this.listeners.push(listener);
    listener(this.status);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private static notify() {
    this.listeners.forEach(l => l({ ...this.status }));
  }

  private static addLog(msg: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') {
    this.status.lastLog = { msg, type };
    this.notify();
  }

  static getStatus() {
    return { ...this.status };
  }

  static async startStandardization() {
    if (this.status.isProcessing) return;

    this.status = {
      isProcessing: true,
      progress: 'Iniciando...',
      totalTags: 0,
      processedTags: 0,
      updatedProducts: 0
    };
    this.addLog('Iniciando estandarización de etiquetas clínicas...', 'info');

    try {
      const products = await DataService.getAllProducts();
      
      // 1. Extraer todas las etiquetas únicas
      const allTags = new Set<string>();
      products.forEach(p => p.tags_ia.forEach(t => allTags.add(t)));
      const uniqueTags = Array.from(allTags);
      
      if (uniqueTags.length === 0) {
        this.status.isProcessing = false;
        this.addLog('No se encontraron etiquetas para estandarizar.', 'warn');
        return;
      }

      this.status.totalTags = uniqueTags.length;
      this.addLog(`Encontradas ${uniqueTags.length} etiquetas únicas. Procesando con IA local...`, 'info');
      
      // 2. Procesar con IA local en lotes
      const mapping: Record<string, string> = {};
      const batchSize = 20;
      
      for (let i = 0; i < uniqueTags.length; i += batchSize) {
        const batch = uniqueTags.slice(i, i + batchSize);
        const result = await AIService.standardizeTags(batch);
        Object.assign(mapping, result);
        
        this.status.processedTags = Math.min(i + batchSize, uniqueTags.length);
        this.status.progress = `Mapeando etiquetas: ${this.status.processedTags}/${this.status.totalTags}`;
        this.addLog(`Mapeadas ${this.status.processedTags} etiquetas...`, 'info');
      }

      // 3. Aplicar cambios a los productos
      this.status.progress = 'Aplicando cambios a productos...';
      let updatedCount = 0;
      
      for (const product of products) {
        let changed = false;
        const newTags = product.tags_ia.map(tag => {
          if (mapping[tag] && mapping[tag] !== tag) {
            changed = true;
            return mapping[tag];
          }
          return tag;
        });

        if (changed) {
          const uniqueNewTags = Array.from(new Set(newTags));
          await DataService.saveProduct({
            ...product,
            tags_ia: uniqueNewTags,
            last_updated: Date.now()
          });
          updatedCount++;
        }
      }

      this.status.updatedProducts = updatedCount;
      this.status.isProcessing = false;
      this.status.progress = 'Completado';
      this.addLog(`¡Estandarización completada! ${updatedCount} productos actualizados.`, 'success');
      
      window.dispatchEvent(new Event('db_updated'));
      window.dispatchEvent(new CustomEvent('taxonomy_completed'));

    } catch (error: any) {
      this.status.isProcessing = false;
      this.addLog(`Error: ${error.message || 'Error desconocido'}`, 'error');
      console.error('[TaxonomyService] Error:', error);
    }
  }
}
