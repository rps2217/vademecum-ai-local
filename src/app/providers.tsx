/**
 * Providers - Proveedores de la aplicación
 */

import { ThemeProvider } from './ThemeProvider';
import { DbProvider } from './DbProvider';
import { E2EEAuthProvider } from './E2EEAuthProvider';
import { ToastProvider } from './ToastProvider';
import { SearchProvider } from '@/contexts/SearchContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <SearchProvider>
          <DbProvider>
            <E2EEAuthProvider>
              {children}
            </E2EEAuthProvider>
          </DbProvider>
        </SearchProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
