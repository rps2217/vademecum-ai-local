import React, { useEffect, useState, useRef } from 'react';
import { getDB } from '../../core/database/db';
import { Product } from '../../core/types/product.types';
import { Database, Trash2, RefreshCw, ExternalLink, CloudUpload, CloudDownload, FileUp } from 'lucide-react';
import { GoogleSyncService } from '../../services/GoogleSyncService';

export const DatabaseModule: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const db = await getDB();
      const allProducts = await db.getAll('products');
      setProducts(allProducts);
      // Notificar a toda la app que la base de datos cambió (para actualizar tags, índices, etc.)
      window.dispatchEvent(new Event('db_updated'));
    } catch (error) {
      console.error('Error cargando base de datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);
        
        if (!Array.isArray(importedData)) {
          alert('El archivo JSON debe contener un arreglo de productos.');
          return;
        }

        setSyncStatus(`Importando ${importedData.length} productos a la base local...`);
        
        const db = await getDB();
        const tx = db.transaction('products', 'readwrite');
        const store = tx.objectStore('products');
        
        let importedCount = 0;
        for (const product of importedData) {
          // Validación básica para asegurar que es un producto válido
          if (product.sku && product.nombre_comercial) {
            await store.put(product);
            importedCount++;
          }
        }
        
        await tx.done;
        
        setSyncStatus(`¡Se importaron ${importedCount} productos exitosamente! Ahora puedes "Respaldar".`);
        await loadData();
        
        setTimeout(() => setSyncStatus(null), 5000);
      } catch (error) {
        console.error('Error parseando JSON:', error);
        alert('Error al leer el archivo JSON. Asegúrate de que el formato sea correcto.');
      }
      
      // Reset input para permitir subir el mismo archivo de nuevo si es necesario
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

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
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-indigo-400" />
            Base de Datos Local
          </h2>
          <p className="text-slate-400 mt-1">
            Gestiona los medicamentos extraídos y almacenados en tu dispositivo (IndexedDB).
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <input 
            type="file" 
            accept=".json" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 transition-colors text-sm font-medium"
            title="Importar archivo JSON desde tu PC"
          >
            <FileUp className="w-4 h-4" />
            Importar JSON
          </button>
          <button 
            onClick={handleRestore}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-colors text-sm font-medium"
            title="Descargar datos desde Google Sheets"
          >
            <CloudDownload className="w-4 h-4" />
            Restaurar
          </button>
          <button 
            onClick={handleBackup}
            disabled={products.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 transition-colors text-sm font-medium disabled:opacity-50"
            title="Respaldar datos locales a Google Sheets"
          >
            <CloudUpload className="w-4 h-4" />
            Respaldar
          </button>
          <button 
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl hover:bg-slate-800 transition-colors text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button 
            onClick={handleClearAll}
            disabled={products.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors text-sm font-medium disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Limpiar Todo
          </button>
        </div>
      </div>

      {syncStatus && (
        <div className="mb-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-300 text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          {syncStatus}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
          <span className="font-semibold text-slate-300">Total de registros: {products.length}</span>
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
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="px-6 py-3 font-medium">SKU</th>
                  <th className="px-6 py-3 font-medium">Nombre Comercial</th>
                  <th className="px-6 py-3 font-medium">Principios Activos</th>
                  <th className="px-6 py-3 font-medium">Origen</th>
                  <th className="px-6 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {products.map((product) => (
                  <tr key={product.sku} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{product.sku}</td>
                    <td className="px-6 py-4 font-medium text-white">{product.nombre_comercial}</td>
                    <td className="px-6 py-4 text-slate-300">
                      <div className="flex flex-wrap gap-1">
                        {product.principios_activos.slice(0, 2).map((pa, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-300">{pa}</span>
                        ))}
                        {product.principios_activos.length > 2 && (
                          <span className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-300">+{product.principios_activos.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {product.source_url ? (
                        <a href={product.source_url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline flex items-center gap-1 text-xs">
                          Ver Web <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-600 text-xs">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(product.sku)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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
