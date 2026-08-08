/**
 * RouteError - Página de error 404
 */

import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/ui/Button';

export function RouteError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-muted-foreground mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-2">Página no encontrada</h2>
        <p className="text-muted-foreground mb-6">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/">
            <Button variant="default">
              <Home className="w-4 h-4 mr-2" aria-hidden="true" />
              Ir al inicio
            </Button>
          </Link>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
            Volver atrás
          </Button>
        </div>
      </div>
    </div>
  );
}
