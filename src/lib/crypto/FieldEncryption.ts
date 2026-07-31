/**
 * Field Encryption
 * 
 * Cifrado a nivel de campo para datos sensibles en IndexedDB.
 * Útil para campos como datos personales de pacientes, direcciones, etc.
 * 
 * CARACTERÍSTICAS:
 * - Cifrado AES-GCM con CryptoKey no exportable
 * - IV único por campo para máxima seguridad
 * - Integridad verificada con tags de autenticación
 */

import { keyManager } from './KeyManager';
import { logger } from '@/lib/logger';

// ============================================
// TIPOS
// ============================================

export interface EncryptedField {
  /** Prefijo que indica que el valor está cifrado */
  _encrypted: true;
  /** IV utilizado para el cifrado */
  iv: string;
  /** Datos cifrados en base64 */
  data: string;
  /** Tipo original del valor */
  type: 'string' | 'number' | 'boolean' | 'object';
}

export interface FieldEncryptionConfig {
  /** Campos sensibles por tabla */
  sensitiveFields: Record<string, string[]>;
}

// ============================================
// CONFIGURACIÓN DE CAMPOS SENSIBLES
// ============================================

export const SENSITIVE_FIELDS_CONFIG: FieldEncryptionConfig = {
  patients: [
    'nombre',
    'apellidos',
    'direccion',
    'telefono',
    'email',
    'dni',
    'fechaNacimiento',
    'historialMedico',
    'alergias',
  ],
  consultations: [
    'notas',
    'diagnostico',
    'tratamiento',
    'observaciones',
  ],
  prescriptions: [
    'instrucciones',
    'observaciones',
  ],
};

// ============================================
// UTILIDADES DE CIFRADO
// ============================================

/**
 * Cifrar un valor
 */
export async function encryptField<T>(
  value: T,
  type: 'string' | 'number' | 'boolean' | 'object' = 'object'
): Promise<EncryptedField | null> {
  try {
    const data = new TextEncoder().encode(JSON.stringify(value));
    const result = await keyManager.encrypt(data);
    
    if (!result) {
      logger.warn('[FieldEncryption] No se pudo cifrar - sesión no activa');
      return null;
    }

    return {
      _encrypted: true,
      iv: arrayToBase64(result.iv),
      data: arrayToBase64(result.ciphertext),
      type,
    };
  } catch (error) {
    logger.error('[FieldEncryption] Error cifrando campo:', error);
    return null;
  }
}

/**
 * Descifrar un valor
 */
export async function decryptField<T>(encrypted: EncryptedField): Promise<T | null> {
  try {
    const ciphertext = base64ToArray(encrypted.data);
    const iv = base64ToArray(encrypted.iv);
    
    const decrypted = await keyManager.decrypt(ciphertext, iv);
    if (!decrypted) {
      return null;
    }

    const json = new TextDecoder().decode(decrypted);
    return JSON.parse(json) as T;
  } catch (error) {
    logger.error('[FieldEncryption] Error descifrando campo:', error);
    return null;
  }
}

/**
 * Verificar si un valor está cifrado
 */
export function isEncrypted(value: unknown): value is EncryptedField {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_encrypted' in value &&
    (value as EncryptedField)._encrypted === true
  );
}

// ============================================
// UTILIDADES PARA REGISTROS
// ============================================

/**
 * Cifrar campos sensibles de un registro
 */
export async function encryptRecord<T extends Record<string, unknown>>(
  record: T,
  tableName: string
): Promise<T> {
  const sensitiveFields = SENSITIVE_FIELDS_CONFIG[tableName];
  if (!sensitiveFields) {
    return record;
  }

  const encrypted = { ...record };

  for (const field of sensitiveFields) {
    if (field in encrypted && encrypted[field] !== undefined && encrypted[field] !== null) {
      const value = encrypted[field];
      const type = getValueType(value);
      const encryptedValue = await encryptField(value, type);
      
      if (encryptedValue) {
        (encrypted as Record<string, unknown>)[field] = encryptedValue;
      }
    }
  }

  return encrypted;
}

/**
 * Descifrar campos sensibles de un registro
 */
export async function decryptRecord<T extends Record<string, unknown>>(
  record: T,
  tableName: string
): Promise<T> {
  const sensitiveFields = SENSITIVE_FIELDS_CONFIG[tableName];
  if (!sensitiveFields) {
    return record;
  }

  const decrypted = { ...record };

  for (const field of sensitiveFields) {
    if (field in decrypted && isEncrypted(decrypted[field])) {
      const encryptedField = decrypted[field] as EncryptedField;
      const value = await decryptField(encryptedField);
      
      if (value !== null) {
        (decrypted as Record<string, unknown>)[field] = value;
      }
    }
  }

  return decrypted;
}

/**
 * Descifrar solo algunos campos de un registro
 */
export async function decryptFields<T extends Record<string, unknown>>(
  record: T,
  fields: string[]
): Promise<T> {
  const decrypted = { ...record };

  for (const field of fields) {
    if (field in decrypted && isEncrypted(decrypted[field])) {
      const encryptedField = decrypted[field] as EncryptedField;
      const value = await decryptField(encryptedField);
      
      if (value !== null) {
        (decrypted as Record<string, unknown>)[field] = value;
      }
    }
  }

  return decrypted;
}

/**
 * Obtener tipo de valor para serialización
 */
function getValueType(value: unknown): 'string' | 'number' | 'boolean' | 'object' {
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  return 'object';
}

/**
 * Convertir Uint8Array a base64
 */
function arrayToBase64(array: Uint8Array): string {
  return btoa(String.fromCharCode(...array));
}

/**
 * Convertir base64 a Uint8Array
 */
function base64ToArray(base64: string): Uint8Array {
  return new Uint8Array(atob(base64).split('').map(c => c.charCodeAt(0)));
}

// ============================================
// UTILIDADES DE BÚSQUEDA (LIMITADO)
// ============================================

/**
 * Verificar si un patrón coincide con un valor cifrado
 * NOTA: Esto tiene limitaciones de seguridad - solo para uso interno
 */
export async function patternMatchEncrypted(
  encrypted: EncryptedField,
  pattern: string
): Promise<boolean> {
  const decrypted = await decryptField<string>(encrypted);
  if (decrypted === null) return false;
  
  return decrypted.toLowerCase().includes(pattern.toLowerCase());
}

// ============================================
// HOOK PARA REACT
// ============================================

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para manejar campos cifrados en componentes React
 */
export function useEncryptedField<T>(
  tableName: string,
  fieldName: string,
  encryptedValue: EncryptedField | null | undefined
) {
  const [decryptedValue, setDecryptedValue] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!encryptedValue || !isEncrypted(encryptedValue)) {
      setDecryptedValue(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    decryptField<T>(encryptedValue)
      .then((value) => {
        setDecryptedValue(value);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err);
        setIsLoading(false);
      });
  }, [encryptedValue]);

  const reencrypt = useCallback(
    async (newValue: T): Promise<EncryptedField | null> => {
      setIsLoading(true);
      try {
        const encrypted = await encryptField(newValue);
        setIsLoading(false);
        return encrypted;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Encryption failed'));
        setIsLoading(false);
        return null;
      }
    },
    []
  );

  return {
    value: decryptedValue,
    setValue: reencrypt,
    isLoading,
    error,
  };
}
