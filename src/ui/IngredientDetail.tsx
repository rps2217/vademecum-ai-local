/**
 * IngredientDetail - Modal de detalle de ingrediente
 * OPTIMIZADO: Memoizado para evitar re-renders innecesarios
 */

import { memo, useMemo } from 'react';
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

const EVIDENCE_COLORS = {
  A: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  B: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  C: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  D: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
} as const;

const IngredientDetailComponent = ({ ingredient, onClose, onViewSynergies }: IngredientDetailProps) => {
  // Memoizar datos calculados
  const evidenceColor = useMemo(() => EVIDENCE_COLORS[ingredient.evidencia] || EVIDENCE_COLORS.C, [ingredient.evidencia]);
  const sinonimosDisplay = useMemo(() => ingredient.sinonimos?.slice(0, 3).join(', '), [ingredient.sinonimos]);
  const sistemasBadges = useMemo(() => ingredient.sistemas?.map(sys => (
    <Badge key={sys} variant="secondary">{sys}</Badge>
  )), [ingredient.sistemas]);
  const indicacionesList = useMemo(() => ingredient.indicaciones?.map((ind, idx) => (
    <li key={idx} className="text-sm text-muted-foreground">{ind}</li>
  )), [ingredient.indicaciones]);
  const propiedadesList = useMemo(() => ingredient.propiedades?.map((prop, idx) => (
    <p key={idx} className="text-sm text-muted-foreground">{prop}</p>
  )), [ingredient.propiedades]);
  const interaccionesBadges = useMemo(() => ingredient.interacciones?.map((int, idx) => (
    <Badge key={idx} variant="danger">{int}</Badge>
  )), [ingredient.interacciones]);

  const handleClose = () => onClose();
  const handleViewSynergies = () => onViewSynergies?.(ingredient.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={handleClose} 
        onKeyDown={(e) => e.key === 'Escape' && handleClose()} 
        tabIndex={0} 
        role="button" 
      />
      
      <Card className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold">{ingredient.nombre}</h2>
            {sinonimosDisplay && (
              <p className="text-sm text-muted-foreground">
                {sinonimosDisplay}
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge className={evidenceColor}>
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
          {sistemasBadges && sistemasBadges.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Sistemas corporales
              </h3>
              <div className="flex flex-wrap gap-1">
                {sistemasBadges}
              </div>
            </div>
          )}

          {/* Indicaciones */}
          {indicacionesList && indicacionesList.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Indicaciones</h3>
              <ul className="list-disc list-inside space-y-1">
                {indicacionesList}
              </ul>
            </div>
          )}

          {/* Propiedades */}
          {propiedadesList && propiedadesList.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Propiedades</h3>
              <div className="space-y-2">
                {propiedadesList}
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
          {interaccionesBadges && interaccionesBadges.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Interacciones medicamentosas
              </h3>
              <div className="flex flex-wrap gap-2">
                {interaccionesBadges}
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleViewSynergies}
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              Ver sinergias
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Memoizar el componente para evitar re-renders innecesarios
export const IngredientDetail = memo(IngredientDetailComponent, (prevProps, nextProps) => {
  return prevProps.ingredient.id === nextProps.ingredient.id &&
         prevProps.ingredient.updatedAt === nextProps.ingredient.updatedAt;
});
