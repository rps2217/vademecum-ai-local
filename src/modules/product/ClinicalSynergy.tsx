import React, { useState, useEffect } from 'react';
import { Product } from '../../core/types/product.types';
import { DataService } from '../../services/DataService';
import { SynergyLoading } from './components/synergy/SynergyLoading';
import { SynergyEmpty } from './components/synergy/SynergyEmpty';
import { SynergySuggestion } from './components/synergy/SynergySuggestion';
import { RelatedProductsList } from './components/synergy/RelatedProductsList';
import { AlternativesList } from './components/synergy/AlternativesList';
import { SynergyGraph } from './components/synergy/SynergyGraph';
import { cosineSimilarity } from '../../utils/math';
import { Share2, List } from 'lucide-react';

interface ClinicalSynergyProps {
  product: Product;
  onProductClick?: (product: Product) => void;
}

export const ClinicalSynergy: React.FC<ClinicalSynergyProps> = ({ product, onProductClick }) => {
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [alternatives, setAlternatives] = useState<{ product: Product; score: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');

  useEffect(() => {
    const loadRelated = async () => {
      if (!product.synergy_analyzed || !product.skus_relacionados || product.skus_relacionados.length === 0) {
        setRelatedProducts([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const allProducts = await DataService.getAllProducts();
        
        // 1. Productos Complementarios (Sinergia definida por IA)
        const confirmed = allProducts.filter(p => 
          product.skus_relacionados && product.skus_relacionados.includes(p.sku)
        );
        setRelatedProducts(confirmed);

        // 2. Alternativas (Bioequivalentes o Similitud Semántica)
        const altList: { product: Product, score: number }[] = [];
        
        allProducts.forEach(p => {
          if (p.sku === product.sku) return; // No incluirse a sí mismo

          let score = 0;
          
          // A. Coincidencia de Principios Activos (Equivalencia Química)
          const commonPA = p.principios_activos.filter(pa => 
            product.principios_activos.includes(pa)
          );
          
          if (commonPA.length > 0) {
            // Un ratio de cuántos principios comparten sobre el total de ambos
            const chemicalScore = commonPA.length / Math.max(product.principios_activos.length, p.principios_activos.length);
            score = chemicalScore;
          }

          // B. Similitud Semántica (Vectores - Intuición IA sobre uso y forma)
          if (product.vectores && p.vectores && product.vectores.length > 0) {
            const vectorSimilarity = cosineSimilarity(product.vectores, p.vectores);
            
            // Si el score químico es alto, los vectores lo refuerzan. 
            // Si no hay score químico, los vectores pueden sugerir alternativas terapéuticas de otra familia.
            if (score > 0) {
                // Combinar: 70% química, 30% semántica para bioequivalentes
                score = (score * 0.7) + (vectorSimilarity * 0.3);
            } else if (vectorSimilarity > 0.85) {
                // Alternativa terapéutica pura por IA
                score = vectorSimilarity * 0.9; // Penalizar ligeramente por no compartir químicos
            }
          }

          if (score > 0.6) {
            altList.push({ product: p, score });
          }
        });

        setAlternatives(
          altList
            .sort((a, b) => b.score - a.score)
            .slice(0, 3) // Top 3 de Equivalencia
        );

      } catch (error) {
        console.error("Error cargando productos relacionados:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRelated();
  }, [product.sku, product.synergy_analyzed, product.skus_relacionados]);

  if (isLoading) return <SynergyLoading />;

  if (!product.synergy_analyzed) return <SynergyEmpty isAnalyzing={true} />;

  const hasContent = relatedProducts.length > 0 || 
                    alternatives.length > 0 || 
                    !!product.sugerencia_complementaria;

  if (!hasContent) {
    return <SynergyEmpty isAnalyzing={false} />;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Visualización</h4>
        <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700">
          <button 
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-brand-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            title="Vista de Lista"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => setViewMode('graph')}
            className={`p-1.5 rounded-lg transition-all ${viewMode === 'graph' ? 'bg-brand-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            title="Vista de Mapa"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {viewMode === 'graph' ? (
        <SynergyGraph 
          centerProduct={product}
          relatedProducts={[...relatedProducts, ...alternatives.map(a => a.product)]}
          onProductClick={onProductClick}
        />
      ) : (
        <>
          {product.sugerencia_complementaria && (
            <SynergySuggestion suggestion={product.sugerencia_complementaria} />
          )}

          {alternatives.length > 0 && (
            <AlternativesList 
              products={alternatives}
              onProductClick={onProductClick}
            />
          )}

          {relatedProducts.length > 0 && (
            <RelatedProductsList 
              products={relatedProducts} 
              onProductClick={onProductClick} 
            />
          )}
        </>
      )}
    </div>
  );
};

