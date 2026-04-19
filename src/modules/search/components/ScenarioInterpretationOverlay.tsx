import React from 'react';
import { 
  Zap, 
  AlertTriangle, 
  Microscope, 
  Tags, 
  ChevronRight, 
  BrainCircuit,
  ShieldCheck,
  Stethoscope
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ScenarioInterpretationOverlayProps {
  interpretation: {
    isScenario: boolean;
    symptoms: string[];
    risks: string[];
    logic: string;
    suggestedFilters: { avoid: string[]; prefer: string[] };
  };
  onApplyFilters: (filters: { avoid: string[]; prefer: string[] }) => void;
  onClose: () => void;
}

export const ScenarioInterpretationOverlay: React.FC<ScenarioInterpretationOverlayProps> = ({ 
  interpretation, 
  onApplyFilters,
  onClose 
}) => {
  if (!interpretation || !interpretation.isScenario) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      className="w-full mb-8 relative group"
    >
      {/* Glow Effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary/20 via-orange-500/10 to-brand-primary/20 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse" />
      
      <div className="relative bg-brand-surface border border-brand-primary/20 rounded-2xl overflow-hidden shadow-2xl">
        {/* Hardware Header */}
        <div className="bg-slate-900/80 px-4 py-2 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-3.5 h-3.5 text-brand-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
              Análisis de Escenario Clínico (IA Local)
            </span>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-tighter">Motor Activo</span>
             </div>
             <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
               <ChevronRight className="w-3.5 h-3.5" />
             </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Logic & Symptoms (Left) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-400">
                  <Microscope className="w-4 h-4" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-brand-primary">Lógica de Razonamiento</span>
                </div>
                <p className="text-sm text-slate-200 font-mono leading-relaxed bg-black/40 p-4 rounded-xl border border-white/5">
                  {interpretation.logic}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Hallazgos Clave</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {interpretation.symptoms.map(s => (
                      <span key={s} className="px-2 py-1 rounded-md bg-slate-800/50 border border-slate-700/50 text-[10px] text-slate-300 font-medium capitalize">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-orange-500/80">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">Riesgos / Factores</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {interpretation.risks.map(r => (
                      <span key={r} className="px-2 py-1 rounded-md bg-orange-500/10 border border-orange-500/20 text-[10px] text-orange-300 font-medium capitalize">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Filters (Right) */}
            <div className="flex flex-col h-full bg-slate-900/40 p-5 rounded-[1.25rem] border border-white/5 border-dashed">
              <div className="flex items-center gap-2 mb-6">
                <Zap className="w-4 h-4 text-brand-primary" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Guardia Clínica</span>
              </div>

              <div className="flex-1 space-y-5">
                {interpretation.suggestedFilters.avoid.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Restricciones Sugeridas</span>
                    <div className="space-y-1.5">
                      {interpretation.suggestedFilters.avoid.map(f => (
                        <div key={f} className="flex items-center gap-2 text-xs text-slate-400 group/item">
                          <AlertTriangle className="w-3 h-3 text-orange-500" />
                          <span className="line-through decoration-orange-500/50 italic opacity-80">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {interpretation.suggestedFilters.prefer.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Enfoques Recomendados</span>
                    <div className="space-y-1.5">
                      {interpretation.suggestedFilters.prefer.map(f => (
                        <div key={f} className="flex items-center gap-2 text-xs text-brand-primary">
                          <ShieldCheck className="w-3 h-3" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={() => onApplyFilters(interpretation.suggestedFilters)}
                className="mt-8 w-full py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20 active:scale-[0.98]"
              >
                Aplicar Guardia Clínica
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
