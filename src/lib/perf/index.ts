/**
 * Performance Module - Exports
 * 
 * Herramientas de performance y métricas.
 */

export {
  initWebVitals,
  getCurrentMetrics,
  checkPerformanceBudget,
  type VitalMetric,
  type VitalCallback,
} from './webVitals';

export {
  usePrefetchOnHover,
  prefetchRoute,
  prefetchPageResources,
  preloadImage,
  preloadFont,
  measureRender,
  PREFETCHABLE_ROUTES,
} from './usePreload';
