/**
 * DashboardSimple - Interfaz Minimalista de Alto Rendimiento
 * Inspirado en appsimple: limpio, simple, rápido
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Pill } from 'lucide-react';
import { getCombinedKnowledgeBase } from '../../core/knowledge-base';
import { knowledgeSyncService } from '../../services/KnowledgeSyncService';
import { supabaseService } from '../../services/SupabaseService';
import { dataService } from '../../services/DataService';
import { searchService } from '../../services/SearchService';
import { productScrapingService } from '../../services/ProductScrapingService';
import { logger } from '../../services/LoggerService';
import { ProductDetailModalV2 } from '../product/ProductDetailModalV2';
import { ConnectionBanner } from '../ui/ConnectionBanner';
import { SearchView, CatalogView, SynergyView, SettingsView } from './dashboard/views';
import { DashboardHeader, DashboardSidebar } from './dashboard';
import { useAppStore, type AnalyzedProduct, loadPreferences } from '../../store';
import { analyzeProductWithKb } from '../../hooks/useAnalysis';
import { syncService } from '../../core/sync/sync-service';
import type { Product } from '../../types';
import { type ProductType, type TherapeuticFunction, type BodySystem } from '../../core/categorization';

export function DashboardSimple() {
  const {
    isLoading, loadingMessage, products, view, searchQuery,
    selectedProduct, scrapeStates,
    syncStatus, kbStats, setLoading, setView, setSearchQuery,
    setSelectedProduct, setProducts, setScrapeState,
    setSyncStatus, setKbStats, setSupabaseConnected, setKb, updateProduct
  } = useAppStore();

  // Estados para filtros jerárquicos
  const [selectedType, setSelectedType] = useState<ProductType | null>(null);
  const [selectedFunction, setSelectedFunction] = useState<TherapeuticFunction | null>(null);
  const [selectedSystem, setSelectedSystem] = useState<BodySystem | null>(null);

  // KB memoizada - se crea una sola vez
  const kb = useMemo(() => {
    logger.info('Inicializando Knowledge Base...', 'Dashboard');
    return getCombinedKnowledgeBase();
  }, []);
  
  const supabaseConnected = supabaseService.isConfigured();

  // Stats memoizadas
  const stats = useMemo(() => ({
    total: products.length,
    kbMatch: products.filter(p => p.cobertura_kb > 0).length,
    sinergias: products.filter(p => (p.sinergias_detectadas?.length || 0) > 0).length
  }), [products]);

  // Flag para evitar carga doble
  const loadedRef = useRef(false);
  // Referencia memoizada de la KB para usar en callbacks
  const kbRef = useRef(kb);
  kbRef.current = kb;

  // Cargar preferencias desde IndexedDB e inicializar servicios (solo una vez)
  useEffect(() => {
    loadPreferences();
    syncService.init({
      autoSync: false, // Desactivado por ahora para evitar problemas
      syncOnMount: false,
      enableAlerts: true,
    });
  }, []);

  // Escuchar eventos de búsqueda desde SearchBar
  useEffect(() => {
    const handleSearchChange = (e: CustomEvent<string>) => {
      setSearchQuery(e.detail);
    };
    window.addEventListener('searchChange', handleSearchChange as EventListener);
    return () => window.removeEventListener('searchChange', handleSearchChange as EventListener);
  }, [setSearchQuery]);

  // Sincronizar KB al iniciar (una sola vez)
  useEffect(() => {
    setSupabaseConnected(supabaseConnected);
    setKb(kb, Object.keys(kb).length);
    setKbStats(knowledgeSyncService.getStats());
  }, []); // Sin dependencias - ejecutar solo al montar

  // Cargar productos (solo una vez al montar)
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const loadProducts = async () => {
      setLoading(true, 'Cargando productos...');
      try {
        await searchService.initializeIndex();
        const indexed = searchService.getAllIndexedProducts();
        const source = indexed.length > 0 ? indexed : await dataService.getAllProducts();
        
        if (source.length > 0) {
          logger.info(`Analizando ${source.length} productos...`, 'Dashboard');
          
          // Usar kbRef para evitar problemas de dependencias
          const currentKb = kbRef.current;
          
          // Análisis en lotes para no bloquear el hilo principal
          const analyzed: AnalyzedProduct[] = [];
          for (let i = 0; i < source.length; i++) {
            const product = source[i];
            const { found, sinergias, antagonismos, kbAnalysis, categorization } = analyzeProductWithKb(product, currentKb);
            const principiosCount = (product.principios_activos || []).length;
            const cobertura = principiosCount > 0 ? Math.round((found.length / principiosCount) * 100) : 0;
            analyzed.push({
              ...product,
              ingredientes_encontrados: found,
              cobertura_kb: Math.min(cobertura, 100),
              sinergias_detectadas: sinergias,
              antagonismos_detectados: antagonismos,
              kbAnalysis,
              categorias_inferidas: categorization.categories,
              categoryLabels: categorization.categoryLabels
            } as AnalyzedProduct);
            
            // Actualizar UI cada 50 productos
            if (i % 50 === 0) {
              setLoading(true, `Analizando ${i}/${source.length}...`);
            }
          }
          
          setProducts(analyzed);
          logger.info(`Análisis completado: ${analyzed.length} productos`, 'Dashboard');
        }
      } catch (error) {
        logger.error('Error cargando productos', error);
      }
      setLoading(false);
    };
    loadProducts();
  }, []); // Sin dependencias de kb - usar kbRef dentro

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
            {view === 'buscar' && (
              <SearchView 
                products={products} 
                kb={kb} 
                query={searchQuery} 
                selectedType={selectedType}
                selectedFunction={selectedFunction}
                selectedSystem={selectedSystem}
                onTypeChange={setSelectedType}
                onFunctionChange={setSelectedFunction}
                onSystemChange={setSelectedSystem}
                onSelectProduct={setSelectedProduct}
                onScrapeProduct={handleScrapeProduct} 
                scrapeStates={scrapeStates} 
              />
            )}
            {view === 'catalogo' && <CatalogView stats={stats} kbStats={kbStats} syncStatus={syncStatus} onSync={handleSyncKb} />}
            {view === 'sinergias' && <SynergyView kb={kb} />}
            {view === 'ajustes' && <SettingsView connected={supabaseConnected} />}
          </div>
        </main>
      </div>
      {selectedProduct && <ProductDetailModalV2 product={selectedProduct} kb={kb} onClose={() => setSelectedProduct(null)}
        onScrape={handleScrapeProduct} scrapeState={scrapeStates[selectedProduct.sku] || 'idle'} />}
      
      {/* Banner de conexión */}
      <ConnectionBanner />
    </div>
  );
}

export default DashboardSimple;
