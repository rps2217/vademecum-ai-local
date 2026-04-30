import React, { useEffect, useState, useRef, useMemo } from 'react';
import { DataService } from '../../services/DataService';
import { Product } from '../../core/types/product.types';
import { 
  Database, Trash2, RefreshCw, FileUp, 
  ChevronLeft, ChevronRight, Download,
  Search, Monitor, CloudUpload, Info, AlertCircle,
  Cloud, CloudOff, CheckCircle, Sparkles
} from 'lucide-react';
import { CloudSyncService } from '../../services/CloudSyncService';
import { useAuth } from '../../context/AuthContext';
import { EventBus, EventType } from '../../services/EventBus';
import { ScraperModal } from './ScraperModal';

const ITEMS_PER_PAGE = 50;

export const DatabaseModule: React.FC = () => {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cloudCount, setCloudCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showScraperModal, setShowScraperModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async (isManual = false) => {
    setIsLoading(true);
    try {
      const allProducts = await DataService.getAllProducts();
      setProducts(allProducts);
      const cCount = await CloudSyncService.getCloudCount();
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
      const { downloaded } = await CloudSyncService.pullCloudData();
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
        const { success, errors } = await DataService.importProducts(jsonStr);
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
      const count = await CloudSyncService.uploadLocalProducts();
      setSyncStatus(`Respaldo completado: ${count} productos.`);
      setCloudCount(await CloudSyncService.getCloudCount());
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
    await DataService.deleteProduct(sku);
    await loadData();
  };

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const term = searchTerm.toLowerCase();
    return products.filter(p => p.nombre_comercial.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term));
  }, [products, searchTerm]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const currentProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="w-full max-w-6xl mx-auto pb-24 px-3 sm:px-6 animate-in fade-in duration-500 pt-3 sm:pt-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 sm:mb-8 gap-4 sm:gap-6">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-3 bg-brand-primary/10 rounded-xl sm:rounded-2xl">
            <Database className="w-6 h-6 sm:w-8 sm:h-8 text-brand-primary" />
          </div>
          <div>
            <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">Base de Datos</h2>
            <p className="text-slate-400 font-medium text-[10px] sm:text-sm uppercase tracking-widest opacity-60">Gestión de Inventario</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
          {isAdmin && (
            <button onClick={() => setShowScraperModal(true)} className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-all font-bold text-[10px] sm:text-sm shadow-lg shadow-indigo-500/20 whitespace-nowrap">
              <CloudUpload className="w-3.5 h-3.5 sm:w-4 h-4" /> <span>Scraper IA</span>
            </button>
          )}
          <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 px-3 py-2 bg-brand-surface border border-slate-700 text-white rounded-xl hover:bg-slate-800 transition-all font-bold text-[10px] sm:text-sm whitespace-nowrap">
            <FileUp className="w-3.5 h-3.5 sm:w-4 h-4 text-brand-primary" /> <span>Importar</span>
          </button>
          <button onClick={handleExportJSON} className="flex items-center justify-center gap-2 px-3 py-2 bg-brand-surface border border-slate-700 text-white rounded-xl hover:bg-slate-800 transition-all font-bold text-[10px] sm:text-sm whitespace-nowrap">
            <Download className="w-3.5 h-3.5 sm:w-4 h-4 text-emerald-400" /> <span>Exportar</span>
          </button>
          {isAdmin && (
            <>
              <button 
                onClick={handleSmartPull} 
                disabled={isSyncing} 
                className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl hover:bg-indigo-500/20 transition-all font-bold text-[10px] sm:text-sm disabled:opacity-50 whitespace-nowrap"
                title="Descarga solo lo que falta en tu base local"
              >
                <RefreshCw className={`w-3.5 h-3.5 sm:w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} /> <span>Sync Cloud</span>
              </button>
              <button onClick={handleSyncToCloud} disabled={isSyncing} className="hidden sm:flex items-center justify-center gap-2 px-3 py-2 bg-brand-primary text-white rounded-xl hover:opacity-90 font-bold text-[10px] sm:text-sm disabled:opacity-50 whitespace-nowrap">
                <CloudUpload className={`w-3.5 h-3.5 sm:w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} /> <span>Backup</span>
              </button>
            </>
          )}
        </div>
      </div>

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
              type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
              className="w-full pl-10 pr-4 py-2 bg-brand-bg border border-slate-700 rounded-xl text-sm text-white focus:border-brand-primary outline-none"
            />
          </div>
        </div>

        <div className="block md:hidden divide-y divide-slate-800">
          {isLoading ? (
            <div className="p-10 text-center text-slate-500 italic">Cargando datos...</div>
          ) : currentProducts.length === 0 ? (
            <div className="p-10 text-center text-slate-500">No hay registros.</div>
          ) : currentProducts.map(p => (
            <div key={p.sku} className="p-4 hover:bg-slate-800/20 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    {p.synced ? (
                      <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Monitor className="w-3.5 h-3.5 text-slate-600" />
                    )}
                    {p.synergy_analyzed && <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                  </div>
                  <span className="font-mono text-[10px] text-slate-500 tracking-tighter">{p.sku}</span>
                </div>
                <button onClick={() => handleDelete(p.sku)} className="p-2 text-slate-600 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-bold text-slate-100 leading-tight mb-2 pr-8">{p.nombre_comercial}</h3>
              <div className="flex flex-wrap gap-1">
                {(Array.isArray(p.principios_activos) ? p.principios_activos : []).slice(0, 3).map((pa, idx) => (
                  <span key={idx} className="text-[9px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded-md border border-slate-700 font-medium">
                    {pa}
                  </span>
                ))}
                {p.principios_activos && p.principios_activos.length > 3 && (
                  <span className="text-[9px] text-slate-600 font-bold">+{p.principios_activos.length - 3}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-700 font-bold">
              <tr>
                <th className="px-6 py-4">Cloud</th>
                <th className="px-6 py-4">Sinergia</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">Compuestos</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {isLoading ? (
                <tr><td colSpan={6} className="p-10 text-center text-slate-500">Cargando datos...</td></tr>
              ) : currentProducts.length === 0 ? (
                <tr><td colSpan={6} className="p-10 text-center text-slate-500">No hay registros.</td></tr>
              ) : currentProducts.map(p => (
                <tr key={p.sku} className="hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4">
                    {p.synced ? (
                      <div className="flex items-center gap-2 text-emerald-400" title="Respaldado en la nube">
                        <Cloud className="w-4 h-4" />
                        <CheckCircle className="w-3 h-3" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-600" title="Solo local (Pendiente de respaldo)">
                        <Monitor className="w-4 h-4" />
                        <CloudOff className="w-3 h-3 opacity-50" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {p.synergy_analyzed ? (
                      <div className="flex items-center gap-2 text-amber-500" title="Analizado por IA">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">OK</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-700" title="Pendiente de análisis">
                        <RefreshCw className="w-4 h-4 opacity-30" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter opacity-30">PND</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono text-[10px] text-slate-500">{p.sku}</td>
                  <td className="px-6 py-4 font-bold text-white leading-tight">{p.nombre_comercial}</td>
                  <td className="px-6 py-4 text-slate-400 text-xs truncate max-w-[200px]">
                    {Array.isArray(p.principios_activos) ? p.principios_activos.join(', ') : ''}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(p.sku)} className="p-1.5 text-slate-600 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length > ITEMS_PER_PAGE && (
          <div className="p-4 bg-slate-900/30 border-t border-slate-700 flex items-center justify-between">
            <span className="text-xs text-slate-500">Pág. {currentPage} de {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 bg-brand-surface rounded-lg disabled:opacity-50 border border-slate-700">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 bg-brand-surface rounded-lg disabled:opacity-50 border border-slate-700">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
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
