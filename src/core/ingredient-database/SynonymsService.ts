/**
 * SynonymsService - Servicio de Sinónimos para Ingredientes
 * 
 * Proporciona búsquedas más robustas con sinónimos en español,
 * inglés y latín para todos los ingredientes.
 */

import { KNOWLEDGE_BASE } from './ingredients';
import type { IngredientInfo } from './types';

// Mapa de sinónimos expandido: término -> id del ingrediente
export const SYNONYMS_MAP: Record<string, string> = {
  // ==================== FITOTERAPIA ====================
  
  // Valeriana
  'valeriana': 'valeriana',
  'valerian': 'valeriana',
  'valeriana officinalis': 'valeriana',
  'valerian root': 'valeriana',
  'raíz de valeriana': 'valeriana',
  
  // Pasiflora
  'pasiflora': 'pasiflora',
  'passionflower': 'pasiflora',
  'passiflora': 'pasiflora',
  'pasionaria': 'pasiflora',
  'flor de la pasión': 'pasiflora',
  'passiflora incarnata': 'pasiflora',
  
  // Melisa / Toronjil
  'melisa': 'melisa',
  'lemon balm': 'melisa',
  'melissa': 'melisa',
  'toronjil': 'melisa',
  'melissa officinalis': 'melisa',
  
  // Hipérico / San Juan
  'hipérico': 'hipérico',
  'hypericum': 'hipérico',
  'st johns wort': 'hipérico',
  'hierba de san juan': 'hipérico',
  'hypericum perforatum': 'hipérico',
  
  // Ginkgo
  'ginkgo': 'ginkgo',
  'ginkgo biloba': 'ginkgo',
  
  // Bacopa
  'bacopa': 'bacopa',
  'brahmi': 'bacopa',
  'bacopa monnieri': 'bacopa',
  
  // Ashwagandha
  'ashwagandha': 'ashwagandha',
  'withania': 'ashwagandha',
  'withania somnifera': 'ashwagandha',
  'ginseng indio': 'ashwagandha',
  
  // Rhodiola
  'rodiola': 'rodiola',
  'rhodiola': 'rodiola',
  'rhodiola rosea': 'rodiola',
  'raíz dorada': 'rodiola',
  
  // Equinácea
  'equinácea': 'equinacea',
  'equinacea': 'equinacea',
  'echinacea': 'equinacea',
  'echinacea purpurea': 'equinacea',
  
  // Propóleo
  'propóleo': 'propoleo',
  'propoleo': 'propoleo',
  'propolis': 'propoleo',
  'bee glue': 'propoleo',
  
  // Sauco / Sambuco
  'sauco': 'sauco',
  'sambuco': 'sauco',
  'elderberry': 'sauco',
  'sambucus nigra': 'sauco',
  
  // Espino Blanco
  'espino blanco': 'espino_blanco',
  'hawthorn': 'espino_blanco',
  'crataegus': 'espino_blanco',
  'espino albar': 'espino_blanco',
  'crataegus oxyacantha': 'espino_blanco',
  
  // Harpagofito
  'harpagofito': 'harpagofito',
  'harpagophytum': 'harpagofito',
  'garra del diablo': 'harpagofito',
  'devil claw': 'harpagofito',
  
  // Cúrcuma
  'cúrcuma': 'curcuma',
  'curcuma': 'curcuma',
  'turmeric': 'curcuma',
  'curcuma longa': 'curcuma',
  
  // Jengibre
  'jengibre': 'jengibre',
  'ginger': 'jengibre',
  'zingiber officinale': 'jengibre',
  
  // Manzanilla
  'manzanilla': 'manzanilla',
  'chamomile': 'manzanilla',
  'camomile': 'manzanilla',
  'matricaria': 'manzanilla',
  'chamomilla recutita': 'manzanilla',
  
  // Menta
  'menta': 'menta',
  'peppermint': 'menta',
  'menta piperita': 'menta',
  'mentha piperita': 'menta',
  
  // Hinojo
  'hinojo': 'hinojo',
  'fennel': 'hinojo',
  'foeniculum vulgare': 'hinojo',
  
  // Aloe Vera
  'aloe': 'aloe_vera',
  'aloe vera': 'aloe_vera',
  'sábila': 'aloe_vera',
  'aloe barbadensis': 'aloe_vera',
  
  // Caléndula
  'caléndula': 'calendula',
  'calendula': 'calendula',
  'calendula officinalis': 'calendula',
  
  // Tomillo
  'tomillo': 'tomillo',
  'thyme': 'tomillo',
  'thymus vulgaris': 'tomillo',
  
  // Lavanda
  'lavanda': 'lavanda',
  'lavender': 'lavanda',
  'lavandula': 'lavanda',
  'lavandula angustifolia': 'lavanda',
  
  // Cardio / Cardiovascular
  'hoja de olivo': 'hoja_olivo',
  'olive leaf': 'hoja_olivo',
  'olea europaea': 'hoja_olivo',
  
  // ==================== HOMEOPATÍA ====================
  
  // Arnica
  'arnica': 'arnica',
  'arnica montana': 'arnica',
  
  // Nux Vomica
  'nux vomica': 'nux_vomica',
  'nux': 'nux_vomica',
  'strychnos nux-vomica': 'nux_vomica',
  
  // Ignatia
  'ignatia': 'ignatia',
  'ignatia amara': 'ignatia',
  'ignatia gratiana': 'ignatia',
  
  // Gelsemium
  'gelsemium': 'gelsemium',
  'gelsemium sempervirens': 'gelsemium',
  
  // Belladonna
  'belladonna': 'belladonna',
  'belladonna atropa': 'belladonna',
  'belladona': 'belladonna',
  
  // Lycopodium
  'lycopodium': 'lycopodium',
  'lycopodium clavatum': 'lycopodium',
  
  // Pulsatilla
  'pulsatilla': 'pulsatilla',
  'pulsatilla pratensis': 'pulsatilla',
  'anémona': 'pulsatilla',
  
  // Rhus Toxicodendron
  'rhus toxicodendron': 'rhus_toxicodendron',
  'rhus tox': 'rhus_toxicodendron',
  'rododendro': 'rhus_toxicodendron',
  
  // Sepia
  'sepia': 'sepia',
  'sepia officinalis': 'sepia',
  
  // Sulphur
  'sulphur': 'sulphur',
  'sulfur': 'sulphur',
  'azufre': 'sulphur',
  
  // Mercurius
  'mercurius': 'mercurius',
  'mercurius solubilis': 'mercurius',
  'mercurio': 'mercurius',
  
  // Graphites
  'graphites': 'graphites',
  'grafito': 'graphites',
  
  // Chamomilla
  'chamomilla': 'chamomilla',
  'manzanilla alemana': 'chamomilla',
  
  // Bryonia
  'bryonia': 'bryonia',
  'bryonia alba': 'bryonia',
  'brionia': 'bryonia',
  
  // Carbo Veg
  'carbo veg': 'carbo_veg',
  'carbo vegetabilis': 'carbo_veg',
  'carbón vegetal': 'carbo_veg',
  
  // Phosphorus
  'phosphorus': 'phosphorus',
  'fosforo': 'phosphorus',
  'fósforo': 'phosphorus',
  'phosphoricum': 'phosphorus',
  
  // ==================== ACEITES ESENCIALES ====================
  
  // Tea Tree
  'tea tree': 'tea_tree',
  'melaleuca': 'tea_tree',
  'melaleuca alternifolia': 'tea_tree',
  'árbol del té': 'tea_tree',
  
  // Ravintsara
  'ravintsara': 'ravintsara',
  'cinamomo': 'ravintsara',
  'raven': 'ravintsara',
  
  // Orégano
  'orégano': 'oregano',
  'oregano': 'oregano',
  'origanum vulgare': 'oregano',
  'origano': 'oregano',
  
  // Incienso
  'incienso': 'incienso',
  'frankincense': 'incienso',
  'boswellia': 'incienso',
  'boswellia serrata': 'incienso',
  
  // Rosa Mosqueta
  'rosa mosqueta': 'rosa_mosqueta',
  'rose hip': 'rosa_mosqueta',
  'rosa rubiginosa': 'rosa_mosqueta',
  
  // ==================== VITAMINAS Y MINERALES ====================
  
  // Vitamina C
  'vitamina c': 'vitamina_c',
  'ascorbic acid': 'vitamina_c',
  'ácido ascórbico': 'vitamina_c',
  'vit c': 'vitamina_c',
  
  // Vitamina D
  'vitamina d': 'vitamina_d',
  'cholecalciferol': 'vitamina_d',
  'vit d': 'vitamina_d',
  'vitamina d3': 'vitamina_d3',
  
  // Vitamina B1
  'vitamina b1': 'vitamina_b1',
  'tiamina': 'vitamina_b1',
  'thiamine': 'vitamina_b1',
  
  // Vitamina B6
  'vitamina b6': 'vitamina_b6',
  'piridoxina': 'vitamina_b6',
  'pyridoxine': 'vitamina_b6',
  
  // Vitamina B12
  'vitamina b12': 'vitamina_b12',
  'cobalamina': 'vitamina_b12',
  'cobalamin': 'vitamina_b12',
  'cianocobalamina': 'vitamina_b12',
  
  // Magnesio
  'magnesio': 'magnesio',
  'magnesium': 'magnesio',
  'mg': 'magnesio',
  
  // Zinc
  'zinc': 'zinc',
  'zincum': 'zinc',
  'zn': 'zinc',
  
  // Hierro
  'hierro': 'hierro',
  'iron': 'hierro',
  'fe': 'hierro',
  'ferrum': 'hierro',
  
  // Calcio
  'calcio': 'calcio',
  'calcium': 'calcio',
  'ca': 'calcio',
  
  // Selenio
  'selenio': 'selenio',
  'selenium': 'selenio',
  'se': 'selenio',
  
  // Omega 3
  'omega 3': 'omega_3',
  'omega-3': 'omega_3',
  'omega3': 'omega_3',
  'aceite de pescado': 'omega_3',
  'epa': 'omega_3',
  'dha': 'omega_3',
  
  // Probióticos
  'probióticos': 'probióticos',
  'probioticos': 'probióticos',
  'probiotics': 'probióticos',
  'lactobacillus': 'probióticos',
  'bifidobacterium': 'probióticos',
  
  // CoQ10
  'coq10': 'coq10',
  'coq 10': 'coq10',
  'coenzyme q10': 'coq10',
  'ubiquinona': 'coq10',
  
  // ==================== AMINOÁCIDOS ====================
  
  // Triptófano
  'triptófano': 'triptofano',
  'tryptophan': 'triptofano',
  '5-htp': 'triptofano',
  
  // L-Teanina
  'teanina': 'teanina',
  'l-teanina': 'teanina',
  'l-theanine': 'teanina',
  'theanine': 'teanina',
  
  // Gaba
  'gaba': 'gaba',
  'ácido gamma-aminobutírico': 'gaba',
  
  // Glutamina
  'glutamina': 'glutamina',
  'l-glutamine': 'glutamina',
  
  // Arginina
  'arginina': 'arginina',
  'l-arginina': 'arginina',
  'arginine': 'arginina',
  
  // Lisina
  'lisina': 'lisina',
  'l-lisina': 'lisina',
  'lysine': 'lisina',
  
  // ==================== OTROS ====================
  
  // Maca
  'maca': 'maca',
  'maca maca': 'maca',
  'lepidium meyenii': 'maca',
  'ginseng peruano': 'maca',
  
  // Griffonia
  'griffonia': 'griffonia',
  'griffonia simplicifolia': 'griffonia',
  
  // Kava
  'kava': 'kava',
  'kava kava': 'kava',
  'piper methysticum': 'kava',
  
  // Reishi
  'reishi': 'reishi',
  'ganoderma': 'reishi',
  'ganoderma lucidum': 'reishi',
  'hongo reishi': 'reishi',
  
  // Schisandra
  'schisandra': 'schisandra',
  'schisandra chinensis': 'schisandra',
  'bayas de schisandra': 'schisandra',
  
  // Tila / Tilo
  'tila': 'tila',
  'tilo': 'tila',
  'linden': 'tila',
  'tilia': 'tila',
  
  // Salvia
  'salvia': 'salvia',
  'salvia officinalis': 'salvia',
  
  // Diente de León
  'diente de león': 'diente_leon',
  'dandelion': 'diente_leon',
  'taraxacum': 'diente_leon',
  
  // Alcachofa
  'alcachofa': 'alcachofa',
  'alcachofra': 'alcachofa',
  'artichoke': 'alcachofa',
  'cynara scolymus': 'alcachofa',
  
  // Cardo Mariano
  'cardo mariano': 'cardo_mariano',
  'milk thistle': 'cardo_mariano',
  'silybum marianum': 'cardo_mariano',
  
  // Boldo
  'boldo': 'boldo',
  'peumus boldus': 'boldo',
  
  // Gayuba
  'gayuba': 'gayuba',
  'uva ursi': 'gayuba',
  'arctostaphylos': 'gayuba',
  
  // Cola de Caballo
  'cola de caballo': 'cola_caballo',
  'horsetail': 'cola_caballo',
  'equisetum': 'cola_caballo',
};

// Función para normalizar texto de búsqueda
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/[^a-z0-9\s]/g, '') // Quitar caracteres especiales
    .trim();
}

// Buscar ingrediente por cualquier término (nombre, sinónimo, etc.)
export function findIngredientByAny(term: string): IngredientInfo | null {
  const normalized = normalizeText(term);
  
  // 1. Buscar en mapa de sinónimos directamente
  if (SYNONYMS_MAP[normalized]) {
    const kbEntry = KNOWLEDGE_BASE[SYNONYMS_MAP[normalized]];
    if (kbEntry) return kbEntry;
  }
  
  // 2. Buscar clave parcial en mapa de sinónimos
  for (const [key, id] of Object.entries(SYNONYMS_MAP)) {
    if (key.includes(normalized) || normalized.includes(key)) {
      const kbEntry = KNOWLEDGE_BASE[id];
      if (kbEntry) return kbEntry;
    }
  }
  
  // 3. Buscar en nombres originales de la KB
  for (const [id, info] of Object.entries(KNOWLEDGE_BASE)) {
    const nameLower = normalizeText(info.nombre);
    const latinName = info.nombre_latin ? normalizeText(info.nombre_latin) : '';
    
    if (nameLower.includes(normalized) || normalized.includes(nameLower) ||
        (latinName && (latinName.includes(normalized) || normalized.includes(latinName)))) {
      return info;
    }
    
    // También buscar en ID
    if (normalizeText(id).includes(normalized) || normalized.includes(normalizeText(id))) {
      return info;
    }
  }
  
  // 4. Búsqueda por palabras clave (mínimo 4 caracteres)
  if (normalized.length >= 4) {
    const words = normalized.split(/\s+/);
    for (const word of words) {
      if (word.length >= 4) {
        for (const [id, info] of Object.entries(KNOWLEDGE_BASE)) {
          const nameLower = normalizeText(info.nombre);
          if (nameLower.includes(word)) {
            return info;
          }
        }
      }
    }
  }
  
  return null;
}

// Obtener todos los sinónimos de un ingrediente
export function getSynonymsFor(ingredientId: string): string[] {
  const synonyms: string[] = [];
  
  for (const [key, value] of Object.entries(SYNONYMS_MAP)) {
    if (value === ingredientId) {
      synonyms.push(key);
    }
  }
  
  return synonyms;
}

// Agregar nuevo sinónimo en tiempo de ejecución
export function addSynonym(synonym: string, ingredientId: string): void {
  const normalized = normalizeText(synonym);
  SYNONYMS_MAP[normalized] = ingredientId;
}
