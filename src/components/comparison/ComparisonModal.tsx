import React, { useState } from 'react';
import { Product, SafetyStatus } from '../../core/types/product.types';
import { X, ArrowLeftRight, ShieldCheck, AlertCircle, CheckCircle2, Info, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ComparisonModalProps {
  products: Product[];
  onClose: () => void;
  onRemove: (sku: string) => void;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({ products, onClose, onRemove }) => {
  if (products.length === 0) return null;

  const getSafetyIcon = (status: SafetyStatus) => {
    switch (status) {
      case SafetyStatus.SI: return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case SafetyStatus.NO: return <X className="w-4 h-4 text-rose-400" />;
      case SafetyStatus.PRECAUCION: return <AlertCircle className="w-4 h-4 text-amber-400" />;
      default: return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  const getSafetyBg = (status: SafetyStatus) => {
    switch (status) {
      case SafetyStatus.SI: return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case SafetyStatus.NO: return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
      case SafetyStatus.PRECAUCION: return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      default: return 'bg-slate-800 border-slate-700 text-slate-500';
    }
  };

  const safetyLabels = [
    { key: 'apto_embarazo', label: 'Embarazo' },
    { key: 'apto_lactancia', label: 'Lactancia' },
    { key: 'apto_pediatria', label: 'Pediatría' },
    { key: 'apto_diabeticos', label: 'Diabéticos' },
    { key: 'apto_hipertensos', label: 'Hipertensos' },
    { key: 'apto_celiacos', label: 'Celíacos' },
  ] as const;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-brand-bg/90 backdrop-blur-xl animate-in fade-in duration-300">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-7xl bg-brand-surface border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-slate-800 flex items-center justify-between bg-brand-surface/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-primary/10 rounded-2xl">
              <ArrowLeftRight className="w-6 h-6 text-brand-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Análisis Comparativo Clínico</h2>
              <p className="text-sm text-slate-500">Evaluación diferencial de perfiles de seguridad y componentes.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition-all border border-slate-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Grid de Comparación */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-6 md:p-8 scrollbar-thin scrollbar-thumb-slate-800">
          <div className={`grid gap-6 min-w-[800px] ${
            products.length === 1 ? 'grid-cols-1 max-w-2xl mx-auto' : 
            products.length === 2 ? 'grid-cols-2' : 
            'grid-cols-3'
          }`}>
            {products.map((product) => (
              <div key={product.sku} className="flex flex-col gap-6 p-6 rounded-[2rem] bg-brand-bg/50 border border-slate-800 relative group">
                <button 
                  onClick={() => onRemove(product.sku)}
                  className="absolute top-4 right-4 p-2 rounded-xl bg-rose-500/10 text-rose-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500/20"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Info Básica */}
                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] font-bold uppercase tracking-widest border border-brand-primary/20">
                    {product.categoria_principal}
                  </span>
                  <h3 className="text-xl font-bold text-white leading-tight">{product.nombre_comercial}</h3>
                  <p className="text-xs text-slate-500 font-mono">{product.sku}</p>
                </div>

                {/* Perfil de Seguridad */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3" /> Perfil de Seguridad
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {safetyLabels.map(({ key, label }) => (
                      <div key={key} className={`flex items-center justify-between px-3 py-2 rounded-xl border text-[10px] font-bold ${getSafetyBg(product[key])}`}>
                        <span>{label}</span>
                        {getSafetyIcon(product[key])}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Principios Activos */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Componentes Activos</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {product.principios_activos.map((pa, i) => {
                      const annotation = product.anotaciones_componentes?.[pa];
                      return (
                        <div key={i} className="relative group/tag">
                          <span className="px-2 py-1 rounded-lg bg-slate-800/50 border border-slate-700 text-[10px] text-slate-300 block">
                            {pa}
                          </span>
                          {annotation && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-48 p-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 group-hover/tag:opacity-100 group-hover/tag:translate-y-0 translate-y-1 pointer-events-none transition-all z-20">
                              <p className="text-[10px] text-slate-300 leading-tight">
                                {annotation}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Indicaciones */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Indicaciones Principales</h4>
                  <div className="space-y-1.5">
                    {product.indicaciones.slice(0, 4).map((ind, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px] text-slate-400">
                        <div className="w-1 h-1 rounded-full bg-brand-primary mt-1.5 shrink-0" />
                        <span>{ind}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sinergia IA */}
                {product.synergy_analyzed && (
                  <div className="mt-auto pt-6 border-t border-slate-800">
                    <div className="p-4 rounded-2xl bg-brand-primary/5 border border-brand-primary/10">
                      <h4 className="text-[10px] font-bold text-brand-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Sparkles className="w-3 h-3" /> Sugerencia IA
                      </h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed italic">
                        "{product.sugerencia_complementaria}"
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-brand-surface/50 flex justify-center">
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-[0.2em]">
            Evaluación comparativa generada para uso profesional clínico
          </p>
        </div>
      </motion.div>
    </div>
  );
};
