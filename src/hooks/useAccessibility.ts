import { useCallback, useEffect } from 'react';

interface UseAccessibilityOptions {
  /**
   * Whether to announce changes to screen readers
   */
  announceChanges?: boolean;
  
  /**
   * Live region politeness (polite or assertive)
   */
  politeness?: 'polite' | 'assertive';
  
  /**
   * Skip link target ID
   */
  skipLinkId?: string;
}

/**
 * Hook for managing accessibility features
 */
export function useAccessibility(options: UseAccessibilityOptions = {}) {
  const {
    announceChanges = true,
    politeness = 'polite',
    skipLinkId = 'main-content',
  } = options;

  /**
   * Announce a message to screen readers
   */
  const announce = useCallback((message: string, priority?: 'polite' | 'assertive') => {
    if (!announceChanges) return;

    const liveRegion = document.getElementById('a11y-live-region');
    if (liveRegion) {
      liveRegion.setAttribute('aria-live', priority || politeness);
      liveRegion.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  }, [announceChanges, politeness]);

  /**
   * Focus management
   */
  const focusElement = useCallback((selector: string | HTMLElement) => {
    const element = typeof selector === 'string' 
      ? document.querySelector<HTMLElement>(selector)
      : selector;
    
    if (element) {
      element.focus();
      if (typeof element.scrollIntoView === 'function') {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, []);

  /**
   * Trap focus within a container (for modals)
   */
  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  /**
   * Handle roving tabindex for complex widgets
   */
  const handleRovingTabIndex = useCallback((
    container: HTMLElement,
    selector: string,
    currentIndex: number
  ) => {
    const items = container.querySelectorAll<HTMLElement>(selector);
    
    items.forEach((item, index) => {
      item.tabIndex = index === currentIndex ? 0 : -1;
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      let newIndex = currentIndex;

      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          newIndex = (currentIndex + 1) % items.length;
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          newIndex = (currentIndex - 1 + items.length) % items.length;
          break;
        case 'Home':
          e.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          newIndex = items.length - 1;
          break;
        default:
          return;
      }

      items[newIndex]?.focus();
      items.forEach((item, index) => {
        item.tabIndex = index === newIndex ? 0 : -1;
      });
    };

    container.addEventListener('keydown', handleKeyDown);
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return {
    announce,
    focusElement,
    trapFocus,
    handleRovingTabIndex,
  };
}

/**
 * Create skip link for keyboard navigation
 */
export function createSkipLink(targetId: string, label: string = 'Saltar al contenido principal') {
  return {
    id: 'skip-link',
    href: `#${targetId}`,
    label,
  };
}

/**
 * ARIA live region component (should be placed once in the app)
 */
export const LiveRegion: React.FC = () => (
  <div
    id="a11y-live-region"
    role="status"
    aria-live="polite"
    aria-atomic="true"
    className="sr-only"
    style={{
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: 0,
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: 0,
    }}
  />
);

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if user prefers high contrast
 */
export function prefersHighContrast(): boolean {
  return window.matchMedia('(prefers-contrast: more)').matches;
}

/**
 * Hook to detect reduced motion preference
 */
export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = React.useState(prefersReducedMotion);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return reducedMotion;
}

// Need React import for LiveRegion component
import React from 'react';
