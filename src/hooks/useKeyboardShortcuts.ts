import { useEffect, useRef } from 'react';

interface ShortcutConfigs {
  [key: string]: () => void;
}

export const useKeyboardShortcuts = (shortcuts: ShortcutConfigs) => {
  const shortcutsRef = useRef(shortcuts);
  
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { key, ctrlKey, metaKey, altKey, shiftKey } = event;
      
      const currentShortcuts = shortcutsRef.current;
      
      // Construir string de combinación (ej. "Control+k", "Escape")
      let combo = '';
      if (ctrlKey) combo += 'Control+';
      if (metaKey) combo += 'Meta+';
      if (altKey) combo += 'Alt+';
      if (shiftKey) combo += 'Shift+';
      combo += key.toLowerCase();

      if (currentShortcuts[combo]) {
        event.preventDefault();
        currentShortcuts[combo]();
      } else if (currentShortcuts[key]) {
        // Soporte para teclas simples como "Escape"
        currentShortcuts[key]();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
};
