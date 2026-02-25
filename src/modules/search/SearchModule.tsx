import React, { useState } from 'react';
import { useProductSearch } from '../../hooks/useProductSearch';
import { ProductCard } from '../../components/product/ProductCard';
import { Search, Loader2, Database, Sparkles } from 'lucide-react';
import { Product } from '../../core/types/product.types';
import { ProductDetailModal } from '../product/ProductDetailModal';
import { useTray } from '../../context/TrayContext';

export const SearchModule: React.FC = () => {
  const { query, setQuery, results, isSearching } = useProductSearch();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const { toggleProduct, isInTray } = useTray();

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleAddToTray = (product: Product) => {
    toggleProduct(product);
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
                  isInTray={isInTray(product.sku)}
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

      {/* Modal de Detalle Individual */}
      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
        />
      )}
    </div>
  );
};
