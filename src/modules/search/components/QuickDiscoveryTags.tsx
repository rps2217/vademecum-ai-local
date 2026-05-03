import React from 'react';
import { motion } from 'motion/react';
import { 
  Dna, 
  Activity, 
  Stethoscope, 
  Leaf, 
  Baby, 
  Heart, 
  Brain, 
  Zap, 
  ShieldCheck,
  Thermometer,
  Microscope,
  CalendarCheck
} from 'lucide-react';

interface TagCategory {
  title: string;
  icon: React.ElementType;
  tags: { label: string; query: string }[];
  color: string;
}

const CATEGORIES: TagCategory[] = [
  {
    title: 'Patologías Crónicas',
    icon: Stethoscope,
    color: 'emerald',
    tags: [
      { label: 'Diabetes', query: 'Diabetes' },
      { label: 'Hipertensión', query: 'Hipertensión' },
      { label: 'Hipotiroidismo', query: 'Tiroides' },
      { label: 'Asma / EPOC', query: 'Asma' },
      { label: 'Colesterol', query: 'Colesterol' },
      { label: 'Ácido Úrico', query: 'Gota' }
    ]
  },
  {
    title: 'Alivio & Recuperación',
    icon: Activity,
    color: 'orange',
    tags: [
      { label: 'Dolor Muscular', query: 'Dolor' },
      { label: 'Inflamación', query: 'Antiinflamatorio' },
      { label: 'Fiebre', query: 'Antipirético' },
      { label: 'Alergias', query: 'Antihistamínico' },
      { label: 'Tos & Gripe', query: 'Antigripal' },
      { label: 'Cicatrización', query: 'Cicatrizante' }
    ]
  },
  {
    title: 'Nutrición & Suplementos',
    icon: Leaf,
    color: 'cyan',
    tags: [
      { label: 'Magnesio', query: 'Magnesio' },
      { label: 'Omega 3', query: 'Omega' },
      { label: 'Vitamina D3', query: 'Vitamina D' },
      { label: 'Probióticos', query: 'Probiótico' },
      { label: 'Zinc', query: 'Zinc' },
      { label: 'Colágeno', query: 'Colágeno' },
      { label: 'Biotina', query: 'Biotina' }
    ]
  },
  {
    title: 'Etapas de Vida / Ciclos',
    icon: Baby,
    color: 'pink',
    tags: [
      { label: 'Pediatría', query: 'Pediatría' },
      { label: 'Embarazo Safe', query: 'Embarazo' },
      { label: 'Adulto Mayor', query: 'Geriatría' },
      { label: 'Salud Femenina', query: 'Menopausia' },
      { label: 'Salud Masculina', query: 'Próstata' },
      { label: 'Fertilidad', query: 'Fertilidad' }
    ]
  },
  {
    title: 'Salud Mental & Sueño',
    icon: Brain,
    color: 'violet',
    tags: [
      { label: 'Ansiedad', query: 'Ansiedad' },
      { label: 'Insomnio', query: 'Sueño' },
      { label: 'Estrés', query: 'Estrés' },
      { label: 'Memoria', query: 'Nootrópico' },
      { label: 'Concentración', query: 'Enfoque' },
      { label: 'Estado de Ánimo', query: 'Ánimo' }
    ]
  },
  {
    title: 'Digestivo & Metabólico',
    icon: Heart,
    color: 'rose',
    tags: [
      { label: 'Reflujo / Gastritis', query: 'Gastritis' },
      { label: 'Estreñimiento', query: 'Laxante' },
      { label: 'Salud Hepática', query: 'Hígado' },
      { label: 'Retención Líquidos', query: 'Diurético' },
      { label: 'Control Peso', query: 'Metabolismo' },
      { label: 'Digestión Pesada', query: 'Enzimas' }
    ]
  }
];

const colorMap: Record<string, string> = {
  emerald: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
  orange: 'text-orange-400 border-orange-500/20 bg-orange-500/5',
  cyan: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5',
  pink: 'text-pink-400 border-pink-500/20 bg-pink-500/5',
  violet: 'text-violet-400 border-violet-500/20 bg-violet-500/5',
  rose: 'text-rose-400 border-rose-500/20 bg-rose-500/5'
};

const textColorMap: Record<string, string> = {
  emerald: 'text-emerald-400',
  orange: 'text-orange-500',
  cyan: 'text-cyan-400',
  pink: 'text-pink-500',
  violet: 'text-violet-500',
  rose: 'text-rose-500'
};

const dotColorMap: Record<string, string> = {
  emerald: 'bg-emerald-400',
  orange: 'bg-orange-500',
  cyan: 'bg-cyan-400',
  pink: 'bg-pink-500',
  violet: 'bg-violet-500',
  rose: 'bg-rose-500'
};

interface QuickDiscoveryTagsProps {
  onSelect: (query: string) => void;
}

export const QuickDiscoveryTags: React.FC<QuickDiscoveryTagsProps> = ({ onSelect }) => {
  return (
    <div className="w-full mt-10 space-y-10 animate-in fade-in duration-500">
      
      {/* Section Header */}
      <div className="flex items-center gap-4 px-2">
        <div className="flex items-center gap-2">
           <Activity className="w-4 h-4 text-brand-primary" />
           <span className="text-[10px] uppercase tracking-[0.3em] font-black text-slate-500">
             Acceso Directo
           </span>
        </div>
        <div className="h-px flex-1 bg-slate-800/50" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-12">
        {CATEGORIES.map((category) => (
          <div key={category.title} className="flex flex-col">
            <div className="flex items-center gap-3 mb-6 px-1">
              <category.icon className={`w-4 h-4 ${textColorMap[category.color]}`} />
              <h3 className={`text-[12px] font-black uppercase tracking-[0.2em] ${textColorMap[category.color]}`}>
                {category.title}
              </h3>
            </div>

            <div className="flex flex-wrap gap-4">
              {category.tags.map((tag, idx) => {
                // Sizing based on "frequency/importance" simulation: first ones are bigger
                const sizeTier = idx === 0 ? 'large' : (idx < 3 ? 'medium' : 'normal');
                
                return (
                  <button
                    key={tag.label}
                    onClick={() => onSelect(tag.query)}
                    className={`rounded-2xl bg-[#0a0f1a] border border-slate-800/80 transition-all flex items-center gap-3 active:scale-95 hover:shadow-2xl hover:-translate-y-0.5 hover:border-slate-700 ${
                      sizeTier === 'large' 
                        ? 'px-6 py-4 text-sm font-black text-white bg-slate-900/60' 
                        : sizeTier === 'medium'
                        ? 'px-5 py-3 text-[13px] font-bold text-slate-200'
                        : 'px-4 py-2 text-xs font-bold text-slate-400'
                    }`}
                  >
                    <div className={`rounded-full ${dotColorMap[category.color]} shadow-lg ${
                      sizeTier === 'large' ? 'w-2.5 h-2.5 shadow-current/20' : 
                      sizeTier === 'medium' ? 'w-2 h-2' : 
                      'w-1.5 h-1.5'
                    }`} />
                    <span>{tag.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer / Shortcut Hint */}
      <div className="flex justify-center pt-8">
        <div className="px-6 py-2 rounded-full bg-slate-900 border border-slate-800 flex items-center gap-3">
          <Microscope className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
            Utiliza <span className="text-white px-1.5 py-0.5 bg-slate-800 rounded mx-1">CMD+K</span> para búsqueda rápida
          </span>
        </div>
      </div>
    </div>
  );
};
