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
      const products = await dataService.getAllProducts();
      const pending = products.filter((p: any) => !p.vectores || p.vectores.length === 0);
      
      this.status.total = pending.length;
      this.status.current = 0;
      this.notify();

      if (pending.length === 0) {
        this.status.isProcessing = false;
        this.addLog('No hay productos pendientes de vectorización.', 'success');
        return;
      }

      for (let i = 0; i < pending.length; i++) {
        await this.vectorizeProduct(pending[i]);
        this.status.current = i + 1;
        if ((i + 1) % 5 === 0 || i === pending.length - 1) {
          this.addLog(`Procesados ${i + 1}/${pending.length} productos...`, 'info');
        } else {
          this.notify();
        }

        // Pausa térmica para proteger el hardware
        await new Promise(resolve => setTimeout(resolve, 2000));
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
