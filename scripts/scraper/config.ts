/**
 * Configuración central del scraper de productos.
 *
 * Todas las URLs, timeouts, y parámetros ajustables viven aquí.
 */

/** Colecciones de Farmacias Knop a scrapear. */
export const COLLECTIONS = [
  'https://www.farmaciasknop.com/collections/suplementos',
  'https://www.farmaciasknop.com/collections/medicamento-natural',
  'https://www.farmaciasknop.com/collections/cuidado-personal',
  'https://www.farmaciasknop.com/collections/belleza-natural',
  'https://www.farmaciasknop.com/collections/alimentacion-saludable',
  'https://www.farmaciasknop.com/collections/infantil-y-maternidad',
  'https://www.farmaciasknop.com/collections/aromaterapia-y-terapia-floral',
  'https://www.farmaciasknop.com/collections/mascotas',
];

export const BASE_DOMAIN = 'https://www.farmaciasknop.com';

/** Máximo de páginas a recorrer por colección (paginación). */
export const MAX_PAGES_PER_COLLECTION = 20;

/** Pausa entre productos en el extractor (ms). */
export const EXTRACT_DELAY_MS = 800;

/** Pausa entre productos en el procesador Ollama (ms). */
export const OLLAMA_COOLDOWN_MS = 3000;

/** Ollama */
export const OLLAMA_URL =
  process.env.OLLAMA_URL || 'http://127.0.0.1:11434/api/generate';
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1';

/** Archivos de datos (intermedios y finales). */
export const FILES = {
  RAW_DATA: 'knop_raw_data.json',
  PROCESSED: 'knop_processed_data.json',
  MATCHED: 'knop_matched_data.json',
  MATCH_REPORT: 'knop_match_report.json',
} as const;

/** Supabase (leer de variables de entorno, nunca hardcodear). */
export const SUPABASE_URL = process.env.SUPABASE_URL || '';
export const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';
