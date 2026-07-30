/**
 * E2EEAuthProvider - Proveedor de autenticación E2E
 *
 * Maneja el keypair y la recuperación.
 * Sesiones expiran después de 30 minutos de inactividad.
 */

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { generateAndStoreKeyPair, unlockKeyPair } from '@/lib/crypto';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

interface E2EEContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  setup: (password: string) => Promise<{ recoveryPhrase: string }>;
  unlock: (password: string) => Promise<boolean>;
  recover: (phrase: string, newPassword: string) => Promise<boolean>;
  lock: () => void;
}

const E2EEContext = createContext<E2EEContextValue | null>(null);

export function E2EEAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const sessionExpiryRef = useRef<number>(0);

  // Check if session is still valid
  const isSessionValid = useCallback(() => {
    return Date.now() < sessionExpiryRef.current;
  }, []);

  // Start session timer
  const startSession = useCallback(() => {
    sessionExpiryRef.current = Date.now() + SESSION_TIMEOUT_MS;
  }, []);

  // Check auth on mount - always require unlock at boot
  useEffect(() => {
    // Always require unlock at boot - session is handled by unlock()
    const timer = setTimeout(() => {
      setIsAuthenticated(false);
      setIsLoading(false);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Reset session timer on activity
  useEffect(() => {
    if (!isAuthenticated) return;

    const resetTimer = () => {
      startSession();
    };

    // Listen for user activity
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(event => window.addEventListener(event, resetTimer, { passive: true }));

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [isAuthenticated, startSession]);

  // Check session expiry periodically
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      if (!isSessionValid()) {
        setIsAuthenticated(false);
        sessionExpiryRef.current = 0;
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [isAuthenticated, isSessionValid]);

  const setup = async (password: string) => {
    const result = await generateAndStoreKeyPair(password);
    startSession();
    setIsAuthenticated(true);
    return { recoveryPhrase: result.recoveryPhrase };
  };

  const unlock = async (password: string) => {
    try {
      await unlockKeyPair(password);
      startSession();
      setIsAuthenticated(true);
      return true;
    } catch {
      return false;
    }
  };

  const recover = async (_phrase: string, newPassword: string) => {
    // TODO: Implement recovery with phrase
    // For now, just set up new keypair
    await setup(newPassword);
    return true;
  };

  const lock = useCallback(() => {
    sessionExpiryRef.current = 0;
    setIsAuthenticated(false);
  }, []);

  return (
    <E2EEContext.Provider value={{ isAuthenticated, isLoading, setup, unlock, recover, lock }}>
      {children}
    </E2EEContext.Provider>
  );
}

export function useE2EE() {
  const context = useContext(E2EEContext);
  if (!context) {
    throw new Error('useE2EE must be used within E2EEAuthProvider');
  }
  return context;
}
