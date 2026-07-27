import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function RouteError() {
  const error = useRouteError();

  let title = 'Algo salió mal';
  let message = 'Ha ocurrido un error inesperado.';

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText || 'Error'}`;
    message = error.data?.message || 'La página que buscas no existe o no está disponible.';
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-danger)]/10">
          <AlertTriangle className="h-8 w-8 text-[var(--color-danger)]" />
        </div>
        <h1 className="mb-2 text-2xl font-bold">{title}</h1>
        <p className="mb-8 text-[var(--fg-muted)]">{message}</p>
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => history.back()}>
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <Button asChild>
            <Link to="/">
              <Home className="h-4 w-4" />
              Inicio
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
