/**
 * Utilidades de transformación de formato entre local (camelCase) y Supabase (snake_case).
 */

/**
 * Convierte una clave camelCase a snake_case.
 * Maneja sufijos de palabra (ingredienteA → ingrediente_a) y
 * grupos de mayúsculas consecutivas (httpURL → http_url).
 */
function toSnakeCase(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .toLowerCase();
}

/**
 * Transforma un payload local (camelCase, con timestamps epoch ms)
 * al formato que espera Supabase (snake_case, con updated_at ISO string).
 */
export function toSupabaseFormat(payload: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    const snakeKey = toSnakeCase(key);
    // updatedAt, createdAt y lastSyncAt son number (epoch ms) en Dexie pero las
    // columnas remotas son TIMESTAMPTZ.
    if ((key === 'updatedAt' || key === 'createdAt' || key === 'lastSyncAt') && typeof value === 'number') {
      result[snakeKey] = new Date(value).toISOString();
    } else {
      result[snakeKey] = value;
    }
  }
  return result;
}
