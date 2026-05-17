import React, { useState } from 'react';
import { Product, SafetyStatus } from '../../core/types/product.types';
import { X, ArrowLeftRight, ShieldCheck, AlertCircle, CheckCircle2, Info, Sparkles, Printer, FileText } from 'lucide-react';
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
      default: return <Info className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getSafetyBg = (status: SafetyStatus) => {
    switch (status) {
      case SafetyStatus.SI: return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case SafetyStatus.NO: return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
      case SafetyStatus.PRECAUCION: return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      default: return 'bg-card border-border text-muted-foreground';
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background backdrop-blur-xl animate-in fade-in duration-300">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-7xl bg-card border border-border rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:border-none print:rounded-none"
      >
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-border flex items-center justify-between bg-card print:bg-card print:border-border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary rounded-2xl print:hidden">
              <ArrowLeftRight className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground print:text-foreground">Análisis Comparativo Clínico</h2>
              <p className="text-sm text-muted-foreground print:text-muted-foreground">Evaluación diferencial de perfiles de seguridad y componentes.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary hover:bg-primary text-foreground text-xs font-bold transition-all shadow-lg shadow-brand-primary/20 print:hidden"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Reporte</span>
            </button>
            <button 
              onClick={onClose}
              className="p-3 rounded-2xl bg-card hover:bg-slate-700 text-muted-foreground transition-all border border-border print:hidden"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Grid de Comparación */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-6 md:p-8 scrollbar-thin scrollbar-thumb-slate-800 print:overflow-visible print:p-0">
          <div className={`grid gap-6 min-w-[800px] print:min-w-0 print:grid-cols-1 print:gap-12 ${
            products.length === 1 ? 'grid-cols-1 max-w-2xl mx-auto' : 
            products.length === 2 ? 'grid-cols-2' : 
            'grid-cols-3'
          }`}>
            {products.map((product) => (
              <div key={product.sku} className="flex flex-col gap-6 p-6 rounded-[2rem] bg-background border border-border relative group print:bg-card print:border-border print:rounded-none print:p-4 print:break-inside-avoid">
                <button 
                  onClick={() => onRemove(product.sku)}
                  className="absolute top-4 right-4 p-2 rounded-xl bg-rose-500/10 text-rose-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500/20 print:hidden"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Info Básica */}
                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full bg-primary text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/50 print:text-primary print:border-primary/50">
                    {product.categoria_principal}
                  </span>
                  <h3 className="text-xl font-bold text-foreground leading-tight print:text-foreground">{product.nombre_comercial}</h3>
                  <p className="text-xs text-muted-foreground font-mono print:text-muted-foreground">{product.sku}</p>
                </div>

                {/* Perfil de Seguridad */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 print:text-slate-700">
                    <ShieldCheck className="w-3 h-3" /> Perfil de Seguridad
                  </h4>
                  <div className="grid grid-cols-2 gap-2 print:grid-cols-3">
                    {safetyLabels.map(({ key, label }) => (
                      <div key={key} className={`flex items-center justify-between px-3 py-2 rounded-xl border text-[10px] font-bold print:border-border ${getSafetyBg(product[key])} print:bg-background print:text-foreground`}>
                        <span>{label}</span>
                        {getSafetyIcon(product[key])}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Principios Activos */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest print:text-slate-700">Componentes Activos</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {product.principios_activos.map((pa, i) => {
                      const annotation = product.anotaciones_componentes?.[pa];
                      return (
                        <div key={i} className="relative group/tag">
                          <span className="px-2 py-1 rounded-lg bg-card border border-border text-[10px] text-muted-foreground block print:bg-card print:border-border print:text-foreground">
                            {pa}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Indicaciones */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest print:text-slate-700">Indicaciones Principales</h4>
                  <div className="space-y-1.5">
                    {product.indicaciones.slice(0, 4).map((ind, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground print:text-slate-700">
                        <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                        <span>{ind}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sinergia IA */}
                {product.synergy_analyzed && (
                  <div className="mt-auto pt-6 border-t border-border print:border-border">
                    <div className="p-4 rounded-2xl bg-primary border border-primary/50 print:bg-primary print:border-primary/50">
                      <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-2 print:text-primary">
                        <Sparkles className="w-3 h-3" /> Sugerencia IA
                      </h4>
                      <p className="text-[10px] text-muted-foreground leading-relaxed italic print:text-slate-700">
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
        <div className="p-6 border-t border-border bg-card flex justify-center print:bg-card print:border-border">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em] print:text-muted-foreground">
            Evaluación comparativa generada para uso profesional clínico • {new Date().toLocaleDateString()}
          </p>
        </div>
      </motion.div>
    </div>
  );
};
