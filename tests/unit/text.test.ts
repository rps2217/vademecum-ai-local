/**
 * Tests para utilidades de normalización de texto.
 *
 * Verifica que las búsquedas coincidan sin importar acentos/mayúsculas
 * y que las indicaciones se muestren con ortografía canónica.
 */

import { describe, it, expect } from 'vitest';
import {
  normalize,
  tokenize,
  canonicalIndication,
  normalizeIndications,
  expandQueryTokens,
} from '@/lib/text';

describe('normalize', () => {
  it('quita acentos y pasa a minúsculas', () => {
    expect(normalize('Estrés')).toBe('estres');
    expect(normalize('ADIPOSIDAD')).toBe('adiposidad');
    expect(normalize('Ñandú')).toBe('nandu');
  });

  it('recorta espacios', () => {
    expect(normalize('  hola  ')).toBe('hola');
  });

  it('preserva números y símbolos', () => {
    expect(normalize('Omega-3')).toBe('omega-3');
  });
});

describe('tokenize', () => {
  it('divide por espacios, guiones y signos de puntuación', () => {
    expect(tokenize('ansiedad, estres; fatiga')).toEqual(['ansiedad', 'estres', 'fatiga']);
    expect(tokenize('omega-3')).toEqual(['omega', '3']);
  });

  it('descarta tokens vacíos', () => {
    expect(tokenize('  , ,  ')).toEqual([]);
  });

  it('filtra stopwords en consultas (isQuery=true por defecto)', () => {
    expect(tokenize('dolor de muelas')).toEqual(['dolor', 'muelas']);
    expect(tokenize('el ansiedad y la fatiga')).toEqual(['ansiedad', 'fatiga']);
  });

  it('no filtra stopwords al indexar (isQuery=false)', () => {
    expect(tokenize('dolor de muelas', false)).toEqual(['dolor', 'de', 'muelas']);
  });
});

describe('canonicalIndication', () => {
  it('mapea variantes sin acento a la forma canónica', () => {
    expect(canonicalIndication('depresion')).toBe('depresión');
    expect(canonicalIndication('ESTRES')).toBe('estrés');
    expect(canonicalIndication('digestion')).toBe('digestión');
  });

  it('mapea indicaciones compuestas sin acento a la forma canónica', () => {
    expect(canonicalIndication('dolor dental')).toBe('dolor dental');
    expect(canonicalIndication('DOLOR_DENTAL')).toBe('dolor dental');
    expect(canonicalIndication('disfuncion erectil')).toBe('disfunción eréctil');
    expect(canonicalIndication('ojo seco')).toBe('ojo seco');
  });

  it('devuelve el texto original si no está en el mapa', () => {
    expect(canonicalIndication('termo desconocida')).toBe('termo desconocida');
  });
});

describe('normalizeIndications', () => {
  it('elimina duplicados canónicos', () => {
    const result = normalizeIndications(['depresion', 'depresión', 'Depresion']);
    expect(result).toEqual(['depresión']);
  });

  it('ordena alfabéticamente en español', () => {
    const result = normalizeIndications(['inflamacion', 'ansiedad', 'estres']);
    expect(result).toEqual(['ansiedad', 'estrés', 'inflamación']);
  });

  it('canonicaliza cada indicación', () => {
    const result = normalizeIndications(['fatiga', 'estres']);
    expect(result).toContain('estrés');
    expect(result).toContain('fatiga');
  });

  it('devuelve array vacío para entrada vacía', () => {
    expect(normalizeIndications([])).toEqual([]);
  });
});

describe('expandQueryTokens', () => {
  it('expande "muelas" a sinónimos dentales', () => {
    const result = expandQueryTokens(['muelas']);
    expect(result).toContain('dental');
    expect(result).toContain('dolor dental');
    expect(result).toContain('bucal');
  });

  it('preserva los tokens originales antes que los sinónimos', () => {
    const result = expandQueryTokens(['dolor', 'muelas']);
    // Los tokens originales van primero
    expect(result.slice(0, 2)).toEqual(['dolor', 'muelas']);
    // Los sinónimos van después
    expect(result.length).toBeGreaterThan(2);
    expect(result.slice(2)).toContain('dental');
  });

  it('no duplica sinónimos ya presentes', () => {
    // 'dolor' está en los tokens originales; los sinónimos de 'muelas'
    // incluyen 'dolor dental' (distinto) pero no deberían duplicar 'dolor'
    const result = expandQueryTokens(['dolor', 'muelas']);
    const counts = result.reduce<Record<string, number>>((acc, t) => {
      acc[t] = (acc[t] ?? 0) + 1;
      return acc;
    }, {});
    for (const [tok, n] of Object.entries(counts)) {
      expect(n, `token duplicado: ${tok}`).toBe(1);
    }
  });

  it('no expande tokens sin sinónimos', () => {
    const result = expandQueryTokens(['omega']);
    expect(result).toEqual(['omega']);
  });

  it('expande varios términos de la consulta', () => {
    const result = expandQueryTokens(['dolor', 'muelas']);
    // Debe incluir sinónimos de muelas
    expect(result.some((t) => t === 'dental')).toBe(true);
    expect(result.some((t) => t === 'bucal')).toBe(true);
  });
});
