/**
 * End-to-End Encryption Utilities
 * 
 * Cifrado E2E para backups usando tweetnacl + BIP39.
 */

import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64 } from 'tweetnacl-util';
import { logger } from '../../services/LoggerService';

const KEY_STORAGE_KEY = 'vademecum.keypair';
const RECOVERY_STORAGE_KEY = 'vademecum.recovery';

export interface StoredKeyPair {
  publicKey: string;
  secretKey: string;
  nonce: string;
  salt: string;
}

export interface RecoveryData {
  encrypted: string;
  nonce: string;
  salt: string;
}

/**
 * Derivar clave AES-256 desde password usando PBKDF2
 */
export async function deriveKey(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 600_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  
  return new Uint8Array(await crypto.subtle.exportKey('raw', key));
}

/**
 * Generar par de claves y guardarlo cifrado
 */
export async function generateAndStoreKeyPair(password: string): Promise<{
  publicKey: string;
  recoveryPhrase: string;
}> {
  const kp = nacl.box.keyPair();
  const salt = nacl.randomBytes(16);
  const aesKey = await deriveKey(password, salt);
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const encrypted = nacl.secretbox(kp.secretKey, nonce, aesKey);
  
  const stored: StoredKeyPair = {
    publicKey: encodeBase64(kp.publicKey),
    secretKey: encodeBase64(encrypted),
    nonce: encodeBase64(nonce),
    salt: encodeBase64(salt),
  };
  
  localStorage.setItem(KEY_STORAGE_KEY, JSON.stringify(stored));
  logger.info('Par de claves generado y almacenado', 'Crypto');

  // Generar frase de recuperación BIP-39
  const { generateMnemonic } = await import('bip39');
  const recoveryPhrase = generateMnemonic(128);

  // Guardar cifrado con recovery phrase
  const recoveryKey = await deriveKey(recoveryPhrase, salt);
  const recoveryNonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const recoveryEncrypted = nacl.secretbox(kp.secretKey, recoveryNonce, recoveryKey);
  
  const recoveryData: RecoveryData = {
    encrypted: encodeBase64(recoveryEncrypted),
    nonce: encodeBase64(recoveryNonce),
    salt: encodeBase64(salt),
  };
  
  localStorage.setItem(RECOVERY_STORAGE_KEY, JSON.stringify(recoveryData));

  return { publicKey: stored.publicKey, recoveryPhrase };
}

/**
 * Desbloquear par de claves con password
 */
export async function unlockKeyPair(password: string): Promise<Uint8Array | null> {
  const raw = localStorage.getItem(KEY_STORAGE_KEY);
  if (!raw) return null;
  
  try {
    const stored: StoredKeyPair = JSON.parse(raw);
    const aesKey = await deriveKey(password, decodeBase64(stored.salt));
    const decrypted = nacl.secretbox.open(
      decodeBase64(stored.secretKey),
      decodeBase64(stored.nonce),
      aesKey
    );
    
    if (decrypted) {
      logger.info('Claves desbloqueadas exitosamente', 'Crypto');
      return decrypted;
    }
    return null;
  } catch (error) {
    logger.error('Error desbloqueando claves', 'Crypto', error);
    return null;
  }
}

/**
 * Desbloquear con frase de recuperación
 */
export async function unlockWithRecovery(phrase: string): Promise<Uint8Array | null> {
  const raw = localStorage.getItem(RECOVERY_STORAGE_KEY);
  if (!raw) return null;
  
  try {
    const stored: RecoveryData = JSON.parse(raw);
    const recoveryKey = await deriveKey(phrase, decodeBase64(stored.salt));
    const decrypted = nacl.secretbox.open(
      decodeBase64(stored.encrypted),
      decodeBase64(stored.nonce),
      recoveryKey
    );
    
    if (decrypted) {
      logger.info('Claves restauradas desde frase de recuperación', 'Crypto');
      return decrypted;
    }
    return null;
  } catch (error) {
    logger.error('Error restaurando claves', 'Crypto', error);
    return null;
  }
}

/**
 * Obtener clave pública
 */
export function getPublicKey(): string | null {
  const raw = localStorage.getItem(KEY_STORAGE_KEY);
  if (!raw) return null;
  
  try {
    const stored: StoredKeyPair = JSON.parse(raw);
    return stored.publicKey;
  } catch {
    return null;
  }
}

/**
 * Verificar si existe un par de claves
 */
export function hasKeyPair(): boolean {
  return localStorage.getItem(KEY_STORAGE_KEY) !== null;
}

/**
 * Eliminar par de claves (dangerous!)
 */
export function deleteKeyPair(): void {
  localStorage.removeItem(KEY_STORAGE_KEY);
  localStorage.removeItem(RECOVERY_STORAGE_KEY);
  logger.warn('Par de claves eliminado', 'Crypto');
}

/**
 * Cifrar datos con clave pública del destinatario
 */
export function encryptFor(data: string, recipientPublicKey: Uint8Array): {
  encrypted: Uint8Array;
  nonce: Uint8Array;
} {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const message = new TextEncoder().encode(data);
  const ephemeralKp = nacl.box.keyPair();
  
  const encrypted = nacl.box(
    message,
    nonce,
    recipientPublicKey,
    ephemeralKp.secretKey
  );
  
  return { encrypted: encrypted ?? new Uint8Array(), nonce };
}

/**
 * Descifrar datos con clave privada
 */
export function decryptFrom(
  encrypted: Uint8Array,
  nonce: Uint8Array,
  senderPublicKey: Uint8Array,
  recipientSecretKey: Uint8Array
): string | null {
  const decrypted = nacl.box.open.open(
    encrypted,
    nonce,
    senderPublicKey,
    recipientSecretKey
  );
  
  if (!decrypted) return null;
  return new TextDecoder().decode(decrypted);
}

/**
 * Cifrar datos con clave simétrica (AES-GCM)
 */
export async function encryptSymmetric(
  data: Uint8Array,
  key: Uint8Array
): Promise<{ encrypted: Uint8Array; nonce: Uint8Array }> {
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', length: 256, iv: nonce },
    await crypto.subtle.importKey('raw', key, 'AES-GCM', false, ['encrypt']),
    data
  );
  
  return { encrypted: new Uint8Array(encrypted), nonce };
}

/**
 * Descifrar datos con clave simétrica (AES-GCM)
 */
export async function decryptSymmetric(
  encrypted: Uint8Array,
  nonce: Uint8Array,
  key: Uint8Array
): Promise<Uint8Array> {
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: nonce },
    await crypto.subtle.importKey('raw', key, 'AES-GCM', false, ['decrypt']),
    encrypted
  );
  
  return new Uint8Array(decrypted);
}
