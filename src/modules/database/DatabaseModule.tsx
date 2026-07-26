import { logger } from '../../services/LoggerService';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { dataService } from '../../services/DataService';
import { Product } from '../../core/types/product.types';
import { Search, Info, X } from 'lucide-react';
import { cloudSyncService } from '../../services/CloudSyncService';
import { useAuth } from '../../context/AuthContext';
import { EventBus, EventType } from '../../services/EventBus';
import { ScraperModal } from './ScraperModal';

import { DatabaseHeader } from './components/DatabaseHeader';
import { ProductMobileList } from './components/ProductMobileList';
import { ProductTable } from './components/ProductTable';
import { SearchFilters } from './components/SearchFilters';
import { searchService, SearchFacets } from '../../services/SearchService';
import { productsCollection } from '../../database';
import { ActivePrinciplesTable } from './components/ActivePrinciplesTable';
import { LayoutGrid, Beaker } from 'lucide-react';

export const DatabaseModule: React.FC = () => {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cloudCount, setCloudCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPrinciple, setSelectedPrinciple] = useState<string | null>(null);
  const [showScraperModal, setShowScraperModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'principles'>('products');
  const [facets, setFacets] = useState<SearchFacets>({ 
      categories: [], 
      activePrinciples: [],
      principlesWithCounts: []
  });

  const loadData = async (isManual = false) => {
    setIsLoading(true);
    try {
      const cCount = await cloudSyncService.getCloudCount();
      setCloudCount(cCount);

      // Check if we need to auto-restore
      const localCount = await productsCollection.query().fetchCount();
      if (localCount === 0 && cCount > 0 && !isManual) {
        setSyncStatus('Detectados datos en la nube. Restaurando automáticamente...');
        await handleSmartPull();
      }
    } catch (error) {
      logger.error('Error cargando DB:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Perform advanced search when terms or filters change
  useEffect(() => {
     const performSearch = async () => {
         const results = await searchService.search(searchTerm, {
             category: selectedCategory || undefined,
             principle: selectedPrinciple || undefined
         });
         setFilteredProducts(results);
     };
     performSearch();
  }, [searchTerm, selectedCategory, selectedPrinciple, products]);

  const handleSmartPull = async () => {
    setIsSyncing(true);
    setSyncStatus('Reconciliando datos con la nube (Delta Sync)...');
    try {
      const { downloaded } = await cloudSyncService.pullCloudData();
      if (downloaded > 0) {
        setSyncStatus(`Sincronización exitosa: ${downloaded} productos nuevos descargados.`);
        await loadData(true);
      } else {
        setSyncStatus('Ya estás al día con la nube.');
      }
    } catch (error) {
       setSyncStatus('Error en la sincronización inteligente.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(null), 5000);
    }
  };

  useEffect(() => {
    // We only call loadData() initially to get cloud counts
    loadData();

    // Suscribirse a actualizaciones de WatermelonDB para refrescar la lista local
    const subscription = productsCollection.query().observe().subscribe(async (records) => {
      if (!records) return;
      const allProducts = records.map(r => r.asJSON());
      setProducts(allProducts);
    });

    // Escuchar cuando el servicio de búsqueda termina de indexar para actualizar facetas
    const handleIndexReady = () => {
      setFacets(searchService.getFacets());
    };
    window.addEventListener('search_index_ready', handleIndexReady);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('search_index_ready', handleIndexReady);
    };
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonStr = e.target?.result as string;
        setIsLoading(true);
        const { success, errors } = await dataService.importProducts(jsonStr);
        await loadData();
        setSyncStatus(`Importados ${success} productos. Errores: ${errors}`);
      } catch (error) {
        alert('Error al importar JSON');
      }
    };
    reader.readAsText(file);
  };

  const handleFullPull = async () => {
    if (!confirm('¿Descargar TODOS los productos desde la nube? Esto reemplazará los datos locales.')) return;
    
    setIsSyncing(true);
    setSyncStatus('Limpiando base de datos local...');
    
    try {
      // Limpiar base de datos local
      await dataService.clearAll();
      logger.info('Base de datos local limpiada', 'DatabaseModule');
      
      setSyncStatus('Descargando todos los productos desde la nube...');
      
      // Importar catálogo completo
      const result = await dataService.importCatalog();
      
      if (result.success && result.count > 0) {
        setSyncStatus(`✓ Descarga completa: ${result.count} productos desde la nube.`);
        await loadData(true);
      } else if (result.error) {
        setSyncStatus(`⚠️ ${result.error}`);
      } else {
        setSyncStatus('⚠️ No se encontraron productos en la nube.');
      }
    } catch (error) {
      logger.error('Error en descarga completa', 'DatabaseModule', error);
      setSyncStatus('Error en descarga completa.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(null), 5000);
    }
  };

  const handleSyncToCloud = async () => {
    setIsSyncing(true);
    setSyncStatus('Respaldando en la nube (Supabase)...');
    try {
      const count = await cloudSyncService.uploadLocalProducts();
      setSyncStatus(`Respaldo completado: ${count} productos.`);
      setCloudCount(await cloudSyncService.getCloudCount());
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(null), 3000);
    }
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(products, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vademecum_backup.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (sku: string) => {
    if (!confirm('¿Eliminar producto?')) return;
    await dataService.deleteProduct(sku);
    await loadData();
  };

  return (
    <div className="w-full max-w-7xl mx-auto pb-24 px-3 sm:px-6 animate-in fade-in duration-500 pt-3 sm:pt-6">
      <DatabaseHeader 
        isAdmin={isAdmin}
        isSyncing={isSyncing}
        onShowScraper={() => setShowScraperModal(true)}
        onImportClick={() => fileInputRef.current?.click()}
        onExport={handleExportJSON}
        onSmartPull={handleSmartPull}
        onSyncToCloud={handleSyncToCloud}
        onFullPull={handleFullPull}
      />
      <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

      {syncStatus && (
        <div className="mb-6 p-4 bg-primary border border-primary/50 rounded-xl text-primary text-sm font-bold flex items-center gap-3">
          <Info className="w-5 h-5" /> {syncStatus}
        </div>
      )}

      {/* Main Layout: Filters + List */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <SearchFilters 
            categories={facets.categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            totalResults={filteredProducts.length}
        />

        <div className="flex-1 w-full space-y-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
            <div className="p-4 bg-card border-b border-border flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-primary text-primary rounded-full text-xs font-bold ring-1 ring-brand-primary/20">
                  {products.length} Local
                </span>
                {cloudCount !== null && (
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold ring-1 ring-emerald-500/20">
                    {cloudCount} Nube
                  </span>
                )}
                {selectedPrinciple && (
                  <span className="px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full text-xs font-bold ring-1 ring-amber-500/20 flex items-center gap-1.5">
                    <Beaker className="w-3 h-3" />
                    {selectedPrinciple}
                  </span>
                )}
                {(selectedCategory || selectedPrinciple) && (
                  <button 
                    onClick={() => { setSelectedCategory(null); setSelectedPrinciple(null); }}
                    className="flex items-center gap-1.5 px-2 py-0.5 bg-card text-[10px] text-muted-foreground rounded hover:bg-slate-700"
                  >
                    <X className="w-3 h-3" /> Limpiar filtros
                  </button>
                )}
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" placeholder="Búsqueda rápida (tolerancia a errores)..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:border-primary/50 outline-none"
                />
              </div>
            </div>

            <div className="p-4 bg-card border-b border-border flex gap-4">
              <button 
                onClick={() => setActiveTab('products')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'products' ? 'bg-primary text-foreground shadow-lg shadow-brand-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-card'}`}
              >
                <LayoutGrid className="w-4 h-4" />
                Productos
              </button>
              <button 
                onClick={() => setActiveTab('principles')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'principles' ? 'bg-primary text-foreground shadow-lg shadow-brand-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-card'}`}
              >
                <Beaker className="w-4 h-4" />
                Principios Activos
              </button>
            </div>

            {activeTab === 'products' ? (
              <>
                <ProductMobileList products={filteredProducts} isLoading={isLoading} onDelete={handleDelete} />
                <ProductTable products={filteredProducts} isLoading={isLoading} onDelete={handleDelete} />
              </>
            ) : (
                <ActivePrinciplesTable 
                  principles={facets.principlesWithCounts?.map(p => ({ name: p.principle, count: p.count })) || []} 
                  isLoading={isLoading} 
                  onSelect={(name) => {
                    setSelectedPrinciple(name);
                    setActiveTab('products');
                  }} 
                />
            )}
          </div>
        </div>
      </div>

      {showScraperModal && (
        <ScraperModal 
          onClose={() => setShowScraperModal(false)}
          onComplete={() => {
            setShowScraperModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
};
