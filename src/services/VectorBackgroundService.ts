import { aiService } from './AIService';
import { dataService } from './DataService';

export interface VectorizationStatus {
  isProcessing: boolean;
  current: number;
  total: number;
  lastLog?: { msg: string; type: 'info' | 'success' | 'warn' | 'error' };
}

export class VectorBackgroundService {
  private static instance: VectorBackgroundService;
  private status: VectorizationStatus = {
    isProcessing: false,
    current: 0,
    total: 0
  };

  private listeners: Array<(status: VectorizationStatus) => void> = [];

  private constructor() {}

  static getInstance(): VectorBackgroundService {
    if (!VectorBackgroundService.instance) {
      VectorBackgroundService.instance = new VectorBackgroundService();
    }
    return VectorBackgroundService.instance;
  }

  subscribe(listener: (status: VectorizationStatus) => void) {
    this.listeners.push(listener);
    listener(this.status);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l({ ...this.status }));
  }

  private addLog(msg: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') {
    this.status.lastLog = { msg, type };
    this.notify();
  }

  getStatus() {
    return { ...this.status };
  }

  async startVectorization() {
    if (this.status.isProcessing) return;

    this.status.isProcessing = true;
    this.notify();
    this.addLog('Iniciando vectorización masiva en segundo plano...', 'info');

    try {
      // Loop until there are no pending products.
      // Load them in batches to prevent keeping thousands of products in RAM.
      const batchSize = 20;
      let totalPending = 0;
      
      // Determine total pending first for status bar
      const allProductsLight = await dataService.getAllProducts();
      totalPending = allProductsLight.filter(p => !p.vectores || p.vectores.length === 0).length;
      
      this.status.total = totalPending;
      this.status.current = 0;
      this.notify();

      if (totalPending === 0) {
        this.status.isProcessing = false;
        this.addLog('No hay productos pendientes de vectorización.', 'success');
        return;
      }

      let processedCount = 0;
      let hasMore = true;

      while (hasMore) {
        const products = await dataService.getAllProducts();
        const pendingBatch = products.filter(p => !p.vectores || p.vectores.length === 0).slice(0, batchSize);
        
        if (pendingBatch.length === 0) {
          hasMore = false;
          break;
        }

        for (let i = 0; i < pendingBatch.length; i++) {
          await this.vectorizeProduct(pendingBatch[i]);
          processedCount++;
          this.status.current = processedCount;
          
          if (processedCount % 5 === 0 || processedCount === totalPending) {
            this.addLog(`Procesados ${processedCount}/${totalPending} productos...`, 'info');
          } else {
            this.notify();
          }

          // Pausa térmica para proteger el hardware
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      this.status.isProcessing = false;
      this.addLog('¡Vectorización masiva completada con éxito!', 'success');
      window.dispatchEvent(new Event('db_updated'));

    } catch (e: any) {
      this.status.isProcessing = false;
      this.addLog(`Error en vectorización: ${e.message || 'Error desconocido'}`, 'error');
    }
  }

  async vectorizeProduct(product: any) {
    if (!product.nombre_comercial) return;
    
    const textToEmbed = `${product.nombre_comercial} ${product.principios_activos?.join(' ') || ''} ${product.indicaciones?.join(' ') || ''}`;
    const vectors = await aiService.generateEmbedding(textToEmbed);
    
    await dataService.saveProduct({
      ...product,
      vectores: vectors,
      last_updated: Date.now()
    }, { silent: true });
  }
}

export const vectorBackgroundService = VectorBackgroundService.getInstance();
