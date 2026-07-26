/**
 * SemanticSearchStatus - Indicador de estado de búsqueda semántica
 * Muestra qué proveedor se está usando
 */

import React from 'react';
import { Brain, Zap, Search, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { embeddingService } from '../../core/semantic-search/embedding-service';

export function SemanticSearchStatus() {
  const state = embeddingService.getState();

  const getProviderIcon = () => {
    switch (state.provider) {
      case 'transformers':
        return <Brain className="w-4 h-4 text-violet-500" />;
      case 'openai':
        return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'cohere':
        return <Zap className="w-4 h-4 text-blue-500" />;
      default:
        return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  const getProviderLabel = () => {
    switch (state.provider) {
      case 'transformers':
        return 'IA Local';
      case 'openai':
        return 'OpenAI';
      case 'cohere':
        return 'Cohere';
      default:
        return 'Búsqueda Rápida';
    }
  };

  const getStatusColor = () => {
    if (state.isLoading) return 'text-amber-500';
    if (state.error) return 'text-red-500';
    if (state.isReady) return 'text-emerald-500';
    return 'text-gray-400';
  };

  return (
    <div className="flex items-center gap-2 px-2 py-1 bg-gray-50 rounded-lg text-xs">
      {state.isLoading ? (
        <Loader2 className={cn("w-3 h-3 animate-spin", getStatusColor())} />
      ) : state.provider === 'transformers' ? (
        <Brain className="w-3 h-3 text-violet-500" />
      ) : state.provider === 'fuzzy' ? (
        <Search className="w-3 h-3 text-gray-400" />
      ) : (
        <Zap className="w-3 h-3 text-emerald-500" />
      )}
      
      <span className="text-gray-500">
        {state.isLoading ? (
          'Cargando...'
        ) : state.error ? (
          <span className="text-red-500">Error</span>
        ) : (
          getProviderLabel()
        )}
      </span>
    </div>
  );
}

export default SemanticSearchStatus;
