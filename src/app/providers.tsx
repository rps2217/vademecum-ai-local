/**
 * Providers - Proveedores de la aplicación
 */

import { ThemeProvider } from './ThemeProvider';
import { DbProvider } from './DbProvider';
import { E2EEAuthProvider } from './E2EEAuthProvider';
import { ToastProvider } from './ToastProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <DbProvider>
          <E2EEAuthProvider>
            {children}
          </E2EEAuthProvider>
        </DbProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
