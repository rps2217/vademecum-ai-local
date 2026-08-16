/**
 * AppAuthProvider - Autenticación simple por PIN
 *
 * Reemplaza el antiguo E2EEAuthProvider (PBKDF2 600k + TweetNaCl + BIP39).
 * El sistema E2EE completo se eliminó porque la infraestructura de backups
 * cifrados (tabla `snapshots`) no tenía consumidores reales en la UI.
 *
 * Flujo:
 * - Primera vez (sin PIN guardado): onboarding pide crear un PIN de 4 dígitos.
 * - Sesiones posteriores: login pide el PIN para desbloquear.
 * - El PIN se hashea con PBKDF2 (210k iteraciones) y se guarda en localStorage.
 * - El flag de sesión vive en sessionStorage (se limpia al cerrar el navegador).
 * - Cada recarga requiere re-unlock (by design).
 * - Sesión expira tras 30 min de inactividad.
 */

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';

const PIN_STORAGE_KEY = 'vademecum.app_pin';
const SESSION_KEY = 'vademecum.app_session';
const PBKDF2_ITERATIONS = 210_000;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = encoder.encode('vademecum-app-auth-salt');
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

interface AppAuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  hasAccount: boolean;
  setup: (pin: string) => Promise<boolean>;
  unlock: (pin: string) => Promise<boolean>;
  lock: () => void;
  changePin: (oldPin: string, newPin: string) => Promise<boolean>;
  resetAccount: () => void;
}

const AppAuthContext = createContext<AppAuthContextValue | null>(null);

export function AppAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccount, setHasAccount] = useState(false);
  const sessionExpiryRef = useRef<number>(0);

  // Always require unlock at boot
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAuthenticated(false);
      setHasAccount(localStorage.getItem(PIN_STORAGE_KEY) !== null);
      setIsLoading(false);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const startSession = useCallback(() => {
    sessionExpiryRef.current = Date.now() + SESSION_TIMEOUT_MS;
    sessionStorage.setItem(SESSION_KEY, String(sessionExpiryRef.current));
  }, []);

  // Reset session timer on activity
  useEffect(() => {
    if (!isAuthenticated) return;
    const resetTimer = () => startSession();
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));
    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [isAuthenticated, startSession]);

  // Check session expiry periodically
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      if (Date.now() >= sessionExpiryRef.current) {
        setIsAuthenticated(false);
        sessionExpiryRef.current = 0;
        sessionStorage.removeItem(SESSION_KEY);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const setup = async (pin: string) => {
    if (pin.length < 4) return false;
    const hash = await hashPin(pin);
    localStorage.setItem(PIN_STORAGE_KEY, hash);
    setHasAccount(true);
    startSession();
    setIsAuthenticated(true);
    return true;
  };

  const unlock = async (pin: string) => {
    try {
      const storedHash = localStorage.getItem(PIN_STORAGE_KEY);
      if (!storedHash) return false;
      const hash = await hashPin(pin);
      if (hash !== storedHash) return false;
      startSession();
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      logger.error('Unlock failed:', err);
      return false;
    }
  };

  const lock = useCallback(() => {
    sessionExpiryRef.current = 0;
    sessionStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
  }, []);

  const changePin = async (oldPin: string, newPin: string): Promise<boolean> => {
    const storedHash = localStorage.getItem(PIN_STORAGE_KEY);
    if (!storedHash) return false;
    const oldHash = await hashPin(oldPin);
    if (oldHash !== storedHash) return false;
    if (newPin.length < 4) return false;
    const newHash = await hashPin(newPin);
    localStorage.setItem(PIN_STORAGE_KEY, newHash);
    return true;
  };

  const resetAccount = useCallback(() => {
    localStorage.removeItem(PIN_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    sessionExpiryRef.current = 0;
    setHasAccount(false);
    setIsAuthenticated(false);
  }, []);

  return (
    <AppAuthContext.Provider value={{ isAuthenticated, isLoading, hasAccount, setup, unlock, lock, changePin, resetAccount }}>
      {children}
    </AppAuthContext.Provider>
  );
}

export function useAppAuth() {
  const context = useContext(AppAuthContext);
  if (!context) {
    throw new Error('useAppAuth must be used within AppAuthProvider');
  }
  return context;
}
