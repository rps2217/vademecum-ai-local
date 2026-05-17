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
    <div className="w-full mt-10 space-y-10 animate-in fade-in duration-500">
      
      {/* Section Header */}
      <div className="flex items-center gap-4 px-2">
        <div className="flex items-center gap-2">
           <Activity className="w-5 h-5 text-primary" />
           <span className="text-xs uppercase tracking-[0.2em] font-black text-muted-foreground">
             Acceso Directo
           </span>
        </div>
        <div className="h-px flex-1 bg-border/50" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
        {CATEGORIES.map((category) => (
          <div key={category.title} className="flex flex-col bg-card/50 p-6 rounded-3xl border border-border/50 hover:bg-card hover:border-border transition-colors">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-xl ${colorMap[category.color]}`}>
                  <category.icon className={`w-5 h-5 ${textColorMap[category.color]}`} />
              </div>
              <h3 className={`text-sm font-black uppercase tracking-widest ${textColorMap[category.color]}`}>
                {category.title}
              </h3>
            </div>

            <div className="flex flex-wrap gap-3">
              {category.tags.map((tag, idx) => {
                // Better visual hierarchy inside the card
                const sizeTier = idx === 0 ? 'large' : 'normal';
                
                return (
                  <button
                    key={tag.label}
                    onClick={() => onSelect(tag.query)}
                    className={`rounded-2xl border transition-all flex items-center gap-2 active:scale-95 hover:-translate-y-0.5 ${
                      sizeTier === 'large' 
                        ? 'px-4 py-2.5 text-sm font-bold text-foreground bg-background border-border shadow-sm ring-1 ring-black/5 dark:ring-white/5' 
                        : 'px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-transparent border-transparent hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {sizeTier === 'large' && (
                        <div className={`rounded-full ${dotColorMap[category.color]} w-2 h-2 shadow-sm`} />
                    )}
                    <span>{tag.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
