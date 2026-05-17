import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Ha ocurrido un error inesperado en la aplicación.";
      
      try {
        // Check if it's a Firestore JSON error
        if (this.state.error?.message.startsWith('{')) {
          const firestoreError = JSON.parse(this.state.error.message);
          if (firestoreError.error.includes('permission-denied')) {
            errorMessage = "No tienes permisos suficientes para realizar esta operación clínica.";
          }
        }
      } catch (e) {
        // Fallback to default message
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="bg-card border border-red-500/20 p-8 rounded-3xl max-w-md w-full text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">¡Ups! Algo salió mal</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {errorMessage}
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-primary text-foreground rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Recargar Aplicación
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
