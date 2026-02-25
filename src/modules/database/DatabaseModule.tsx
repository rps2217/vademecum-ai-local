import React, { useEffect, useState } from 'react';
import { getDB } from '../../core/database/db';
import { Product } from '../../core/types/product.types';
import { Database, Trash2, RefreshCw, ExternalLink, CloudUpload, CloudDownload } from 'lucide-react';
import { GoogleSyncService } from '../../services/GoogleSyncService';

export const DatabaseModule: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const db = await getDB();
      const allProducts = await db.getAll('products');
      setProducts(allProducts);
    } catch (error) {
      console.error('Error cargando base de datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (sku: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto de la base de datos local?')) return;
    try {
      const db = await getDB();
      await db.delete('products', sku);
      await loadData();
    } catch (error) {
      console.error('Error eliminando producto:', error);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('⚠️ ¿ESTÁS SEGURO? Esto eliminará TODOS los productos de la base de datos local. Tendrás que volver a ejecutar el scraper.')) return;
    try {
      const db = await getDB();
      await db.clear('products');
      await loadData();
    } catch (error) {
      console.error('Error limpiando base de datos:', error);
    }
  };

  const handleBackup = async () => {
    if (!GoogleSyncService.getGasUrl()) {
      alert('Primero debes configurar la URL de Google Apps Script en la pestaña de Configuración.');
      return;
    }
    setSyncStatus('Respaldando a Google Sheets...');
    const result = await GoogleSyncService.backupToCloud();
    setSyncStatus(result.message);
    setTimeout(() => setSyncStatus(null), 5000);
  };

  const handleRestore = async () => {
    if (!GoogleSyncService.getGasUrl()) {
      alert('Primero debes configurar la URL de Google Apps Script en la pestaña de Configuración.');
      return;
    }
    if (!confirm('¿Deseas descargar los datos desde Google Sheets? Esto actualizará tu base de datos local.')) return;
    
    setSyncStatus('Restaurando desde Google Sheets...');
    const result = await GoogleSyncService.restoreFromCloud();
    setSyncStatus(result.message);
    if (result.success) {
      await loadData();
    }
    setTimeout(() => setSyncStatus(null), 5000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto pb-20 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-6 h-6 text-indigo-600" />
            Base de Datos Local
          </h2>
          <p className="text-slate-500 mt-1">
            Gestiona los medicamentos extraídos y almacenados en tu dispositivo (IndexedDB).
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleRestore}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors text-sm font-medium"
            title="Descargar datos desde Google Sheets"
          >
            <CloudDownload className="w-4 h-4" />
            Restaurar
          </button>
          <button 
            onClick={handleBackup}
            disabled={products.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors text-sm font-medium disabled:opacity-50"
            title="Respaldar datos locales a Google Sheets"
          >
            <CloudUpload className="w-4 h-4" />
            Respaldar
          </button>
          <button 
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button 
            onClick={handleClearAll}
            disabled={products.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-colors text-sm font-medium disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Limpiar Todo
          </button>
        </div>
      </div>

      {syncStatus && (
        <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-800 text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          {syncStatus}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <span className="font-semibold text-slate-700">Total de registros: {products.length}</span>
        </div>
        
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">Cargando registros...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            La base de datos está vacía. Ejecuta el "Auto-Scraping Web" o "Restaurar" desde la nube.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-medium">SKU</th>
                  <th className="px-6 py-3 font-medium">Nombre Comercial</th>
                  <th className="px-6 py-3 font-medium">Principios Activos</th>
                  <th className="px-6 py-3 font-medium">Origen</th>
                  <th className="px-6 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr key={product.sku} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{product.sku}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{product.nombre_comercial}</td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex flex-wrap gap-1">
                        {product.principios_activos.slice(0, 2).map((pa, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 rounded text-xs">{pa}</span>
                        ))}
                        {product.principios_activos.length > 2 && (
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">+{product.principios_activos.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {product.source_url ? (
                        <a href={product.source_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1 text-xs">
                          Ver Web <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400 text-xs">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(product.sku)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
