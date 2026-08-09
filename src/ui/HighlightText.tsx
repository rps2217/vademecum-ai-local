/**
 * HighlightText — resalta términos dentro de un texto con destacador amarillo.
 *
 * Usado en IngredientDetail para que el farmacéutico vea de un vistazo
 * qué partes de propiedades y mecanismo se relacionan con el chip seleccionado.
 *
 * El resaltado es case-insensitive e insensitive a acentos.
 */

import { useMemo } from 'react';

interface Props {
  text: string;
  terms: string[];
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function HighlightText({ text, terms }: Props) {
  const parts = useMemo(() => {
    if (!terms.length || !text) return [{ text, highlight: false } as const];

    // Normalizar términos: quitar acentos para matching insensible
    const normalized = terms
      .filter(t => t && t.trim().length >= 3)
      .map(t => t.trim());

    if (!normalized.length) return [{ text, highlight: false } as const];

    // Construir regex combinando todos los términos, case-insensitive
    const pattern = normalized.map(escapeRegExp).join('|');
    const regex = new RegExp(`(${pattern})`, 'giu');

    const result: { text: string; highlight: boolean }[] = [];
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        result.push({ text: text.slice(lastIdx, match.index), highlight: false });
      }
      result.push({ text: match[0], highlight: true });
      lastIdx = match.index + match[0].length;
      // Evitar loop infinito en matches de longitud 0
      if (match[0].length === 0) regex.lastIndex++;
    }

    if (lastIdx < text.length) {
      result.push({ text: text.slice(lastIdx), highlight: false });
    }

    return result;
  }, [text, terms]);

  if (!terms.length) return <>{text}</>;

  return (
    <>
      {parts.map((part, i) =>
        part.highlight ? (
          <mark
            key={i}
            className="bg-yellow-200/80 dark:bg-yellow-500/30 text-inherit rounded px-0.5 font-medium"
          >
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </>
  );
}
