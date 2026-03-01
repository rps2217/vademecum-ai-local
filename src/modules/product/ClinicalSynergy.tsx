import React, { useState, useEffect } from 'react';
import { Product } from '../../core/types/product.types';
import { AIService } from '../../services/AIService';
import { GeminiService } from '../../services/GeminiService';
import { getDB } from '../../core/database/db';
import { Sparkles, Loader2, Link as LinkIcon, AlertCircle, Pill, ArrowRight } from 'lucide-react';
import { formatArrayToString } from '../../utils/formatters';

interface ClinicalSynergyProps {
  product: Product;
  onProductClick?: (product: Product) => void;
}

export const ClinicalSynergy: React.FC<ClinicalSynergyProps> = ({ product, onProductClick }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [synergyData, setSynergyData] = useState<{
    explicacion_clinica: string;
    sugerencia_complementaria: string;
    relatedProducts: Product[];
  } | null>(null);

  useEffect(() => {
    const analyzeSynergy = async () => {
      setIsLoading(true);
      try {
        const db = await getDB();
        const allProducts = await db.getAll('products');
        
        // 1. Encontrar candidatos por similitud semántica (Embeddings)
        const mainVector = product.vectores;
        let candidates: Product[] = [];

        if (mainVector && mainVector.length > 0) {
          candidates = allProducts
            .filter(p => p.sku !== product.sku && p.vectores && p.vectores.length > 0)
            .map(p => ({
              product: p,
              score: cosineSimilarity(mainVector, p.vectores)
            }))
            .filter(item => item.score > 0.7) // Umbral alto para sinergia
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(item => item.product);
        }

        if (candidates.length === 0) {
          setSynergyData({
            explicacion_clinica: "No se encontraron productos con sinergia directa en la base de datos local actual.",
            sugerencia_complementaria: "",
            relatedProducts: []
          });
          return;
        }

        // 2. Usar Gemini para analizar la relación clínica real
        const analysis = await GeminiService.analyzeSynergy(product, candidates);
        
        // 3. Filtrar los productos que Gemini confirmó como relacionados
        const confirmedProducts = candidates.filter(c => 
          analysis.skus_relacionados.includes(c.sku)
        );

        setSynergyData({
          explicacion_clinica: analysis.explicacion_clinica,
          sugerencia_complementaria: analysis.sugerencia_complementaria,
          relatedProducts: confirmedProducts
        });

      } catch (error) {
        console.error("Error en ClinicalSynergy:", error);
      } finally {
        setIsLoading(false);
      }
    };

    analyzeSynergy();
  }, [product.sku]);

  function cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
        <p className="text-sm font-medium animate-pulse">Analizando sinergias clínicas...</p>
      </div>
    );
  }

  if (!synergyData) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Explicación Clínica */}
      <section className="bg-indigo-500/5 rounded-3xl p-6 border border-indigo-500/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Sparkles className="w-12 h-12 text-indigo-400" />
        </div>
        <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> Inteligencia de Sinergia
        </h3>
        <p className="text-slate-300 leading-relaxed text-sm italic">
          "{synergyData.explicacion_clinica}"
        </p>
        {synergyData.sugerencia_complementaria && (
          <div className="mt-4 p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-200/80 font-medium leading-relaxed">
              <span className="text-emerald-400 font-bold uppercase tracking-wider block mb-1">Sugerencia Complementaria:</span>
              {synergyData.sugerencia_complementaria}
            </p>
          </div>
        )}
      </section>

      {/* Productos Relacionados */}
      {synergyData.relatedProducts.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <LinkIcon className="w-4 h-4" /> Productos con Propiedades Similares
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {synergyData.relatedProducts.map(relProduct => (
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
