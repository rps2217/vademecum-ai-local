/**
 * IngredientDetail - Modal de detalle de ingrediente
 */

import { Card } from '@/ui/Card';
import { Badge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { X, AlertTriangle, Info, Link as LinkIcon } from 'lucide-react';
import type { DbIngredient } from '@/db/schema';

interface IngredientDetailProps {
  ingredient: DbIngredient;
  onClose: () => void;
  onViewSynergies?: (id: string) => void;
}

export function IngredientDetail({ ingredient, onClose, onViewSynergies }: IngredientDetailProps) {
  const evidenceColors = {
    A: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    B: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    C: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    D: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} onKeyDown={(e) => e.key === 'Escape' && onClose()} tabIndex={0} role="button" />
      
      <Card className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{ingredient.nombre}</h2>
            {ingredient.sinonimos && ingredient.sinonimos.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {ingredient.sinonimos.slice(0, 3).join(', ')}
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge className={evidenceColors[ingredient.evidencia]}>
              Evidencia {ingredient.evidencia}
            </Badge>
            <Badge variant="outline">
              {ingredient.categoria.replace('_', ' ')}
            </Badge>
            {ingredient.familia && (
              <Badge variant="secondary">
                {ingredient.familia}
              </Badge>
            )}
          </div>

          {/* Sistemas */}
          {ingredient.sistemas && ingredient.sistemas.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Sistemas corporales
              </h3>
              <div className="flex flex-wrap gap-1">
                {ingredient.sistemas.map((sys) => (
                  <Badge key={sys} variant="secondary">
                    {sys}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Indicaciones */}
          {ingredient.indicaciones && ingredient.indicaciones.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Indicaciones</h3>
              <ul className="list-disc list-inside space-y-1">
                {ingredient.indicaciones.map((ind, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground">
                    {ind}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Propiedades */}
          {ingredient.propiedades && ingredient.propiedades.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Propiedades</h3>
              <div className="space-y-2">
                {ingredient.propiedades.map((prop, idx) => (
                  <p key={idx} className="text-sm text-muted-foreground">
                    {prop}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Seguridad */}
          {ingredient.seguridad && (
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Seguridad
              </h3>
              <div className="space-y-2">
                {ingredient.seguridad.embarazo && (
                  <div className={`p-3 rounded-lg ${
                    ingredient.seguridad.embarazo === 'evitar' 
                      ? 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
                      : 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                  }`}>
                    <strong>Embarazo:</strong> {ingredient.seguridad.embarazo}
                  </div>
                )}
                {ingredient.seguridad.lactancia && (
                  <div className={`p-3 rounded-lg ${
                    ingredient.seguridad.lactancia === 'evitar' 
                      ? 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
                      : 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                  }`}>
                    <strong>Lactancia:</strong> {ingredient.seguridad.lactancia}
                  </div>
                )}
                {ingredient.seguridad.pediatria && (
                  <div className={`p-3 rounded-lg ${
                    ingredient.seguridad.pediatria === 'evitar' 
                      ? 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
                      : 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                  }`}>
                    <strong>Pediatria:</strong> {ingredient.seguridad.pediatria}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Interacciones */}
          {ingredient.interacciones && ingredient.interacciones.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Interacciones medicamentosas
              </h3>
              <div className="flex flex-wrap gap-2">
                {ingredient.interacciones.map((int, idx) => (
                  <Badge key={idx} variant="danger">
                    {int}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => onViewSynergies?.(ingredient.id)}
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              Ver sinergias
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
