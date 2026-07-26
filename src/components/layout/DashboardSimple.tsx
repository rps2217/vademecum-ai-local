/**
 * DashboardSimple - Interfaz Minimalista de Alto Rendimiento
 * Inspirado en appsimple: limpio, simple, rápido
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  X, ChevronRight, CheckCircle2, AlertCircle, 
  Loader2, Sparkles, Copy, Info, TrendingUp, RefreshCw
} from 'lucide-react';
import { getCombinedKnowledgeBase } from '../../core/knowledge-base';
import { knowledgeSyncService, type SyncStatus } from '../../services/KnowledgeSyncService';
import { supabaseService } from '../../services/SupabaseService';
import { dataService } from '../../services/DataService';
import { searchService } from '../../services/SearchService';
import { productScrapingService } from '../../services/ProductScrapingService';
import { cn } from '../../lib/utils';
import { logger } from '../../services/LoggerService';
import { SupabaseSetup } from '../common/SupabaseSetup';
import { ProductDetailModal } from '../product/ProductDetailModal';
import { SearchView, CatalogView, SynergyView, SettingsView } from './dashboard/views';
import { DashboardHeader, DashboardSidebar, CategoryFilter, EmptyState } from './dashboard';
import { useAnalysis, type AnalyzedProduct } from '../../hooks/useAnalysis';
import type { Product } from '../../types';

// Tipos locales
type ViewType = 'buscar' | 'catalogo' | 'sinergias' | 'ajustes';

interface ScrapingState {
  [sku: string]: 'idle' | 'scraping' | 'success' | 'error';
}


// ==================== MAIN COMPONENT ====================

export function DashboardSimple() {
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Cargando...');
  const [products, setProducts] = useState<AnalyzedProduct[]>([]);
  const [view, setView] = useState<ViewType>('buscar');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [selectedProduct, setSelectedProduct] = useState<AnalyzedProduct | null>(null);
  const [scrapeStates, setScrapeStates] = useState<ScrapingState>({});
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ status: 'idle' });
  const [kbStats, setKbStats] = useState({ total: 0, families: 0, types: 0 });

  const kb = useMemo(() => getCombinedKnowledgeBase(), []);
  const supabaseConnected = supabaseService.isConfigured();

  // Sincronizar KB con Supabase al iniciar
  useEffect(() => {
    const syncKb = async () => {
      if (!supabaseConnected) {
        console.log('[Dashboard] Supabase no conectado, usando KB local');
        setKbStats(knowledgeSyncService.getStats());
        return;
      }

      // Registrar listener de sincronización
      const unsubscribe = knowledgeSyncService.addSyncListener((status) => {
        setSyncStatus(status);
        if (status.status === 'synced') {
          setKbStats(knowledgeSyncService.getStats());
        }
      });

      // Verificar si necesita sincronización
      if (knowledgeSyncService.needsSync()) {
        console.log('[Dashboard] Iniciando sincronización de KB...');
        const result = await knowledgeSyncService.sync();
        if (result.success) {
          setKbStats(knowledgeSyncService.getStats());
        }
      } else {
        setKbStats(knowledgeSyncService.getStats());
      }

      return unsubscribe;
    };

    syncKb();
  }, [supabaseConnected]);

  // Función para forzar sincronización
  const handleSyncKb = useCallback(async () => {
    if (!supabaseConnected) {
      alert('Conecta Supabase para sincronizar la base de conocimiento');
      return;
    }
    const result = await knowledgeSyncService.sync();
    if (result.success) {
      setKbStats(knowledgeSyncService.getStats());
    } else {
      alert('Error sincronizando: ' + result.error);
    }
  }, [supabaseConnected]);
  
  // Función para hacer scraping on-demand de un producto
  const handleScrapeProduct = useCallback(async (sku: string) => {
    if (scrapeStates[sku] === 'scraping') return;
    
    setScrapeStates(prev => ({ ...prev, [sku]: 'scraping' }));
    
    try {
      const result = await productScrapingService.scrape(sku);
      
      if (result.success && result.datos) {
        setProducts(prev => prev.map(p => {
          if (p.sku === sku) {
            return {
              ...p,
              nombre_comercial: result.datos?.nombre_comercial || p.nombre_comercial,
              descripcion: result.datos?.descripcion || p.descripcion,
              marca: result.datos?.marca || p.marca,
              categoria_principal: result.datos?.categoria || p.categoria_principal,
              precio: result.datos?.precio || p.precio,
              imagen_url: result.datos?.imagen_url || p.imagen_url,
            };
          }
          return p;
        }));
        setScrapeStates(prev => ({ ...prev, [sku]: 'success' }));
        setTimeout(() => setScrapeStates(prev => ({ ...prev, [sku]: 'idle' })), 2000);
      } else {
        setScrapeStates(prev => ({ ...prev, [sku]: 'error' }));
        setTimeout(() => setScrapeStates(prev => ({ ...prev, [sku]: 'idle' })), 3000);
      }
    } catch (error) {
      setScrapeStates(prev => ({ ...prev, [sku]: 'error' }));
      setTimeout(() => setScrapeStates(prev => ({ ...prev, [sku]: 'idle' })), 3000);
    }
  }, [scrapeStates]);

  // Extraer categorías
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      if (p.categoria_principal) cats.add(p.categoria_principal);
      if (p.categoria) cats.add(p.categoria);
    });
    return Array.from(cats).sort();
  }, [products]);

  // Stats
  const stats = useMemo(() => {
    const total = products.length;
    const kbMatch = products.filter(p => p.cobertura_kb > 0).length;
    const sinergias = products.filter(p => (p.sinergias_detectadas?.length || 0) > 0).length;
    return { total, kbMatch, sinergias };
  }, [products]);

  // Cargar productos
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setLoadingMessage('Inicializando...');
      
      try {
        // Esperar a que el índice esté listo
        await searchService.initializeIndex();
        const indexedProducts = searchService.getAllIndexedProducts();
        
        if (indexedProducts.length > 0) {
          logger.info(`Cargando ${indexedProducts.length} productos`, 'Dashboard');
          
          const analyzed = indexedProducts.map((product: Product) => {
            const { found, sinergias, kbAnalysis, categorization } = analyzeProduct(product, kb);
            const principiosCount = (product.principios_activos || []).length;
            const cobertura = principiosCount > 0 ? Math.round((found.length / principiosCount) * 100) : 0;
            return {
              ...product,
              ingredientes_encontrados: found,
              cobertura_kb: Math.min(cobertura, 100),
              sinergias_detectadas: sinergias,
              kbAnalysis,
              categorias_inferidas: categorization.categories,
              categoryLabels: categorization.categoryLabels
            };
          });
          
          setProducts(analyzed);
        } else {
          // Fallback a DataService
          const fromService = await dataService.getAllProducts();
          if (fromService.length > 0) {
            const analyzed = fromService.map((product: Product) => {
              const { found, sinergias, kbAnalysis, categorization } = analyzeProduct(product, kb);
              const principiosCount = (product.principios_activos || []).length;
              const cobertura = principiosCount > 0 ? Math.round((found.length / principiosCount) * 100) : 0;
              return {
                ...product,
                ingredientes_encontrados: found,
                cobertura_kb: Math.min(cobertura, 100),
                sinergias_detectadas: sinergias,
                kbAnalysis,
                categorias_inferidas: categorization.categories,
                categoryLabels: categorization.categoryLabels
              };
            });
            setProducts(analyzed);
          }
        }
      } catch (error) {
        logger.error('Error cargando productos', error);
      }
      
      setLoading(false);
    };

    loadProducts();
  }, [kb]);

  // Keyboard shortcut: Ctrl+K para focus en búsqueda
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('input[placeholder="Buscar medicamento..."]')?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Pill className="w-5 h-5 text-white" />
          </div>
          <p className="text-sm text-gray-500">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderSimple 
        productCount={stats.total} 
        connected={supabaseConnected}
        query={searchQuery}
        onQueryChange={setSearchQuery}
      />
      
      <div className="flex-1 flex">
        <Sidebar 
          active={view} 
          onChange={setView}
          stats={stats}
        />
        
        <main className="flex-1 p-4 max-w-4xl">
          <div className="animate-fade-in">
            {view === 'buscar' && (
              <SearchView 
                products={products}
                kb={kb}
                query={searchQuery}
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                onSelectProduct={setSelectedProduct}
                onScrapeProduct={handleScrapeProduct}
                scrapeStates={scrapeStates}
              />
            )}
            
            {view === 'catalogo' && (
              <CatalogView 
                stats={stats} 
                kbStats={kbStats}
                syncStatus={syncStatus}
                onSync={handleSyncKb}
              />
            )}
            
            {view === 'sinergias' && <SynergyView kb={kb} />}
            
            {view === 'ajustes' && <SettingsView connected={supabaseConnected} />}
          </div>
        </main>
      </div>

      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct} 
          kb={kb}
          onClose={() => setSelectedProduct(null)}
          onScrape={handleScrapeProduct}
          scrapeState={scrapeStates[selectedProduct.sku] || 'idle'}
        />
      )}
    </div>
  );
}

export default DashboardSimple;
