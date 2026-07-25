/**
 * SynergiesView - Vista de Sinergias e Interacciones
 * Muestra el análisis de interacciones entre ingredientes
 */

import React, { useMemo, useState } from 'react';
import { Brain, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { knowledgeService } from '../../../services/KnowledgeService';
import type { KbIngredient } from '../../../types';

interface SynergiesViewProps {
  kb: Record<string, unknown>;
}

export function SynergiesView({ kb }: SynergiesViewProps) {
  const kbIngredients = knowledgeService.getAllIngredients();
  const [selectedType, setSelectedType] = useState<'all' | 'sinergia' | 'antagonismo'>('all');

  // Obtener ingredientes con sinergias
  const ingredientsWithSynergies = useMemo(() => {
    return kbIngredients
      .filter(ing => (ing.sinergias || []).length > 0)
      .sort((a, b) => ((b.sinergias || []).length) - ((a.sinergias || []).length))
      .slice(0, 15);
  }, [kbIngredients]);

  // Obtener ingredientes con antagonismos
  const ingredientsWithAntagonisms = useMemo(() => {
    return kbIngredients
      .filter(ing => (ing.antagonismos || []).length > 0)
      .sort((a, b) => ((b.antagonismos || []).length) - ((a.antagonismos || []).length))
      .slice(0, 10);
  }, [kbIngredients]);

  return (
    <div className="space-y-6">
      {/* Panel de resumen */}
      <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-5 border border-violet-100">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-violet-600" />
          <h3 className="font-semibold text-gray-900">Análisis de Interacciones</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/60 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-violet-600">{ingredientsWithSynergies.length}</div>
            <div className="text-xs text-gray-500 mt-1">Con Sinergias</div>
          </div>
          <div className="bg-white/60 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{ingredientsWithAntagonisms.length}</div>
            <div className="text-xs text-gray-500 mt-1">Con Antagonismos</div>
          </div>
        </div>
      </div>

      {/* Tabs para filtrar */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedType('all')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            selectedType === 'all' 
              ? "bg-violet-100 text-violet-700" 
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          Todos
        </button>
        <button
          onClick={() => setSelectedType('sinergia')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5",
            selectedType === 'sinergia' 
              ? "bg-emerald-100 text-emerald-700" 
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Sinergias
        </button>
        <button
          onClick={() => setSelectedType('antagonismo')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5",
            selectedType === 'antagonismo' 
              ? "bg-amber-100 text-amber-700" 
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          Antagonismos
        </button>
      </div>

      {/* Lista de ingredientes */}
      <div className="space-y-3">
        {(selectedType === 'all' || selectedType === 'sinergia') && ingredientsWithSynergies.map((ing) => (
          <IngredientCard 
            key={ing.id} 
            ingredient={ing} 
            type="sinergia"
            allIngredients={kbIngredients}
          />
        ))}

        {(selectedType === 'all' || selectedType === 'antagonismo') && ingredientsWithAntagonisms.map((ing) => (
          <IngredientCard 
            key={ing.id} 
            ingredient={ing} 
            type="antagonismo"
            allIngredients={kbIngredients}
          />
        ))}
      </div>
    </div>
  );
}

// Componente para tarjeta de ingrediente
function IngredientCard({ 
  ingredient, 
  type,
  allIngredients 
}: { 
  ingredient: KbIngredient; 
  type: 'sinergia' | 'antagonismo';
  allIngredients: KbIngredient[];
}) {
  const isSinergia = type === 'sinergia';
  const items = isSinergia ? ingredient.sinergias : ingredient.antagonismos;
  const iconClass = isSinergia ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700';
  const borderClass = isSinergia ? 'border-emerald-100' : 'border-amber-100';
  const countClass = isSinergia ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600';

  return (
    <div className={`bg-white border ${borderClass} rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-medium text-gray-900 text-sm">{ingredient.nombre}</h4>
          <span className="text-xs text-gray-400">{ingredient.familia}</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${countClass}`}>
          {(items || []).length} {isSinergia ? 'sinergia' : 'antagonismo'}{(items || []).length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {(items || []).slice(0, 4).map((itemId) => {
          const relatedIng = allIngredients.find(i => i.id === itemId);
          return relatedIng ? (
            <span 
              key={itemId} 
              className={`text-xs px-2 py-1 rounded-lg flex items-center gap-1 ${iconClass}`}
            >
              {isSinergia ? <Sparkles className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              {relatedIng.nombre}
            </span>
          ) : (
            <span key={itemId} className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded">
              {itemId}
            </span>
          );
        })}
        {(items || []).length > 4 && (
          <span className="text-xs text-gray-400 px-1 py-1">
            +{(items || []).length - 4} más
          </span>
        )}
      </div>
      {ingredient.notas && (
        <p className="text-xs text-gray-500 mt-2 italic">{ingredient.notas}</p>
      )}
    </div>
  );
}

export default SynergiesView;
