/**
 * Web Vitals - Métricas de performance
 * 
 * Recoge y reporta métricas de Core Web Vitals.
 */

import { onLCP, onFID, onCLS, onFCP, onTTFB, onINP } from 'web-vitals';

interface VitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

type VitalCallback = (metric: VitalMetric) => void;

/**
 * Reportar métrica a consola (desarrollo)
 */
function reportToConsole(metric: VitalMetric) {
  const emoji = metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌';
  console.log(
    `%c${emoji} ${metric.name}: ${Math.round(metric.value)} (${metric.rating})`,
    'color: inherit; font-weight: bold;'
  );
}

/**
 * Enviar a endpoint de analytics (producción)
 */
async function reportToAnalytics(metric: VitalMetric) {
  // Solo enviar en producción
  if (import.meta.env.DEV) return;

  try {
    // Aquí se podría integrar con PostHog, Analytics, etc.
    const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
    if (endpoint) {
      await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          event: 'web_vital',
          properties: {
            name: metric.name,
            value: metric.value,
            rating: metric.rating,
            delta: metric.delta,
            id: metric.id,
            url: window.location.href,
            userAgent: navigator.userAgent,
          },
        }),
        keepalive: true,
      });
    }
  } catch (error) {
    console.warn('Error reporting vital:', error);
  }
}

/**
 * Callback que reporta a todos los destinos
 */
function reportVital(metric: VitalMetric) {
  reportToConsole(metric);
  reportToAnalytics(metric);
}

/**
 * Iniciar recolección de métricas
 */
export function initWebVitals(options: { debug?: boolean } = {}) {
  const { debug = import.meta.env.DEV } = options;

  if (!debug) {
    // Solo en desarrollo mostrar en consola
    onLCP(reportVital);
    onFID(reportVital);
    onCLS(reportVital);
    onFCP(reportVital);
    onTTFB(reportVital);
    onINP(reportVital);
  }
}

/**
 * Obtener métricas actuales del navegador
 */
export async function getCurrentMetrics(): Promise<{
  lcp: number | null;
  fid: number | null;
  cls: number | null;
}> {
  return new Promise((resolve) => {
    const metrics: Record<string, number | null> = {
      lcp: null,
      fid: null,
      cls: null,
    };

    let resolved = 0;
    const checkComplete = () => {
      resolved++;
      if (resolved >= 3) {
        resolve({
          lcp: metrics.lcp,
          fid: metrics.fid,
          cls: metrics.cls,
        });
      }
    };

    onLCP((metric) => {
      metrics.lcp = metric.value;
      checkComplete();
    });

    onFID((metric) => {
      metrics.fid = metric.value;
      checkComplete();
    });

    onCLS((metric) => {
      metrics.cls = metric.value;
      checkComplete();
    });

    // Timeout fallback
    setTimeout(checkComplete, 5000);
  });
}

/**
 * Verificar si el performance budget se cumple
 */
export function checkPerformanceBudget(): {
  passed: boolean;
  metrics: Array<{ name: string; value: number; threshold: number }>;
} {
  const thresholds = {
    lcp: 2500, // 2.5s
    fid: 100,   // 100ms
    cls: 0.1,   // 0.1
  };

  // Esta es una aproximación basada en Navigation Timing API
  const perfEntries = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  if (!perfEntries) {
    return { passed: false, metrics: [] };
  }

  const metrics = [
    {
      name: 'TTFB',
      value: perfEntries.responseStart - perfEntries.requestStart,
      threshold: 800,
    },
    {
      name: 'FCP',
      value: perfEntries.domContentLoadedEventEnd - perfEntries.requestStart,
      threshold: 1800,
    },
    {
      name: 'Load',
      value: perfEntries.loadEventEnd - perfEntries.requestStart,
      threshold: 3000,
    },
  ];

  const passed = metrics.every(m => m.value < m.threshold);

  return { passed, metrics };
}

export type { VitalMetric, VitalCallback };
