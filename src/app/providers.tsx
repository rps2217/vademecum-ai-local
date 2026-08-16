/**
 * Providers - Proveedores de la aplicación
 */

import { ThemeProvider } from './ThemeProvider';
import { DbProvider } from './DbProvider';
import { AppAuthProvider } from './AppAuthProvider';
import { ToastProvider } from './ToastProvider';
import { SearchProvider } from '@/contexts/SearchContext';
import { ClientProfileProvider } from '@/contexts/ClientProfileContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <SearchProvider>
          <ClientProfileProvider>
            <DbProvider>
              <AppAuthProvider>
                {children}
              </AppAuthProvider>
            </DbProvider>
          </ClientProfileProvider>
        </SearchProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
