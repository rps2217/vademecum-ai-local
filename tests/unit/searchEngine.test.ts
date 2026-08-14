import { describe, it, expect } from 'vitest';
import { InvertedIndex, buildTokens } from '@/core/search/searchEngine';

describe('searchEngine — buildTokens', () => {
  it('tokeniza con bigramas y pesos', () => {
    const tokens = buildTokens('Dolor de cabeza', 100);
    // bigramas: "dolor cabeza" (stopword "de" se elimina antes)
    expect(tokens.has('dolor')).toBe(true);
    expect(tokens.has('cabeza')).toBe(true);
    expect(tokens.has('dolor cabeza')).toBe(true);
  });

  it('descarta tokens de 1 char', () => {
    const tokens = buildTokens('D-Manosa', 50);
    expect(tokens.has('d')).toBe(false);
    expect(tokens.has('manosa')).toBe(true);
  });

  it('respeta el peso dado', () => {
    const tokens = buildTokens('valeriana', 100);
    expect(tokens.get('valeriana')).toBe(100);
  });
});

describe('searchEngine — InvertedIndex', () => {
  type Facet = 'cat' | 'ind';

  function makeIndex(): InvertedIndex<Facet> {
    const idx = new InvertedIndex<Facet>();
    idx.add({
      id: 'valeriana',
      tokens: new Map([['valeriana', 100], ['insomnio', 40]]),
      facets: { cat: new Set(['fitoterapia']), ind: new Set(['insomnio']) },
    });
    idx.add({
      id: 'magnesio',
      tokens: new Map([['magnesio', 100], ['ansiedad', 40]]),
      facets: { cat: new Set(['mineral']), ind: new Set(['ansiedad']) },
    });
    return idx;
  }

  it('rankea por texto y devuelve score descendente', () => {
    const idx = makeIndex();
    const r = idx.rank({ query: 'valeriana' });
    expect(r[0].id).toBe('valeriana');
    expect(r.length).toBe(1);
  });

  it('fuzzy: "valerina" → valeriana', () => {
    const idx = makeIndex();
    const r = idx.rank({ query: 'valerina' });
    expect(r.some((x) => x.id === 'valeriana')).toBe(true);
  });

  it('prefix: "mag" → magnesio', () => {
    const idx = makeIndex();
    const r = idx.rank({ query: 'mag' });
    expect(r.some((x) => x.id === 'magnesio')).toBe(true);
  });

  it('filtro por facet: cat=mineral', () => {
    const idx = makeIndex();
    const r = idx.rank({ facets: { cat: 'mineral' } });
    expect(r.length).toBe(1);
    expect(r[0].id).toBe('magnesio');
  });

  it('filtro por facet + query combinados', () => {
    const idx = makeIndex();
    const r = idx.rank({ query: 'magnesio', facets: { cat: 'fitoterapia' } });
    // magnesio es mineral, no fitoterapia → no debe aparecer
    expect(r.length).toBe(0);
  });

  it('sin query ni facets devuelve todos', () => {
    const idx = makeIndex();
    const r = idx.rank({});
    expect(r.length).toBe(2);
  });

  it('IDF: tokens raros pesan más que comunes', () => {
    const idx = new InvertedIndex();
    // 'comun' aparece en 3 docs, 'raro' en 1
    for (const id of ['a', 'b', 'c']) {
      idx.add({ id, tokens: new Map([['comun', 50]]), facets: {} });
    }
    idx.add({ id: 'd', tokens: new Map([['raro', 50]]), facets: {} });
    const idfComun = idx.idf('comun');
    const idfRaro = idx.idf('raro');
    expect(idfRaro).toBeGreaterThan(idfComun);
  });

  it('remove desindexa y ajusta DF', () => {
    const idx = makeIndex();
    idx.remove('valeriana');
    expect(idx.size).toBe(1);
    // 'valeriana' ya no existe globalmente → existsGlobally false
    expect(idx.existsGlobally('valeriana')).toBe(false);
  });

  it('facetCounts cuenta valores por facet', () => {
    const idx = makeIndex();
    const counts = idx.facetCounts('cat');
    expect(counts.get('fitoterapia')).toBe(1);
    expect(counts.get('mineral')).toBe(1);
  });

  it('synonyms expansion: muelas → dental (via text.ts QUERY_SYNONYMS)', () => {
    // Este test verifica que el motor delega la expansión en expandQueryTokens.
    const idx = new InvertedIndex();
    idx.add({ id: 'dental-ing', tokens: new Map([['dental', 100]]), facets: {} });
    // 'muelas' se expande a ['dental', 'dolor dental', 'bucal'] via QUERY_SYNONYMS
    const r = idx.rank({ query: 'muelas' });
    expect(r.some((x) => x.id === 'dental-ing')).toBe(true);
  });
});
