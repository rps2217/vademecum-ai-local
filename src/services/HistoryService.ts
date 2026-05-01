import { Product } from '../core/types';
import { storage } from '../utils/storage';

const HISTORY_KEY = 'vademecum_recent_history';
const MAX_HISTORY = 12;

export const HistoryService = {
  getRecent(): Product[] {
    return storage.get<Product[]>(HISTORY_KEY, []);
  },

  trackView(product: Product): void {
    const history = this.getRecent();
    const filtered = history.filter(p => p.sku !== product.sku);
    const updated = [product, ...filtered].slice(0, MAX_HISTORY);
    storage.set(HISTORY_KEY, updated);
    
    // Notificar a la UI si es necesario
    window.dispatchEvent(new CustomEvent('history_updated'));
  },

  clear(): void {
    storage.remove(HISTORY_KEY);
    window.dispatchEvent(new CustomEvent('history_updated'));
  }
};
