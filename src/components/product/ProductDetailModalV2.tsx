/**
 * ProductDetailModalV2 - Modal de detalle de producto REDISEÑADO
 * Rápido, estable, inspirado en appsimple
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  X, Copy, Loader2, Sparkles, CheckCircle2, 
  ChevronDown, ChevronRight, Pill, Info, 
  AlertTriangle, Link2, Calendar
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { findIngredient, type IngredientInfo } from '../../core/ingredient-database/ingredients';
import type { AnalyzedProduct } from '../../types';

// Panel lateral para mostrar información de ingredientes
function IngredientPanel({ 
  ingredient, 
  onClose 
}: { 
  ingredient: IngredientInfo; 
  onClose: () => void;
}) {
  const getCategoryIcon = () => {
    switch (ingredient.category) {
      case 'homeopatia': return '⚗️';
      case 'fitoterapia': return '🌿';
      case 'suplemento': return '💊';
      case 'vitamin': return '✨';
      case 'mineral': return '💎';
      case 'aminoacido': return '🧬';
      default: return '📋';
    }
  };

  const getCategoryColor = () => {
    switch (ingredient.category) {
      case 'homeopatia': return 'bg-violet-100 text-violet-700 border-violet-200';
      case 'fitoterapia': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'suplemento': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="absolute inset-y-0 right-0 w-full md:w-96 bg-white border-l border-gray-200 overflow-y-auto animate-slide-in-right shadow-xl z-10">
      {/* Header del panel */}
      <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getCategoryIcon()}</span>
          <div>
            <h3 className="font-semibold text-gray-900">{ingredient.name}</h3>
            {ingredient.scientificName && (
              <p className="text-xs text-gray-500 italic">{ingredient.scientificName}</p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Contenido */}
      <div className="p-4 space-y-4">
        {/* Descripción */}
        <p className="text-sm text-gray-600 leading-relaxed">
          {ingredient.description}
        </p>

        {/* Origen */}
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <span>📍</span> Origen
          </div>
          <p className="text-sm text-gray-700">
            {ingredient.origin.type === 'planta' && '🌿 '}
            {ingredient.origin.type === 'mineral' && '💎 '}
            {ingredient.origin.type === 'animal' && '🦋 '}
            {ingredient.origin.type === 'sintetico' && '⚗️ '}
            {ingredient.origin.type === 'microorganismo' && '🦠 '}
            {ingredient.origin.description}
          </p>
        </div>

        {/* Mecanismo */}
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 mb-2">
            <span>⚡</span> Mecanismo de Acción
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            {ingredient.mechanism}
          </p>
        </div>

        {/* Indicaciones */}
        {ingredient.indications.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-violet-600 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Indicaciones
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ingredient.indications.slice(0, 6).map((ind, i) => (
                <span 
                  key={i}
                  className="px-2 py-1 bg-violet-50 text-violet-700 text-xs rounded-lg"
                >
                  {ind}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Contraindicaciones */}
        {ingredient.contraindications.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-red-600 mb-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              Contraindicaciones
            </div>
            <div className="space-y-1">
              {ingredient.contraindications.map((contra, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-red-400 mt-1">•</span>
                  {contra}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dosis */}
        <div className="bg-amber-50 rounded-xl p-3">
          <div className="text-xs font-medium text-amber-700 mb-1">
            💊 Dosis habitual
          </div>
          <p className="text-sm text-amber-800">
            {ingredient.dosage}
          </p>
        </div>

        {/* Interacciones */}
        {ingredient.interactions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-orange-600 mb-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              Interacciones
            </div>
            <div className="space-y-1">
              {ingredient.interactions.map((inter, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-orange-400 mt-1">⚠️</span>
                  {inter}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {ingredient.warnings && ingredient.warnings.length > 0 && (
          <div className="bg-red-50 rounded-xl p-3">
            <div className="text-xs font-medium text-red-700 mb-2 flex items-center gap-1">
              ⚠️ Precauciones
            </div>
            {ingredient.warnings.map((warn, i) => (
              <p key={i} className="text-xs text-red-800">
                • {warn}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Chip de ingrediente clicable
function IngredientChip({ 
  name, 
  onSelect 
}: { 
  name: string; 
  onSelect: (info: IngredientInfo) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Buscar información del ingrediente - incluyendo búsqueda flexible
  const info = useMemo(() => {
    const result = findIngredient(name);
    if (result) return result;
    
    // Búsqueda flexible: buscar por palabras clave
    const normalizedName = name.toLowerCase().trim();
    const keywords = normalizedName.split(/\s+/);
    
    // Probar con variaciones
    const variations = [
      normalizedName,
      normalizedName.replace(/\s+/g, '-'),
      normalizedName.replace(/-/g, ''),
      ...keywords
    ];
    
    for (const variation of variations) {
      const found = findIngredient(variation);
      if (found) return found;
    }
    
    return null;
  }, [name]);
  
  if (!info) {
    return <span className="text-gray-500 text-sm">{name}</span>;
  }

  return (
    <button
      onClick={() => onSelect(info)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium transition-all",
        "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
        isHovered && "ring-2 ring-emerald-300"
      )}
    >
      <Info className="w-3 h-3" />
      {name}
    </button>
  );
}

// Sección colapsable
function CollapsibleSection({ 
  title, 
  icon, 
  children, 
  defaultOpen = true 
}: { 
  title: string; 
  icon: React.ReactNode;
  children: React.ReactNode; 
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 px-1 hover:bg-gray-50 -mx-1 px-1 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-gray-700">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {isOpen && <div className="pb-4">{children}</div>}
    </div>
  );
}

// Componente principal optimizado
export function ProductDetailModalV2({
  product,
  kb,
  onClose,
  onScrape,
  scrapeState
}: ProductDetailModalProps) {
  const [selectedIngredient, setSelectedIngredient] = useState<IngredientInfo | null>(null);
  const principios = (product.principios_activos || []) as string[];
  const sinergias = (product.sinergias_detectadas || []) as string[];
  const needsScrape = !product.nombre_comercial || !product.descripcion;

  // Memoizar handlers
  const handleCopySku = useCallback(() => {
    navigator.clipboard.writeText(product.sku);
  }, [product.sku]);

  const handleSelectIngredient = useCallback((info: IngredientInfo) => {
    setSelectedIngredient(info);
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedIngredient) {
          setSelectedIngredient(null);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, selectedIngredient]);

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={cn(
        "relative bg-white flex-1 md:flex-none md:absolute md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2",
        "md:w-full md:max-w-2xl md:max-h-[90vh] md:rounded-2xl md:shadow-2xl",
        "flex flex-col overflow-hidden",
        "animate-scale-in"
      )}>
        {/* Header */}
        <div className="shrink-0 p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Status badges */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {needsScrape ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 text-xs font-medium rounded-md">
                    <Info className="w-3 h-3" />
                    Info incompleta
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-md">
                    <CheckCircle2 className="w-3 h-3" />
                    Completo
                  </span>
                )}
                {product.cobertura_kb > 0 && (
                  <span className="px-2 py-0.5 bg-violet-50 text-violet-600 text-xs font-medium rounded-md">
                    KB {product.cobertura_kb}%
                  </span>
                )}
                {product.sinergias_detectadas && product.sinergias_detectadas.length > 0 && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-md">
                    {product.sinergias_detectadas.length} sinergias
                  </span>
                )}
              </div>
              
              <h2 className="text-lg font-semibold text-gray-900 line-clamp-2">
                {product.nombre_comercial || 'Sin nombre'}
              </h2>
              
              {/* SKU */}
              <button
                onClick={handleCopySku}
                className="mt-1 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
              >
                <Copy className="w-3 h-3" />
                SKU: {product.sku}
              </button>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              {/* Botón scrape */}
              <button
                onClick={() => onScrape(product.sku)}
                disabled={scrapeState === 'scraping'}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  scrapeState === 'scraping' 
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : needsScrape
                      ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                      : "bg-violet-50 text-violet-600 hover:bg-violet-100"
                )}
              >
                {scrapeState === 'scraping' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span className="hidden sm:inline">Buscando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{needsScrape ? 'Completar' : 'Actualizar'}</span>
                  </>
                )}
              </button>
              
              {/* Cerrar */}
              <button 
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Posología - EXTENDIDA por defecto */}
          {product.posologia && (
            <CollapsibleSection 
              title="Posología" 
              icon={<Calendar className="w-4 h-4 text-amber-500" />}
              defaultOpen={true}
            >
              <p className="text-sm text-gray-600 leading-relaxed bg-amber-50 -mx-1 px-1 py-2 rounded-lg">
                {product.posologia}
              </p>
            </CollapsibleSection>
          )}

          {/* Indicaciones - EXTENDIDA por defecto */}
          {product.indicaciones && product.indicaciones.length > 0 && (
            <CollapsibleSection 
              title="Indicaciones" 
              icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              defaultOpen={true}
            >
              <ul className="space-y-1.5">
                {product.indicaciones.slice(0, 8).map((ind: string, i: number) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    {ind}
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {/* Ingredientes - COLAPSADA por defecto */}
          {principios.length > 0 && (
            <CollapsibleSection 
              title={`Principios Activos (${principios.length})`}
              icon={<Pill className="w-4 h-4 text-emerald-500" />}
              defaultOpen={false}
            >
              <div className="flex flex-wrap gap-2">
                {principios.map((p, i) => (
                  <IngredientChip 
                    key={i} 
                    name={p} 
                    onSelect={handleSelectIngredient} 
                  />
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Descripción - COLAPSADA por defecto */}
          {product.descripcion && (
            <CollapsibleSection 
              title="Descripción" 
              icon={<Info className="w-4 h-4 text-blue-500" />}
              defaultOpen={false}
            >
              <p className="text-sm text-gray-600 leading-relaxed">
                {product.descripcion}
              </p>
            </CollapsibleSection>
          )}

          {/* Sinergias - COLAPSADA por defecto */}
          {sinergias.length > 0 && (
            <CollapsibleSection 
              title={`Sinergias (${sinergias.length})`}
              icon={<Link2 className="w-4 h-4 text-violet-500" />}
              defaultOpen={false}
            >
              <div className="flex flex-wrap gap-2">
                {sinergias.map((sin: string, i: number) => (
                  <span 
                    key={i} 
                    className="px-2.5 py-1 bg-violet-50 text-violet-700 text-xs font-medium rounded-full"
                  >
                    {sin}
                  </span>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Categoría */}
          {product.categoria_principal && (
            <div className="pt-2">
              <span className="text-xs text-gray-400">Categoría:</span>{' '}
              <span className="text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                {product.categoria_principal}
              </span>
            </div>
          )}
        </div>

        {/* Panel de ingrediente - aparece a la derecha */}
        {selectedIngredient && (
          <IngredientPanel 
            ingredient={selectedIngredient} 
            onClose={() => setSelectedIngredient(null)} 
          />
        )}
      </div>
    </div>
  );
}

interface ProductDetailModalProps {
  product: AnalyzedProduct;
  kb: Record<string, any>;
  onClose: () => void;
  onScrape: (sku: string) => void;
  scrapeState: 'idle' | 'scraping' | 'success' | 'error';
}

export default ProductDetailModalV2;
