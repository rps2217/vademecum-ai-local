/**
 * SemanticSearchService - Búsqueda semántica usando embeddings
 * Utiliza Ollama para generar embeddings y buscar por similitud
 */

import type { AnalyzedProduct } from '../../types';

// Configuración
const OLLAMA_URL = 'http://localhost:11434';
const EMBEDDING_MODEL = 'nomic-embed-text';

export interface EmbeddingVector {
  productId: string;
  sku: string;
  vector: number[];
  text: string; // Texto combinado para embedding
}

export interface SearchResult {
  product: AnalyzedProduct;
  score: number; // Similitud coseno (0-1)
  matchType: 'exact' | 'fuzzy' | 'semantic' | 'ingredient';
}

export interface SemanticSearchOptions {
  limit?: number;
  minScore?: number;
  includeFuzzy?: boolean;
  includeIngredients?: boolean;
}

class SemanticSearchService {
  private embeddingsCache: Map<string, EmbeddingVector> = new Map();
  private isInitialized = false;
  private ollamaAvailable = false;

  /**
   * Verificar si Ollama está disponible
   */
  async checkOllama(): Promise<boolean> {
    try {
      const response = await fetch(`${OLLAMA_URL}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(3000),
      });
      this.ollamaAvailable = response.ok;
      return this.ollamaAvailable;
    } catch {
      this.ollamaAvailable = false;
      return false;
    }
  }

  /**
   * Generar embedding para un texto usando Ollama
   */
  async generateEmbedding(text: string): Promise<number[] | null> {
    if (!this.ollamaAvailable) {
      console.log('[SemanticSearch] Ollama no disponible, usando búsqueda fuzzy');
      return null;
    }

    try {
      const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: EMBEDDING_MODEL,
          prompt: text,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.status}`);
      }

      const data = await response.json();
      return data.embedding;
    } catch (error) {
      console.error('[SemanticSearch] Error generando embedding:', error);
      this.ollamaAvailable = false;
      return null;
    }
  }

  /**
   * Crear texto combinado para embedding de un producto
   */
  private createProductText(product: AnalyzedProduct): string {
    const parts: string[] = [];

    if (product.nombre_comercial) parts.push(product.nombre_comercial);
    if (product.descripcion) parts.push(product.descripcion);
    if (product.principios_activos) parts.push(product.principios_activos.join(' '));
    if (product.indicaciones) parts.push(product.indicaciones.join(' '));
    if (product.posologia) parts.push(product.posologia);
    if (product.categoria_principal) parts.push(product.categoria_principal);

    return parts.join('. ');
  }

  /**
   * Generar y guardar embeddings para productos
   */
  async indexProducts(products: AnalyzedProduct[]): Promise<void> {
    await this.checkOllama();

    const embeddings: EmbeddingVector[] = [];

    for (const product of products) {
      const text = this.createProductText(product);
      const embedding = await this.generateEmbedding(text);

      if (embedding) {
        const vector: EmbeddingVector = {
          productId: product.id || product.sku,
          sku: product.sku,
          vector: embedding,
          text,
        };
        embeddings.push(vector);
        this.embeddingsCache.set(product.sku, vector);
      }
    }

    // Guardar en localStorage para persistencia
    this.saveToStorage(embeddings);
    this.isInitialized = embeddings.length > 0;
  }

  /**
   * Guardar embeddings en localStorage
   */
  private saveToStorage(embeddings: EmbeddingVector[]): void {
    try {
      localStorage.setItem('vademecum_embeddings', JSON.stringify(embeddings));
    } catch (e) {
      console.error('[SemanticSearch] Error guardando embeddings:', e);
    }
  }

  /**
   * Cargar embeddings desde localStorage
   */
  loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('vademecum_embeddings');
      if (stored) {
        const embeddings: EmbeddingVector[] = JSON.parse(stored);
        for (const emb of embeddings) {
          this.embeddingsCache.set(emb.sku, emb);
        }
        this.isInitialized = true;
        console.log(`[SemanticSearch] Cargados ${embeddings.length} embeddings`);
      }
    } catch (e) {
      console.error('[SemanticSearch] Error cargando embeddings:', e);
    }
  }

  /**
   * Calcular similitud coseno entre dos vectores
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  /**
   * Búsqueda semántica
   */
  async semanticSearch(
    query: string,
    products: AnalyzedProduct[],
    options: SemanticSearchOptions = {}
  ): Promise<SearchResult[]> {
    const { limit = 20, minScore = 0.5, includeFuzzy = true, includeIngredients = true } = options;

    // Si Ollama no está disponible, usar solo búsqueda tradicional
    if (!this.ollamaAvailable) {
      console.log('[SemanticSearch] Usando búsqueda tradicional (Ollama no disponible)');
      return this.traditionalSearch(query, products, options);
    }

    // Generar embedding de la consulta
    const queryEmbedding = await this.generateEmbedding(query);
    if (!queryEmbedding) {
      return this.traditionalSearch(query, products, options);
    }

    // Cargar embeddings si no están cargados
    if (this.embeddingsCache.size === 0) {
      this.loadFromStorage();
    }

    // Si no hay embeddings cacheados, crear para productos más relevantes
    if (this.embeddingsCache.size < products.length * 0.5) {
      await this.indexProducts(products.slice(0, 100)); // Limitar para performance
    }

    const results: SearchResult[] = [];

    for (const product of products) {
      const cached = this.embeddingsCache.get(product.sku);

      if (cached) {
        // Usar embedding cacheado
        const score = this.cosineSimilarity(queryEmbedding, cached.vector);

        if (score >= minScore) {
          results.push({
            product,
            score,
            matchType: 'semantic',
          });
        }
      } else {
        // Crear embedding temporal para este producto
        const productText = this.createProductText(product);
        const productEmbedding = await this.generateEmbedding(productText);

        if (productEmbedding) {
          const score = this.cosineSimilarity(queryEmbedding, productEmbedding);

          if (score >= minScore) {
            results.push({
              product,
              score,
              matchType: 'semantic',
            });
          }

          // Cachear para futuras búsquedas
          this.embeddingsCache.set(product.sku, {
            productId: product.id || product.sku,
            sku: product.sku,
            vector: productEmbedding,
            text: productText,
          });
        }
      }
    }

    // Ordenar por score
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, limit);
  }

  /**
   * Búsqueda tradicional (fuzzy + palabras clave)
   */
  private traditionalSearch(
    query: string,
    products: AnalyzedProduct[],
    options: SemanticSearchOptions = {}
  ): SearchResult[] {
    const { limit = 20, includeFuzzy = true, includeIngredients = true } = options;
    const results: SearchResult[] = [];
    const queryLower = query.toLowerCase();

    // Mapa de sinonimia para términos comunes
    const synonyms: Record<string, string[]> = {
      'dormir': ['insomnio', 'sueño', 'hipnótico', 'sedante', 'relajante'],
      'insomnio': ['dormir', 'sueño', 'hipnótico', 'sedante', 'no puedo dormir'],
      'dolor': ['analgesia', 'antiinflamatorio', 'calma', 'alivia'],
      'inflamación': ['antiinflamatorio', 'hinchazón', 'artritis', 'artralgia'],
      'estrés': ['ansiedad', 'nerviosismo', 'tensión', 'adaptógeno'],
      'ansiedad': ['estrés', 'nerviosismo', 'angustia', 'nervios'],
      'depresión': ['tristeza', 'ánimo bajo', 'antidepresivo', 'moral'],
      'inmune': ['defensas', 'inmunidad', 'inmunológico', 'resfriado'],
      'articulaciones': ['artritis', 'artrosis', 'huesos', 'cartílago'],
      'piel': ['dermatológico', 'eccema', 'eccema', 'cutáneo'],
      'digestivo': ['estómago', 'gástrico', 'intestino', 'náuseas'],
      'cardiovascular': ['corazón', 'tensión', 'presión', 'circulación'],
      'vitaminas': ['complejo vitamínico', 'micronutrientes', 'suplemento'],
    };

    // Expandir consulta con sinónimos
    let expandedQuery = queryLower;
    for (const [term, syns] of Object.entries(synonyms)) {
      if (queryLower.includes(term)) {
        expandedQuery += ' ' + syns.join(' ');
      }
    }

    for (const product of products) {
      const searchableText = [
        product.nombre_comercial,
        product.descripcion,
        product.principios_activos?.join(' '),
        product.indicaciones?.join(' '),
        product.posologia,
        product.categoria_principal,
      ].filter(Boolean).join(' ').toLowerCase();

      let score = 0;
      let matchType: SearchResult['matchType'] = 'fuzzy';

      // Búsqueda exacta
      if (searchableText.includes(queryLower)) {
        score = 0.9;
        matchType = 'exact';
      } else if (expandedQuery.split(' ').some(word => searchableText.includes(word))) {
        // Búsqueda por palabras clave expandidas
        score = 0.7;
        matchType = 'semantic';
      } else if (includeIngredients && product.principios_activos) {
        // Búsqueda por ingredientes
        const ingredientsMatch = product.principios_activos.some(ing =>
          expandedQuery.includes(ing.toLowerCase())
        );
        if (ingredientsMatch) {
          score = 0.6;
          matchType = 'ingredient';
        }
      }

      if (score > 0) {
        results.push({ product, score, matchType });
      }
    }

    // Ordenar por score
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, limit);
  }

  /**
   * Búsqueda combinada (semántica + fuzzy)
   */
  async combinedSearch(
    query: string,
    products: AnalyzedProduct[],
    options: SemanticSearchOptions = {}
  ): Promise<SearchResult[]> {
    // Primero intentamos búsqueda semántica
    const semanticResults = await this.semanticSearch(query, products, {
      ...options,
      minScore: 0.4, // Más permisivo
    });

    // Si tenemos resultados semánticos buenos, retornarlos
    if (semanticResults.length > 0 && semanticResults[0].score > 0.7) {
      return semanticResults;
    }

    // Si no, combinar con búsqueda tradicional
    const traditionalResults = this.traditionalSearch(query, products, options);

    // Combinar y deduplicar
    const combined = new Map<string, SearchResult>();

    for (const result of semanticResults) {
      combined.set(result.product.sku, result);
    }

    for (const result of traditionalResults) {
      const existing = combined.get(result.product.sku);
      if (!existing || result.score > existing.score) {
        combined.set(result.product.sku, result);
      }
    }

    // Ordenar por score
    const finalResults = Array.from(combined.values())
      .sort((a, b) => b.score - a.score);

    return finalResults.slice(0, options.limit || 20);
  }

  /**
   * Verificar estado del servicio
   */
  getStatus(): { initialized: boolean; ollamaAvailable: boolean; embeddingsCount: number } {
    return {
      initialized: this.isInitialized,
      ollamaAvailable: this.ollamaAvailable,
      embeddingsCount: this.embeddingsCache.size,
    };
  }

  /**
   * Limpiar cache
   */
  clearCache(): void {
    this.embeddingsCache.clear();
    localStorage.removeItem('vademecum_embeddings');
    this.isInitialized = false;
  }
}

// Instancia singleton
export const semanticSearch = new SemanticSearchService();

export default semanticSearch;
