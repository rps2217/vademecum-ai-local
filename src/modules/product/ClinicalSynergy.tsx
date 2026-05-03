import React, { useState, useEffect } from 'react';
import { Product } from '../../core/types/product.types';
import { dataService } from '../../services/DataService';
import { SynergyLoading } from './components/synergy/SynergyLoading';
import { SynergyEmpty } from './components/synergy/SynergyEmpty';
import { SynergySuggestion } from './components/synergy/SynergySuggestion';
import { RelatedProductsList } from './components/synergy/RelatedProductsList';
import { AlternativesList } from './components/synergy/AlternativesList';
import { SynergyGraph } from './components/synergy/SynergyGraph';
import { cosineSimilarity } from '../../utils/math';
import { Share2, List, Filter, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

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
        const allProducts = await dataService.getAllProducts();
        
        const confirmed = allProducts.filter(p => 
          product.skus_relacionados && product.skus_relacionados.includes(p.sku)
        );
        setRelatedProducts(confirmed);

        const altList: { product: Product, score: number }[] = [];
        
        allProducts.forEach(p => {
          if (p.sku === product.sku) return;

          let score = 0;
          
          const commonPA = p.principios_activos.filter(pa => 
            product.principios_activos.includes(pa)
          );
          
          if (commonPA.length > 0) {
            const chemicalScore = commonPA.length / Math.max(product.principios_activos.length, p.principios_activos.length);
            score = chemicalScore;
          }

          if (product.vectores && p.vectores && product.vectores.length > 0) {
            const vectorSimilarity = cosineSimilarity(product.vectores, p.vectores);
            
            if (score > 0) {
                score = (score * 0.7) + (vectorSimilarity * 0.3);
            } else if (vectorSimilarity > 0.85) {
                score = vectorSimilarity * 0.9;
            }
          }

          if (score > 0.6) {
            altList.push({ product: p, score });
          }
        });

        setAlternatives(
          altList
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 whitespace-optimized">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Gráfico de Relaciones</span>
        </div>
        <div className="flex border rounded-lg p-1 bg-muted/40">
          <Button 
            variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
            size="icon" 
            onClick={() => setViewMode('list')}
            className="h-8 w-8 rounded-md"
          >
            <List className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant={viewMode === 'graph' ? 'secondary' : 'ghost'} 
            size="icon" 
            onClick={() => setViewMode('graph')}
            className="h-8 w-8 rounded-md"
          >
            <Share2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {viewMode === 'graph' ? (
        <SynergyGraph 
          centerProduct={product}
          relatedProducts={[...relatedProducts, ...alternatives.map(a => a.product)]}
          onProductClick={onProductClick}
        />
      ) : (
        <div className="space-y-12">
          {product.sugerencia_complementaria && (
            <div className="space-y-4">
              <SynergySuggestion suggestion={product.sugerencia_complementaria} />
            </div>
          )}

          {alternatives.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Alternativas y Bioequivalentes</h4>
              </div>
              <AlternativesList 
                products={alternatives}
                onProductClick={onProductClick}
              />
            </div>
          )}

          {relatedProducts.length > 0 && (
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Coadyuvantes Sinergistas</h4>
               </div>
              <RelatedProductsList 
                products={relatedProducts} 
                onProductClick={onProductClick} 
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

