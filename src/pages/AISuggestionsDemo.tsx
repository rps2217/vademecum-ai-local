/**
 * AISuggestionsDemo - Página de demostración del Motor de Sugerencias IA
 */

import React, { useState, useCallback } from 'react';
import AISuggestionsPanel from '../components/ui/AISuggestionsPanel';
import { suggestionEngine, Suggestion } from '../core/ai-suggestions/SuggestionEngine';
import { knowledgeLoader } from '../core/knowledge-base';
import { Sparkles, Search, X, TrendingUp, Clock, BarChart3 } from 'lucide-react';

export default function AISuggestionsDemo() {
  const [query, setQuery] = useState('');
  const [lastSuggestion, setLastSuggestion] = useState<Suggestion | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showInsights, setShowInsights] = useState(false);

  const handleSuggestionClick = useCallback((suggestion: Suggestion) => {
    setLastSuggestion(suggestion);
    
    // Ejecutar búsqueda si hay acción
    if (suggestion.action?.type === 'search' && suggestion.action.payload) {
      setQuery(suggestion.action.payload);
      const results = knowledgeLoader.search(suggestion.action.payload);
      setSearchResults(results.slice(0, 5));
    }
  }, []);

  const handleSearch = useCallback(() => {
    if (!query.trim()) return;
    
    const results = knowledgeLoader.search(query);
    setSearchResults(results.slice(0, 5));
    
    // Actualizar contexto
    suggestionEngine.updateContext({ currentQuery: query });
  }, [query]);

  const insights = suggestionEngine.getUsageInsights();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              Motor de Sugerencias IA
            </h1>
          </div>
          <p className="text-gray-600">
            Demostración del sistema de sugerencias contextuales e inteligentes
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Search Box */}
        <div className="bg-white rounded-xl border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-500" />
            Prueba el buscador
          </h2>
          
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Ej: ansiedad, dormir mejor, dolor articular..."
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Buscar
            </button>
          </div>

          {/* Sugerencias IA */}
          <div className="mt-4">
            <AISuggestionsPanel
              currentQuery={query}
              onSuggestionClick={handleSuggestionClick}
            />
          </div>
        </div>

        {/* Insights Panel */}
        <div className="bg-white rounded-xl border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gray-500" />
              Insights de Uso
            </h2>
            <button
              onClick={() => setShowInsights(!showInsights)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {showInsights ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>

          {showInsights && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Search className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Búsquedas totales</span>
                </div>
                <p className="text-2xl font-bold text-blue-700">{insights.totalSearches}</p>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-gray-600">Tópicos frecuentes</span>
                </div>
                <p className="text-2xl font-bold text-purple-700">
                  {insights.topSymptoms.length}
                </p>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">Combinaciones</span>
                </div>
                <p className="text-2xl font-bold text-green-700">
                  {insights.commonCombos.length}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {searchResults.length > 0 && (
          <div className="bg-white rounded-xl border p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Resultados ({searchResults.length})
            </h2>
            <div className="space-y-3">
              {searchResults.map((result, i) => (
                <div key={result.id || i} className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">{result.nombre}</p>
                  <p className="text-sm text-gray-500">{result.categoria} • {result.familia}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Last Suggestion */}
        {lastSuggestion && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Última Sugerencia Seleccionada
            </h2>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{lastSuggestion.icon}</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{lastSuggestion.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{lastSuggestion.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                      Tipo: {lastSuggestion.type}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-green-100 rounded text-green-700">
                      Confianza: {Math.round(lastSuggestion.confidence * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
