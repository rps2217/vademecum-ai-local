import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSearchResults } from '@/hooks/useSearchResults';

vi.useFakeTimers();

describe('useSearchResults', () => {
  it('retorna arrays vacíos antes de que el índice esté listo', () => {
    const { result } = renderHook(() =>
      useSearchResults('', { category: '', indication: '', system: '', evidence: '' }),
    );
    expect(result.current.results).toEqual([]);
    expect(result.current.productResults).toEqual([]);
    expect(result.current.isSearching).toBe(false);
  });

  it('isSearching es true mientras el debounce no ha aplicado', () => {
    const { result, rerender } = renderHook(
      ({ q }) => useSearchResults(q, { category: '', indication: '', system: '', evidence: '' }),
      { initialProps: { q: '' } },
    );
    expect(result.current.isSearching).toBe(false);

    // Cambiar query dispara isSearching=true hasta que el debounce aplique
    rerender({ q: 'valeriana' });
    expect(result.current.isSearching).toBe(true);

    // Tras 150ms, el debounce aplica
    act(() => { vi.advanceTimersByTime(150); });
    expect(result.current.isSearching).toBe(false);
  });

  it('no busca con query de menos de 2 chars', () => {
    const { result } = renderHook(() =>
      useSearchResults('v', { category: '', indication: '', system: '', evidence: '' }),
    );
    act(() => { vi.advanceTimersByTime(150); });
    expect(result.current.results).toEqual([]);
  });

  it('expone paginación inicial y loadMore callbacks', () => {
    const { result } = renderHook(() =>
      useSearchResults('', { category: '', indication: '', system: '', evidence: '' }),
    );
    expect(typeof result.current.visibleCount).toBe('number');
    expect(typeof result.current.visibleProductCount).toBe('number');
    expect(typeof result.current.loadMore).toBe('function');
    expect(typeof result.current.loadMoreProducts).toBe('function');
  });

  it('loadMore incrementa visibleCount', () => {
    const { result } = renderHook(() =>
      useSearchResults('', { category: '', indication: '', system: '', evidence: '' }),
    );
    const initial = result.current.visibleCount;
    act(() => { result.current.loadMore(); });
    expect(result.current.visibleCount).toBe(initial + 12); // RESULTS_PAGE_SIZE = 24
  });

  it('loadMoreProducts incrementa visibleProductCount', () => {
    const { result } = renderHook(() =>
      useSearchResults('', { category: '', indication: '', system: '', evidence: '' }),
    );
    const initial = result.current.visibleProductCount;
    act(() => { result.current.loadMoreProducts(); });
    expect(result.current.visibleProductCount).toBe(initial + 12);
  });
});
