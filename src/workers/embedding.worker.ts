/**
 * Embedding Worker - Genera embeddings con Transformers.js
 * 
 * Worker dedicado para generar embeddings sin bloquear el main thread.
 * Usa Transformers.js para inferencia local (100% offline).
 */

/// <reference lib="webworker" />

import * as Comlink from 'comlink';
import { pipeline, env } from '@xenova/transformers';
import { logger } from '../lib/logger';

// Configuración
const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';

env.allowLocalModels = false;
env.useBrowserCache = true;

let extractor: any = null;
let loading: Promise<any> | null = null;
let ready = false;

async function getExtractor() {
  if (extractor) return extractor;
  if (loading) return loading;
  
  loading = (async () => {
    logger.info('[embedding.worker] Cargando modelo MiniLM-L6-v2...', 'worker');
    extractor = await pipeline('feature-extraction', MODEL_NAME, {
      quantized: true,
      progress_callback: (progress: any) => {
        if (progress.status === 'progress') {
          logger.debug(`[embedding.worker] ${progress.file} - ${progress.progress?.toFixed(1)}%`, 'worker');
        }
      },
    });
    ready = true;
    logger.info('[embedding.worker] Modelo listo', 'worker');
    return extractor;
  })();
  
  return loading;
}

const api = {
  async init() {
    await getExtractor();
  },
  
  async generateEmbedding(text: string): Promise<number[] | null> {
    try {
      const ext = await getExtractor();
      const result = await ext(text, {
        pooling: 'mean',
        normalize: true,
      });
      return Array.from(result.data);
    } catch (error) {
      logger.error('[embedding.worker] Error generando embedding', 'worker', error);
      return null;
    }
  },
  
  async generateEmbeddings(texts: string[]): Promise<(number[] | null)[]> {
    try {
      const ext = await getExtractor();
      const results = await Promise.all(
        texts.map(text => ext(text, { pooling: 'mean', normalize: true }))
      );
      return results.map(r => Array.from(r.data));
    } catch (error) {
      logger.error('[embedding.worker] Error generando embeddings', 'worker', error);
      return texts.map(() => null);
    }
  },
  
  async isReady() {
    return ready;
  },
  
  getModelName() {
    return MODEL_NAME;
  },
};

export type EmbeddingWorkerAPI = typeof api;
Comlink.expose(api);
