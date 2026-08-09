/**
 * Errores específicos del módulo de sincronización.
 *
 * Permite distinguir conflictos, esquema incorrecto y auth expirada
 * en el flujo de upload/download de ops al backend.
 */

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class SchemaMismatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SchemaMismatchError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}
