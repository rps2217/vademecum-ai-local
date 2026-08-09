/**
 * IngredientEditor - Editor de ingredientes
 * 
 * Formulario para crear/editar ingredientes.
 */

import { useState, useCallback, memo } from 'react';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { X, Save } from 'lucide-react';
import type { DbIngredient, IngredientCategory, EvidenceLevel, BodySystem } from '@/db/schema';
import { generateId, now, getDeviceId } from '@/db/schema';
import { cn } from '@/lib/utils';

const CATEGORIES: { value: IngredientCategory; label: string }[] = [
  { value: 'fitoterapia', label: 'Fitoterapia' },
  { value: 'homeopatia', label: 'Homeopatía' },
  { value: 'aceite_esencial', label: 'Aceite Esencial' },
  { value: 'vitamina', label: 'Vitamina' },
  { value: 'mineral', label: 'Mineral' },
  { value: 'probiotico', label: 'Probiótico' },
  { value: 'prebiotico', label: 'Prebiótico' },
  { value: 'enzima', label: 'Enzima' },
  { value: 'aminoacido', label: 'Aminoácido' },
];

const EVIDENCE_LEVELS: { value: EvidenceLevel; label: string }[] = [
  { value: 'A', label: 'A - Alta' },
  { value: 'B', label: 'B - Media' },
  { value: 'C', label: 'C - Baja' },
  { value: 'D', label: 'D - Muy Baja' },
];

const BODY_SYSTEMS: { value: BodySystem; label: string }[] = [
  { value: 'nervioso', label: 'Sistema Nervioso' },
  { value: 'digestivo', label: 'Sistema Digestivo' },
  { value: 'inmune', label: 'Sistema Inmunitario' },
  { value: 'cardiovascular', label: 'Sistema Cardiovascular' },
  { value: 'respiratorio', label: 'Sistema Respiratorio' },
  { value: 'musculoesqueletico', label: 'Sistema Musculoesquelético' },
  { value: 'endocrino', label: 'Sistema Endocrino' },
];

interface IngredientEditorProps {
  ingredient?: DbIngredient;
  onSave: (ingredient: DbIngredient) => void;
  onCancel: () => void;
}

const IngredientEditorComponent = ({ ingredient, onSave, onCancel }: IngredientEditorProps) => {
  const [form, setForm] = useState<{
    nombre: string;
    sinonimos: string;
    categoria: IngredientCategory;
    familia: string;
    sistemas: BodySystem[];
    indicaciones: string;
    evidencia: EvidenceLevel;
    propiedades: string;
    interacciones: string;
    seguridadEmbarazo: string;
    seguridadLactancia: string;
    seguridadPediatria: string;
  }>({
    nombre: ingredient?.nombre || '',
    sinonimos: ingredient?.sinonimos?.join(', ') || '',
    categoria: ingredient?.categoria || 'fitoterapia',
    familia: ingredient?.familia || '',
    sistemas: ingredient?.sistemas || [],
    indicaciones: ingredient?.indicaciones?.join(', ') || '',
    evidencia: ingredient?.evidencia || 'C',
    propiedades: ingredient?.propiedades?.join('\n') || '',
    interacciones: ingredient?.interacciones?.join(', ') || '',
    seguridadEmbarazo: ingredient?.seguridad?.embarazo || '',
    seguridadLactancia: ingredient?.seguridad?.lactancia || '',
    seguridadPediatria: ingredient?.seguridad?.pediatria || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = useCallback((field: string, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }, []);

  const toggleSystem = useCallback((system: BodySystem) => {
    setForm((prev) => ({
      ...prev,
      sistemas: prev.sistemas.includes(system)
        ? prev.sistemas.filter((s) => s !== system)
        : [...prev.sistemas, system],
    }));
  }, []);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!form.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form.nombre]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const ingredientes: DbIngredient = {
      id: ingredient?.id || generateId(),
      nombre: form.nombre.trim(),
      sinonimos: form.sinonimos
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      categoria: form.categoria,
      familia: form.familia.trim() || undefined,
      sistemas: form.sistemas,
      indicaciones: form.indicaciones
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      evidencia: form.evidencia,
      propiedades: form.propiedades
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      seguridad: {
        embarazo: form.seguridadEmbarazo as DbIngredient['seguridad']['embarazo'],
        lactancia: form.seguridadLactancia as DbIngredient['seguridad']['lactancia'],
        pediatria: form.seguridadPediatria as DbIngredient['seguridad']['pediatria'],
      },
      interacciones: form.interacciones
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      fuentes: [],
      lamport: (ingredient?.lamport || 0) + 1,
      deviceId: getDeviceId(),
      updatedAt: now(),
      createdAt: ingredient?.createdAt || now(),
      tombstone: 0,
    };

    onSave(ingredientes);
  }, [form, ingredient, validate, onSave]);

  return (
    <Card className="max-w-2xl mx-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            {ingredient ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onCancel} aria-label="Cerrar editor">
            <X className="w-5 h-5" aria-hidden="true" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium mb-1">Nombre *</label>
            <Input
              value={form.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder="Ej: Valeriana"
              error={errors.nombre}
            />
          </div>

          {/* Sinónimos */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Sinónimos
              <span className="text-muted-foreground text-xs ml-1">(separados por coma)</span>
            </label>
            <Input
              value={form.sinonimos}
              onChange={(e) => handleChange('sinonimos', e.target.value)}
              placeholder="Ej: Valeriana officinalis, Hierba de los gatos"
            />
          </div>

          {/* Categoría y Familia */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Categoría</label>
              <select
                value={form.categoria}
                onChange={(e) => handleChange('categoria', e.target.value as IngredientCategory)}
                aria-label="Categoría"
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Familia</label>
              <Input
                value={form.familia}
                onChange={(e) => handleChange('familia', e.target.value)}
                placeholder="Ej: Valerianaceae"
              />
            </div>
          </div>

          {/* Sistemas Corporales */}
          <div>
            <label className="block text-sm font-medium mb-2">Sistemas Corporales</label>
            <div className="flex flex-wrap gap-2">
              {BODY_SYSTEMS.map((sys) => (
                <button
                  key={sys.value}
                  type="button"
                  onClick={() => toggleSystem(sys.value)}
                  aria-pressed={form.sistemas.includes(sys.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:opacity-80',
                    form.sistemas.includes(sys.value)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {sys.label}
                </button>
              ))}
            </div>
          </div>

          {/* Evidencia */}
          <div>
            <label className="block text-sm font-medium mb-1">Nivel de Evidencia</label>
            <select
              value={form.evidencia}
              onChange={(e) => handleChange('evidencia', e.target.value as EvidenceLevel)}
              aria-label="Nivel de evidencia"
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {EVIDENCE_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          {/* Indicaciones */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Indicaciones
              <span className="text-muted-foreground text-xs ml-1">(separadas por coma)</span>
            </label>
            <Input
              value={form.indicaciones}
              onChange={(e) => handleChange('indicaciones', e.target.value)}
              placeholder="Ej: Insomnio, Ansiedad, Estrés"
            />
          </div>

          {/* Propiedades */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Propiedades
              <span className="text-muted-foreground text-xs ml-1">(una por línea)</span>
            </label>
            <textarea
              value={form.propiedades}
              onChange={(e) => handleChange('propiedades', e.target.value)}
              placeholder="Ej: Sedante natural&#10;Relajante muscular"
              rows={3}
              aria-label="Propiedades"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Interacciones */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Interacciones Medicamentosas
              <span className="text-muted-foreground text-xs ml-1">(separadas por coma)</span>
            </label>
            <Input
              value={form.interacciones}
              onChange={(e) => handleChange('interacciones', e.target.value)}
              placeholder="Ej: Warfarina, Benzodiacepinas"
            />
          </div>

          {/* Seguridad */}
          <div>
            <label className="block text-sm font-medium mb-2">Seguridad</label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Embarazo</label>
                <select
                  value={form.seguridadEmbarazo}
                  onChange={(e) => handleChange('seguridadEmbarazo', e.target.value)}
                  aria-label="Seguridad en embarazo"
                  className="w-full h-9 px-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">No especificado</option>
                  <option value="apto">Apto</option>
                  <option value="evitar">Evitar</option>
                  <option value="contraindicado">Contraindicado</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Lactancia</label>
                <select
                  value={form.seguridadLactancia}
                  onChange={(e) => handleChange('seguridadLactancia', e.target.value)}
                  aria-label="Seguridad en lactancia"
                  className="w-full h-9 px-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">No especificado</option>
                  <option value="apto">Apto</option>
                  <option value="evitar">Evitar</option>
                  <option value="contraindicado">Contraindicado</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Pediatría</label>
                <select
                  value={form.seguridadPediatria}
                  onChange={(e) => handleChange('seguridadPediatria', e.target.value)}
                  aria-label="Seguridad en pediatría"
                  className="w-full h-9 px-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">No especificado</option>
                  <option value="apto">Apto</option>
                  <option value="evitar">Evitar</option>
                  <option value="contraindicado">Contraindicado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 gap-2">
              <Save className="w-4 h-4" />
              {ingredient ? 'Guardar Cambios' : 'Crear Ingrediente'}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
};

export const IngredientEditor = memo(IngredientEditorComponent);
