import { describe, it, expect } from 'vitest';
import {
  hasHomeopathicSuffix,
  extractHomeopathicBase,
  resolveHomeopathic,
} from '../../scripts/homeopathic-utils.cjs';

const kb = new Map([
  ['pasiflora', { id: 'pasiflora', nombre: 'Pasiflora', sinonimos: [], nombresAlternativos: ['Passiflora incarnata', 'Passionflower'] }],
  ['apis_mellifica', { id: 'apis_mellifica', nombre: 'Apis Mellifica', sinonimos: [], nombresAlternativos: ['Apis'] }],
  ['china_officinalis', { id: 'china_officinalis', nombre: 'China Officinalis', sinonimos: [], nombresAlternativos: ['Cinchona officinalis', 'China'] }],
  ['pulsatilla', { id: 'pulsatilla', nombre: 'Pulsatilla', sinonimos: [], nombresAlternativos: ['Anemone pulsatilla'] }],
  ['vitamina_d3', { id: 'vitamina_d3', nombre: 'Vitamina D3', sinonimos: [], nombresAlternativos: ['Colecalciferol'] }],
]);

describe('hasHomeopathicSuffix', () => {
  it('detecta diluciones decimales D{n}', () => {
    expect(hasHomeopathicSuffix('Passiflora D3')).toBe(true);
    expect(hasHomeopathicSuffix('Sulfur D12')).toBe(true);
    expect(hasHomeopathicSuffix('Arnica D30')).toBe(true);
  });

  it('detecta diluciones centesimales C{n}', () => {
    expect(hasHomeopathicSuffix('Apis C6')).toBe(true);
    expect(hasHomeopathicSuffix('Pulsatilla C30')).toBe(true);
    expect(hasHomeopathicSuffix('Aurum C200')).toBe(true);
  });

  it('detecta diluciones CH{n}', () => {
    expect(hasHomeopathicSuffix('Belladonna CH9')).toBe(true);
    expect(hasHomeopathicSuffix('Nux Vomica CH30')).toBe(true);
  });

  it('detecta tintura madre T.M.', () => {
    expect(hasHomeopathicSuffix('Passiflora T.M.')).toBe(true);
    expect(hasHomeopathicSuffix('Passiflora T.M')).toBe(true);
    expect(hasHomeopathicSuffix('Calendula TM')).toBe(true);
  });

  it('NO detecta vitaminas como homeopáticas', () => {
    expect(hasHomeopathicSuffix('Vitamina D3')).toBe(false);
    expect(hasHomeopathicSuffix('Vitamina C')).toBe(false);
    expect(hasHomeopathicSuffix('Vitamina B12')).toBe(false);
  });

  it('NO detecta textos sin dilución', () => {
    expect(hasHomeopathicSuffix('Pasiflora')).toBe(false);
    expect(hasHomeopathicSuffix('Ácido ascórbico')).toBe(false);
    expect(hasHomeopathicSuffix('')).toBe(false);
    expect(hasHomeopathicSuffix(null)).toBe(false);
  });
});

describe('extractHomeopathicBase', () => {
  it('extrae nombre base de diluciones D', () => {
    expect(extractHomeopathicBase('Passiflora D3')).toBe('Passiflora');
    expect(extractHomeopathicBase('Sulfur D30')).toBe('Sulfur');
  });

  it('extrae nombre base de diluciones C', () => {
    expect(extractHomeopathicBase('Apis C6')).toBe('Apis');
    expect(extractHomeopathicBase('Pulsatilla C200')).toBe('Pulsatilla');
  });

  it('extrae nombre base de tintura madre', () => {
    expect(extractHomeopathicBase('Passiflora T.M.')).toBe('Passiflora');
    expect(extractHomeopathicBase('Passiflora T.M')).toBe('Passiflora');
  });

  it('preserva nombres multi-palabra', () => {
    expect(extractHomeopathicBase('Cinchona Officinalis C9')).toBe('Cinchona Officinalis');
    expect(extractHomeopathicBase('Lycopodium Clavatum D30')).toBe('Lycopodium Clavatum');
  });

  it('no modifica textos sin dilución', () => {
    expect(extractHomeopathicBase('Pasiflora')).toBe('Pasiflora');
  });
});

describe('resolveHomeopathic', () => {
  it('resuelve por ID exacto', () => {
    const res = resolveHomeopathic('Pulsatilla D12', kb);
    expect(res).not.toBeNull();
    expect(res.ingredientId).toBe('pulsatilla');
    expect(res.score).toBe(100);
    expect(res.base).toBe('Pulsatilla');
  });

  it('resuelve por sinónimo (nombresAlternativos)', () => {
    const res = resolveHomeopathic('Apis C6', kb);
    expect(res).not.toBeNull();
    expect(res.ingredientId).toBe('apis_mellifica');
    expect(res.score).toBe(96);
  });

  it('resuelve Cinchona Officinalis → china_officinalis', () => {
    const res = resolveHomeopathic('Cinchona Officinalis C9', kb);
    expect(res).not.toBeNull();
    expect(res.ingredientId).toBe('china_officinalis');
  });

  it('NO resuelve Vitamina D3 (no es homeopático)', () => {
    const res = resolveHomeopathic('Vitamina D3', kb);
    expect(res).toBeNull();
  });

  it('devuelve null para ingredientes que no están en la KB', () => {
    const res = resolveHomeopathic('Coffea D200', kb);
    expect(res).toBeNull();
  });

  it('devuelve null para textos sin sufijo homeopático', () => {
    expect(resolveHomeopathic('Pasiflora', kb)).toBeNull();
    expect(resolveHomeopathic('Ácido ascórbico', kb)).toBeNull();
  });
});
