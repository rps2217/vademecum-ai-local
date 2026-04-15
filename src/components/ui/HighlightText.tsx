import React from 'react';

interface HighlightTextProps {
  text: string;
  searchTerm: string;
}

const stopWords = new Set(['de', 'la', 'el', 'en', 'y', 'o', 'a', 'las', 'los', 'con', 'por', 'para', 'un', 'una']);

export const HighlightText: React.FC<HighlightTextProps> = ({ text, searchTerm }) => {
  if (!searchTerm || !text) return <>{text}</>;

  // Normalizar para encontrar coincidencias sin tildes
  const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  
  const normalizedSearch = normalize(searchTerm);
  
  // Intentar coincidencia exacta de frase primero
  const escapedPhrase = normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const phraseRegex = new RegExp(`(\\b${escapedPhrase}\\b)`, 'gi');
  
  if (phraseRegex.test(normalize(text))) {
    const parts = text.split(new RegExp(`(${escapedPhrase})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => {
          const isMatch = normalize(part) === normalizedSearch;
          return isMatch ? (
            <mark 
              key={i} 
              className="bg-yellow-300 text-black px-0.5 rounded-sm font-bold animate-pulse"
              style={{ backgroundColor: '#ffff00' }}
            >
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          );
        })}
      </>
    );
  }

  // Si no hay coincidencia de frase exacta, dividir en palabras ignorando stop words
  const searchTerms = normalizedSearch.split(/\s+/).filter(t => t.length > 0 && !stopWords.has(t));
  
  if (searchTerms.length === 0) return <>{text}</>;

  const escapedTerms = searchTerms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(\\b${escapedTerms.join('\\b|\\b')}\\b)`, 'gi');

  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        const isMatch = normalize(part) && searchTerms.some(term => normalize(part) === term);
        
        return isMatch ? (
          <mark 
            key={i} 
            className="bg-yellow-300 text-black px-0.5 rounded-sm font-bold animate-pulse"
            style={{ backgroundColor: '#ffff00' }}
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </>
  );
};
