import { EventBus, EventType, Subscription } from './EventBus';
import { taskQueueService } from './TaskQueueService';
import { dataService } from './DataService';
import { configService } from './ConfigService';
import { Product } from '../core/types/product.types';

export class AutomationTriggerService {
  private static instance: AutomationTriggerService;
  private subscriptions: Subscription[] = [];

  private constructor() {}

  static getInstance(): AutomationTriggerService {
    if (!AutomationTriggerService.instance) {
      AutomationTriggerService.instance = new AutomationTriggerService();
    }
    return AutomationTriggerService.instance;
  }

  start() {
    if (this.subscriptions.length > 0) return;

    this.subscriptions.push(
      EventBus.on<{sku: string, synced?: boolean}>(EventType.PRODUCT_UPDATED).subscribe(async ({ sku, synced }) => {
        // Skip automation if this update was just a successful cloud sync
        // (to avoid infinite loops or redundant task creation)
        if (synced) return;

        const config = configService.getConfig();
        if (!config.enableBackgroundSynergy) return;

        const product = await dataService.getProductBySku(sku);
        if (product) {
          if (!product.vectores || product.vectores.length === 0) {
            await taskQueueService.addTask('vectorization', { sku: product.sku });
          }

          const now = Date.now();
          const oneWeek = 7 * 24 * 60 * 60 * 1000;
          if (!product.synergy_analyzed || (now - (product.last_synergy_analysis || 0) > oneWeek)) {
            await taskQueueService.addTask('ai_analysis', { type: 'synergy', sku: product.sku });
          }
        }
      })
    );

    this.subscriptions.push(
      EventBus.on<{products: Product[]}>(EventType.COMPARISON_CHANGED).subscribe(async ({ products }) => {
        if (products.length >= 2) {
          console.log('[Automation] Disparando análisis proactivo de interacciones...');
          EventBus.emit(EventType.SYNERGY_STATUS_CHANGED, { 
            status: 'analyzing', 
            message: 'Analizando interacciones proactivamente...' 
          });
        }
      })
    );

    console.log('[Automation] Servicio de disparadores automáticos iniciado.');
  }

  stop() {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.subscriptions = [];
  }
}

export const automationTriggerService = AutomationTriggerService.getInstance();
