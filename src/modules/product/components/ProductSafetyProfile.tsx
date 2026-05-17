import React from 'react';
import { ShieldCheck, Heart, Droplets, Baby, Activity, ShieldCheck as ShieldIcon, Wheat, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { Product, SafetyStatus } from '../../../core/types/product.types';

interface ProductSafetyProfileProps {
  product: Product;
}

export const ProductSafetyProfile: React.FC<ProductSafetyProfileProps> = ({ product }) => {
  const getSafetyConfig = (status: SafetyStatus) => {
    switch (status) {
      case SafetyStatus.SI:
        return { color: 'text-primary bg-brand-accent/10 border-brand-accent/20', icon: <CheckCircle2 className="w-4 h-4" />, label: 'Apto' };
      case SafetyStatus.NO:
        return { color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: <AlertTriangle className="w-4 h-4" />, label: 'No Apto' };
      case SafetyStatus.PRECAUCION:
        return { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: <Info className="w-4 h-4" />, label: 'Precaución' };
      default:
        return { color: 'text-muted-foreground bg-background0/10 border-slate-500/20', icon: <Info className="w-4 h-4" />, label: 'Desconocido' };
    }
  };

  const safetyItems = [
    { id: 'embarazo', label: 'Embarazo', status: product.apto_embarazo, icon: <Heart className="w-4 h-4" /> },
    { id: 'lactancia', label: 'Lactancia', status: product.apto_lactancia, icon: <Droplets className="w-4 h-4" /> },
    { id: 'pediatria', label: 'Pediatría', status: product.apto_pediatria, icon: <Baby className="w-4 h-4" /> },
    { id: 'diabeticos', label: 'Diabéticos', status: product.apto_diabeticos, icon: <Activity className="w-4 h-4" /> },
    { id: 'hipertensos', label: 'Hipertensos', status: product.apto_hipertensos, icon: <ShieldIcon className="w-4 h-4" /> },
    { id: 'celiacos', label: 'Celíacos', status: product.apto_celiacos, icon: <Wheat className="w-4 h-4" /> },
  ];

  return (
    <div className="col-span-1 md:col-span-2 bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" /> Perfil de Seguridad
        </h3>
        <div className="flex items-center gap-3 text-[9px] uppercase tracking-wider font-bold opacity-80 bg-background px-3 py-1.5 rounded-lg border border-border">
          <div className="flex items-center gap-1.5 text-primary">
            <div className="w-2 h-2 rounded-full bg-brand-accent" /> Apto
          </div>
          <div className="flex items-center gap-1.5 text-amber-400">
            <div className="w-2 h-2 rounded-full bg-amber-500" /> Precaución
          </div>
          <div className="flex items-center gap-1.5 text-red-400">
            <div className="w-2 h-2 rounded-full bg-red-500" /> Riesgo
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {safetyItems.map((item) => {
          const config = getSafetyConfig(item.status);
          return (
            <div 
              key={item.id} 
              className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border transition-all text-center ${config.color}`}
            >
              <div className="p-3 rounded-full bg-background">{config.icon}</div>
              <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
