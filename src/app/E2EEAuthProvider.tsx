/**
 * E2EEAuthProvider - Proveedor de autenticación E2E
 *
 * Maneja el keypair y la recuperación.
 * Sesiones expiran después de 30 minutos de inactividad.
 *
 * SEGURIDAD: El keypair cifrado se guarda en localStorage (persistente entre
 * sesiones, seguro porque está cifrado con PBKDF2 600k). El flag de sesión
 * vive en memoria; cada recarga requiere re-unlock ("always require unlock
 * at boot"). Toda la lógica de storage está centralizada en e2ee.ts.
 */

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  generateAndStoreKeyPair,
  storeKeyPair,
  unlockKeyPair,
  unlockWithRecovery,
  hasKeyPair,
} from '@/lib/crypto';
import { logger } from '@/lib/logger';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

interface E2EEContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  hasAccount: boolean;
  setup: (password: string) => Promise<{ recoveryPhrase: string }>;
  confirmSetup: () => void;
  unlock: (password: string) => Promise<boolean>;
  recover: (phrase: string, newPassword: string) => Promise<{ recoveryPhrase: string } | false>;
  lock: () => void;
}

const E2EEContext = createContext<E2EEContextValue | null>(null);

export function E2EEAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccount, setHasAccount] = useState(false);
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
      setHasAccount(hasKeyPair());
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
    // Genera el keypair y lo guarda cifrado, pero NO activa la sesión todavía:
    // el usuario debe ver la frase de recuperación (step 3 del onboarding) y
    // pulsar "Completar configuración" antes de quedar autenticado. Si
    // activáramos la sesión aquí, AuthRoute redirigiría a "/" y el step 3
    // (frase de recuperación) jamás se mostraría.
    const result = await generateAndStoreKeyPair(password);
    setHasAccount(true);
    return { recoveryPhrase: result.recoveryPhrase };
  };

  /**
   * Activa la sesión tras completar el onboarding. El keypair ya fue generado
   * por `setup()`; aquí solo marcamos la sesión como activa para que AuthRoute
   * permita el acceso a las rutas protegidas.
   */
  const confirmSetup = () => {
    startSession();
    setIsAuthenticated(true);
  };

  const unlock = async (password: string) => {
    try {
      const secretKey = await unlockKeyPair(password);
      if (!secretKey) {
        // Contraseña incorrecta: la clave simétrica no descifró el secretKey.
        // Antes este caso se ignoraba y se activaba la sesión igual (bug).
        return false;
      }
      startSession();
      setIsAuthenticated(true);
      return true;
    } catch {
      return false;
    }
  };

  const recover = async (phrase: string, newPassword: string): Promise<{ recoveryPhrase: string } | false> => {
    try {
      // 1. Desbloquear keypair con recovery phrase (lee de localStorage)
      const secretKey = await unlockWithRecovery(phrase);
      if (!secretKey) throw new Error('Frase de recuperación inválida');

      // 2. Re-cifrar el secretKey con la nueva contraseña y guardar en localStorage.
      //    storeKeyPair también genera una nueva recovery phrase y la guarda.
      //    Toda la lógica de storage vive en e2ee.ts (un solo lugar, un solo
      //    conjunto de keys), evitando la inconsistencia anterior donde recover
      //    escribía en sessionStorage con keys distintas a las de e2ee.ts.
      const newRecoveryPhrase = await storeKeyPair(secretKey, newPassword);

      startSession();
      setIsAuthenticated(true);
      setHasAccount(true);
      return { recoveryPhrase: newRecoveryPhrase };
    } catch (err) {
      logger.error('Recovery failed:', err);
      return false;
    }
  };

  const lock = useCallback(() => {
    sessionExpiryRef.current = 0;
    setIsAuthenticated(false);
  }, []);

  return (
    <E2EEContext.Provider value={{ isAuthenticated, isLoading, hasAccount, setup, confirmSetup, unlock, recover, lock }}>
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
