import React, { useMemo } from 'react';

interface HighlightTextProps {
  text: string;
  searchTerm: string;
}

const stopWords = new Set(['de', 'la', 'el', 'en', 'y', 'o', 'a', 'las', 'los', 'con', 'por', 'para', 'un', 'una']);

export const HighlightText: React.FC<HighlightTextProps> = React.memo(({ text, searchTerm }) => {
  const parts = useMemo(() => {
    if (!searchTerm || !text) return [{ text, isMatch: false }];

    // Normalizar para encontrar coincidencias sin tildes
    const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    
    const normalizedSearch = normalize(searchTerm);
    
    // Intentar coincidencia exacta de frase primero
    const escapedPhrase = normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const phraseRegex = new RegExp(`(\\b${escapedPhrase}\\b)`, 'gi');
    
    if (phraseRegex.test(normalize(text))) {
      const splitParts = text.split(new RegExp(`(${escapedPhrase})`, 'gi'));
      return splitParts.map(part => ({
        text: part,
        isMatch: normalize(part) === normalizedSearch
      }));
    }

    // Si no hay coincidencia de frase exacta, dividir en palabras ignorando stop words
    const searchTerms = normalizedSearch.split(/\s+/).filter(t => t.length > 0 && !stopWords.has(t));
    
    if (searchTerms.length === 0) return [{ text, isMatch: false }];

    const escapedTerms = searchTerms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(\\b${escapedTerms.join('\\b|\\b')}\\b)`, 'gi');

    const splitParts = text.split(regex);
    return splitParts.map(part => ({
      text: part,
      isMatch: normalize(part) && searchTerms.some(term => normalize(part) === term)
    }));
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
