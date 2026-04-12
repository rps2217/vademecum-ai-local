import React, { useState } from 'react';
import { useProductSearch, SafetyCondition } from '../../hooks/useProductSearch';
import { ProductCard } from '../../components/product/ProductCard';
import { Search, Loader2, Database, Sparkles, Tag, CheckCircle2, AlertTriangle, Info, X, Pill, Activity, MoreHorizontal, Heart, Droplets, Baby, ShieldCheck, Wheat } from 'lucide-react';
import { Product, SafetyStatus } from '../../core/types/product.types';
import { ProductDetailModal } from '../product/ProductDetailModal';
import { useTray } from '../../context/TrayContext';

export const SearchModule: React.FC = () => {
  const { query, setQuery, conditionFilters, setConditionFilters, results, isSearching, categorizedTags } = useProductSearch();
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

  const toggleConditionFilter = (condition: SafetyCondition) => {
    setConditionFilters(prev => 
      prev.includes(condition) 
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    );
  };

  const safetyItems: { id: SafetyCondition, label: string, icon: React.ReactNode }[] = [
    { id: 'apto_embarazo', label: 'Embarazo', icon: <Heart className="w-4 h-4" /> },
    { id: 'apto_lactancia', label: 'Lactancia', icon: <Droplets className="w-4 h-4" /> },
    { id: 'apto_pediatria', label: 'Pediatría', icon: <Baby className="w-4 h-4" /> },
    { id: 'apto_diabeticos', label: 'Diabéticos', icon: <Activity className="w-4 h-4" /> },
    { id: 'apto_hipertensos', label: 'Hipertensos', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'apto_celiacos', label: 'Celíacos', icon: <Wheat className="w-4 h-4" /> },
  ];

  const renderTagRow = (
    title: string,
    icon: React.ReactNode,
    tags: {tag: string, count: number}[],
    colorClass: string,
    activeColorClass: string
  ) => {
    if (!tags || tags.length === 0) return null;
    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2 text-slate-400 px-1">
          {icon}
          <h4 className="text-[10px] font-bold uppercase tracking-wider">{title}</h4>
        </div>
        <div className="flex flex-wrap gap-2 pb-2">
          {tags.map(({ tag, count }) => {
            const isActive = query.toLowerCase() === tag.toLowerCase();
            return (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`px-3 py-1.5 rounded-xl text-sm transition-all flex items-center gap-2 border ${
                  isActive ? activeColorClass : colorClass
                }`}
              >
                <span className="capitalize font-medium">{tag}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${isActive ? 'bg-black/20' : 'bg-black/20 opacity-70'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto pb-20 px-4 sm:px-6 lg:px-8 relative">
      {/* Contenedor Sticky para Búsqueda y Filtros */}
      <div className="sticky top-0 z-30 bg-brand-bg/95 backdrop-blur-xl pt-2 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        {/* Barra de Búsqueda Principal */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {isSearching ? (
              <Loader2 className="h-5 w-5 text-brand-primary animate-spin" />
            ) : (
              <Search className="h-5 w-5 text-slate-500" />
            )}
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-32 py-4 bg-brand-surface border border-slate-800 rounded-2xl text-lg text-white shadow-sm focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all placeholder:text-slate-600"
            placeholder="Buscar por SKU, nombre, principio activo, indicación o síntoma..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-2">
            {query && (
              <button
                onClick={() => setQuery('')}
                className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1.5 border border-slate-700 shadow-sm"
                title="Limpiar búsqueda"
              >
                Limpiar <X className="w-3.5 h-3.5" />
              </button>
            )}
            {/* Indicador de IA (Visual) */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/10 text-brand-primary rounded-xl text-xs font-medium border border-brand-primary/20">
              <Sparkles className="w-3 h-3" />
              Semántica
            </div>
          </div>
        </div>

        {/* Filtros de Seguridad (Compacto) */}
        <div className="flex flex-wrap items-center gap-2 py-2 px-3 bg-brand-surface/50 rounded-2xl border border-slate-800/50 shadow-sm">
          <ShieldCheck className="w-4 h-4 text-slate-500 ml-1 hidden sm:block" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1 hidden sm:block">Solo Aptos Para:</span>
          
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {safetyItems.map((item) => {
              const isActive = conditionFilters.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => toggleConditionFilter(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                    isActive 
                      ? 'bg-brand-accent/20 text-brand-accent border-brand-accent/50 shadow-[0_0_10px_rgba(110,231,183,0.1)]' 
                      : 'bg-brand-bg/50 text-slate-400 border-slate-800 hover:border-brand-accent/30 hover:text-brand-accent/70'
                  }`}
                >
                  {isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : item.icon}
                  {item.label}
                </button>
              );
            })}
          </div>
          
          {conditionFilters.length > 0 && (
            <button
              onClick={() => setConditionFilters([])}
              className="text-[10px] text-slate-500 hover:text-slate-300 underline underline-offset-4 transition-colors px-2 whitespace-nowrap"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Tags Populares (Solo se muestran si no hay búsqueda activa) */}
      {query.trim() === '' && conditionFilters.length === 0 && (
        <div className="mb-6 mt-2 animate-in fade-in duration-500">
          {renderTagRow(
            'Clases y Tipos',
            <Pill className="w-4 h-4" />,
            categorizedTags.tipos,
            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40',
            'bg-emerald-500 text-brand-bg border-emerald-500 shadow-lg shadow-emerald-500/20'
          )}
          {renderTagRow(
            'Síntomas y Condiciones',
            <Activity className="w-4 h-4" />,
            categorizedTags.sintomas,
            'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/40',
            'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20'
          )}
          {renderTagRow(
            'Otras Categorías',
            <MoreHorizontal className="w-4 h-4" />,
            categorizedTags.otros,
            'bg-slate-800/50 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white',
            'bg-brand-primary text-brand-bg border-brand-primary shadow-lg shadow-brand-primary/20'
          )}
        </div>
      )}

      {/* Resultados */}
      <div className="mt-6">
        {query.trim() === '' && conditionFilters.length === 0 ? (
          <div className="text-center py-20 bg-brand-surface/30 rounded-3xl border border-slate-800 border-dashed">
            <Database className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-200">Vademécum Local Listo</h3>
            <p className="text-slate-500 mt-2 max-w-md mx-auto">
              Comienza a escribir para buscar medicamentos o selecciona una categoría arriba.
            </p>
          </div>
        ) : results.length > 0 ? (
          <div>
            <p className="text-sm text-slate-400 mb-4 font-medium px-2 flex items-center justify-between">
              <span>
                {results.length === 50 ? 'Más de 50' : results.length} resultados 
                {query.trim() && ` para "${query}"`}
                {conditionFilters.length > 0 && ` con filtros de seguridad`}
              </span>
              <button 
                onClick={() => { setQuery(''); setConditionFilters([]); }}
                className="text-brand-primary hover:text-brand-primary/80 hover:underline"
              >
                Limpiar todo
              </button>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
            <div className="text-center py-20 bg-brand-surface/30 rounded-3xl border border-slate-800">
              <Search className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-200">No se encontraron resultados</h3>
              <p className="text-slate-500 mt-2">
                Intenta con otros términos o cambia el filtro de seguridad.
              </p>
              <button 
                onClick={() => { setQuery(''); setConditionFilters([]); }}
                className="mt-4 px-4 py-2 bg-brand-surface hover:bg-slate-700 text-slate-300 rounded-xl transition-colors text-sm"
              >
                Limpiar filtros
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
