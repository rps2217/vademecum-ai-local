/**
 * SuggestionEngine - Motor de Sugerencias IA
 * 
 * Proporciona sugerencias contextuales e inteligentes basadas en:
 * - Historial de búsquedas del usuario
 * - Contexto actual (búsqueda activa, síntomas detectados)
 * - Patrones de uso comunes
 * - Sinergias y relaciones entre ingredientes
 */

import { knowledgeLoader } from '../knowledge-base';
import { synergyEngineV2 } from '../synergy/SynergyEngineV2';
import { embeddingService } from '../semantic-search/embedding-service';
import { logger } from '../../services/LoggerService';

// Tipos de sugerencias
export type SuggestionType = 
  | 'complementary'    
  | 'synergy'         
  | 'alternative'      
  | 'symptom_relief'  
  | 'prevention'       
  | 'educational';

export interface Suggestion {
  id: string;
  type: SuggestionType;
  title: string;
  description: string;
  icon: string;
  ingredients: string[];
  confidence: number;
  reason: string;
  action?: {
    type: 'search' | 'filter' | 'navigate';
    payload: string;
  };
}

interface UserContext {
  recentSearches: string[];
  selectedIngredients: string[];
  currentQuery: string;
  detectedSymptoms: string[];
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
}

interface SearchPattern {
  query: string;
  frequency: number;
  lastUsed: Date;
  resultsClicked: number;
}

// Palabras clave por categoría de síntomas
const SYMPTOM_KEYWORDS: Record<string, string[]> = {
  sueño: ['dormir', 'insomnio', 'sueño', 'fatiga', 'cansancio', 'descanso', 'relajar'],
  dolor: ['dolor', 'analgesia', 'inflamación', 'artritis', 'migraña', 'cabeza', 'muscular'],
  estres: ['estrés', 'ansiedad', 'nervios', 'tensión', 'preocupación', 'angustia'],
  immunity: ['inmune', 'defensas', 'resfriado', 'gripe', 'inmunidad', 'infección'],
  digestion: ['digestivo', 'estómago', 'náuseas', 'intestino', 'estreñimiento', 'flora'],
  energia: ['energía', 'fatiga', 'cansancio', 'vitalidad', 'rendimiento', 'vigor'],
  piel: ['piel', 'dermatológico', 'eccema', 'acné', 'heridas', 'cicatrización'],
  corazon: ['corazón', 'cardiovascular', 'colesterol', 'presión', 'circulación'],
  memoria: ['memoria', 'cognitivo', 'concentración', 'cerebro', 'mental', 'enfoque'],
};

// Ingredientes populares por categoría
const POPULAR_BY_CATEGORY: Record<string, string[]> = {
  sueño: ['valeriana', 'melatonina', 'pasiflora', 'l-teanina', 'magnesio'],
  dolor: ['curcuma', 'boswelia', 'magnesio', 'omega-3', 'harpagofito'],
  estres: ['ashwagandha', 'l-teanina', 'pasiflora', 'rodiola', 'magnesio'],
  immunity: ['equinacea', 'vitamina-c', 'zinc', 'propoleo', 'vitamina-d'],
  digestion: ['probioticos', 'enzimas-digestivas', 'jengibre', 'fibra', 'magnesio'],
  energia: ['coq10', 'b-vitaminas', 'hierro', 'magnesio', 'ginseng'],
  memoria: ['bacopa', 'ginkgo', 'omega-3', 'fosfatidilserina', 'huperzina'],
};

class SuggestionEngine {
  private userContext: UserContext = {
    recentSearches: [],
    selectedIngredients: [],
    currentQuery: '',
    detectedSymptoms: [],
  };

  private searchHistory: SearchPattern[] = [];
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await embeddingService.init();
      this.loadFromStorage();
      this.isInitialized = true;
      logger.info('SuggestionEngine inicializado', 'SuggestionEngine');
    } catch (error) {
      logger.error('Error inicializando SuggestionEngine', 'SuggestionEngine', error);
    }
  }

  updateContext(context: Partial<UserContext>): void {
    this.userContext = { ...this.userContext, ...context };
    
    if (context.currentQuery) {
      this.addToHistory(context.currentQuery);
    }
  }

  private addToHistory(query: string): void {
    if (!query.trim()) return;

    this.userContext.recentSearches = [
      query,
      ...this.userContext.recentSearches.filter(q => q !== query)
    ].slice(0, 10);

    const existing = this.searchHistory.find(p => p.query === query);
    if (existing) {
      existing.frequency++;
      existing.lastUsed = new Date();
    } else {
      this.searchHistory.push({
        query,
        frequency: 1,
        lastUsed: new Date(),
        resultsClicked: 0,
      });
    }

    this.saveToStorage();
  }

  registerClick(query: string): void {
    const pattern = this.searchHistory.find(p => p.query === query);
    if (pattern) {
      pattern.resultsClicked++;
    }
  }

  private detectSymptoms(query: string): string[] {
    const queryLower = query.toLowerCase();
    const detected: string[] = [];

    for (const [symptom, keywords] of Object.entries(SYMPTOM_KEYWORDS)) {
      if (keywords.some(kw => queryLower.includes(kw))) {
        detected.push(symptom);
      }
    }

    return detected;
  }

  async getSuggestions(limit: number = 5): Promise<Suggestion[]> {
    await this.init();

    const suggestions: Suggestion[] = [];
    const query = this.userContext.currentQuery;
    const symptoms = this.detectSymptoms(query);

    // Sugerencias basadas en síntomas
    for (const symptom of symptoms.slice(0, 2)) {
      const synergySuggestions = this.getSynergySuggestions(symptom);
      suggestions.push(...synergySuggestions);
    }

    // Sugerencias complementarias
    for (const ingredientId of this.userContext.selectedIngredients.slice(0, 3)) {
      const complementary = this.getComplementarySuggestions(ingredientId);
      suggestions.push(...complementary);
    }

    // Alternativas populares
    if (symptoms.length > 0) {
      const alternatives = this.getAlternativeSuggestions(symptoms[0]);
      suggestions.push(...alternatives);
    }

    // Patrones aprendidos
    const learnedSuggestions = this.getLearnedSuggestions();
    suggestions.push(...learnedSuggestions);

    const unique = this.deduplicateSuggestions(suggestions);
    unique.sort((a, b) => b.confidence - a.confidence);

    return unique.slice(0, limit);
  }

  private getSynergySuggestions(symptom: string): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const popularIngredients = POPULAR_BY_CATEGORY[symptom] || [];

    if (popularIngredients.length >= 2) {
      for (let i = 0; i < Math.min(popularIngredients.length, 3); i++) {
        for (let j = i + 1; j < Math.min(popularIngredients.length, 3); j++) {
          const ingA = popularIngredients[i];
          const ingB = popularIngredients[j];
          
          const synergy = synergyEngineV2.getSynergyBetween(ingA, ingB);
          
          if (synergy) {
            suggestions.push({
              id: `synergy-${ingA}-${ingB}`,
              type: 'synergy',
              title: `Combinación sinérgica`,
              description: `${this.getIngredientName(ingA)} + ${this.getIngredientName(ingB)}`,
              icon: '⚡',
              ingredients: [ingA, ingB],
              confidence: 0.9,
              reason: `Sinergia conocida para ${symptom}`,
              action: {
                type: 'search',
                payload: `${ingA} ${ingB}`,
              },
            });
          }
        }
      }
    }

    return suggestions;
  }

  private getComplementarySuggestions(ingredientId: string): Suggestion[] {
    const suggestions: Suggestion[] = [];
    
    const synergies = synergyEngineV2.getSynergiesFor(ingredientId);
    
    for (const synergy of synergies.slice(0, 2)) {
      const partnerId = synergy.ingredienteB === ingredientId 
        ? synergy.ingredienteA 
        : synergy.ingredienteB;
      
      const partnerName = this.getIngredientName(partnerId);
      
      suggestions.push({
        id: `complement-${ingredientId}-${partnerId}`,
        type: 'complementary',
        title: `Combina bien con ${partnerName}`,
        description: synergy.descripcion || synergy.tipo,
        icon: '🔗',
        ingredients: [ingredientId, partnerId],
        confidence: 0.85,
        reason: `La ${synergy.tipo} clásica`,
        action: {
          type: 'search',
          payload: partnerId,
        },
      });
    }

    return suggestions;
  }

  private getAlternativeSuggestions(symptom: string): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const alternatives = POPULAR_BY_CATEGORY[symptom] || [];

    for (const ingredientId of alternatives.slice(0, 2)) {
      if (!this.userContext.selectedIngredients.includes(ingredientId)) {
        suggestions.push({
          id: `alt-${ingredientId}`,
          type: 'alternative',
          title: `También: ${this.getIngredientName(ingredientId)}`,
          description: `Alternativa popular para ${symptom}`,
          icon: '💡',
          ingredients: [ingredientId],
          confidence: 0.7,
          reason: 'Respaldado por usuarios',
        });
      }
    }

    return suggestions;
  }

  private getLearnedSuggestions(): Suggestion[] {
    const suggestions: Suggestion[] = [];

    const recentFrequent = this.searchHistory
      .filter(p => p.frequency > 1)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 2);

    for (const pattern of recentFrequent) {
      suggestions.push({
        id: `learned-${pattern.query}`,
        type: 'educational',
        title: `Búsqueda frecuente`,
        description: pattern.query,
        icon: '📊',
        ingredients: [],
        confidence: 0.6,
        reason: `Buscado ${pattern.frequency} veces`,
        action: {
          type: 'search',
          payload: pattern.query,
        },
      });
    }

    return suggestions;
  }

  private deduplicateSuggestions(suggestions: Suggestion[]): Suggestion[] {
    const seen = new Set<string>();
    return suggestions.filter(s => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }

  private getIngredientName(id: string): string {
    const ingredient = knowledgeLoader.getById(id);
    return ingredient?.nombre || id;
  }

  getUsageInsights(): {
    totalSearches: number;
    topSymptoms: string[];
    commonCombos: string[][];
  } {
    const symptomCounts: Record<string, number> = {};
    
    for (const pattern of this.searchHistory) {
      const symptoms = this.detectSymptoms(pattern.query);
      for (const symptom of symptoms) {
        symptomCounts[symptom] = (symptomCounts[symptom] || 0) + pattern.frequency;
      }
    }

    const topSymptoms = Object.entries(symptomCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([symptom]) => symptom);

    return {
      totalSearches: this.searchHistory.reduce((sum, p) => sum + p.frequency, 0),
      topSymptoms,
      commonCombos: [],
    };
  }

  private saveToStorage(): void {
    try {
      const data = {
        searchHistory: this.searchHistory.map(p => ({
          ...p,
          lastUsed: p.lastUsed.toISOString(),
        })),
      };
      localStorage.setItem('vademecum_suggestions', JSON.stringify(data));
    } catch (error) {
      logger.error('Error guardando sugerencias en storage', 'SuggestionEngine', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('vademecum_suggestions');
      if (stored) {
        const data = JSON.parse(stored);
        this.searchHistory = data.searchHistory.map((p: any) => ({
          ...p,
          lastUsed: new Date(p.lastUsed),
        }));
      }
    } catch (error) {
      logger.error('Error cargando sugerencias desde storage', 'SuggestionEngine', error);
    }
  }

  clearHistory(): void {
    this.searchHistory = [];
    this.userContext.recentSearches = [];
    localStorage.removeItem('vademecum_suggestions');
    logger.info('Historial de sugerencias limpiado', 'SuggestionEngine');
  }
}

export const suggestionEngine = new SuggestionEngine();
export default suggestionEngine;
