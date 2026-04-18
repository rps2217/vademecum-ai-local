import { AIService } from './AIService';
import { DataService } from './DataService';

export interface VectorizationStatus {
  isProcessing: boolean;
  current: number;
  total: number;
  lastLog?: { msg: string; type: 'info' | 'success' | 'warn' | 'error' };
}

export class VectorBackgroundService {
  private static status: VectorizationStatus = {
    isProcessing: false,
    current: 0,
    total: 0
  };

  private static listeners: Array<(status: VectorizationStatus) => void> = [];

  static subscribe(listener: (status: VectorizationStatus) => void) {
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

  static async startVectorization() {
    if (this.status.isProcessing) return;

    this.status.isProcessing = true;
    this.notify();
    this.addLog('Iniciando vectorización masiva en segundo plano...', 'info');

    try {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const products = await response.json();
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
        // Verificar si se detuvo el motor (opcional, aquí asumimos que sigue)
        const product = pending[i];
        const textToEmbed = `${product.nombre_comercial} ${product.principios_activos.join(' ')} ${product.indicaciones.join(' ')}`;
        
        const vectors = await AIService.generateEmbedding(textToEmbed);
        
        await DataService.saveProduct({
          ...product,
          vectores: vectors,
          last_updated: Date.now()
        });
        
        this.status.current = i + 1;
        if ((i + 1) % 5 === 0 || i === pending.length - 1) {
          this.addLog(`Procesados ${i + 1}/${pending.length} productos...`, 'info');
        } else {
          this.notify();
        }
      }
      
      this.status.isProcessing = false;
      this.addLog('¡Vectorización masiva completada con éxito!', 'success');
      window.dispatchEvent(new Event('db_updated'));
      window.dispatchEvent(new CustomEvent('vectorization_completed'));

    } catch (e: any) {
      this.status.isProcessing = false;
      this.addLog(`Error en vectorización: ${e.message || 'Error desconocido'}`, 'error');
    }
  }
}
