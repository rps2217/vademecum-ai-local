import { describe, it, expect } from 'vitest';
import { buildHighlightTerms } from '@/lib/highlightTerms';

describe('buildHighlightTerms', () => {
  it('devuelve array vacío para indicación vacía', () => {
    expect(buildHighlightTerms('')).toEqual([]);
    expect(buildHighlightTerms(null)).toEqual([]);
    expect(buildHighlightTerms(undefined)).toEqual([]);
  });

  it('usa sinónimos del mapa para indicaciones conocidas', () => {
    const terms = buildHighlightTerms('ansiedad');
    expect(terms).toContain('ansiedad');
    expect(terms).toContain('ansiolítico');
    expect(terms).toContain('GABA');
    expect(terms).toContain('sedante');
  });

  it('incluye el término literal y su versión sin acentos', () => {
    const terms = buildHighlightTerms('estrés');
    expect(terms).toContain('estrés');
    expect(terms).toContain('estres');
  });

  it('divide indicaciones compuestas en palabras individuales', () => {
    const terms = buildHighlightTerms('dolor muscular');
    expect(terms).toContain('dolor');
    expect(terms).toContain('muscular');
  });

  it('no duplica términos', () => {
    const terms = buildHighlightTerms('insomnio');
    const unique = new Set(terms);
    expect(terms.length).toBe(unique.size);
  });

  it('funciona con indicaciones no mapeadas (fallback)', () => {
    const terms = buildHighlightTerms('quelanteno_raro_xyz');
    expect(terms).toContain('quelanteno_raro_xyz');
  });

  it('filtra palabras muy cortas (< 4 chars) al dividir', () => {
    const terms = buildHighlightTerms('dolor de cabeza');
    // 'dolor' (5) y 'cabeza' (6) se incluyen, 'de' (2) no
    expect(terms).toContain('dolor');
    expect(terms).toContain('cabeza');
    expect(terms).not.toContain('de');
  });
});
