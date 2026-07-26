/**
 * Servicio de Base de Datos Local - Offline First
 * 
 * Usa Dexie.js para IndexedDB con sincronización inteligente.
 * Supabase se usa como backup/remoto, no como fuente primaria.
 */

import Dexie, { type Table } from 'dexie';
import { Product } from '../types/product.types';
import { SynergyCache } from './types';
import { logger } from '../../services/LoggerService';

// Versión de la base de datos
const DB_VERSION = 1;

class VademecumDatabase extends Dexie {
  productos!: Table<Product, string>;
  cacheSinergias!: Table<SynergyCache, string>;
  analisisCompletados!: Table<{ id: string; fecha: number; datos: any }, string>;
  sincronizacionMeta!: Table<{ key: string; value: any }, string>;
  
  constructor() {
    super('VademecumDB');
    
    this.version(DB_VERSION).stores({
      productos: 'sku, nombre_comercial, categoria, updated_at, sync_status',
      cacheSinergias: '[producto1_sku+producto2_sku], producto1_sku, producto2_sku, fecha_analisis',
      analisisCompletados: 'id, fecha, tipo',
      sincronizacionMeta: 'key'
    });
  }
}

class LocalDatabaseService {
  private db: VademecumDatabase;
  private isInitialized = false;
  
  constructor() {
    this.db = new VademecumDatabase();
  }
  
  async init(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      await this.db.open();
      this.isInitialized = true;
      logger.info('Base de datos local inicializada', 'LocalDatabase');
    } catch (error) {
      logger.error('Error inicializando IndexedDB', 'LocalDatabase', error);
      throw error;
    }
  }
  
  // ==================== PRODUCTOS ====================
  
  async guardarProducto(producto: Product): Promise<void> {
    await this.db.productos.put({
      ...producto,
      updated_at: Date.now(),
      sync_status: 'local'
    });
  }
  
  async guardarProductos(productos: Product[]): Promise<void> {
    const productosConMeta = productos.map(p => ({
      ...p,
      updated_at: Date.now(),
      sync_status: 'local' as const
    }));
    await this.db.productos.bulkPut(productosConMeta);
  }
  
  async obtenerProducto(sku: string): Promise<Product | undefined> {
    return this.db.productos.get(sku);
  }
  
  async obtenerTodosLosProductos(): Promise<Product[]> {
    return this.db.productos.toArray();
  }
  
  async obtenerProductosLocales(): Promise<Product[]> {
    return this.db.productos
      .where('sync_status')
      .equals('local')
      .toArray();
  }
  
  async obtenerProductosActualizados(desde: number): Promise<Product[]> {
    return this.db.productos
      .where('updated_at')
      .above(desde)
      .toArray();
  }
  
  async obtenerProductosPorCategoria(categoria: string): Promise<Product[]> {
    return this.db.productos
      .where('categoria')
      .equals(categoria)
      .toArray();
  }
  
  async buscarProductos(query: string): Promise<Product[]> {
    const normalizedQuery = query.toLowerCase();
    return this.db.productos
      .filter(p => 
        p.nombre_comercial?.toLowerCase().includes(normalizedQuery) ||
        p.principios_activos?.some(pa => pa.toLowerCase().includes(normalizedQuery)) ||
        p.indicaciones?.some(ind => ind.toLowerCase().includes(normalizedQuery)))
      )
      .limit(50)
      .toArray();
  }
  
  async contarProductos(): Promise<number> {
    return this.db.productos.count();
  }
  
  async eliminarProducto(sku: string): Promise<void> {
    await this.db.productos.delete(sku);
  }
  
  async limpiarProductos(): Promise<void> {
    await this.db.productos.clear();
  }
  
  // ==================== CACHE DE SINERGIAS ====================
  
  async guardarSinergia(cache: SynergyCache): Promise<void> {
    const key = `${cache.producto1_sku}_${cache.producto2_sku}`;
    await this.db.cacheSinergias.put({
      ...cache,
      fecha_analisis: Date.now()
    });
  }
  
  async obtenerSinergia(sku1: string, sku2: string): Promise<SynergyCache | undefined> {
    const key = `${sku1}_${sku2}`;
    return this.db.cacheSinergias.get(key);
  }
  
  async obtenerSinergiasDeProducto(sku: string): Promise<SynergyCache[]> {
    return this.db.cacheSinergias
      .where('producto1_sku')
      .equals(sku)
      .or('producto2_sku')
      .equals(sku)
      .toArray();
  }
  
  async limpiarSinergiasAntiguas(antiguedadDias: number = 30): Promise<void> {
    const cutoff = Date.now() - (antiguedadDias * 24 * 60 * 60 * 1000);
    await this.db.cacheSinergias
      .where('fecha_analisis')
      .below(cutoff)
      .delete();
  }
  
  // ==================== METADATOS DE SINCRONIZACIÓN ====================
  
  async guardarMetaSincronizacion(key: string, value: any): Promise<void> {
    await this.db.sincronizacionMeta.put({ key, value });
  }
  
  async obtenerMetaSincronizacion<T>(key: string): Promise<T | undefined> {
    const meta = await this.db.sincronizacionMeta.get(key);
    return meta?.value as T | undefined;
  }
  
  async obtenerUltimaSincronizacion(): Promise<number | undefined> {
    return this.obtenerMetaSincronizacion<number>('ultima_sincronizacion');
  }
  
  async guardarUltimaSincronizacion(timestamp: number): Promise<void> {
    await this.guardarMetaSincronizacion('ultima_sincronizacion', timestamp);
  }
  
  async obtenerVersionBaseDatos(): Promise<number> {
    return (await this.obtenerMetaSincronizacion<number>('version_db')) || 0;
  }
  
  async guardarVersionBaseDatos(version: number): Promise<void> {
    await this.guardarMetaSincronizacion('version_db', version);
  }
  
  // ==================== ESTADÍSTICAS ====================
  
  async obtenerEstadisticas(): Promise<{
    total_productos: number;
    productos_locales: number;
    sinergias_cacheadas: number;
    ultima_sincronizacion: number | null;
    version_db: number;
    tamano_estimado: string;
  }> {
    const [total, locales, sinergias, version, timestamp] = await Promise.all([
      this.db.productos.count(),
      this.db.productos.where('sync_status').equals('local').count(),
      this.db.cacheSinergias.count(),
      this.obtenerVersionBaseDatos(),
      this.obtenerUltimaSincronizacion()
    ]);
    
    const tamanoEstimado = `${((total * 2048) / (1024 * 1024)).toFixed(1)} MB`;
    
    return {
      total_productos: total,
      productos_locales: locales,
      sinergias_cacheadas: sinergias,
      ultima_sincronizacion: timestamp || null,
      version_db: version,
      tamano_estimado: tamanoEstimado
    };
  }
  
  // ==================== EXPORTAR/IMPORTAR ====================
  
  async exportarDatos(): Promise<{
    productos: Product[];
    sinergias: SynergyCache[];
    metadatos: Record<string, any>;
    fecha_exportacion: number;
  }> {
    const [productos, sinergias, metadatosRaw] = await Promise.all([
      this.db.productos.toArray(),
      this.db.cacheSinergias.toArray(),
      this.db.sincronizacionMeta.toArray()
    ]);
    
    const metadatos = metadatosRaw.reduce((acc, m) => {
      acc[m.key] = m.value;
      return acc;
    }, {} as Record<string, any>);
    
    return {
      productos,
      sinergias,
      metadatos,
      fecha_exportacion: Date.now()
    };
  }
  
  async importarDatos(datos: {
    productos?: Product[];
    sinergias?: SynergyCache[];
    metadatos?: Record<string, any>;
  }): Promise<{ productos: number; sinergias: number }> {
    let productosImportados = 0;
    let sinergiasImportadas = 0;
    
    if (datos.productos && datos.productos.length > 0) {
      await this.db.productos.bulkPut(datos.productos);
      productosImportados = datos.productos.length;
    }
    
    if (datos.sinergias && datos.sinergias.length > 0) {
      await this.db.cacheSinergias.bulkPut(datos.sinergias);
      sinergiasImportadas = datos.sinergias.length;
    }
    
    if (datos.metadatos) {
      for (const [key, value] of Object.entries(datos.metadatos)) {
        await this.guardarMetaSincronizacion(key, value);
      }
    }
    
    return { productos: productosImportados, sinergias: sinergiasImportadas };
  }
  
  // ==================== LIMPIEZA ====================
  
  async limpiarTodo(): Promise<void> {
    await Promise.all([
      this.db.productos.clear(),
      this.db.cacheSinergias.clear(),
      this.db.analisisCompletados.clear()
    ]);
  }
  
  async compactaBaseDatos(): Promise<void> {
    await this.limpiarSinergiasAntiguas(90);
  }
}

export const localDatabaseService = new LocalDatabaseService();
export { VademecumDatabase };
