/**
 * Vista de Analisis de Producto
 * Usa el sistema de Knowledge Base (sin IA externa)
 */

import React, { useState, useEffect } from 'react';
import { Product } from '../../core/types/product.types';
import { knowledgeAnalysisService } from '../../services/KnowledgeAnalysisService';
import { logger } from '../../services/LoggerService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface ProductAnalysisViewProps {
  product: Product;
  onClose?: () => void;
}

export function ProductAnalysisView({ product, onClose }: ProductAnalysisViewProps) {
  const [loading, setLoading] = useState(true);
  const [analisis, setAnalisis] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState<'ingredientes' | 'sinergias' | 'complementos'>('ingredientes');

  useEffect(() => {
    analizarProducto();
  }, [product.sku]);

  const analizarProducto = async () => {
    setLoading(true);
    try {
      const result = await knowledgeAnalysisService.analizarProducto(product);
      setAnalisis(result);
    } catch (error) {
      logger.error('Error analizando producto', 'ProductAnalysisView', error);
    } finally {
      setLoading(false);
    }
  };

  const getCoberturaColor = (cobertura: number) => {
    if (cobertura >= 70) return 'success';
    if (cobertura >= 40) return 'warning';
    return 'danger';
  };

  const getNivelColor = (nivel: string) => {
    switch (nivel) {
      case 'alto': return 'success';
      case 'medio': return 'warning';
      default: return 'muted';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Analizando producto...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header del Producto */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">{product.nombre_comercial}</h2>
          <p className="text-muted-foreground">{product.categoria_principal || product.categoria}</p>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        )}
      </div>

      {/* Resumen del Analisis */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{analisis?.analisisKB?.ingredientes_encontrados?.length || 0}</div>
            <p className="text-sm text-muted-foreground">Ingredientes identificados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{analisis?.analisisKB?.ingredientes_sin_match?.length || 0}</div>
            <p className="text-sm text-muted-foreground">Sin informacion</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{analisis?.porcentaje_cobertura || 0}%</div>
            <p className="text-sm text-muted-foreground">Cobertura KB</p>
            <Badge variant={getCoberturaColor(analisis?.porcentaje_cobertura || 0)} className="mt-1">
              {analisis?.porcentaje_cobertura >= 70 ? 'Alta' : analisis?.porcentaje_cobertura >= 40 ? 'Media' : 'Baja'}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{analisis?.productos_complementarios?.length || 0}</div>
            <p className="text-sm text-muted-foreground">Complementos</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            selectedTab === 'ingredientes' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setSelectedTab('ingredientes')}
        >
          Ingredientes
        </button>
        <button
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            selectedTab === 'sinergias' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setSelectedTab('sinergias')}
        >
          Sinergias
        </button>
        <button
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            selectedTab === 'complementos' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setSelectedTab('complementos')}
        >
          Complementos
        </button>
      </div>

      {/* Contenido de tabs */}
      <div className="min-h-[300px]">
        {selectedTab === 'ingredientes' && (
          <div className="space-y-4">
            {analisis?.ingredientes_detallados?.map((ing: any) => (
              <Card key={ing.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{ing.nombre}</CardTitle>
                    <Badge variant="outline">{ing.categoria?.replace(/_/g, ' ')}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{ing.descripcion}</p>
                  
                  <div>
                    <h4 className="font-medium text-sm mb-2">Beneficios</h4>
                    <div className="flex flex-wrap gap-2">
                      {ing.beneficios?.slice(0, 5).map((b: string, i: number) => (
                        <Badge key={i} variant="success" className="text-xs">
                          + {b}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {ing.grafo && ing.grafo.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Sinergias ({ing.grafo.length})</h4>
                      <div className="flex flex-wrap gap-2">
                        {ing.grafo.filter((e: any) => e.peso > 0).slice(0, 5).map((s: any) => (
                          <Badge key={s.id} variant={getNivelColor(s.nivel)} className="text-xs">
                            {s.tipo}: {s.hacia}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {ing.dosis_recomendada && (
                    <div className="p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Dosis: </span>
                      <span className="text-sm">{ing.dosis_recomendada}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {analisis?.analisisKB?.ingredientes_sin_match?.length > 0 && (
              <Card className="border-warning">
                <CardHeader>
                  <CardTitle className="text-warning">Ingredientes sin informacion detallada</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Los siguientes ingredientes no estan en nuestra base de conocimiento:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {analisis.analisisKB.ingredientes_sin_match.map((ing: string, i: number) => (
                      <Badge key={i} variant="outline">{ing}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {selectedTab === 'sinergias' && (
          <div className="space-y-4">
            {analisis?.analisisCompleto?.sinergias_detectadas?.length > 0 ? (
              analisis.analisisCompleto.sinergias_detectadas.map((s: any, i: number) => (
                <Card key={i}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{s.producto_secundario}</h4>
                        <Badge variant={getNivelColor(s.nivel_sinergia)} className="mt-1">
                          {s.tipo_relacion} - {s.nivel_sinergia}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{s.descripcion}</p>
                    <div className="p-3 bg-primary/5 rounded-lg">
                      <p className="text-sm font-medium">Recomendacion:</p>
                      <p className="text-sm">{s.recomendaciones}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No se detectaron sinergias de alto nivel para este producto.</p>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'complementos' && (
          <div className="space-y-4">
            {analisis?.productos_complementarios?.length > 0 ? (
              analisis.productos_complementarios.map((p: any, i: number) => (
                <Card key={i} className="hover:border-primary transition-colors cursor-pointer">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{p.nombre}</h4>
                        <Badge variant="outline" className="mt-1">{p.analisis.categoria_predominante}</Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{p.analisis.nivel_analisis_completo}%</div>
                        <p className="text-xs text-muted-foreground">cobertura</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {p.analisis.explicacion_general?.substring(0, 150)}...
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {p.analisis.ingredientes_encontrados?.length || 0} ingredientes identificados
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No hay productos complementarios en el catalogo.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Explicacion General */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle>Analisis Completo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-line">{analisis?.explicacion_completa}</p>
          {analisis?.requiere_ia_externa && (
            <div className="mt-4 p-3 bg-warning/10 rounded-lg border border-warning/20">
              <p className="text-sm font-medium text-warning">Informacion limitada</p>
              <p className="text-xs text-muted-foreground mt-1">
                Este producto requiere analisis con IA para informacion mas detallada.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ProductAnalysisView;
