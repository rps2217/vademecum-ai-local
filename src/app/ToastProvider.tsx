/**
 * ToastProvider - Proveedor de notificaciones
 * 
 * Usa Sonner para toasts.
 */

import { Toaster } from 'sonner';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--card)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
          },
        }}
      />
    </>
  );
}
