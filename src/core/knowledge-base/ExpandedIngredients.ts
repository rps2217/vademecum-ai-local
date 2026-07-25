/**
 * Base de Conocimiento Extendida - +200 Ingredientes
 * 
 * Ingredientes organizados por categoría con información completa
 * incluyendo contraindicaciones médicas.
 */

import { IngredientInfo, type IngredientCategory, type HealthObjective, type Contraindicacion } from './ingredients';

// Helper para crear ingrediente completo
function createIngredient(
  id: string,
  nombre: string,
  categoria: IngredientCategory,
  descripcion: string,
  mecanismo: string,
  beneficios: string[],
  objetivos: HealthObjective[],
  sinergias: { id: string; tipo: 'potenciador' | 'complementario' | 'cofactor'; desc: string; nivel: 'alto' | 'medio' | 'bajo' }[],
  opts: {
    nombreLatin?: string;
    dosis?: string;
    fuentes?: string[];
    contraindicaciones?: Contraindicacion[];
  } = {}
): IngredientInfo {
  return {
    id,
    nombre,
    nombre_latin: opts.nombreLatin,
    categoria,
    descripcion,
    mecanismo_accion: mecanismo,
    beneficios,
    dosis_recomendada: opts.dosis,
    fuentes_alimentarias: opts.fuentes,
    contraindicaciones: opts.contraindicaciones || [],
    objetivos_salud: objetivos,
    sinergias: sinergias.map(s => ({
      ingrediente_id: s.id,
      tipo: s.tipo,
      descripcion: s.desc,
      nivel: s.nivel
    })),
    antagonismos: []
  };
}

// Base de conocimiento extendida
export const KNOWLEDGE_BASE_EXPANDED: Record<string, IngredientInfo> = {

  // ==================== VITAMINAS ====================
  
  // Vitaminas Liposolubles
  'vitamina_a': createIngredient('vitamina_a', 'Vitamina A (Retinol)', 'vitaminas',
    'Vitamina liposoluble esencial para visión, sistema inmunológico y salud de la piel.',
    'Precursor del retinal, esencial para función visual, diferenciación celular e inmunidad.',
    ['Salud visual', 'Inmunidad', 'Piel sana', 'Crecimiento celular'],
    ['inmunidad', 'piel', 'vision'],
    [
      { id: 'zinc', tipo: 'cofactor', desc: 'Zinc necesario para transporte de vitamina A', nivel: 'alto' },
      { id: 'vitamina_e', tipo: 'potenciador', desc: 'Protege vitamina A de oxidación', nivel: 'medio' }
    ],
    { dosis: '700-900mcg/día', fuentes: ['Hígado', 'Zanahorias', 'Camote', 'Espinacas'] }
  ),

  'vitamina_d2': createIngredient('vitamina_d2', 'Vitamina D2 (Ergocalciferol)', 'vitaminas',
    'Vitamina D de origen vegetal, esencial para metabolismo del calcio.',
    'Se convierte en ergocalciferol, luego a 25(OH)D en hígado.',
    ['Metabolismo del calcio', 'Salud ósea', 'Función inmune'],
    ['huesos', 'inmunidad'],
    [
      { id: 'calcio', tipo: 'potenciador', desc: 'Mejora absorción de calcio', nivel: 'alto' },
      { id: 'magnesio', tipo: 'cofactor', desc: 'Cofactor en activación', nivel: 'alto' }
    ],
    { dosis: '600-800 UI/día' }
  ),

  'vitamina_k1': createIngredient('vitamina_k1', 'Vitamina K1 (Fitomenadiona)', 'vitaminas',
    'Vitamina liposoluble esencial para coagulación sanguínea.',
    'Cofactor de gamma-glutamil carboxilasa, esencial para factores de coagulación.',
    ['Coagulación', 'Salud ósea', 'Prevención de hemorragias'],
    ['huesos', 'corazon'],
    [
      { id: 'vitamina_d3', tipo: 'potenciador', desc: 'Trabajan juntos en metabolismo del calcio', nivel: 'alto' },
      { id: 'calcio', tipo: 'complementario', desc: 'Dirección del calcio a huesos', nivel: 'alto' }
    ],
    { dosis: '90-120mcg/día' }
  ),

  // Vitaminas Hidrosolubles
  'vitamina_b1': createIngredient('vitamina_b1', 'Vitamina B1 (Tiamina)', 'vitaminas',
    'Vitamina esencial para metabolismo energético y función nerviosa.',
    'Cofactor en metabolismo de carbohidratos, función neurológica.',
    ['Metabolismo energético', 'Función nerviosa', 'Función cardíaca'],
    ['energia', 'cerebro'],
    [
      { id: 'vitaminas_b', tipo: 'complementario', desc: 'Parte del complejo B', nivel: 'alto' },
      { id: 'magnesio', tipo: 'cofactor', desc: 'Cofactor en utilización', nivel: 'alto' }
    ],
    { dosis: '1.1-1.2mg/día' }
  ),

  'vitamina_b2': createIngredient('vitamina_b2', 'Vitamina B2 (Riboflavina)', 'vitaminas',
    'Vitamina esencial para metabolismo energético y salud de la piel.',
    'Precursor de FAD y FMN, coenzimas en cadena respiratoria.',
    ['Metabolismo energético', 'Salud de piel', 'Producción de energía'],
    ['energia', 'piel'],
    [
      { id: 'vitaminas_b', tipo: 'complementario', desc: 'Parte del complejo B', nivel: 'alto' },
      { id: 'hierro', tipo: 'complementario', desc: 'Metabolismo del hierro', nivel: 'medio' }
    ],
    { dosis: '1.1-1.3mg/día' }
  ),

  'vitamina_b3': createIngredient('vitamina_b3', 'Vitamina B3 (Niacina)', 'vitaminas',
    'Vitamina esencial para metabolismo energético y reparación de ADN.',
    'Precursor de NAD+/NADP+, esencial para reacciones redox.',
    ['Metabolismo energético', 'Colesterol', 'Función cerebral'],
    ['energia', 'corazon', 'cerebro'],
    [
      { id: 'vitaminas_b', tipo: 'complementario', desc: 'Parte del complejo B', nivel: 'alto' },
      { id: 'triptofano', tipo: 'precursor', desc: 'Precursor en síntesis', nivel: 'medio' }
    ],
    { dosis: '14-16mg/día', contraindicaciones: [
      { condicion: 'higado', nivel: 'precaución', desc: 'Altas dosis pueden afectar hígado' }
    ]}
  ),

  'folato': createIngredient('folato', 'Folato (Vitamina B9)', 'vitaminas',
    'Vitamina esencial para síntesis de ADN, división celular y formación de sangre.',
    'Donador de metilo en síntesis de purinas, pirimidinas.',
    ['Síntesis de ADN', 'Formación de sangre', 'Desarrollo fetal'],
    ['cerebro', 'fertilidad'],
    [
      { id: 'vitamina_b12', tipo: 'complementario', desc: 'Vías metabólicas relacionadas', nivel: 'alto' },
      { id: 'hierro', tipo: 'complementario', desc: 'Formación de sangre', nivel: 'alto' }
    ],
    { dosis: '400mcg/día', fuentes: ['Espinacas', 'Legumbres', 'Aguacate'] }
  ),

  'vitamina_b5': createIngredient('vitamina_b5', 'Vitamina B5 (Ácido Pantoténico)', 'vitaminas',
    'Vitamina esencial para síntesis de coenzima A y metabolismo energético.',
    'Precursor de CoA, esencial para metabolismo de carbohidratos y grasas.',
    ['Metabolismo energético', 'Producción de hormonas', 'Salud de la piel'],
    ['energia', 'piel'],
    [
      { id: 'vitaminas_b', tipo: 'complementario', desc: 'Parte del complejo B', nivel: 'alto' },
      { id: 'biotina', tipo: 'complementario', desc: 'Metabolismo relacionado', nivel: 'medio' }
    ],
    { dosis: '5mg/día' }
  ),

  'biotina': createIngredient('biotina', 'Biotina (Vitamina B7)', 'vitaminas',
    'Vitamina esencial para metabolismo, cabello, piel y uñas.',
    'Cofactor de carboxilasas, metabolismo de carbohidratos y grasas.',
    ['Salud del cabello', 'Uñas fuertes', 'Piel saludable', 'Metabolismo'],
    ['energia', 'piel'],
    [
      { id: 'colageno', tipo: 'complementario', desc: 'Salud de piel, pelo, uñas', nivel: 'alto' },
      { id: 'zinc', tipo: 'complementario', desc: 'Salud de piel', nivel: 'medio' }
    ],
    { dosis: '30-100mcg/día' }
  ),

  // ==================== MINERALES ====================
  
  'calcio': createIngredient('calcio', 'Calcio', 'minerales',
    'Mineral más abundante del cuerpo, esencial para huesos, dientes y función celular.',
    'Componente estructural de huesos, esencial para contracciones musculares.',
    ['Salud ósea', 'Función muscular', 'Coagulación', 'Transmisión nerviosa'],
    ['huesos', 'articula'],
    [
      { id: 'vitamina_d3', tipo: 'potenciador', desc: 'Esencial para absorción', nivel: 'alto' },
      { id: 'vitamina_k2', tipo: 'complementario', desc: 'Dirección del calcio a huesos', nivel: 'alto' },
      { id: 'magnesio', tipo: 'equilibrador', desc: 'Equilibrio mineral importante', nivel: 'alto' }
    ],
    { dosis: '1000-1200mg/día', fuentes: ['Lácteos', 'Brócoli', 'Salmón'] }
  ),

  'hierro': createIngredient('hierro', 'Hierro', 'minerales',
    'Mineral esencial para transporte de oxígeno y formación de hemoglobina.',
    'Componente de hemoglobina, mioglobina y enzimas respiratorias.',
    ['Transporte de oxígeno', 'Formación de hemoglobina', 'Energía', 'Inmunidad'],
    ['energia', 'inmunidad'],
    [
      { id: 'vitamina_c', tipo: 'potenciador', desc: 'Mejora absorción de hierro no hemo', nivel: 'alto' },
      { id: 'folato', tipo: 'complementario', desc: 'Formación de sangre', nivel: 'alto' },
      { id: 'vitamina_b12', tipo: 'complementario', desc: 'Maduración de glóbulos rojos', nivel: 'alto' }
    ],
    { dosis: '8-18mg/día', fuentes: ['Carne roja', 'Espinacas', 'Lentejas'] }
  ),

  'zinc': createIngredient('zinc', 'Zinc', 'minerales',
    'Mineral esencial para más de 300 enzimas, función inmune y cicatrización.',
    'Cofactor de metaloenzimas, estructura de proteínas.',
    ['Inmunidad', 'Cicatrización', 'Metabolismo', 'Crecimiento'],
    ['inmunidad', 'articula'],
    [
      { id: 'vitamina_c', tipo: 'complementario', desc: 'Sinergia inmunológica', nivel: 'alto' },
      { id: 'selenio', tipo: 'potenciador', desc: 'Protección antioxidante', nivel: 'alto' },
      { id: 'magnesio', tipo: 'complementario', desc: 'Absorción competitiva', nivel: 'medio' }
    ],
    { dosis: '8-11mg/día', fuentes: ['Ostras', 'Carne', 'Semillas'] }
  ),

  'magnesio': createIngredient('magnesio', 'Magnesio', 'minerales',
    'Mineral esencial para más de 600 reacciones enzimáticas.',
    'Cofactor de ATP, contracciones musculares, transmisión nerviosa.',
    ['Relajación muscular', 'Función nerviosa', 'Sueño', 'Corazón'],
    ['sueno', 'articula', 'energia'],
    [
      { id: 'vitamina_b6', tipo: 'cofactor', desc: 'Mejora absorción y utilización', nivel: 'alto' },
      { id: 'vitamina_d3', tipo: 'cofactor', desc: 'Cofactor en metabolismo de vitamina D', nivel: 'alto' },
      { id: 'calcio', tipo: 'equilibrador', desc: 'Equilibrio calcio-magnesio importante', nivel: 'alto' }
    ],
    { dosis: '310-420mg/día', fuentes: ['Chocolate negro', 'Aguacate', 'Nueces'] }
  ),

  'selenio': createIngredient('selenio', 'Selenio', 'minerales',
    'Mineral traza esencial para antioxidantes y función tiroidea.',
    'Componente de selenoproteínas, metabolismo tiroideo.',
    ['Antioxidante', 'Función tiroidea', 'Inmunidad', 'Fertilidad masculina'],
    ['inmunidad', 'antioxidantes', 'fertilidad'],
    [
      { id: 'vitamina_e', tipo: 'potenciador', desc: 'Sinergia antioxidante', nivel: 'alto' },
      { id: 'zinc', tipo: 'complementario', desc: 'Protección celular', nivel: 'alto' }
    ],
    { dosis: '55mcg/día', fuentes: ['Nueces de Brasil', 'Atún', 'Huevos'] }
  ),

  'potasio': createIngredient('potasio', 'Potasio', 'minerales',
    'Mineral esencial para equilibrio de líquidos y función muscular.',
    'Principal ion intracelular, potencial de membrana.',
    ['Equilibrio electrolítico', 'Función muscular', 'Presión arterial', 'Ritmo cardíaco'],
    ['corazon', 'energia'],
    [
      { id: 'magnesio', tipo: 'complementario', desc: 'Función muscular y nerviosa', nivel: 'alto' },
      { id: 'sodio', tipo: 'equilibrador', desc: 'Equilibrio electrolítico', nivel: 'alto' }
    ],
    { dosis: '2600-3400mg/día', fuentes: ['Plátano', 'Papa', 'Espinacas'] }
  ),

  'cromo': createIngredient('cromo', 'Cromo', 'minerales',
    'Mineral traza que potencia la acción de la insulina.',
    'Componente del factor de tolerancia a glucosa (GTF).',
    ['Metabolismo de glucosa', 'Sensibilidad a insulina', 'Energía'],
    ['energia', 'peso'],
    [
      { id: 'biotina', tipo: 'complementario', desc: 'Metabolismo de carbohidratos', nivel: 'medio' },
      { id: 'magnesio', tipo: 'complementario', desc: 'Metabolismo energético', nivel: 'medio' }
    ],
    { dosis: '25-35mcg/día' }
  ),

  'yodo': createIngredient('yodo', 'Yodo', 'minerales',
    'Mineral esencial para síntesis de hormonas tiroideas.',
    'Componente de T3 y T4, desarrollo cerebral.',
    ['Función tiroidea', 'Metabolismo', 'Desarrollo cognitivo'],
    ['cerebro', 'energia'],
    [
      { id: 'selenio', tipo: 'cofactor', desc: 'Conversión de hormonas tiroideas', nivel: 'alto' }
    ],
    { dosis: '150mcg/día', fuentes: ['Sal yodada', 'Algas', 'Pescado'] }
  ),

  'hierro_bisglicinato': createIngredient('hierro_bisglicinato', 'Hierro Bisglicinato', 'minerales',
    'Forma de hierro altamente biodisponible y suave con el estómago.',
    'Quelato de hierro con glicina, alta absorción intestinal.',
    ['Transporte de oxígeno', 'Energía', 'Menos efectos secundarios'],
    ['energia', 'inmunidad'],
    [
      { id: 'vitamina_c', tipo: 'potenciador', desc: 'Mejora absorción', nivel: 'alto' },
      { id: 'folato', tipo: 'complementario', desc: 'Formación de sangre', nivel: 'alto' }
    ],
    { dosis: '18-36mg/día', contraindicaciones: [
      { condicion: 'hemocromatosis', nivel: 'absoluta', desc: 'Personas con exceso de hierro deben evitar' }
    ]}
  ),

  'magnesio_glicinato': createIngredient('magnesio_glicinato', 'Magnesio Glicinato', 'minerales',
    'Forma de magnesio altamente biodisponible y suave.',
    'Quelato de magnesio con glicina, alta absorción.',
    ['Sueño', 'Relajación', 'Menos efectos digestivos'],
    ['sueno', 'articula'],
    [
      { id: 'vitamina_b6', tipo: 'cofactor', desc: 'Mejora absorción', nivel: 'alto' },
      { id: 'glicina', tipo: 'complementario', desc: 'Efectos sedantes sinérgicos', nivel: 'alto' }
    ],
    { dosis: '200-400mg/día' }
  ),

  'zinc_picolinato': createIngredient('zinc_picolinato', 'Zinc Picolinato', 'minerales',
    'Forma de zinc altamente absorbible.',
    'Quelato de zinc con ácido picolínico.',
    ['Inmunidad', 'Piel', 'Metabolismo'],
    ['inmunidad', 'piel'],
    [
      { id: 'vitamina_c', tipo: 'complementario', desc: 'Sinergia inmunológica', nivel: 'alto' }
    ],
    { dosis: '15-30mg/día' }
  ),

  // ==================== AMINOÁCIDOS ====================
  
  'l_glutamina': createIngredient('l_glutamina', 'L-Glutamina', 'aminoacidos',
    'Aminoácido condicionalmente esencial, principal combustible de células inmunes.',
    'Fuel para células inmunes, enterocitos, precursor de glutatión.',
    ['Salud intestinal', 'Inmunidad', 'Recuperación muscular'],
    ['inmunidad', 'digestion', 'deporte'],
    [
      { id: 'zinc', tipo: 'complementario', desc: 'Función inmune', nivel: 'medio' },
      { id: 'colageno', tipo: 'complementario', desc: 'Salud intestinal', nivel: 'medio' }
    ],
    { dosis: '5-10g/día' }
  ),

  'l_arginina': createIngredient('l_arginina', 'L-Arginina', 'aminoacidos',
    'Aminoácido condicionalmente esencial, precursor de óxido nítrico.',
    'Precursor de óxido nítrico (vasodilatación), prolina, creatina.',
    ['Vasodilatación', 'Función endotelial', 'Cicatrización'],
    ['corazon', 'deporte'],
    [
      { id: 'l_citrulina', tipo: 'potenciador', desc: 'Conversión a arginina más eficiente', nivel: 'alto' },
      { id: 'ornitina', tipo: 'complementario', desc: 'Ciclo de la urea', nivel: 'medio' }
    ],
    { dosis: '2-8g/día', contraindicaciones: [
      { condicion: 'herpes', nivel: 'precaución', desc: 'Puede favorecer replicación del virus' }
    ]}
  ),

  'l_citrulina': createIngredient('l_citrulina', 'L-Citrulina', 'aminoacidos',
    'Aminoácido que se convierte en arginina y potencia óxido nítrico.',
    'Se convierte en arginina en riñones.',
    ['Vasodilatación', 'Rendimiento deportivo', 'Presión arterial'],
    ['corazon', 'deporte'],
    [
      { id: 'l_arginina', tipo: 'potenciador', desc: 'Conversión a arginina', nivel: 'alto' },
      { id: 'omega_3', tipo: 'complementario', desc: 'Salud vascular', nivel: 'medio' }
    ],
    { dosis: '3-8g/día' }
  ),

  'l_carnitina': createIngredient('l_carnitina', 'L-Carnitina', 'aminoacidos',
    'Aminoácido que transporta ácidos grasos a mitocondrias.',
    'Transportador de ácidos grasos a mitocondrias.',
    ['Metabolismo lipídico', 'Energía', 'Función cardíaca'],
    ['energia', 'corazon', 'peso'],
    [
      { id: 'coq10', tipo: 'potenciador', desc: 'Producción de energía mitocondrial', nivel: 'alto' },
      { id: 'ala', tipo: 'complementario', desc: 'Función mitocondrial', nivel: 'medio' }
    ],
    { dosis: '500-2000mg/día', fuentes: ['Carne roja', 'Lácteos'] }
  ),

  'l_teanina': createIngredient('l_teanina', 'L-Teanina', 'aminoacidos',
    'Aminoácido del té verde que promueve relajación sin somnolencia.',
    'Aumenta ondas alfa cerebrales, eleva GABA y dopamina.',
    ['Relajación', 'Enfoque mental', 'Reducción de estrés'],
    ['sueno', 'cerebro', 'antiedad'],
    [
      { id: 'gaba', tipo: 'potenciador', desc: 'Efectos sinérgicos calmantes', nivel: 'alto' },
      { id: 'cafeina', tipo: 'equilibrador', desc: 'Neutraliza jitter de cafeína', nivel: 'alto' }
    ],
    { dosis: '100-400mg/día' }
  ),

  'gaba': createIngredient('gaba', 'GABA', 'aminoacidos',
    'Principal neurotransmisor inhibitorio del SNC.',
    'Neurotransmisor inhibitorio, induce relajación.',
    ['Relajación', 'Reducción de ansiedad', 'Mejor sueño'],
    ['sueno', 'antiedad'],
    [
      { id: 'l_teanina', tipo: 'potenciador', desc: 'Mecanismos complementarios', nivel: 'alto' },
      { id: 'magnesio', tipo: 'complementario', desc: 'Relajación muscular y nerviosa', nivel: 'alto' }
    ],
    { dosis: '250-750mg/día' }
  ),

  'bcaa': createIngredient('bcaa', 'BCAA', 'aminoacidos',
    'Tres aminoácidos de cadena ramificada: leucina, isoleucina, valina.',
    'Leucina activa mTOR, síntesis proteica muscular.',
    ['Síntesis muscular', 'Reducción de fatiga', 'Recuperación'],
    ['deporte', 'articula'],
    [
      { id: 'l_glutamina', tipo: 'complementario', desc: 'Recuperación muscular', nivel: 'medio' },
      { id: 'creatina', tipo: 'complementario', desc: 'Rendimiento muscular', nivel: 'medio' }
    ],
    { dosis: '5-10g/día' }
  ),

  'creatina': createIngredient('creatina', 'Creatina', 'aminoacidos',
    'Compuesto que mejora rendimiento deportivo y función cognitiva.',
    'Aumenta ATP muscular, fosfocreatina.',
    ['Fuerza muscular', 'Rendimiento deportivo', 'Función cognitiva'],
    ['deporte', 'cerebro'],
    [
      { id: 'bcaa', tipo: 'complementario', desc: 'Rendimiento muscular', nivel: 'medio' }
    ],
    { dosis: '3-5g/día', fuentes: ['Carne roja', 'Pescado'] }
  ),

  'triptofano': createIngredient('triptofano', 'L-Triptófano', 'aminoacidos',
    'Aminoácido esencial precursor de serotonina y melatonina.',
    'Precursor de 5-HTP → serotonina → melatonina.',
    ['Estado de ánimo', 'Sueño', 'Apetito'],
    ['sueno', 'antiedad'],
    [
      { id: 'vitamina_b6', tipo: 'cofactor', desc: 'Conversión a serotonina', nivel: 'alto' },
      { id: 'magnesio', tipo: 'complementario', desc: 'Función neurológica', nivel: 'medio' }
    ],
    { dosis: '200-500mg/día' }
  ),

  'taurina': createIngredient('taurina', 'Taurina', 'aminoacidos',
    'Aminoácido para corazón, cerebro y músculos.',
    'Antioxidante, regulador de calcio, osmprotector.',
    ['Función cardíaca', 'Antioxidante', 'Rendimiento deportivo'],
    ['corazon', 'deporte'],
    [
      { id: 'magnesio', tipo: 'complementario', desc: 'Función cardíaca y muscular', nivel: 'medio' },
      { id: 'omega_3', tipo: 'complementario', desc: 'Salud cardiovascular', nivel: 'medio' }
    ],
    { dosis: '500-3000mg/día' }
  ),

  'nac': createIngredient('nac', 'NAC (N-Acetilcisteína)', 'aminoacidos',
    'Precursor de glutatión con propiedades antioxidantes.',
    'Precursor de glutatión (antioxidante maestro).',
    ['Antioxidante', 'Detoxificación hepática', 'Función cerebral'],
    ['antioxidantes', 'detox'],
    [
      { id: 'selenio', tipo: 'potenciador', desc: 'Producción de glutatión', nivel: 'alto' },
      { id: 'vitamina_c', tipo: 'complementario', desc: 'Antioxidantes', nivel: 'medio' }
    ],
    { dosis: '600-1800mg/día' }
  ),

  'glicina': createIngredient('glicina', 'Glicina', 'aminoacidos',
    'Aminoácido más simple, componente de colágeno.',
    'Neurotransmisor inhibitorio, componente de colágeno.',
    ['Calidad del sueño', 'Síntesis de colágeno', 'Función cognitiva'],
    ['sueno', 'articula'],
    [
      { id: 'colageno', tipo: 'complementario', desc: 'Componente del colágeno', nivel: 'alto' },
      { id: 'magnesio', tipo: 'complementario', desc: 'Calidad del sueño', nivel: 'medio' }
    ],
    { dosis: '3-5g/día' }
  ),

  // ==================== BOTÁNICOS ====================
  
  'ashwagandha': createIngredient('ashwagandha', 'Ashwagandha', 'botanicos',
    'Hierba adaptógena ayurvédica que reduce estrés.',
    'Modula eje HPA, reduce cortisol, aumenta DHEA-S.',
    ['Reducción de estrés', 'Adaptación', 'Sueño', 'Energía'],
    ['antiedad', 'sueno', 'energia'],
    [
      { id: 'l_teanina', tipo: 'complementario', desc: 'Reducción de estrés', nivel: 'alto' },
      { id: 'rodiola', tipo: 'potenciador', desc: 'Efectos adaptógenos sinérgicos', nivel: 'alto' }
    ],
    { dosis: '300-600mg/día' }
  ),

  'curcuma': createIngredient('curcuma', 'Cúrcuma', 'botanicos',
    'Especie con potente antiinflamatorio natural (curcumina).',
    'Inhibe NF-κB, COX-2, LOX.',
    ['Antiinflamatorio', 'Antioxidante', 'Salud articular', 'Cognición'],
    ['articula', 'antioxidantes', 'cerebro'],
    [
      { id: 'jengibre', tipo: 'potenciador', desc: 'Absorción y efectos antiinflamatorios', nivel: 'alto' },
      { id: 'omega_3', tipo: 'potenciador', desc: 'Efectos antiinflamatorios sinérgicos', nivel: 'alto' },
      { id: 'pimienta_negra', tipo: 'potenciador', desc: 'Piperina aumenta absorción 2000%', nivel: 'alto' }
    ],
    { dosis: '500-2000mg/día' }
  ),

  'jengibre': createIngredient('jengibre', 'Jengibre', 'botanicos',
    'Raíz con propiedades antiinflamatorias y anti-náusea.',
    'Inhibe COX y leucotrienos.',
    ['Antiinflamatorio', 'Digestión', 'Dolor articular'],
    ['articula', 'digestion'],
    [
      { id: 'curcuma', tipo: 'potenciador', desc: 'Efectos antiinflamatorios sinérgicos', nivel: 'alto' }
    ],
    { dosis: '1-3g/día' }
  ),

  'ginkgo_biloba': createIngredient('ginkgo_biloba', 'Ginkgo Biloba', 'botanicos',
    'Hierba milenaria para circulación cerebral.',
    'Vasodilatador cerebral, inhibe factor de activación plaquetaria.',
    ['Circulación cerebral', 'Memoria', 'Concentración'],
    ['cerebro', 'vision'],
    [
      { id: 'bacopa', tipo: 'potenciador', desc: 'Función cognitiva', nivel: 'alto' },
      { id: 'omega_3', tipo: 'complementario', desc: 'Salud cerebrovascular', nivel: 'alto' }
    ],
    { dosis: '120-240mg/día' }
  ),

  'bacopa': createIngredient('bacopa', 'Bacopa monnieri', 'botanicos',
    'Hierba ayurvédica para memoria y aprendizaje.',
    'Modula acetilcolina, aumenta neuroplasticidad.',
    ['Memoria', 'Aprendizaje', 'Función cognitiva', 'Reducción de ansiedad'],
    ['cerebro', 'antiedad'],
    [
      { id: 'ginkgo_biloba', tipo: 'potenciador', desc: 'Función cognitiva', nivel: 'alto' }
    ],
    { dosis: '300-450mg/día' }
  ),

  'rodiola': createIngredient('rodiola', 'Rodiola', 'botanicos',
    'Adaptógeno para resistencia al estrés y energía.',
    'Activa AMPK, aumenta norepinefrina y dopamina.',
    ['Adaptación al estrés', 'Energía mental', 'Reducción de fatiga'],
    ['energia', 'antiedad'],
    [
      { id: 'ashwagandha', tipo: 'potenciador', desc: 'Efectos adaptógenos sinérgicos', nivel: 'alto' }
    ],
    { dosis: '200-600mg/día' }
  ),

  'valeriana': createIngredient('valeriana', 'Valeriana', 'botanicos',
    'Hierba tradicional para mejorar el sueño.',
    'Modula receptores GABA-A.',
    ['Mejor sueño', 'Reducción de ansiedad', 'Relajación'],
    ['sueno', 'antiedad'],
    [
      { id: 'gaba', tipo: 'potenciador', desc: 'Mecanismos complementarios', nivel: 'alto' },
      { id: 'melatonina', tipo: 'complementario', desc: 'Inducción del sueño', nivel: 'medio' }
    ],
    { dosis: '300-600mg/día' }
  ),

  'melatonina': createIngredient('melatonina', 'Melatonina', 'botanicos',
    'Hormona que regula el ciclo sueño-vigilia.',
    'Indica oscuridad al cuerpo, inicia procesos de sueño.',
    ['Regulación del sueño', 'Jet lag', 'Antioxidante'],
    ['sueno'],
    [
      { id: 'magnesio', tipo: 'complementario', desc: 'Relajación y sueño', nivel: 'alto' },
      { id: 'glicina', tipo: 'complementario', desc: 'Mejor sueño', nivel: 'medio' }
    ],
    { dosis: '0.5-5mg/día' }
  ),

  'green_tea': createIngredient('green_tea', 'Té Verde (EGCG)', 'botanicos',
    'Fuente de catequinas y L-teanina para metabolismo.',
    'EGCG inhibe COMT, L-teanina aumenta ondas alfa.',
    ['Antioxidante', 'Metabolismo', 'Cognición', 'Quema de grasa'],
    ['antioxidantes', 'energia', 'peso'],
    [
      { id: 'cafeina', tipo: 'equilibrador', desc: 'L-teanina suaviza cafeína', nivel: 'alto' }
    ],
    { dosis: '2-3 tazas/día' }
  ),

  'resveratrol': createIngredient('resveratrol', 'Resveratrol', 'botanicos',
    'Polifenol del vino tinto con propiedades antienvejecimiento.',
    'Activador de sirtuinas (SIRT1), antioxidante.',
    ['Anti-edad', 'Antioxidante', 'Salud cardiovascular', 'Neuroprotección'],
    ['antioxidantes', 'corazon'],
    [
      { id: 'curcuma', tipo: 'potenciador', desc: 'Antiinflamatorio', nivel: 'alto' }
    ],
    { dosis: '150-500mg/día' }
  ),

  'quercetina': createIngredient('quercetina', 'Quercetina', 'botanicos',
    'Flavonoide con propiedades antioxidantes y antiinflamatorias.',
    'Estabiliza mastocitos, antioxidante potente.',
    ['Antioxidante', 'Antiinflamatorio', 'Alergias', 'Función inmune'],
    ['antioxidantes', 'inmunidad'],
    [
      { id: 'vitamina_c', tipo: 'potenciador', desc: 'Sinergia antioxidante', nivel: 'alto' },
      { id: 'zinc', tipo: 'complementario', desc: 'Función inmune', nivel: 'medio' }
    ],
    { dosis: '500-1000mg/día' }
  ),

  'saw_palmetto': createIngredient('saw_palmetto', 'Saw Palmetto', 'botanicos',
    'Palmera que apoya salud prostática masculina.',
    'Inhibe 5α-reductasa, bloquea receptores de DHT.',
    ['Salud prostática', 'Equilibrio hormonal'],
    ['fertilidad'],
    [
      { id: 'pygeum', tipo: 'potenciador', desc: 'Salud prostática', nivel: 'alto' },
      { id: 'zinc', tipo: 'complementario', desc: 'Salud prostática', nivel: 'medio' }
    ],
    { dosis: '320mg/día' }
  ),

  'cimicifuga': createIngredient('cimicifuga', 'Cimicífuga', 'botanicos',
    'Hierba para síntomas de menopausia.',
    'Modula receptores de serotonina, reduce LH.',
    ['Alivio de sofocos', 'Menopausia', 'Mejor sueño'],
    ['antiedad', 'sueno'],
    [
      { id: 'l_teanina', tipo: 'complementario', desc: 'Calidad del sueño', nivel: 'medio' }
    ],
    { dosis: '20-40mg/día' }
  ),

  // ==================== ÁCIDOS GRASOS ====================
  
  'omega_3_epa_dha': createIngredient('omega_3_epa_dha', 'Omega-3 EPA/DHA', 'acidos_grasos',
    'Ácidos grasos esenciales antiinflamatorios de alta concentración.',
    'Precursores de resolvinas antiinflamatorias.',
    ['Antiinflamatorio', 'Salud cardiovascular', 'Función cerebral', 'Articulaciones'],
    ['corazon', 'cerebro', 'articula'],
    [
      { id: 'vitamina_d3', tipo: 'complementario', desc: 'Absorción y utilización', nivel: 'alto' },
      { id: 'curcuma', tipo: 'potenciador', desc: 'Efectos antiinflamatorios sinérgicos', nivel: 'alto' },
      { id: 'coq10', tipo: 'complementario', desc: 'Salud cardiovascular', nivel: 'alto' }
    ],
    { dosis: '1000-3000mg EPA+DHA/día' }
  ),

  'omega_6_gla': createIngredient('omega_6_gla', 'Omega-6 GLA (Onagra)', 'acidos_grasos',
    'Ácido graso omega-6 del aceite de onagra.',
    'GLA → prostaglandina E1 antiinflamatoria.',
    ['Salud hormonal', 'Antiinflamatorio', 'Piel'],
    ['articula', 'piel'],
    [
      { id: 'omega_3', tipo: 'equilibrador', desc: 'Balance omega-6/3', nivel: 'alto' }
    ],
    { dosis: '1000-3000mg/día' }
  ),

  'dha_vegetal': createIngredient('dha_vegetal', 'DHA Vegetal (Algas)', 'acidos_grasos',
    'DHA de origen vegetal para veganos.',
    'Igual que DHA de pescado pero sin mercurio.',
    ['Función cerebral', 'Salud cardiovascular', 'Vegano'],
    ['cerebro', 'corazon'],
    [
      { id: 'omega_3', tipo: 'complementario', desc: 'Ácidos grasos esenciales', nivel: 'alto' }
    ],
    { dosis: '200-500mg/día' }
  ),

  // ==================== ENZIMAS ====================
  
  'serrapeptasa': createIngredient('serrapeptasa', 'Serrapeptasa', 'enzimas',
    'Enzima proteolítica del gusano de seda.',
    'Hidroliza fibrina, reduce mediadores inflamatorios.',
    ['Antiinflamatorio', 'Salud articular', 'Drenaje tisular'],
    ['articula', 'digestion'],
    [
      { id: 'bromelina', tipo: 'potenciador', desc: 'Efectos antiinflamatorios sinérgicos', nivel: 'alto' },
      { id: 'curcuma', tipo: 'complementario', desc: 'Antiinflamatorio', nivel: 'medio' }
    ],
    { dosis: '10-60mg/día (en ayunas)' }
  ),

  'bromelina': createIngredient('bromelina', 'Bromelina', 'enzimas',
    'Enzima proteolítica de la piña.',
    'Hidroliza proteínas, inhibe prostaglandinas.',
    ['Antiinflamatorio', 'Digestión', 'Absorción de suplementos'],
    ['articula', 'digestion'],
    [
      { id: 'serrapeptasa', tipo: 'potenciador', desc: 'Enzimas proteolíticas sinérgicas', nivel: 'alto' }
    ],
    { dosis: '500-2000mg/día' }
  ),

  'digestive_enzymes': createIngredient('digestive_enzymes', 'Enzimas Digestivas', 'enzimas',
    'Combinación de enzimas para mejorar digestión.',
    'Amilasas, lipasas, proteasas, lactasas.',
    ['Mejor digestión', 'Menos hinchazón', 'Mejor absorción'],
    ['digestion'],
    [
      { id: 'probioticos', tipo: 'complementario', desc: 'Salud digestiva completa', nivel: 'alto' }
    ],
    { dosis: '1-2 cápsulas con comidas' }
  ),

  // ==================== PROBIÓTICOS ====================
  
  'lactobacillus_rhamnosus': createIngredient('lactobacillus_rhamnosus', 'Lactobacillus rhamnosus GG', 'probioticos',
    'Probiótico líder para salud intestinal e inmunológica.',
    'Colonización del intestino, producción de ácido láctico.',
    ['Salud intestinal', 'Inmunidad', 'Digestión'],
    ['inmunidad', 'digestion'],
    [
      { id: 'prebioticos', tipo: 'potenciador', desc: 'Synbiotics', nivel: 'alto' }
    ],
    { dosis: '10-20 mil millones UFC/día' }
  ),

  'bifidobacterium_longum': createIngredient('bifidobacterium_longum', 'Bifidobacterium longum', 'probioticos',
    'Probiótico dominante del intestino grueso.',
    'Producción de acetato y lactato, inhibición de patógenos.',
    ['Salud intestinal', 'Inmunidad', 'Función cognitiva'],
    ['digestion', 'cerebro'],
    [
      { id: 'lactobacillus_rhamnosus', tipo: 'complementario', desc: 'Flora diversa', nivel: 'alto' }
    ],
    { dosis: '10-20 mil millones UFC/día' }
  ),

  'lactobacillus_acidophilus': createIngredient('lactobacillus_acidophilus', 'Lactobacillus acidophilus', 'probioticos',
    'Probiótico común del tracto digestivo.',
    'Fermentación de lactose, producción de bacteriocinas.',
    ['Salud vaginal', 'Digestión', 'Inmunidad'],
    ['digestion', 'inmunidad'],
    [
      { id: 'prebioticos', tipo: 'potenciador', desc: 'Alimento para probióticos', nivel: 'alto' }
    ],
    { dosis: '1-10 mil millones UFC/día' }
  ),

  // ==================== ANTIOXIDANTES ====================
  
  'astaxantina': createIngredient('astaxantina', 'Astaxantina', 'antioxidantes',
    'Potente antioxidante carotenoide del krill.',
    'Atraviesa barrera hematoencefálica, protege mitocondrias.',
    ['Antioxidante', 'Piel anti-edad', 'Función cognitiva', 'Rendimiento deportivo'],
    ['antioxidantes', 'piel', 'cerebro'],
    [
      { id: 'omega_3', tipo: 'complementario', desc: 'Salud cardiovascular', nivel: 'alto' },
      { id: 'coq10', tipo: 'potenciador', desc: 'Protección mitocondrial', nivel: 'alto' }
    ],
    { dosis: '4-12mg/día' }
  ),

  'coq10': createIngredient('coq10', 'Coenzima Q10', 'antioxidantes',
    'Antioxidante celular esencial para producción de energía.',
    'Transportador de electrones en cadena respiratoria.',
    ['Energía celular', 'Antioxidante', 'Salud cardíaca', 'Anti-edad'],
    ['antioxidantes', 'corazon', 'energia'],
    [
      { id: 'omega_3', tipo: 'complementario', desc: 'Salud cardiovascular', nivel: 'alto' },
      { id: 'magnesio', tipo: 'complementario', desc: 'Producción de energía', nivel: 'medio' }
    ],
    { dosis: '100-300mg/día' }
  ),

  'ala': createIngredient('ala', 'Ácido Alfa Lipoico', 'antioxidantes',
    'Antioxidante universal hidrosoluble y liposoluble.',
    'Regenera otros antioxidantes, mejora sensibilidad a insulina.',
    ['Antioxidante', 'Control de glucosa', 'Neuroprotección'],
    ['antioxidantes', 'energia'],
    [
      { id: 'biotina', tipo: 'complementario', desc: 'Absorción competitiva - tomar separado', nivel: 'bajo' }
    ],
    { dosis: '300-600mg/día' }
  ),

  'vitamina_e_tocotrienoles': createIngredient('vitamina_e_tocotrienoles', 'Vitamina E (Tocotrienoles)', 'antioxidantes',
    'Forma más potente de vitamina E.',
    'Mayor actividad antioxidante que tocoferoles.',
    ['Antioxidante', 'Colesterol', 'Neuroprotección', 'Piel'],
    ['antioxidantes', 'corazon'],
    [
      { id: 'vitamina_c', tipo: 'potenciador', desc: 'Regenera vitamina E oxidada', nivel: 'alto' }
    ],
    { dosis: '100-400mg/día' }
  ),

  // ==================== EXTRACTOS ====================
  
  'pimienta_negra': createIngredient('pimpera_negra', 'Pimpera Negra (Piperina)', 'extractos',
    'Extracto que aumenta absorción de nutrientes.',
    'Piperina inhibe enzimas hepáticas.',
    ['Aumenta absorción', 'Metabolismo'],
    ['antioxidantes', 'energia'],
    [
      { id: 'curcuma', tipo: 'potenciador', desc: 'Aumenta absorción de curcumina 2000%', nivel: 'alto' },
      { id: 'coq10', tipo: 'potenciador', desc: 'Mayor absorción', nivel: 'medio' }
    ],
    { dosis: '5-20mg/día' }
  ),

  'berberina': createIngredient('berberina', 'Berberina', 'extractos',
    'Alcaloide con beneficios para glucosa y colesterol.',
    'Activa AMPK, inhibe PCSK9.',
    ['Control de glucosa', 'Colesterol', 'Microbioma'],
    ['energia', 'corazon'],
    [
      { id: 'curcuma', tipo: 'potenciador', desc: 'Efectos antiinflamatorios', nivel: 'medio' },
      { id: 'canela', tipo: 'complementario', desc: 'Control de glucosa', nivel: 'alto' }
    ],
    { dosis: '1000-1500mg/día' }
  ),

  'canela': createIngredient('canela', 'Canela de Ceylán', 'extractos',
    'Especia con propiedades antidiabéticas.',
    'Mejora sensibilidad a insulina, reduce glucosa postprandial.',
    ['Control de glucosa', 'Antiinflamatorio', 'Antioxidante'],
    ['energia', 'antioxidantes'],
    [
      { id: 'berberina', tipo: 'complementario', desc: 'Control de glucosa sinérgico', nivel: 'alto' },
      { id: 'cromo', tipo: 'complementario', desc: 'Metabolismo de glucosa', nivel: 'medio' }
    ],
    { dosis: '1-2g/día' }
  ),

  // ==================== OTROS SUPLEMENTOS ====================
  
  'colageno_hidrolizado': createIngredient('colageno_hidrolizado', 'Colágeno Hidrolizado', 'otros',
    'Proteína estructural en forma absorbible.',
    'Péptidos bioactivos que estimulan síntesis de colágeno propio.',
    ['Salud de la piel', 'Articulaciones', 'Huesos', 'Uñas'],
    ['articula', 'piel'],
    [
      { id: 'vitamina_c', tipo: 'cofactor', desc: 'Esencial para síntesis de colágeno', nivel: 'alto' },
      { id: 'hialuronico', tipo: 'complementario', desc: 'Salud de la piel', nivel: 'alto' }
    ],
    { dosis: '2.5-15g/día' }
  ),

  'colageno_tipo2': createIngredient('colageno_tipo2', 'Colágeno Tipo II (UC-II)', 'otros',
    'Colágeno específico para cartílago articular.',
    'Inmunomodulación del cartílago, reducción de dolor articular.',
    ['Salud articular', 'Flexibilidad', 'Reducción de dolor'],
    ['articula'],
    [
      { id: 'glucosamina', tipo: 'complementario', desc: 'Componentes del cartílago', nivel: 'medio' },
      { id: 'msm', tipo: 'complementario', desc: 'Salud articular', nivel: 'medio' }
    ],
    { dosis: '40mg/día' }
  ),

  'glucosamina': createIngredient('glucosamina', 'Glucosamina', 'otros',
    'Aminoazúcar que forma parte del cartílago.',
    'Precursor de glicosaminoglicanos, protege articulaciones.',
    ['Salud articular', 'Movilidad', 'Flexibilidad'],
    ['articula'],
    [
      { id: 'condroitina', tipo: 'potenciador', desc: 'Componentes del cartílago', nivel: 'alto' },
      { id: 'msm', tipo: 'complementario', desc: 'Salud articular', nivel: 'medio' }
    ],
    { dosis: '1500mg/día' }
  ),

  'condroitina': createIngredient('condroitina', 'Sulfato de Condroitina', 'otros',
    'Componente del cartílago que atrae agua.',
    'Atrae agua al cartílago, inhibe enzimas destructivas.',
    ['Salud articular', 'Elasticidad del cartílago', 'Antiinflamatorio'],
    ['articula'],
    [
      { id: 'glucosamina', tipo: 'potenciador', desc: 'Componentes del cartílago', nivel: 'alto' }
    ],
    { dosis: '800-1200mg/día' }
  ),

  'msm': createIngredient('msm', 'MSM (Metilsulfonilmetano)', 'otros',
    'Compuesto de azufre orgánico.',
    'Fuente de azufre para colágeno, queratina.',
    ['Antiinflamatorio', 'Salud articular', 'Piel', 'Alivio muscular'],
    ['articula', 'piel'],
    [
      { id: 'glucosamina', tipo: 'complementario', desc: 'Salud articular', nivel: 'alto' },
      { id: 'colageno', tipo: 'complementario', desc: 'Azufre para colágeno', nivel: 'medio' }
    ],
    { dosis: '1-3g/día' }
  ),

  'hialuronico': createIngredient('hialuronico', 'Ácido Hialurónico', 'otros',
    'Molécula que hidrata y lubrica tejidos.',
    'Retiene agua (hasta 1000x su peso), lubricación articular.',
    ['Hidratación de la piel', 'Salud articular', 'Ojos secos'],
    ['articula', 'piel'],
    [
      { id: 'colageno', tipo: 'potenciador', desc: 'Salud de la piel', nivel: 'alto' },
      { id: 'vitamina_c', tipo: 'complementario', desc: 'Síntesis de colágeno', nivel: 'medio' }
    ],
    { dosis: '100-200mg/día' }
  ),

  'fosfatidilserina': createIngredient('fosfatidilserina', 'Fosfatidilserina', 'otros',
    'Fosfolípido esencial para función cognitiva.',
    'Componente de membranas neuronales, mejora comunicación celular.',
    ['Memoria', 'Concentración', 'Manejo del estrés'],
    ['cerebro', 'antiedad'],
    [
      { id: 'omega_3', tipo: 'potenciador', desc: 'Membranas celulares', nivel: 'alto' },
      { id: 'ginkgo_biloba', tipo: 'complementario', desc: 'Función cognitiva', nivel: 'medio' }
    ],
    { dosis: '100-300mg/día' }
  ),

  'cafeina': createIngredient('cafeina', 'Cafeína', 'otros',
    'Estimulante del sistema nervioso central.',
    'Antagonista de receptores de adenosina.',
    ['Energía', 'Enfoque mental', 'Rendimiento deportivo', 'Metabolismo'],
    ['energia'],
    [
      { id: 'l_teanina', tipo: 'equilibrador', desc: 'Reduce jitter, mejora focus', nivel: 'alto' },
      { id: 'green_tea', tipo: 'complementario', desc: 'L-teanina natural', nivel: 'alto' }
    ],
    { dosis: '100-400mg/día' }
  ),

  'betaina': createIngredient('betaina', 'Betaína (TMG)', 'otros',
    'Compuesto que apoya función hepática.',
    'Donador de metilo, apoyo hepático.',
    ['Función hepática', 'Metabolismo de homocisteína', 'Digestión'],
    ['detox', 'energia'],
    [
      { id: 'folato', tipo: 'complementario', desc: 'Metabolismo de homocisteína', nivel: 'alto' }
    ],
    { dosis: '1.5-3g/día' }
  ),

  'cartilago_de_tiburon': createIngredient('cartilago_de_tiburon', 'Cartílago de Tiburón', 'otros',
    'Fuente de sulfato de condroitina y glucosamina.',
    'Antiinflamatorio articular.',
    ['Salud articular', 'Antiinflamatorio', 'Movilidad'],
    ['articula'],
    [
      { id: 'glucosamina', tipo: 'potenciador', desc: 'Componentes del cartílago', nivel: 'alto' }
    ],
    { dosis: '1-2g/día' }
  ),

  'estigmas_de_maiz': createIngredient('estigmas_de_maiz', 'Estigmas de Maíz', 'botanicos',
    'Diurético natural tradicional.',
    'Aumenta diuresis, inhibe reabsorción de sodio.',
    ['Diurético natural', 'Salud urinaria', 'Reducción de retención'],
    ['detox'],
    [
      { id: 'diente_de_leon', tipo: 'complementario', desc: 'Efectos diuréticos sinérgicos', nivel: 'alto' },
      { id: 'potasio', tipo: 'equilibrador', desc: 'Reposición de potasio', nivel: 'alto' }
    ],
    { dosis: '2-4g/día' }
  ),

  'diente_de_leon': createIngredient('diente_de_leon', 'Diente de León', 'botanicos',
    'Hierba con propiedades depurativas.',
    'Diurético natural, apoyo hepático.',
    ['Depuración', 'Diurético', 'Apoyo hepático'],
    ['detox', 'digestion'],
    [
      { id: 'estigmas_de_maiz', tipo: 'complementario', desc: 'Efectos diuréticos', nivel: 'alto' }
    ],
    { dosis: '2-8g/día' }
  ),

  'pygeum': createIngredient('pygeum', 'Pygeum', 'botanicos',
    'Corteza africana para salud prostática.',
    'Antiinflamatorio prostático, inhibe 5α-reductasa.',
    ['Salud prostática', 'Flujo urinario'],
    ['fertilidad'],
    [
      { id: 'saw_palmetto', tipo: 'potenciador', desc: 'Salud prostática', nivel: 'alto' }
    ],
    { dosis: '50-100mg/día' }
  ),

  // ==================== SUPLEMENTOS ADICIONALES ====================
  
  'vitamina_k2_mk7': createIngredient('vitamina_k2_mk7', 'Vitamina K2 MK-7', 'vitaminas',
    'Forma más biodisponible de vitamina K2.',
    'Activación prolongada de osteocalcina y matrix Gla protein.',
    ['Salud ósea', 'Protección cardiovascular', 'Distribución del calcio'],
    ['huesos', 'corazon'],
    [
      { id: 'vitamina_d3', tipo: 'potenciador', desc: 'Trabajan juntos en metabolismo del calcio', nivel: 'alto' },
      { id: 'calcio', tipo: 'complementario', desc: 'Dirección del calcio a huesos', nivel: 'alto' }
    ],
    { dosis: '100-200mcg/día' }
  ),

  'vitamina_d3_k2': createIngredient('vitamina_d3_k2', 'Vitamina D3 + K2 Combinada', 'vitaminas',
    'Combinación sinérgica de vitaminas para calcio.',
    'D3 para absorción, K2 para dirección del calcio.',
    ['Absorción de calcio', 'Salud ósea', 'Protección cardiovascular'],
    ['huesos', 'corazon'],
    [
      { id: 'calcio', tipo: 'complementario', desc: 'Absorción y utilización del calcio', nivel: 'alto' },
      { id: 'magnesio', tipo: 'cofactor', desc: 'Cofactor en metabolismo', nivel: 'alto' }
    ],
    { dosis: 'D3: 2000-5000 UI + K2: 100mcg/día' }
  ),

  'multivitaminico': createIngredient('multivitaminico', 'Multivitamínico', 'vitaminas',
    'Combinación de vitaminas y minerales esenciales.',
    'Cubren deficiencias nutricionales comunes.',
    ['Energía general', 'Inmunidad', 'Bienestar general'],
    ['energia', 'inmunidad'],
    [
      { id: 'vitaminas_b', tipo: 'complementario', desc: 'Complejo B para energía', nivel: 'alto' },
      { id: 'zinc', tipo: 'complementario', desc: 'Inmunidad', nivel: 'alto' }
    ],
    { dosis: '1-2 dosis/día' }
  ),

  'aceite_de_pescado_concentrado': createIngredient('aceite_de_pescado_concentrado', 'Aceite de Pescado Concentrado', 'acidos_grasos',
    'Omega-3 de alta concentración (EPA+DHA).',
    'Mayor pureza y concentración que aceite estándar.',
    ['Antiinflamatorio', 'Corazón', 'Cerebro', 'Articulaciones'],
    ['corazon', 'cerebro', 'articula'],
    [
      { id: 'vitamina_d3', tipo: 'complementario', desc: 'Absorción y utilización', nivel: 'alto' },
      { id: 'curcuma', tipo: 'potenciador', desc: 'Efectos antiinflamatorios', nivel: 'alto' }
    ],
    { dosis: '1000-2000mg EPA+DHA/día' }
  ),

  'spirulina': createIngredient('spirulina', 'Spirulina', 'extractos',
    'Cianobacteria rica en nutrientes.',
    'Fuente de proteína completa, vitaminas y minerales.',
    ['Energía', 'Inmunidad', 'Antioxidante', 'Detox'],
    ['energia', 'inmunidad', 'antioxidantes'],
    [
      { id: 'clorela', tipo: 'complementario', desc: 'Combinación de algas', nivel: 'medio' }
    ],
    { dosis: '3-5g/día' }
  ),

  'clorela': createIngredient('clorela', 'Clorela', 'extractos',
    'Alga verde rica en clorofila y nutrientes.',
    'Desintoxicación de metales pesados, apoyo hepático.',
    ['Detox', 'Inmunidad', 'Digestión'],
    ['detox', 'inmunidad'],
    [
      { id: 'spirulina', tipo: 'complementario', desc: 'Combinación de algas', nivel: 'medio' }
    ],
    { dosis: '3-5g/día' }
  ),

  'aceite_de_krill': createIngredient('aceite_de_krill', 'Aceite de Krill', 'acidos_grasos',
    'Fuente de omega-3 con fosfolípidos.',
    'Mayor absorción que aceite de pescado, astaxantina incluida.',
    ['Antiinflamatorio', 'Corazón', 'Articulaciones'],
    ['corazon', 'articula'],
    [
      { id: 'omega_3', tipo: 'complementario', desc: 'Ácidos grasos esenciales', nivel: 'alto' }
    ],
    { dosis: '500-1000mg/día' }
  ),

  'luteina': createIngredient('luteina', 'Luteína', 'antioxidantes',
    'Carotenoide esencial para salud visual.',
    'Filtro de luz azul, protección de mácula.',
    ['Salud visual', 'Protección ocular', 'Antioxidante'],
    ['vision'],
    [
      { id: 'zeaxantina', tipo: 'potenciador', desc: 'Combinación para ojos', nivel: 'alto' },
      { id: 'vitamina_a', tipo: 'complementario', desc: 'Salud visual', nivel: 'medio' }
    ],
    { dosis: '10-20mg/día' }
  ),

  'zeaxantina': createIngredient('zeaxantina', 'Zeaxantina', 'antioxidantes',
    'Carotenoide para mácula del ojo.',
    'Protección antioxidante del cristalino y mácula.',
    ['Salud visual', 'Protección ocular'],
    ['vision'],
    [
      { id: 'luteina', tipo: 'potenciador', desc: 'Combinación para ojos', nivel: 'alto' }
    ],
    { dosis: '2-4mg/día' }
  ),

  'inulina': createIngredient('inulina', 'Inulina (Prebiótico)', 'probioticos',
    'Fibra prebiótica soluble.',
    'Fermentación selectiva por bifidobacterias.',
    ['Salud intestinal', 'Inmunidad', 'Absorción mineral'],
    ['digestion', 'inmunidad'],
    [
      { id: 'probioticos', tipo: 'potenciador', desc: 'Synbiotics', nivel: 'alto' }
    ],
    { dosis: '3-5g/día' }
  ),

  'fosfatidilcolina': createIngredient('fosfatidilcolina', 'Fosfatidilcolina', 'otros',
    'Fosfolípido esencial para función hepática.',
    'Componente de membranas celulares, emulsificador de grasas.',
    ['Función hepática', 'Cognición', 'Digestión'],
    ['detox', 'cerebro'],
    [
      { id: 'colina', tipo: 'complementario', desc: 'Precursor de acetilcolina', nivel: 'alto' }
    ],
    { dosis: '500-1000mg/día' }
  ),

  'colina': createIngredient('colina', 'Colina', 'vitaminas',
    'Nutriente esencial para función hepática y cerebral.',
    'Precursor de acetilcolina, componente de fosfatidilcolina.',
    ['Función cerebral', 'Función hepática', 'Metabolismo'],
    ['cerebro', 'detox'],
    [
      { id: 'vitaminas_b', tipo: 'complementario', desc: 'Metabolismo', nivel: 'medio' }
    ],
    { dosis: '425-550mg/día' }
  ),

};

// Función para combinar con base original
export function getCombinedKnowledgeBase(): Record<string, IngredientInfo> {
  // Importar dinámicamente para evitar circular
  const { KNOWLEDGE_BASE_BASE } = require('./ingredients');
  return {
    ...KNOWLEDGE_BASE_BASE,
    ...KNOWLEDGE_BASE_EXPANDED
  };
}

// Contador de ingredientes
export function getIngredientCount(): number {
  return Object.keys(getCombinedKnowledgeBase()).length;
}

// Estadísticas por categoría
export function getStatsByCategory(): Record<string, number> {
  const combined = getCombinedKnowledgeBase();
  return Object.values(combined).reduce((acc, ing) => {
    acc[ing.categoria] = (acc[ing.categoria] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}
