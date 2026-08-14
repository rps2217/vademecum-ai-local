/**
 * searchEngine — motor de búsqueda genérico reutilizable.
 *
 * Núcleo compartido del índice invertido + scoring TF-IDF + fuzzy Levenshtein,
 * extraído para que IngredientSearchService y ProductSearchService lo reutilicen
 * sin duplicar la lógica de ranking. Es agnóstico del dominio: opera sobre
 * `DocEntry` (id + tokens ponderados + facets opcionales).
 *
 * Las 6 capas de matching viven en `@/lib/text` (normalize, tokenize, bigrams,
 * expandQueryTokens, levenshtein) y aquí solo orquestamos el scoring.
 */

import {
  tokenize, tokenizeWithBigrams, expandQueryTokens, levenshtein, normalize,
} from '@/lib/text';

/** Documento indexado: un id y sus tokens ponderados + facets para filtrar. */
export interface DocEntry<F extends string = string> {
  id: string;
  /** token normalizado → peso del campo donde aparece (nombre 100, etc.) */
  tokens: Map<string, number>;
  /** Facets opcionales (categoria, sistema, evidencia…) para filtrado barato. */
  facets: Partial<Record<F, Set<string>>>;
}

/** Filtro facet: clave → conjunto de valores permitidos (OR dentro de la clave,
 *  AND entre claves). Un doc pasa si para cada clave presente, tiene al menos
 *  uno de los valores. */
export type FacetFilter<F extends string> = Partial<Record<F, string>>;

export interface ScoredDoc {
  id: string;
  score: number;
  matchType: 'exact' | 'fuzzy' | 'synonym';
}

const FUZZY_MAX_DIST = 2;
const FUZZY_FACTOR = 0.55;
const MIN_TOKEN_LENGTH = 2;

/**
 * Construye los tokens ponderados de un texto, añadiendo bigramas de palabras
 * para frases compuestas. Descarta tokens de 1 char (no aportan info, generan
 * falsos positivos en prefix matching y tienen IDF enorme por ser raros).
 */
export function buildTokens(text: string, weight: number): Map<string, number> {
  const tokens = new Map<string, number>();
  for (const tok of tokenizeWithBigrams(text, false)) {
    if (tok.trim().length < MIN_TOKEN_LENGTH) continue;
    tokens.set(tok, Math.max(tokens.get(tok) ?? 0, weight));
  }
  return tokens;
}

/**
 * Índice invertido con document frequency (DF) para TF-IDF.
 * Genérico y reusable: el dueño mantiene `docs` y le pasa el DF al rankear.
 */
export class InvertedIndex<F extends string = string> {
  /** id → DocEntry */
  docs = new Map<string, DocEntry<F>>();
  /** token → nº de docs que lo contienen (para IDF) */
  private df = new Map<string, number>();
  private totalDocs = 0;

  get size(): number {
    return this.docs.size;
  }

  /** IDF de un token: 1 + log(N / (1 + df)). Tokens raros pesan más. */
  idf(token: string): number {
    const df = this.df.get(token) ?? 0;
    if (df === 0 || this.totalDocs === 0) return 1;
    return 1 + Math.log(this.totalDocs / (1 + df));
  }

  /** ¿Algún doc indexa este token? (usado para decidir si aplicar fuzzy). */
  existsGlobally(token: string): boolean {
    return (this.df.get(token) ?? 0) > 0;
  }

  /** Indexa (o re-indexa) un doc. Llama a remove() antes si ya existía. */
  add(entry: DocEntry<F>): void {
    this.docs.set(entry.id, entry);
    for (const tok of entry.tokens.keys()) {
      this.df.set(tok, (this.df.get(tok) ?? 0) + 1);
    }
    this.totalDocs = this.docs.size;
  }

  /** Des-indexa un doc y ajusta el DF. */
  remove(id: string): void {
    const entry = this.docs.get(id);
    if (!entry) return;
    for (const tok of entry.tokens.keys()) {
      const v = (this.df.get(tok) ?? 0) - 1;
      if (v <= 0) this.df.delete(tok);
      else this.df.set(tok, v);
    }
    this.docs.delete(id);
    this.totalDocs = this.docs.size;
  }

  clear(): void {
    this.docs.clear();
    this.df.clear();
    this.totalDocs = 0;
  }

  /**
   * Rankea los docs que matchean `query` (con expansión de sinónimos/bigramas
   * y fuzzy Levenshtein), opcionalmente filtrados por facets.
   *
   * Sin query: devuelve todos los docs que pasan el facet filter (score 1).
   * Devuelve resultados ordenados por score descendente.
   */
  rank(opts: { query?: string; facets?: FacetFilter<F> } = {}): ScoredDoc[] {
    const { query, facets } = opts;

    // Candidate set por facets (AND entre claves, OR dentro de cada clave).
    let candidateIds: Set<string> | null = null;
    if (facets) {
      for (const [key, value] of Object.entries(facets)) {
        if (!value) continue;
        const ids = new Set<string>();
        const fKey = key as F;
        const want = value as string;
        for (const [id, entry] of this.docs) {
          const facetSet = entry.facets[fKey];
          if (facetSet && facetSet.has(want)) ids.add(id);
        }
        candidateIds = candidateIds ? intersect(candidateIds, ids) : ids;
      }
    }

    if (!query || query.trim() === '') {
      const ids = candidateIds ?? new Set(this.docs.keys());
      const out: ScoredDoc[] = [];
      for (const id of ids) out.push({ id, score: 1, matchType: 'exact' });
      return out;
    }

    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return [];

    const expandedTokens = expandQueryTokens(queryTokens);
    const originalSet = new Set(queryTokens);
    const bigramSet = new Set(
      tokenize(query).length > 1
        ? expandQueryTokens(queryTokens).filter((t) => t.includes(' ') && !originalSet.has(t))
        : [],
    );
    const synonymTokens = new Set(
      expandedTokens.filter((t) => !originalSet.has(t) && !bigramSet.has(t)),
    );

    const scoreMap = new Map<string, { score: number; bestType: 'exact' | 'fuzzy' | 'synonym' }>();

    for (const token of expandedTokens) {
      const isSynonym = synonymTokens.has(token);
      const synonymFactor = isSynonym ? 0.5 : 1;
      const tokenIdf = this.idf(token);
      const allowFuzzy = !this.existsGlobally(token);

      for (const [id, entry] of this.docs) {
        if (candidateIds && !candidateIds.has(id)) continue;
        let weight = entry.tokens.get(token) ?? 0;
        let matched = false;

        if (weight === 0) {
          for (const [tok, w] of entry.tokens) {
            if (tok.startsWith(token) || (token.startsWith(tok) && tok.length >= token.length)) {
              weight = Math.max(weight, w * 0.6);
              matched = true;
            }
          }
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
            isSynonym ? 'synonym' : weight >= 100 ? 'exact' : weight >= 80 ? 'synonym' : 'fuzzy';
          const prev = scoreMap.get(id);
          if (prev) {
            prev.score += weight;
            if (rankOf(type) < rankOf(prev.bestType)) prev.bestType = type;
          } else {
            scoreMap.set(id, { score: weight, bestType: type });
          }
        }
      }
    }

    const results: ScoredDoc[] = [];
    for (const [id, { score, bestType }] of scoreMap) {
      results.push({ id, score, matchType: bestType });
    }
    results.sort((a, b) => b.score - a.score);
    return results;
  }

  /** Cuenta facets (ej. indicaciones) para chips dinámicos. */
  facetCounts(fKey: F): Map<string, number> {
    const counts = new Map<string, number>();
    for (const entry of this.docs.values()) {
      const set = entry.facets[fKey];
      if (set) for (const v of set) counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    return counts;
  }
}

function rankOf(type: 'exact' | 'fuzzy' | 'synonym'): number {
  return type === 'exact' ? 0 : type === 'synonym' ? 1 : 2;
}

function intersect<T>(a: Set<T>, b: Set<T>): Set<T> {
  const out = new Set<T>();
  for (const x of a) if (b.has(x)) out.add(x);
  return out;
}

/** Normaliza un valor de facet para comparación (reexporta normalize para
 *  conveniencia de los servicios consumidores). */
export { normalize };
