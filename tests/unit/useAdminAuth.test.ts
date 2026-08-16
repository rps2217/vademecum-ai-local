import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

describe('useAdminAuth', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('inicia sin PIN configurado y desbloqueado=false', () => {
    const { result } = renderHook(() => useAdminAuth());
    expect(result.current.hasAdminPin).toBe(false);
    expect(result.current.isAdminUnlocked).toBe(false);
  });

  it('setAdminPin hashea y guarda el PIN en localStorage', async () => {
    const { result } = renderHook(() => useAdminAuth());
    await act(async () => {
      await result.current.setAdminPin('1234');
    });
    expect(result.current.hasAdminPin).toBe(true);
    expect(result.current.isAdminUnlocked).toBe(true);
    expect(localStorage.getItem('vademecum_admin_pin')).toBeTruthy();
    expect(sessionStorage.getItem('vademecum_admin_session')).toBe('1');
  });

  it('setAdminPin rechaza PINs de menos de 4 dígitos', async () => {
    const { result } = renderHook(() => useAdminAuth());
    await expect(act(async () => {
      await result.current.setAdminPin('12');
    })).rejects.toThrow('al menos 4');
    expect(result.current.hasAdminPin).toBe(false);
  });

  it('unlockAdmin devuelve false con PIN incorrecto', async () => {
    const { result } = renderHook(() => useAdminAuth());
    await act(async () => {
      await result.current.setAdminPin('1234');
    });
    // Lock session
    act(() => result.current.lockAdmin());
    expect(result.current.isAdminUnlocked).toBe(false);

    await act(async () => {
      const ok = await result.current.unlockAdmin('9999');
      expect(ok).toBe(false);
    });
    expect(result.current.isAdminUnlocked).toBe(false);
  });

  it('unlockAdmin devuelve true con PIN correcto', async () => {
    const { result } = renderHook(() => useAdminAuth());
    await act(async () => {
      await result.current.setAdminPin('1234');
    });
    act(() => result.current.lockAdmin());

    await act(async () => {
      const ok = await result.current.unlockAdmin('1234');
      expect(ok).toBe(true);
    });
    expect(result.current.isAdminUnlocked).toBe(true);
  });

  it('changeAdminPin devuelve false con oldPin incorrecto', async () => {
    const { result } = renderHook(() => useAdminAuth());
    await act(async () => {
      await result.current.setAdminPin('1234');
    });
    await act(async () => {
      const ok = await result.current.changeAdminPin('wrong', '5678');
      expect(ok).toBe(false);
    });
  });

  it('changeAdminPin actualiza el hash con oldPin correcto', async () => {
    const { result } = renderHook(() => useAdminAuth());
    await act(async () => {
      await result.current.setAdminPin('1234');
    });
    const hashBefore = localStorage.getItem('vademecum_admin_pin');

    await act(async () => {
      const ok = await result.current.changeAdminPin('1234', '5678');
      expect(ok).toBe(true);
    });
    const hashAfter = localStorage.getItem('vademecum_admin_pin');
    expect(hashAfter).not.toBe(hashBefore);

    // El nuevo PIN funciona
    act(() => result.current.lockAdmin());
    await act(async () => {
      const ok = await result.current.unlockAdmin('5678');
      expect(ok).toBe(true);
    });
  });

  it('clearAdminPin elimina el PIN y la sesión', async () => {
    const { result } = renderHook(() => useAdminAuth());
    await act(async () => {
      await result.current.setAdminPin('1234');
    });
    act(() => result.current.clearAdminPin());
    expect(result.current.hasAdminPin).toBe(false);
    expect(result.current.isAdminUnlocked).toBe(false);
    expect(localStorage.getItem('vademecum_admin_pin')).toBeNull();
  });

  it('detecta PIN existente en localStorage al inicializar', async () => {
    // Pre-configurar un PIN via un primer hook
    const { result: setup } = renderHook(() => useAdminAuth());
    await act(async () => {
      await setup.current.setAdminPin('4321');
    });

    // Nuevo hook debe detectar el PIN existente
    const { result } = renderHook(() => useAdminAuth());
    expect(result.current.hasAdminPin).toBe(true);
  });
});
