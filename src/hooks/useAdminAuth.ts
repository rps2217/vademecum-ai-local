/**
 * useAdminAuth — Gate de acceso para /admin (segundo factor)
 *
 * Problema (hallazgo 5.3 bitácora): cualquier usuario con el desbloqueo
 * E2EE general puede editar la KB clínica vía IngredientEditor. Si varios
 * empleados comparten el mismo desbloqueo, todos pueden modificar datos
 * que alimentan las advertencias de seguridad del paciente.
 *
 * Solución: un PIN de admin separado del desbloqueo E2EE. El PIN se
 * hashea con PBKDF2 (210k iteraciones) y se guarda en localStorage.
 * El flag de sesión admin vive en sessionStorage (se pierde al cerrar
 * el navegador, igual que el desbloqueo E2EE general).
 *
 * Si NO hay PIN configurado, /admin es accesible sin gate (compatibilidad
 * hacia atrás). Una vez configurado desde Settings, el gate se activa.
 */

import { useState, useCallback } from 'react';

const ADMIN_PIN_KEY = 'vademecum_admin_pin';
const ADMIN_SESSION_KEY = 'vademecum_admin_session';
const PBKDF2_ITERATIONS = 210_000;

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = encoder.encode('vademecum-admin-salt');
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256,
  );
  return Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export interface AdminAuth {
  hasAdminPin: boolean;
  isAdminUnlocked: boolean;
  setAdminPin: (pin: string) => Promise<void>;
  changeAdminPin: (oldPin: string, newPin: string) => Promise<boolean>;
  unlockAdmin: (pin: string) => Promise<boolean>;
  lockAdmin: () => void;
  clearAdminPin: () => void;
}

export function useAdminAuth(): AdminAuth {
  const [hasAdminPin, setHasAdminPin] = useState(
    () => localStorage.getItem(ADMIN_PIN_KEY) !== null,
  );
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(
    () => sessionStorage.getItem(ADMIN_SESSION_KEY) === '1',
  );

  const setAdminPin = useCallback(async (pin: string) => {
    if (pin.length < 4) throw new Error('El PIN debe tener al menos 4 dígitos');
    const hash = await hashPin(pin);
    localStorage.setItem(ADMIN_PIN_KEY, hash);
    setHasAdminPin(true);
    sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
    setIsAdminUnlocked(true);
  }, []);

  const changeAdminPin = useCallback(async (oldPin: string, newPin: string): Promise<boolean> => {
    const storedHash = localStorage.getItem(ADMIN_PIN_KEY);
    if (!storedHash) return false;
    const oldHash = await hashPin(oldPin);
    if (oldHash !== storedHash) return false;
    if (newPin.length < 4) throw new Error('El PIN debe tener al menos 4 dígitos');
    const newHash = await hashPin(newPin);
    localStorage.setItem(ADMIN_PIN_KEY, newHash);
    return true;
  }, []);

  const unlockAdmin = useCallback(async (pin: string): Promise<boolean> => {
    const storedHash = localStorage.getItem(ADMIN_PIN_KEY);
    if (!storedHash) return true;
    const hash = await hashPin(pin);
    if (hash !== storedHash) return false;
    sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
    setIsAdminUnlocked(true);
    return true;
  }, []);

  const lockAdmin = useCallback(() => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAdminUnlocked(false);
  }, []);

  const clearAdminPin = useCallback(() => {
    localStorage.removeItem(ADMIN_PIN_KEY);
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setHasAdminPin(false);
    setIsAdminUnlocked(false);
  }, []);

  return {
    hasAdminPin,
    isAdminUnlocked,
    setAdminPin,
    changeAdminPin,
    unlockAdmin,
    lockAdmin,
    clearAdminPin,
  };
}
