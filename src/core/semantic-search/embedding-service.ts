/**
 * EmbeddingService - Generación de embeddings en cliente
 * Sin Ollama: usa Transformers.js o fallback a búsqueda fuzzy mejorada
 */

import type { AnalyzedProduct } from '../../types';

// Configuración
const EMBEDDING_MODEL = 'Xenova/transformers-mlnl6'; // Modelo ligero para embeddings
const EMBEDDING_DIMENSIONS = 384; // Dimensiones del embedding

export interface EmbeddingVector {
  productId: string;
  vector: number[];
}

export interface SearchResult {
  product: AnalyzedProduct;
  score: number;
  matchType: 'exact' | 'fuzzy' | 'semantic';
}

// Estado del servicio
interface EmbeddingServiceState {
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  provider: 'transformers' | 'openai' | 'cohere' | 'fuzzy';
}

// Singleton
class EmbeddingService {
  private embeddings: Map<string, number[]> = new Map();
  private state: EmbeddingServiceState = {
    isReady: false,
    isLoading: false,
    error: null,
    provider: 'fuzzy', // Default: fuzzy
  };
  private transformersPipeline: any = null;

  /**
   * Inicializar el servicio de embeddings
   */
  async init(): Promise<void> {
    if (this.state.isReady || this.state.isLoading) return;
    
    this.state.isLoading = true;
    this.state.error = null;

    try {
      // Intentar cargar Transformers.js
      await this.initTransformers();
    } catch (error) {
      console.warn('[EmbeddingService] Transformers.js no disponible, usando fallback fuzzy');
      this.state.provider = 'fuzzy';
      this.state.isReady = true;
    }

    this.state.isLoading = false;
  }

  /**
   * Inicializar Transformers.js
   */
  private async initTransformers(): Promise<void> {
    try {
      // Cargar dinámicamente transformers.js
      const { pipeline, env } = await import('@xenova/transformers');
      
      // Configurar para mejor rendimiento
      env.allowLocalModels = false;
      env.useBrowserCache = true;

      console.log('[EmbeddingService] Cargando modelo de embeddings...');
      
      // Crear pipeline de embeddings
      this.transformersPipeline = await pipeline(
        'feature-extraction',
        EMBEDDING_MODEL,
        {
          progress_callback: (progress: any) => {
            if (progress.status === 'progress') {
              console.log(`[EmbeddingService] ${progress.file} - ${progress.progress?.toFixed(1)}%`);
            }
          },
        }
      );

      this.state.provider = 'transformers';
      this.state.isReady = true;
      console.log('[EmbeddingService] Transformers.js listo!');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generar embedding para un texto
   */
  async generateEmbedding(text: string): Promise<number[] | null> {
    if (this.state.provider === 'transformers' && this.transformersPipeline) {
      try {
        const result = await this.transformersPipeline(text, {
          pooling: 'mean',
          normalize: true,
        });
        
        return Array.from(result.data);
      } catch (error) {
        console.error('[EmbeddingService] Error generando embedding:', error);
        return null;
      }
    }

    // Fallback: usar hashing semántico (no es real, pero proporciona variedad)
    return this.generatePseudoEmbedding(text);
  }

  /**
   * Generar pseudo-embedding usando hash (para fallback)
   * No es semántico real, pero proporciona variabilidad
   */
  private generatePseudoEmbedding(text: string): number[] {
    const hash = this.simpleHash(text.toLowerCase());
    const vector: number[] = [];
    
    for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
      // Generar valores pseudo-aleatorios basados en hash
      const seed = (hash + i * 31) % 1000;
      vector.push((seed / 1000) * 2 - 1);
    }

    // Normalizar
    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    return vector.map(v => v / norm);
  }

  /**
   * Hash simple para strings
   */
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
   * Indexar productos para búsqueda
   */
  async indexProducts(products: AnalyzedProduct[]): Promise<void> {
    this.embeddings.clear();

    const texts = products.map(p => this.createProductText(p));
    
    for (let i = 0; i < products.length; i++) {
      const sku = products[i].sku;
      const embedding = await this.generateEmbedding(texts[i]);
      
      if (embedding) {
        this.embeddings.set(sku, embedding);
      }
    }
  }

  /**
   * Crear texto combinado para embedding
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
   * Buscar productos por similitud semántica
   */
  async semanticSearch(
    query: string,
    products: AnalyzedProduct[],
    limit: number = 20
  ): Promise<SearchResult[]> {
    if (!this.state.isReady) {
      await this.init();
    }

    if (this.state.provider === 'fuzzy' || this.embeddings.size === 0) {
      // Usar búsqueda fuzzy mejorada
      return this.fuzzySearch(query, products, limit);
    }

    // Generar embedding de la consulta
    const queryEmbedding = await this.generateEmbedding(query);
    if (!queryEmbedding) {
      return this.fuzzySearch(query, products, limit);
    }

    // Indexar productos si no están indexados
    if (this.embeddings.size < products.length * 0.5) {
      await this.indexProducts(products.slice(0, 100)); // Limitar para performance
    }

    // Calcular similitud
    const results: SearchResult[] = [];

    for (const product of products) {
      const productEmbedding = this.embeddings.get(product.sku);

      if (productEmbedding) {
        const score = this.cosineSimilarity(queryEmbedding, productEmbedding);
        results.push({
          product,
          score,
          matchType: 'semantic',
        });
      }
    }

    // Ordenar por score
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, limit);
  }

  /**
   * Búsqueda fuzzy mejorada con sinónimos
   */
  private fuzzySearch(
    query: string,
    products: AnalyzedProduct[],
    limit: number
  ): SearchResult[] {
    const synonyms: Record<string, string[]> = {
      // Sueño/Dormir
      'dormir': ['insomnio', 'sueño', 'hipnótico', 'sedante', 'relajante', 'no puedo dormir', 'dificultad para dormir'],
      'insomnio': ['dormir', 'sueño', 'hipnótico', 'sedante', 'no puedo dormir'],
      'sueño': ['dormir', 'insomnio', 'relax', 'descanso'],
      
      // Dolor
      'dolor': ['analgesia', 'antiinflamatorio', 'calma', 'alivia', 'dolor de cabeza', 'migraña'],
      'inflamación': ['antiinflamatorio', 'hinchazón', 'artritis', 'artralgia', 'rojez'],
      'migraña': ['dolor de cabeza', 'cefalea', 'jaqueca'],
      'cefalea': ['dolor de cabeza', 'migraña', 'jaqueca'],
      
      // Estrés/Ansiedad
      'estrés': ['ansiedad', 'nerviosismo', 'tensión', 'adaptógeno', 'nervios'],
      'ansiedad': ['estrés', 'nerviosismo', 'angustia', 'nervios', 'preocupación'],
      'nervios': ['ansiedad', 'estrés', 'tensión', 'nerviosismo'],
      
      // Inmunidad
      'inmune': ['defensas', 'inmunidad', 'inmunológico', 'resfriado', 'gripe'],
      'resfriado': ['resfrío', 'gripe', 'catarro', 'congestion nasal'],
      'gripe': ['resfriado', 'resfrío', 'catarro', 'fiebre'],
      
      // Digestivo
      'digestivo': ['estómago', 'gástrico', 'intestino', 'náuseas', 'digestión'],
      'náuseas': ['vómito', 'mareo', 'digestión', 'estómago'],
      'estreñimiento': ['constipación', 'intestino', 'tránsito intestinal'],
      
      // Articulaciones
      'articulaciones': ['artritis', 'artrosis', 'huesos', 'cartílago', 'joint'],
      'artritis': ['articulación', 'inflamación articular', 'dolor articular'],
      
      // Piel
      'piel': ['dermatológico', 'eccema', 'eccema', 'cutáneo', 'dermatitis'],
      'eccema': ['dermatitis', 'eccema', 'irritación cutánea'],
      
      // Cardiovascular
      'corazón': ['cardiovascular', 'tensión', 'presión arterial', 'circulación'],
      'colesterol': ['lípidos', 'grasas', 'cardiovascular'],
      'presión': ['hipertensión', 'tensión arterial', 'cardiovascular'],
      
      // Vitaminas/Minerales
      'vitaminas': ['complejo vitamínico', 'micronutrientes', 'suplemento', 'vitamina'],
      'calcio': ['huesos', 'dientes', 'mineral'],
      'hierro': ['anemia', 'sangre', 'mineral'],
      'magnesio': ['músculos', 'nervios', 'relajante', 'mineral'],
      
      // Sistema nervioso
      'cerebro': ['cognitivo', 'memoria', 'concentración', 'mental'],
      'memoria': ['cognitivo', 'cerebro', 'concentración', 'memoria'],
      'concentración': ['atención', 'foco', 'memoria', 'cognitivo'],
    };

    // Expandir consulta
    const expandedTerms = new Set<string>();
    const queryLower = query.toLowerCase();
    expandedTerms.add(queryLower);

    for (const [term, syns] of Object.entries(synonyms)) {
      if (queryLower.includes(term)) {
        expandedTerms.add(term);
        syns.forEach(s => expandedTerms.add(s));
      }
      // También buscar si el término es parte de la consulta
      if (term.includes(queryLower) || queryLower.includes(term)) {
        expandedTerms.add(term);
      }
    }

    const results: SearchResult[] = [];

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
      let matchType: 'exact' | 'fuzzy' = 'fuzzy';

      // Verificar coincidencias
      const matches = expandedTerms.filter(term => searchableText.includes(term));
      const matchCount = matches.length;

      if (matchCount > 0) {
        // Calcular score basado en:
        // 1. Coincidencia exacta del query (más importante)
        if (searchableText.includes(queryLower)) {
          score += 0.5;
          matchType = 'exact';
        }
        
        // 2. Número de términos que coinciden (normalizado)
        score += (matchCount / expandedTerms.size) * 0.3;
        
        // 3. Coincidencia en nombre comercial (bonus)
        const nombreLower = (product.nombre_comercial || '').toLowerCase();
        if (nombreLower.includes(queryLower)) {
          score += 0.2;
        }
        
        // 4. Prioridad de categoría
        if (queryLower.split(' ').every(word => searchableText.includes(word))) {
          score += 0.1;
        }
      }

      if (score > 0) {
        results.push({ product, score: Math.min(score, 1), matchType });
      }
    }

    // Ordenar por score
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, limit);
  }

  /**
   * Similitud coseno entre dos vectores
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
   * Obtener estado del servicio
   */
  getState(): EmbeddingServiceState {
    return { ...this.state };
  }

  /**
   * Limpiar cache
   */
  clearCache(): void {
    this.embeddings.clear();
  }
}

// Instancia singleton
export const embeddingService = new EmbeddingService();

export default embeddingService;
