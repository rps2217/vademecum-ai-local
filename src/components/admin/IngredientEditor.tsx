/**
 * IngredientEditor - Editor de Ingredientes
 * 
 * Modal para ver y editar detalles de ingredientes.
 */

import React, { useState } from 'react';
import { 
  X, Save, Trash2, Copy, 
  AlertTriangle, CheckCircle, Info,
  Sparkles, Shield, Pill
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { knowledgeLoader } from '../../core/knowledge-base';
import { synergyEngineV2 } from '../../core/knowledge-base';

interface IngredientEditorProps {
  ingredient: any;
  onClose: () => void;
  onSave: () => void;
}

const categoryIcons: Record<string, any> = {
  fitoterapia: Pill,
  homeopatia: Sparkles,
  aceite_esencial: Shield,
  vitaminas: Shield,
  minerales: Shield,
  aminoacidos: Sparkles,
  probioticos: Beaker,
  prebioticos: Leaf,
  enzimas: Beaker,
};

const evidenceColors: Record<string, string> = {
  'A': 'bg-green-100 text-green-700 border-green-200',
  'B': 'bg-blue-100 text-blue-700 border-blue-200',
  'C': 'bg-gray-100 text-gray-700 border-gray-200',
  'D': 'bg-amber-100 text-amber-700 border-amber-200',
};

export default function IngredientEditor({ ingredient, onClose, onSave }: IngredientEditorProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'synergies' | 'relations'>('info');
  
  const Icon = categoryIcons[ingredient.categoria] || Info;
  const synergies = knowledgeLoader.getSynergiesFor(ingredient.id) || [];
  const suggestedSynergies = synergyEngineV2.suggestPartners(ingredient.id, 5);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div 
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center",
                ingredient.categoria === 'fitoterapia' && "bg-emerald-100 text-emerald-600",
                ingredient.categoria === 'homeopatia' && "bg-violet-100 text-violet-600",
                ingredient.categoria === 'aceite_esencial' && "bg-amber-100 text-amber-600",
                ingredient.categoria === 'aminoacidos' && "bg-blue-100 text-blue-600",
                ingredient.categoria === 'probioticos' && "bg-teal-100 text-teal-600",
                ingredient.categoria === 'prebioticos' && "bg-green-100 text-green-600",
                ingredient.categoria === 'enzimas' && "bg-orange-100 text-orange-600",
                (ingredient.categoria === 'vitaminas' || ingredient.categoria === 'minerales') && "bg-blue-100 text-blue-600"
              )}>
                <Icon className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{ingredient.nombre}</h2>
                {ingredient.nombreCientifico && (
                  <p className="text-sm text-gray-500 italic">{ingredient.nombreCientifico}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full capitalize">
                    {ingredient.categoria.replace(/_/g, ' ')}
                  </span>
                  {ingredient.nivelEvidencia && (
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full border",
                      evidenceColors[ingredient.nivelEvidencia] || evidenceColors['C']
                    )}>
                      Evidencia {ingredient.nivelEvidencia}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 bg-slate-100 p-1 rounded-lg w-fit">
            {['info', 'sinergies', 'relations'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize",
                  activeTab === tab
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                {tab === 'info' ? 'Información' : tab === 'sinergies' ? 'Sinergias' : 'Relaciones'}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'info' && (
            <InfoTab ingredient={ingredient} onCopy={copyToClipboard} />
          )}
          
          {activeTab === 'synergies' && (
            <SynergiesTab 
              synergies={synergies} 
              suggested={suggestedSynergies}
            />
          )}
          
          {activeTab === 'relations' && (
            <RelationsTab ingredient={ingredient} />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-slate-50 flex justify-between items-center">
          <button
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Duplicar
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== INFO TAB ====================

function InfoTab({ ingredient, onCopy }: any) {
  return (
    <div className="space-y-6">
      {/* Description */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">Descripción</h3>
        <p className="text-gray-700 leading-relaxed">{ingredient.descripcion}</p>
      </div>

      {/* Mechanism */}
      {ingredient.mecanismoAccion && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Mecanismo de Acción</h3>
          <p className="text-gray-700 leading-relaxed">{ingredient.mecanismoAccion}</p>
        </div>
      )}

      {/* Indications */}
      {ingredient.indicaciones && ingredient.indicaciones.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Indicaciones</h3>
          <div className="flex flex-wrap gap-2">
            {ingredient.indicaciones.map((ind: string) => (
              <span key={ind} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm">
                {ind}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Systems */}
      {ingredient.sistemas && ingredient.sistemas.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Sistemas Corporales</h3>
          <div className="flex flex-wrap gap-2">
            {ingredient.sistemas.map((sys: string) => (
              <span key={sys} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm capitalize">
                {sys.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {ingredient.advertencias && ingredient.advertencias.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Advertencias</p>
              <ul className="text-sm text-amber-700 mt-1 space-y-1">
                {ingredient.advertencias.map((warn: string, i: number) => (
                  <li key={i}>• {warn}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Drug Interactions */}
      {ingredient.interaccionesMedicamentosas && ingredient.interaccionesMedicamentosas.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Interacciones Medicamentosas</p>
              <ul className="text-sm text-red-700 mt-1 space-y-1">
                {ingredient.interaccionesMedicamentosas.map((int: string, i: number) => (
                  <li key={i}>• {int}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Alternative Names */}
      {ingredient.nombresAlternativos && ingredient.nombresAlternativos.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Nombres Alternativos</h3>
          <div className="flex flex-wrap gap-2">
            {ingredient.nombresAlternativos.map((name: string) => (
              <span 
                key={name} 
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-sm flex items-center gap-2"
              >
                {name}
                <button 
                  onClick={() => onCopy(name)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Category-specific data */}
      {ingredient.categoria === 'fitoterapia' && (
        <div className="border rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-medium text-gray-500">Datos de Fitoterapia</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {ingredient.parteUsada && (
              <div>
                <p className="text-gray-500">Parte Usada</p>
                <p className="font-medium capitalize">{ingredient.parteUsada}</p>
              </div>
            )}
            {ingredient.tiempoEfecto && (
              <div>
                <p className="text-gray-500">Tiempo de Efecto</p>
                <p className="font-medium">{ingredient.tiempoEfecto}</p>
              </div>
            )}
            {ingredient.duracionTratamiento && (
              <div>
                <p className="text-gray-500">Duración del Tratamiento</p>
                <p className="font-medium">{ingredient.duracionTratamiento}</p>
              </div>
            )}
          </div>
          {ingredient.formasPresentacion && ingredient.formasPresentacion.length > 0 && (
            <div>
              <p className="text-gray-500 mb-1">Formas de Presentación</p>
              <div className="flex flex-wrap gap-1">
                {ingredient.formasPresentacion.map((f: string) => (
                  <span key={f} className="text-xs px-2 py-0.5 bg-gray-100 rounded">{f}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {ingredient.categoria === 'homeopatia' && (
        <div className="border rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-medium text-gray-500">Datos de Homeopatía</h3>
          {ingredient.dilucionesCH && ingredient.dilucionesCH.length > 0 && (
            <div>
              <p className="text-gray-500 mb-1">Diluciones CH Disponibles</p>
              <div className="flex gap-2">
                {ingredient.dilucionesCH.map((d: number) => (
                  <span key={d} className="px-3 py-1 bg-violet-50 text-violet-700 rounded-full text-sm">
                    CH {d}
                  </span>
                ))}
              </div>
            </div>
          )}
          {ingredient.sintomasClave && ingredient.sintomasClave.length > 0 && (
            <div>
              <p className="text-gray-500 mb-1">Síntomas Clave</p>
              <ul className="text-sm space-y-1">
                {ingredient.sintomasClave.map((s: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-violet-500">•</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==================== SYNERGIES TAB ====================

function SynergiesTab({ synergies, suggested }: any) {
  const typeColors: Record<string, string> = {
    potenciador: 'bg-emerald-100 text-emerald-700',
    complementario: 'bg-blue-100 text-blue-700',
    cofactor: 'bg-violet-100 text-violet-700',
    bioactivador: 'bg-amber-100 text-amber-700',
    secuencial: 'bg-cyan-100 text-cyan-700',
  };

  if (synergies.length === 0 && suggested.length === 0) {
    return (
      <div className="text-center py-8">
        <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No hay sinergias registradas para este ingrediente</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Existing Synergies */}
      {synergies.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-3">
            Sinergias Conocidas ({synergies.length})
          </h3>
          <div className="space-y-3">
            {synergies.map((syn: any) => {
              const partnerId = syn.ingredienteA === 'current' ? syn.ingredienteB : syn.ingredienteA;
              const partner = knowledgeLoader.getById(partnerId);
              
              return (
                <div key={syn.id} className="bg-white border rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                      <span className="font-medium">{partner?.nombre || partnerId}</span>
                    </div>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full capitalize",
                      typeColors[syn.tipo] || 'bg-gray-100'
                    )}>
                      {syn.tipo}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{syn.descripcion}</p>
                  {syn.beneficios && syn.beneficios.length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs text-gray-500 mb-1">Beneficios:</p>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {syn.beneficios.map((b: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Suggested Synergies */}
      {suggested.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-3">
            Sinergias Sugeridas
          </h3>
          <div className="space-y-3">
            {suggested.map((sug: any, i: number) => (
              <div key={i} className="bg-slate-50 border border-dashed rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">{sug.ingredient?.nombre || sug.ingredient?.id}</span>
                  </div>
                  <span className="text-xs text-slate-500">Sugerido</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{sug.synergy?.descripcion}</p>
                <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                  + Añadir Sinergia
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== RELATIONS TAB ====================

function RelationsTab({ ingredient }: any) {
  // Aquí mostraríamos relaciones con productos, categorías, etc.
  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <Info className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">
          Las relaciones con productos y otras entidades se mostrarán aquí.
        </p>
      </div>
    </div>
  );
}
