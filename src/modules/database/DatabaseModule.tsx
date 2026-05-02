import React, { useEffect, useState, useRef, useMemo } from 'react';
import { dataService } from '../../services/DataService';
import { Product } from '../../core/types/product.types';
import { Search, Info } from 'lucide-react';
import { cloudSyncService } from '../../services/CloudSyncService';
import { useAuth } from '../../context/AuthContext';
import { EventBus, EventType } from '../../services/EventBus';
import { ScraperModal } from './ScraperModal';

import { DatabaseHeader } from './components/DatabaseHeader';
import { ProductMobileList } from './components/ProductMobileList';
import { ProductTable } from './components/ProductTable';

export const DatabaseModule: React.FC = () => {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cloudCount, setCloudCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showScraperModal, setShowScraperModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async (isManual = false) => {
    setIsLoading(true);
    try {
      const allProducts = await dataService.getAllProducts();
      setProducts(allProducts);
      const cCount = await cloudSyncService.getCloudCount();
      setCloudCount(cCount);

      // Auto-Restore Logic: If local is empty but cloud has data, suggest or auto-pull
      if (allProducts.length === 0 && cCount > 0 && !isManual) {
        setSyncStatus('Detectados datos en la nube. Restaurando automáticamente...');
        await handleSmartPull();
      }
    } catch (error) {
      console.error('Error cargando DB:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

    // Suscribirse a actualizaciones para refrescar el estado de sincronización
    const sub = EventBus.on<any>(EventType.DB_UPDATED).subscribe(() => loadData(true));
    const subProduct = EventBus.on<any>(EventType.PRODUCT_UPDATED).subscribe(() => loadData(true));

    return () => {
      sub.unsubscribe();
      subProduct.unsubscribe();
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

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const term = searchTerm.toLowerCase();
    return products.filter(p => p.nombre_comercial.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term));
  }, [products, searchTerm]);

  return (
    <div className="w-full max-w-6xl mx-auto pb-24 px-3 sm:px-6 animate-in fade-in duration-500 pt-3 sm:pt-6">
      <DatabaseHeader 
        isAdmin={isAdmin}
        isSyncing={isSyncing}
        onShowScraper={() => setShowScraperModal(true)}
        onImportClick={() => fileInputRef.current?.click()}
        onExport={handleExportJSON}
        onSmartPull={handleSmartPull}
        onSyncToCloud={handleSyncToCloud}
      />
      <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

      {syncStatus && (
        <div className="mb-6 p-4 bg-brand-primary/10 border border-brand-primary/20 rounded-xl text-brand-primary text-sm font-bold flex items-center gap-3">
          <Info className="w-5 h-5" /> {syncStatus}
        </div>
      )}

      <div className="bg-brand-surface border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 bg-slate-900/50 border-b border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-xs font-bold ring-1 ring-brand-primary/20">
              {products.length} Local
            </span>
            {cloudCount !== null && (
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold ring-1 ring-emerald-500/20">
                {cloudCount} Nube
              </span>
            )}
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-brand-bg border border-slate-700 rounded-xl text-sm text-white focus:border-brand-primary outline-none"
            />
          </div>
        </div>

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
