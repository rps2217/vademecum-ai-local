/**
 * Base de Conocimiento Médico - Ingredientes Activos
 * 
 * Esta base de datos contiene información pre-estructurada sobre los ingredientes
 * activos más comunes en suplementos y productos farmacéuticos.
 * 
 * NO requiere conexión a IA - toda la información está pre-cargada.
 */

// Tipos de datos
export interface IngredientInfo {
  id: string;
  nombre: string;
  nombre_latin?: string;
  categoria: 'vitaminas' | 'minerales' | 'aminoacidos' | 'botanicos' | 'enzimas' | 'acidos_grasos' | 'probioticos' | 'otros';
  descripcion: string;
  mecanismo_accion: string;
  beneficios: string[];
  fuentes_alimentarias?: string[];
  dosis_recomendada?: string;
  interacciones?: string[];
  contraindicaciones?: string[];
  sinergias: SynergyRelation[];
  antagonismos?: AntagonismRelation[];
}

export interface SynergyRelation {
  ingrediente_id: string;
  tipo: 'potenciador' | 'complementario' | 'cofactor';
  descripcion: string;
  nivel: 'alto' | 'medio' | 'bajo';
}

export interface AntagonismRelation {
  ingrediente_id: string;
  tipo: 'competidor' | 'inhibidor' | 'bloqueador';
  descripcion: string;
  nivel: 'alto' | 'medio' | 'bajo';
}

// Base de conocimiento de ingredientes
export const KNOWLEDGE_BASE: Record<string, IngredientInfo> = {
  // VITAMINAS
  'vitamina_c': {
    id: 'vitamina_c',
    nombre: 'Vitamina C (Ácido Ascórbico)',
    categoria: 'vitaminas',
    descripcion: 'Antioxidante hidrosoluble esencial para el sistema inmunológico, síntesis de colágeno y absorción de hierro.',
    mecanismo_accion: 'Actúa como antioxidante, neutraliza radicales libres, esencial para la síntesis de colágeno y carnitina, mejora la absorción de hierro no hemo.',
    beneficios: [
      'Refuerza el sistema inmunológico',
      'Protege contra daño oxidativo',
      'Favorece la síntesis de colágeno',
      'Mejora la absorción de hierro',
      'Reduce duración de resfriados',
      'Apoya la salud de la piel'
    ],
    fuentes_alimentarias: ['Cítricos', 'Kiwi', 'Fresas', 'Pimientos', 'Brócoli'],
    dosis_recomendada: '75-90mg/día (máx 2000mg/día)',
    sinergias: [
      { ingrediente_id: 'zinc', tipo: 'complementario', descripcion: 'Sinergia en función inmunológica', nivel: 'alto' },
      { ingrediente_id: 'vitamina_e', tipo: 'potenciador', descripcion: 'Regeneración mutua del antioxidante', nivel: 'alto' },
      { ingrediente_id: 'hierro', tipo: 'complementario', descripcion: 'Mejora absorción de hierro no hemo', nivel: 'alto' },
      { ingrediente_id: 'colageno', tipo: 'complementario', descripcion: 'Co-factor en síntesis de colágeno', nivel: 'medio' }
    ],
    antagonismos: [
      { ingrediente_id: 'vitamina_b12', tipo: 'competidor', descripcion: 'La vitamina C puede reducir la absorción de B12', nivel: 'medio' }
    ]
  },

  'vitamina_d3': {
    id: 'vitamina_d3',
    nombre: 'Vitamina D3 (Colecalciferol)',
    categoria: 'vitaminas',
    descripcion: 'Vitamina liposoluble esencial para la absorción de calcio, función muscular, neurológica e inmunológica.',
    mecanismo_accion: 'Se convierte en calcitriol, hormona que regula la absorción intestinal de calcio y fosfato, esencial para mineralización ósea.',
    beneficios: [
      'Esencial para absorción de calcio',
      'Fortalecimiento óseo',
      'Función muscular óptima',
      'Soporte inmunológico',
      'Salud neurológica',
      'Regulación del estado de ánimo'
    ],
    fuentes_alimentarias: ['Pescados grasos', 'Yema de huevo', 'Lácteos fortificados'],
    dosis_recomendada: '600-2000 UI/día',
    sinergias: [
      { ingrediente_id: 'calcio', tipo: 'potenciador', descripcion: 'Esencial para absorción de calcio', nivel: 'alto' },
      { ingrediente_id: 'magnesio', tipo: 'cofactor', descripcion: 'Cofactor en activación de vitamina D', nivel: 'alto' },
      { ingrediente_id: 'vitamina_k2', tipo: 'complementario', descripcion: 'Dirección del calcio a huesos (no arterias)', nivel: 'alto' },
      { ingrediente_id: 'zinc', tipo: 'complementario', descripcion: 'Sinergia en función inmunológica', nivel: 'medio' }
    ]
  },

  'vitamina_e': {
    id: 'vitamina_e',
    nombre: 'Vitamina E (Tocoferoles)',
    categoria: 'vitaminas',
    descripcion: 'Antioxidante liposoluble que protege las membranas celulares del daño oxidativo.',
    mecanismo_accion: 'Neutraliza radicales libres en membranas lipídicas, protege LDL de oxidación, apoya función inmune.',
    beneficios: [
      'Potente antioxidante',
      'Protege membranas celulares',
      'Salud cardiovascular',
      'Soporte dermatológico',
      'Función inmunológica'
    ],
    dosis_recomendada: '15mg/día (22.4 UI)',
    sinergias: [
      { ingrediente_id: 'vitamina_c', tipo: 'potenciador', descripcion: 'Regenera vitamina E oxidada', nivel: 'alto' },
      { ingrediente_id: 'selenio', tipo: 'potenciador', descripcion: 'Sinergia antioxidante', nivel: 'alto' },
      { ingrediente_id: 'omega_3', tipo: 'complementario', descripcion: 'Protección de ácidos grasos', nivel: 'medio' }
    ],
    antagonismos: [
      { ingrediente_id: 'hierro', tipo: 'competidor', descripcion: 'Tomar separado - inhibe absorción', nivel: 'medio' }
    ]
  },

  'vitamina_k2': {
    id: 'vitamina_k2',
    nombre: 'Vitamina K2 (Menaquinona)',
    categoria: 'vitaminas',
    descripcion: 'Vitamina liposoluble esencial para la coagulación sanguínea y metabolismo del calcio.',
    mecanismo_accion: 'Activa proteínas que regulan la deposición de calcio en huesos y previenen calcificación arterial.',
    beneficios: [
      'Distribución correcta del calcio',
      'Salud ósea',
      'Protección cardiovascular',
      'Coagulación sanguínea'
    ],
    dosis_recomendada: '90-120mcg/día',
    sinergias: [
      { ingrediente_id: 'vitamina_d3', tipo: 'potenciador', descripcion: 'Trabajan juntos en metabolismo del calcio', nivel: 'alto' },
      { ingrediente_id: 'calcio', tipo: 'complementario', descripcion: 'Dirección del calcio a huesos', nivel: 'alto' },
      { ingrediente_id: 'magnesio', tipo: 'cofactor', descripcion: 'Cofactor en activación de proteínas', nivel: 'medio' }
    ]
  },

  'vitaminas_b': {
    id: 'vitaminas_b',
    nombre: 'Complejo B',
    categoria: 'vitaminas',
    descripcion: 'Grupo de 8 vitaminas hidrosolubles esenciales para el metabolismo energético y función neurológica.',
    mecanismo_accion: 'Coenzimas en metabolismo de carbohidratos, proteínas y grasas; síntesis de neurotransmisores y hemoglobina.',
    beneficios: [
      'Metabolismo energético',
      'Función neurológica',
      'Síntesis de neurotransmisores',
      'Producción de hemoglobina',
      'Salud adrenal',
      'Función cognitiva'
    ],
    dosis_recomendada: 'Complejo B diario',
    sinergias: [
      { ingrediente_id: 'magnesio', tipo: 'cofactor', descripcion: 'Cofactor en reacciones metabólicas', nivel: 'alto' },
      { ingrediente_id: 'zinc', tipo: 'complementario', descripcion: 'Sinergia en función neurológica', nivel: 'medio' },
      { ingrediente_id: 'hierro', tipo: 'complementario', descripcion: 'B6 y B12 en metabolismo del hierro', nivel: 'medio' }
    ]
  },

  'vitamina_b12': {
    id: 'vitamina_b12',
    nombre: 'Vitamina B12 (Cobalamina)',
    categoria: 'vitaminas',
    descripcion: 'Vitamina esencial para formación de sangre, función neurológica y síntesis de ADN.',
    mecanismo_accion: 'Cofactor en síntesis de mielina, producción de SAM, conversión de homocisteína a metionina.',
    beneficios: [
      'Formación de glóbulos rojos',
      'Función neurológica',
      'Síntesis de ADN',
      'Metabolismo energético',
      'Salud mental'
    ],
    dosis_recomendada: '2.4mcg/día',
    sinergias: [
      { ingrediente_id: 'folato', tipo: 'complementario', descripcion: 'Vías metabólicas interrelacionadas', nivel: 'alto' },
      { ingrediente_id: 'vitamina_b6', tipo: 'complementario', descripcion: 'Metabolismo de homocisteína', nivel: 'alto' }
    ]
  },

  'vitamina_b6': {
    id: 'vitamina_b6',
    nombre: 'Vitamina B6 (Piridoxina)',
    categoria: 'vitaminas',
    descripcion: 'Vitamina esencial para metabolismo de aminoácidos, síntesis de neurotransmisores y hemoglobina.',
    mecanismo_accion: 'Cofactor en más de 100 enzimas, síntesis de serotonina, dopamina, GABA y hemoglobina.',
    beneficios: [
      'Síntesis de neurotransmisores',
      'Metabolismo de proteínas',
      'Formación de hemoglobina',
      'Función inmune',
      'Regulación hormonal'
    ],
    dosis_recomendada: '1.3-1.7mg/día',
    sinergias: [
      { ingrediente_id: 'magnesio', tipo: 'cofactor', descripcion: 'Absorción y utilización de B6', nivel: 'alto' },
      { ingrediente_id: 'vitamina_b12', tipo: 'complementario', descripcion: 'Metabolismo de homocisteína', nivel: 'alto' }
    ]
  },

  // MINERALES
  'zinc': {
    id: 'zinc',
    nombre: 'Zinc',
    categoria: 'minerales',
    descripcion: 'Mineral esencial para más de 300 enzimas, función inmune, cicatrización y síntesis de proteínas.',
    mecanismo_accion: 'Cofactor de metaloenzimas, estructura de proteínas, función inmune (timulina), cicatrización.',
    beneficios: [
      'Fortalecimiento inmune',
      'Cicatrización de heridas',
      'Síntesis de proteínas',
      'Función cognitiva',
      'Salud reproductiva',
      'Metabolismo'
    ],
    dosis_recomendada: '8-11mg/día (máx 40mg/día)',
    sinergias: [
      { ingrediente_id: 'vitamina_c', tipo: 'complementario', descripcion: 'Sinergia inmunológica', nivel: 'alto' },
      { ingrediente_id: 'vitamina_d3', tipo: 'complementario', descripcion: 'Sinergia inmunológica', nivel: 'medio' },
      { ingrediente_id: 'magnesio', tipo: 'complementario', descripcion: 'Absorción intestinal competitiva', nivel: 'medio' },
      { ingrediente_id: 'selenio', tipo: 'potenciador', descripcion: 'Protección antioxidante', nivel: 'alto' }
    ],
    antagonismos: [
      { ingrediente_id: 'hierro', tipo: 'competidor', descripcion: 'Absorción competitiva intestinal', nivel: 'alto' },
      { ingrediente_id: 'calcio', tipo: 'competidor', descripcion: 'Alta dosis de calcio reduce absorción', nivel: 'medio' }
    ]
  },

  'magnesio': {
    id: 'magnesio',
    nombre: 'Magnesio',
    categoria: 'minerales',
    descripcion: 'Mineral esencial para más de 600 reacciones enzimáticas, función muscular, nerviosa y cardiovascular.',
    mecanismo_accion: 'Cofactor de ATP, contracciones musculares, transmisión nerviosa, relajación de vasos sanguíneos.',
    beneficios: [
      'Relajación muscular',
      'Función nerviosa',
      'Salud cardiovascular',
      'Metabolismo energético',
      'Calidad del sueño',
      'Salud ósea'
    ],
    dosis_recomendada: '310-420mg/día',
    sinergias: [
      { ingrediente_id: 'vitamina_b6', tipo: 'cofactor', descripcion: 'Mejora absorción y utilización', nivel: 'alto' },
      { ingrediente_id: 'vitamina_d3', tipo: 'cofactor', descripcion: 'Cofactor en metabolismo de vitamina D', nivel: 'alto' },
      { ingrediente_id: 'calcio', tipo: 'equilibrador', descripcion: 'Equilibrio calcio-magnesio importante', nivel: 'alto' },
      { ingrediente_id: 'potasio', tipo: 'complementario', descripcion: 'Función muscular y cardíaca', nivel: 'medio' }
    ],
    antagonismos: [
      { ingrediente_id: 'zinc', tipo: 'competidor', descripcion: 'Dosis altas pueden competir', nivel: 'bajo' },
      { ingrediente_id: 'hierro', tipo: 'competidor', descripcion: 'Absorción competitiva', nivel: 'medio' }
    ]
  },

  'calcio': {
    id: 'calcio',
    nombre: 'Calcio',
    categoria: 'minerales',
    descripcion: 'Mineral más abundante del cuerpo, esencial para huesos, dientes, contracción muscular y señalización celular.',
    mecanismo_accion: 'Componente estructural de huesos, dientes; esencial para contracción muscular, coagulación, señalización celular.',
    beneficios: [
      'Salud ósea',
      'Función muscular',
      'Coagulación sanguínea',
      'Transmisión nerviosa',
      'Contracción cardíaca'
    ],
    dosis_recomendada: '1000-1200mg/día',
    sinergias: [
      { ingrediente_id: 'vitamina_d3', tipo: 'potenciador', descripcion: 'Esencial para absorción', nivel: 'alto' },
      { ingrediente_id: 'vitamina_k2', tipo: 'complementario', descripcion: 'Dirección del calcio a huesos', nivel: 'alto' },
      { ingrediente_id: 'magnesio', tipo: 'equilibrador', descripcion: 'Equilibrio mineral importante', nivel: 'alto' }
    ],
    antagonismos: [
      { ingrediente_id: 'hierro', tipo: 'competidor', descripcion: 'Absorción competitiva', nivel: 'medio' },
      { ingrediente_id: 'zinc', tipo: 'competidor', descripcion: 'Absorción competitiva', nivel: 'medio' }
    ]
  },

  'hierro': {
    id: 'hierro',
    nombre: 'Hierro',
    categoria: 'minerales',
    descripcion: 'Mineral esencial para transporte de oxígeno, formación de hemoglobina y función celular.',
    mecanismo_accion: 'Componente de hemoglobina y mioglobina, cofactor de enzimas respiratorias, transporte de electrones.',
    beneficios: [
      'Transporte de oxígeno',
      'Formación de hemoglobina',
      'Producción de energía',
      'Función cognitiva',
      'Sistema inmune'
    ],
    dosis_recomendada: '8-18mg/día',
    sinergias: [
      { ingrediente_id: 'vitamina_c', tipo: 'potenciador', descripcion: 'Mejora absorción de hierro no hemo', nivel: 'alto' },
      { ingrediente_id: 'folato', tipo: 'complementario', descripcion: 'Formación de glóbulos rojos', nivel: 'alto' },
      { ingrediente_id: 'vitamina_b12', tipo: 'complementario', descripcion: 'Maduración de glóbulos rojos', nivel: 'alto' }
    ],
    antagonismos: [
      { ingrediente_id: 'zinc', tipo: 'competidor', descripcion: 'Absorción competitiva intestinal', nivel: 'alto' },
      { ingrediente_id: 'calcio', tipo: 'competidor', descripcion: 'Reduce absorción', nivel: 'medio' },
      { ingrediente_id: 'magnesio', tipo: 'competidor', descripcion: 'Absorción competitiva', nivel: 'medio' }
    ]
  },

  'selenio': {
    id: 'selenio',
    nombre: 'Selenio',
    categoria: 'minerales',
    descripcion: 'Mineral traza esencial para抗氧化antes, función tiroidea y sistema inmune.',
    mecanismo_accion: 'Componente de selenoproteínas (glutatión peroxidasa), metabolismo tiroideo, función inmune.',
    beneficios: [
      'Antioxidante potente',
      'Función tiroidea',
      'Soporte inmune',
      'Salud cardiovascular',
      'Fertilidad masculina'
    ],
    dosis_recomendada: '55mcg/día (máx 400mcg/día)',
    sinergias: [
      { ingrediente_id: 'vitamina_e', tipo: 'potenciador', descripcion: 'Sinergia antioxidante', nivel: 'alto' },
      { ingrediente_id: 'zinc', tipo: 'complementario', descripcion: 'Protección celular', nivel: 'alto' },
      { ingrediente_id: 'vitamina_c', tipo: 'complementario', descripcion: 'Protección oxidativa', nivel: 'medio' }
    ]
  },

  'potasio': {
    id: 'potasio',
    nombre: 'Potasio',
    categoria: 'minerales',
    descripcion: 'Mineral esencial para equilibrio de líquidos, función nerviosa y contracción muscular.',
    mecanismo_accion: 'Principal ion positivo intracelular, potencial de membrana, contracción muscular, ritmo cardíaco.',
    beneficios: [
      'Equilibrio electrolítico',
      'Función muscular',
      'Presión arterial',
      'Función nerviosa',
      'Ritmo cardíaco'
    ],
    dosis_recomendada: '2600-3400mg/día',
    sinergias: [
      { ingrediente_id: 'magnesio', tipo: 'complementario', descripcion: 'Función muscular y nerviosa', nivel: 'alto' },
      { ingrediente_id: 'sodio', tipo: 'equilibrador', descripcion: 'Equilibrio electrolítico', nivel: 'alto' }
    ]
  },

  'cromo': {
    id: 'cromo',
    nombre: 'Cromo',
    categoria: 'minerales',
    descripcion: 'Mineral traza que potencia la acción de la insulina y metabolismo de carbohidratos.',
    mecanismo_accion: 'Componente del factor de tolerancia a glucosa (GTF), potencia acción de insulina.',
    beneficios: [
      'Metabolismo de glucosa',
      'Sensibilidad a insulina',
      'Metabolismo de macronutrientes',
      'Energía celular'
    ],
    dosis_recomendada: '25-35mcg/día',
    sinergias: [
      { ingrediente_id: 'biotina', tipo: 'complementario', descripcion: 'Metabolismo de carbohidratos', nivel: 'medio' },
      { ingrediente_id: 'magnesio', tipo: 'complementario', descripcion: 'Metabolismo energético', nivel: 'medio' }
    ]
  },

  'yodo': {
    id: 'yodo',
    nombre: 'Yodo',
    categoria: 'minerales',
    descripcion: 'Mineral esencial para síntesis de hormonas tiroideas y desarrollo neurológico.',
    mecanismo_accion: 'Componente de T3 y T4 (hormonas tiroideas), desarrollo cerebral fetal e infantil.',
    beneficios: [
      'Función tiroidea',
      'Producción hormonal',
      'Desarrollo cognitivo',
      'Metabolismo',
      'Energía'
    ],
    dosis_recomendada: '150mcg/día',
    sinergias: [
      { ingrediente_id: 'selenio', tipo: 'cofactor', descripcion: 'Conversión de hormonas tiroideas', nivel: 'alto' }
    ]
  },

  // AMINOÁCIDOS
  'l_glutamina': {
    id: 'l_glutamina',
    nombre: 'L-Glutamina',
    categoria: 'aminoacidos',
    descripcion: 'Aminoácido condicionalmente esencial, principal combustible de células inmunes e intestinales.',
    mecanismo_accion: 'Fuel para células inmunes, enterocitos; precursor de glutatión; síntesis de nucleótidos.',
    beneficios: [
      'Salud intestinal',
      'Soporte inmune',
      'Recuperación muscular',
      'Síntesis de glutatión',
      'Función cerebral'
    ],
    dosis_recomendada: '5-10g/día',
    sinergias: [
      { ingrediente_id: 'colageno', tipo: 'complementario', descripcion: 'Salud intestinal', nivel: 'medio' },
      { ingrediente_id: 'zinc', tipo: 'complementario', descripcion: 'Función inmune', nivel: 'medio' }
    ]
  },

  'l_arginina': {
    id: 'l_arginina',
    nombre: 'L-Arginina',
    categoria: 'aminoacidos',
    descripcion: 'Aminoácido condicionalmente esencial, precursor de óxido nítrico y factor de crecimiento.',
    mecanismo_accion: 'Precursor de óxido nítrico (vasodilatación), prolina, creatina; secreción de insulina y GH.',
    beneficios: [
      'Vasodilatación',
      'Función endotelial',
      'Transporte de nitrógeno',
      'Función inmunológica',
      'Recuperación de tejidos'
    ],
    dosis_recomendada: '2-8g/día',
    sinergias: [
      { ingrediente_id: 'l_citrulina', tipo: 'potenciador', descripcion: 'Conversión a arginina más eficiente', nivel: 'alto' },
      { ingrediente_id: 'ornitina', tipo: 'complementario', descripcion: 'Ciclo de la urea', nivel: 'medio' }
    ]
  },

  'l_citrulina': {
    id: 'l_citrulina',
    nombre: 'L-Citrulina',
    categoria: 'aminoacidos',
    descripcion: 'Aminoácido no proteico que se convierte en arginina y potencia óxido nítrico.',
    mecanismo_accion: 'Se convierte en arginina en riñones, aumentando niveles más eficientemente que arginina oral.',
    beneficios: [
      'Producción de arginina',
      'Vasodilatación',
      'Función endotelial',
      'Rendimiento deportivo',
      'Presión arterial'
    ],
    dosis_recomendada: '3-8g/día',
    sinergias: [
      { ingrediente_id: 'l_arginina', tipo: 'potenciador', descripcion: 'Conversión a arginina', nivel: 'alto' },
      { ingrediente_id: 'omega_3', tipo: 'complementario', descripcion: 'Salud vascular', nivel: 'medio' }
    ]
  },

  'l_carnitina': {
    id: 'l_carnitina',
    nombre: 'L-Carnitina',
    categoria: 'aminoacidos',
    descripcion: 'Aminoácido derivado que transporta ácidos grasos a mitocondrias para producción de energía.',
    mecanismo_accion: 'Transportador de ácidos grasos de cadena larga a mitocondrias, beta-oxidación.',
    beneficios: [
      'Metabolismo lipídico',
      'Producción de energía',
      'Función cardíaca',
      'Función cerebral',
      'Rendimiento deportivo'
    ],
    dosis_recomendada: '500-2000mg/día',
    sinergias: [
      { ingrediente_id: 'coq10', tipo: 'potenciador', descripcion: 'Producción de energía mitocondrial', nivel: 'alto' },
      { ingrediente_id: 'ala', tipo: 'complementario', descripcion: 'Función mitocondrial', nivel: 'medio' }
    ]
  },

  'l_tirosina': {
    id: 'l_tirosina',
    nombre: 'L-Tirosina',
    categoria: 'aminoacidos',
    descripcion: 'Aminoácido precursor de neurotransmisores dopamina, norepinefrina y hormonas tiroideas.',
    mecanismo_accion: 'Precursor de DOPA, dopamina, norepinefrina, epinefrina, hormonas tiroideas, melanina.',
    beneficios: [
      'Neurotransmisores',
      'Función cognitiva',
      'Estado de ánimo',
      'Función tiroidea',
      'Respuesta al estrés'
    ],
    dosis_recomendada: '500-2000mg/día',
    sinergias: [
      { ingrediente_id: 'vitaminas_b', tipo: 'cofactor', descripcion: 'Cofactores en síntesis de neurotransmisores', nivel: 'alto' },
      { ingrediente_id: 'magnesio', tipo: 'complementario', descripcion: 'Función neurológica', nivel: 'medio' }
    ]
  },

  'gaba': {
    id: 'gaba',
    nombre: 'GABA (Ácido Gamma-Aminobutírico)',
    categoria: 'aminoacidos',
    descripcion: 'Principal neurotransmisor inhibitorio del SNC, esencial para relajación y calma.',
    mecanismo_accion: 'Neurotransmisor inhibitorio, reduce excitabilidad neuronal, induce relajación.',
    beneficios: [
      'Relajación',
      'Reducción de ansiedad',
      'Mejor sueño',
      'Calma mental',
      'Función neurológica'
    ],
    dosis_recomendada: '250-750mg/día',
    sinergias: [
      { ingrediente_id: 'l_teanina', tipo: 'potenciador', descripcion: 'Mecanismos complementarios', nivel: 'alto' },
      { ingrediente_id: 'magnesio', tipo: 'complementario', descripcion: 'Relaxación muscular y nerviosa', nivel: 'alto' }
    ]
  },

  'l_teanina': {
    id: 'l_teanina',
    nombre: 'L-Teanina',
    categoria: 'aminoacidos',
    descripcion: 'Aminoácido del té verde que promueve relajación sin somnolencia.',
    mecanismo_accion: 'Aumenta ondas alfa cerebrales, eleva GABA, dopamina, serotonina; antagoniza receptores NMDA.',
    beneficios: [
      'Relajación sin somnolencia',
      'Enfoque mental',
      'Reducción de estrés',
      'Calidad del sueño',
      'Función cognitiva'
    ],
    dosis_recomendada: '100-400mg/día',
    sinergias: [
      { ingrediente_id: 'gaba', tipo: 'potenciador', descripcion: 'Efectos sinérgicos calmantes', nivel: 'alto' },
      { ingrediente_id: 'cafeina', tipo: 'equilibrador', descripcion: 'Neutraliza jitter de cafeína', nivel: 'alto' },
      { ingrediente_id: 'ashwagandha', tipo: 'complementario', descripcion: 'Reducción de estrés', nivel: 'medio' }
    ]
  },

  'bcaa': {
    id: 'bcaa',
    nombre: 'BCAA (Aminoácidos de Cadena Ramificada)',
    categoria: 'aminoacidos',
    descripcion: 'Tres aminoácidos esenciales: leucina, isoleucina y valina, cruciales para síntesis muscular.',
    mecanismo_accion: 'Leucina activa mTOR (síntesis proteica), isoleucina y valina regulan metabolismo.',
    beneficios: [
      'Síntesis muscular',
      'Reducción de fatiga',
      'Recuperación post-entrenamiento',
      'Conservación de masa muscular',
      'Producción de energía'
    ],
    dosis_recomendada: '5-10g/día',
    sinergias: [
      { ingrediente_id: 'l_glutamina', tipo: 'complementario', descripcion: 'Recuperación muscular', nivel: 'medio' },
      { ingrediente_id: 'creatina', tipo: 'complementario', descripcion: 'Rendimiento muscular', nivel: 'medio' }
    ]
  },

  'triptofano': {
    id: 'triptofano',
    nombre: 'L-Triptófano',
    categoria: 'aminoacidos',
    descripcion: 'Aminoácido esencial precursor de serotonina, melatonina y vitamina B3.',
    mecanismo_accion: 'Precursor de 5-HTP → serotonina → melatonina; síntesis de niacina.',
    beneficios: [
      'Producción de serotonina',
      'Melatonina natural',
      'Estado de ánimo',
      'Calidad del sueño',
      'Apetito'
    ],
    dosis_recomendada: '200-500mg/día',
    sinergias: [
      { ingrediente_id: 'vitamina_b6', tipo: 'cofactor', descripcion: 'Conversión a serotonina', nivel: 'alto' },
      { ingrediente_id: 'magnesio', tipo: 'complementario', descripcion: 'Función neurológica', nivel: 'medio' }
    ]
  },

  'glicina': {
    id: 'glicina',
    nombre: 'Glicina',
    categoria: 'aminoacidos',
    descripcion: 'Aminoácido más simple, componente de colágeno, neurotransmisor inhibitorio.',
    mecanismo_accion: 'Neurotransmisor inhibitorio en SNC, componente de colágeno, creatina, hemoglobina.',
    beneficios: [
      'Calidad del sueño',
      'Síntesis de colágeno',
      'Función cognitiva',
      'Salud articular',
      'Producción de creatina'
    ],
    dosis_recomendada: '3-5g/día',
    sinergias: [
      { ingrediente_id: 'colageno', tipo: 'complementario', descripcion: 'Componente del colágeno', nivel: 'alto' },
      { ingrediente_id: 'magnesio', tipo: 'complementario', descripcion: 'Calidad del sueño', nivel: 'medio' }
    ]
  },

  'prolina': {
    id: 'prolina',
    nombre: 'L-Prolina',
    categoria: 'aminoacidos',
    descripcion: 'Aminoácido crucial para síntesis de colágeno y reparación de tejidos.',
    mecanismo_accion: 'Componente mayoritario del colágeno, síntesis de hidroxiprolina, reparación de piel y articulaciones.',
    beneficios: [
      'Síntesis de colágeno',
      'Salud articular',
      'Recuperación de tejidos',
      'Salud de la piel',
      'Elasticidad vascular'
    ],
    dosis_recomendada: '500-1000mg/día',
    sinergias: [
      { ingrediente_id: 'colageno', tipo: 'complementario', descripcion: 'Componente del colágeno', nivel: 'alto' },
      { ingrediente_id: 'vitamina_c', tipo: 'cofactor', descripcion: 'Hidroxilación del colágeno', nivel: 'alto' }
    ]
  },

  // BOTÁNICOS
  'ashwagandha': {
    id: 'ashwagandha',
    nombre: 'Ashwagandha (Withania somnifera)',
    nombre_latin: 'Withania somnifera',
    categoria: 'botanicos',
    descripcion: 'Hierba adaptógena de la medicina Ayurveda, reduce estrés y mejora resistencia física.',
    mecanismo_accion: 'Modula eje HPA, reduce cortisol, aumenta niveles de DHEA-S y testosterona, actividad GABAérgica.',
    beneficios: [
      'Reducción de cortisol',
      'Adaptación al estrés',
      'Mejora del rendimiento',
      'Calidad del sueño',
      'Función cognitiva',
      'Apoyo hormonal'
    ],
    dosis_recomendada: '300-600mg/día de extracto',
    sinergias: [
      { ingrediente_id: 'l_teanina', tipo: 'complementario', descripcion: 'Reducción de estrés sin somnolencia', nivel: 'alto' },
      { ingrediente_id: 'rodiola', tipo: 'potenciador', descripcion: 'Efectos adaptógenos sinérgicos', nivel: 'alto' },
      { ingrediente_id: 'magnesio', tipo: 'complementario', descripcion: 'Reducción de estrés', nivel: 'medio' }
    ]
  },

  'curcuma': {
    id: 'curcuma',
    nombre: 'Cúrcuma (Curcuma longa)',
    nombre_latin: 'Curcuma longa',
    categoria: 'botanicos',
    descripcion: 'Especie con potente compuesto activo curcumina, poderoso antiinflamatorio y antioxidante.',
    mecanismo_accion: 'Inhibe NF-κB, COX-2, LOX; potente antioxidante; modula vías inflamatorias.',
    beneficios: [
      'Potente antiinflamatorio',
      'Antioxidante potente',
      'Salud articular',
      'Función cognitiva',
      'Salud cardiovascular',
      'Apoyo hepático'
    ],
    dosis_recomendada: '500-2000mg/día de cúrcuma (buscar con pimienta negra)',
    sinergias: [
      { ingrediente_id: 'jengibre', tipo: 'potenciador', descripcion: 'Absorción y efectos antiinflamatorios', nivel: 'alto' },
      { ingrediente_id: 'omega_3', tipo: 'potenciador', descripcion: 'Efectos antiinflamatorios sinérgicos', nivel: 'alto' },
      { ingrediente_id: 'pimienta_negra', tipo: 'potenciador', descripcion: 'Piperina aumenta absorción 2000%', nivel: 'alto' }
    ]
  },

  'jengibre': {
    id: 'jengibre',
    nombre: 'Jengibre (Zingiber officinale)',
    nombre_latin: 'Zingiber officinale',
    categoria: 'botanicos',
    descripcion: 'Raíz con propiedades antiinflamatorias, antioxidantes y anti-náusea.',
    mecanismo_accion: 'Inhibe COX y leucotrienos, antagoniza serotonina, gingeroles/shogaoles como antioxidantes.',
    beneficios: [
      'Antiinflamatorio natural',
      'Alivio de náuseas',
      'Función digestiva',
      'Dolor articular',
      'Antioxidante',
      'Apoyo cardiovascular'
    ],
    dosis_recomendada: '1-3g/día de raíz',
    sinergias: [
      { ingrediente_id: 'curcuma', tipo: 'potenciador', descripcion: 'Efectos antiinflamatorios sinérgicos', nivel: 'alto' },
      { ingrediente_id: 'omega_3', tipo: 'complementario', descripcion: 'Antiinflamatorio', nivel: 'medio' }
    ]
  },

  'ginkgo_biloba': {
    id: 'ginkgo_biloba',
    nombre: 'Ginkgo Biloba',
    categoria: 'botanicos',
    descripcion: 'Hierba milenaria que mejora circulación cerebral y función cognitiva.',
    mecanismo_accion: 'Vasodilatador cerebral, inhibe factor de activación plaquetaria, antioxidante cerebral.',
    beneficios: [
      'Circulación cerebral',
      'Función cognitiva',
      'Memoria',
      'Concentración',
      'Función auditiva',
      'Antioxidante cerebral'
    ],
    dosis_recomendada: '120-240mg/día de extracto',
    sinergias: [
      { ingrediente_id: 'bacopa', tipo: 'potenciador', descripcion: 'Función cognitiva', nivel: 'alto' },
      { ingrediente_id: 'omega_3', tipo: 'complementario', descripcion: 'Salud cerebrovascular', nivel: 'alto' }
    ]
  },

  'bacopa': {
    id: 'bacopa',
    nombre: 'Bacopa monnieri',
    categoria: 'botanicos',
    descripcion: 'Hierba ayurvédica que mejora memoria, aprendizaje y función cognitiva.',
    mecanismo_accion: 'Modula acetilcolina, aumenta neuroplasticidad, protege función mitocondrial, antioxidante.',
    beneficios: [
      'Mejora de memoria',
      'Aprendizaje',
      'Función cognitiva',
      'Reducción de ansiedad',
      'Neuroprotección'
    ],
    dosis_recomendada: '300-450mg/día de extracto',
    sinergias: [
      { ingrediente_id: 'ginkgo_biloba', tipo: 'potenciador', descripcion: 'Función cognitiva', nivel: 'alto' },
      { ingrediente_id: 'omega_3', tipo: 'complementario', descripcion: 'Neuroprotección', nivel: 'medio' }
    ]
  },

  ' rhodiola': {
    id: 'rhodiola',
    nombre: 'Rodiola (Rhodiola rosea)',
    categoria: 'botanicos',
    descripcion: 'Adaptógeno que mejora resistencia al estrés, energía y función cognitiva.',
    mecanismo_accion: 'Activa AMPK, aumenta norepinefrina, dopamina, serotonina; inhibe cortisol.',
    beneficios: [
      'Adaptación al estrés',
      'Energía mental',
      'Reducción de fatiga',
      'Función cognitiva',
      'Estado de ánimo'
    ],
    dosis_recomendada: '200-600mg/día',
    sinergias: [
      { ingrediente_id: 'ashwagandha', tipo: 'potenciador', descripcion: 'Efectos adaptógenos sinérgicos', nivel: 'alto' },
      { ingrediente_id: 'cafeina', tipo: 'equilibrador', descripcion: 'Energía sostenida', nivel: 'medio' }
    ]
  },

  'saw_palmetto': {
    id: 'saw_palmetto',
    nombre: 'Saw Palmetto (Serenoa repens)',
    categoria: 'botanicos',
    descripcion: 'Palmera que apoya salud prostática y hormonal masculina.',
    mecanismo_accion: 'Inhibe 5α-reductasa, bloquea receptores de DHT, antiandrogénico suave.',
    beneficios: [
      'Salud prostática',
      'Equilibrio hormonal',
      'Salud urinaria',
      'Apoyo masculino'
    ],
    dosis_recomendada: '320mg/día de extracto',
    sinergias: [
      { ingrediente_id: 'pygeum', tipo: 'potenciador', descripcion: 'Salud prostática', nivel: 'alto' },
      { ingrediente_id: 'zinc', tipo: 'complementario', descripcion: 'Salud prostática', nivel: 'medio' }
    ]
  },

  'valeriana': {
    id: 'valeriana',
    nombre: 'Valeriana (Valeriana officinalis)',
    categoria: 'botanicos',
    descripcion: 'Hierba tradicional para mejorar sueño y reducir ansiedad.',
    mecanismo_accion: 'Modula receptores GABA-A, aumenta GABA cerebral, relajante natural.',
    beneficios: [
      'Mejor sueño',
      'Reducción de ansiedad',
      'Relajación',
      'Tiempo de onset del sueño'
    ],
    dosis_recomendada: '300-600mg/día',
    sinergias: [
      { ingrediente_id: 'gaba', tipo: 'potenciador', descripcion: 'Mecanismos complementarios', nivel: 'alto' },
      { ingrediente_id: 'melatonina', tipo: 'complementario', descripcion: 'Inducción del sueño', nivel: 'medio' }
    ]
  },

  'estigmas_de_maiz': {
    id: 'estigmas_de_maiz',
    nombre: 'Estigmas de Maíz',
    categoria: 'botanicos',
    descripcion: 'Diurético natural tradicional, apoya salud urinaria y renal.',
    mecanismo_accion: 'Aumenta diuresis, inhibe reabsorción de sodio, flavonoides como antioxidantes.',
    beneficios: [
      'Diurético natural',
      'Salud urinaria',
      'Apoyo renal',
      'Reducción de retención'
    ],
    dosis_recomendada: '2-4g/día',
    sinergias: [
      { ingrediente_id: 'diente_de_leon', tipo: 'complementario', descripcion: 'Efectos diuréticos sinérgicos', nivel: 'alto' },
      { ingrediente_id: 'potasio', tipo: 'equilibrador', descripcion: 'Reposición de potasio', nivel: 'alto' }
    ]
  },

  'aceite_de_onagra': {
    id: 'aceite_de_onagra',
    nombre: 'Aceite de Onagra (Oenothera biennis)',
    categoria: 'botanicos',
    descripcion: 'Rico en GLA, ácido graso omega-6 que apoya salud hormonal femenina.',
    mecanismo_accion: 'Fuente de GLA → prostaglandina E1, modulación inflamatoria, salud de membranas.',
    beneficios: [
      'Salud hormonal femenina',
      'Síntomas de SPM',
      'Salud de la piel',
      'Antiinflamatorio',
      'Función celular'
    ],
    dosis_recomendada: '1000-3000mg/día',
    sinergias: [
      { ingrediente_id: 'omega_3', tipo: 'equilibrador', descripcion: 'Equilibrio omega-6/omega-3', nivel: 'alto' },
      { ingrediente_id: 'vitamina_e', tipo: 'potenciador', descripcion: 'Protección de ácidos grasos', nivel: 'medio' }
    ]
  },

  'cimicifuga': {
    id: 'cimicifuga',
    nombre: 'Cimicífuga (Actaea racemosa)',
    categoria: 'botanicos',
    descripcion: 'Hierba para síntomas de menopausia y salud hormonal femenina.',
    mecanismo_accion: 'Modula receptores de serotonina, actividad estrogénica débil, reduce LH.',
    beneficios: [
      'Alivio de sofocos',
      'Menopausia',
      'Salud hormonal',
      'Mejor sueño',
      'Estado de ánimo'
    ],
    dosis_recomendada: '20-40mg/día de extracto',
    sinergias: [
      { ingrediente_id: 'soya', tipo: 'complementario', descripcion: 'Fitoestrógenos', nivel: 'medio' },
      { ingrediente_id: 'l_teanina', tipo: 'complementario', descripcion: 'Calidad del sueño', nivel: 'medio' }
    ]
  },

  // ENZIMAS
  'serrapeptasa': {
    id: 'serrapeptasa',
    nombre: 'Serrapeptasa',
    categoria: 'enzimas',
    descripcion: 'Enzima proteolítica derivada del gusano de seda, antiinflamatoria.',
    mecanismo_accion: 'Hidroliza fibrina, reduce mediadores inflamatorios, drenante de tejidos.',
    beneficios: [
      'Antiinflamatorio potente',
      'Salud articular',
      'Drenaje tisular',
      'Cicatrización',
      'Reducción de edema'
    ],
    dosis_recomendada: '10-60mg/día (en ayunas)',
    sinergias: [
      { ingrediente_id: 'bromelina', tipo: 'potenciador', descripcion: 'Efectos antiinflamatorios sinérgicos', nivel: 'alto' },
      { ingrediente_id: 'curcuma', tipo: 'complementario', descripcion: 'Antiinflamatorio', nivel: 'medio' }
    ]
  },

  'bromelina': {
    id: 'bromelina',
    nombre: 'Bromelina',
    categoria: 'enzimas',
    descripcion: 'Enzima proteolítica de la piña, antiinflamatoria y digestiva.',
    mecanismo_accion: 'Hidroliza proteínas, inhibe prostaglandinas inflamatorias, mejora absorción de nutrientes.',
    beneficios: [
      'Antiinflamatorio',
      'Digestión proteica',
      'Absorción de suplementos',
      'Salud articular',
      'Reducción de hinchazón'
    ],
    dosis_recomendada: '500-2000mg/día',
    sinergias: [
      { ingrediente_id: 'serrapeptasa', tipo: 'potenciador', descripcion: 'Enzimas proteolíticas sinérgicas', nivel: 'alto' },
      { ingrediente_id: 'curcuma', tipo: 'complementario', descripcion: 'Antiinflamatorio', nivel: 'medio' }
    ]
  },

  'digestive_enzymes': {
    id: 'digestive_enzymes',
    nombre: 'Enzimas Digestivas',
    categoria: 'enzimas',
    descripcion: 'Combinación de enzimas para mejorar digestión y absorción de nutrientes.',
    mecanismo_accion: 'Amilasas, lipasas, proteasas, lactasas para digestión completa de macronutrientes.',
    beneficios: [
      'Mejor digestión',
      'Menos hinchazón',
      'Mejor absorción',
      'Comodidad gastrointestinal',
      'Nutrición optimizada'
    ],
    dosis_recomendada: '1-2 cápsulas con comidas',
    sinergias: [
      { ingrediente_id: 'probioticos', tipo: 'complementario', descripcion: 'Salud digestiva completa', nivel: 'alto' },
      { ingrediente_id: 'l_glutamina', tipo: 'complementario', descripcion: 'Salud intestinal', nivel: 'medio' }
    ]
  },

  // ÁCIDOS GRASOS
  'omega_3': {
    id: 'omega_3',
    nombre: 'Omega-3 (EPA y DHA)',
    categoria: 'acidos_grasos',
    descripcion: 'Ácidos grasos esenciales antiinflamatorios para cerebro, corazón y articulaciones.',
    mecanismo_accion: 'Precursores de resolvinas/protectinas antiinflamatorias, estructura neuronal, fluidez de membranas.',
    beneficios: [
      'Antiinflamatorio natural',
      'Salud cardiovascular',
      'Función cerebral',
      'Salud mental',
      'Articulaciones',
      'Piel y cabello'
    ],
    dosis_recomendada: '1000-3000mg EPA+DHA/día',
    sinergias: [
      { ingrediente_id: 'vitamina_d3', tipo: 'complementario', descripcion: 'Absorción y utilización', nivel: 'alto' },
      { ingrediente_id: 'curcuma', tipo: 'potenciador', descripcion: 'Efectos antiinflamatorios sinérgicos', nivel: 'alto' },
      { ingrediente_id: 'coq10', tipo: 'complementario', descripcion: 'Salud cardiovascular', nivel: 'alto' },
      { ingrediente_id: 'vitamina_e', tipo: 'potenciador', descripcion: 'Protección de ácidos grasos', nivel: 'medio' }
    ]
  },

  'aceite_de_pescado': {
    id: 'aceite_de_pescado',
    nombre: 'Aceite de Pescado',
    categoria: 'acidos_grasos',
    descripcion: 'Fuente concentrada de omega-3 EPA y DHA de peces.',
    mecanismo_accion: 'Misma机理 que omega-3, dependiendo de concentración de EPA/DHA.',
    beneficios: [
      'Fuente de omega-3',
      'Salud cardíaca',
      'Función cerebral',
      'Antiinflamatorio'
    ],
    dosis_recomendada: '1-3g/día de aceite',
    sinergias: [
      { ingrediente_id: 'omega_3', tipo: 'potenciador', descripcion: 'Omega-3 directo', nivel: 'alto' }
    ]
  },

  'omega_6': {
    id: 'omega_6',
    nombre: 'Omega-6 (GLA, LA)',
    categoria: 'acidos_grasos',
    descripcion: 'Ácidos grasos omega-6, incluyendo GLA antiinflamatorio del aceite de onagra.',
    mecanismo_accion: 'GLA → PGE1 antiinflamatoria, equilibrio con omega-3 importante.',
    beneficios: [
      'Salud hormonal',
      'Antiinflamatorio (GLA)',
      'Piel saludable',
      'Función celular'
    ],
    dosis_recomendada: 'Balance omega-3/6 importante',
    sinergias: [
      { ingrediente_id: 'omega_3', tipo: 'equilibrador', descripcion: 'Balance correcto omega-6/3', nivel: 'alto' }
    ]
  },

  // PROBIÓTICOS
  'probioticos': {
    id: 'probioticos',
    nombre: 'Probióticos',
    categoria: 'probioticos',
    descripcion: 'Bacterias beneficiosas para salud intestinal e inmunológica.',
    mecanismo_accion: 'Colonización benéfica, competencia con patógenos, producción de SCFA, modulación inmune.',
    beneficios: [
      'Salud intestinal',
      'Inmunidad',
      'Digestión',
      'Absorción de nutrientes',
      'Salud mental (eje intestino-cerebro)',
      'Piel'
    ],
    dosis_recomendada: '10-50 mil millones UFC/día',
    sinergias: [
      { ingrediente_id: 'prebioticos', tipo: 'potenciador', descripcion: 'Alimento para probióticos', nivel: 'alto' },
      { ingrediente_id: 'l_glutamina', tipo: 'complementario', descripcion: 'Salud de la pared intestinal', nivel: 'alto' },
      { ingrediente_id: 'vitamina_d3', tipo: 'complementario', descripcion: 'Modulación inmune', nivel: 'medio' }
    ]
  },

  'prebioticos': {
    id: 'prebioticos',
    nombre: 'Prebióticos',
    categoria: 'probioticos',
    descripcion: 'Fibras que alimentan las bacterias beneficiosas del intestino.',
    mecanismo_accion: 'Fermentación selectiva por bifidobacterias y lactobacilos, producción de butirato.',
    beneficios: [
      'Alimento para probióticos',
      'Salud intestinal',
      'Producción de SCFA',
      'Inmunidad',
      'Absorción mineral'
    ],
    dosis_recomendada: '3-5g/día',
    sinergias: [
      { ingrediente_id: 'probioticos', tipo: 'potenciador', descripcion: 'Synbiotics', nivel: 'alto' },
      { ingrediente_id: 'fibra', tipo: 'complementario', descripcion: 'Fibra fermentable', nivel: 'medio' }
    ]
  },

  // OTROS SUPLEMENTOS
  'colageno': {
    id: 'colageno',
    nombre: 'Colágeno',
    categoria: 'otros',
    descripcion: 'Proteína estructural principal del cuerpo, esencial para piel, huesos y articulaciones.',
    mecanismo_accion: 'Proporciona estructura a piel, tendones, ligamentos, huesos; péptidos bioactivos.',
    beneficios: [
      'Salud de la piel',
      'Articulaciones',
      'Huesos',
      'Tendones y ligamentos',
      'Salud capilar',
      'Salud de uñas'
    ],
    dosis_recomendada: '2.5-15g/día',
    sinergias: [
      { ingrediente_id: 'vitamina_c', tipo: 'cofactor', descripcion: 'Esencial para síntesis de colágeno', nivel: 'alto' },
      { ingrediente_id: 'hialuronico', tipo: 'complementario', descripcion: 'Salud de la piel', nivel: 'alto' },
      { ingrediente_id: 'biotina', tipo: 'complementario', descripcion: 'Salud de piel, pelo, uñas', nivel: 'medio' }
    ]
  },

  'creatina': {
    id: 'creatina',
    nombre: 'Creatina',
    categoria: 'otros',
    descripcion: 'Compuesto que mejora rendimiento deportivo y función cognitiva.',
    mecanismo_accion: 'Aumenta ATP muscular, eleva fosfocreatina, mejora rendimiento en ejercicios de alta intensidad.',
    beneficios: [
      'Rendimiento deportivo',
      'Fuerza muscular',
      'Recuperación',
      'Función cognitiva',
      'Masa muscular',
      'Densidad ósea'
    ],
    dosis_recomendada: '3-5g/día',
    sinergias: [
      { ingrediente_id: 'bcaa', tipo: 'complementario', descripcion: 'Rendimiento muscular', nivel: 'medio' },
      { ingrediente_id: 'cafeina', tipo: 'antagonismo', descripcion: 'Puede reducir efectos de creatina', nivel: 'bajo' }
    ]
  },

  'cafeina': {
    id: 'cafeina',
    nombre: 'Cafeína',
    categoria: 'otros',
    descripcion: 'Estimulante natural del sistema nervioso central.',
    mecanismo_accion: 'Antagonista de receptores de adenosina, aumenta liberación de catecolaminas.',
    beneficios: [
      'Aumento de energía',
      'Enfoque mental',
      'Rendimiento deportivo',
      'Metabolismo',
      'Estado de alerta'
    ],
    dosis_recomendada: '100-400mg/día',
    sinergias: [
      { ingrediente_id: 'l_teanina', tipo: 'equilibrador', descripcion: 'Reduce jitter, mejora focus', nivel: 'alto' },
      { ingrediente_id: 'creatina', tipo: 'equilibrador', descripcion: 'Energía', nivel: 'medio' },
      { ingrediente_id: 'green_tea', tipo: 'complementario', descripcion: 'L-teanina natural', nivel: 'alto' }
    ],
    antagonismos: [
      { ingrediente_id: 'l_teanina', tipo: 'equilibrador', descripcion: 'Neutraliza efectos negativos de cafeína', nivel: 'alto' }
    ]
  },

  'coq10': {
    id: 'coq10',
    nombre: 'Coenzima Q10 (CoQ10)',
    categoria: 'otros',
    descripcion: 'Antioxidante celular esencial para producción de energía mitocondrial.',
    mecanismo_accion: 'Transportador de electrones en cadena respiratoria, antioxidante en membranas.',
    beneficios: [
      'Producción de energía celular',
      'Antioxidante potente',
      'Salud cardíaca',
      'Función mitocondrial',
      'Piel anti-edad'
    ],
    dosis_recomendada: '100-300mg/día',
    sinergias: [
      { ingrediente_id: 'omega_3', tipo: 'complementario', descripcion: 'Salud cardiovascular', nivel: 'alto' },
      { ingrediente_id: 'magnesio', tipo: 'complementario', descripcion: 'Producción de energía', nivel: 'medio' },
      { ingrediente_id: 'vitamina_e', tipo: 'potenciador', descripcion: 'Antioxidantes sinérgicos', nivel: 'medio' }
    ]
  },

  'ala': {
    id: 'ala',
    nombre: 'Ácido Alfa Lipoico (ALA)',
    categoria: 'otros',
    descripcion: 'Antioxidante universal que protege contra daño oxidativo y mejora glucosa.',
    mecanismo_accion: 'Antioxidante hidrosoluble y liposoluble, regenera otros antioxidantes, mejora sensibilidad a insulina.',
    beneficios: [
      'Antioxidante universal',
      'Control de glucosa',
      'Función hepática',
      'Neuroprotección',
      'Anti-edad'
    ],
    dosis_recomendada: '300-600mg/día',
    sinergias: [
      { ingrediente_id: 'biotina', tipo: 'complementario', descripcion: 'Absorción competitiva - tomar separado', nivel: 'bajo' },
      { ingrediente_id: 'vitamina_c', tipo: 'potenciador', descripcion: 'Antioxidantes sinérgicos', nivel: 'medio' }
    ]
  },

  'biotina': {
    id: 'biotina',
    nombre: 'Biotina (Vitamina B7)',
    categoria: 'otros',
    descripcion: 'Vitamina esencial para metabolismo, cabello, piel y uñas.',
    mecanismo_accion: 'Cofactor de carboxilasas, metabolismo de carbohidratos, grasas, proteínas.',
    beneficios: [
      'Salud del cabello',
      'Uñas fuertes',
      'Piel saludable',
      'Metabolismo',
      'Función celular'
    ],
    dosis_recomendada: '30-100mcg/día (dosis cosméticas: 2.5-5mg)',
    sinergias: [
      { ingrediente_id: 'colageno', tipo: 'complementario', descripcion: 'Salud de piel, pelo, uñas', nivel: 'alto' },
      { ingrediente_id: 'zinc', tipo: 'complementario', descripcion: 'Salud de piel', nivel: 'medio' }
    ]
  },

  'hialuronico': {
    id: 'hialuronico',
    nombre: 'Ácido Hialurónico',
    categoria: 'otros',
    descripcion: 'Molécula que hidrata y lubrica tejidos, esencial para articulaciones y piel.',
    mecanismo_accion: 'Retiene agua (hasta 1000x su peso), lubricación articular, hidratación de piel.',
    beneficios: [
      'Hidratación de la piel',
      'Salud articular',
      'Lubricación',
      'Ojos secos',
      'Anti-edad'
    ],
    dosis_recomendada: '100-200mg/día',
    sinergias: [
      { ingrediente_id: 'colageno', tipo: 'potenciador', descripcion: 'Salud de la piel', nivel: 'alto' },
      { ingrediente_id: 'vitamina_c', tipo: 'complementario', descripcion: 'Síntesis de colágeno', nivel: 'medio' }
    ]
  },

  'melatonina': {
    id: 'melatonina',
    nombre: 'Melatonina',
    categoria: 'otros',
    descripcion: 'Hormona que regula el ciclo sueño-vigilia.',
    mecanismo_accion: 'Hormona pineal que indica oscuridad al cuerpo, inicia procesos de sueño.',
    beneficios: [
      'Regulación del sueño',
      'Onset del sueño',
      'Calidad del sueño',
      'Jet lag',
      'Antioxidante'
    ],
    dosis_recomendada: '0.5-5mg/día (bajar dosis es mejor)',
    sinergias: [
      { ingrediente_id: 'magnesio', tipo: 'complementario', descripcion: 'Relaxación y sueño', nivel: 'alto' },
      { ingrediente_id: 'glicina', tipo: 'complementario', descripcion: 'Mejor sueño', nivel: 'medio' }
    ]
  },

  'folato': {
    id: 'folato',
    nombre: 'Folato (Vitamina B9)',
    categoria: 'otros',
    descripcion: 'Vitamina esencial para síntesis de ADN, división celular y formación de sangre.',
    mecanismo_accion: 'Donador de metilo en síntesis de purinas, pirimidinas, conversión de homocisteína.',
    beneficios: [
      'Síntesis de ADN',
      'Formación de sangre',
      'Función neurológica',
      'Embarazo',
      'Metabolismo de homocisteína'
    ],
    dosis_recomendada: '400mcg/día (800mcg en embarazo)',
    sinergias: [
      { ingrediente_id: 'vitamina_b12', tipo: 'complementario', descripcion: 'Vías metabólicas relacionadas', nivel: 'alto' },
      { ingrediente_id: 'hierro', tipo: 'complementario', descripcion: 'Formación de sangre', nivel: 'medio' }
    ]
  },

  'cartilago_de_tiburon': {
    id: 'cartilago_de_tiburon',
    nombre: 'Cartílago de Tiburón',
    categoria: 'otros',
    descripcion: 'Fuente de sulfato de condroitina y glucosamina para articulaciones.',
    mecanismo_accion: 'Contiene condroitín sulfato, glucosamina, minerales; antiinflamatorio articular.',
    beneficios: [
      'Salud articular',
      'Antiinflamatorio',
      'Movilidad',
      'Flexibilidad'
    ],
    dosis_recomendada: '1-2g/día',
    sinergias: [
      { ingrediente_id: 'colageno', tipo: 'complementario', descripcion: 'Salud articular', nivel: 'alto' },
      { ingrediente_id: 'glucosamina', tipo: 'potenciador', descripcion: 'Componentes del cartílago', nivel: 'alto' }
    ]
  },

  'glucosamina': {
    id: 'glucosamina',
    nombre: 'Glucosamina',
    categoria: 'otros',
    descripcion: 'Aminoazúcar que forma parte del cartílago articular.',
    mecanismo_accion: 'Precursor de glicosaminoglicanos, protege articulaciones, estimula síntesis de colágeno.',
    beneficios: [
      'Salud articular',
      'Movilidad',
      'Protección del cartílago',
      'Reducción de dolor'
    ],
    dosis_recomendada: '1500mg/día',
    sinergias: [
      { ingrediente_id: 'condroitina', tipo: 'potenciador', descripcion: 'Componentes del cartílago', nivel: 'alto' },
      { ingrediente_id: 'colageno', tipo: 'complementario', descripcion: 'Salud articular', nivel: 'medio' }
    ]
  },

  'condroitina': {
    id: 'condroitina',
    nombre: 'Sulfato de Condroitina',
    categoria: 'otros',
    descripcion: 'Componente del cartílago que atrae agua y nutrientes.',
    mecanismo_accion: 'Atrae agua al cartílago, inhibe enzimas destructivas,lubrica articulaciones.',
    beneficios: [
      'Salud articular',
      'Elasticidad del cartílago',
      'Movilidad',
      'Antiinflamatorio'
    ],
    dosis_recomendada: '800-1200mg/día',
    sinergias: [
      { ingrediente_id: 'glucosamina', tipo: 'potenciador', descripcion: 'Componentes del cartílago', nivel: 'alto' },
      { ingrediente_id: 'msm', tipo: 'complementario', descripcion: 'Salud articular', nivel: 'medio' }
    ]
  },

  'msm': {
    id: 'msm',
    nombre: 'MSM (Metilsulfonilmetano)',
    categoria: 'otros',
    descripcion: 'Compuesto de azufre orgánico con propiedades antiinflamatorias.',
    mecanismo_accion: 'Fuente de azufre para colágeno, queratina; antiinflamatorio natural.',
    beneficios: [
      'Antiinflamatorio',
      'Salud articular',
      'Detoxificación',
      'Piel, pelo, uñas',
      'Alivio muscular'
    ],
    dosis_recomendada: '1-3g/día',
    sinergias: [
      { ingrediente_id: 'glucosamina', tipo: 'complementario', descripcion: 'Salud articular', nivel: 'alto' },
      { ingrediente_id: 'colageno', tipo: 'complementario', descripcion: 'Azufre para colágeno', nivel: 'medio' }
    ]
  },

  'pimienta_negra': {
    id: 'pimpera_negra',
    nombre: 'Pimienta Negra (Piperina)',
    categoria: 'otros',
    descripcion: 'Extracto de pimienta negra que aumenta absorción de nutrientes.',
    mecanismo_accion: 'Piperina inhibe enzimas hepáticas, aumenta biodisponibilidad de nutrientes hasta 2000%.',
    beneficios: [
      'Aumenta absorción',
      'Biodisponibilidad',
      'Metabolismo'
    ],
    dosis_recomendada: '5-20mg de piperina/día',
    sinergias: [
      { ingrediente_id: 'curcuma', tipo: 'potenciador', descripcion: 'Aumenta absorción de curcumina 2000%', nivel: 'alto' },
      { ingrediente_id: 'coq10', tipo: 'potenciador', descripcion: 'Mayor absorción', nivel: 'medio' }
    ]
  },

  'green_tea': {
    id: 'green_tea',
    nombre: 'Té Verde (Camellia sinensis)',
    categoria: 'botanicos',
    descripcion: 'Fuente de catequinas, EGCG y L-teanina para metabolismo y cognición.',
    mecanismo_accion: 'EGCG inhibe catecol-O-metiltransferasa, L-teanina aumenta ondas alfa.',
    beneficios: [
      'Antioxidante potente',
      'Metabolismo',
      'Cognición',
      'Salud cardiovascular',
      'Quema de grasa'
    ],
    dosis_recomendada: '2-3 tazas o 500mg de catequinas',
    sinergias: [
      { ingrediente_id: 'cafeina', tipo: 'equilibrador', descripcion: 'L-teanina suaviza cafeína', nivel: 'alto' },
      { ingrediente_id: 'l_teanina', tipo: 'complementario', descripcion: 'L-teanina natural', nivel: 'alto' }
    ]
  },

  'diente_de_leon': {
    id: 'diente_de_leon',
    nombre: 'Diente de León (Taraxacum officinale)',
    categoria: 'botanicos',
    descripcion: 'Hierba con propiedades depurativas y diuréticas.',
    mecanismo_accion: 'Diurético natural, apoyo hepático, rica en potasio y antioxidantes.',
    beneficios: [
      'Depuración',
      'Diurético natural',
      'Apoyo hepático',
      'Digestión',
      'Antioxidante'
    ],
    dosis_recomendada: '2-8g/día de hojas o raíz',
    sinergias: [
      { ingrediente_id: 'estigmas_de_maiz', tipo: 'complementario', descripcion: 'Efectos diuréticos', nivel: 'alto' },
      { ingrediente_id: 'potasio', tipo: 'equilibrador', descripcion: 'Reposición de potasio', nivel: 'alto' }
    ]
  },

  'pygeum': {
    id: 'pygeum',
    nombre: 'Pygeum (Pygeum africanum)',
    categoria: 'botanicos',
    descripcion: 'Corteza africana para salud prostática masculina.',
    mecanismo_accion: 'Antiinflamatorio prostático, inhibe 5α-reductasa, reduce DHT.',
    beneficios: [
      'Salud prostática',
      'Flujo urinario',
      'Antiinflamatorio prostático'
    ],
    dosis_recomendada: '50-100mg/día de extracto',
    sinergias: [
      { ingrediente_id: 'saw_palmetto', tipo: 'potenciador', descripcion: 'Salud prostática', nivel: 'alto' },
      { ingrediente_id: 'zinc', tipo: 'complementario', descripcion: 'Salud prostática', nivel: 'medio' }
    ]
  },

  'lactobacillus': {
    id: 'lactobacillus',
    nombre: 'Lactobacillus (Probiótico)',
    categoria: 'probioticos',
    descripcion: 'Género de bacterias lácticas beneficiosas para intestino y vagina.',
    mecanismo_accion: 'Colonización del intestino delgado, producción de ácido láctico, inhibición de patógenos.',
    beneficios: [
      'Salud intestinal',
      'Inmunidad',
      'Síntesis de vitaminas',
      'Salud vaginal'
    ],
    dosis_recomendada: '10-20 mil millones UFC',
    sinergias: [
      { ingrediente_id: 'prebioticos', tipo: 'potenciador', descripcion: 'Synbiotics', nivel: 'alto' },
      { ingrediente_id: 'l_glutamina', tipo: 'complementario', descripcion: 'Salud intestinal', nivel: 'medio' }
    ]
  },

  'bifidobacterium': {
    id: 'bifidobacterium',
    nombre: 'Bifidobacterium (Probiótico)',
    categoria: 'probioticos',
    descripcion: 'Género bacteriano dominante del intestino grueso, esencial para salud.',
    mecanismo_accion: 'Colonización del intestino grueso, producción de acetato y lactato, inhibición de patógenos.',
    beneficios: [
      'Salud intestinal',
      'Inmunidad',
      'Producción de SCFA',
      'Digestión'
    ],
    dosis_recomendada: '10-20 mil millones UFC',
    sinergias: [
      { ingrediente_id: 'prebioticos', tipo: 'potenciador', descripcion: 'Synbiotics', nivel: 'alto' },
      { ingrediente_id: 'lactobacillus', tipo: 'complementario', descripcion: 'Flora diversa', nivel: 'alto' }
    ]
  },

  'resveratrol': {
    id: 'resveratrol',
    nombre: 'Resveratrol',
    categoria: 'botanicos',
    descripcion: 'Polifenol del vino tinto con propiedades antienvejecimiento.',
    mecanismo_accion: 'Activador de sirtuinas (SIRT1), antioxidante, antiinflamatorio, cardioprotector.',
    beneficios: [
      'Anti-edad',
      'Antioxidante',
      'Salud cardiovascular',
      'Neuroprotección',
      'Antiinflamatorio'
    ],
    dosis_recomendada: '150-500mg/día',
    sinergias: [
      { ingrediente_id: 'curcuma', tipo: 'potenciador', descripcion: 'Antiinflamatorio', nivel: 'alto' },
      { ingrediente_id: 'omega_3', tipo: 'complementario', descripcion: 'Salud cardiovascular', nivel: 'medio' }
    ]
  },

  'quercetina': {
    id: 'quercetina',
    nombre: 'Quercetina',
    categoria: 'botanicos',
    descripcion: 'Flavonoide con propiedades antioxidantes y antiinflamatorias.',
    mecanismo_accion: 'Estabiliza mastocitos, antioxidante potente, antiviral, antiinflamatorio.',
    beneficios: [
      'Antioxidante',
      'Antiinflamatorio',
      'Antiviral',
      'Alergias',
      'Función inmune'
    ],
    dosis_recomendada: '500-1000mg/día',
    sinergias: [
      { ingrediente_id: 'vitamina_c', tipo: 'potenciador', descripcion: 'Sinergia antioxidante', nivel: 'alto' },
      { ingrediente_id: 'zinc', tipo: 'complementario', descripcion: 'Función inmune', nivel: 'medio' }
    ]
  },

  'betaina': {
    id: 'betaina',
    nombre: 'Betaína (Trimetilglicina)',
    categoria: 'otros',
    descripcion: 'Compuesto que apoya función hepática y niveles de homocisteína.',
    mecanismo_accion: 'Donador de metilo en ciclo de metionina, osmprotector, apoyo hepático.',
    beneficios: [
      'Función hepática',
      'Metabolismo de homocisteína',
      'Digestión',
      'Composición corporal'
    ],
    dosis_recomendada: '1.5-3g/día',
    sinergias: [
      { ingrediente_id: 'folato', tipo: 'complementario', descripcion: 'Metabolismo de homocisteína', nivel: 'alto' },
      { ingrediente_id: 'vitamina_b12', tipo: 'complementario', descripcion: 'Metabolismo de homocisteína', nivel: 'alto' }
    ]
  },

  'fosfatidilserina': {
    id: 'fosfatidilserina',
    nombre: 'Fosfatidilserina',
    categoria: 'otros',
    descripcion: 'Fosfolípido esencial para función cognitiva y membranas celulares.',
    mecanismo_accion: 'Componente de membranas neuronales, mejora comunicación celular, función cognitiva.',
    beneficios: [
      'Función cognitiva',
      'Memoria',
      'Concentración',
      'Manejo del estrés',
      'Ánimo'
    ],
    dosis_recomendada: '100-300mg/día',
    sinergias: [
      { ingrediente_id: 'omega_3', tipo: 'potenciador', descripcion: 'Membranas celulares', nivel: 'alto' },
      { ingrediente_id: 'ginkgo_biloba', tipo: 'complementario', descripcion: 'Función cognitiva', nivel: 'medio' }
    ]
  },

  'nac': {
    id: 'nac',
    nombre: 'NAC (N-Acetilcisteína)',
    categoria: 'otros',
    descripcion: 'Precursor de glutatión con propiedades antioxidantes y detoxificantes.',
    mecanismo_accion: 'Precursor de glutatión (antioxidante maestro), mucolítico, modulador de glutamato.',
    beneficios: [
      'Antioxidante potente',
      'Detoxificación hepática',
      'Salud respiratoria',
      'Función cerebral',
      'Apoyo inmunológico'
    ],
    dosis_recomendada: '600-1800mg/día',
    sinergias: [
      { ingrediente_id: 'selenio', tipo: 'potenciador', descripcion: 'Producción de glutatión', nivel: 'alto' },
      { ingrediente_id: 'vitamina_c', tipo: 'complementario', descripcion: 'Antioxidantes', nivel: 'medio' }
    ]
  },

  'taurina': {
    id: 'taurina',
    nombre: 'Taurina',
    categoria: 'aminoacidos',
    descripcion: 'Aminoácido condicionalmente esencial para corazón, cerebro y músculos.',
    mecanismo_accion: 'Antioxidante, regulador de calcio, osmprotector, función cardíaca y neural.',
    beneficios: [
      'Función cardíaca',
      'Antioxidante',
      'Función cerebral',
      'Rendimiento deportivo',
      'Salud metabólica'
    ],
    dosis_recomendada: '500-3000mg/día',
    sinergias: [
      { ingrediente_id: 'magnesio', tipo: 'complementario', descripcion: 'Función cardíaca y muscular', nivel: 'medio' },
      { ingrediente_id: 'omega_3', tipo: 'complementario', descripcion: 'Salud cardiovascular', nivel: 'medio' }
    ]
  }
};

// Función de búsqueda
export function findIngredient(searchTerm: string): IngredientInfo | undefined {
  const normalized = searchTerm.toLowerCase().trim();
  
  // Búsqueda exacta por ID
  if (KNOWLEDGE_BASE[normalized]) {
    return KNOWLEDGE_BASE[normalized];
  }
  
  // Búsqueda por nombre
  for (const key of Object.keys(KNOWLEDGE_BASE)) {
    const info = KNOWLEDGE_BASE[key];
    if (info.nombre.toLowerCase().includes(normalized) || 
        (info.nombre_latin && info.nombre_latin.toLowerCase().includes(normalized))) {
      return info;
    }
  }
  
  return undefined;
}

// Obtener todos los ingredientes de una categoría
export function getIngredientsByCategory(categoria: IngredientInfo['categoria']): IngredientInfo[] {
  return Object.values(KNOWLEDGE_BASE).filter(i => i.categoria === categoria);
}

// Obtener sinergias de un ingrediente
export function getSynergies(ingredientId: string): IngredientInfo[] {
  const ingredient = KNOWLEDGE_BASE[ingredientId];
  if (!ingredient) return [];
  
  return ingredient.sinergias
    .map(s => KNOWLEDGE_BASE[s.ingrediente_id])
    .filter(Boolean);
}

// Verificar si dos ingredientes tienen sinergia
export function checkSynergy(ingredientId1: string, ingredientId2: string): SynergyRelation | undefined {
  const ing1 = KNOWLEDGE_BASE[ingredientId1];
  if (!ing1) return undefined;
  
  return ing1.sinergias.find(s => s.ingrediente_id === ingredientId2);
}

export default KNOWLEDGE_BASE;
