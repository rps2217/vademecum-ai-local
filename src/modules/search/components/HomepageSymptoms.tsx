import React from 'react';
import { motion } from 'motion/react';
import { 
  Wind, 
  Brain, 
  Activity, 
  Heart,
  Apple,
  Sparkles,
  Droplets,
  Eye,
  Leaf,
  Shield,
  Search,
  ArrowRight
} from 'lucide-react';

interface SymptomCategory {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  symptoms: string[];
}

const SYMPTOM_CATEGORIES: SymptomCategory[] = [
  {
    id: 'respiratorio',
    title: 'Respiratorio',
    subtitle: 'Gripe, tos, alergias',
    icon: Wind,
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200 hover:border-sky-400',
    symptoms: ['Resfriado', 'Tos seca', 'Congestión nasal', 'Dolor de garganta', 'Gripe']
  },
  {
    id: 'nervioso',
    title: 'Sistema Nervioso',
    subtitle: 'Estrés, ansiedad, sueño',
    icon: Brain,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200 hover:border-violet-400',
    symptoms: ['Ansiedad', 'Insomnio', 'Estrés', 'Fatiga mental', 'Dolor de cabeza']
  },
  {
    id: 'dolor',
    title: 'Dolor y Articulaciones',
    subtitle: 'Antiinflamatorio, alivio',
    icon: Activity,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200 hover:border-rose-400',
    symptoms: ['Dolor muscular', 'Artritis', 'Migraña', 'Inflamación', 'Dolor articular']
  },
  {
    id: 'digestivo',
    title: 'Digestivo',
    subtitle: 'Estómago, intestino, hígado',
    icon: Apple,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200 hover:border-emerald-400',
    symptoms: ['Gastritis', 'Estreñimiento', 'Colon irritable', 'Hígado', 'Digestión']
  },
  {
    id: 'cardiovascular',
    title: 'Corazón y Circulación',
    subtitle: 'Presión, venas, sangre',
    icon: Heart,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200 hover:border-red-400',
    symptoms: ['Hipertensión', 'Colesterol', 'Várices', 'Anemia', 'Circulación']
  },
  {
    id: 'dermatologico',
    title: 'Piel y Dermocosmética',
    subtitle: 'Hongos, eczema, cicatrización',
    icon: Sparkles,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200 hover:border-amber-400',
    symptoms: ['Acné', 'Dermatitis', 'Cicatrización', 'Caída cabello', 'Hongos']
  },
  {
    id: 'urinario',
    title: 'Urinario y Femenino',
    subtitle: 'Infección, menopausia',
    icon: Droplets,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200 hover:border-teal-400',
    symptoms: ['Infección urinaria', 'Cistitis', 'Menopausia', 'Candidiasis', 'Menstruación']
  },
  {
    id: 'vision',
    title: 'Vista y Óptica',
    subtitle: 'Ojos, visión, fatiga ocular',
    icon: Eye,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200 hover:border-cyan-400',
    symptoms: ['Ojo seco', 'Fatiga visual', 'Conjuntivitis', 'Blefaritis', 'Vitaminas']
  }
];

const POPULAR_SEARCHES = [
  { label: 'Vitamina D3', query: 'Vitamina D3' },
  { label: 'Magnesio', query: 'Magnesio' },
  { label: 'Omega 3', query: 'Omega 3' },
  { label: 'Probióticos', query: 'Probióticos' },
  { label: 'Colágeno', query: 'Colágeno' },
  { label: 'Zinc', query: 'Zinc' },
  { label: 'Ashwagandha', query: 'Ashwagandha' },
  { label: 'Valeriana', query: 'Valeriana' },
];

interface HomepageSymptomsProps {
  onSelectSymptom: (symptom: string) => void;
  onSelectCategory: (category: string) => void;
}

export const HomepageSymptoms: React.FC<HomepageSymptomsProps> = ({
  onSelectSymptom,
  onSelectCategory
}) => {
  return (
    <div className="w-full space-y-10">
      
      {/* Header de Bienvenida */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
          <Leaf className="w-3.5 h-3.5" />
          <span>Vademécum de Suplementos y Fitoterapia</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
          ¿Qué estás buscando?
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Encuentra rápidamente suplementos, fitomedicamentos y soluciones naturales para tu salud
        </p>
      </div>

      {/* Búsqueda Rápida */}
      <div className="flex flex-wrap justify-center gap-2">
        {POPULAR_SEARCHES.map((search) => (
          <button
            key={search.query}
            onClick={() => onSelectSymptom(search.query)}
            className="px-4 py-2 rounded-full bg-white border border-border text-sm font-medium text-foreground hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 transition-all flex items-center gap-2 shadow-sm"
          >
            <Search className="w-3.5 h-3.5 text-emerald-500" />
            {search.label}
          </button>
        ))}
      </div>

      {/* Categorías de Síntomas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {SYMPTOM_CATEGORIES.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <button
              onClick={() => onSelectCategory(category.id)}
              className={`w-full text-left p-5 rounded-2xl ${category.bgColor} border-2 ${category.borderColor} transition-all hover:shadow-lg hover:-translate-y-1 group`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl bg-white shadow-sm ${category.color}`}>
                  <category.icon className="w-6 h-6" />
                </div>
                <ArrowRight className={`w-5 h-5 ${category.color} opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-0 group-hover:translate-x-1`} />
              </div>
              <h3 className={`font-bold text-base ${category.color} mb-1`}>
                {category.title}
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                {category.subtitle}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {category.symptoms.slice(0, 3).map((symptom) => (
                  <span
                    key={symptom}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSymptom(symptom);
                    }}
                    className="px-2 py-0.5 rounded-md bg-white/70 text-xs font-medium text-foreground/80 hover:bg-white hover:text-foreground transition-colors cursor-pointer"
                  >
                    {symptom}
                  </span>
                ))}
              </div>
            </button>
          </motion.div>
        ))}
      </div>

      {/* Info de Seguridad */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-xl p-4">
        <Shield className="w-4 h-4" />
        <span>Información orientativa. Consulta siempre con un profesional de la salud.</span>
      </div>
    </div>
  );
};
