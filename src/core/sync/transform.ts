/**
 * Utilidades de transformación de formato entre local (camelCase) y Supabase (snake_case).
 */

export function toSupabaseFormat(payload: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    result[snakeKey] = value;
  }
  return result;
}
