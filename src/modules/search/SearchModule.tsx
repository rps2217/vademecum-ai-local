import React, { useState } from 'react';
import { useProductSearch } from '../../hooks/useProductSearch';
import { ProductCard } from '../../components/product/ProductCard';
import { Input } from '../../components/ui/input';
import { Search, Loader2, Database, Sparkles, X } from 'lucide-react';
import { Product } from '../../core/types/product.types';
import { ProductDetailModal } from '../product/ProductDetailModal';
import { PrescriptionAnalysisModal } from '../product/PrescriptionAnalysisModal';

export const SearchModule: React.FC = () => {
  const { query, setQuery, results, isSearching } = useProductSearch();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Estado para la "Bandeja" de medicamentos
  const [tray, setTray] = useState<Product[]>([]);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleAddToTray = (product: Product) => {
    setTray(prev => {
      if (prev.find(p => p.sku === product.sku)) {
        return prev.filter(p => p.sku !== product.sku); // Toggle off
      }
      return [...prev, product]; // Toggle on
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto pb-20">
      {/* Barra de Búsqueda Principal */}
      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {isSearching ? (
            <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-slate-400" />
          )}
        </div>
        <input
          type="text"
          className="block w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
          placeholder="Buscar por nombre, principio activo, indicación o síntoma..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        
        {/* Indicador de IA (Visual) */}
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium border border-indigo-100">
            <Sparkles className="w-3 h-3" />
            Búsqueda Semántica
          </div>
        </div>
      </div>

      {/* Resultados */}
      <div className="mt-6">
        {query.trim() === '' ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
            <Database className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">Vademécum Local Listo</h3>
            <p className="text-slate-500 mt-2 max-w-md mx-auto">
              Comienza a escribir para buscar medicamentos. La búsqueda se realiza 100% en tu dispositivo, sin necesidad de conexión a internet.
            </p>
          </div>
        ) : results.length > 0 ? (
          <div>
            <p className="text-sm text-slate-500 mb-4 font-medium px-2">
              Se encontraron {results.length} resultados para "{query}"
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((product) => (
                <ProductCard 
                  key={product.sku} 
                  product={product} 
                  onViewDetail={handleProductClick}
                  onAddToTray={handleAddToTray}
                  isInTray={tray.some(p => p.sku === product.sku)}
                />
              ))}
            </div>
          </div>
        ) : (
          !isSearching && (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900">No se encontraron resultados</h3>
              <p className="text-slate-500 mt-2">
                Intenta con otros términos o verifica la ortografía.
              </p>
            </div>
          )
        )}
      </div>

      {/* Bandeja Flotante de Análisis */}
      {tray.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-2xl border border-slate-200 p-2 flex items-center gap-4 z-40 animate-in slide-in-from-bottom-10">
          <div className="flex items-center gap-2 px-4">
            <div className="flex -space-x-2">
              {tray.map(p => (
                <div key={p.sku} className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-xs font-bold text-indigo-700" title={p.nombre_comercial}>
                  {p.nombre_comercial.substring(0, 2).toUpperCase()}
                </div>
              ))}
            </div>
            <span className="text-sm font-medium text-slate-700 ml-2">
              {tray.length} medicamento{tray.length > 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={() => setIsAnalysisModalOpen(true)}
            disabled={tray.length < 2}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {tray.length < 2 ? 'Selecciona otro para comparar' : 'Analizar Interacciones'}
          </button>
          <button
            onClick={() => setTray([])}
            className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors mr-1"
            title="Limpiar selección"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modal de Detalle Individual */}
      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
        />
      )}

      {/* Modal de Análisis Cruzado (Múltiples) */}
      {isAnalysisModalOpen && (
        <PrescriptionAnalysisModal
          products={tray}
          onClose={() => setIsAnalysisModalOpen(false)}
        />
      )}
    </div>
  );
};
