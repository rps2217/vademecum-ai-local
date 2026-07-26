/**
 * KBEmbeddingService - Servicio de embeddings para la Base de Conocimiento
 * 
 * Genera embeddings para todos los ingredientes de la KB
 * y permite búsqueda semántica con Transformers.js
 */

import { knowledgeLoader } from '../knowledge-base';
import { logger } from '../../services/LoggerService';

const EMBEDDING_MODEL = 'Xenova/transformers-mlnl6';
const EMBEDDING_DIMENSIONS = 384;

export interface KBIngredient {
  id: string;
  nombre: string;
  categoria: string;
  textoIndexado: string;
  embedding?: number[];
}

export interface SemanticSearchResult {
  ingredient: KBIngredient;
  score: number;
  matchedField: string;
}

// Singleton
class KBEmbeddingService {
  private static instance: KBEmbeddingService;
  private ingredients: KBIngredient[] = [];
  private isReady: boolean = false;
  private pipeline: any = null;
  private loadingPromise: Promise<void> | null = null;

  static getInstance(): KBEmbeddingService {
    if (!KBEmbeddingService.instance) {
      KBEmbeddingService.instance = new KBEmbeddingService();
    }
    return KBEmbeddingService.instance;
  }

  /**
   * Inicializar el servicio
   */
  async init(): Promise<void> {
    if (this.isReady || this.loadingPromise) {
      if (this.loadingPromise) {
        return this.loadingPromise;
      }
      return;
    }

    this.loadingPromise = this.doInit();
    return this.loadingPromise;
  }

  private async doInit(): Promise<void> {
    try {
      // Cargar la base de conocimiento
      await knowledgeLoader.load();
      
      // Cargar modelo de transformers
      await this.loadTransformers();
      
      // Indexar ingredientes
      await this.indexIngredients();
      
      this.isReady = true;
      logger.success(`KB Embedding Service listo: ${this.ingredients.length} ingredientes indexados`, 'KBEmbedding');
    } catch (error) {
      logger.error('Error inicializando KB Embedding Service', 'KBEmbedding', error);
      // Intentar con fallback
      await this.initFallback();
    }
  }

  /**
   * Cargar Transformers.js
   */
  private async loadTransformers(): Promise<void> {
    try {
      const { pipeline, env } = await import('@xenova/transformers');
      
      env.allowLocalModels = false;
      env.useBrowserCache = true;

      logger.info('Cargando modelo de embeddings...', 'KBEmbedding');
      
      this.pipeline = await pipeline('feature-extraction', EMBEDDING_MODEL, {
        progress_callback: (progress: any) => {
          if (progress.status === 'progress') {
            logger.debug(`${progress.file} - ${progress.progress?.toFixed(1)}%`, 'KBEmbedding');
          }
        },
      });
      
      logger.success('Modelo de embeddings cargado', 'KBEmbedding');
    } catch (error) {
      logger.warn('Transformers.js no disponible, usando fallback', 'KBEmbedding');
      throw error;
    }
  }

  /**
   * Inicializar con fallback (pseudo-embeddings)
   */
  private async initFallback(): Promise<void> {
    await knowledgeLoader.load();
    await this.indexIngredients();
    this.isReady = true;
    logger.info('KB Embedding Service iniciado en modo fallback', 'KBEmbedding');
  }

  /**
   * Crear texto indexable para un ingrediente
   */
  private createIngredientText(ingredient: any): string {
    const parts: string[] = [
      ingredient.nombre,
      ingredient.nombreCientifico || '',
      ...(ingredient.nombresAlternativos || []),
      ...(ingredient.indicaciones || []),
      ...(ingredient.sistemas || []),
      ingredient.categoria,
    ].filter(Boolean);

    return parts.join(' ');
  }

  /**
   * Indexar todos los ingredientes de la KB
   */
  private async indexIngredients(): Promise<void> {
    const allIngredients = knowledgeLoader.getAll();
    
    this.ingredients = allIngredients.map(ing => ({
      id: ing.id,
      nombre: ing.nombre,
      categoria: ing.categoria,
      textoIndexado: this.createIngredientText(ing),
    }));

    // Generar embeddings
    if (this.pipeline) {
      logger.info(`Generando embeddings para ${this.ingredients.length} ingredientes...`, 'KBEmbedding');
      
      for (const ingredient of this.ingredients) {
        try {
          const result = await this.pipeline(ingredient.textoIndexado, {
            pooling: 'mean',
            normalize: true,
          });
          ingredient.embedding = Array.from(result.data);
        } catch (error) {
          logger.warn(`Error generando embedding para ${ingredient.nombre}`, 'KBEmbedding');
          ingredient.embedding = this.generatePseudoEmbedding(ingredient.textoIndexado);
        }
      }
      
      logger.success('Embeddings generados', 'KBEmbedding');
    } else {
      // Generar pseudo-embeddings
      for (const ingredient of this.ingredients) {
        ingredient.embedding = this.generatePseudoEmbedding(ingredient.textoIndexado);
      }
    }
  }

  /**
   * Generar pseudo-embedding
   */
  private generatePseudoEmbedding(text: string): number[] {
    const hash = this.simpleHash(text.toLowerCase());
    const vector: number[] = [];
    
    for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
      const seed = (hash + i * 31) % 1000;
      vector.push((seed / 1000) * 2 - 1);
    }

    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    return vector.map(v => v / norm);
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Generar embedding para un texto
   */
  async generateEmbedding(text: string): Promise<number[] | null> {
    if (this.pipeline) {
      try {
        const result = await this.pipeline(text, {
          pooling: 'mean',
          normalize: true,
        });
        return Array.from(result.data);
      } catch (error) {
        logger.error('Error generando embedding', 'KBEmbedding', error);
        return this.generatePseudoEmbedding(text);
      }
    }
    return this.generatePseudoEmbedding(text);
  }

  /**
   * Calcular similitud coseno
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Búsqueda semántica
   */
  async search(query: string, limit: number = 10, category?: string): Promise<SemanticSearchResult[]> {
    if (!this.isReady) {
      await this.init();
    }

    const queryEmbedding = await this.generateEmbedding(query);
    if (!queryEmbedding) return [];

    let candidates = this.ingredients;
    
    // Filtrar por categoría si se especifica
    if (category && category !== 'all') {
      candidates = candidates.filter(ing => ing.categoria === category);
    }

    // Calcular similitud
    const results: SemanticSearchResult[] = candidates
      .filter(ing => ing.embedding)
      .map(ing => ({
        ingredient: ing,
        score: this.cosineSimilarity(queryEmbedding, ing.embedding!),
        matchedField: 'textoIndexado',
      }))
      .filter(r => r.score > 0.1) // Filtrar resultados muy poco relevantes
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return results;
  }

  /**
   * Buscar por similaridad a un ingrediente específico
   */
  async findSimilar(ingredientId: string, limit: number = 5): Promise<SemanticSearchResult[]> {
    const ingredient = this.ingredients.find(ing => ing.id === ingredientId);
    if (!ingredient?.embedding) return [];

    const results = this.ingredients
      .filter(ing => ing.id !== ingredientId && ing.embedding)
      .map(ing => ({
        ingredient: ing,
        score: this.cosineSimilarity(ingredient.embedding!, ing.embedding!),
        matchedField: 'textoIndexado',
      }))
      .filter(r => r.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return results;
  }

  /**
   * Obtener todos los ingredientes
   */
  getAll(): KBIngredient[] {
    return this.ingredients;
  }

  /**
   * Obtener estadísticas
   */
  getStats() {
    return {
      totalIngredients: this.ingredients.length,
      indexed: this.ingredients.filter(i => i.embedding).length,
      isReady: this.isReady,
      hasTransformers: !!this.pipeline,
    };
  }
}

// Exportar singleton
export const kbEmbeddingService = KBEmbeddingService.getInstance();
