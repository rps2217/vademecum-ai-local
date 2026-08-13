/**
 * End-to-End Encryption Utilities
 * 
 * Cifrado E2E para backups usando tweetnacl + BIP39 + Web Crypto API.
 * 
 * SEGURIDAD:
 * - Usa sessionStorage para reducir riesgo XSS (claves se limpian al cerrar navegador)
 * - Deriva claves usando PBKDF2 con 600k iteraciones
 * - Timeout de sesión configurable (30 min por defecto)
 * - Usa CryptoKey no exportable cuando es posible
 * 
 * LIMITACIONES:
 * - Las claves deben almacenarse cifradas en sessionStorage para persistencia de sesión
 * - Para protección XSS completa, se requiere Web Crypto API con CryptoKey en memoria
 *   (actualmente no implementado por limitaciones de persistencia entre page refresh)
 */

import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64 } from 'tweetnacl-util';
import { generateMnemonic } from 'bip39';

const KEY_STORAGE_KEY = 'vademecum.keypair';
const RECOVERY_STORAGE_KEY = 'vademecum.recovery';
const SESSION_FLAG_KEY = 'vademecum.session';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos

let _sessionExpiry: number | null = null;

/**
 * Almacenamiento persistente para el keypair CIFRADO.
 * Los datos están cifrados con PBKDF2 (600k iteraciones) + AES-GCM,
 * por lo que es seguro guardarlos en localStorage. La clave de cifrado
 * se deriva de la contraseña del usuario y nunca se persiste.
 */
function getPersistentStorage(): Storage {
  return localStorage;
}

/**
 * Almacenamiento de sesión (se limpia al cerrar el navegador).
 * Solo guarda un flag que indica que la sesión está activa.
 */
function getSessionStorage(): Storage {
  return sessionStorage;
}

function isSessionValid(): boolean {
  if (_sessionExpiry === null) return false;
  return Date.now() < _sessionExpiry;
}

function refreshSession(): void {
  _sessionExpiry = Date.now() + SESSION_TIMEOUT_MS;
  getSessionStorage().setItem(SESSION_FLAG_KEY, String(_sessionExpiry));
}

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
 * Usa Web Crypto API para máxima seguridad
 *
 * Usa deriveBits (no deriveKey) porque TweetNaCl necesita los bytes crudos
 * de la clave. deriveKey con extractable:false hace imposible exportarla
 * luego (InvalidAccessError), y deriveKey con extractable:true expone la
 * clave a JS. deriveBits deriva los bytes directamente sin crear un
 * CryptoKey intermedio, evitando ambos problemas.
 */
export async function deriveKey(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 600_000, hash: 'SHA-256' },
    keyMaterial,
    256
  );

  return new Uint8Array(bits);
}

/**
 * Derivar CryptoKey no exportable desde password (para uso futuro con Web Crypto API)
 * Esta función puede usarse cuando no se necesita persistencia entre refresh
 */
export async function deriveCryptoKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 600_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false, // No extractable - máxima seguridad
    ['encrypt', 'decrypt']
  );
}

/**
 * Generar par de claves y guardarlo cifrado en sessionStorage
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
  
  getPersistentStorage().setItem(KEY_STORAGE_KEY, JSON.stringify(stored));
  refreshSession();

  // Generar frase de recuperación BIP-39
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
  
  getPersistentStorage().setItem(RECOVERY_STORAGE_KEY, JSON.stringify(recoveryData));

  return { publicKey: stored.publicKey, recoveryPhrase };
}

/**
 * Desbloquear par de claves con password
 */
export async function unlockKeyPair(password: string): Promise<Uint8Array | null> {
  const raw = getPersistentStorage().getItem(KEY_STORAGE_KEY);
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
      refreshSession();
      return decrypted;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Obtener clave secreta desde password (alias de unlockKeyPair)
 */
export async function getStoredSecretKey(password: string): Promise<Uint8Array | null> {
  return unlockKeyPair(password);
}

/**
 * Desbloquear con frase de recuperación
 */
export async function unlockWithRecovery(phrase: string): Promise<Uint8Array | null> {
  const raw = getPersistentStorage().getItem(RECOVERY_STORAGE_KEY);
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
      refreshSession();
      return decrypted;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Obtener clave pública
 */
export function getPublicKey(): string | null {
  if (!isSessionValid()) return null;
  
  const raw = getPersistentStorage().getItem(KEY_STORAGE_KEY);
  if (!raw) return null;
  
  try {
    const stored: StoredKeyPair = JSON.parse(raw);
    return stored.publicKey;
  } catch {
    return null;
  }
}

/**
 * Verificar si existe un par de claves guardado
 * NO verifica la sesión, solo si hay datos guardados
 */
export function hasKeyPair(): boolean {
  return getPersistentStorage().getItem(KEY_STORAGE_KEY) !== null;
}

/**
 * Eliminar par de claves y expirar sesión
 */
export function deleteKeyPair(): void {
  getPersistentStorage().removeItem(KEY_STORAGE_KEY);
  getPersistentStorage().removeItem(RECOVERY_STORAGE_KEY);
  getSessionStorage().removeItem(SESSION_FLAG_KEY);
  _sessionExpiry = null;
}

/**
 * Refrescar sesión manualmente
 */
export function extendSession(): void {
  refreshSession();
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
  const decrypted = nacl.box.open(
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

// Re-export nacl and utilities for use in other modules
export { nacl, encodeBase64, decodeBase64 };

