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
        return { 
          color: 'text-emerald-800 bg-emerald-50/50 hover:bg-emerald-50 border-emerald-100 hover:border-emerald-200', 
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />, 
          label: 'Apto',
          desc: 'Apto para su uso clínico habitual según registros estándar.' 
        };
      case SafetyStatus.NO:
        return { 
          color: 'text-red-850 bg-red-50/50 hover:bg-red-50 border-red-100 hover:border-red-200', 
          icon: <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />, 
          label: 'Contraindicado',
          desc: 'Alto riesgo clínico o contraindicación estricta registrada.' 
        };
      case SafetyStatus.PRECAUCION:
        return { 
          color: 'text-amber-800 bg-amber-50/50 hover:bg-amber-50 border-amber-100 hover:border-amber-200', 
          icon: <Info className="w-5 h-5 text-amber-600" />, 
          label: 'Precaución',
          desc: 'Requiere evaluación de dosis o supervisión médica.' 
        };
      default:
        return { 
          color: 'text-muted-foreground bg-muted/40 border-border/60', 
          icon: <Info className="w-5 h-5 text-muted-foreground" />, 
          label: 'No Registrado',
          desc: 'No se dispone de información de seguridad clínica.' 
        };
    }
  };

  const safetyItems = [
    { id: 'embarazo', label: 'Embarazo', status: product.apto_embarazo, icon: <Heart className="w-5 h-5 text-rose-500" /> },
    { id: 'lactancia', label: 'Lactancia', status: product.apto_lactancia, icon: <Droplets className="w-5 h-5 text-cyan-500" /> },
    { id: 'pediatria', label: 'Pediatría', status: product.apto_pediatria, icon: <Baby className="w-5 h-5 text-purple-500" /> },
    { id: 'diabeticos', label: 'Diabéticos', status: product.apto_diabeticos, icon: <Activity className="w-5 h-5 text-emerald-500" /> },
    { id: 'hipertensos', label: 'Hipertensos', status: product.apto_hipertensos, icon: <ShieldIcon className="w-5 h-5 text-blue-500" /> },
    { id: 'celiacos', label: 'Celíacos', status: product.apto_celiacos, icon: <Wheat className="w-5 h-5 text-amber-500" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" /> Perfil de Aptitud por Colectivos
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">Evaluaciones de seguridad farmacológica para poblaciones especiales y pacientes crónicos.</p>
        </div>
        <div className="flex items-center gap-2.5 text-[9px] uppercase tracking-wider font-extrabold opacity-95 bg-card px-3 py-1.5 rounded-xl border border-border/80 text-muted-foreground">
          <div className="flex items-center gap-1.5 text-emerald-700">
            <div className="w-2 h-2 rounded-full bg-emerald-500" /> Apto
          </div>
          <div className="flex items-center gap-1.5 text-amber-600">
            <div className="w-2 h-2 rounded-full bg-amber-500" /> Precaución
          </div>
          <div className="flex items-center gap-1.5 text-red-600 border-l pl-2 border-border/80">
            <div className="w-2 h-2 rounded-full bg-red-500" /> Contraindicación
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {safetyItems.map((item) => {
          const config = getSafetyConfig(item.status);
          return (
            <div 
              key={item.id} 
              className={`flex flex-col p-6 rounded-3xl border transition-all duration-300 shadow-sm ${config.color}`}
            >
              <div className="flex items-center gap-3.5 mb-3">
                <div className="p-2.5 rounded-2xl bg-card shadow-sm border border-border/20">
                  {item.icon}
                </div>
                <div>
                  <h4 className="text-sm font-black text-foreground">{item.label}</h4>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{config.label}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                {config.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

