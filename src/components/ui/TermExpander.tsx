/**
 * TermExpander - Componente para expandir términos técnicos
 * Muestra explicaciones simples de términos médicos
 */

import React, { useState, useMemo } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { glossaryService, type FoundTerm } from '../../core/glossary';

interface TermExpanderProps {
  text: string;
  className?: string;
  showToggle?: boolean;
  defaultExpanded?: boolean;
  variant?: 'inline' | 'card' | 'list';
  maxTerms?: number;
}

export function TermExpander({
  text,
  className,
  showToggle = true,
  defaultExpanded = false,
  variant = 'inline',
  maxTerms = 10,
}: TermExpanderProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [mode, setMode] = useState<'simple' | 'expanded'>(
    defaultExpanded ? 'expanded' : 'simple'
  );

  // Procesar texto y encontrar términos
  const { displayText, terms, termCount } = useMemo(() => {
    if (!text) return { displayText: '', terms: [], termCount: 0 };

    const result = glossaryService.expandTerms(text);
    return {
      displayText: result.text,
      terms: result.termsFound.slice(0, maxTerms),
      termCount: result.expandedCount,
    };
  }, [text, maxTerms]);

  // Si no hay términos, mostrar texto normal
  if (termCount === 0) {
    return <span className={className}>{text}</span>;
  }

  // Variante inline
  if (variant === 'inline') {
    return (
      <span className={cn("relative", className)}>
        <span className={mode === 'expanded' ? '' : 'sr-only'}>
          {displayText}
        </span>
        <span className={mode === 'simple' ? '' : 'sr-only'}>
          {text}
        </span>
        
        {showToggle && (
          <button
            onClick={() => setMode(m => m === 'simple' ? 'expanded' : 'simple')}
            className={cn(
              "ml-1.5 inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded transition-colors",
              mode === 'expanded'
                ? "bg-violet-100 text-violet-600 hover:bg-violet-200"
                : "bg-amber-100 text-amber-600 hover:bg-amber-200"
            )}
            title={mode === 'expanded' ? 'Ocultar explicaciones' : 'Ver explicaciones'}
          >
            <BookOpen className="w-3 h-3" />
            <span>{termCount}</span>
            {mode === 'expanded' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </span>
    );
  }

  // Variante card
  if (variant === 'card') {
    return (
      <div className={cn("bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100", className)}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <span className="text-sm font-semibold text-amber-900">
                {termCount} término{termCount !== 1 ? 's' : ''} técnico{termCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          
          {showToggle && (
            <button
              onClick={() => setMode(m => m === 'simple' ? 'expanded' : 'simple')}
              className="text-xs text-amber-600 hover:text-amber-700 font-medium"
            >
              {mode === 'expanded' ? 'Simplificar' : 'Explicar'}
            </button>
          )}
        </div>

        <div className={mode === 'expanded' ? '' : 'sr-only'}>
          <div className="text-sm text-gray-700 leading-relaxed mb-3">
            {displayText}
          </div>
        </div>

        <div className={mode === 'simple' ? '' : 'sr-only'}>
          <div className="text-sm text-gray-600 leading-relaxed mb-3">
            {text}
          </div>
        </div>

        {/* Lista de términos */}
        {mode === 'expanded' && terms.length > 0 && (
          <div className="border-t border-amber-200 pt-3 mt-3">
            <div className="flex flex-wrap gap-2">
              {terms.map((term, i) => (
                <div
                  key={i}
                  className="inline-flex items-center gap-1.5 px-2 py-1 bg-white rounded-lg text-xs border border-amber-200"
                >
                  <span className="font-medium text-amber-800 capitalize">
                    {term.original}
                  </span>
                  <span className="text-gray-400">=</span>
                  <span className="text-gray-600">
                    {term.expansion}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Variante list
  if (variant === 'list') {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-medium text-gray-700">
            {termCount} término{termCount !== 1 ? 's' : ''} encontrado{termCount !== 1 ? 's' : ''}
          </span>
          {showToggle && (
            <button
              onClick={() => setMode(m => m === 'simple' ? 'expanded' : 'simple')}
              className="ml-auto text-xs text-violet-600 hover:text-violet-700"
            >
              {mode === 'expanded' ? 'Ocultar' : 'Mostrar'}
            </button>
          )}
        </div>

        {mode === 'expanded' && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
            {terms.map((term, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="font-medium text-violet-700 capitalize min-w-[120px]">
                  {term.original}
                </span>
                <span className="text-gray-500">→</span>
                <span className="text-gray-700">{term.expansion}</span>
                <span className="ml-auto text-[10px] text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">
                  {term.category}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return <span className={className}>{text}</span>;
}

// Componente para resaltar términos sin expandir
export function TermHighlight({
  text,
  className,
  highlightAll = true,
}: {
  text: string;
  className?: string;
  highlightAll?: boolean;
}) {
  const terms = useMemo(() => glossaryService.findTerms(text), [text]);

  if (terms.length === 0) {
    return <span className={className}>{text}</span>;
  }

  if (highlightAll) {
    // Crear partes del texto con términos resaltados
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    const sortedTerms = [...terms].sort((a, b) => a.index - b.index);

    sortedTerms.forEach((term, i) => {
      // Texto antes del término
      if (term.index > lastIndex) {
        parts.push(
          <span key={`text-${i}`}>{text.slice(lastIndex, term.index)}</span>
        );
      }

      // Término resaltado
      parts.push(
        <span
          key={`term-${i}`}
          className="bg-amber-100 text-amber-800 px-0.5 rounded font-medium"
          title={term.expansion}
        >
          {text.slice(term.index, term.index + term.original.length)}
        </span>
      );

      lastIndex = term.index + term.original.length;
    });

    // Texto después del último término
    if (lastIndex < text.length) {
      parts.push(<span key="text-end">{text.slice(lastIndex)}</span>);
    }

    return (
      <span className={cn("", className)}>
        {parts}
      </span>
    );
  }

  return <span className={className}>{text}</span>;
}

export default TermExpander;
