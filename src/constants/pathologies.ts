export const PATHOLOGY_CATEGORIES = [
  {
    id: "respiratorio",
    title: "Respiratorio y ORL",
    icon: "Wind",
    color: "text-sky-400",
    bgColor: "bg-sky-500/10",
    borderColor: "border-sky-500/20",
    tags: [
      "Gripe", "Tos", "Asma", "Bronquitis", "Laringitis", "Sinusitis", "Otitis", 
      "Rinitis Alérgica", "Faringitis", "Amigdalitis", "Congestión Nasal", 
      "Mucosidad", "Ronquera", "Resfriado Común", "Neumonía", "EPOC"
    ]
  },
  {
    id: "nervioso",
    title: "Nervioso y Mental",
    icon: "Brain",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    tags: [
      "Ansiedad", "Insomnio", "Estrés", "Fatiga", "Depresión", "Memoria", 
      "Mareos", "Vértigo", "Agotamiento intelectual", "TDAH", "Neuralgia", 
      "Tics Nerviosos", "Irritabilidad", "Pánico", "Deterioro Cognitivo", "Cefalea Tensional"
    ]
  },
  {
    id: "dolor",
    title: "Dolor y Articular",
    icon: "Activity",
    color: "text-rose-400",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/20",
    tags: [
      "Dolor de cabeza", "Migraña", "Artritis", "Artrosis", "Dolor muscular", 
      "Dolor articular", "Fibromialgia", "Gota", "Lumbago", "Osteoporosis", 
      "Hematomas y Contusiones", "Contracturas", "Ciática", "Tendinitis", 
      "Esguinces", "Dolor Neuropático", "Neuralgia del Trigémino", "Dolor Postoperatorio"
    ]
  },
  {
    id: "digestivo",
    title: "Digestivo y Metabólico",
    icon: "Apple",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    tags: [
      "Diabetes", "Colesterol", "Gastritis", "Estreñimiento", "Diarrea", 
      "Sobrepeso", "Reflujo", "Colon irritable", "Resistencia a la insulina", 
      "Gases y Meteorismo", "Hígado graso", "Aftas y Estomatitis", "Náuseas", 
      "Vómitos", "Dispepsia", "Hemorroides", "Parásitos Intestinales", 
      "Intolerancia a la Lactosa", "Celiaquía", "Úlcera Gástrica"
    ]
  },
  {
    id: "cardiovascular",
    title: "Cardiovascular",
    icon: "Heart",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    tags: [
      "Hipertensión", "Várices", "Anemia", "Pesadez de piernas", 
      "Insuficiencia Venosa", "Palpitaciones", "Mala Circulación", 
      "Triglicéridos Altos", "Hipotensión", "Prevención Cardiovascular", 
      "Edema Maleolar", "Fragilidad Capilar"
    ]
  },
  {
    id: "dermatologico",
    title: "Dermatológico e Inmune",
    icon: "Sparkles",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    tags: [
      "Caída de cabello", "Acné", "Alergias", "Dermatitis", "Hongos", 
      "Eczema", "Herpes", "Psoriasis", "Rosácea", "Picaduras de insectos", 
      "Quemaduras", "Cicatrización", "Urticaria", "Vitíligo", "Caspa", 
      "Piel Seca", "Hiperhidrosis", "Verrugas", "Inmunodeficiencia"
    ]
  },
  {
    id: "urologico",
    title: "Urológico y Salud Femenina",
    icon: "Droplets",
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/20",
    tags: [
      "Infección urinaria", "Menopausia", "Cistitis", "Cálculos renales", 
      "Disfunción eréctil", "Menstruación dolorosa", "Vaginitis", "Candidiasis", 
      "Prostatitis", "Incontinencia Urinaria", "Síndrome Premenstrual", 
      "Sequedad Vaginal", "Endometriosis", "SOP", "Libido Baja"
    ]
  },
  {
    id: "oftalmologico",
    title: "Oftalmológico y Otros",
    icon: "Eye",
    color: "text-teal-400",
    bgColor: "bg-teal-500/10",
    borderColor: "border-teal-500/20",
    tags: [
      "Ojo Seco", "Conjuntivitis", "Fatiga Ocular", "Glaucoma", "Blefaritis", 
      "Orzuelo", "Irritación Ocular", "Deficiencia de Vitaminas", "Desnutrición", 
      "Suplementación Deportiva", "Antienvejecimiento"
    ]
  }
];

// Generamos el array plano a partir de las categorías para mantener la compatibilidad con el resto del sistema
export const COMMON_PATHOLOGIES = PATHOLOGY_CATEGORIES.flatMap(category => category.tags);
