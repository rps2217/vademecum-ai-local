/**
 * GlossaryService - Servicio para expandir términos técnicos
 */

import { MEDICAL_GLOSSARY, type MedicalGlossary } from './medical-terms';

export interface ExpansionResult {
  text: string;                    // Texto con términos expandidos
  termsFound: FoundTerm[];         // Términos encontrados
  expandedCount: number;           // Cantidad de términos expandidos
}

export interface FoundTerm {
  original: string;                // Término original
  expansion: string;               // Explicación
  category: string;                // Categoría médica
  index: number;                   // Posición en el texto
}

class GlossaryService {
  private glossary: MedicalGlossary;
  private termPatterns: Map<string, RegExp>;

  constructor() {
    this.glossary = MEDICAL_GLOSSARY;
    this.termPatterns = new Map();
    this.initializePatterns();
  }

  /**
   * Inicializar patrones regex para términos
   */
  private initializePatterns(): void {
    // Ordenar por longitud (mayor primero) para evitar reemplazos parciales
    const terms = Object.keys(this.glossary)
      .sort((a, b) => b.length - a.length);

    for (const term of terms) {
      // Crear patrón que matchea la palabra completa
      const pattern = new RegExp(`\\b${this.escapeRegex(term)}\\b`, 'gi');
      this.termPatterns.set(term, pattern);
    }
  }

  /**
   * Escapar caracteres especiales para regex
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Expandir términos técnicos en un texto
   * Retorna el texto con explicaciones entre paréntesis
   */
  expandTerms(text: string): ExpansionResult {
    if (!text) {
      return { text: '', termsFound: [], expandedCount: 0 };
    }

    const termsFound: FoundTerm[] = [];
    let expandedText = text;

    // Buscar todos los términos en orden de longitud (evitar parciales)
    const sortedTerms = Object.keys(this.glossary)
      .sort((a, b) => b.length - a.length);

    for (const term of sortedTerms) {
      const pattern = this.termPatterns.get(term);
      if (!pattern) continue;

      const regex = new RegExp(pattern.source, 'gi');
      const matches = text.matchAll(regex);
      
      for (const match of matches) {
        const original = match[0];
        const { term: expansion, category } = this.glossary[term];
        
        termsFound.push({
          original: original.toLowerCase(),
          expansion,
          category,
          index: match.index || 0,
        });

        // Reemplazar en el texto expandido
        const expansionPattern = new RegExp(`\\b${this.escapeRegex(match[0])}\\b`, 'gi');
        expandedText = expandedText.replace(
          expansionPattern,
          `${original} (${expansion})`
        );
      }
    }

    // Eliminar duplicados de términos encontrados
    const uniqueTerms = this.deduplicateTerms(termsFound);

    return {
      text: expandedText,
      termsFound: uniqueTerms,
      expandedCount: uniqueTerms.length,
    };
  }

  /**
   * Eliminar términos duplicados (misma palabra en diferente caso)
   */
  private deduplicateTerms(terms: FoundTerm[]): FoundTerm[] {
    const seen = new Set<string>();
    return terms.filter(term => {
      const key = term.original.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Detectar términos en un texto sin expandir
   */
  findTerms(text: string): FoundTerm[] {
    if (!text) return [];

    const found: FoundTerm[] = [];
    const sortedTerms = Object.keys(this.glossary)
      .sort((a, b) => b.length - a.length);

    for (const term of sortedTerms) {
      const pattern = this.termPatterns.get(term);
      if (!pattern) continue;

      if (pattern.test(text)) {
        const { term: expansion, category } = this.glossary[term];
        found.push({
          original: term,
          expansion,
          category,
          index: text.search(pattern),
        });
      }
    }

    return this.deduplicateTerms(found);
  }

  /**
   * Verificar si un texto contiene términos del glosario
   */
  hasTerms(text: string): boolean {
    return this.findTerms(text).length > 0;
  }

  /**
   * Obtener el conteo de términos en un texto
   */
  countTerms(text: string): number {
    return this.findTerms(text).length;
  }

  /**
   * Obtener categorías presentes en un texto
   */
  getCategoriesInText(text: string): string[] {
    const terms = this.findTerms(text);
    const categories = new Set<string>();
    terms.forEach(t => categories.add(t.category));
    return Array.from(categories);
  }

  /**
   * Buscar término por nombre
   */
  getDefinition(term: string): { term: string; expansion: string; category: string } | null {
    const lowerTerm = term.toLowerCase();
    
    if (this.glossary[lowerTerm]) {
      const def = this.glossary[lowerTerm];
      return { term: lowerTerm, expansion: def.term, category: def.category };
    }

    // Buscar por sinonismo
    for (const [key, value] of Object.entries(this.glossary)) {
      if (value.synonyms?.some(s => s.toLowerCase() === lowerTerm)) {
        return { term: key, expansion: value.term, category: value.category };
      }
    }

    return null;
  }

  /**
   * Verificar disponibilidad
   */
  isAvailable(): boolean {
    return Object.keys(this.glossary).length > 0;
  }

  /**
   * Obtener estadísticas del glosario
   */
  getStats(): { totalTerms: number; totalCategories: number; categories: string[] } {
    const categories = new Set<string>();
    Object.values(this.glossary).forEach(t => categories.add(t.category));

    return {
      totalTerms: Object.keys(this.glossary).length,
      totalCategories: categories.size,
      categories: Array.from(categories).sort(),
    };
  }
}

// Instancia singleton
export const glossaryService = new GlossaryService();

export default glossaryService;
