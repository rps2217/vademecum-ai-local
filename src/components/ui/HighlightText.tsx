import React from 'react';

interface HighlightTextProps {
  text: string;
  searchTerm: string;
}

export const HighlightText: React.FC<HighlightTextProps> = ({ text, searchTerm }) => {
  if (!searchTerm || !text) return <>{text}</>;

  // Normalizar para encontrar coincidencias sin tildes
  const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  
  const normalizedText = normalize(text);
  const normalizedSearch = normalize(searchTerm);
  
  // Dividir el término de búsqueda en palabras individuales
  const searchTerms = normalizedSearch.split(/\s+/).filter(t => t.length > 0);
  
  if (searchTerms.length === 0) return <>{text}</>;

  // Crear una expresión regular que coincida con cualquiera de los términos
  // Usamos límites de palabra \b para coincidir con palabras completas como pidió el usuario
  const escapedTerms = searchTerms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(\\b${escapedTerms.join('\\b|\\b')}\\b)`, 'gi');

  // Dividir el texto original usando la expresión regular (manteniendo los separadores)
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        const isMatch = normalize(part) && searchTerms.some(term => normalize(part) === term);
        
        return isMatch ? (
          <mark 
            key={i} 
            className="bg-yellow-300 text-black px-0.5 rounded-sm font-bold animate-pulse"
            style={{ backgroundColor: '#ffff00' }} // Amarillo fluorescente
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
