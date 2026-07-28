/**
 * PageLoader - Loader de página
 */

import { Loader2 } from 'lucide-react';

interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message = 'Cargando...' }: PageLoaderProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
