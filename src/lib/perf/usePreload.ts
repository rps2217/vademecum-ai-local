/**
 * usePreload - Preloading de rutas
 * 
 * Hook para precargar rutas en hover/focus.
 */

import { useEffect, useRef } from 'react';
import { prefetch } from '@tanstack/react-router';

/**
 * Rutas que se pueden precargar
 */
export const PREFETCHABLE_ROUTES = [
  '/',
  '/search',
  '/admin',
  '/settings',
  '/synergies',
] as const;

/**
 * Prefijar una ruta específica
 */
export function prefetchRoute(route: string) {
  // Usando el router de react-router
  // En una implementación real, esto usaría el router específico
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // Precargar en background
      console.debug(`[preload] Route: ${route}`);
    });
  }
}

/**
 * Precargar recursos de una página
 */
export function prefetchPageResources(url: string) {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // Crear link elements para prefetch
      const prefetchLink = document.createElement('link');
      prefetchLink.rel = 'prefetch';
      prefetchLink.href = url;
      prefetchLink.as = 'document';
      document.head.appendChild(prefetchLink);

      // Limpiar después de uso
      setTimeout(() => {
        if (prefetchLink.parentNode) {
          prefetchLink.parentNode.removeChild(prefetchLink);
        }
      }, 10000);
    });
  }
}

/**
 * Hook para precargar al hacer hover sobre un link
 */
export function usePrefetchOnHover(enabled: boolean = true) {
  const prefetchedUrls = useRef(new Set<string>());

  useEffect(() => {
    if (!enabled) return;

    const handleMouseEnter = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');
      
      if (link) {
        const href = link.getAttribute('href');
        if (href && !prefetchedUrls.current.has(href)) {
          prefetchedUrls.current.add(href);
          prefetchPageResources(href);
        }
      }
    };

    document.addEventListener('mouseenter', handleMouseEnter, true);
    return () => {
      document.removeEventListener('mouseenter', handleMouseEnter, true);
    };
  }, [enabled]);
}

/**
 * Precargar imágenes
 */
export function preloadImage(src: string): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  document.head.appendChild(link);
}

/**
 * Precargar fonts
 */
export function preloadFont(family: string, weights: number[] = [400, 500, 600, 700]): void {
  weights.forEach(weight => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.crossOrigin = 'anonymous';
    // Asumiendo fuentes de Google Fonts
    link.href = `https://fonts.gstatic.com/s/${family.toLowerCase().replace(/\s/g, '')}/v${weight}/index.css`;
    document.head.appendChild(link);
  });
}

/**
 * Utilidad para medir tiempo de renderizado
 */
export function measureRender<T>(name: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  
  if (duration > 16) { // Más de 1 frame
    console.warn(`[perf] ${name} took ${duration.toFixed(2)}ms`);
  }
  
  return result;
}
