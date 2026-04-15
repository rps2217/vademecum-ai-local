import React, { useMemo } from 'react';

interface HighlightTextProps {
  text: string;
  searchTerm: string;
}

const stopWords = new Set(['de', 'la', 'el', 'en', 'y', 'o', 'a', 'las', 'los', 'con', 'por', 'para', 'un', 'una']);

export const HighlightText: React.FC<HighlightTextProps> = React.memo(({ text, searchTerm }) => {
  const parts = useMemo(() => {
    if (!searchTerm || !text) return [{ text, isMatch: false }];

    const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const normalizedText = normalize(text);
    const normalizedSearch = normalize(searchTerm);

    // Find all matches
    const matches: { start: number, end: number }[] = [];
    
    // 1. Intentar coincidencia exacta de frase
    let pos = normalizedText.indexOf(normalizedSearch);
    while (pos !== -1) {
      matches.push({ start: pos, end: pos + normalizedSearch.length });
      pos = normalizedText.indexOf(normalizedSearch, pos + normalizedSearch.length);
    }

    // 2. Si no hay coincidencia de frase, intentar por palabras
    if (matches.length === 0) {
      const searchTerms = normalizedSearch.split(/\s+/).filter(t => t.length > 0 && !stopWords.has(t));
      for (const term of searchTerms) {
        let termPos = normalizedText.indexOf(term);
        while (termPos !== -1) {
          matches.push({ start: termPos, end: termPos + term.length });
          termPos = normalizedText.indexOf(term, termPos + term.length);
        }
      }
    }

    if (matches.length === 0) return [{ text, isMatch: false }];

    // Ordenar matches y fusionar solapamientos
    matches.sort((a, b) => a.start - b.start);
    const mergedMatches: { start: number, end: number }[] = [];
    for (const match of matches) {
      if (mergedMatches.length > 0 && match.start < mergedMatches[mergedMatches.length - 1].end) {
        mergedMatches[mergedMatches.length - 1].end = Math.max(mergedMatches[mergedMatches.length - 1].end, match.end);
      } else {
        mergedMatches.push(match);
      }
    }

    // Construir partes
    const parts: { text: string, isMatch: boolean }[] = [];
    let lastEnd = 0;
    for (const match of mergedMatches) {
      if (match.start > lastEnd) {
        parts.push({ text: text.slice(lastEnd, match.start), isMatch: false });
      }
      parts.push({ text: text.slice(match.start, match.end), isMatch: true });
      lastEnd = match.end;
    }
    if (lastEnd < text.length) {
      parts.push({ text: text.slice(lastEnd), isMatch: false });
    }

    return parts;
  }, [text, searchTerm]);

  if (!searchTerm || !text) return <>{text}</>;

  return (
    <>
      {parts.map((part, i) => 
        part.isMatch ? (
          <mark 
            key={i} 
            className="bg-yellow-300 text-black px-0.5 rounded-sm font-bold animate-pulse"
            style={{ backgroundColor: '#ffff00' }}
          >
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </>
  );
});

HighlightText.displayName = 'HighlightText';
