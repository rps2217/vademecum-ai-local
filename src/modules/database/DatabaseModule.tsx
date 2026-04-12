import React, { useEffect, useState, useRef, useMemo } from 'react';
import { getDB } from '../../core/database/db';
import { Product } from '../../core/types/product.types';
import { Database, Trash2, RefreshCw, ExternalLink, FileUp, ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 50;

export const DatabaseModule: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
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
        let skippedCount = 0;
        
        for (const product of importedData) {
          // Validación básica para asegurar que es un producto válido
          if (product.sku && product.nombre_comercial) {
            const existingProduct = await store.get(product.sku);
            if (!existingProduct) {
              await store.put(product);
              importedCount++;
            } else {
              skippedCount++;
            }
          }
        }
        
        await tx.done;
        
        setSyncStatus(`¡Importación finalizada! ${importedCount} nuevos agregados, ${skippedCount} omitidos (ya existían).`);
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
      setCurrentPage(1);
      await loadData();
    } catch (error) {
      console.error('Error limpiando base de datos:', error);
    }
  };

  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const currentProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return products.slice(start, start + ITEMS_PER_PAGE);
  }, [products, currentPage]);

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
                {currentProducts.map((product, index) => {
                  if (!product) return null;
                  const safePrincipios = Array.isArray(product.principios_activos) ? product.principios_activos : [];
                  
                  return (
                  <tr key={product.sku || `fallback-${index}`} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{product.sku || 'N/A'}</td>
                    <td className="px-6 py-4 font-medium text-white">{product.nombre_comercial || 'Sin nombre'}</td>
                    <td className="px-6 py-4 text-slate-300">
                      <div className="flex flex-wrap gap-1">
                        {safePrincipios.slice(0, 2).map((pa, i) => {
                          if (!pa) return null;
                          const text = typeof pa === 'object' ? ((pa as any).tipo || (pa as any).nombre || JSON.stringify(pa)) : String(pa);
                          return (
                            <span key={i} className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-300">
                              {text}
                            </span>
                          );
                        })}
                        {safePrincipios.length > 2 && (
                          <span className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-300">+{safePrincipios.length - 2}</span>
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
                        onClick={() => product.sku && handleDelete(product.sku)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
        
        {!isLoading && products.length > 0 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
            <span className="text-sm text-slate-400">
              Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, products.length)} de {products.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-slate-300 px-2">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
