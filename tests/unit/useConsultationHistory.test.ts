import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConsultationHistory } from '@/hooks/useConsultationHistory';

const STORAGE_KEY = 'vademecum-consultation-history';

describe('useConsultationHistory', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('inicializa vacío cuando no hay historial previo', () => {
    const { result } = renderHook(() => useConsultationHistory());
    expect(result.current.history).toEqual([]);
  });

  it('inicializa desde sessionStorage si hay datos previos', () => {
    const prev = [{ id: 'abc', query: 'valeriana', timestamp: 1000 }];
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(prev));
    const { result } = renderHook(() => useConsultationHistory());
    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].query).toBe('valeriana');
  });

  it('ignora sessionStorage corrupto y retorna array vacío', () => {
    sessionStorage.setItem(STORAGE_KEY, '{not valid json');
    const { result } = renderHook(() => useConsultationHistory());
    expect(result.current.history).toEqual([]);
  });

  it('ignora sessionStorage con estructura no-array', () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ not: 'an array' }));
    const { result } = renderHook(() => useConsultationHistory());
    expect(result.current.history).toEqual([]);
  });

  it('addEntry agrega el término al inicio del historial', () => {
    const { result } = renderHook(() => useConsultationHistory());
    act(() => result.current.addEntry('magnesio'));
    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].query).toBe('magnesio');
  });

  it('addEntry ignora strings vacíos', () => {
    const { result } = renderHook(() => useConsultationHistory());
    act(() => result.current.addEntry(''));
    expect(result.current.history).toEqual([]);
  });

  it('addEntry ignora strings de un solo carácter', () => {
    const { result } = renderHook(() => useConsultationHistory());
    act(() => result.current.addEntry('a'));
    expect(result.current.history).toEqual([]);
  });

  it('addEntry recorta espacios del término', () => {
    const { result } = renderHook(() => useConsultationHistory());
    act(() => result.current.addEntry('  valeriana  '));
    expect(result.current.history[0].query).toBe('valeriana');
  });

  it('addEntry no duplica el último término consecutivo', () => {
    const { result } = renderHook(() => useConsultationHistory());
    act(() => result.current.addEntry('ashwagandha'));
    act(() => result.current.addEntry('ashwagandha'));
    expect(result.current.history).toHaveLength(1);
  });

  it('addEntry elimina duplicados previos al re-agregar un término', () => {
    const { result } = renderHook(() => useConsultationHistory());
    act(() => result.current.addEntry('valeriana'));
    act(() => result.current.addEntry('magnesio'));
    act(() => result.current.addEntry('valeriana'));
    expect(result.current.history).toHaveLength(2);
    expect(result.current.history[0].query).toBe('valeriana');
    expect(result.current.history[1].query).toBe('magnesio');
  });

  it('addEntry respeta el máximo de 12 entradas', () => {
    const { result } = renderHook(() => useConsultationHistory());
    act(() => {
      for (let i = 0; i < 15; i++) {
        result.current.addEntry(`termino-${i}`);
      }
    });
    expect(result.current.history).toHaveLength(12);
    // El más reciente al inicio
    expect(result.current.history[0].query).toBe('termino-14');
  });

  it('addEntry persiste en sessionStorage', () => {
    const { result } = renderHook(() => useConsultationHistory());
    act(() => result.current.addEntry('hiperico'));
    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY)!);
    expect(stored).toHaveLength(1);
    expect(stored[0].query).toBe('hiperico');
  });

  it('clearHistory vacía el historial y el sessionStorage', () => {
    const { result } = renderHook(() => useConsultationHistory());
    act(() => result.current.addEntry('valeriana'));
    act(() => result.current.clearHistory());
    expect(result.current.history).toEqual([]);
    expect(sessionStorage.getItem(STORAGE_KEY)).toBe('[]');
  });

  it('sincroniza entre hooks vía evento personalizado', () => {
    const { result: a } = renderHook(() => useConsultationHistory());
    const { result: b } = renderHook(() => useConsultationHistory());

    act(() => a.current.addEntry('pasiflora'));
    // Tras el dispatch, b debería ver la actualización
    expect(b.current.history).toHaveLength(1);
    expect(b.current.history[0].query).toBe('pasiflora');
  });
});
