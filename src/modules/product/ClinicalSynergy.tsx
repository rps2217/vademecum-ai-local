import React, { useState, useEffect } from 'react';
import { Product } from '../../core/types/product.types';
import { getDB } from '../../core/database/db';
import { SynergyLoading } from './components/synergy/SynergyLoading';
import { SynergyEmpty } from './components/synergy/SynergyEmpty';
import { SynergySuggestion } from './components/synergy/SynergySuggestion';
import { RelatedProductsList } from './components/synergy/RelatedProductsList';
import { AlternativesList } from './components/synergy/AlternativesList';
import { cosineSimilarity } from '../../utils/math';

interface ClinicalSynergyProps {
  product: Product;
  onProductClick?: (product: Product) => void;
}

export const ClinicalSynergy: React.FC<ClinicalSynergyProps> = ({ product, onProductClick }) => {
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [alternatives, setAlternatives] = useState<Product[]>([]);
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
          
          // A. Coincidencia de Principios Activos (Bioequivalentes) - Peso alto
          const commonPA = p.principios_activos.filter(pa => 
            product.principios_activos.includes(pa)
          );
          if (commonPA.length > 0 && commonPA.length === product.principios_activos.length) {
            score = 1.0; // Bioequivalente exacto
          } else if (commonPA.length > 0) {
            score = 0.8; // Comparte algunos principios
          }

          // B. Similitud Semántica (Vectores) - Peso medio
          if (product.vectores && p.vectores && product.vectores.length > 0) {
            const similarity = cosineSimilarity(product.vectores, p.vectores);
            if (similarity > 0.85) {
              score = Math.max(score, similarity);
            }
          }

          if (score > 0.75) {
            altList.push({ product: p, score });
          }
        });

        setAlternatives(
          altList
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(item => item.product)
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
    </div>
  );
};

