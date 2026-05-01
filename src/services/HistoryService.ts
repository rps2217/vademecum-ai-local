import { Product } from '../core/types';
import { storage } from '../utils/storage';

const HISTORY_KEY = 'vademecum_recent_history';
const MAX_HISTORY = 12;

export class HistoryService {
  private static instance: HistoryService;

  private constructor() {}

  static getInstance(): HistoryService {
    if (!HistoryService.instance) {
      HistoryService.instance = new HistoryService();
    }
    return HistoryService.instance;
  }

  getRecent(): Product[] {
    return storage.get<Product[]>(HISTORY_KEY, []);
  }

  getRecentTerms(): string[] {
    return storage.get<string[]>('vademecum_recent_terms', []);
  }

  trackView(product: Product): void {
    const history = this.getRecent();
    const filtered = history.filter(p => p.sku !== product.sku);
    const updated = [product, ...filtered].slice(0, MAX_HISTORY);
    storage.set(HISTORY_KEY, updated);
    
    // Notificar a la UI si es necesario
    window.dispatchEvent(new CustomEvent('history_updated'));
  }

  trackSearchTerm(term: string): void {
    if (!term || term.trim().length < 2) return;
    const history = this.getRecentTerms();
    const cleaned = term.trim();
    if (history[0] === cleaned) return; // Evitar duplicar el último si es igual
    
    const updated = [cleaned, ...history.filter(t => t.toLowerCase() !== cleaned.toLowerCase())].slice(0, 10);
    storage.set('vademecum_recent_terms', updated);
    window.dispatchEvent(new CustomEvent('history_updated'));
  }

  clear(): void {
    storage.remove(HISTORY_KEY);
    storage.remove('vademecum_recent_terms');
    window.dispatchEvent(new CustomEvent('history_updated'));
  }
}

export const historyService = HistoryService.getInstance();
