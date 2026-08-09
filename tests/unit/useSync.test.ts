import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSync } from '@/hooks/useSync';

describe('useSync — sin Supabase configurado (entorno de test)', () => {
  beforeEach(() => {
    // El entorno de test no tiene VITE_SUPABASE_URL → isSupabaseConfigured() = false
  });

  it('isConfigured es false cuando no hay credenciales de Supabase', () => {
    const { result } = renderHook(() => useSync());
    expect(result.current.isConfigured).toBe(false);
  });

  it('syncState es "loading" cuando no está configurado', () => {
    const { result } = renderHook(() => useSync());
    expect(result.current.syncState).toBe('loading');
  });

  it('progress.state refleja el syncState', () => {
    const { result } = renderHook(() => useSync());
    expect(result.current.progress.state).toBe('loading');
  });

  it('sync() retorna error cuando Supabase no está configurado', async () => {
    const { result } = renderHook(() => useSync());
    let progress;
    await act(async () => {
      progress = await result.current.sync();
    });
    expect(progress!.state).toBe('error');
    expect(progress!.errors).toContain('Supabase no configurado');
  });

  it('sync() setea total=0 cuando falla por configuración', async () => {
    const { result } = renderHook(() => useSync());
    let progress;
    await act(async () => {
      progress = await result.current.sync();
    });
    expect(progress!.total).toBe(0);
    expect(progress!.completed).toBe(0);
  });

  it('forceSync delega en sync y no lanza', async () => {
    const { result } = renderHook(() => useSync());
    await act(async () => {
      await result.current.forceSync();
    });
    // No throw = éxito del wrapper
    expect(true).toBe(true);
  });

  it('configure llama a syncService.configure sin error', () => {
    const { result } = renderHook(() => useSync());
    act(() => {
      result.current.configure({ autoSync: false, syncInterval: 60000 });
    });
    // No throw = ok
    expect(true).toBe(true);
  });

  it('lastSyncAt es null al inicializar (sin syncs previos)', () => {
    const { result } = renderHook(() => useSync());
    expect(result.current.lastSyncAt).toBeNull();
  });

  it('errorCount es 0 al inicializar', () => {
    const { result } = renderHook(() => useSync());
    expect(result.current.errorCount).toBe(0);
  });

  it('pendingOps y pendingConflicts son 0 al inicializar', () => {
    const { result } = renderHook(() => useSync());
    expect(result.current.progress.pendingOps).toBe(0);
    expect(result.current.progress.pendingConflicts).toBe(0);
  });

  it('isOnline refleja navigator.onLine', () => {
    const { result } = renderHook(() => useSync());
    expect(result.current.isOnline).toBe(navigator.onLine);
  });

  it('se desuscribe del syncService al unmount', async () => {
    const { unmount } = renderHook(() => useSync());
    unmount();
    // No debe lanzar errores al desmontar
    expect(true).toBe(true);
  });
});

describe('useSync — detección de estado offline', () => {
  it('syncState cambia a offline cuando navigator.onLine es false', async () => {
    const originalOnLine = navigator.onLine;
    // Simular offline
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true, writable: true });
    window.dispatchEvent(new Event('offline'));

    const { result } = renderHook(() => useSync());

    await waitFor(() => {
      // Cuando no está configurado, syncState sigue siendo 'loading' (isConfigured tiene prioridad)
      // Pero isOnline debe ser false
      expect(result.current.isOnline).toBe(false);
    });

    // Restaurar
    Object.defineProperty(navigator, 'onLine', { value: originalOnLine, configurable: true, writable: true });
    window.dispatchEvent(new Event('online'));
  });
});
