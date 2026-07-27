/**
 * ProtocolCard - Tarjeta de Protocolo de Suplementación
 */

import React from 'react';
import { Clock, Users, ChevronRight } from 'lucide-react';
import type { Protocol } from '../../../core/types/schema.types';

interface ProtocolCardProps {
  protocol: Protocol;
  onClick?: (protocol: Protocol) => void;
}

const difficultyColors = {
  baja: 'bg-emerald-100 text-emerald-700',
  intermedia: 'bg-amber-100 text-amber-700',
  alta: 'bg-red-100 text-red-700',
};

export const ProtocolCard: React.FC<ProtocolCardProps> = ({ protocol, onClick }) => {
  const ingredientCount = protocol.ingredients?.length || 0;
  
  return (
    <div 
      onClick={() => onClick?.(protocol)}
      className="group bg-white rounded-2xl border border-slate-200 p-5 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300 cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{protocol.icon || '💊'}</span>
          <div>
            <h3 className="font-semibold text-slate-800 group-hover:text-violet-700 transition-colors">
              {protocol.name}
            </h3>
            <span className="text-xs text-slate-500 capitalize">{protocol.category}</span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-violet-500 group-hover:translate-x-1 transition-all" />
      </div>

      {/* Descripción */}
      <p className="text-sm text-slate-600 mb-4 line-clamp-2">
        {protocol.description || protocol.objetivo_principal}
      </p>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>{protocol.duracion_dias} días</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <Users className="w-4 h-4 text-slate-400" />
          <span>{ingredientCount} suplementos</span>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[protocol.dificultad] || 'bg-slate-100 text-slate-600'}`}>
          {protocol.dificultad === 'baja' ? '🟢 Fácil' : protocol.dificultad === 'intermedia' ? '🟡 Medio' : '🔴 Avanzado'}
        </span>

        <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
          📊 Evidencia {protocol.evidencia_level}
        </span>

        {protocol.is_featured && (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
            ⭐ Destacado
          </span>
        )}
      </div>

      {/* Ingredientes preview */}
      {protocol.ingredients && protocol.ingredients.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500 mb-2">Suplementos incluidos:</p>
          <div className="flex flex-wrap gap-1">
            {protocol.ingredients.slice(0, 3).map((ing, idx) => (
              <span key={idx} className="px-2 py-1 bg-slate-100 rounded-lg text-xs text-slate-600">
                {ing.nombre}
              </span>
            ))}
            {protocol.ingredients.length > 3 && (
              <span className="px-2 py-1 bg-slate-100 rounded-lg text-xs text-slate-500">
                +{protocol.ingredients.length - 3}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProtocolCard;
