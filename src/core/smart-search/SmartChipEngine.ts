/**
 * SmartChipEngine - Motor de Chips Inteligentes
 * 
 * Analiza la base de conocimiento y genera chips dinámicos
 * que se auto-clasifican por relevancia y contexto.
 * 
 * Características:
 * - Generación automática de chips desde la KB
 * - Clasificación semántica de ingredientes
 * - Chips contextuales basados en intención del usuario
 * - Actualización en tiempo real según búsqueda
 */

import { knowledgeLoader } from '../knowledge-base';
import { logger } from '../../services/LoggerService';

export interface SmartChip {
  id: string;
  label: string;
  icon: string;
  category: string;
  keywords: string[];         // Palabras clave asociadas
  intent: ChipIntent;        // Intención del usuario
  priority: number;          // Prioridad (0-100)
  count: number;            // Cantidad de ingredientes relacionados
  trending?: boolean;        // Si está en tendencia
}

export type ChipIntent = 
  | 'health_goal'      // Objetivos de salud (dormir, energía)
  | 'condition'        // Condiciones (ansiedad, inflamación)
  | 'category'         // Categorías (vitaminas, plantas)
  | 'symptom'          // Síntomas (dolor, fatiga)
  | 'action';          // Acciones (prevenir, mejorar)

// Intentos de búsqueda comunes con sus keywords
const INTENT_PATTERNS: Record<ChipIntent, { keywords: string[], label: string, icon: string }> = {
  health_goal: {
    keywords: ['dormir', 'sueño', 'energia', 'vitalidad', 'inmunidad', 'defensas', 'memoria', 'concentracion', 'relax', 'calma'],
    label: 'Objetivos',
    icon: '🎯'
  },
  condition: {
    keywords: ['ansiedad', 'estrés', 'depresión', 'inflamación', 'artritis', 'colesterol', 'presión', 'diabetes', 'insomnio'],
    label: 'Condiciones',
    icon: '🏥'
  },
  symptom: {
    keywords: ['dolor', 'fatiga', 'náusea', 'mareo', 'cefalea', 'espasmos', 'hinchazón', 'estreñimiento'],
    label: 'Síntomas',
    icon: '🤕'
  },
  category: {
    keywords: ['vitamina', 'mineral', 'planta', 'suplemento', 'remedio', 'aceite', 'probiótico', 'enzima'],
    label: 'Categorías',
    icon: '📦'
  },
  action: {
    keywords: ['prevenir', 'mejorar', 'tratar', 'reducir', 'aumentar', 'fortalecer', 'calmar', 'aliviar'],
    label: 'Acciones',
    icon: '⚡'
  }
};

// Chips predefinidos de alta prioridad (siempre visibles)
const PRIORITY_CHIPS: SmartChip[] = [
  { id: 'sleep', label: '😴 Dormir mejor', icon: '😴', category: 'health_goal', keywords: ['insomnio', 'sueño', 'dormir', 'melatonina', 'valeriana'], intent: 'health_goal', priority: 95, count: 0 },
  { id: 'anxiety', label: '🧘 Calmante', icon: '🧘', category: 'condition', keywords: ['ansiedad', 'estrés', 'nervios', 'relax', 'calma', 'pasiflora', 'ashwagandha'], intent: 'condition', priority: 93, count: 0 },
  { id: 'immunity', label: '🛡️ Inmunidad', icon: '🛡️', category: 'health_goal', keywords: ['inmunidad', 'defensas', 'resfriado', 'equinacea', 'vitamina c', 'zinc'], intent: 'health_goal', priority: 91, count: 0 },
  { id: 'energy', label: '⚡ Energía', icon: '⚡', category: 'health_goal', keywords: ['energía', 'fatiga', 'cansancio', 'vitaminas b', 'coq10'], intent: 'health_goal', priority: 90, count: 0 },
  { id: 'joints', label: '🦴 Articulaciones', icon: '🦴', category: 'condition', keywords: ['articulaciones', 'dolor articular', 'colágeno', 'glucosamina', 'artritis'], intent: 'condition', priority: 88, count: 0 },
  { id: 'digestion', label: '🌿 Digestión', icon: '🌿', category: 'health_goal', keywords: ['digestión', 'estómago', 'flora', 'probióticos', 'enzimas'], intent: 'health_goal', priority: 87, count: 0 },
  { id: 'memory', label: '🧠 Memoria', icon: '🧠', category: 'health_goal', keywords: ['memoria', 'concentración', 'cognición', 'ginkgo', 'omega 3'], intent: 'health_goal', priority: 85, count: 0 },
  { id: 'stress', label: '💆 Estrés', icon: '💆', category: 'condition', keywords: ['estrés', 'nervios', 'tensión', 'mg', 'gaba'], intent: 'condition', priority: 84, count: 0 },
];

class SmartChipEngine {
  private static instance: SmartChipEngine;
  private chips: SmartChip[] = [];
  private isInitialized: boolean = false;
  private searchHistory: Map<string, number> = new Map();

  static getInstance(): SmartChipEngine {
    if (!SmartChipEngine.instance) {
      SmartChipEngine.instance = new SmartChipEngine();
    }
    return SmartChipEngine.instance;
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      await knowledgeLoader.load();
      await this.generateChipsFromKB();
      this.isInitialized = true;
      logger.success('SmartChipEngine inicializado', 'SmartChips');
    } catch (error) {
      logger.error('Error inicializando SmartChipEngine', 'SmartChips', error);
    }
  }

  /**
   * Genera chips automáticamente desde la base de conocimiento
   */
  private async generateChipsFromKB(): Promise<void> {
    const allIngredients = knowledgeLoader.getAll();
    
    // Contar ingredientes por categoría
    const categoryCounts = new Map<string, number>();
    const keywordCounts = new Map<string, number>();

    for (const ing of allIngredients) {
      // Contar por categoría
      const cat = ing.categoria || 'otro';
      categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);

      // Contar keywords de indicaciones
      for (const indication of ing.indicaciones || []) {
        keywordCounts.set(indication.toLowerCase(), (keywordCounts.get(indication.toLowerCase()) || 0) + 1);
      }

      // Contar por sistemas corporales
      for (const system of ing.sistemas || []) {
        keywordCounts.set(system.toLowerCase(), (keywordCounts.get(system.toLowerCase()) || 0) + 1);
      }
    }

    // Generar chips dinámicos basados en la KB
    const dynamicChips: SmartChip[] = [];

    // Chips de categorías
    const categoryEmojis: Record<string, string> = {
      fitoterapia: '🌿',
      homeopatia: '🏠',
      vitaminas: '💊',
      minerales: '💎',
      aminoacidos: '⚡',
      probioticos: '🦠',
      prebioticos: '🌱',
      enzimas: '🔬',
      aceite_esencial: '🌸',
    };

    for (const [cat, count] of categoryCounts) {
      if (cat === 'otro') continue;
      
      dynamicChips.push({
        id: `cat_${cat}`,
        label: `${categoryEmojis[cat] || '📦'} ${this.formatCategoryName(cat)}`,
        icon: categoryEmojis[cat] || '📦',
        category: cat,
        keywords: [cat, this.formatCategoryName(cat)],
        intent: 'category',
        priority: Math.min(80, 50 + count),
        count
      });
    }

    // Combinar con chips de prioridad y ordenar por prioridad
    this.chips = [...PRIORITY_CHIPS, ...dynamicChips]
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Formatea el nombre de categoría para display
   */
  private formatCategoryName(cat: string): string {
    const names: Record<string, string> = {
      fitoterapia: 'Fitoterapia',
      homeopatia: 'Homeopatía',
      vitaminas: 'Vitaminas',
      minerales: 'Minerales',
      aminoacidos: 'Aminoácidos',
      probioticos: 'Probióticos',
      prebioticos: 'Prebióticos',
      enzimas: 'Enzimas',
      aceite_esencial: 'Aceites Esenciales',
    };
    return names[cat] || cat.charAt(0).toUpperCase() + cat.slice(1);
  }

  /**
   * Obtiene chips para mostrar basados en el contexto
   */
  getChips(context?: { query?: string, limit?: number }): SmartChip[] {
    const limit = context?.limit || 12;
    
    if (!context?.query) {
      // Sin query: devolver chips de mayor prioridad
      return this.chips.slice(0, limit);
    }

    // Con query: filtrar y reordenar por relevancia
    const query = context.query.toLowerCase();
    return this.getChipsForQuery(query).slice(0, limit);
  }

  /**
   * Obtiene chips relevantes para una query específica
   */
  getChipsForQuery(query: string): SmartChip[] {
    const queryWords = query.split(/\s+/);
    
    // Calcular puntuación de relevancia para cada chip
    const scored = this.chips.map(chip => {
      let score = chip.priority;
      
      // Bonus si las palabras de la query coinciden con keywords del chip
      for (const word of queryWords) {
        if (chip.keywords.some(kw => kw.toLowerCase().includes(word))) {
          score += 20;
        }
        if (chip.label.toLowerCase().includes(word)) {
          score += 30;
        }
      }
      
      // Bonus por historial de búsqueda
      const historyScore = this.searchHistory.get(chip.id) || 0;
      score += historyScore * 5;
      
      return { chip, score };
    });

    // Ordenar por puntuación y devolver chips únicos
    const seen = new Set<string>();
    return scored
      .sort((a, b) => b.score - a.score)
      .map(s => s.chip)
      .filter(chip => {
        if (seen.has(chip.id)) return false;
        seen.add(chip.id);
        return true;
      });
  }

  /**
   * Registra una búsqueda para mejorar sugerencias futuras
   */
  registerSearch(query: string): void {
    const words = query.toLowerCase().split(/\s+/);
    
    // Incrementar contador para chips relacionados
    for (const chip of this.chips) {
      for (const word of words) {
        if (chip.keywords.some(kw => kw.toLowerCase().includes(word))) {
          const current = this.searchHistory.get(chip.id) || 0;
          this.searchHistory.set(chip.id, current + 1);
        }
      }
    }
  }

  /**
   * Obtiene sugerencias de chips basadas en intención detectada
   */
  detectIntentAndSuggest(query: string): SmartChip[] {
    const queryLower = query.toLowerCase();
    
    // Detectar intención dominante
    let dominantIntent: ChipIntent | null = null;
    let maxMatches = 0;

    for (const [intent, pattern] of Object.entries(INTENT_PATTERNS)) {
      const matches = pattern.keywords.filter(kw => queryLower.includes(kw)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        dominantIntent = intent as ChipIntent;
      }
    }

    // Si hay intención clara, priorizar chips de ese tipo
    if (dominantIntent) {
      return this.chips
        .filter(c => c.intent === dominantIntent)
        .slice(0, 6);
    }

    // Sinonimia inteligente
    const synonyms: Record<string, string[]> = {
      'dormir': ['sueño', 'insomnio', 'descanso', 'noche'],
      'cansancio': ['fatiga', 'energia', 'agotamiento'],
      'nervios': ['ansiedad', 'estrés', 'preocupación'],
      'intestino': ['digestión', 'flora', 'estómago'],
      'cabeza': ['cefalea', 'migraña', 'dolor de cabeza'],
    };

    // Expandir query con sinónimos
    const expandedWords = new Set<string>(queryLower.split(/\s+/));
    for (const [word, syns] of Object.entries(synonyms)) {
      if (queryLower.includes(word)) {
        syns.forEach(s => expandedWords.add(s));
      }
    }

    // Buscar chips que coincidan con palabras expandidas
    return this.chips.filter(chip => 
      chip.keywords.some(kw => 
        Array.from(expandedWords).some(w => kw.toLowerCase().includes(w))
      )
    ).slice(0, 8);
  }

  /**
   * Sugiere el siguiente chip basado en el actual
   */
  suggestNextChip(currentChipId?: string): SmartChip | null {
    if (!currentChipId) {
      // Sugerir el chip más popular
      const popular = this.chips
        .filter(c => this.searchHistory.get(c.id))
        .sort((a, b) => (this.searchHistory.get(b.id) || 0) - (this.searchHistory.get(a.id) || 0));
      return popular[0] || this.chips[0] || null;
    }

    // Sugerir chips de la misma categoría pero diferente
    const current = this.chips.find(c => c.id === currentChipId);
    if (!current) return null;

    return this.chips
      .filter(c => c.category === current.category && c.id !== currentChipId)
      [0] || null;
  }

  /**
   * Obtiene todos los chips (para debugging)
   */
  getAllChips(): SmartChip[] {
    return this.chips;
  }

  /**
   * Stats del motor
   */
  getStats() {
    return {
      totalChips: this.chips.length,
      isInitialized: this.isInitialized,
      categories: [...new Set(this.chips.map(c => c.category))].length,
      intents: [...new Set(this.chips.map(c => c.intent))].length,
    };
  }
}

export const smartChipEngine = SmartChipEngine.getInstance();
