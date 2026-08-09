/**
 * useFocusTrap — mantiene el foco del teclado dentro de un contenedor.
 *
 * Cuando `active` es true:
 *   - Almacena el elemento con foco anterior y lo restaura al desactivar.
 *   - Auto-enfoca el primer elemento enfocable del contenedor.
 *   - Intercepta Tab/Shift+Tab para ciclar el foco dentro del contenedor.
 *
 * Uso típico: modales, drawers y command palettes.
 */
import { useEffect, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function useFocusTrap<T extends HTMLElement>(
  ref: RefObject<T | null>,
  active: boolean
): void {
  useEffect(() => {
    if (!active || !ref.current) return;

    const container = ref.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Enfocar el primer elemento enfocable (o el contenedor mismo)
    const focusables = getFocusableElements(container);
    if (focusables.length > 0) {
      focusables[0].focus();
    } else {
      container.focus();
    }

    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const elements = getFocusableElements(container);
      if (elements.length === 0) {
        e.preventDefault();
        return;
      }
      const first = elements[0];
      const last = elements[elements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first || !container.contains(document.activeElement)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last || !container.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    container.addEventListener('keydown', handler);
    return () => {
      container.removeEventListener('keydown', handler);
      previouslyFocused?.focus?.();
    };
  }, [active, ref]);
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  ).filter((el) => {
    // offsetParent es null en elementos ocultos (display:none).
    // En jsdom offsetParent siempre es null, así que verificamos también
    // que no tenga la clase hidden / style display:none.
    if (el.offsetParent !== null) return true;
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });
}
