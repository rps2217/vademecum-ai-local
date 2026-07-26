/**
 * DashboardSimple - Interfaz Minimalista de Alto Rendimiento
 * Inspirado en appsimple: limpio, simple, rápido
 */

import { useEffect, useMemo, useRef } from 'react';
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
import { analyzeProductWithKb } from '../../hooks/useAnalysis';
import type { Product } from '../../types';

export function DashboardSimple() {
  const {
    isLoading, loadingMessage, products, view, searchQuery,
    selectedCategory, selectedProduct, scrapeStates,
    syncStatus, kbStats, setLoading, setView, setSearchQuery,
    setSelectedCategory, setSelectedProduct, setProducts, setScrapeState,
    setSyncStatus, setKbStats, setSupabaseConnected, setKb, updateProduct
  } = useAppStore();

  // Usar useMemo para evitar recalcular en cada render
  const kb = useMemo(() => getCombinedKnowledgeBase(), []);
  const supabaseConnected = supabaseService.isConfigured();
  
  // Usar useMemo para stats
  const stats = useMemo(() => ({
    total: products.length,
    kbMatch: products.filter(p => p.cobertura_kb > 0).length,
    sinergias: products.filter(p => (p.sinergias_detectadas?.length || 0) > 0).length
  }), [products]);
  
  const categories = useMemo(() => 
    [...new Set(products.flatMap(p => [p.categoria_principal, p.categoria].filter(Boolean)))].sort(),
    [products]
  );

  // Flag para evitar carga doble
  const loadedRef = useRef(false);

  // Sincronizar KB al iniciar
  useEffect(() => {
    const syncKb = async () => {
      setSupabaseConnected(supabaseConnected);
      setKb(kb, Object.keys(kb).length);
      if (!supabaseConnected) { setKbStats(knowledgeSyncService.getStats()); return; }
      const unsubscribe = knowledgeSyncService.addSyncListener((status) => {
        setSyncStatus({ status: status.status, pendingChanges: 0, error: status.error });
        if (status.status === 'synced') setKbStats(knowledgeSyncService.getStats());
      });
      if (knowledgeSyncService.needsSync()) await knowledgeSyncService.sync();
      setKbStats(knowledgeSyncService.getStats());
      return unsubscribe;
    };
    syncKb();
  }, [supabaseConnected]);

  // Cargar productos (solo una vez)
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    
    const loadProducts = async () => {
      setLoading(true, 'Inicializando...');
      try {
        await searchService.initializeIndex();
        const indexed = searchService.getAllIndexedProducts();
        const source = indexed.length > 0 ? indexed : await dataService.getAllProducts();
        if (source.length > 0) {
          logger.info(`Cargando ${source.length} productos`, 'Dashboard');
          const analyzed: AnalyzedProduct[] = source.map((product: Product) => {
            const { found, sinergias, antagonismos, kbAnalysis, categorization } = analyzeProductWithKb(product, kb);
            const principiosCount = (product.principios_activos || []).length;
            const cobertura = principiosCount > 0 ? Math.round((found.length / principiosCount) * 100) : 0;
            return { ...product, ingredientes_encontrados: found, cobertura_kb: Math.min(cobertura, 100),
              sinergias_detectadas: sinergias, antagonismos_detectados: antagonismos, kbAnalysis,
              categorias_inferidas: categorization.categories, categoryLabels: categorization.categoryLabels } as AnalyzedProduct;
          });
          setProducts(analyzed);
        }
      } catch (error) { logger.error('Error cargando productos', error); }
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
    if (!supabaseConnected) { alert('Conecta Supabase para sincronizar'); return; }
    const result = await knowledgeSyncService.sync();
    if (!result.success) alert('Error: ' + result.error);
  };

  const handleScrapeProduct = async (sku: string) => {
    if (scrapeStates[sku] === 'scraping') return;
    setScrapeState(sku, 'scraping');
    try {
      const result = await productScrapingService.scrape(sku);
      if (result.success && result.datos) {
        updateProduct(sku, { nombre_comercial: result.datos.nombre_comercial, descripcion: result.datos.descripcion,
          marca: result.datos.marca, categoria_principal: result.datos.categoria, precio: result.datos.precio, imagen_url: result.datos.imagen_url });
        setScrapeState(sku, 'success');
        setTimeout(() => setScrapeState(sku, 'idle'), 2000);
      } else { setScrapeState(sku, 'error'); setTimeout(() => setScrapeState(sku, 'idle'), 3000); }
    } catch { setScrapeState(sku, 'error'); setTimeout(() => setScrapeState(sku, 'idle'), 3000); }
  };

  // Filtrar productos
  const filteredProducts = useMemo(() => products.filter(p => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!p.nombre_comercial?.toLowerCase().includes(q) && !p.sku?.toLowerCase().includes(q) &&
          !p.principios_activos?.some(pa => pa.toLowerCase().includes(q))) return false;
    }
    if (selectedCategory !== 'todas' && p.categoria_principal?.toLowerCase() !== selectedCategory.toLowerCase()) return false;
    return true;
  }), [products, searchQuery, selectedCategory]);

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3"><Pill className="w-5 h-5 text-white" /></div>
        <p className="text-sm text-gray-500">{loadingMessage}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader productCount={stats.total} connected={supabaseConnected} query={searchQuery} onQueryChange={setSearchQuery} />
      <div className="flex-1 flex">
        <DashboardSidebar active={view} onChange={setView} stats={stats} />
        <main className="flex-1 p-4 max-w-4xl">
          <div className="animate-fade-in">
            {view === 'buscar' && <SearchView products={filteredProducts} kb={kb} query={searchQuery} categories={categories}
              selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} onSelectProduct={setSelectedProduct}
              onScrapeProduct={handleScrapeProduct} scrapeStates={scrapeStates} />}
            {view === 'catalogo' && <CatalogView stats={stats} kbStats={kbStats} syncStatus={syncStatus} onSync={handleSyncKb} />}
            {view === 'sinergias' && <SynergyView kb={kb} />}
            {view === 'ajustes' && <SettingsView connected={supabaseConnected} />}
          </div>
        </main>
      </div>
      {selectedProduct && <ProductDetailModal product={selectedProduct} kb={kb} onClose={() => setSelectedProduct(null)}
        onScrape={handleScrapeProduct} scrapeState={scrapeStates[selectedProduct.sku] || 'idle'} />}
    </div>
  );
}

export default DashboardSimple;
