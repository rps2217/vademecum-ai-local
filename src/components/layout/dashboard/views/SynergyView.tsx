/**
 * SynergyView - Vista de sinergias y antagonismos
 * Muestra análisis de interacciones entre ingredientes
 */

import React, { useMemo, useState } from 'react';
import { Sparkles, AlertCircle, Brain } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { knowledgeService } from '../../../../services/KnowledgeService';

interface SynergyViewProps {
  kb: Record<string, any>;
}

export function SynergyView({ kb }: SynergyViewProps) {
  const kbIngredients = knowledgeService.getAllIngredients();
  const [selectedType, setSelectedType] = useState<'all' | 'sinergia' | 'antagonismo'>('all');

  // Ingredientes con sinergias
  const ingredientsWithSynergies = useMemo(() => {
    return kbIngredients
      .filter(ing => (ing.sinergias || []).length > 0)
      .sort((a, b) => (b.sinergias || []).length - (a.sinergias || []).length)
      .slice(0, 15);
  }, []);

  // Ingredientes con antagonismos
  const ingredientsWithAntagonisms = useMemo(() => {
    return kbIngredients
      .filter(ing => (ing.antagonismos || []).length > 0)
      .sort((a, b) => (b.antagonismos || []).length - (a.antagonismos || []).length)
      .slice(0, 10);
  }, []);

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
          <div key={ing.id} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium text-gray-900 text-sm">{ing.nombre}</h4>
                <span className="text-xs text-gray-400">{ing.familia}</span>
              </div>
              <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">
                {(ing.sinergias || []).length} sinergia{(ing.sinergias || []).length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ing.sinergias.slice(0, 4).map((synergyId) => {
                const synergyIng = kbIngredients.find(i => i.id === synergyId);
                return synergyIng ? (
                  <span key={synergyId} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {synergyIng.nombre}
                  </span>
                ) : (
                  <span key={synergyId} className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded">
                    {synergyId}
                  </span>
                );
              })}
              {(ing.sinergias || []).length > 4 && (
                <span className="text-xs text-gray-400 px-1 py-1">+{(ing.sinergias || []).length - 4} más</span>
              )}
            </div>
            {ing.notas && (
              <p className="text-xs text-gray-500 mt-2 italic">{ing.notas}</p>
            )}
          </div>
        ))}

        {(selectedType === 'all' || selectedType === 'antagonismo') && ingredientsWithAntagonisms.map((ing) => (
          <div key={ing.id} className="bg-white border border-amber-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium text-gray-900 text-sm">{ing.nombre}</h4>
                <span className="text-xs text-gray-400">{ing.familia}</span>
              </div>
              <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
                {(ing.antagonismos || []).length} antagonismo{(ing.antagonismos || []).length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ing.antagonismos.slice(0, 4).map((antId) => {
                const antIng = kbIngredients.find(i => i.id === antId);
                return antIng ? (
                  <span key={antId} className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-lg flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {antIng.nombre}
                  </span>
                ) : (
                  <span key={antId} className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded">
                    {antId}
                  </span>
                );
              })}
              {(ing.antagonismos || []).length > 4 && (
                <span className="text-xs text-gray-400 px-1 py-1">+{(ing.antagonismos || []).length - 4} más</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SynergyView;
