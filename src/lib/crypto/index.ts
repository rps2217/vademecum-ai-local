/**
 * Crypto Module - Exports
 * 
 * Utilidades de cifrado E2E.
 */

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
