/**
 * Tests para buildPosologia — construcción del string de posología
 * desde los campos de dosis del JSON según la categoría.
 */

import { describe, it, expect } from 'vitest';
import { buildPosologia } from '@/db/seeders';

describe('buildPosologia', () => {
  it('devuelve undefined si no hay campos de dosis', () => {
    expect(buildPosologia({ id: 'x', nombre: 'X', categoria: 'fitoterapia' })).toBeUndefined();
  });

  it('combina dosis diaria y máxima para vitaminas/minerales', () => {
    const result = buildPosologia({
      id: 'vitc',
      nombre: 'Vitamina C',
      categoria: 'vitamina',
      dosisDiaria: '75-90mg/dia (RDA)',
      dosisMaxima: '2000mg/dia',
    });
    expect(result).toBe('Dosis diaria: 75-90mg/dia (RDA) · Dosis máxima: 2000mg/dia');
  });

  it('combina dilución y vías para aceites esenciales', () => {
    const result = buildPosologia({
      id: 'lavanda',
      nombre: 'Lavanda',
      categoria: 'aceite_esencial',
      dilucionRecomendada: '1-3% para piel',
      metodosUso: ['difusion', 'topico'],
    });
    expect(result).toBe('Dilución: 1-3% para piel · Vías: difusion, topico');
  });

  it('incluye diluciones CH para homeopatía', () => {
    const result = buildPosologia({
      id: 'aconitum',
      nombre: 'Aconitum',
      categoria: 'homeopatia',
      dilucionesCH: [5, 7, 9],
    });
    expect(result).toBe('Diluciones CH: 5, 7, 9');
  });

  it('combina parte usada, tiempo y duración para fitoterapia', () => {
    const result = buildPosologia({
      id: 'valeriana',
      nombre: 'Valeriana',
      categoria: 'fitoterapia',
      parteUsada: 'raiz',
      tiempoEfecto: '30-60 minutos',
      duracionTratamiento: '2-4 semanas',
    });
    expect(result).toBe('Parte usada: raiz · Tiempo de efecto: 30-60 minutos · Duración: 2-4 semanas');
  });

  it('combina todos los campos disponibles en una categoría mixta', () => {
    const result = buildPosologia({
      id: 'complex',
      nombre: 'Complex',
      categoria: 'vitamina',
      dosisDiaria: '100mg/dia',
      parteUsada: 'hoja',
      tiempoEfecto: '1 hora',
    });
    expect(result).toBe('Dosis diaria: 100mg/dia · Parte usada: hoja · Tiempo de efecto: 1 hora');
  });
});
