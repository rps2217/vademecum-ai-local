/**
 * useSearchResults — Debounce + búsqueda unificada de ingredientes y productos
 *
 * Extraído de SearchPage.tsx (hallazgo 5.7). Encapsula:
 * - Debounce único (150ms) de la consulta de texto
 * - Búsqueda de ingredientes (ingredientSearchService.searchSync)
 * - Búsqueda de productos (productSearchService.searchSync)
 * - Estado de paginación + reset automático al cambiar búsqueda/filtros
 *
 * El componente mantiene el sorting (sortedResults) y el slicing
 * (visibleResults = sortedResults.slice(0, visibleCount)).
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ingredientSearchService,
  useSearchIndex,
  productSearchService,
  useProductIndex,
  synergySearchService,
  useSynergyIndex,
  type SearchResult,
  type ProductSearchResult,
  type SynergySearchResult,
} from '@/core/search';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import type { DbProtocol, DbPathology, IngredientCategory } from '@/db/schema';
import type { BodySystem } from '@/types/shared-enums';
import type { EvidenceLevel } from '@/ui/searchConfig';
import { RESULTS_PAGE_SIZE } from '@/ui/searchConfig';
import { normalize, tokenize } from '@/lib/text';
import { logger } from '@/lib/logger';

export interface SearchFilters {
  category: string;
  indication: string;
  system: BodySystem | '';
  evidence: EvidenceLevel | '';
}

export function useSearchResults(query: string, filters: SearchFilters) {
  const { ready } = useSearchIndex();
  const { ready: productsReady } = useProductIndex();
  const { ready: synergiesReady } = useSynergyIndex();
  const { category, indication, system, evidence } = filters;

  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [visibleCount, setVisibleCount] = useState(RESULTS_PAGE_SIZE);
  const [visibleProductCount, setVisibleProductCount] = useState(RESULTS_PAGE_SIZE);
  const [visibleSynergyCount, setVisibleSynergyCount] = useState(RESULTS_PAGE_SIZE);
  const [visibleProtocolCount, setVisibleProtocolCount] = useState(RESULTS_PAGE_SIZE);
  const [visiblePathologyCount, setVisiblePathologyCount] = useState(RESULTS_PAGE_SIZE);

  const allProtocols = useLiveQuery(
    () => db.protocols.where('tombstone').equals(0).toArray(),
    []
  );

  const allPathologies = useLiveQuery(
    () => db.pathologies.toArray(),
    []
  );

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 150);
    return () => clearTimeout(t);
  }, [query]);

  const isSearching = query !== debouncedQuery;

  // 1. Ingredientes
  const results = useMemo<SearchResult[]>(() => {
    if (!ready) return [];
    try {
      return ingredientSearchService.searchSync({
        query: debouncedQuery.length >= 2 ? debouncedQuery : undefined,
        category: (category || undefined) as IngredientCategory | undefined,
        system: (system || undefined) as BodySystem | undefined,
        evidenceLevel: (evidence || undefined) as 'A' | 'B' | 'C' | 'D' | undefined,
        indication: indication || undefined,
      });
    } catch (error) {
      logger.error('Search error:', error);
      return [];
    }
  }, [debouncedQuery, category, indication, system, evidence, ready]);

  // 2. Productos
  const productResults = useMemo<ProductSearchResult[]>(() => {
    if (!productsReady) return [];
    try {
      return productSearchService.searchSync(debouncedQuery.length >= 2 ? debouncedQuery : undefined);
    } catch (error) {
      logger.error('Product search error:', error);
      return [];
    }
  }, [debouncedQuery, productsReady]);

  // 3. Sinergias e interacciones
  const synergyResults = useMemo<SynergySearchResult[]>(() => {
    if (!synergiesReady) return [];
    if (debouncedQuery.trim().length < 2) return [];
    try {
      return synergySearchService.searchSync({
        query: debouncedQuery,
        evidencia: evidence || undefined,
      });
    } catch (error) {
      logger.error('Synergy search error:', error);
      return [];
    }
  }, [debouncedQuery, evidence, synergiesReady]);

  // 4. Protocolos clínicos
  const protocolResults = useMemo<DbProtocol[]>(() => {
    if (!allProtocols || debouncedQuery.trim().length < 2) return [];
    const tokens = tokenize(debouncedQuery);
    if (tokens.length === 0) return [];
    const norm = normalize(debouncedQuery);

    return allProtocols.filter((p) => {
      const pNorm = normalize(`${p.nombre} ${p.objetivo} ${p.ingredientes.map(i => i.id).join(' ')}`);
      return tokens.some((t) => pNorm.includes(t)) || pNorm.includes(norm);
    });
  }, [allProtocols, debouncedQuery]);

  // 5. Patologías clínicas
  const pathologyResults = useMemo<DbPathology[]>(() => {
    if (!allPathologies || debouncedQuery.trim().length < 2) return [];
    const tokens = tokenize(debouncedQuery);
    if (tokens.length === 0) return [];
    const norm = normalize(debouncedQuery);

    return allPathologies.filter((p) => {
      if (normalize(p.id).includes(norm) || normalize(p.nombre).includes(norm)) return true;
      const fullText = normalize(`${p.nombre} ${(p.sintomas || []).join(' ')} ${(p.sistemas || []).join(' ')}`);
      return tokens.some((t) => fullText.includes(t));
    });
  }, [allPathologies, debouncedQuery]);

  // Reset de paginación al cambiar búsqueda o filtros
  const searchKey = `${debouncedQuery}|${category}|${indication}|${system}|${evidence}`;
  const [prevSearchKey, setPrevSearchKey] = useState(searchKey);
  if (searchKey !== prevSearchKey) {
    setPrevSearchKey(searchKey);
    setVisibleCount(RESULTS_PAGE_SIZE);
    setVisibleProductCount(RESULTS_PAGE_SIZE);
    setVisibleSynergyCount(RESULTS_PAGE_SIZE);
    setVisibleProtocolCount(RESULTS_PAGE_SIZE);
    setVisiblePathologyCount(RESULTS_PAGE_SIZE);
  }

  const loadMore = useCallback(() => {
    setVisibleCount((c) => c + RESULTS_PAGE_SIZE);
  }, []);

  const loadMoreProducts = useCallback(() => {
    setVisibleProductCount((c) => c + RESULTS_PAGE_SIZE);
  }, []);

  const loadMoreSynergies = useCallback(() => {
    setVisibleSynergyCount((c) => c + RESULTS_PAGE_SIZE);
  }, []);

  const loadMoreProtocols = useCallback(() => {
    setVisibleProtocolCount((c) => c + RESULTS_PAGE_SIZE);
  }, []);

  const loadMorePathologies = useCallback(() => {
    setVisiblePathologyCount((c) => c + RESULTS_PAGE_SIZE);
  }, []);

  const totalCounts = useMemo(() => {
    const ing = results.length;
    const prod = productResults.length;
    const syn = synergyResults.length;
    const prot = protocolResults.length;
    const path = pathologyResults.length;
    return {
      total: ing + prod + syn + prot + path,
      ingredients: ing,
      products: prod,
      synergies: syn,
      protocols: prot,
      pathologies: path,
    };
  }, [results.length, productResults.length, synergyResults.length, protocolResults.length, pathologyResults.length]);

  return {
    debouncedQuery,
    results,
    productResults,
    synergyResults,
    protocolResults,
    pathologyResults,
    isSearching,
    visibleCount,
    visibleProductCount,
    visibleSynergyCount,
    visibleProtocolCount,
    visiblePathologyCount,
    loadMore,
    loadMoreProducts,
    loadMoreSynergies,
    loadMoreProtocols,
    loadMorePathologies,
    totalCounts,
  };
}
