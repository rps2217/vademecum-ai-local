/**
 * Glosario Médico - Términos técnicos con explicaciones simples
 * Categorizado por especialidad médica
 */

export interface MedicalTerm {
  term: string;        // Explicación simple
  category: string;    // Categoría médica
  synonyms?: string[]; // Sinónimos alternativos
}

export type MedicalGlossary = Record<string, MedicalTerm>;

// Glosario médico con términos comunes en productos farmacéuticos
export const MEDICAL_GLOSSARY: MedicalGlossary = {
  // ==================== GINECOLOGÍA ====================
  "leucorrea": {
    term: "flujo vaginal",
    category: "ginecología",
    synonyms: ["fluor vaginal", "flujo blanco"]
  },
  "menorragia": {
    term: "sangrado menstrual abundante",
    category: "ginecología",
    synonyms: ["hemorragia menstrual", "regla abundante"]
  },
  "dismenorrea": {
    term: "dolor menstrual",
    category: "ginecología",
    synonyms: ["cólicos menstruales", "dolor de regla"]
  },
  "amenorrea": {
    term: "ausencia de menstruación",
    category: "ginecología",
    synonyms: ["falta de regla", "sin menstruación"]
  },
  "metrorragia": {
    term: "sangrado uterino anormal",
    category: "ginecología",
    synonyms: ["sangrado fuera de ciclo"]
  },
  "vaginismo": {
    term: "contracción involuntaria de músculos vaginales",
    category: "ginecología",
    synonyms: ["espasmo vaginal"]
  },
  "vaginitis": {
    term: "inflamación o infección vaginal",
    category: "ginecología",
    synonyms: ["infección vaginal"]
  },
  "cervicitis": {
    term: "inflamación del cuello uterino",
    category: "ginecología",
    synonyms: ["infección cervical"]
  },
  "endometriosis": {
    term: "tejido similar al endometrial fuera del útero",
    category: "ginecología",
    synonyms: ["implantes endometriales"]
  },
  "síndrome premenstrual": {
    term: "síntomas físicos y emocionales antes de la regla",
    category: "ginecología",
    synonyms: ["SPM", "tensión premenstrual"]
  },
  "sofocos": {
    term: "sensación repentina de calor",
    category: "ginecología",
    synonyms: ["bochornos", "oleadas de calor"]
  },
  "atrofia vaginal": {
    term: "adelgazamiento y resequedad de paredes vaginales",
    category: "ginecología",
    synonyms: ["sequedad vaginal"]
  },
  "mastalgia": {
    term: "dolor en las mamas",
    category: "ginecología",
    synonyms: ["dolor mamario", "dolor de senos"]
  },

  // ==================== DIGESTIVO ====================
  "dispepsia": {
    term: "indigestión o molestia estomacal",
    category: "digestivo",
    synonyms: ["mala digestión", "empacho", "indigestión"]
  },
  "flatulencia": {
    term: "exceso de gases intestinales",
    category: "digestivo",
    synonyms: ["gases", "aerofagia", "hinchazón por gases"]
  },
  "esteatorrea": {
    term: "exceso de grasa en las heces",
    category: "digestivo",
    synonyms: ["heces grasosas"]
  },
  "diarrea": {
    term: "deposiciones líquidas frecuentes",
    category: "digestivo",
    synonyms: ["ccurso", "evacuación líquida"]
  },
  "estreñimiento": {
    term: "dificultad para defecar",
    category: "digestivo",
    synonyms: ["constipación", "estitiquez", "obstipación"]
  },
  "náuseas": {
    term: "ganas de vomitar",
    category: "digestivo",
    synonyms: ["mareo", "asco", "ganas de devolver"]
  },
  "vómitos": {
    term: "expulsión del contenido del estómago",
    category: "digestivo",
    synonyms: ["devolver", "emesis"]
  },
  "gastritis": {
    term: "inflamación del estómago",
    category: "digestivo",
    synonyms: ["irritación gástrica"]
  },
  "reflujo": {
    term: "subida de ácido del estómago al esófago",
    category: "digestivo",
    synonyms: ["acidez", "reflujo gastroesofágico", "agruras"]
  },
  "hemorragia digestiva": {
    term: "sangrado en el tracto digestivo",
    category: "digestivo",
    synonyms: ["sangrado gastrointestinal"]
  },
  "colitis": {
    term: "inflamación del colon",
    category: "digestivo",
    synonyms: ["inflamación del intestino grueso"]
  },
  "colon irritable": {
    term: "trastorno funcional del intestino",
    category: "digestivo",
    synonyms: ["síndrome de intestino irritable", "SII"]
  },
  "úlcera": {
    term: "herida abierta en estómago o duodeno",
    category: "digestivo",
    synonyms: ["llaga gástrica", "úlcera péptica"]
  },
  "aerofagia": {
    term: "tragar aire en exceso",
    category: "digestivo",
    synonyms: ["deglución de aire"]
  },
  "meteorismo": {
    term: "distensión abdominal por gases",
    category: "digestivo",
    synonyms: ["abdomen hinchado", "hinchazón abdominal"]
  },
  "borborigmos": {
    term: "ruidos intestinales",
    category: "digestivo",
    synonyms: ["ruidos de tripas", "gorgoteo intestinal"]
  },

  // ==================== CARDIOVASCULAR ====================
  "hipertensión": {
    term: "presión arterial alta",
    category: "cardiovascular",
    synonyms: ["presión alta", "hipertensión arterial"]
  },
  "hipotensión": {
    term: "presión arterial baja",
    category: "cardiovascular",
    synonyms: ["presión baja"]
  },
  "taquicardia": {
    term: "latidos del corazón rápidos",
    category: "cardiovascular",
    synonyms: ["corazón acelerado", "pulso rápido"]
  },
  "bradicardia": {
    term: "latidos del corazón lentos",
    category: "cardiovascular",
    synonyms: ["pulso lento", "corazón lento"]
  },
  "arritmia": {
    term: "ritmo cardíaco irregular",
    category: "cardiovascular",
    synonyms: ["irregularidad cardíaca"]
  },
  "insuficiencia cardíaca": {
    term: "corazón que no bombea bien la sangre",
    category: "cardiovascular",
    synonyms: ["corazón débil"]
  },
  "aterosclerosis": {
    term: "endurecimiento de las arterias",
    category: "cardiovascular",
    synonyms: ["arterias obstruidas", "placas en arterias"]
  },
  "trombosis": {
    term: "coágulo de sangre en vena o arteria",
    category: "cardiovascular",
    synonyms: ["coágulo", "émbolo"]
  },
  "edema": {
    term: "hinchazón por acumulación de líquido",
    category: "cardiovascular",
    synonyms: ["retención de líquidos", "líquido acumulado"]
  },
  "varices": {
    term: "venas dilatadas y retorcidas",
    category: "cardiovascular",
    synonyms: ["venas varicosas"]
  },
  "hemorroides": {
    term: "venas inflamadas en el recto",
    category: "cardiovascular",
    synonyms: ["almorranas"]
  },
  "isquemia": {
    term: "flujo sanguíneo reducido a un órgano",
    category: "cardiovascular",
    synonyms: ["falta de sangre en tejido"]
  },
  "palpitaciones": {
    term: "sensación de latidos fuertes o irregulares",
    category: "cardiovascular",
    synonyms: ["latidos perceptibles"]
  },

  // ==================== NEUROLÓGICO ====================
  "neuropatía": {
    term: "daño o enfermedad de los nervios",
    category: "neurológico",
    synonyms: ["daño nervioso", "enfermedad nerviosa"]
  },
  "parestesia": {
    term: "hormigueo o adormecimiento",
    category: "neurológico",
    synonyms: ["entumecimiento", "pinchazos", "cosquilleo"]
  },
  "cefalea": {
    term: "dolor de cabeza",
    category: "neurológico",
    synonyms: ["dolor cranial", "jaqueca"]
  },
  "migraña": {
    term: "dolor de cabeza intenso y recurrente",
    category: "neurológico",
    synonyms: ["jaqueca", "dolor hemicraneal"]
  },
  "vértigo": {
    term: "sensación de que todo gira",
    category: "neurológico",
    synonyms: ["mareo rotational", "vahído"]
  },
  "mareo": {
    term: "sensación de inestabilidad",
    category: "neurológico",
    synonyms: ["desvanecimiento", "vértigo", "vahído"]
  },
  "espasmo": {
    term: "contracción muscular involuntaria",
    category: "neurológico",
    synonyms: ["calambre", "twitch"]
  },
  "convulsión": {
    term: "movimientos incontrolables del cuerpo",
    category: "neurológico",
    synonyms: ["ataque", "crisis convulsiva"]
  },
  "epilepsia": {
    term: "trastorno que causa convulsiones repetidas",
    category: "neurológico",
    synonyms: ["ataques epilépticos"]
  },
  "insomnio": {
    term: "dificultad para dormir",
    category: "neurológico",
    synonyms: ["falta de sueño", "no poder dormir"]
  },
  "somnolencia": {
    term: "ganas excesivas de dormir",
    category: "neurológico",
    synonyms: ["sueño excesivo", "hipersomnia"]
  },
  "astenia": {
    term: "falta de energía o debilidad general",
    category: "neurológico",
    synonyms: ["fatiga", "cansancio", "debilidad"]
  },
  "adinamia": {
    term: "pérdida de fuerza o energía",
    category: "neurológico",
    synonyms: ["falta de fuerza"]
  },
  "tinnitus": {
    term: "zumbido en los oídos",
    category: "neurológico",
    synonyms: ["acúfenos", "pitidos en oídos"]
  },
  "hipocondría": {
    term: "ansiedad por la salud",
    category: "neurológico",
    synonyms: ["ansiedad por enfermedad"]
  },
  "dislexia": {
    term: "dificultad para leer",
    category: "neurológico",
    synonyms: ["dificultad lectora"]
  },

  // ==================== RESPIRATORIO ====================
  "disnea": {
    term: "dificultad para respirar",
    category: "respiratorio",
    synonyms: ["falta de aire", "ahogo"]
  },
  "tos": {
    term: "expulsión violenta de aire de los pulmones",
    category: "respiratorio",
    synonyms: ["toser"]
  },
  "tos ferina": {
    term: "infección bacterial con tos severa",
    category: "respiratorio",
    synonyms: ["tos convulsa"]
  },
  "broncoespasmo": {
    term: "estrechamiento de las vías respiratorias",
    category: "respiratorio",
    synonyms: ["espasmo bronquial"]
  },
  "asma": {
    term: "enfermedad con dificultad para respirar",
    category: "respiratorio",
    synonyms: ["sibilancias", "ataques de asma"]
  },
  "rinitis": {
    term: "inflamación de la mucosa nasal",
    category: "respiratorio",
    synonyms: ["nariz irritada", "congestión nasal"]
  },
  "sinusitis": {
    term: "infección de los senos paranasales",
    category: "respiratorio",
    synonyms: ["infección de senos"]
  },
  "faringitis": {
    term: "dolor o inflamación de garganta",
    category: "respiratorio",
    synonyms: ["dolor de garganta", "amigdalitis"]
  },
  "laringitis": {
    term: "inflamación de la laringe",
    category: "respiratorio",
    synonyms: ["voz ronca", "inflamación de garganta"]
  },
  "bronquitis": {
    term: "inflamación de los bronquios",
    category: "respiratorio",
    synonyms: ["tos con flema"]
  },
  "enfisema": {
    term: "daño en los alvéolos pulmonares",
    category: "respiratorio",
    synonyms: ["enfermedad pulmonar obstructiva"]
  },
  "apnea": {
    term: "pausas en la respiración",
    category: "respiratorio",
    synonyms: ["pausas respiratorias"]
  },
  "estornudos": {
    term: "expulsión brusca de aire por la nariz",
    category: "respiratorio",
    synonyms: ["estornudar"]
  },
  "flema": {
    term: "moco espeso en pulmones o garganta",
    category: "respiratorio",
    synonyms: ["moco", "secreción bronquial"]
  },
  "congestión": {
    term: "obstrucción nasal",
    category: "respiratorio",
    synonyms: ["nariz tapada", "congestión nasal"]
  },

  // ==================== DERMATOLÓGICO ====================
  "prurito": {
    term: "picazón",
    category: "dermatológico",
    synonyms: ["comezón", "escozor"]
  },
  "eritema": {
    term: "enrojecimiento de la piel",
    category: "dermatológico",
    synonyms: ["enrojecimiento", "rojez cutánea"]
  },
  "dermatitis": {
    term: "inflamación de la piel",
    category: "dermatológico",
    synonyms: ["eccema", "irritación cutánea"]
  },
  "psoriasis": {
    term: "enfermedad con placas escamosas en piel",
    category: "dermatológico",
    synonyms: ["lesiones escamosas"]
  },
  "eczema": {
    term: "inflamación con picazón y enrojecimiento",
    category: "dermatológico",
    synonyms: ["dermatitis atópica"]
  },
  "acné": {
    term: "granos y espinillas en la piel",
    category: "dermatológico",
    synonyms: ["barros", "espinillas"]
  },
  "urticaria": {
    term: " ronchas con picazón",
    category: "dermatológico",
    synonyms: ["habones", "alergia en piel"]
  },
  "herpes": {
    term: "ampollas grouped en labios o genitales",
    category: "dermatológico",
    synonyms: ["fuego", "herpes labial", "herpes genital"]
  },
  "tiña": {
    term: "infección fúngica de la piel",
    category: "dermatológico",
    synonyms: ["dermatofitosis", "hongos en piel"]
  },
  "celulitis": {
    term: "infección de la piel y tejido subcutáneo",
    category: "dermatológico",
    synonyms: ["infección cutánea"]
  },
  "herida": {
    term: "rotura en la piel",
    category: "dermatológico",
    synonyms: ["corte", "laceración", "lesión"]
  },
  "cicatriz": {
    term: "tejido que reemplaza la piel dañada",
    category: "dermatológico",
    synonyms: ["marcas"]
  },
  "quemadura": {
    term: "daño en la piel por calor",
    category: "dermatológico",
    synonyms: ["escaldadura", "lesión térmica"]
  },
  "vesícula": {
    term: "ampolla pequeña de líquido",
    category: "dermatológico",
    synonyms: ["ampolla", "flictena"]
  },
  "descamación": {
    term: "peladura de la piel",
    category: "dermatológico",
    synonyms: ["exfoliación", "piel que se pela"]
  },
  "hipopigmentación": {
    term: "zonas más claras en la piel",
    category: "dermatológico",
    synonyms: ["manchas claras", "vitíligo"]
  },
  "hiperpigmentación": {
    term: "zonas más oscuras en la piel",
    category: "dermatológico",
    synonyms: ["manchas oscuras", "pecas"]
  },
  "alopecia": {
    term: "caída del cabello",
    category: "dermatológico",
    synonyms: ["calvicie", "pérdida de pelo"]
  },
  "onicomicosis": {
    term: "infección fúngica de las uñas",
    category: "dermatológico",
    synonyms: ["hongos en uñas"]
  },
  "onicólisis": {
    term: "separación de la uña del lecho ungueal",
    category: "dermatológico",
    synonyms: ["uña despegada"]
  },
  "úlceras cutáneas": {
    term: "heridas abiertas en la piel",
    category: "dermatológico",
    synonyms: ["llagas cutáneas"]
  },

  // ==================== MUSCULOESQUELÉTICO ====================
  "artritis": {
    term: "inflamación de las articulaciones",
    category: "musculoesquelético",
    synonyms: ["dolor articular"]
  },
  "artrosis": {
    term: "desgaste del cartílago articular",
    category: "musculoesquelético",
    synonyms: ["osteoartritis", "degeneración articular"]
  },
  "osteoporosis": {
    term: "huesos frágiles y porosos",
    category: "musculoesquelético",
    synonyms: ["huesos débiles", "disminución de masa ósea"]
  },
  "mialgia": {
    term: "dolor muscular",
    category: "musculoesquelético",
    synonyms: ["dolor de músculos"]
  },
  "calambre": {
    term: "contracción muscular dolorosa",
    category: "musculoesquelético",
    synonyms: ["espasmo muscular", "rampą"]
  },
  "tendinitis": {
    term: "inflamación de un tendón",
    category: "musculoesquelético",
    synonyms: ["tendinitis", "inflamación tendinosa"]
  },
  "bursitis": {
    term: "inflamación de la bursa",
    category: "musculoesquelético",
    synonyms: ["inflamación de bolsa sinovial"]
  },
  "lumbalgia": {
    term: "dolor en la zona lumbar",
    category: "musculoesquelético",
    synonyms: ["dolor de espalda baja", "dolor de riñones"]
  },
  "ciática": {
    term: "dolor que recorre la pierna desde la espalda",
    category: "musculoesquelético",
    synonyms: ["dolor ciático", "irritación del nervio ciático"]
  },
  "fibromialgia": {
    term: "dolor generalizado en músculos y tejidos",
    category: "musculoesquelético",
    synonyms: ["dolor muscular crónico"]
  },
  "tortícolis": {
    term: "rigidez del cuello",
    category: "musculoesquelético",
    synonyms: ["cuello rígido", "cuello torcido"]
  },
  "esguince": {
    term: "lesión de ligamentos",
    category: "musculoesquelético",
    synonyms: ["torcedura"]
  },
  "luxación": {
    term: "desplazamiento de un hueso de su articulación",
    category: "musculoesquelético",
    synonyms: ["dislocación", "hueso fuera de lugar"]
  },
  "fractura": {
    term: "rotura de un hueso",
    category: "musculoesquelético",
    synonyms: ["hueso roto", "quebradura"]
  },
  "rigidez": {
    term: "dificultad para moverse",
    category: "musculoesquelético",
    synonyms: ["anquilosamiento", "falta de movilidad"]
  },
  "contractura": {
    term: "contracción muscular sostenida",
    category: "musculoesquelético",
    synonyms: ["nudo muscular"]
  },

  // ==================== METABÓLICO ====================
  "hiperglucemia": {
    term: "azúcar alta en sangre",
    category: "metabólico",
    synonyms: ["glucosa elevada", "azúcar en sangre alto"]
  },
  "hipoglucemia": {
    term: "azúcar baja en sangre",
    category: "metabólico",
    synonyms: ["glucosa baja", "azúcar bajo"]
  },
  "diabetes": {
    term: "enfermedad con exceso de azúcar en sangre",
    category: "metabólico",
    synonyms: ["diabetes mellitus", "azúcar en la sangre"]
  },
  "hiperlipidemia": {
    term: "colesterol o triglicéridos altos",
    category: "metabólico",
    synonyms: ["grasa en sangre alta"]
  },
  "hipercolesterolemia": {
    term: "colesterol alto en sangre",
    category: "metabólico",
    synonyms: ["colesterol elevado"]
  },
  "hipertrigliceridemia": {
    term: "triglicéridos altos en sangre",
    category: "metabólico",
    synonyms: ["triglicéridos elevados"]
  },
  "obesidad": {
    term: "exceso de grasa corporal",
    category: "metabólico",
    synonyms: ["sobrepeso severo", "grasa corporal excesiva"]
  },
  "sobrepeso": {
    term: "peso corporal superior al normal",
    category: "metabólico",
    synonyms: ["peso extra"]
  },
  "hipotiroidismo": {
    term: "glándula tiroides poco activa",
    category: "metabólico",
    synonyms: ["tiroides lenta", "función tiroidea baja"]
  },
  "hipertiroidismo": {
    term: "glándula tiroides hiperactiva",
    category: "metabólico",
    synonyms: ["tiroides acelerada", "función tiroidea alta"]
  },
  "gota": {
    term: "ácido úrico alto con cristales en articulaciones",
    category: "metabólico",
    synonyms: ["artritis gotosa"]
  },
  "insulinorresistencia": {
    term: "respuesta reducida del cuerpo a la insulina",
    category: "metabólico",
    synonyms: ["resistencia a insulina"]
  },

  // ==================== PSIQUIÁTRICO ====================
  "ansiedad": {
    term: "preocupación excesiva y persistente",
    category: "psiquiátrico",
    synonyms: ["nerviosismo", "angustia", "inquietud"]
  },
  "depresión": {
    term: "tristeza profunda y pérdida de interés",
    category: "psiquiátrico",
    synonyms: ["tristeza", "estado de ánimo bajo"]
  },
  "estrés": {
    term: "tensión física o emocional",
    category: "psiquiátrico",
    synonyms: [" presión", "tensión nerviosa"]
  },
  "ataque de pánico": {
    term: "episodio repentino de miedo intenso",
    category: "psiquiátrico",
    synonyms: ["crisis de pánico", "pánico"]
  },
  "fobia": {
    term: "miedo intenso e irracional",
    category: "psiquiátrico",
    synonyms: ["miedo excesivo", "temor irracional"]
  },
  "obsesión": {
    term: "pensamientos recurrentes e indeseados",
    category: "psiquiátrico",
    synonyms: ["idea fija", "obsesiones"]
  },
  "compulsión": {
    term: "conducta repetitiva para reducir ansiedad",
    category: "psiquiátrico",
    synonyms: ["rituales", "compulsiones"]
  },
  "esquizofrenia": {
    term: "trastorno mental con alteración de percepción",
    category: "psiquiátrico",
    synonyms: ["psicosis"]
  },
  "manía": {
    term: "estado de energía y actividad excesivos",
    category: "psiquiátrico",
    synonyms: ["estado maníaco"]
  },
  "hipomanía": {
    term: "forma leve de manía",
    category: "psiquiátrico",
    synonyms: ["excitación leve"]
  },
  "trastorno bipolar": {
    term: "alternancia entre mania y depresión",
    category: "psiquiátrico",
    synonyms: ["enfermedad bipolar"]
  },
  "autismo": {
    term: "trastorno del desarrollo neurológico",
    category: "psiquiátrico",
    synonyms: [" TEA", "trastorno del espectro autista"]
  },
  "TDAH": {
    term: "dificultad para concentrarse e inatención",
    category: "psiquiátrico",
    synonyms: ["trastorno por déficit de atención"]
  },
  "demencia": {
    term: "pérdida progresiva de funciones cognitivas",
    category: "psiquiátrico",
    synonyms: ["deterioro cognitivo"]
  },
  "alzhéimer": {
    term: "tipo más común de demencia",
    category: "psiquiátrico",
    synonyms: ["enfermedad de Alzheimer"]
  },
  "parkinson": {
    term: "trastorno del movimiento progresivo",
    category: "psiquiátrico",
    synonyms: ["enfermedad de Parkinson"]
  },
  "anorexia": {
    term: "trastorno alimentario con falta de apetito",
    category: "psiquiátrico",
    synonyms: ["pérdida de apetito"]
  },
  "bulimia": {
    term: "trastorno con episodios de comida excesiva",
    category: "psiquiátrico",
    synonyms: ["comer en exceso"]
  },
  "adicción": {
    term: "dependencia de sustancias o actividades",
    category: "psiquiátrico",
    synonyms: ["dependencia", "adición"]
  },
  "abstinencia": {
    term: "síntomas al dejar una sustancia",
    category: "psiquiátrico",
    synonyms: ["síndrome de abstinencia", "mono"]
  },

  // ==================== OFTALMOLÓGICO ====================
  "conjuntivitis": {
    term: "inflamación de la membrana del ojo",
    category: "oftalmológico",
    synonyms: ["ojo rojo", "ojo irritado"]
  },
  "glaucoma": {
    term: "daño al nervio óptico por presión ocular",
    category: "oftalmológico",
    synonyms: ["presión ocular alta"]
  },
  "catarata": {
    term: "opacidad del cristalino del ojo",
    category: "oftalmológico",
    synonyms: ["nublazón del ojo"]
  },
  "retinopatía": {
    term: "enfermedad de la retina",
    category: "oftalmológico",
    synonyms: ["daño a la retina"]
  },
  "xeroftalmia": {
    term: "sequedad extrema de los ojos",
    category: "oftalmológico",
    synonyms: ["ojo seco severo"]
  },
  "blefaritis": {
    term: "inflamación del párpado",
    category: "oftalmológico",
    synonyms: ["inflamación del borde del párpado"]
  },
  "nistagmo": {
    term: "movimiento involuntario de los ojos",
    category: "oftalmológico",
    synonyms: ["ojos que se mueven solos"]
  },
  "fotofobia": {
    term: "sensibilidad excesiva a la luz",
    category: "oftalmológico",
    synonyms: ["intolerancia a la luz", "molestia con luz"]
  },
  "diplopía": {
    term: "visión doble",
    category: "oftalmológico",
    synonyms: ["ver doble"]
  },
  "queratitis": {
    term: "inflamación de la córnea",
    category: "oftalmológico",
    synonyms: ["córnea inflamada"]
  },

  // ==================== OTORRINOLARINGOLÓGICO ====================
  "otalgia": {
    term: "dolor de oído",
    category: "otorrinolaringológico",
    synonyms: ["dolor de oido"]
  },
  "otitis": {
    term: "infección del oído",
    category: "otorrinolaringológico",
    synonyms: ["inflamación del oído"]
  },
  "laberintitis": {
    term: "inflamación del oído interno",
    category: "otorrinolaringológico",
    synonyms: ["vértigo laberíntico"]
  },
  "sordera": {
    term: "pérdida parcial o total de audición",
    category: "otorrinolaringológico",
    synonyms: ["hipoacusia", "pérdida de audición"]
  },
  "hipoacusia": {
    term: "disminución de la capacidad auditiva",
    category: "otorrinolaringológico",
    synonyms: ["sordera parcial"]
  },
  "acúfenos": {
    term: "sonidos en los oídos sin fuente externa",
    category: "otorrinolaringológico",
    synonyms: ["tinnitus", "zumbido en oídos"]
  },
  "rinitis alérgica": {
    term: "reacción alérgica en la nariz",
    category: "otorrinolaringológico",
    synonyms: ["alergia nasal", "fiebre del heno"]
  },
  "poliposis": {
    term: "crecimiento de pólipos en nariz o senos",
    category: "otorrinolaringológico",
    synonyms: ["pólipos nasales"]
  },

  // ==================== RENAL/URINARIO ====================
  "cistitis": {
    term: "infección de la vejiga urinaria",
    category: "renal",
    synonyms: ["infección urinaria"]
  },
  "uretritis": {
    term: "inflamación de la uretra",
    category: "renal",
    synonyms: ["infección de uretra"]
  },
  "nefritis": {
    term: "inflamación de los riñones",
    category: "renal",
    synonyms: ["infección renal"]
  },
  "pielonefritis": {
    term: "infección de riñón y vías urinarias",
    category: "renal",
    synonyms: ["infección renal"]
  },
  "litiasis": {
    term: "piedras o cálculos en el cuerpo",
    category: "renal",
    synonyms: ["cálculos", "piedras"]
  },
  "hematuria": {
    term: "sangre en la orina",
    category: "renal",
    synonyms: ["orina con sangre"]
  },
  "proteinuria": {
    term: "proteína excesiva en la orina",
    category: "renal",
    synonyms: ["orina con proteína"]
  },
  "disuria": {
    term: "dolor o dificultad al orinar",
    category: "renal",
    synonyms: ["dolor al orinar", "escozor al orinar"]
  },
  "poliuria": {
    term: "orina en exceso",
    category: "renal",
    synonyms: ["mucha orina"]
  },
  "oliguria": {
    term: "producción reducida de orina",
    category: "renal",
    synonyms: ["poca orina"]
  },
  "incontinencia": {
    term: "pérdida involuntaria de orina",
    category: "renal",
    synonyms: ["escape de orina"]
  },
  "enuresis": {
    term: "orinarse en la cama",
    category: "renal",
    synonyms: ["mojar la cama"]
  },

  // ==================== HEMATOLÓGICO ====================
  "anemia": {
    term: "falta de glóbulos rojos o hemoglobina",
    category: "hematológico",
    synonyms: ["bajo en sangre", "pocas células rojas"]
  },
  "leucopenia": {
    term: "bajo número de glóbulos blancos",
    category: "hematológico",
    synonyms: ["pocas defensas"]
  },
  "trombocitopenia": {
    term: "bajo número de plaquetas",
    category: "hematológico",
    synonyms: ["pocas plaquetas"]
  },
  "hemofilia": {
    term: "trastorno de la coagulación",
    category: "hematológico",
    synonyms: ["sangrado excesivo"]
  },
  "coagulación": {
    term: "proceso de formación de coágulos",
    category: "hematológico",
    synonyms: ["detención de sangrado"]
  },
  "trombosis venosa": {
    term: "coágulo en una vena",
    category: "hematológico",
    synonyms: ["vena tapada por coágulo"]
  },
  "embolia pulmonar": {
    term: "coágulo que bloquea arteria pulmonar",
    category: "hematológico",
    synonyms: ["tromboembolismo pulmonar"]
  },
  "linfoma": {
    term: "cáncer del sistema linfático",
    category: "hematológico",
    synonyms: ["tumor ganglionar"]
  },
  "leucemia": {
    term: "cáncer de la sangre",
    category: "hematológico",
    synonyms: ["cáncer sanguíneo"]
  },

  // ==================== ENDOCRINO ====================
  "hipófisis": {
    term: "glándula pituitaria",
    category: "endocrino",
    synonyms: ["glándula maestra"]
  },
  "suprarrenal": {
    term: "glándula adrenal",
    category: "endocrino",
    synonyms: ["glándula sobre el riñón"]
  },
  "menopausia": {
    term: "cese de la menstruación",
    category: "endocrino",
    synonyms: ["fin de la etapa reproductiva"]
  },
  "andropausia": {
    term: "cambios hormonales en hombres mayores",
    category: "endocrino",
    synonyms: ["menopausia masculina"]
  },
  "pubertad": {
    term: "transición a la edad adulta",
    category: "endocrino",
    synonyms: ["desarrollo sexual"]
  },
  "ginecomastia": {
    term: "desarrollo de pecho en hombres",
    category: "endocrino",
    synonyms: ["pecho masculino agrandado"]
  },
  "hirsutismo": {
    term: "exceso de vello corporal",
    category: "endocrino",
    synonyms: ["vello excesivo"]
  },
  "diabetes insípida": {
    term: "trastorno con sed excesiva y orina diluida",
    category: "endocrino",
    synonyms: ["orina muy diluida"]
  },

  // ==================== INMUNOLÓGICO ====================
  "alergia": {
    term: "reacción exagerada del sistema inmune",
    category: "inmunológico",
    synonyms: ["reacción alérgica", "hipersensibilidad"]
  },
  "anafilaxia": {
    term: "reacción alérgica grave y repentina",
    category: "inmunológico",
    synonyms: ["shock anafiláctico"]
  },
  "autoinmune": {
    term: "el cuerpo ataca sus propias células",
    category: "inmunológico",
    synonyms: ["enfermedad autoinmune"]
  },
  "lupus": {
    term: "enfermedad autoinmune sistémica",
    category: "inmunológico",
    synonyms: ["lupus eritematoso"]
  },
  "artritis reumatoide": {
    term: "enfermedad autoinmune de las articulaciones",
    category: "inmunológico",
    synonyms: ["reumatismo"]
  },
  "esclerosis múltiple": {
    term: "enfermedad autoinmune del sistema nervioso",
    category: "inmunológico",
    synonyms: ["EM"]
  },
  "immunodeficiencia": {
    term: "sistema inmunológico debilitado",
    category: "inmunológico",
    synonyms: ["defensas bajas"]
  },
  "VIH": {
    term: "virus que causa SIDA",
    category: "inmunológico",
    synonyms: ["virus de inmunodeficiencia humana"]
  },
  "SIDA": {
    term: "etapa avanzada de infección por VIH",
    category: "inmunológico",
    synonyms: ["síndrome de inmunodeficiencia adquirida"]
  },
  "artritis psoriásica": {
    term: "artritis con lesiones de psoriasis",
    category: "inmunológico",
    synonyms: ["psoriasis articular"]
  },

  // ==================== ONCOLÓGICO ====================
  "cáncer": {
    term: "crecimiento incontrolado de células",
    category: "oncológico",
    synonyms: ["neoplasia", "tumor maligno", "carcinoma"]
  },
  "tumor": {
    term: "masa anormal de tejido",
    category: "oncológico",
    synonyms: ["bulto", "neoplasia"]
  },
  "benigno": {
    term: "tumor que no se disemina",
    category: "oncológico",
    synonyms: ["no canceroso"]
  },
  "maligno": {
    term: "tumor que puede invadir otros tejidos",
    category: "oncológico",
    synonyms: ["canceroso", "meteastásico"]
  },
  "metástasis": {
    term: "diseminación del cáncer a otros órganos",
    category: "oncológico",
    synonyms: ["extensión del tumor"]
  },
  "quimioterapia": {
    term: "tratamiento con medicamentos anticancer",
    category: "oncológico",
    synonyms: ["quimio"]
  },
  "radioterapia": {
    term: "tratamiento con radiación",
    category: "oncológico",
    synonyms: ["radiación"]
  },
  "biopsia": {
    term: "extracción de tejido para analizar",
    category: "oncológico",
    synonyms: ["muestra de tejido"]
  },
  "neoplasia": {
    term: "formación anormal de tejido nuevo",
    category: "oncológico",
    synonyms: ["tumor", "crecimiento anormal"]
  },
  "adenocarcinoma": {
    term: "cáncer que comienza en glándulas",
    category: "oncológico",
    synonyms: ["tumor glandular maligno"]
  },
  "sarcoma": {
    term: "cáncer de tejidos conectivos",
    category: "oncológico",
    synonyms: ["tumor mesenquimal"]
  },
  "linfadenopatía": {
    term: "ganglios linfáticos agrandados",
    category: "oncológico",
    synonyms: ["ganglios inflamados"]
  },

  // ==================== DOLOR ====================
  "analgesia": {
    term: "ausencia de sensación de dolor",
    category: "dolor",
    synonyms: ["alivio del dolor"]
  },
  "anestesia": {
    term: "pérdida de sensibilidad",
    category: "dolor",
    synonyms: ["insensibilidad"]
  },
  "local": {
    term: "en una zona específica del cuerpo",
    category: "dolor",
    synonyms: ["regional"]
  },
  "general": {
    term: "en todo el cuerpo",
    category: "dolor",
    synonyms: ["sistémico"]
  },
  "agudo": {
    term: "dolor intenso y de corta duración",
    category: "dolor",
    synonyms: ["repentino", "severo"]
  },
  "crónico": {
    term: "dolor que persiste por largo tiempo",
    category: "dolor",
    synonyms: ["prolongado", "de larga duración"]
  },
  "neuralgia": {
    term: "dolor lungo el trayecto de un nervio",
    category: "dolor",
    synonyms: ["dolor nervioso"]
  },
  "hiperalgesia": {
    term: "respuesta exagerada al dolor",
    category: "dolor",
    synonyms: ["dolor excesivo"]
  },
  "alodinia": {
    term: "dolor por estímulo que no debería doler",
    category: "dolor",
    synonyms: ["dolor ante toque leve"]
  },

  // ==================== INFECCIOSO ====================
  "infección": {
    term: "entrada y multiplicación de microorganismos",
    category: "infeccioso",
    synonyms: ["contagio", "padecer"]
  },
  "bacteriano": {
    term: "causado por bacterias",
    category: "infeccioso",
    synonyms: ["de origen bacteriano"]
  },
  "viral": {
    term: "causado por virus",
    category: "infeccioso",
    synonyms: ["de origen viral"]
  },
  "fúngico": {
    term: "causado por hongos",
    category: "infeccioso",
    synonyms: ["micótico", "por hongos"]
  },
  "parásico": {
    term: "causado por parásitos",
    category: "infeccioso",
    synonyms: ["de origen parasitario"]
  },
  "sepsis": {
    term: "infección generalizada grave",
    category: "infeccioso",
    synonyms: ["infección en sangre", "septicemia"]
  },
  "septicemia": {
    term: "bacterias en la sangre",
    category: "infeccioso",
    synonyms: ["envenenamiento de la sangre"]
  },
  "cuarentena": {
    term: "aislamiento para prevenir contagios",
    category: "infeccioso",
    synonyms: ["aislamiento"]
  },
  "contagio": {
    term: "transmisión de enfermedad",
    category: "infeccioso",
    synonyms: ["contagiar"]
  },
  "pandemia": {
    term: "epidemia que afecta a muchos países",
    category: "infeccioso",
    synonyms: ["brote mundial"]
  },
  "epidemia": {
    term: "brote de enfermedad en una zona",
    category: "infeccioso",
    synonyms: ["brote local"]
  },
  "vector": {
    term: "organismo que transmite enfermedades",
    category: "infeccioso",
    synonyms: ["transmisor"]
  },

  // ==================== ALÉRGICO ====================
  "hipersensibilidad": {
    term: "reacción exagerada del sistema inmune",
    category: "alérgico",
    synonyms: ["alergia"]
  },
  "dermatitis atópica": {
    term: "eccema crónico con picazón",
    category: "alérgico",
    synonyms: ["eccema"]
  },
  "dermatitis de contacto": {
    term: "reacción alérgica en la piel por contacto",
    category: "alérgico",
    synonyms: ["eccema de contacto"]
  },
  "retroalimentación": {
    term: "mecanismo de autorregulación",
    category: "general",
    synonyms: ["feedback"]
  },
  "receptor": {
    term: "estructura que recibe estímulos",
    category: "general",
    synonyms: ["estructura sensorial"]
  },
  "neurotransmisor": {
    term: "mensajero químico del cerebro",
    category: "general",
    synonyms: ["mensajero nervioso"]
  },
  "hormona": {
    term: "mensajero químico del cuerpo",
    category: "general",
    synonyms: ["secreción interna"]
  },
  "enzima": {
    term: "proteína que acelera reacciones",
    category: "general",
    synonyms: ["catalizador biológico"]
  },
  "cofactor": {
    term: "sustancia que ayuda a enzima",
    category: "general",
    synonyms: ["ayudante enzimático"]
  },
  "sustrato": {
    term: "sustancia sobre la que actúa enzima",
    category: "general",
    synonyms: ["material"]
  },
  "metabolito": {
    term: "producto del metabolismo",
    category: "general",
    synonyms: ["sustancia derivada"]
  },
  "biomarcador": {
    term: "indicador medible de enfermedad",
    category: "general",
    synonyms: ["marcador"]
  },
  "gen": {
    term: "unidad de información genética",
    category: "general",
    synonyms: ["unidad hereditaria"]
  },
  "proteína": {
    term: "molécula compuesta de aminoácidos",
    category: "general",
    synonyms: ["cadena de aminoácidos"]
  },
  "aminoácido": {
    term: "unidad básica de proteínas",
    category: "general",
    synonyms: ["componente proteico"]
  },
  "ácido nucleico": {
    term: "molécula que almacena información genética",
    category: "general",
    synonyms: ["ADN", "ARN"]
  },
  "lipido": {
    term: "grasa del cuerpo",
    category: "general",
    synonyms: ["grasas"]
  },
  "carbohidratos": {
    term: "azúcares y almidones",
    category: "general",
    synonyms: ["azúcares"]
  },
  "vitaminas": {
    term: "nutrientes esenciales",
    category: "general",
    synonyms: ["micronutrientes"]
  },
  "minerales": {
    term: "nutrientes inorgánicos",
    category: "general",
    synonyms: ["sales minerales"]
  },
  "electrolitos": {
    term: "sales que conducen electricidad",
    category: "general",
    synonyms: ["iones"]
  },
  "deshidratación": {
    term: "falta de agua en el cuerpo",
    category: "general",
    synonyms: ["缺水"]
  },
  "hipovolemia": {
    term: "volumen bajo de sangre",
    category: "general",
    synonyms: ["poca sangre"]
  },
  "hipervolemia": {
    term: "exceso de líquido en el cuerpo",
    category: "general",
    synonyms: ["líquido excesivo"]
  },
  "hiponatremia": {
    term: "sodio bajo en sangre",
    category: "general",
    synonyms: ["poca sal en sangre"]
  },
  "hipernatremia": {
    term: "sodio alto en sangre",
    category: "general",
    synonyms: ["mucha sal en sangre"]
  },
  "hipopotasemia": {
    term: "potasio bajo en sangre",
    category: "general",
    synonyms: ["poco potasio"]
  },
  "hiperpotasemia": {
    term: "potasio alto en sangre",
    category: "general",
    synonyms: ["mucho potasio"]
  },
  "hipocalcemia": {
    term: "calcio bajo en sangre",
    category: "general",
    synonyms: ["poco calcio"]
  },
  "hipercalcemia": {
    term: "calcio alto en sangre",
    category: "general",
    synonyms: ["mucho calcio"]
  },
  "acidosis": {
    term: "sangre demasiado ácida",
    category: "general",
    synonyms: [" PH bajo"]
  },
  "alcalosis": {
    term: "sangre menos ácida de lo normal",
    category: "general",
    synonyms: [" PH alto"]
  },
  "hipoxia": {
    term: "falta de oxígeno en tejidos",
    category: "general",
    synonyms: ["oxígeno bajo"]
  },
  "anoxia": {
    term: "ausencia completa de oxígeno",
    category: "general",
    synonyms: ["sin oxígeno"]
  },
  "hipoxemia": {
    term: "oxígeno bajo en sangre",
    category: "general",
    synonyms: ["saturación baja"]
  },
  "hypercapnia": {
    term: "dióxido de carbono alto en sangre",
    category: "general",
    synonyms: ["CO2 elevado"]
  },
  "hipocapnia": {
    term: "dióxido de carbono bajo en sangre",
    category: "general",
    synonyms: ["CO2 bajo"]
  },
  "ostasis ácida-base": {
    term: "equilibrio de pH en el cuerpo",
    category: "general",
    synonyms: ["equilibrio del PH"]
  },
  "buffer": {
    term: "sustancia que neutraliza ácidos",
    category: "general",
    synonyms: ["amortiguador"]
  },
  "osmorregulación": {
    term: "control de agua en células",
    category: "general",
    synonyms: ["balance de agua"]
  },
  "termorregulación": {
    term: "control de temperatura corporal",
    category: "general",
    synonyms: ["equilibrio térmico"]
  },
  "glucorregulación": {
    term: "control de azúcar en sangre",
    category: "general",
    synonyms: ["balance de glucosa"]
  },
};

// Función para obtener todos los términos ordenados
export function getAllTerms(): Array<{ term: string; definition: MedicalTerm }> {
  return Object.entries(MEDICAL_GLOSSARY)
    .map(([term, definition]) => ({ term, definition }))
    .sort((a, b) => a.term.localeCompare(b.term));
}

// Función para obtener términos por categoría
export function getTermsByCategory(category: string): Array<{ term: string; definition: MedicalTerm }> {
  return getAllTerms().filter(item => item.definition.category === category);
}

// Función para obtener todas las categorías únicas
export function getCategories(): string[] {
  const categories = new Set<string>();
  Object.values(MEDICAL_GLOSSARY).forEach(term => {
    categories.add(term.category);
  });
  return Array.from(categories).sort();
}
