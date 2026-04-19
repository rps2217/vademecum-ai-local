import React, { useEffect, useState, useRef, useMemo } from 'react';
import { DataService } from '../../services/DataService';
import { Product } from '../../core/types/product.types';
import { 
  Database, Trash2, RefreshCw, FileUp, 
  ChevronLeft, ChevronRight, Download,
  Search, Monitor, CloudUpload, Info, AlertCircle,
  Cloud, CloudOff, CheckCircle
} from 'lucide-react';
import { CloudSyncService } from '../../services/CloudSyncService';
import { useAuth } from '../../context/AuthContext';
import { EventBus, EventType } from '../../services/EventBus';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async (isManual = false) => {
    setIsLoading(true);
    try {
      const allProducts = await DataService.getAllProducts();
      setProducts(allProducts);
      CloudSyncService.getCloudCount().then(setCloudCount).catch(console.error);
    } catch (error) {
      console.error('Error cargando DB:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Suscribirse a actualizaciones para refrescar el estado de sincronización
    const sub = EventBus.on<any>(EventType.DB_UPDATED).subscribe(() => loadData());
    const subProduct = EventBus.on<any>(EventType.PRODUCT_UPDATED).subscribe(() => loadData());

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
        const importedData = JSON.parse(e.target?.result as string);
        if (Array.isArray(importedData)) {
          setIsLoading(true);
          for (const p of importedData) {
            await DataService.saveProduct(p);
          }
          await loadData();
          setSyncStatus(`Importados ${importedData.length} productos.`);
        }
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
    <div className="w-full max-w-6xl mx-auto pb-20 px-4 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-primary/10 rounded-2xl">
            <Database className="w-8 h-8 text-brand-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Base de Datos</h2>
            <p className="text-slate-400 font-medium text-sm">Administración simplificada del Vademécum.</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-brand-surface border border-slate-700 text-white rounded-xl hover:bg-slate-800 transition-all font-bold text-sm">
            <FileUp className="w-4 h-4 text-brand-primary" /> Importar
          </button>
          <button onClick={handleExportJSON} className="flex items-center gap-2 px-4 py-2 bg-brand-surface border border-slate-700 text-white rounded-xl hover:bg-slate-800 transition-all font-bold text-sm">
            <Download className="w-4 h-4 text-emerald-400" /> Exportar
          </button>
          {isAdmin && (
            <button onClick={handleSyncToCloud} disabled={isSyncing} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-xl hover:opacity-90 font-bold text-sm disabled:opacity-50">
              <CloudUpload className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} /> Respaldar Nube
            </button>
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

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-700 font-bold">
              <tr>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">Compuestos</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {isLoading ? (
                <tr><td colSpan={5} className="p-10 text-center text-slate-500">Cargando datos...</td></tr>
              ) : currentProducts.length === 0 ? (
                <tr><td colSpan={5} className="p-10 text-center text-slate-500">No hay registros.</td></tr>
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
                  <td className="px-6 py-4 font-mono text-[10px] text-slate-500">{p.sku}</td>
                  <td className="px-6 py-4 font-bold text-white leading-tight">{p.nombre_comercial}</td>
                  <td className="px-6 py-4 text-slate-400 text-xs truncate max-w-[200px]">
                    {p.principios_activos.join(', ')}
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
    </div>
  );
};
