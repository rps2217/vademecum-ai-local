import { useEffect } from 'react';

interface ShortcutConfigs {
  [key: string]: () => void;
}

export const useKeyboardShortcuts = (shortcuts: ShortcutConfigs) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { key, ctrlKey, metaKey, altKey, shiftKey } = event;
      
      // Construir string de combinación (ej. "Control+k", "Escape")
      let combo = '';
      if (ctrlKey) combo += 'Control+';
      if (metaKey) combo += 'Meta+';
      if (altKey) combo += 'Alt+';
      if (shiftKey) combo += 'Shift+';
      combo += key.toLowerCase();

      if (shortcuts[combo]) {
        event.preventDefault();
        shortcuts[combo]();
      } else if (shortcuts[key]) {
        // Soporte para teclas simples como "Escape"
        shortcuts[key]();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};
