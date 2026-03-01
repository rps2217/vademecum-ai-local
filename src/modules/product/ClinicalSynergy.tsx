import React, { useState, useEffect } from 'react';
import { Product } from '../../core/types/product.types';
import { getDB } from '../../core/database/db';
import { Sparkles, Loader2, Link as LinkIcon, AlertCircle, Pill, ArrowRight, Clock } from 'lucide-react';
import { formatArrayToString } from '../../utils/formatters';

interface ClinicalSynergyProps {
  product: Product;
  onProductClick?: (product: Product) => void;
}

export const ClinicalSynergy: React.FC<ClinicalSynergyProps> = ({ product, onProductClick }) => {
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRelated = async () => {
      if (!product.synergy_analyzed || !product.skus_relacionados || product.skus_relacionados.length === 0) {
        setRelatedProducts([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const db = await getDB();
        const allProducts = await db.getAll('products');
        const confirmed = allProducts.filter(p => product.skus_relacionados.includes(p.sku));
        setRelatedProducts(confirmed);
      } catch (error) {
        console.error("Error cargando productos relacionados:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRelated();
  }, [product.sku, product.synergy_analyzed, product.skus_relacionados]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
        <p className="text-sm font-medium animate-pulse">Cargando sinergias...</p>
      </div>
    );
  }

  if (!product.synergy_analyzed) {
    return (
      <div className="bg-slate-800/30 rounded-3xl p-8 border border-slate-800/50 text-center space-y-4">
        <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mx-auto">
          <Clock className="w-6 h-6 animate-pulse" />
        </div>
        <h3 className="text-lg font-bold text-slate-300">Análisis en Segundo Plano</h3>
        <p className="text-sm text-slate-500 max-w-xs mx-auto">
          La IA local está analizando este producto en segundo plano para encontrar relaciones clínicas. Vuelve en unos momentos.
        </p>
      </div>
    );
  }

  if (relatedProducts.length === 0 && !product.sugerencia_complementaria) {
    return (
      <div className="bg-slate-800/30 rounded-3xl p-8 border border-slate-800/50 text-center space-y-4">
        <div className="w-12 h-12 bg-slate-800 text-slate-600 rounded-full flex items-center justify-center mx-auto">
          <LinkIcon className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-400">Sin Sinergias Directas</h3>
        <p className="text-sm text-slate-500 max-w-xs mx-auto">
          No se han encontrado productos complementarios o similares en tu base de datos local para este medicamento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Explicación Clínica / Sugerencia */}
      {product.sugerencia_complementaria && (
        <section className="bg-indigo-500/5 rounded-3xl p-6 border border-indigo-500/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles className="w-12 h-12 text-indigo-400" />
          </div>
          <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Inteligencia de Sinergia
          </h3>
          <p className="text-slate-300 leading-relaxed text-sm italic">
            "{product.sugerencia_complementaria}"
          </p>
        </section>
      )}

      {/* Productos Relacionados */}
      {relatedProducts.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <LinkIcon className="w-4 h-4" /> Productos Complementarios o Similares
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {relatedProducts.map(relProduct => (
              <button
                key={relProduct.sku}
                onClick={() => onProductClick?.(relProduct)}
                className="flex items-center gap-4 p-4 bg-slate-800/30 hover:bg-slate-800/50 rounded-2xl border border-slate-800/50 transition-all group text-left"
              >
                <div className="p-3 bg-slate-800 rounded-xl text-indigo-400 group-hover:scale-110 transition-transform">
                  <Pill className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-200 group-hover:text-white transition-colors truncate">
                    {relProduct.nombre_comercial}
                  </h4>
                  <p className="text-xs text-slate-500 truncate">
                    {formatArrayToString(relProduct.principios_activos, ', ')}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
