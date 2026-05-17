import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../../services/LoggerService';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error(
      `ErrorBoundary Catch: ${this.props.componentName || 'Anonymous Component'}`, 
      'ErrorBoundary',
      {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      }
    );
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/20 flex flex-col items-center text-center">
          <AlertTriangle className="w-8 h-8 text-rose-500 mb-3" />
          <h3 className="text-foreground font-bold mb-2">Error de Renderizado</h3>
          <p className="text-muted-foreground text-sm mb-4 max-w-xs">
            Hubo un problema al cargar esta sección. El error ha sido registrado.
          </p>
          <button 
            onClick={handleRestart}
            className="flex items-center gap-2 px-4 py-2 bg-card hover:bg-slate-700 text-muted-foreground rounded-xl text-xs font-bold transition-colors"
          >
            <RefreshCcw className="w-3.5 h-3.5" /> Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function handleRestart() {
  window.location.reload();
}
