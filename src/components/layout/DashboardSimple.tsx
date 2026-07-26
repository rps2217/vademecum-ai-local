/**
 * DashboardSimple - Interfaz Minimalista de Alto Rendimiento
 * Inspirado en appsimple: limpio, simple, rápido
 * Usa Zustand para estado global centralizado
 */

import React, { useEffect } from 'react';
import { Pill } from 'lucide-react';
import { getCombinedKnowledgeBase } from '../../core/knowledge-base';
import { knowledgeSyncService } from '../../services/KnowledgeSyncService';
import { supabaseService } from '../../services/SupabaseService';
import { dataService } from '../../services/DataService';
import { searchService } from '../../services/SearchService';
import { productScrapingService } from '../../services/ProductScrapingService';
import { logger } from '../../services/LoggerService';
import { ProductDetailModal } from '../product/ProductDetailModal';
import { SearchView, CatalogView, SynergyView, SettingsView } from './dashboard/views';
import { DashboardHeader, DashboardSidebar } from './dashboard';
import { useAppStore, type AnalyzedProduct } from '../../store';
import { productCategorizationService } from '../../services/ProductCategorizationService';
import { knowledgeService } from '../../services/KnowledgeService';
import { synergyGraphService } from '../../core/knowledge-base/SynergyGraph';
import type { Product } from '../../types';

/**
 * Analizar un producto con la KB
 */
function analyzeProduct(product: Product, kb: Record<string, any>): {
  found: string[];
  sinergias: string[];
  kbAnalysis: any;
  categorization: any;
} {
  const found: string[] = [];
  const principios = (product.principios_activos || []).map(p => String(p).toLowerCase());

  for (const [id, ing] of Object.entries(kb)) {
    const ingName = String((ing as any).nombre).toLowerCase();
    for (const principio of principios) {
      if (principio.includes(ingName) || ingName.includes(principio)) {
        if (!found.includes(id)) found.push(id);
      }
    }
  }

  const sinergias: string[] = [];
  for (const id of found) {
    const sin = synergyGraphService.obtenerSinergiasDe(id);
    for (const s of sin) {
      if (found.includes(s.hacia)) {
        const key = [id, s.hacia].sort().join('+');
        if (!sinergias.some(x => x.includes(key))) {
          sinergias.push(`${id} + ${s.hacia}`);
        }
      }
    }
  }

  const kbAnalysis = knowledgeService.analyzeProduct({
    sku: product.sku,
    nombre_comercial: product.nombre_comercial,
    principios_activos: product.principios_activos
  });

  const categorization = productCategorizationService.getCategorizationDetails({
    sku: product.sku,
    nombre_comercial: product.nombre_comercial,
    principios_activos: product.principios_activos,
    descripcion: product.descripcion,
    categoria: product.categoria_principal || product.categoria
  });

  return { found, sinergias, kbAnalysis, categorization };
}

// ==================== MAIN COMPONENT ====================

export function DashboardSimple() {
  const {
    isLoading, loadingMessage, products, view, searchQuery,
    selectedCategory, selectedProduct, scrapeStates,
    syncStatus, kbStats, setLoading, setView, setSearchQuery,
    setSelectedCategory, setSelectedProduct, setProducts, setScrapeState,
    setSyncStatus, setKbStats, setSupabaseConnected, setKb, updateProduct
  } = useAppStore();

  const kb = getCombinedKnowledgeBase();
  const supabaseConnected = supabaseService.isConfigured();
  const stats = useAppStore(state => ({
    total: state.products.length,
    kbMatch: state.products.filter(p => p.cobertura_kb > 0).length,
    sinergias: state.products.filter(p => (p.sinergias_detectadas?.length || 0) > 0).length
  }));
  const categories = [...new Set(products.flatMap(p => [p.categoria_principal, p.categoria].filter(Boolean)))].sort();

  // Sincronizar KB al iniciar
  useEffect(() => {
    const syncKb = async () => {
      setSupabaseConnected(supabaseConnected);
      setKb(kb, Object.keys(kb).length);

      if (!supabaseConnected) {
        setKbStats(knowledgeSyncService.getStats());
        return;
      }

      const unsubscribe = knowledgeSyncService.addSyncListener((status) => {
        setSyncStatus({ status: status.status, pendingChanges: 0, error: status.error });
        if (status.status === 'synced') setKbStats(knowledgeSyncService.getStats());
      });

      if (knowledgeSyncService.needsSync()) {
        await knowledgeSyncService.sync();
      }
      setKbStats(knowledgeSyncService.getStats());

      return unsubscribe;
    };

    syncKb();
  }, [supabaseConnected, kb]);

  // Cargar productos
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true, 'Inicializando...');
      
      try {
        await searchService.initializeIndex();
        const indexedProducts = searchService.getAllIndexedProducts();
        
        const sourceProducts = indexedProducts.length > 0 
          ? indexedProducts 
          : await dataService.getAllProducts();

        if (sourceProducts.length > 0) {
          logger.info(`Cargando ${sourceProducts.length} productos`, 'Dashboard');
          
          const analyzed: AnalyzedProduct[] = sourceProducts.map((product: Product) => {
            const { found, sinergias, kbAnalysis, categorization } = analyzeProduct(product, kb);
            const principiosCount = (product.principios_activos || []).length;
            const cobertura = principiosCount > 0 ? Math.round((found.length / principiosCount) * 100) : 0;
            
            return {
              ...product,
              ingredientes_encontrados: found,
              cobertura_kb: Math.min(cobertura, 100),
              sinergias_detectadas: sinergias,
              antagonismos_detectados: [],
              kbAnalysis,
              categorias_inferidas: categorization.categories,
              categoryLabels: categorization.categoryLabels
            } as AnalyzedProduct;
          });
          
          setProducts(analyzed);
        }
      } catch (error) {
        logger.error('Error cargando productos', error);
      }
      
      setLoading(false);
    };

    loadProducts();
  }, [kb]);

  // Keyboard shortcut: Ctrl+K
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

  // Handlers
  const handleSyncKb = async () => {
    if (!supabaseConnected) {
      alert('Conecta Supabase para sincronizar');
      return;
    }
    const result = await knowledgeSyncService.sync();
    if (!result.success) alert('Error: ' + result.error);
  };

  const handleScrapeProduct = async (sku: string) => {
    if (scrapeStates[sku] === 'scraping') return;
    setScrapeState(sku, 'scraping');
    
    try {
      const result = await productScrapingService.scrape(sku);
      if (result.success && result.datos) {
        updateProduct(sku, {
          nombre_comercial: result.datos.nombre_comercial,
          descripcion: result.datos.descripcion,
          marca: result.datos.marca,
          categoria_principal: result.datos.categoria,
          precio: result.datos.precio,
          imagen_url: result.datos.imagen_url,
        });
        setScrapeState(sku, 'success');
        setTimeout(() => setScrapeState(sku, 'idle'), 2000);
      } else {
        setScrapeState(sku, 'error');
        setTimeout(() => setScrapeState(sku, 'idle'), 3000);
      }
    } catch {
      setScrapeState(sku, 'error');
      setTimeout(() => setScrapeState(sku, 'idle'), 3000);
    }
  };

  // Filtrar productos
  const filteredProducts = products.filter(p => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!p.nombre_comercial?.toLowerCase().includes(q) &&
          !p.sku?.toLowerCase().includes(q) &&
          !p.principios_activos?.some(pa => pa.toLowerCase().includes(q))) {
        return false;
      }
    }
    if (selectedCategory !== 'todas' && p.categoria_principal?.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }
    return true;
  });

  if (isLoading) {
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
      <DashboardHeader 
        productCount={stats.total} 
        connected={supabaseConnected}
        query={searchQuery}
        onQueryChange={setSearchQuery}
      />
      
      <div className="flex-1 flex">
        <DashboardSidebar 
          active={view} 
          onChange={setView}
          stats={stats}
        />
        
        <main className="flex-1 p-4 max-w-4xl">
          <div className="animate-fade-in">
            {view === 'buscar' && (
              <SearchView 
                products={filteredProducts}
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
