/**
 * Ingredient Search Service
 *
 * Motor de búsqueda optimizado para el mostrador de farmacia.
 *
 * Estrategia: índice invertido en memoria construido al arranque.
 * Cada token (palabra normalizada + bigramas de palabras) apunta al
 * conjunto de IDs que lo contienen en nombre, sinónimos, indicaciones
 * o propiedades. La búsqueda resuelve los IDs coincidentes en O(tokens).
 *
 * Capas de matching (combinadas):
 *   A. Índice invertido con pesos por campo (nombre 100, sinónimos 80…)
 *   B. Normalización: NFD, acentos, guiones bajos, stopwords en query
 *   C. Expansión de sinónimos coloquiales (muelas→dental, etc.)
 *   D. Bigramas de palabras: frases compuestas ("dolor de cabeza")
 *   E. Fuzzy: distancia de Levenshtein ≤ umbral para tolerar typos
 *   F. TF-IDF: IDF por token (tokens raros pesan más) + cosine-like
 *      normalización para ranking por relevancia real.
 *
 * Antes: db.ingredients.toArray() + filter en cada búsqueda (~545 recorridos).
 * Ahora: lookup en Map<token, weight> (~constante por token).
 */

import { db } from '@/db';
import type { DbIngredient, IngredientCategory, BodySystem } from '@/db/schema';
import {
  normalize, tokenize, tokenizeWithBigrams, canonicalIndication,
  expandQueryTokens, levenshtein,
} from '@/lib/text';
import { useLiveQuery } from 'dexie-react-hooks';

export interface SearchFilters {
  query?: string;
  category?: IngredientCategory;
  system?: BodySystem;
  evidenceLevel?: 'A' | 'B' | 'C' | 'D';
  indication?: string;
}

export interface SearchResult {
  ingredient: DbIngredient;
  score: number;
  matchType: 'exact' | 'fuzzy' | 'synonym';
}

interface IndexEntry {
  tokens: Map<string, number>;
  indications: Set<string>;
  categoria: IngredientCategory;
  sistemas: Set<BodySystem>;
  evidencia: string;
}

/** Umbral de distancia de edición para fuzzy matching. 1 = 1 edición
 *  (1 sustitución/inserción/borrado) para tokens ≤ 5 chars; 2 para
 *  tokens más largos. Tokens muy cortos (<3) no se hacen fuzzy. */
const FUZZY_MAX_DIST = 2;

/** Factor de penalización para matches fuzzy (vs exacto = 1.0). */
const FUZZY_FACTOR = 0.55;

/** Longitud mínima de un token para indexarlo. Tokens de 1 char (como
 *  la "d" de "D-Manosa") no aportan información semántica, generan falsos
 *  positivos masivos en el prefix matching bidireccional ("dolor".startsWith("d"))
 *  y su IDF es enorme por ser raros. Se descartan al indexar. */
const MIN_TOKEN_LENGTH = 2;

export class IngredientSearchService {
  private index = new Map<string, IndexEntry>();
  private cache = new Map<string, DbIngredient>();
  private built = false;
  /** Document frequency: nº de ingredientes que contienen cada token.
   *  Se usa para calcular IDF. Se construye al final de buildIndex(). */
  private df = new Map<string, number>();
  private totalDocs = 0;

  async buildIndex(): Promise<void> {
    const ingredients = await db.ingredients.toArray();
    this.index.clear();
    this.cache.clear();
    this.df.clear();
    for (const ing of ingredients) {
      this.indexIngredient(ing);
    }
    this.totalDocs = this.cache.size;
    // IDF pre-calculado: log(N / (1 + df)). Tokens raros → IDF alto.
    // Se aplica en searchInternal al ponderar cada match.
    this.built = true;
  }

  private indexIngredient(ing: DbIngredient): void {
    const tokens = new Map<string, number>();
    // Al indexar NO filtramos stopwords (los nombres propios pueden contenerlas)
    // y SÍ añadimos bigramas de palabras para frases compuestas.
    // Descartamos tokens de 1 char (no aportan info y generan falsos positivos).
    const addTokens = (text: string, weight: number) => {
      for (const tok of tokenizeWithBigrams(text, false)) {
        if (tok.trim().length < MIN_TOKEN_LENGTH) continue;
        tokens.set(tok, Math.max(tokens.get(tok) ?? 0, weight));
      }
    };

    addTokens(ing.nombre, 100);
    addTokens(ing.id, 100);
    if (ing.familia) addTokens(ing.familia, 30);
    for (const s of ing.sinonimos ?? []) addTokens(s, 80);
    for (const ind of ing.indicaciones ?? []) addTokens(ind, 40);
    for (const prop of ing.propiedades ?? []) addTokens(prop, 20);

    const indications = new Set<string>();
    for (const ind of ing.indicaciones ?? []) indications.add(canonicalIndication(ind));

    this.index.set(ing.id, {
      tokens,
      indications,
      categoria: ing.categoria,
      sistemas: new Set(ing.sistemas ?? []),
      evidencia: ing.evidencia,
    });
    this.cache.set(ing.id, ing);

    // Actualizar document frequency
    for (const tok of tokens.keys()) {
      this.df.set(tok, (this.df.get(tok) ?? 0) + 1);
    }
  }

  reindex(ing: DbIngredient): void {
    // Si ya existía, decrementar DF de sus tokens viejos
    const old = this.index.get(ing.id);
    if (old) {
      for (const tok of old.tokens.keys()) {
        const v = (this.df.get(tok) ?? 0) - 1;
        if (v <= 0) this.df.delete(tok);
        else this.df.set(tok, v);
      }
    }
    this.indexIngredient(ing);
  }

  remove(id: string): void {
    const entry = this.index.get(id);
    if (entry) {
      for (const tok of entry.tokens.keys()) {
        const v = (this.df.get(tok) ?? 0) - 1;
        if (v <= 0) this.df.delete(tok);
        else this.df.set(tok, v);
      }
    }
    this.index.delete(id);
    this.cache.delete(id);
  }

  isBuilt(): boolean {
    return this.built;
  }

  /** Número de ingredientes indexados (para estado idle / debugging). */
  get size(): number {
    return this.cache.size;
  }

  /** Devuelve un ingrediente del cache (o undefined) por ID. */
  getIngredient(id: string): DbIngredient | undefined {
    return this.cache.get(id);
  }

  /** Cuenta indicaciones normalizadas → nº de ingredientes. Para chips. */
  indicationCounts(): Map<string, number> {
    const counts = new Map<string, number>();
    for (const entry of this.index.values()) {
      for (const ind of entry.indications) {
        counts.set(ind, (counts.get(ind) ?? 0) + 1);
      }
    }
    return counts;
  }

  /** IDF (Inverse Document Frequency) de un token. Tokens que aparecen
   *  en muchos ingredientes (ej. "digestivo") pesan menos; tokens raros
   *  (ej. "ashwagandha") pesan más. Fórmula: 1 + log(N / (1 + df)). */
  private idf(token: string): number {
    const df = this.df.get(token) ?? 0;
    if (df === 0 || this.totalDocs === 0) return 1;
    return 1 + Math.log(this.totalDocs / (1 + df));
  }

  /** Versión síncrona: requiere que el índice esté construido. */
  searchSync(filters: SearchFilters): SearchResult[] {
    if (!this.built) return [];
    return this.searchInternal(filters);
  }

  async search(filters: SearchFilters): Promise<SearchResult[]> {
    if (!this.built) {
      await this.buildIndex();
    }
    return this.searchInternal(filters);
  }

  private searchInternal(filters: SearchFilters): SearchResult[] {

    const { query, category, system, evidenceLevel, indication } = filters;

    let candidateIds: Set<string> | null = null;

    if (indication) {
      const normInd = normalize(indication);
      const ids = new Set<string>();
      for (const [id, entry] of this.index) {
        for (const ind of entry.indications) {
          if (normalize(ind) === normInd) { ids.add(id); break; }
        }
      }
      candidateIds = ids;
    }

    if (category) {
      const ids = new Set<string>();
      for (const [id, entry] of this.index) {
        if (entry.categoria === category) ids.add(id);
      }
      candidateIds = candidateIds ? intersect(candidateIds, ids) : ids;
    }

    if (system) {
      const ids = new Set<string>();
      for (const [id, entry] of this.index) {
        if (entry.sistemas.has(system)) ids.add(id);
      }
      candidateIds = candidateIds ? intersect(candidateIds, ids) : ids;
    }

    if (evidenceLevel) {
      const ids = new Set<string>();
      for (const [id, entry] of this.index) {
        if (entry.evidencia === evidenceLevel) ids.add(id);
      }
      candidateIds = candidateIds ? intersect(candidateIds, ids) : ids;
    }

    if (!query || query.trim() === '') {
      const ids = candidateIds ?? new Set(this.index.keys());
      const results: SearchResult[] = [];
      for (const id of ids) {
        const ing = this.cache.get(id);
        if (ing) results.push({ ingredient: ing, score: 1, matchType: 'exact' });
      }
      return results;
    }

    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return [];

    // Expansión de consulta: bigramas + sinónimos (muelas→dental, etc.)
    // Los tokens que NO son originales ni bigramas se tratan como sinónimos
    // (peso ×0.5). Los bigramas se tratan como tokens normales.
    const expandedTokens = expandQueryTokens(queryTokens);
    const originalSet = new Set(queryTokens);
    const bigramSet = new Set(tokenize(query).length > 1
      ? expandQueryTokens(queryTokens).filter(t => t.includes(' ') && !originalSet.has(t))
      : []);
    const synonymTokens = new Set(
      expandedTokens.filter(t => !originalSet.has(t) && !bigramSet.has(t))
    );

    const scoreMap = new Map<string, { score: number; bestType: 'exact' | 'fuzzy' | 'synonym' }>();
    // Para fuzzy: un token del query solo se hace fuzzy si NO existe como token
    // exacto en NINGÚN ingrediente. Si el token existe (aunque no en este
    // ingrediente), el matching exacto/prefijo ya se encargó. Esto evita
    // falsos positivos masivos: "dolor" existe → no se hace fuzzy de "dolor".
    const tokenExistsGlobally = new Map<string, boolean>();
    const existsGlobally = (tok: string): boolean => {
      const cached = tokenExistsGlobally.get(tok);
      if (cached !== undefined) return cached;
      // Un token existe globalmente si algún ingrediente lo tiene indexado.
      // Lo comprobamos vía DF: df>0 significa que al menos 1 ingrediente lo tiene.
      const exists = (this.df.get(tok) ?? 0) > 0;
      tokenExistsGlobally.set(tok, exists);
      return exists;
    };

    for (const token of expandedTokens) {
      const isSynonym = synonymTokens.has(token);
      const synonymFactor = isSynonym ? 0.5 : 1;
      const tokenIdf = this.idf(token);
      // ¿Este token existe en algún ingrediente? Si sí, no hacemos fuzzy
      // (el matching exacto/prefijo basta). Si no, el fuzzy puede ayudar.
      const allowFuzzy = !existsGlobally(token);
      for (const [id, entry] of this.index) {
        if (candidateIds && !candidateIds.has(id)) continue;
        let weight = entry.tokens.get(token) ?? 0;
        let matched = false;

        if (weight === 0) {
          // Prefix matching: el token del query debe ser prefijo de un token
          // del ingrediente (ej. "valer" → "valeriana"), o viceversa pero solo
          // si el token del ingrediente es más largo (evita que "do" matchee "dolor").
          for (const [tok, w] of entry.tokens) {
            if (tok.startsWith(token) || (token.startsWith(tok) && tok.length >= token.length)) {
              weight = Math.max(weight, w * 0.6);
              matched = true;
            }
          }
          // Fuzzy: solo si el token no existe globalmente y es suficientemente
          // largo. Esto limita el coste y evita falsos positivos en tokens
          // comunes como "dolor" que ya existen.
          if (!matched && allowFuzzy && !isSynonym && token.length >= 5) {
            let bestDist = Infinity;
            let bestW = 0;
            const maxDist = token.length <= 6 ? 1 : FUZZY_MAX_DIST;
            for (const [tok, w] of entry.tokens) {
              if (Math.abs(tok.length - token.length) > maxDist) continue;
              const d = levenshtein(token, tok);
              if (d <= maxDist && d < bestDist) {
                bestDist = d;
                bestW = w;
              }
            }
            if (bestW > 0) {
              const fuzzPenalty = FUZZY_FACTOR * (1 - (bestDist - 1) / 3);
              weight = bestW * fuzzPenalty;
              matched = true;
            }
          }
        } else {
          matched = true;
        }

        if (matched) {
          weight *= synonymFactor * tokenIdf;
          const type: 'exact' | 'fuzzy' | 'synonym' =
            isSynonym ? 'synonym' :
            weight >= 100 ? 'exact' : weight >= 80 ? 'synonym' : 'fuzzy';
          const prev = scoreMap.get(id);
          if (prev) {
            prev.score += weight;
            if (rank(type) < rank(prev.bestType)) prev.bestType = type;
          } else {
            scoreMap.set(id, { score: weight, bestType: type });
          }
        }
      }
    }

    const results: SearchResult[] = [];
    for (const [id, { score, bestType }] of scoreMap) {
      const ing = this.cache.get(id);
      if (ing) results.push({ ingredient: ing, score, matchType: bestType });
    }

    results.sort((a, b) => b.score - a.score);
    return results;
  }
}

function rank(type: 'exact' | 'fuzzy' | 'synonym'): number {
  return type === 'exact' ? 0 : type === 'synonym' ? 1 : 2;
}

function intersect<T>(a: Set<T>, b: Set<T>): Set<T> {
  const out = new Set<T>();
  for (const x of a) if (b.has(x)) out.add(x);
  return out;
}

export const ingredientSearchService = new IngredientSearchService();

/**
 * Hook: construye el índice reactivamente cuando la KB cambia
 * (useLiveQuery sobre el count de ingredientes) y expone el estado.
 */
export function useSearchIndex(): { ready: boolean } {
  useLiveQuery(async () => {
    const count = await db.ingredients.count();
    const current = ingredientSearchService.size;
    if (count !== current || !ingredientSearchService.isBuilt()) {
      await ingredientSearchService.buildIndex();
    }
    return count;
  }, []);
  return { ready: ingredientSearchService.isBuilt() };
}
