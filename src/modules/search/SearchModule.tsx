import React, { useState } from 'react';
import { useProductSearch } from '../../hooks/useProductSearch';
import { ProductCard } from '../../components/product/ProductCard';
import { Search, Loader2, Database, Sparkles, Tag } from 'lucide-react';
import { Product } from '../../core/types/product.types';
import { ProductDetailModal } from '../product/ProductDetailModal';
import { useTray } from '../../context/TrayContext';

export const SearchModule: React.FC = () => {
  const { query, setQuery, results, isSearching, availableTags } = useProductSearch();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const { toggleProduct, isInTray } = useTray();

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleAddToTray = (product: Product) => {
    toggleProduct(product);
  };

  const handleTagClick = (tag: string) => {
    setQuery(tag);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="w-full max-w-5xl mx-auto pb-20">
      {/* Barra de Búsqueda Principal */}
      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {isSearching ? (
            <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-slate-500" />
          )}
        </div>
        <input
          type="text"
          className="block w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-lg text-white shadow-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-600"
          placeholder="Buscar por nombre, principio activo, indicación o síntoma..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        
        {/* Indicador de IA (Visual) */}
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-medium border border-indigo-500/20">
            <Sparkles className="w-3 h-3" />
            Búsqueda Semántica
          </div>
        </div>
      </div>

      {/* Tags Populares (Solo se muestran si no hay búsqueda activa) */}
      {query.trim() === '' && availableTags && availableTags.length > 0 && (
        <div className="mb-8 animate-in fade-in duration-500">
          <div className="flex items-center gap-2 mb-4 text-slate-400">
            <Tag className="w-4 h-4" />
            <h3 className="text-sm font-medium uppercase tracking-wider">Explorar por Categorías o Síntomas</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableTags.map(({ tag, count }) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className="px-3 py-1.5 bg-slate-800/50 hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-300 border border-slate-700/50 hover:border-indigo-500/30 rounded-lg text-sm transition-all flex items-center gap-2 group"
              >
                <span className="capitalize">{tag}</span>
                <span className="text-[10px] bg-slate-900 group-hover:bg-indigo-500/20 px-1.5 py-0.5 rounded text-slate-500 group-hover:text-indigo-400">
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Resultados */}
      <div className="mt-6">
        {query.trim() === '' ? (
          <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed">
            <Database className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-200">Vademécum Local Listo</h3>
            <p className="text-slate-500 mt-2 max-w-md mx-auto">
              Comienza a escribir para buscar medicamentos o selecciona una categoría arriba.
            </p>
          </div>
        ) : results.length > 0 ? (
          <div>
            <p className="text-sm text-slate-400 mb-4 font-medium px-2 flex items-center justify-between">
              <span>Se encontraron {results.length} resultados para "{query}"</span>
              <button 
                onClick={() => setQuery('')}
                className="text-indigo-400 hover:text-indigo-300 hover:underline"
              >
                Limpiar búsqueda
              </button>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((product) => (
                <ProductCard 
                  key={product.sku} 
                  product={product} 
                  onViewDetail={handleProductClick}
                  onAddToTray={handleAddToTray}
                  isInTray={isInTray(product.sku)}
                  onTagClick={handleTagClick}
                />
              ))}
            </div>
          </div>
        ) : (
          !isSearching && (
            <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800">
              <Search className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-200">No se encontraron resultados</h3>
              <p className="text-slate-500 mt-2">
                Intenta con otros términos o verifica la ortografía.
              </p>
              <button 
                onClick={() => setQuery('')}
                className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors text-sm"
              >
                Limpiar búsqueda
              </button>
            </div>
          )
        )}
      </div>

      {/* Modal de Detalle Individual */}
      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onTagClick={(tag) => {
            setSelectedProduct(null);
            handleTagClick(tag);
          }}
        />
      )}
    </div>
  );
};
