import React, { useState } from 'react';
import { Product, SafetyStatus } from '../../../core/types/product.types';
import { Save, X, AlertTriangle } from 'lucide-react';

interface ProductEditFormProps {
  product: Product;
  onSave: (updatedProduct: Product) => Promise<void>;
  onCancel: () => void;
}

export const ProductEditForm: React.FC<ProductEditFormProps> = ({ product, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Product>({ ...product });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (name: keyof Product, value: string) => {
    const array = value.split('\n').filter(item => item.trim() !== '');
    setFormData(prev => ({ ...prev, [name]: array }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await onSave(formData);
    } catch (err) {
      setError('Error al guardar los cambios. Intente de nuevo.');
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-brand-surface/50 p-6 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <Save className="w-5 h-5 text-brand-primary" />
          Editar Información del Producto
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nombre Comercial</label>
            <input
              type="text"
              name="nombre_comercial"
              value={formData.nombre_comercial}
              onChange={handleChange}
              className="w-full bg-brand-bg border border-slate-700 rounded-xl px-4 py-2 text-white focus:border-brand-primary outline-none transition-colors"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Categoría</label>
            <select
              name="categoria_principal"
              value={formData.categoria_principal}
              onChange={handleChange}
              className="w-full bg-brand-bg border border-slate-700 rounded-xl px-4 py-2 text-white focus:border-brand-primary outline-none transition-colors"
            >
              <option value="Medicamento">Medicamento</option>
              <option value="Suplemento">Suplemento</option>
              <option value="Belleza">Belleza</option>
              <option value="Homeopatía">Homeopatía</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Descripción</label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            rows={3}
            className="w-full bg-brand-bg border border-slate-700 rounded-xl px-4 py-2 text-white focus:border-brand-primary outline-none transition-colors resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Principios Activos (uno por línea)</label>
            <textarea
              value={formData.principios_activos.join('\n')}
              onChange={(e) => handleArrayChange('principios_activos', e.target.value)}
              rows={4}
              className="w-full bg-brand-bg border border-slate-700 rounded-xl px-4 py-2 text-white focus:border-brand-primary outline-none transition-colors resize-none font-mono text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Indicaciones (una por línea)</label>
            <textarea
              value={formData.indicaciones.join('\n')}
              onChange={(e) => handleArrayChange('indicaciones', e.target.value)}
              rows={4}
              className="w-full bg-brand-bg border border-slate-700 rounded-xl px-4 py-2 text-white focus:border-brand-primary outline-none transition-colors resize-none font-mono text-sm"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Posología</label>
          <input
            type="text"
            name="posologia"
            value={formData.posologia}
            onChange={handleChange}
            className="w-full bg-brand-bg border border-slate-700 rounded-xl px-4 py-2 text-white focus:border-brand-primary outline-none transition-colors"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Advertencias</label>
          <textarea
            name="advertencias"
            value={formData.advertencias}
            onChange={handleChange}
            rows={3}
            className="w-full bg-brand-bg border border-slate-700 rounded-xl px-4 py-2 text-white focus:border-brand-primary outline-none transition-colors resize-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Análisis de Componentes</label>
          <textarea
            name="analisis_componentes"
            value={formData.analisis_componentes}
            onChange={handleChange}
            rows={4}
            className="w-full bg-brand-bg border border-slate-700 rounded-xl px-4 py-2 text-white focus:border-brand-primary outline-none transition-colors resize-none"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {(['apto_embarazo', 'apto_lactancia', 'apto_pediatria', 'apto_diabeticos', 'apto_hipertensos', 'apto_celiacos'] as const).map(field => (
            <div key={field} className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                {field.replace('apto_', '').replace('_', ' ')}
              </label>
              <select
                name={field}
                value={formData[field]}
                onChange={handleChange}
                className="w-full bg-brand-bg border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:border-brand-primary outline-none transition-colors"
              >
                <option value={SafetyStatus.SI}>SI</option>
                <option value={SafetyStatus.NO}>NO</option>
                <option value={SafetyStatus.PRECAUCION}>PRECAUCION</option>
              </select>
            </div>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all border border-slate-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 px-6 py-3 rounded-2xl bg-brand-primary hover:bg-brand-primary/80 text-white font-bold transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Guardar Cambios
          </button>
        </div>
      </div>
    </form>
  );
};
