/**
 * Tests para inferSafety — inferencia de campos de seguridad desde advertencias.
 *
 * Verifica que el seeder marque correctamente los 6 campos de seguridad
 * (embarazo, lactancia, pediatria, hipertension, diabetes, celiacos)
 * según el texto de las advertencias.
 */

import { describe, it, expect } from 'vitest';
import { inferSafety } from '@/db/seeders';

describe('inferSafety', () => {
  it('devuelve objeto vacío sin advertencias', () => {
    expect(inferSafety()).toEqual({});
    expect(inferSafety([])).toEqual({});
  });

  it('marca embarazo como evitar por mención', () => {
    const safety = inferSafety(['Consultar en embarazo']);
    expect(safety.embarazo).toBe('evitar');
  });

  it('marca embarazo como contraindicado con término fuerte', () => {
    const safety = inferSafety(['Contraindicado en embarazo']);
    expect(safety.embarazo).toBe('contraindicado');
  });

  it('marca lactancia', () => {
    const safety = inferSafety(['Contraindicada en lactancia']);
    expect(safety.lactancia).toBe('contraindicado');
  });

  it('marca pediatría por "niños"', () => {
    const safety = inferSafety(['No usar en niños menores de 12 años']);
    expect(safety.pediatria).toBe('evitar');
  });

  it('marca hipertensión por interacción antihipertensiva', () => {
    const safety = inferSafety(['Puede interferir con antihipertensivos']);
    expect(safety.hipertension).toBe('evitar');
  });

  it('marca hipertensión por "tensión arterial"', () => {
    const safety = inferSafety(['Monitorear tensión arterial']);
    expect(safety.hipertension).toBe('evitar');
  });

  it('marca diabetes por "glucosa"', () => {
    const safety = inferSafety(['Controlar glucosa en sangre']);
    expect(safety.diabetes).toBe('evitar');
  });

  it('marca diabetes por "insulina"', () => {
    const safety = inferSafety(['Interacción con insulina']);
    expect(safety.diabetes).toBe('evitar');
  });

  it('marca celiacos por "gluten"', () => {
    const safety = inferSafety(['Contiene gluten']);
    expect(safety.celiacos).toBe('evitar');
  });

  it('detecta múltiples campos a la vez', () => {
    const safety = inferSafety([
      'Contraindicado en embarazo',
      'Controlar glucosa',
      'Interfiere con antihipertensivos',
    ]);
    expect(safety.embarazo).toBe('contraindicado');
    expect(safety.diabetes).toBe('evitar');
    expect(safety.hipertension).toBe('evitar');
    expect(safety.lactancia).toBeUndefined();
  });

  it('no marca campos no mencionados', () => {
    const safety = inferSafety(['Evitar en embarazo']);
    expect(safety.embarazo).toBe('evitar');
    expect(safety.celiacos).toBeUndefined();
    expect(safety.diabetes).toBeUndefined();
  });
});
