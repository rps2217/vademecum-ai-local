/**
 * E2EEAuthProvider - Proveedor de autenticación E2E
 * 
 * Maneja el keypair y la recuperación.
 */

import { createContext, useContext, useEffect, useState } from 'react';
import { hasKeyPair, generateAndStoreKeyPair, unlockKeyPair } from '@/lib/crypto';

interface E2EEContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  setup: (password: string) => Promise<{ recoveryPhrase: string }>;
  unlock: (password: string) => Promise<boolean>;
  recover: (phrase: string, newPassword: string) => Promise<boolean>;
}

const E2EEContext = createContext<E2EEContextValue | null>(null);

export function E2EEAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const hasKeys = await hasKeyPair();
        setIsAuthenticated(hasKeys);
      } catch {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, []);

  const setup = async (password: string) => {
    const result = await generateAndStoreKeyPair(password);
    setIsAuthenticated(true);
    return { recoveryPhrase: result.recoveryPhrase };
  };

  const unlock = async (password: string) => {
    try {
      await unlockKeyPair(password);
      setIsAuthenticated(true);
      return true;
    } catch {
      return false;
    }
  };

  const recover = async (phrase: string, newPassword: string) => {
    // TODO: Implement recovery with phrase
    // For now, just set up new keypair
    await setup(newPassword);
    return true;
  };

  return (
    <E2EEContext.Provider value={{ isAuthenticated, isLoading, setup, unlock, recover }}>
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
