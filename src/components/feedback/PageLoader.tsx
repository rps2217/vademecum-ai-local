import { Loader2 } from 'lucide-react';

export function PageLoader() {
  return (
    <div className="flex h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary-500)]" />
        <p className="text-sm text-[var(--fg-muted)]">Cargando...</p>
      </div>
    </div>
  );
}
