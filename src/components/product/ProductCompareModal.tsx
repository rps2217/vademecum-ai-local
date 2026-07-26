/**
 * ProductCompareModal - Modal para comparar productos lado a lado
 * Inspirado en appsimple: limpio, simple, rápido
 */

import React, { useState } from 'react';
import { X, Plus, Minus, Check, AlertTriangle, Info, Scale, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { AnalyzedProduct } from '../../types';
import { INGREDIENT_DATABASE } from '../../core/ingredient-database/ingredients';
import { getCombinedKnowledgeBase } from '../../core/knowledge-base';

interface ProductCompareModalProps {
  products: AnalyzedProduct[];
  onClose: () => void;
  onRemoveProduct: (sku: string) => void;
}

export function ProductCompareModal({ products, onClose, onRemoveProduct }: ProductCompareModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'ingredients' | 'synergies'>('general');

  if (products.length < 2) return null;

  const kb = getCombinedKnowledgeBase();

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="absolute inset-4 md:inset-8 lg:inset-12 bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Scale className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Comparar Productos</h2>
              <p className="text-xs text-gray-500">{products.length} productos seleccionados</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {(['general', 'ingredients', 'synergies'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                activeTab === tab
                  ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              )}
            >
              {tab === 'general' ? 'General' : tab === 'ingredients' ? 'Ingredientes' : 'Sinergias'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'general' && (
            <CompareGeneral products={products} />
          )}
          {activeTab === 'ingredients' && (
            <CompareIngredients products={products} />
          )}
          {activeTab === 'synergies' && (
            <CompareSynergies products={products} kb={kb} />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Haz clic en ✕ para eliminar un producto de la comparación
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function CompareGeneral({ products }: { products: AnalyzedProduct[] }) {
  const rows = [
    { label: 'Nombre', key: 'nombre_comercial' },
    { label: 'Marca', key: 'marca' },
    { label: 'Categoría', key: 'categoria_principal' },
    { label: 'Descripción', key: 'descripcion' },
    { label: 'Posología', key: 'posologia' },
    { label: 'Cobertura KB', key: 'cobertura_kb', suffix: '%' },
  ] as const;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left py-3 px-4 font-medium text-gray-500 w-32">Campo</th>
            {products.map((p) => (
              <th key={p.sku} className="text-left py-3 px-4 font-semibold text-gray-900 min-w-48">
                <div className="flex items-center gap-2">
                  {p.nombre_comercial || p.sku}
                  <button
                    onClick={() => {/* remove */}}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-3 h-3 text-gray-400" />
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-t border-gray-100">
              <td className="py-3 px-4 text-sm text-gray-500">{row.label}</td>
              {products.map((p) => {
                const value = p[row.key as keyof AnalyzedProduct];
                return (
                  <td key={p.sku} className="py-3 px-4 text-sm text-gray-900">
                    {value !== undefined && value !== null ? (
                      row.key === 'cobertura_kb' ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{ width: `${value}%` }}
                            />
                          </div>
                          <span>{value}{row.suffix}</span>
                        </div>
                      ) : (
                        String(value)
                      )
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CompareIngredients({ products }: { products: AnalyzedProduct[] }) {
  // Recopilar todos los ingredientes únicos
  const allIngredients = new Set<string>();
  products.forEach((p) => {
    (p.principios_activos || []).forEach((ing) => allIngredients.add(ing.toLowerCase()));
  });

  const ingredients = Array.from(allIngredients).sort();

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left py-3 px-4 font-medium text-gray-500 w-48">Ingrediente</th>
            {products.map((p) => (
              <th key={p.sku} className="text-center py-3 px-4 font-semibold text-gray-900">
                {p.nombre_comercial || p.sku}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ingredients.map((ing) => {
            const hasIngredient = (p: AnalyzedProduct) =>
              (p.principios_activos || []).some((i) => i.toLowerCase() === ing);

            return (
              <tr key={ing} className="border-t border-gray-100">
                <td className="py-3 px-4 text-sm font-medium text-gray-900 capitalize">
                  {ing}
                </td>
                {products.map((p) => (
                  <td key={p.sku} className="py-3 px-4 text-center">
                    {hasIngredient(p) ? (
                      <Check className="w-5 h-5 text-emerald-500 mx-auto" />
                    ) : (
                      <Minus className="w-5 h-5 text-gray-300 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface CompareSynergiesProps {
  products: AnalyzedProduct[];
  kb: Record<string, any>;
}

function CompareSynergies({ products, kb }: CompareSynergiesProps) {
  // Recopilar sinergias de todos los productos
  const synergies = products.flatMap((p) => p.sinergias_detectadas || []);
  const antagonismos = products.flatMap((p) => p.antagonismos_detectados || []);

  // Eliminar duplicados
  const uniqueSynergies = [...new Set(synergies)];
  const uniqueAntagonismos = [...new Set(antagonismos)];

  return (
    <div className="space-y-6">
      {/* Sinergias */}
      {uniqueSynergies.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-emerald-600 mb-3 flex items-center gap-2">
            <Check className="w-4 h-4" />
            Sinergias Detectadas ({uniqueSynergies.length})
          </h4>
          <div className="space-y-2">
            {uniqueSynergies.map((syn, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100"
              >
                <ArrowRight className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-sm text-emerald-800">{syn}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Antagonismos */}
      {uniqueAntagonismos.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-red-600 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Antagonismos Detectados ({uniqueAntagonismos.length})
          </h4>
          <div className="space-y-2">
            {uniqueAntagonismos.map((ant, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100"
              >
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-sm text-red-800">{ant}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sin sinergias ni antagonismos */}
      {uniqueSynergies.length === 0 && uniqueAntagonismos.length === 0 && (
        <div className="text-center py-12">
          <Info className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No se detectaron sinergias ni antagonismos entre estos productos</p>
        </div>
      )}
    </div>
  );
}

// Componente para botón de comparar
export function CompareButton({ 
  count, 
  onClick, 
  disabled 
}: { 
  count: number; 
  onClick: () => void; 
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || count < 2}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
        disabled || count < 2
          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
          : "bg-violet-500 text-white hover:bg-violet-600 active:scale-95"
      )}
    >
      <Scale className="w-4 h-4" />
      Comparar ({count})
    </button>
  );
}

export default ProductCompareModal;
