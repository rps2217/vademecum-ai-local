/**
 * E2EEAuthProvider - Proveedor de autenticación E2E
 *
 * Maneja el keypair y la recuperación.
 * Sesiones expiran después de 30 minutos de inactividad.
 * 
 * SEGURIDAD: Usa sessionStorage en lugar de localStorage para reducir
 * el riesgo de XSS. Las claves se limpian al cerrar el navegador.
 */

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { 
  generateAndStoreKeyPair, 
  unlockKeyPair, 
  unlockWithRecovery,
  hasKeyPair,
  nacl,
  deriveKey,
  encodeBase64,
  type StoredKeyPair,
  type RecoveryData,
} from '@/lib/crypto';
import { logger } from '@/lib/logger';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const KEY_STORAGE_KEY = 'vademecum_keypair';
const RECOVERY_STORAGE_KEY = 'vademecum_recovery';

interface E2EEContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  hasAccount: boolean;
  setup: (password: string) => Promise<{ recoveryPhrase: string }>;
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
    const result = await generateAndStoreKeyPair(password);
    startSession();
    setIsAuthenticated(true);
    setHasAccount(true);
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

  const recover = async (phrase: string, newPassword: string): Promise<{ recoveryPhrase: string } | false> => {
    try {
      // 1. Desbloquear keypair con recovery phrase
      const secretKey = await unlockWithRecovery(phrase);
      if (!secretKey) throw new Error('Frase de recuperación inválida');
      
      // 2. Re-cifrar con nueva contraseña
      const salt = nacl.randomBytes(16);
      const aesKey = await deriveKey(newPassword, salt);
      const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
      const encrypted = nacl.secretbox(secretKey, nonce, aesKey);
      
      // 3. Guardar nuevo keypair en sessionStorage
      const publicKey = nacl.box.keyPair.fromSecretKey(secretKey).publicKey;
      const stored: StoredKeyPair = {
        publicKey: encodeBase64(publicKey),
        secretKey: encodeBase64(encrypted),
        nonce: encodeBase64(nonce),
        salt: encodeBase64(salt),
      };
      sessionStorage.setItem(KEY_STORAGE_KEY, JSON.stringify(stored));
      
      // 4. Generar NUEVA recovery phrase
      const { generateMnemonic } = await import('bip39');
      const newRecoveryPhrase = generateMnemonic(128);
      
      // 5. Guardar recovery data en sessionStorage
      const recoveryKey = await deriveKey(newRecoveryPhrase, salt);
      const recoveryNonce = nacl.randomBytes(nacl.secretbox.nonceLength);
      const recoveryEncrypted = nacl.secretbox(secretKey, recoveryNonce, recoveryKey);
      
      const recoveryData: RecoveryData = {
        encrypted: encodeBase64(recoveryEncrypted),
        nonce: encodeBase64(recoveryNonce),
        salt: encodeBase64(salt),
      };
      sessionStorage.setItem(RECOVERY_STORAGE_KEY, JSON.stringify(recoveryData));
      
      startSession();
      setIsAuthenticated(true);
      setHasAccount(true);
      return { recoveryPhrase: newRecoveryPhrase }; // Devolver nueva phrase
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
    <E2EEContext.Provider value={{ isAuthenticated, isLoading, hasAccount, setup, unlock, recover, lock }}>
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
