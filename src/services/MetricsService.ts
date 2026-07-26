/**
 * MetricsService - Servicio de Métricas y Analíticas
 * 
 * Rastrea:
 * - Búsquedas realizadas
 * - Productos más consultados
 * - Tiempo de respuesta
 * - Errores
 * - Uso de funcionalidades
 */

import { logger } from './LoggerService';

export interface SearchMetric {
  query: string;
  resultsCount: number;
  timestamp: string;
  duration: number; // ms
  type: 'product' | 'ingredient' | 'synergy';
}

export interface ProductMetric {
  productId: string;
  productName: string;
  views: number;
  lastViewed: string;
}

export interface AppMetrics {
  searches: SearchMetric[];
  topProducts: ProductMetric[];
  totalSearches: number;
  totalErrors: number;
  avgResponseTime: number;
  lastUpdated: string;
}

const METRICS_KEY = 'vademecum_metrics';
const MAX_STORED_SEARCHES = 100;

class MetricsService {
  private static instance: MetricsService;
  private metrics: AppMetrics;

  private constructor() {
    this.metrics = this.loadMetrics();
  }

  static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  private loadMetrics(): AppMetrics {
    try {
      const stored = localStorage.getItem(METRICS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      logger.error('Error cargando métricas', 'Metrics', e);
    }

    return {
      searches: [],
      topProducts: [],
      totalSearches: 0,
      totalErrors: 0,
      avgResponseTime: 0,
      lastUpdated: new Date().toISOString(),
    };
  }

  private saveMetrics(): void {
    try {
      this.metrics.lastUpdated = new Date().toISOString();
      localStorage.setItem(METRICS_KEY, JSON.stringify(this.metrics));
    } catch (e) {
      logger.error('Error guardando métricas', 'Metrics', e);
    }
  }

  /**
   * Registrar una búsqueda
   */
  recordSearch(
    query: string,
    resultsCount: number,
    duration: number,
    type: 'product' | 'ingredient' | 'synergy' = 'product'
  ): void {
    const search: SearchMetric = {
      query,
      resultsCount,
      timestamp: new Date().toISOString(),
      duration,
      type,
    };

    this.metrics.searches.push(search);
    this.metrics.totalSearches++;

    // Mantener solo las últimas búsquedas
    if (this.metrics.searches.length > MAX_STORED_SEARCHES) {
      this.metrics.searches = this.metrics.searches.slice(-MAX_STORED_SEARCHES);
    }

    // Actualizar tiempo promedio
    const totalDuration = this.metrics.searches.reduce((sum, s) => sum + s.duration, 0);
    this.metrics.avgResponseTime = totalDuration / this.metrics.searches.length;

    this.saveMetrics();
    logger.debug(`Búsqueda registrada: "${query}" (${resultsCount} resultados, ${duration}ms)`, 'Metrics');
  }

  /**
   * Registrar vista de producto
   */
  recordProductView(productId: string, productName: string): void {
    const existing = this.metrics.topProducts.find(p => p.productId === productId);

    if (existing) {
      existing.views++;
      existing.lastViewed = new Date().toISOString();
    } else {
      this.metrics.topProducts.push({
        productId,
        productName,
        views: 1,
        lastViewed: new Date().toISOString(),
      });
    }

    // Ordenar por vistas y mantener top 20
    this.metrics.topProducts.sort((a, b) => b.views - a.views);
    this.metrics.topProducts = this.metrics.topProducts.slice(0, 20);

    this.saveMetrics();
  }

  /**
   * Registrar error
   */
  recordError(context: string, error: string): void {
    this.metrics.totalErrors++;
    this.saveMetrics();
    logger.debug(`Error registrado: ${context} - ${error}`, 'Metrics');
  }

  /**
   * Obtener métricas actuales
   */
  getMetrics(): AppMetrics {
    return { ...this.metrics };
  }

  /**
   * Obtener búsquedas recientes
   */
  getRecentSearches(count: number = 10): SearchMetric[] {
    return this.metrics.searches.slice(-count).reverse();
  }

  /**
   * Obtener productos más vistos
   */
  getTopProducts(count: number = 10): ProductMetric[] {
    return this.metrics.topProducts.slice(0, count);
  }

  /**
   * Obtener estadísticas resumidas
   */
  getStats(): {
    totalSearches: number;
    todaySearches: number;
    topSearches: { query: string; count: number }[];
    avgResponseTime: number;
    totalErrors: number;
  } {
    const today = new Date().toDateString();
    const todaySearches = this.metrics.searches.filter(
      s => new Date(s.timestamp).toDateString() === today
    ).length;

    // Agrupar búsquedas por query
    const queryCounts = new Map<string, number>();
    this.metrics.searches.forEach(s => {
      const normalized = s.query.toLowerCase().trim();
      queryCounts.set(normalized, (queryCounts.get(normalized) || 0) + 1);
    });

    const topSearches = Array.from(queryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([query, count]) => ({ query, count }));

    return {
      totalSearches: this.metrics.totalSearches,
      todaySearches,
      topSearches,
      avgResponseTime: Math.round(this.metrics.avgResponseTime),
      totalErrors: this.metrics.totalErrors,
    };
  }

  /**
   * Limpiar métricas (reset)
   */
  clearMetrics(): void {
    this.metrics = {
      searches: [],
      topProducts: [],
      totalSearches: 0,
      totalErrors: 0,
      avgResponseTime: 0,
      lastUpdated: new Date().toISOString(),
    };
    this.saveMetrics();
    logger.info('Métricas reseteadas', 'Metrics');
  }

  /**
   * Exportar métricas como JSON
   */
  exportMetrics(): string {
    return JSON.stringify(this.metrics, null, 2);
  }
}

export const metricsService = MetricsService.getInstance();
