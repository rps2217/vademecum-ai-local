/**
 * AISuggestionsPanel - Panel de Sugerencias IA
 * 
 * Muestra sugerencias contextuales e inteligentes al usuario
 * basadas en el motor de sugerencias.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { suggestionEngine, Suggestion } from '../../core/ai-suggestions/SuggestionEngine';
import { cn } from '../../lib/utils';
import { Sparkles, X, ChevronRight, TrendingUp, Lightbulb, Link2, RefreshCw } from 'lucide-react';

interface AISuggestionsPanelProps {
  currentQuery: string;
  onSuggestionClick: (suggestion: Suggestion) => void;
  onDismiss?: () => void;
  className?: string;
}

const TYPE_CONFIG: Record<string, { icon: string; color: string; bgColor: string }> = {
  synergy: { icon: '⚡', color: 'text-yellow-600', bgColor: 'bg-yellow-50 border-yellow-200' },
  complementary: { icon: '🔗', color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200' },
  alternative: { icon: '💡', color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' },
  symptom_relief: { icon: '🩹', color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' },
  prevention: { icon: '🛡️', color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-200' },
  educational: { icon: '📚', color: 'text-gray-600', bgColor: 'bg-gray-50 border-gray-200' },
};

export default function AISuggestionsPanel({
  currentQuery,
  onSuggestionClick,
  onDismiss,
  className,
}: AISuggestionsPanelProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [modelStatus, setModelStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');

  // Cargar sugerencias cuando cambia la consulta
  useEffect(() => {
    const loadSuggestions = async () => {
      if (!currentQuery.trim() || currentQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      
      try {
        // Actualizar contexto del motor
        suggestionEngine.updateContext({ currentQuery });

        // Obtener sugerencias
        const results = await suggestionEngine.getSuggestions(5);
        setSuggestions(results);

        // Detectar estado del modelo de embeddings
        const insights = suggestionEngine.getUsageInsights();
        setModelStatus(insights.totalSearches > 0 ? 'ready' : 'fallback');
      } catch (error) {
        logger.error('Error cargando sugerencias', 'AISuggestionsPanel', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce para evitar muchas llamadas
    const timer = setTimeout(loadSuggestions, 300);
    return () => clearTimeout(timer);
  }, [currentQuery]);

  const handleSuggestionClick = useCallback((suggestion: Suggestion) => {
    // Registrar click para aprendizaje
    suggestionEngine.registerClick(suggestion.action?.payload || suggestion.description);
    onSuggestionClick(suggestion);
  }, [onSuggestionClick]);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const results = await suggestionEngine.getSuggestions(5);
      setSuggestions(results);
    } finally {
      setIsLoading(false);
    }
  }, []);

  if (suggestions.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className={cn(
      "bg-white rounded-xl border shadow-lg overflow-hidden",
      className
    )}>
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">
            Sugerencias IA
          </span>
          {modelStatus === 'fallback' && (
            <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
              Modo básico
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-1.5 hover:bg-white/50 rounded-lg transition-colors disabled:opacity-50"
            title="Actualizar sugerencias"
          >
            <RefreshCw className={cn(
              "w-4 h-4 text-gray-500",
              isLoading && "animate-spin"
            )} />
          </button>
          
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1.5 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Suggestions */}
      <div className="p-2 max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-gray-500">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="text-sm">Analizando contexto...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {suggestions.map((suggestion) => {
              const config = TYPE_CONFIG[suggestion.type] || TYPE_CONFIG.educational;
              
              return (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={cn(
                    "w-full p-3 rounded-lg border text-left transition-all hover:shadow-md",
                    config.bgColor,
                    "hover:scale-[1.01]"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <span className="text-lg flex-shrink-0 mt-0.5">
                      {config.icon}
                    </span>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {suggestion.title}
                        </p>
                        {suggestion.confidence > 0.8 && (
                          <TrendingUp className="w-3 h-3 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">
                        {suggestion.description}
                      </p>
                      
                      {suggestion.reason && (
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <Lightbulb className="w-3 h-3" />
                          {suggestion.reason}
                        </p>
                      )}
                    </div>
                    
                    {/* Action indicator */}
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {suggestions.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 border-t">
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Sugerencias basadas en sinergias conocidas y tu historial
          </p>
        </div>
      )}
    </div>
  );
}
