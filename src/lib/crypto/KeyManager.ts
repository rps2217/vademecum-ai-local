/**
 * KeyManager
 * 
 * Gestor de claves criptográficas con CryptoKey no exportable.
 * Proporciona una capa de seguridad adicional usando Web Crypto API
 * cuando la sesión está activa.
 * 
 * CARACTERÍSTICAS:
 * - CryptoKey no exportable para máxima seguridad
 * - Almacenamiento seguro en memoria durante la sesión
 * - Timeout de sesión configurable
 * - Key rotation support
 * - Integridad verificada con HMAC
 */

import { logger } from '@/lib/logger';

// ============================================
// CONSTANTES
// ============================================

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos por defecto
const KEY_ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const PBKDF2_ITERATIONS = 600_000;
const HMAC_ALGORITHM = 'HMAC';
const HMAC_HASH = 'SHA-256';

// ============================================
// INTERFACES
// ============================================

export interface KeyManagerConfig {
  sessionTimeoutMs?: number;
  enableKeyRotation?: boolean;
}

export interface StoredKeyMetadata {
  salt: string;
  iv: string;
  keyHash: string;
  createdAt: number;
  version: number;
}

export interface SessionKeys {
  encryptionKey: CryptoKey;
  hmacKey: CryptoKey;
  createdAt: number;
}

// ============================================
// KEY MANAGER CLASS
// ============================================

export class KeyManager {
  private static instance: KeyManager | null = null;
  
  private sessionKeys: SessionKeys | null = null;
  private sessionExpiry: number = 0;
  private config: Required<KeyManagerConfig>;
  private salt: Uint8Array | null = null;
  private metadata: StoredKeyMetadata | null = null;

  private constructor(config: KeyManagerConfig = {}) {
    this.config = {
      sessionTimeoutMs: config.sessionTimeoutMs ?? SESSION_TIMEOUT_MS,
      enableKeyRotation: config.enableKeyRotation ?? false,
    };
    this.loadMetadata();
  }

  /**
   * Obtener instancia singleton
   */
  static getInstance(config?: KeyManagerConfig): KeyManager {
    if (!KeyManager.instance) {
      KeyManager.instance = new KeyManager(config);
    }
    return KeyManager.instance;
  }

  /**
   * Verificar si hay una sesión activa
   */
  isSessionActive(): boolean {
    return this.sessionKeys !== null && Date.now() < this.sessionExpiry;
  }

  /**
   * Inicializar sesión con password
   */
  async initializeSession(password: string): Promise<boolean> {
    try {
      // Generar o usar salt existente
      if (!this.salt) {
        this.salt = crypto.getRandomValues(new Uint8Array(16));
      }

      // Derivar claves no exportables
      const keys = await this.deriveSessionKeys(password, this.salt);
      
      // Generar IV aleatorio para esta sesión
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Calcular hash de verificación
      const keyHash = await this.computeKeyHash(keys.encryptionKey);
      
      // Guardar metadata
      this.metadata = {
        salt: this.arrayToBase64(this.salt),
        iv: this.arrayToBase64(iv),
        keyHash,
        createdAt: Date.now(),
        version: 1,
      };
      this.saveMetadata();

      // Guardar claves en memoria
      this.sessionKeys = keys;
      this.sessionExpiry = Date.now() + this.config.sessionTimeoutMs;

      logger.log('[KeyManager] Sesión inicializada correctamente');
      return true;
    } catch (error) {
      logger.error('[KeyManager] Error inicializando sesión:', error);
      return false;
    }
  }

  /**
   * Desbloquear sesión existente
   */
  async unlockSession(password: string): Promise<boolean> {
    if (!this.metadata) {
      logger.warn('[KeyManager] No hay metadata para desbloquear');
      return false;
    }

    try {
      this.salt = this.base64ToArray(this.metadata.salt);
      const keys = await this.deriveSessionKeys(password, this.salt);
      
      // Verificar que la clave es correcta
      const keyHash = await this.computeKeyHash(keys.encryptionKey);
      if (keyHash !== this.metadata.keyHash) {
        logger.warn('[KeyManager] Password incorrecto');
        return false;
      }

      this.sessionKeys = keys;
      this.sessionExpiry = Date.now() + this.config.sessionTimeoutMs;

      logger.log('[KeyManager] Sesión desbloqueada');
      return true;
    } catch (error) {
      logger.error('[KeyManager] Error desbloqueando sesión:', error);
      return false;
    }
  }

  /**
   * Extender sesión activa
   */
  extendSession(): boolean {
    if (!this.isSessionActive()) {
      return false;
    }
    this.sessionExpiry = Date.now() + this.config.sessionTimeoutMs;
    return true;
  }

  /**
   * Cerrar sesión y limpiar claves de memoria
   */
  closeSession(): void {
    this.sessionKeys = null;
    this.sessionExpiry = 0;
    logger.log('[KeyManager] Sesión cerrada');
  }

  /**
   * Cifrar datos usando la clave de sesión
   */
  async encrypt(data: Uint8Array): Promise<{ ciphertext: Uint8Array; iv: Uint8Array } | null> {
    if (!this.isSessionActive() || !this.sessionKeys) {
      logger.warn('[KeyManager] Sesión no activa para cifrar');
      return null;
    }

    try {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const ciphertext = await crypto.subtle.encrypt(
        { name: KEY_ALGORITHM, iv },
        this.sessionKeys.encryptionKey,
        data
      );

      return {
        ciphertext: new Uint8Array(ciphertext),
        iv,
      };
    } catch (error) {
      logger.error('[KeyManager] Error cifrando:', error);
      return null;
    }
  }

  /**
   * Descifrar datos usando la clave de sesión
   */
  async decrypt(ciphertext: Uint8Array, iv: Uint8Array): Promise<Uint8Array | null> {
    if (!this.isSessionActive() || !this.sessionKeys) {
      logger.warn('[KeyManager] Sesión no activa para descifrar');
      return null;
    }

    try {
      const decrypted = await crypto.subtle.decrypt(
        { name: KEY_ALGORITHM, iv },
        this.sessionKeys.encryptionKey,
        ciphertext
      );

      return new Uint8Array(decrypted);
    } catch (error) {
      logger.error('[KeyManager] Error descifrando:', error);
      return null;
    }
  }

  /**
   * Generar HMAC para verificación de integridad
   */
  async computeHMAC(data: Uint8Array): Promise<Uint8Array | null> {
    if (!this.isSessionActive() || !this.sessionKeys) {
      logger.warn('[KeyManager] Sesión no activa para HMAC');
      return null;
    }

    try {
      const signature = await crypto.subtle.sign(
        HMAC_ALGORITHM,
        this.sessionKeys.hmacKey,
        data
      );
      return new Uint8Array(signature);
    } catch (error) {
      logger.error('[KeyManager] Error computando HMAC:', error);
      return null;
    }
  }

  /**
   * Verificar HMAC
   */
  async verifyHMAC(data: Uint8Array, signature: Uint8Array): Promise<boolean> {
    if (!this.isSessionActive() || !this.sessionKeys) {
      return false;
    }

    try {
      return await crypto.subtle.verify(
        HMAC_ALGORITHM,
        this.sessionKeys.hmacKey,
        signature,
        data
      );
    } catch {
      return false;
    }
  }

  /**
   * Exportar clave cifrada para backup (NO la clave directamente)
   */
  async exportEncryptedKey(exportPassword: string): Promise<string | null> {
    if (!this.metadata) {
      return null;
    }

    try {
      // Crear clave de exportación con password diferente
      const exportSalt = crypto.getRandomValues(new Uint8Array(16));
      const exportKeyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(exportPassword),
        'PBKDF2',
        false,
        ['deriveKey']
      );
      const exportKey = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: exportSalt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
        exportKeyMaterial,
        { name: KEY_ALGORITHM, length: KEY_LENGTH },
        false,
        ['encrypt']
      );

      // Cifrar metadata con clave de exportación
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const metadataJson = JSON.stringify(this.metadata);
      const encrypted = await crypto.subtle.encrypt(
        { name: KEY_ALGORITHM, iv },
        exportKey,
        new TextEncoder().encode(metadataJson)
      );

      return JSON.stringify({
        version: 1,
        salt: this.arrayToBase64(exportSalt),
        iv: this.arrayToBase64(iv),
        data: this.arrayToBase64(new Uint8Array(encrypted)),
      });
    } catch (error) {
      logger.error('[KeyManager] Error exportando clave:', error);
      return null;
    }
  }

  /**
   * Importar clave desde backup cifrado
   */
  async importEncryptedKey(encryptedData: string, importPassword: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(encryptedData);
      if (parsed.version !== 1) {
        logger.warn('[KeyManager] Versión de backup no soportada');
        return false;
      }

      // Derivar clave de importación
      const exportSalt = this.base64ToArray(parsed.salt);
      const exportKeyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(importPassword),
        'PBKDF2',
        false,
        ['deriveKey']
      );
      const exportKey = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: exportSalt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
        exportKeyMaterial,
        { name: KEY_ALGORITHM, length: KEY_LENGTH },
        false,
        ['decrypt']
      );

      // Descifrar metadata
      const iv = this.base64ToArray(parsed.iv);
      const encrypted = this.base64ToArray(parsed.data);
      const decrypted = await crypto.subtle.decrypt(
        { name: KEY_ALGORITHM, iv },
        exportKey,
        encrypted
      );

      this.metadata = JSON.parse(new TextDecoder().decode(decrypted));
      this.salt = this.base64ToArray(this.metadata.salt);
      this.saveMetadata();

      logger.log('[KeyManager] Clave importada correctamente');
      return true;
    } catch (error) {
      logger.error('[KeyManager] Error importando clave:', error);
      return false;
    }
  }

  /**
   * Verificar si existe una clave guardada
   */
  hasStoredKey(): boolean {
    return this.metadata !== null;
  }

  /**
   * Eliminar clave almacenada
   */
  deleteStoredKey(): void {
    this.metadata = null;
    this.salt = null;
    this.sessionKeys = null;
    sessionStorage.removeItem('vademecum_key_metadata');
    logger.log('[KeyManager] Clave eliminada');
  }

  // ============================================
  // MÉTODOS PRIVADOS
  // ============================================

  /**
   * Derivar claves de sesión (no exportables)
   */
  private async deriveSessionKeys(password: string, salt: Uint8Array): Promise<SessionKeys> {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    // Derivar clave de cifrado
    const encryptionKey = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
      keyMaterial,
      { name: KEY_ALGORITHM, length: KEY_LENGTH },
      false, // NO EXPORTABLE
      ['encrypt', 'decrypt']
    );

    // Derivar clave HMAC con salt diferente
    const hmacSalt = new Uint8Array(salt.length + 1);
    hmacSalt.set(salt);
    hmacSalt[salt.length] = 1;
    
    const hmacKeyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    const hmacKey = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: hmacSalt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
      hmacKeyMaterial,
      { name: HMAC_ALGORITHM, hash: HMAC_HASH },
      false, // NO EXPORTABLE
      ['sign', 'verify']
    );

    return {
      encryptionKey,
      hmacKey,
      createdAt: Date.now(),
    };
  }

  /**
   * Calcular hash de clave para verificación
   */
  private async computeKeyHash(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('raw', key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', exported);
    return this.arrayToBase64(new Uint8Array(hashBuffer));
  }

  /**
   * Cargar metadata desde sessionStorage
   */
  private loadMetadata(): void {
    try {
      const stored = sessionStorage.getItem('vademecum_key_metadata');
      if (stored) {
        this.metadata = JSON.parse(stored);
      }
    } catch {
      this.metadata = null;
    }
  }

  /**
   * Guardar metadata en sessionStorage
   */
  private saveMetadata(): void {
    if (this.metadata) {
      sessionStorage.setItem('vademecum_key_metadata', JSON.stringify(this.metadata));
    }
  }

  /**
   * Convertir Uint8Array a base64
   */
  private arrayToBase64(array: Uint8Array): string {
    return btoa(String.fromCharCode(...array));
  }

  /**
   * Convertir base64 a Uint8Array
   */
  private base64ToArray(base64: string): Uint8Array {
    return new Uint8Array(atob(base64).split('').map(c => c.charCodeAt(0)));
  }
}

// ============================================
// CONECTIVITY CHECK
// ============================================

export interface ConnectivityResult {
  online: boolean;
  latency: number;
  supabaseReachable: boolean;
  supabaseLatency: number;
}

/**
 * Verificación de conectividad mejorada
 */
export async function checkConnectivity(): Promise<ConnectivityResult> {
  const startOnline = performance.now();
  const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const onlineLatency = online ? performance.now() - startOnline : 0;

  let supabaseReachable = false;
  let supabaseLatency = 0;

  // Verificar Supabase si está configurado
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl && supabaseUrl !== 'yourproject.supabase.co') {
    try {
      const supabaseStart = performance.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      supabaseLatency = performance.now() - supabaseStart;
      supabaseReachable = response.ok || response.status === 401; // 401 = ok pero requiere auth
    } catch {
      supabaseReachable = false;
      supabaseLatency = 0;
    }
  }

  return {
    online,
    latency: onlineLatency,
    supabaseReachable,
    supabaseLatency,
  };
}

// Singleton instance
export const keyManager = KeyManager.getInstance();
