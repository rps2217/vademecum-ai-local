/**
 * Search Worker - Búsqueda con Orama
 * 
 * Worker dedicado para búsquedas rápidas usando Orama.
 * Corre en un Web Worker separado para no bloquear el main thread.
 */

/// <reference lib="webworker" />

import * as Comlink from 'comlink';
import { create, insertMultiple, search as oramaSearch, remove as oramaRemove, count } from '@orama/orama';
import { logger } from '../lib/logger';

let oramaDb: any = null;
let ready = false;

const schema = {
  id: 'string',
  type: 'string', // 'product' | 'ingredient'
  nombre: 'string',
  fabricante: 'string',
  principios: 'string[]',
  sistemas: 'string[]',
  indicaciones: 'string[]',
} as const;

async function buildIndex(products: any[], ingredients: any[]) {
  oramaDb = await create({ schema });
  
  const docs = [
    ...products.map((p: any) => ({
      id: `product:${p.sku}`,
      type: 'product',
      nombre: p.nombreComercial,
      fabricante: p.fabricante || '',
      principios: p.principiosActivos,
      sistemas: [],
      indicaciones: p.indicaciones,
    })),
    ...ingredients.map((i: any) => ({
      id: `ingredient:${i.id}`,
      type: 'ingredient',
      nombre: i.nombre,
      fabricante: '',
      principios: i.sinonimos,
      sistemas: i.sistemas,
      indicaciones: i.indicaciones,
    })),
  ];

  if (docs.length > 0) {
    await insertMultiple(oramaDb, docs);
  }
  
  ready = true;
  logger.info(`[search.worker] Índice listo: ${await count(oramaDb)} docs`, 'worker');
}

interface SearchOptions {
  limit?: number;
  type?: 'product' | 'ingredient' | 'all';
}

const api = {
  async init(products: any[], ingredients: any[]) {
    if (!ready) {
      await buildIndex(products, ingredients);
    }
  },
  
  async search(query: string, opts: SearchOptions = {}) {
    if (!ready) {
      logger.warn('[search.worker] Índice no listo aún', 'worker');
      return { hits: [], count: 0, duration: 0 };
    }
    
    const properties = opts.type === 'product' 
      ? ['nombre', 'fabricante', 'principios', 'indicaciones']
      : opts.type === 'ingredient'
      ? ['nombre', 'principios', 'sistemas', 'indicaciones']
      : ['nombre', 'fabricante', 'principios', 'sistemas', 'indicaciones'];

    return oramaSearch(oramaDb, {
      term: query,
      properties,
      limit: opts.limit ?? 30,
      boost: { nombre: 3, principios: 2, sistemas: 1.5 },
    });
  },
  
  async addDocument(doc: any) {
    if (!ready) return;
    
    try {
      await oramaRemove(oramaDb, doc.id);
    } catch {
      // Puede que no exista aún
    }
    
    await insertMultiple(oramaDb, [doc]);
  },
  
  async removeDocument(id: string) {
    if (!ready) return;
    
    try {
      await oramaRemove(oramaDb, id);
    } catch {
      // Puede que no exista
    }
  },
  
  async rebuildIndex(products: any[], ingredients: any[]) {
    ready = false;
    oramaDb = null;
    await buildIndex(products, ingredients);
  },
  
  async stats() {
    return { 
      count: ready ? await count(oramaDb) : 0, 
      ready,
    };
  },
};

export type SearchWorkerAPI = typeof api;
Comlink.expose(api);
