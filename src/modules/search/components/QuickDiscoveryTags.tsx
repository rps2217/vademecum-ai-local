import React from 'react';
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
  icon: React.ElementType; // Cambiar a ElementType para poder renderizarlo como componente
  tags: { label: string; query: string }[];
  color: string;
}

const CATEGORIES: TagCategory[] = [
  {
    title: 'Patologías Comunes',
    icon: Stethoscope,
    color: 'emerald',
    tags: [
      { label: 'Diabetes', query: 'Diabetes' },
      { label: 'Hipertensión', query: 'Hipertensión' },
      { label: 'Hipotiroidismo', query: 'Hipotiroidismo' },
      { label: 'Ansiedad', query: 'Ansiedad' },
      { label: 'Dislipidemia', query: 'Colesterol' }
    ]
  },
  {
    title: 'Síntomas & Malestares',
    icon: Activity,
    color: 'orange',
    tags: [
      { label: 'Dolor Muscular', query: 'Dolor' },
      { label: 'Inflamación', query: 'Inflamación' },
      { label: 'Insomnio', query: 'Sueño' },
      { label: 'Reflujo', query: 'Digestivo' },
      { label: 'Estrés', query: 'Estrés' }
    ]
  },
  {
    title: 'Suplementos / Nutraceuticos',
    icon: Leaf,
    color: 'cyan',
    tags: [
      { label: 'Magnesio', query: 'Magnesio' },
      { label: 'Omega 3', query: 'Omega' },
      { label: 'Vitamina D3', query: 'Vitamina D' },
      { label: 'Probióticos', query: 'Probiótico' },
      { label: 'Zinc', query: 'Zinc' }
    ]
  },
  {
    title: 'Grupos Especiales',
    icon: Baby,
    color: 'pink',
    tags: [
      { label: 'Pediatría', query: 'Pediatría' },
      { label: 'Embarazo Safe', query: 'Embarazo' },
      { label: 'Adulto Mayor', query: 'Geriatría' },
      { label: 'Salud Ósea', query: 'Calcio' },
      { label: 'Inmunidad', query: 'Defensas' }
    ]
  }
];

interface QuickDiscoveryTagsProps {
  onSelect: (query: string) => void;
}

export const QuickDiscoveryTags: React.FC<QuickDiscoveryTagsProps> = ({ onSelect }) => {
  return (
    <div className="w-full mt-16 space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
      
      {/* Header Estilo Hardware */}
      <div className="flex items-center gap-4 px-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
        <div className="flex items-center gap-2">
           <Zap className="w-3.5 h-3.5 text-brand-primary animate-pulse" />
           <span className="text-[10px] uppercase tracking-[0.4em] font-black text-slate-500">
             Descubrimiento Inteligente
           </span>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
        {CATEGORIES.map((category) => (
          <div key={category.title} className="group">
            <div className="flex items-center gap-2 mb-4 px-1">
              <div className={`p-1.5 rounded-lg bg-slate-900 border border-slate-800 transition-colors`}>
                <category.icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-primary transition-colors" />
              </div>
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-slate-200 transition-colors">
                {category.title}
              </h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {category.tags.map((tag) => (
                <button
                  key={tag.label}
                  onClick={() => onSelect(tag.query)}
                  className="px-4 py-2 rounded-xl bg-slate-900/50 hover:bg-slate-800 border border-slate-800/80 text-[11px] font-medium text-slate-400 hover:text-white hover:border-slate-600 transition-all active:scale-95 flex items-center gap-2 group/tag"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover/tag:bg-brand-primary transition-colors" />
                  {tag.label}
                </button>
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
