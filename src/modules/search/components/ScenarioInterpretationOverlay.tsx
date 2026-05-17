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
      
      <div className="relative bg-card border border-border/50 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.1)]">
        {/* Hardware Header */}
        <div className="bg-card px-4 py-3 flex items-center justify-between border-b border-border/50">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
              Análisis de Escenario Clínico (IA Local)
            </span>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-tighter">Motor Activo</span>
             </div>
             <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
               <ChevronRight className="w-3.5 h-3.5" />
             </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Logic & Symptoms (Left) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Microscope className="w-4 h-4" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-primary">Lógica de Razonamiento</span>
                </div>
                <p className="text-sm text-foreground font-mono leading-relaxed bg-black/40 p-4 rounded-xl border border-border/50">
                  {interpretation.logic}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Hallazgos Clave</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {interpretation.symptoms.map(s => (
                      <span key={s} className="px-2 py-1 rounded-md bg-card border border-border text-[10px] text-muted-foreground font-medium capitalize">
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
            <div className="flex flex-col h-full bg-card p-5 rounded-[1.25rem] border border-border/50 border-dashed">
              <div className="flex items-center gap-2 mb-6">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">Guardia Clínica</span>
              </div>

              <div className="flex-1 space-y-5">
                {interpretation.suggestedFilters.avoid.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Restricciones Sugeridas</span>
                    <div className="space-y-1.5">
                      {interpretation.suggestedFilters.avoid.map(f => (
                        <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground group/item">
                          <AlertTriangle className="w-3 h-3 text-orange-500" />
                          <span className="line-through decoration-orange-500/50 italic opacity-80">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {interpretation.suggestedFilters.prefer.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Enfoques Recomendados</span>
                    <div className="space-y-1.5">
                      {interpretation.suggestedFilters.prefer.map(f => (
                        <div key={f} className="flex items-center gap-2 text-xs text-primary">
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
                className="mt-8 w-full py-2.5 rounded-xl bg-primary hover:bg-primary text-foreground text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20 active:scale-[0.98]"
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
