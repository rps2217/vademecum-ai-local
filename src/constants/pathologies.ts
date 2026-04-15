export const PATHOLOGY_CATEGORIES = [
  {
    id: "respiratorio",
    title: "Respiratorio y ORL",
    icon: "Wind",
    color: "text-sky-400",
    bgColor: "bg-sky-500/10",
    borderColor: "border-sky-500/20",
    tags: ["Gripe", "Tos", "Asma", "Bronquitis", "Laringitis", "Sinusitis", "Otitis"]
  },
  {
    id: "nervioso",
    title: "Nervioso y Mental",
    icon: "Brain",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    tags: ["Ansiedad", "Insomnio", "Estrés", "Fatiga", "Depresión", "Memoria", "Mareos", "Vértigo", "Agotamiento intelectual"]
  },
  {
    id: "dolor",
    title: "Dolor y Articular",
    icon: "Activity",
    color: "text-rose-400",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/20",
    tags: ["Dolor de cabeza", "Migraña", "Artritis", "Artrosis", "Dolor muscular", "Dolor articular", "Fibromialgia", "Gota", "Lumbago", "Osteoporosis", "Hematomas y Contusiones"]
  },
  {
    id: "digestivo",
    title: "Digestivo y Metabólico",
    icon: "Apple",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    tags: ["Diabetes", "Colesterol", "Gastritis", "Estreñimiento", "Diarrea", "Sobrepeso", "Reflujo", "Colon irritable", "Resistencia a la insulina", "Gases y Meteorismo", "Hígado graso", "Aftas y Estomatitis"]
  },
  {
    id: "cardiovascular",
    title: "Cardiovascular",
    icon: "Heart",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    tags: ["Hipertensión", "Várices", "Hemorroides", "Anemia", "Pesadez de piernas"]
  },
  {
    id: "dermatologico",
    title: "Dermatológico e Inmune",
    icon: "Sparkles",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    tags: ["Caída de cabello", "Acné", "Alergias", "Dermatitis", "Hongos", "Eczema", "Herpes", "Psoriasis", "Rosácea", "Picaduras de insectos"]
  },
  {
    id: "urologico",
    title: "Urológico y Salud Femenina",
    icon: "Droplets",
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/20",
    tags: ["Infección urinaria", "Menopausia", "Cistitis", "Cálculos renales", "Disfunción eréctil", "Menstruación dolorosa"]
  }
];

// Generamos el array plano a partir de las categorías para mantener la compatibilidad con el resto del sistema
export const COMMON_PATHOLOGIES = PATHOLOGY_CATEGORIES.flatMap(category => category.tags);
