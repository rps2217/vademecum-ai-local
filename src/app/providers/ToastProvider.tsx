import { Toaster as Sonner } from 'sonner';
import { useTheme } from './ThemeProvider';

export function ToastProvider() {
  const { resolved } = useTheme();
  return (
    <Sonner
      theme={resolved}
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: 'rounded-xl border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--fg)]',
        },
      }}
    />
  );
}
