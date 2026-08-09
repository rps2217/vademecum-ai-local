/**
 * Tests para utilidades de normalización de texto.
 *
 * Verifica que las búsquedas coincidan sin importar acentos/mayúsculas
 * y que las indicaciones se muestren con ortografía canónica.
 */

import { describe, it, expect } from 'vitest';
import { normalize, tokenize, canonicalIndication, normalizeIndications } from '@/lib/text';

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
});

describe('canonicalIndication', () => {
  it('mapea variantes sin acento a la forma canónica', () => {
    expect(canonicalIndication('depresion')).toBe('depresión');
    expect(canonicalIndication('ESTRES')).toBe('estrés');
    expect(canonicalIndication('digestion')).toBe('digestión');
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
