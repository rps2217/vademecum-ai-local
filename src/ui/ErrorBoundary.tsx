/**
 * ErrorBoundary - Componente de manejo de errores
 * 
 * Captura errores de React y muestra una UI de fallback.
 */

import { Component, ReactNode } from 'react';
import { Button } from './Button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    // TODO: Enviar a servicio de error tracking (Sentry, etc.)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="max-w-md text-center space-y-4">
            <AlertTriangle className="w-16 h-16 mx-auto text-destructive" />
            <h2 className="text-2xl font-bold">Algo salió mal</h2>
            <p className="text-muted-foreground">
              {this.state.error?.message || 'Error inesperado'}
            </p>
            <Button onClick={this.handleRetry} leftIcon={<RefreshCw className="w-4 h-4" />}>
              Reintentar
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
