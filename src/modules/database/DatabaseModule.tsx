import { logger } from '../../services/LoggerService';
import React, { useEffect, useState, useRef } from 'react';
import { dataService } from '../../services/DataService';
import { Product } from '../../core/types/product.types';
import { Search, Info, X } from 'lucide-react';
import { cloudSyncService } from '../../services/CloudSyncService';
import { useAuth } from '../../context/AuthContext';
import { ScraperModal } from './ScraperModal';

import { DatabaseHeader } from './components/DatabaseHeader';
import { ProductMobileList } from './components/ProductMobileList';
import { ProductTable } from './components/ProductTable';
import { searchService } from '../../services/SearchService';
import { productsCollection } from '../../database';
import { LayoutGrid, Beaker } from 'lucide-react';

/**
 * DatabaseModule - Catálogo Simplificado
 * Vista limpia sin filtros complejos, solo búsqueda rápida
 */
export const DatabaseModule: React.FC = () => {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cloudCount, setCloudCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showScraperModal, setShowScraperModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async (isManual = false) => {
    setIsLoading(true);
    try {
      const cCount = await cloudSyncService.getCloudCount();
      setCloudCount(cCount);

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

  // Búsqueda simple
  useEffect(() => {
    const performSearch = async () => {
      if (!searchTerm.trim()) {
        setFilteredProducts(products);
        return;
      }
      const results = await searchService.search(searchTerm, {});
      setFilteredProducts(results);
    };
    performSearch();
  }, [searchTerm, products]);

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
    loadData();

    const subscription = productsCollection.query().observe().subscribe(async (records) => {
      if (!records) return;
      const allProducts = records.map(r => r.asJSON());
      setProducts(allProducts);
      setFilteredProducts(allProducts);
    });

    return () => {
      subscription.unsubscribe();
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
      await dataService.clearAll();
      logger.info('Base de datos local limpiada', 'DatabaseModule');
      
      setSyncStatus('Descargando todos los productos desde la nube...');
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

      {/* Lista simplificada sin filtros */}
      <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
        {/* Header con búsqueda */}
        <div className="p-4 bg-card border-b border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-violet-500/10 text-violet-600 rounded-full text-xs font-bold">
              {filteredProducts.length.toLocaleString()} productos
            </span>
            {cloudCount !== null && (
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold">
                {cloudCount.toLocaleString()} en nube
              </span>
            )}
          </div>
          
          {/* Búsqueda rápida */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar productos..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
            />
          </div>
        </div>

        {/* Tabla de productos */}
        <ProductMobileList products={filteredProducts} isLoading={isLoading} onDelete={handleDelete} />
        <ProductTable products={filteredProducts} isLoading={isLoading} onDelete={handleDelete} />
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
