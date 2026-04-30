import { EventBus, EventType, Subscription } from './EventBus';
import { TaskQueueService } from './TaskQueueService';
import { DataService } from './DataService';
import { Product } from '../core/types/product.types';

export class AutomationTriggerService {
  private static subscriptions: Subscription[] = [];

  static start() {
    if (this.subscriptions.length > 0) return;

    // 1. Trigger Automation on Product Update
    this.subscriptions.push(
      EventBus.on<{sku: string}>(EventType.PRODUCT_UPDATED).subscribe(async ({ sku }) => {
        const { ConfigService } = await import('./ConfigService');
        const config = ConfigService.getConfig();
        if (!config.enableBackgroundSynergy) return;

        const product = await DataService.getProductBySku(sku);
        if (product) {
          // A. Enqueue Vectorization ONLY IF MISSING
          if (!product.vectores || product.vectores.length === 0) {
            await TaskQueueService.addTask('vectorization', { sku: product.sku });
          }

          // B. Enqueue Synergy Analysis if needed
          const now = Date.now();
          const oneWeek = 7 * 24 * 60 * 60 * 1000;
          if (!product.synergy_analyzed || (now - (product.last_synergy_analysis || 0) > oneWeek)) {
            await TaskQueueService.addTask('ai_analysis', { type: 'synergy', sku: product.sku });
          }
        }
      })
    );

    // 2. Trigger Proactive Interaction Check on Comparison Change
    this.subscriptions.push(
      EventBus.on<{products: Product[]}>(EventType.COMPARISON_CHANGED).subscribe(async ({ products }) => {
        if (products.length >= 2) {
          console.log('[Automation] Disparando análisis proactivo de interacciones...');
          // Podríamos encolar una tarea especial o simplemente dejar que el usuario lo haga manual si prefiere,
          // pero aquí lo automatizamos para la Fase D2.
          // El resultado podría guardarse en un cache local o emitirse como evento.
          
          // Por ahora, emitimos un aviso de carga en la UI
          EventBus.emit(EventType.SYNERGY_STATUS_CHANGED, { 
            status: 'analyzing', 
            message: 'Analizando interacciones proactivamente...' 
          });
        }
      })
    );

    console.log('[Automation] Servicio de disparadores automáticos iniciado.');
  }

  static stop() {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.subscriptions = [];
  }
}
