/**
 * Vademecum AI - Aplicación Principal
 */

import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { errorHandler } from './services/ErrorHandlerService';
import { appAuthService } from './services/AppAuthService';
import AppLogin from './components/auth/AppLogin';
import { AppBootstrapper } from './core/bootstrapper/AppBootstrapper';

// Lazy loading del Dashboard principal
const DashboardSimple = lazy(() => import('./components/layout/DashboardSimple').then(m => ({ default: m.DashboardSimple })));

// Componente de carga
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        <p className="text-sm text-gray-500">Cargando...</p>
      </div>
    </div>
  );
}

// Error boundary para componentes lazy
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    errorHandler.captureError(error, { componentStack: errorInfo.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Algo salió mal</h2>
            <p className="text-sm text-gray-500 mb-4">
              {this.state.error?.message || 'Error desconocido'}
            </p>
            <pre className="text-xs text-left bg-gray-100 p-2 rounded overflow-auto max-h-40">
              {this.state.error?.stack}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors mt-4"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar estado de autenticación
    setIsAuthenticated(appAuthService.isLoggedIn());
    setLoading(false);

    // Escuchar cambios de autenticación
    const unsubscribe = appAuthService.onAuthChange((authenticated) => {
      setIsAuthenticated(authenticated);
    });

    return () => unsubscribe();
  }, []);

  // Mostrar login si no está autenticado
  if (loading) {
    return <LoadingFallback />;
  }

  if (!isAuthenticated) {
    return <AppLogin onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <ErrorBoundary>
      <AppBootstrapper>
        <Suspense fallback={<LoadingFallback />}>
          <DashboardSimple />
        </Suspense>
      </AppBootstrapper>
    </ErrorBoundary>
  );
}
