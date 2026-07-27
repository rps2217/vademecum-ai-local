/**
 * ProtocolDetail - Vista detallada de un protocolo
 */

import React from 'react';
import { X, Clock, Users, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';
import type { Protocol, ProtocolIngredient } from '../../../core/types/schema.types';

interface ProtocolDetailProps {
  protocol: Protocol;
  onClose: () => void;
  onStartProtocol?: (protocol: Protocol) => void;
}

const difficultyLabels = {
  baja: { label: 'Fácil', emoji: '🟢' },
  intermedia: { label: 'Intermedia', emoji: '🟡' },
  alta: { label: 'Avanzada', emoji: '🔴' },
};

export const ProtocolDetail: React.FC<ProtocolDetailProps> = ({ protocol, onClose, onStartProtocol }) => {
  const ingredients = protocol.ingredients || [];
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{protocol.icon || '💊'}</span>
            <div>
              <h2 className="text-2xl font-bold">{protocol.name}</h2>
              <p className="text-violet-200 capitalize">{protocol.category}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Descripción */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Objetivo
            </h3>
            <p className="text-slate-700">
              {protocol.objetivo_principal || protocol.description}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <Clock className="w-6 h-6 text-violet-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-slate-800">{protocol.duracion_dias}</p>
              <p className="text-xs text-slate-500">días</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <Users className="w-6 h-6 text-violet-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-slate-800">{ingredients.length}</p>
              <p className="text-xs text-slate-500">suplementos</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <span className="text-2xl">{difficultyLabels[protocol.dificultad]?.emoji}</span>
              <p className="text-sm font-medium text-slate-700 mt-1">
                {difficultyLabels[protocol.dificultad]?.label}
              </p>
            </div>
          </div>

          {/* Ingredientes */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Suplementos del Protocolo
            </h3>
            <div className="space-y-3">
              {ingredients.map((ing, idx) => (
                <IngredientRow key={idx} ingredient={ing} />
              ))}
            </div>
          </div>

          {/* Contraindicaciones */}
          {protocol.contraindicaciones && protocol.contraindicaciones.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-red-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Contraindicaciones
              </h3>
              <ul className="space-y-2">
                {protocol.contraindicaciones.map((cont, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="text-red-400 mt-0.5">⚠️</span>
                    {cont}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Evidencia */}
          <div className="bg-violet-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-violet-700 uppercase tracking-wide mb-2">
              Nivel de Evidencia
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-violet-700">{protocol.evidencia_level}</span>
              <div className="flex-1">
                <div className="h-2 bg-violet-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-violet-600 rounded-full"
                    style={{ width: `${(protocol.evidencia_level === 'A' ? 100 : protocol.evidencia_level === 'B' ? 75 : protocol.evidencia_level === 'C' ? 50 : 25)}%` }}
                  />
                </div>
                <p className="text-xs text-violet-600 mt-1">
                  {protocol.evidencia_level === 'A' ? 'Ensayos clínicos sólidos' : 
                   protocol.evidencia_level === 'B' ? 'Estudios preliminares' :
                   protocol.evidencia_level === 'C' ? 'Evidencia tradicional' : 'Evidencia limitada'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-slate-300 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={() => onStartProtocol?.(protocol)}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl font-medium text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            Iniciar Protocolo
          </button>
        </div>
      </div>
    </div>
  );
};

interface IngredientRowProps {
  ingredient: ProtocolIngredient;
}

const IngredientRow: React.FC<IngredientRowProps> = ({ ingredient }) => {
  const momentIcons: Record<string, string> = {
    mañana: '🌅',
    desayuno: '🌅',
    almuerzo: '☀️',
    tarde: '🌤️',
    cena: '🌙',
    dormir: '😴',
  };

  return (
    <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
      <span className="text-2xl">💊</span>
      <div className="flex-1">
        <p className="font-medium text-slate-800">{ingredient.nombre}</p>
        <p className="text-sm text-slate-500">{ingredient.dosis}</p>
      </div>
      <div className="text-right">
        <span className="text-lg">{momentIcons[ingredient.momento.toLowerCase()] || '⏰'}</span>
        <p className="text-xs text-slate-500 capitalize">{ingredient.momento}</p>
      </div>
    </div>
  );
};

export default ProtocolDetail;
