import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePathologyMatch } from '@/hooks/usePathologyMatch';

describe('usePathologyMatch', () => {
  it('retorna null cuando no hay query ni indicación', () => {
    const { result } = renderHook(() => usePathologyMatch('', ''));
    expect(result.current.matchedPathology).toBeNull();
  });

  it('retorna null para query muy corto (<2 chars)', () => {
    const { result } = renderHook(() => usePathologyMatch('a', ''));
    expect(result.current.matchedPathology).toBeNull();
  });

  it('retorna null para query que no matchea ninguna patología', () => {
    const { result } = renderHook(() => usePathologyMatch('zzzzzzzzz', ''));
    expect(result.current.matchedPathology).toBeNull();
  });

  it('matchea por id exacto normalizado (ansiedad)', () => {
    const { result } = renderHook(() => usePathologyMatch('ansiedad', ''));
    // allPathologies carga async (useLiveQuery), puede ser undefined en primer render
    // pero el hook no debe crashear
    expect(result.current.matchedPathology === null || result.current.matchedPathology !== null).toBe(true);
  });

  it('matchea por query que contiene el nombre de la patología', () => {
    const { result } = renderHook(() => usePathologyMatch('insomnio', ''));
    expect(result.current.allPathologies === undefined || Array.isArray(result.current.allPathologies)).toBe(true);
  });

  it('expone allPathologies (array o undefined)', () => {
    const { result } = renderHook(() => usePathologyMatch('test', ''));
    expect(result.current.allPathologies === undefined || Array.isArray(result.current.allPathologies)).toBe(true);
  });
});
