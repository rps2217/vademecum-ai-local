/**
 * Crypto Module - Exports
 * 
 * Utilidades de cifrado E2E.
 */

// E2EE legacy exports
export {
  deriveKey,
  generateAndStoreKeyPair,
  unlockKeyPair,
  unlockWithRecovery,
  getPublicKey,
  hasKeyPair,
  deleteKeyPair,
  encryptFor,
  decryptFrom,
  encryptSymmetric,
  decryptSymmetric,
  nacl,
  encodeBase64,
  decodeBase64,
  type StoredKeyPair,
  type RecoveryData,
} from './e2ee';

// KeyManager exports
export {
  KeyManager,
  keyManager,
  checkConnectivity,
  type KeyManagerConfig,
  type StoredKeyMetadata,
  type SessionKeys,
  type ConnectivityResult,
} from './KeyManager';

// Field encryption exports
export {
  encryptField,
  decryptField,
  isEncrypted,
  encryptRecord,
  decryptRecord,
  decryptFields,
  useEncryptedField,
  SENSITIVE_FIELDS_CONFIG,
  type EncryptedField,
  type FieldEncryptionConfig,
} from './FieldEncryption';
