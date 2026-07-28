/**
 * Workers Module - Exports
 * 
 * Workers disponibles para búsquedas y embeddings.
 */

import type { SearchWorkerAPI } from './search.worker';
import type { EmbeddingWorkerAPI } from './embedding.worker';

// Tipos re-exportados
export type { SearchWorkerAPI } from './search.worker';
export type { EmbeddingWorkerAPI } from './embedding.worker';
