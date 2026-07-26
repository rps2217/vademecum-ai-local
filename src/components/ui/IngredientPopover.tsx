/**
 * IngredientPopover - Popover para mostrar información detallada de ingredientes
 * Inspirado en appsimple: simple, rápido, visual
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, ChevronDown, ChevronUp, AlertTriangle, 
  Info, Pill, Leaf, Beaker, Sparkles, CheckCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { findIngredient, type IngredientInfo } from '../../core/ingredient-database/ingredients';

interface IngredientPopoverProps {
  ingredientName: string;
  children: React.ReactNode;
  className?: string;
}

export function IngredientPopover({ ingredientName, children, className }: IngredientPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [info, setInfo] = useState<IngredientInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  // Buscar información del ingrediente
  useEffect(() => {
    if (isOpen && !info) {
      setLoading(true);
      // Simular pequeño delay para efecto visual
      setTimeout(() => {
        const found = findIngredient(ingredientName);
        setInfo(found);
        setLoading(false);
      }, 100);
    }
  }, [isOpen, ingredientName, info]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'homeopatia':
        return <Beaker className="w-4 h-4" />;
      case 'fitoterapia':
        return <Leaf className="w-4 h-4" />;
      case 'suplemento':
        return <Pill className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'homeopatia':
        return 'bg-violet-100 text-violet-700 border-violet-200';
      case 'fitoterapia':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'suplemento':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <>
      {/* Trigger */}
      <span 
        ref={triggerRef}
        className={cn(
          "inline-flex items-center gap-0.5 cursor-pointer group",
          className
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {children}
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
          <Info className="w-2.5 h-2.5" />
        </span>
      </span>

      {/* Popover */}
      {isOpen && (
        <div 
          ref={popoverRef}
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
          onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          
          {/* Content */}
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  info ? getCategoryColor(info.category) : "bg-gray-100"
                )}>
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin" />
                  ) : info ? (
                    getCategoryIcon(info.category)
                  ) : (
                    <AlertTriangle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {loading ? 'Buscando...' : info?.name || ingredientName}
                  </h3>
                  {info?.scientificName && (
                    <p className="text-xs text-gray-500 italic">{info.scientificName}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {loading ? (
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
                </div>
              ) : info ? (
                <div className="space-y-4">
                  {/* Descripción */}
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {info.description}
                  </p>

                  {/* Origen */}
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <Info className="w-3.5 h-3.5" />
                      Origen
                    </div>
                    <p className="text-sm text-gray-700">
                      {info.origin.type === 'planta' && '🌿 '}
                      {info.origin.type === 'mineral' && '💎 '}
                      {info.origin.type === 'animal' && '🦋 '}
                      {info.origin.type === 'sintetico' && '⚗️ '}
                      {info.origin.type === 'microorganismo' && '🦠 '}
                      {info.origin.description}
                    </p>
                  </div>

                  {/* Mecanismo de acción */}
                  <div>
                    <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 mb-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      ¿Cómo funciona?
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {info.mechanism}
                    </p>
                  </div>

                  {/* Usos principales */}
                  {info.indications.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 text-xs font-medium text-violet-600 mb-2">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Usos principales
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {info.indications.slice(0, 6).map((ind, i) => (
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
                  {info.contraindications.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 text-xs font-medium text-red-600 mb-2">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Contraindicaciones
                      </div>
                      <div className="space-y-1">
                        {info.contraindications.map((contra, i) => (
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
                      {info.dosage}
                    </p>
                  </div>

                  {/* Interacciones */}
                  {info.interactions.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 text-xs font-medium text-orange-600 mb-2">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Interacciones
                      </div>
                      <div className="space-y-1">
                        {info.interactions.map((inter, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-orange-400 mt-1">⚠️</span>
                            {inter}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-gray-300" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Sin información disponible
                  </h4>
                  <p className="text-sm text-gray-500">
                    No tenemos datos sobre "{ingredientName}" en nuestra base de conocimiento.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                Base de conocimiento local
              </span>
              {info && (
                <span className={cn(
                  "px-2 py-1 rounded-full text-[10px] font-medium",
                  getCategoryColor(info.category)
                )}>
                  {info.category}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Componente para hacer clicable un texto que contiene ingredientes
export function IngredientText({ 
  text, 
  className,
  onIngredientClick 
}: { 
  text: string; 
  className?: string;
  onIngredientClick?: (name: string) => void;
}) {
  // Palabras que podrían ser ingredientes
  const ingredientKeywords = [
    'china', 'arnica', 'belladonna', 'nux vomica', 'rhythm', 'phosphorus', 'sulfur', 'sepia',
    'curcuma', 'jengibre', 'ginseng', 'valeriana', 'ashwagandha', 'ginkgo', 'echinacea',
    'reishi', 'cordyceps', 'shiitake', 'maitake',
    'gaba', 'nac', 'glicina', '5-htp', 'teanina',
    'colageno', 'vitamina', 'zinc', 'magnesio', 'selenio',
    'coq10', 'resveratrol', 'astaxantina',
    'lactobacillus', 'bifidobacterium', 'probiotico',
  ];

  // Encontrar ingredientes en el texto
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const lowerText = text.toLowerCase();

  // Buscar todas las coincidencias
  const matches: Array<{ start: number; end: number; word: string }> = [];
  
  ingredientKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      // Verificar que no se superponga
      const overlaps = matches.some(m => 
        (match!.index >= m.start && match!.index < m.end) ||
        (match!.index + match![0].length > m.start && match!.index < m.start)
      );
      if (!overlaps) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          word: match[0]
        });
      }
    }
  });

  // Ordenar por posición
  matches.sort((a, b) => a.start - b.start);

  // Crear partes del texto
  matches.forEach((m, i) => {
    if (m.start > lastIndex) {
      parts.push(
        <span key={`text-${i}`}>{text.slice(lastIndex, m.start)}</span>
      );
    }
    
    parts.push(
      <IngredientPopover 
        key={`ing-${i}`} 
        ingredientName={m.word}
      >
        <span className="bg-emerald-100 text-emerald-800 px-1 rounded font-medium hover:bg-emerald-200 transition-colors cursor-pointer">
          {text.slice(m.start, m.end)}
        </span>
      </IngredientPopover>
    );
    
    lastIndex = m.end;
  });

  // Texto restante
  if (lastIndex < text.length) {
    parts.push(
      <span key="text-end">{text.slice(lastIndex)}</span>
    );
  }

  return <span className={className}>{parts.length > 0 ? parts : text}</span>;
}

export default IngredientPopover;
