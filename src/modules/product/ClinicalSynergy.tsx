import React, { useState, useEffect } from 'react';
import { Product } from '../../core/types/product.types';
import { getDB } from '../../core/database/db';
import { SynergyLoading } from './components/synergy/SynergyLoading';
import { SynergyEmpty } from './components/synergy/SynergyEmpty';
import { SynergySuggestion } from './components/synergy/SynergySuggestion';
import { RelatedProductsList } from './components/synergy/RelatedProductsList';

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

  if (isLoading) return <SynergyLoading />;

  if (!product.synergy_analyzed) return <SynergyEmpty isAnalyzing={true} />;

  if (relatedProducts.length === 0 && !product.sugerencia_complementaria) {
    return <SynergyEmpty isAnalyzing={false} />;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {product.sugerencia_complementaria && (
        <SynergySuggestion suggestion={product.sugerencia_complementaria} />
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

