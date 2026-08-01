/**
 * ErrorBoundary - Componente de manejo de errores
 * 
 * Captura errores de React y muestra una UI de fallback.
 */

import { Component, ReactNode } from 'react';
import { Button } from './Button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false, error: null, errorInfo: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: String(error) };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorString = JSON.stringify({
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack
    }, null, 2);
    
    logger.error('ErrorBoundary caught:', errorString);
    this.setState({ errorInfo });
    
    // Mostrar en consola para debug
    console.error('=== ERROR DETAILS ===');
    console.error(error);
    console.error(errorInfo);
    console.error('===================');
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: '' });
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="max-w-2xl text-center space-y-4">
            <AlertTriangle className="w-16 h-16 mx-auto text-destructive" />
            <h2 className="text-2xl font-bold">Algo salió mal</h2>
            <pre className="text-left text-xs bg-muted p-4 rounded overflow-auto max-h-64">
              {this.state.errorInfo || this.state.error?.message || 'Error inesperado'}
            </pre>
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
