import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Bug, Copy, Check } from 'lucide-react';
import { errorHandler, ErrorSeverity } from '../services/ErrorHandlerService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Capture error with ErrorHandlerService
    errorHandler.captureError(error, {
      type: 'react_boundary',
      componentStack: errorInfo.componentStack,
    });

    // Call optional custom error handler
    this.props.onError?.(error, errorInfo);

    this.setState({ errorInfo });
  }

  private handleCopyError = () => {
    const { error, errorInfo } = this.state;
    const errorText = `
Error: ${error?.message || 'Unknown error'}
Stack: ${error?.stack || 'No stack trace'}
Component Stack: ${errorInfo?.componentStack || 'No component stack'}
Timestamp: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}
URL: ${window.location.href}
    `.trim();

    navigator.clipboard.writeText(errorText).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private getErrorMessage(): { title: string; description: string; severity: ErrorSeverity } {
    const { error } = this.state;
    const message = error?.message?.toLowerCase() || '';

    // Critical errors (auth, permissions, database)
    if (message.includes('auth') || message.includes('permission') || message.includes('unauthorized')) {
      return {
        title: 'Error de Autenticación',
        description: 'No tienes permisos suficientes para realizar esta operación. Por favor, verifica tu sesión.',
        severity: ErrorSeverity.CRITICAL,
      };
    }

    if (message.includes('database') || message.includes('firestore') || message.includes('supabase')) {
      return {
        title: 'Error de Base de Datos',
        description: 'Hubo un problema al conectar con la base de datos. Los datos pueden estar desactualizados.',
        severity: ErrorSeverity.CRITICAL,
      };
    }

    // High severity (sync, network)
    if (message.includes('sync') || message.includes('network') || message.includes('fetch')) {
      return {
        title: 'Error de Conexión',
        description: 'No se pudo conectar con el servidor. Verifica tu conexión a internet e intenta nuevamente.',
        severity: ErrorSeverity.HIGH,
      };
    }

    // Medium severity (parsing, validation)
    if (message.includes('parse') || message.includes('invalid') || message.includes('json')) {
      return {
        title: 'Error de Datos',
        description: 'Los datos recibidos no tienen el formato esperado. Intenta recargar la aplicación.',
        severity: ErrorSeverity.MEDIUM,
      };
    }

    // Default error
    return {
      title: 'Error Inesperado',
      description: 'Ocurrió un error inesperado. Si el problema persiste, contacta al soporte técnico.',
      severity: ErrorSeverity.HIGH,
    };
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { title, description, severity } = this.getErrorMessage();
      const isCritical = severity === ErrorSeverity.CRITICAL;

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="bg-card border border-red-500/20 p-8 rounded-3xl max-w-lg w-full text-center space-y-6 shadow-2xl">
            <div className={`w-20 h-20 ${isCritical ? 'bg-red-500/10' : 'bg-amber-500/10'} rounded-full flex items-center justify-center mx-auto`}>
              <AlertTriangle className={`w-10 h-10 ${isCritical ? 'text-red-500' : 'text-amber-500'}`} />
            </div>
            
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-foreground">{title}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {description}
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="text-left bg-muted/50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <Bug className="w-3 h-3" />
                  <span>Modo Desarrollo</span>
                </div>
                <pre className="text-xs font-mono text-red-400 overflow-x-auto max-h-32 whitespace-pre-wrap">
                  {this.state.error.message}
                </pre>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleCopyError}
                className="flex-1 py-3 px-4 bg-muted text-muted-foreground rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-muted/80 transition-colors"
              >
                {this.state.copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Error</span>
                  </>
                )}
              </button>
              
              <button
                onClick={this.handleReload}
                className="flex-1 py-3 bg-primary text-foreground rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Recargar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook version of ErrorBoundary for functional components
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
): React.FC<P> {
  const WithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary fallback={fallback}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundary.displayName = `WithErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  
  return WithErrorBoundary;
}

