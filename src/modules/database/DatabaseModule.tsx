import React, { useEffect, useState, useRef, useMemo } from 'react';
import { getDB } from '../../core/database/db';
import { Product } from '../../core/types/product.types';
import { 
  Database, Trash2, RefreshCw, ExternalLink, FileUp, 
  ChevronLeft, ChevronRight, ShieldCheck, Sparkles, 
  CloudUpload, Download, Check, AlertCircle, Info,
  Search, Filter, X, CheckCircle2
} from 'lucide-react';
import { GeminiService } from '../../services/GeminiService';
import { FirebaseSyncService } from '../../services/FirebaseSyncService';
import { PDFImportService } from '../../services/PDFImportService';
import { useAuth } from '../../context/AuthContext';

import { COMMON_PATHOLOGIES } from '../../constants/pathologies';

const ITEMS_PER_PAGE = 50;

export const DatabaseModule: React.FC = () => {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [stagingProducts, setStagingProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCleaning, setIsCleaning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isImportingPDF, setIsImportingPDF] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [conflictMode, setConflictMode] = useState<'skip' | 'overwrite' | 'merge'>('skip');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const db = await getDB();
      const allProducts = await db.getAll('products');
      const metadata = await db.get('sync_metadata', 'cloud_sync');
      setLastSyncTime(metadata?.lastSyncTime || 0);
      setProducts(allProducts);
      window.dispatchEvent(new Event('db_updated'));
    } catch (error) {
      console.error('Error cargando base de datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Escuchar actualizaciones externas (ej: desde el motor de IA)
    window.addEventListener('db_updated', loadData);
    return () => window.removeEventListener('db_updated', loadData);
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

        // Cargar en Staging Area
        setStagingProducts(importedData.map(p => ({
          ...p,
          sku: p.sku || `IMPORT-${Math.random().toString(36).substr(2, 9)}`,
          last_updated: Date.now()
        })));
        
        setSyncStatus(`Se han cargado ${importedData.length} productos en el área de prevalidación.`);
      } catch (error) {
        console.error('Error parseando JSON:', error);
        alert('Error al leer el archivo JSON. Asegúrate de que el formato sea correcto.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleCleanWithAI = async () => {
    if (stagingProducts.length === 0) return;
    setIsCleaning(true);
    setSyncStatus('IA analizando y limpiando datos (Normalización, Ortografía, Etiquetas)...');
    
    try {
      // Procesar en lotes de 5 para mayor fiabilidad y evitar límites de tokens
      const batchSize = 5;
      const cleaned: Product[] = [];
      
      for (let i = 0; i < stagingProducts.length; i += batchSize) {
        const chunk = stagingProducts.slice(i, i + batchSize);
        const cleanedChunk = await GeminiService.cleanAndValidateProducts(chunk);
        cleaned.push(...cleanedChunk);
        setSyncStatus(`IA Limpiando: ${Math.min(i + batchSize, stagingProducts.length)} de ${stagingProducts.length}...`);
      }
      
      setStagingProducts(cleaned);
      setSyncStatus('¡Limpieza IA completada con éxito!');
    } catch (error) {
      console.error('Error en limpieza IA:', error);
      alert('Error durante la limpieza con IA.');
    } finally {
      setIsCleaning(false);
      setTimeout(() => setSyncStatus(null), 3000);
    }
  };

  const handleCommitToLocal = async () => {
    if (stagingProducts.length === 0) return;
    setIsLoading(true);
    
    try {
      const db = await getDB();
      const tx = db.transaction('products', 'readwrite');
      const store = tx.objectStore('products');
      
      let added = 0;
      let updated = 0;
      let skipped = 0;

      for (const product of stagingProducts) {
        const existing = await store.get(product.sku);
        
        if (!existing) {
          await store.put(product);
          added++;
        } else {
          if (conflictMode === 'overwrite') {
            await store.put(product);
            updated++;
          } else if (conflictMode === 'merge') {
            await store.put({ ...existing, ...product });
            updated++;
          } else {
            skipped++;
          }
        }
      }
      
      await tx.done;
      setStagingProducts([]);
      setSyncStatus(`Base de datos actualizada: ${added} nuevos, ${updated} actualizados, ${skipped} omitidos.`);
      await loadData();
    } catch (error) {
      console.error('Error guardando en DB:', error);
    } finally {
      setIsLoading(false);
      setTimeout(() => setSyncStatus(null), 5000);
    }
  };

  const handleSyncToCloud = async () => {
    if (!isAdmin) return;
    setIsSyncing(true);
    setSyncStatus('Sincronizando cambios con la nube (Modo Delta)...');
    
    try {
      const count = await FirebaseSyncService.uploadLocalProducts();
      setSyncStatus(`Sincronización completada: ${count} productos actualizados en la nube.`);
    } catch (error) {
      console.error('Error sincronizando:', error);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(null), 5000);
    }
  };

  const handleImportPDFData = async () => {
    if (!confirm('¿Deseas importar los productos clave extraídos del Vademécum PDF?')) return;
    setIsImportingPDF(true);
    setSyncStatus('Importando datos del Vademécum Knop...');
    
    try {
      const count = await PDFImportService.importVademecumData();
      setSyncStatus(`¡Éxito! Se han importado ${count} productos del Vademécum.`);
      await loadData();
    } catch (error) {
      console.error('Error importando PDF:', error);
      setSyncStatus('Error al importar datos del PDF.');
    } finally {
      setIsImportingPDF(false);
      setTimeout(() => setSyncStatus(null), 5000);
    }
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(products, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `vademecum_backup_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleDelete = async (sku: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
      const db = await getDB();
      await db.delete('products', sku);
      await loadData();
    } catch (error) {
      console.error('Error eliminando producto:', error);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('⚠️ ¿ESTÁS SEGURO? Esto eliminará TODOS los productos locales.')) return;
    try {
      const db = await getDB();
      await db.clear('products');
      setCurrentPage(1);
      await loadData();
    } catch (error) {
      console.error('Error limpiando base de datos:', error);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const term = searchTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedTerm}\\b`, 'i');

    const isPathologySearch = COMMON_PATHOLOGIES.some(p => p.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === term);

    return products.filter(p => {
      if (isPathologySearch) {
        const ind = p.indicaciones.map(i => {
          const text = typeof i === 'object' ? ((i as any).nombre || (i as any).tipo || (i as any).indicacion || JSON.stringify(i)) : String(i);
          return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        }).join(" ");
        return regex.test(ind);
      }

      const nombre = p.nombre_comercial.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const sku = p.sku.toLowerCase();
      
      return regex.test(nombre) || 
             sku.includes(term) || // SKU suele ser exacto o parcial útil
             p.principios_activos.some(pa => {
               const normalizedPa = pa.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
               return regex.test(normalizedPa);
             });
    });
  }, [products, searchTerm]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const currentProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  return (
    <div className="w-full max-w-6xl mx-auto pb-20 px-4 animate-in fade-in duration-500">
      {/* Header Profesional */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-primary/10 rounded-2xl">
              <Database className="w-8 h-8 text-brand-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                Database Control Center
              </h2>
              <p className="text-slate-400 font-medium">
                Gestión avanzada de activos clínicos y sincronización híbrida.
              </p>
            </div>
          </div>
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
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-surface border border-slate-800 text-white rounded-2xl hover:bg-slate-800 transition-all font-bold shadow-lg group"
          >
            <FileUp className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
            Importar JSON
          </button>
          
          <button 
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-surface border border-slate-800 text-white rounded-2xl hover:bg-slate-800 transition-all font-bold shadow-lg group"
          >
            <Download className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            Exportar Backup
          </button>

          <button 
            onClick={handleImportPDFData}
            disabled={isImportingPDF}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-surface border border-slate-800 text-white rounded-2xl hover:bg-slate-800 transition-all font-bold shadow-lg group"
          >
            <Sparkles className={`w-5 h-5 text-brand-primary ${isImportingPDF ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
            Importar Vademécum PDF
          </button>

          {isAdmin && (
            <button 
              onClick={handleSyncToCloud}
              disabled={isSyncing || products.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white rounded-2xl hover:bg-brand-primary/80 transition-all font-bold shadow-lg disabled:opacity-50 group"
            >
              <CloudUpload className={`w-5 h-5 ${isSyncing ? 'animate-bounce' : 'group-hover:translate-y-[-2px] transition-transform'}`} />
              {isSyncing ? 'Sincronizando...' : 'Backup en la Nube'}
            </button>
          )}
        </div>
      </div>

      {/* Status Bar */}
      {syncStatus && (
        <div className="mb-8 p-4 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl text-brand-primary text-sm font-bold flex items-center gap-3 animate-in slide-in-from-top-4">
          <RefreshCw className="w-5 h-5 animate-spin" />
          {syncStatus}
        </div>
      )}

      {/* Staging Area (Cortafuegos de Calidad) */}
      {stagingProducts.length > 0 && (
        <div className="mb-12 bg-brand-surface border-2 border-brand-primary/30 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="p-6 bg-brand-primary/5 border-b border-brand-primary/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-primary/20 rounded-xl">
                <ShieldCheck className="w-6 h-6 text-brand-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Staging Area: Cortafuegos de Calidad</h3>
                <p className="text-sm text-slate-400">Pre-validación de {stagingProducts.length} registros antes de la integración.</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={handleCleanWithAI}
                disabled={isCleaning}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-all font-bold text-sm shadow-md disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 ${isCleaning ? 'animate-pulse' : ''}`} />
                {isCleaning ? 'IA Limpiando...' : 'Limpiar con IA'}
              </button>
              
              <div className="flex items-center bg-brand-bg rounded-xl border border-slate-800 p-1">
                {(['skip', 'overwrite', 'merge'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setConflictMode(mode)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                      conflictMode === mode ? 'bg-brand-primary text-white' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {mode === 'skip' ? 'Omitir' : mode === 'overwrite' ? 'Sobrescribir' : 'Fusionar'}
                  </button>
                ))}
              </div>

              <button 
                onClick={handleCommitToLocal}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all font-bold text-sm shadow-md"
              >
                <Check className="w-4 h-4" />
                Confirmar Integración
              </button>
              
              <button 
                onClick={() => setStagingProducts([])}
                className="p-2 bg-slate-800 text-slate-400 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-brand-surface border-b border-slate-800 text-slate-500 z-10">
                <tr>
                  <th className="px-6 py-3 font-bold uppercase tracking-wider text-[10px]">SKU</th>
                  <th className="px-6 py-3 font-bold uppercase tracking-wider text-[10px]">Producto</th>
                  <th className="px-6 py-3 font-bold uppercase tracking-wider text-[10px]">Categoría</th>
                  <th className="px-6 py-3 font-bold uppercase tracking-wider text-[10px]">Estado IA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {stagingProducts.slice(0, 10).map((p, i) => (
                  <tr key={p.sku || i} className="hover:bg-brand-primary/5 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{p.sku}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-200">{p.nombre_comercial}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[200px]">{p.principios_activos.join(', ')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-800 rounded-lg text-[10px] font-bold text-slate-400 uppercase">
                        {p.categoria_principal || 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {p.tags_ia.length > 0 ? (
                        <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold">
                          <Check className="w-3 h-3" /> Validado
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-amber-400 text-[10px] font-bold">
                          <AlertCircle className="w-3 h-3" /> Crudo
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {stagingProducts.length > 10 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-slate-500 italic text-xs">
                      Y {stagingProducts.length - 10} productos más...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Database Table */}
      <div className="bg-brand-surface border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-950/30 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
            <span className="text-lg font-bold text-white">Registros Locales</span>
            <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-xs font-bold border border-brand-primary/20">
              {products.length} Total
            </span>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text"
                placeholder="Buscar en DB..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-brand-bg border border-slate-800 rounded-xl text-sm text-white focus:border-brand-primary transition-all outline-none"
              />
            </div>
            <button 
              onClick={handleClearAll}
              disabled={products.length === 0}
              className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all border border-slate-800"
              title="Borrar base de datos local"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="p-20 text-center space-y-4">
            <RefreshCw className="w-10 h-10 text-brand-primary animate-spin mx-auto" />
            <p className="text-slate-400 font-medium">Accediendo a IndexedDB...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-20 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-600">
              <Database className="w-8 h-8" />
            </div>
            <p className="text-slate-500 font-medium">No se encontraron registros en la base de datos local.</p>
          </div>
        ) : (
          <>
            {/* Vista de Tabla (Desktop) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950/50 border-b border-slate-800 text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">SKU / Origen</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Producto Farmacéutico</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Perfil IA</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Nube</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {currentProducts.map((product) => {
                    const isSynced = product.last_updated && product.last_updated <= lastSyncTime;
                    return (
                    <tr key={product.sku} className="hover:bg-brand-primary/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-mono text-[10px] text-slate-500 mb-1">{product.sku}</div>
                        {product.source_url ? (
                          <a href={product.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors">
                            <ExternalLink className="w-3 h-3" /> Fuente Web
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-600 italic">Importado</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-white text-base mb-1">{product.nombre_comercial}</div>
                        <div className="flex flex-wrap gap-1">
                          {product.principios_activos.slice(0, 3).map((pa, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded-md text-[10px] font-medium">
                              {pa}
                            </span>
                          ))}
                          {product.principios_activos.length > 3 && (
                            <span className="text-[10px] text-slate-600 font-bold">+{product.principios_activos.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${product.synergy_analyzed ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {product.synergy_analyzed ? 'Sinergia OK' : 'Pendiente IA'}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {product.tags_ia.slice(0, 2).map(tag => (
                              <span key={tag} className="text-[9px] text-brand-primary font-bold uppercase">{tag}</span>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isSynced ? (
                          <div className="flex items-center gap-1 text-emerald-400" title="Sincronizado con la nube">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-[9px] font-bold uppercase">OK</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-amber-400" title="Solo local / Pendiente de backup">
                            <RefreshCw className="w-4 h-4" />
                            <span className="text-[9px] font-bold uppercase">Local</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleDelete(product.sku)}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                            title="Eliminar de local"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>

            {/* Vista de Tarjetas (Mobile) */}
            <div className="md:hidden divide-y divide-slate-800">
              {currentProducts.map((product) => {
                const isSynced = product.last_updated && product.last_updated <= lastSyncTime;
                return (
                  <div key={product.sku} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-white text-lg">{product.nombre_comercial}</div>
                        <div className="font-mono text-[10px] text-slate-500">{product.sku}</div>
                      </div>
                      <button 
                        onClick={() => handleDelete(product.sku)}
                        className="p-2 text-slate-500 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {product.principios_activos.map((pa, i) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded-md text-[10px]">
                          {pa}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${product.synergy_analyzed ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                          <span className="text-[10px] font-bold text-slate-400 uppercase">IA</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isSynced ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <RefreshCw className="w-3 h-3 text-amber-400" />
                          )}
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Nube</span>
                        </div>
                      </div>
                      {product.source_url && (
                        <a href={product.source_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-400 font-bold uppercase">
                          Ver Fuente
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
        
        {!isLoading && filteredProducts.length > 0 && (
          <div className="p-6 border-t border-slate-800 bg-slate-950/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-sm text-slate-500 font-medium">
              Mostrando <span className="text-white">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> - <span className="text-white">{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}</span> de <span className="text-white">{filteredProducts.length}</span> registros
            </span>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Página {currentPage}</span>
                <span className="text-sm text-slate-600">de {totalPages}</span>
              </div>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="mt-8 p-6 bg-brand-surface border border-slate-800 rounded-3xl flex items-start gap-4">
        <div className="p-2 bg-indigo-500/10 rounded-xl">
          <Info className="w-5 h-5 text-indigo-400" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-white">Sobre la Sincronización Híbrida</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Este módulo utiliza un motor de sincronización Delta. Al realizar un "Backup en la Nube", solo se enviarán los registros que hayan sido modificados localmente desde la última sincronización. La importación de JSON utiliza el Staging Area para asegurar que los datos sean validados por la IA antes de afectar tu base de datos maestra.
          </p>
        </div>
      </div>
    </div>
  );
};
