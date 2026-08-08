/**
 * SearchContext - Estado de búsqueda global compartido
 *
 * Un único input de búsqueda (en el header) alimenta a todas las páginas.
 * Evita la confusión de tener múltiples inputs locales.
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface SearchContextValue {
  query: string;
  setQuery: (q: string) => void;
  clear: () => void;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState('');
  const clear = useCallback(() => setQuery(''), []);

  return (
    <SearchContext.Provider value={{ query, setQuery, clear }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) {
    throw new Error('useSearch must be used within SearchProvider');
  }
  return ctx;
}
