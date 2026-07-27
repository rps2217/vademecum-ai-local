/**
 * SynergyEditorPage - Página de prueba para el Editor Visual de Sinergias
 * 
 * Esta página demuestra el uso del componente SynergyGraphEditor
 * y permite gestionar las relaciones entre ingredientes.
 */

import React, { useState } from 'react';
import SynergyGraphEditor, { SynergyLink } from '../components/admin/SynergyGraphEditor';
import { logger } from '../services/LoggerService';
import SynergyGraph from '../components/admin/SynergyGraph';
import { cn } from '../lib/utils';

export default function SynergyEditorPage() {
  const [lastSynergy, setLastSynergy] = useState<SynergyLink | null>(null);
  const [viewMode, setViewMode] = useState<'editor' | 'viewer'>('editor');

  const handleSynergyCreated = (synergy: SynergyLink) => {
    setLastSynergy(synergy);
    logger.info('Sinergia creada desde el editor', 'SynergyEditorPage', synergy);
  };

  const handleSynergyUpdated = (synergy: SynergyLink) => {
    setLastSynergy(synergy);
    logger.info('Sinergia actualizada desde el editor', 'SynergyEditorPage', synergy);
  };

  const handleSynergyDeleted = (synergy: SynergyLink) => {
    setLastSynergy(null);
    logger.info('Sinergia eliminada desde el editor', 'SynergyEditorPage', synergy);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Editor Visual de Sinergias
        </h1>
        <p className="text-gray-600">
          Crea, edita y visualiza las relaciones de sinergia entre ingredientes
        </p>
      </div>

      {/* Instrucciones */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <span className="text-xl">💡</span> Cómo usar el editor
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li><strong>Conectar:</strong> Haz clic en "Conectar" y luego selecciona dos nodos para crear una sinergia</li>
          <li><strong>Editar:</strong> Haz clic en una conexión para seleccionar, luego en "Editar"</li>
          <li><strong>Eliminar:</strong> Selecciona una conexión y haz clic en "Eliminar"</li>
          <li><strong>Navegar:</strong> Arrastra para mover, scroll para zoom</li>
        </ul>
      </div>

      {/* Mode Switcher */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setViewMode('editor')}
          className={cn(
            "px-4 py-2 rounded-lg font-medium transition-colors",
            viewMode === 'editor'
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          )}
        >
          Editor
        </button>
        <button
          onClick={() => setViewMode('viewer')}
          className={cn(
            "px-4 py-2 rounded-lg font-medium transition-colors",
            viewMode === 'viewer'
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          )}
        >
          Visor
        </button>
      </div>

      {/* Editor/Viewer */}
      {viewMode === 'editor' ? (
        <SynergyGraphEditor
          onSynergyCreated={handleSynergyCreated}
          onSynergyUpdated={handleSynergyUpdated}
          onSynergyDeleted={handleSynergyDeleted}
        />
      ) : (
        <SynergyGraph />
      )}

      {/* Última acción */}
      {lastSynergy && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-6">
          <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
            <span>✅</span> Última sinergia procesada
          </h3>
          <div className="text-sm text-green-800 space-y-1">
            <p><strong>Ingredientes:</strong> {lastSynergy.ingredienteA} + {lastSynergy.ingredienteB}</p>
            <p><strong>Tipo:</strong> {lastSynergy.tipo}</p>
            <p><strong>Evidencia:</strong> {lastSynergy.nivelEvidencia}</p>
            {lastSynergy.descripcion && (
              <p><strong>Descripción:</strong> {lastSynergy.descripcion}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
