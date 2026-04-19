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
  emerald: 'text-emerald-500/90',
  orange: 'text-orange-500/90',
  cyan: 'text-cyan-500/90',
  pink: 'text-pink-500/90',
  violet: 'text-violet-500/90',
  rose: 'text-rose-500/90'
};

const dotColorMap: Record<string, string> = {
  emerald: 'bg-emerald-500',
  orange: 'bg-orange-500',
  cyan: 'bg-cyan-500',
  pink: 'bg-pink-500',
  violet: 'bg-violet-500',
  rose: 'bg-rose-500'
};

interface QuickDiscoveryTagsProps {
  onSelect: (query: string) => void;
}

export const QuickDiscoveryTags: React.FC<QuickDiscoveryTagsProps> = ({ onSelect }) => {
  return (
    <div className="w-full mt-16 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      
      {/* Header Estilo Hardware */}
      <div className="flex items-center gap-4 px-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
        <div className="flex items-center gap-2">
           <Zap className="w-3.5 h-3.5 text-brand-primary animate-pulse" />
           <span className="text-[11px] uppercase tracking-[0.4em] font-black text-slate-400">
             Descubrimiento Inteligente
           </span>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-12 gap-x-8 text-left">
        {CATEGORIES.map((category) => (
          <div key={category.title} className="flex flex-col">
            <div className="flex items-center gap-3 mb-6 px-1">
              <div className={`p-2 rounded-xl border transition-all duration-300 ${colorMap[category.color] || 'bg-slate-900 border-slate-800'}`}>
                <category.icon className="w-4 h-4" />
              </div>
              <h3 className={`text-sm font-black uppercase tracking-wider ${textColorMap[category.color] || 'text-slate-400'}`}>
                {category.title}
              </h3>
            </div>

            <div className="flex flex-wrap gap-3">
              {category.tags.map((tag, idx) => (
                <motion.button
                  key={tag.label}
                  onClick={() => onSelect(tag.query)}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 + 0.5 }}
                  whileHover={{ 
                    scale: 1.05, 
                    y: -2,
                    boxShadow: "0 10px 20px -5px rgba(0,0,0,0.3)"
                  }}
                  whileTap={{ 
                    scale: 0.92,
                    y: 1,
                    transition: { type: "spring", stiffness: 400, damping: 10 }
                  }}
                  className="relative px-5 py-3 rounded-full bg-slate-900 border border-slate-800/80 text-[13px] font-bold text-slate-300 hover:text-white hover:border-slate-500 transition-colors flex items-center gap-3 group/tag overflow-hidden"
                >
                  {/* Glass Glint Effect to make it look like a physical capsule */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                  
                  {/* Interaction Indicator Pill-core */}
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 border border-black/20 shadow-inner group-hover/tag:scale-125 transition-transform duration-300 ${dotColorMap[category.color] || 'bg-slate-700'}`} />
                  
                  <span className="relative z-10">{tag.label}</span>
                  
                  {/* Subtle shine animation on hover */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full"
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.6 }}
                  />
                </motion.button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer / Shortcut Hint */}
      <div className="flex justify-center pt-8">
        <div className="px-6 py-2 rounded-full bg-brand-primary/5 border border-brand-primary/10 flex items-center gap-3">
          <Microscope className="w-3.5 h-3.5 text-brand-primary" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
            Utiliza <span className="text-white px-1.5 py-0.5 bg-slate-800 rounded mx-1">CMD+K</span> para búsqueda rápida de SKUs
          </span>
        </div>
      </div>
    </div>
  );
};
