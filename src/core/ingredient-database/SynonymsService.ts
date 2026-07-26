/**
 * SynonymsService - Servicio de Sinónimos para Ingredientes
 * 
 * Proporciona búsquedas más robustas con sinónimos en español,
 * inglés y latín para todos los ingredientes populares.
 * 
 * MÁS DE 500 SINÓNIMOS PARA BÚSQUEDAS ROBUSTAS
 */

import { KNOWLEDGE_BASE } from './ingredients';
import type { IngredientInfo } from './types';

// Mapa de sinónimos expandido: término normalizado -> id del ingrediente
export const SYNONYMS_MAP: Record<string, string> = {
  
  // ==================== FITOTERAPIA - POPULARES ====================
  
  // VALERIANA (Sedante, insomnio)
  'valeriana': 'valeriana',
  'valerian': 'valeriana',
  'valeriana officinalis': 'valeriana',
  'valerian root': 'valeriana',
  'valeriana raíz': 'valeriana',
  'valeriana raizes': 'valeriana',
  'nervio valerian': 'valeriana',
  'valerian extract': 'valeriana',
  'valeriana extract': 'valeriana',
  'valerianae radix': 'valeriana',
  'valerianapha': 'valeriana',
  
  // PASIFLORA (Ansiedad, insomnio)
  'pasiflora': 'pasiflora',
  'passionflower': 'pasiflora',
  'passiflora': 'pasiflora',
  'pasionaria': 'pasiflora',
  'flor de la pasion': 'pasiflora',
  'flor passion': 'pasiflora',
  'passiflora incarnata': 'pasiflora',
  'passiflora edulis': 'pasiflora',
  'maracuja': 'pasiflora',
  'passion fruit': 'pasiflora',
  'pasionaria incarnata': 'pasiflora',
  'pasiflora officinalis': 'pasiflora',
  
  // MELISA / TORONJIL (Ansiedad, estrés)
  'melisa': 'melisa',
  'lemon balm': 'melisa',
  'melissa': 'melisa',
  'toronjil': 'melisa',
  'melissa officinalis': 'melisa',
  'citronela': 'melisa',
  'limonera': 'melisa',
  'toronjil citriodoro': 'melisa',
  'sweet balm': 'melisa',
  'bee balm': 'melisa',
  
  // HIPÉRICO / SAN JUAN (Depresión leve)
  'hiperico': 'hipérico',
  'hipérico': 'hipérico',
  'hypericum': 'hipérico',
  'st johns wort': 'hipérico',
  'st. johns wort': 'hipérico',
  'st john\'s wort': 'hipérico',
  'hierba de san juan': 'hipérico',
  'ypericum perforatum': 'hipérico',
  'hypericum perforatum': 'hipérico',
  'corazoncillo': 'hipérico',
  'hierba de san andres': 'hipérico',
  '抗抑郁': 'hipérico',
  
  // GINKGO (Memoria, circulación)
  'ginkgo': 'ginkgo',
  'ginkgo biloba': 'ginkgo',
  'ginkyo': 'ginkgo',
  'arbol de los cuarenta escudos': 'ginkgo',
  'palito de huevos': 'ginkgo',
  'nogal del japon': 'ginkgo',
  ' Maidenhair tree': 'ginkgo',
  'ginkgo extract': 'ginkgo',
  'ginkgobiloba': 'ginkgo',
  
  // ASHWAGANDHA (Adaptógeno, estrés)
  'ashwagandha': 'ashwagandha',
  'withania': 'ashwagandha',
  'withania somnifera': 'ashwagandha',
  'ginseng indio': 'ashwagandha',
  'cereza winters': 'ashwagandha',
  'oroval': 'ashwagandha',
  'ashwagandha root': 'ashwagandha',
  'ashwaghanda': 'ashwagandha',
  'ashvagandha': 'ashwagandha',
  'aswagandha': 'ashwagandha',
  'somnifera': 'ashwagandha',
  'physalis somnifera': 'ashwagandha',
  
  // Rhodiola (Fatiga, estrés)
  'rodiola': 'rodiola',
  'rhodiola': 'rodiola',
  'rhodiola rosea': 'rodiola',
  'raiz dorada': 'rodiola',
  'arctic root': 'rodiola',
  'golden root': 'rodiola',
  'roseroot': 'rodiola',
  'rosewort': 'rodiola',
  
  // EQUINÁCEA (Inmunidad)
  'equinacea': 'equinacea',
  'equinácea': 'equinacea',
  'echinacea': 'equinacea',
  'echinacea purpurea': 'equinacea',
  'equinacea angustifolia': 'equinacea',
  'equinacea pallida': 'equinacea',
  'coneflower purpura': 'equinacea',
  'purpura coneflower': 'equinacea',
  'samsum': 'equinacea',
  
  // PROPÓLEO (Inmunidad)
  'propoleo': 'propoleo',
  'propóleo': 'propoleo',
  'propolis': 'propoleo',
  'bee glue': 'propoleo',
  'propolis extract': 'propoleo',
  'propolio': 'propoleo',
  'propolis bee': 'propoleo',
  'jalea de abeja': 'propoleo',
  
  // SAUCO / SAMBUKO (Resfriados)
  'sauco': 'sauco',
  'sambuco': 'sauco',
  'elderberry': 'sauco',
  'elder': 'sauco',
  'sambucus': 'sauco',
  'sambucus nigra': 'sauco',
  'sambucus canadensis': 'sauco',
  'bayas de sauco': 'sauco',
  'elderberries': 'sauco',
  'flor de sauco': 'sauco',
  
  // ESPINO BLANCO (Corazón)
  'espino blanco': 'espino_blanco',
  'espino albar': 'espino_blanco',
  'hawthorn': 'espino_blanco',
  'crataegus': 'espino_blanco',
  'crataegus oxyacantha': 'espino_blanco',
  'crataegus monogyna': 'espino_blanco',
  'hawthorn berry': 'espino_blanco',
  'espino blanco bayas': 'espino_blanco',
  'white thorn': 'espino_blanco',
  
  // HAR PAGOFITO (Articulaciones)
  'harpagofito': 'harpagofito',
  'garra del diablo': 'harpagofito',
  'devil claw': 'harpagofito',
  'harpago': 'harpagofito',
  'harpagophytum': 'harpagofito',
  'harpagophytum procumbens': 'harpagofito',
  'uncaria': 'harpagofito',
  'devil claw root': 'harpagofito',
  
  // CÚRCUMA (Antiinflamatorio)
  'curcuma': 'curcuma',
  'cúrcuma': 'curcuma',
  'turmeric': 'curcuma',
  'curcuma longa': 'curcuma',
  'açafran': 'curcuma',
  'turmeric root': 'curcuma',
  'curcumina': 'curcuma',
  'curry indio': 'curcuma',
  'turmerico': 'curcuma',
  'yuki chan': 'curcuma',
  
  // JENGIBRE (Digestivo, náuseas)
  'jengibre': 'jengibre',
  'ginger': 'jengibre',
  'kion': 'jengibre',
  'zingiber': 'jengibre',
  'zingiber officinale': 'jengibre',
  'jengibre fresco': 'jengibre',
  'jengibre molido': 'jengibre',
  'jenger': 'jengibre',
  'raw ginger': 'jengibre',
  'ginger root': 'jengibre',
  
  // MANZANILLA (Digestivo, успокоит)
  'manzanilla': 'manzanilla',
  'chamomile': 'manzanilla',
  'camomile': 'manzanilla',
  'matricaria': 'manzanilla',
  'camomila': 'manzanilla',
  'manzanilla dulce': 'manzanilla',
  'chamomilla': 'manzanilla',
  'chamomilla recutita': 'manzanilla',
  'matricaria chamomilla': 'manzanilla',
  'manzanilla alemana': 'manzanilla',
  'hierba maternal': 'manzanilla',
  'manzanilla romana': 'manzanilla',
  'anthemis nobilis': 'manzanilla',
  
  // MENTA (Digestivo)
  'menta': 'menta',
  'menta piperita': 'menta',
  'peppermint': 'menta',
  'mentha piperita': 'menta',
  'mentol': 'menta',
  'hierba peppermint': 'menta',
  'menta verde': 'menta',
  'boro': 'menta',
  'pudina': 'menta',
  
  // HINOJO (Digestivo, flatulencia)
  'hinojo': 'hinojo',
  'fennel': 'hinojo',
  'foeniculum': 'hinojo',
  'foeniculum vulgare': 'hinojo',
  'hinojo dulce': 'hinojo',
  'fennel seed': 'hinojo',
  'anis hinojo': 'hinojo',
  'finochio': 'hinojo',
  
  // ALOE VERA (Piel, digestivo)
  'aloe': 'aloe_vera',
  'aloe vera': 'aloe_vera',
  'sabila': 'aloe_vera',
  'sábila': 'aloe_vera',
  'aloe barbadensis': 'aloe_vera',
  'aloe arborescens': 'aloe_vera',
  'aloe vera gel': 'aloe_vera',
  'aloe juice': 'aloe_vera',
  'acíbar': 'aloe_vera',
  'aloe latex': 'aloe_vera',
  
  // CALÉNDULA (Piel, cicatrizante)
  'calendula': 'calendula',
  'caléndula': 'calendula',
  'calendula officinalis': 'calendula',
  'maravilla': 'calendula',
  'flor de muerto': 'calendula',
  'calendula petals': 'calendula',
  'marigold': 'calendula',
  'calendula cream': 'calendula',
  
  // TOMILLO (Respiratorio)
  'tomillo': 'tomillo',
  'thyme': 'tomillo',
  'thymus': 'tomillo',
  'thymus vulgaris': 'tomillo',
  'tomillo vulgar': 'tomillo',
  'farigola': 'tomillo',
  'thymo': 'tomillo',
  
  // LAVANDA (Relajante)
  'lavanda': 'lavanda',
  'lavender': 'lavanda',
  'lavandula': 'lavanda',
  'lavandula angustifolia': 'lavanda',
  'lavanda vera': 'lavanda',
  'lavanda officinalis': 'lavanda',
  'espliego': 'lavanda',
  'lavanda offic': 'lavanda',
  'lavandin': 'lavanda',
  
  // SALVIA (Memoria, menopausia)
  'salvia': 'salvia',
  'salvia officinalis': 'salvia',
  'salvia divinorum': 'salvia',
  'salvia sclarea': 'salvia',
  'sage': 'salvia',
  'salvia leaf': 'salvia',
  'salvia leafs': 'salvia',
  
  // cardo mariano (Hígado)
  'cardo mariano': 'cardo_mariano',
  'milk thistle': 'cardo_mariano',
  'silybum': 'cardo_mariano',
  'silybum marianum': 'cardo_mariano',
  'cardo lechoso': 'cardo_mariano',
  'cardo de marie': 'cardo_mariano',
  'marian thistle': 'cardo_mariano',
  
  // DIENTE DE LEÓN (Depurativo)
  'diente de leon': 'diente_leon',
  'diente de león': 'diente_leon',
  'dandelion': 'diente_leon',
  'taraxacum': 'diente_leon',
  'taraxacum officinale': 'diente_leon',
  'amargon': 'diente_leon',
  'pelos de tierra': 'diente_leon',
  'dandelion root': 'diente_leon',
  'dandelion leaf': 'diente_leon',
  
  // ALCACHOFA (Hígado, colesterol)
  'alcachofa': 'alcachofa',
  'alcachofra': 'alcachofa',
  'artichoke': 'alcachofa',
  'cynara': 'alcachofa',
  'cynara scolymus': 'alcachofa',
  'alcachofa comun': 'alcachofa',
  'alcachofas': 'alcachofa',
  'artichauts': 'alcachofa',
  
  // MACA (Energía, libido)
  'maca': 'maca',
  'lepidium': 'maca',
  'lepidium meyenii': 'maca',
  'ginseng peruano': 'maca',
  'maca root': 'maca',
  'maca powder': 'maca',
  'maca maca': 'maca',
  'maka': 'maca',
  
  // ==================== HOMEOPATÍA - POPULARES ====================
  
  // ÁRNICA (Traumatismos)
  'arnica': 'arnica',
  'arnica montana': 'arnica',
  'arnica flower': 'arnica',
  'arnica root': 'arnica',
  'tabaco de montana': 'arnica',
  'hierba de las caidas': 'arnica',
  'leopard bane': 'arnica',
  'mountain tobacco': 'arnica',
  'arnic': 'arnica',
  'arnica gel': 'arnica',
  'arnica crema': 'arnica',
  
  // NUX VOMICA (Digestivo, resaca)
  'nux vomica': 'nux_vomica',
  'nux vómica': 'nux_vomica',
  'nux': 'nux_vomica',
  'strychnos': 'nux_vomica',
  'strychnos nux-vomica': 'nux_vomica',
  'nux v': 'nux_vomica',
  'vomito de nuez': 'nux_vomica',
  'strychnine': 'nux_vomica',
  
  // IGNATIA (Ansiedad, duelo)
  'ignatia': 'ignatia',
  'ignatia amara': 'ignatia',
  'ignatia gratiana': 'ignatia',
  'ignat': 'ignatia',
  'haba de san ignacio': 'ignatia',
  'st ignatius bean': 'ignatia',
  
  // GELSEMIUM (Gripe, ansiedad)
  'gelsemium': 'gelsemium',
  'gelsemio': 'gelsemium',
  'gelsemium sempervirens': 'gelsemium',
  'jasmin amarillo': 'gelsemium',
  'yellow jasmine': 'gelsemium',
  'carolina jessamine': 'gelsemium',
  
  // BELLADONNA (Fiebre, otitis)
  'belladonna': 'belladonna',
  'belladona': 'belladonna',
  'atropa': 'belladonna',
  'belladonna atropa': 'belladonna',
  'deadly nightshade': 'belladonna',
  'bella doncella': 'belladonna',
  'bellad': 'belladonna',
  'belladona': 'belladonna',
  
  // LYCOPODIUM (Digestivo, cálculos)
  'lycopodium': 'lycopodium',
  'licopodio': 'lycopodium',
  'lycopodium clavatum': 'lycopodium',
  'club moss': 'lycopodium',
  'musgo': 'lycopodium',
  'polvo de lycopodium': 'lycopodium',
  
  // PULSATILLA (Gripe, mujer)
  'pulsatilla': 'pulsatilla',
  'pulsatila': 'pulsatilla',
  'pulsatilla pratensis': 'pulsatilla',
  'anemona': 'pulsatilla',
  'pasque flower': 'pulsatilla',
  'wind flower': 'pulsatilla',
  'pulsatilla vulgaris': 'pulsatilla',
  
  // RHUS TOXICODENDRON (Articulaciones)
  'rhus toxicodendron': 'rhus_toxicodendron',
  'rhus tox': 'rhus_toxicodendron',
  'rhus': 'rhus_toxicodendron',
  'poison ivy': 'rhus_toxicodendron',
  'hiedra venenosa': 'rhus_toxicodendron',
  'toxicodendron': 'rhus_toxicodendron',
  
  // SEPIA (Mujer, menopausia)
  'sepia': 'sepia',
  'sepia officinalis': 'sepia',
  'sepia tinta': 'sepia',
  'cuttlefish': 'sepia',
  'sepion': 'sepia',
  
  // SULPHUR (Piel, crónica)
  'sulphur': 'sulphur',
  'sulfur': 'sulphur',
  'azufre': 'sulphur',
  'sulphur sublimatum': 'sulphur',
  'brimstone': 'sulphur',
  'sulf': 'sulphur',
  'sulph': 'sulphur',
  
  // MERCURIUS (Garganta, encías)
  'mercurius': 'mercurius',
  'mercurio': 'mercurius',
  'mercurius solubilis': 'mercurius',
  'azogue': 'mercurius',
  'quicksilver': 'mercurius',
  'mercur': 'mercurius',
  
  // GRAPHITES (Piel, eccema)
  'graphites': 'graphites',
  'grafito': 'graphites',
  'plumbago': 'graphites',
  'black lead': 'graphites',
  'graphite': 'graphites',
  
  // CHAMOMILLA (Dientes, cólicos)
  'chamomilla': 'chamomilla',
  'chamomile german': 'chamomilla',
  'manzanilla alemana': 'chamomilla',
  'matricaria chamomilla': 'chamomilla',
  
  // BRYONIA (Tos, articulaciones)
  'bryonia': 'bryonia',
  'brionia': 'bryonia',
  'bryonia alba': 'bryonia',
  'white bryony': 'bryonia',
  'nueza blanca': 'bryonia',
  
  // CARBO VEG (Digestivo, flatulencia)
  'carbo veg': 'carbo_veg',
  'carbo vegetabilis': 'carbo_veg',
  'carbon vegetal': 'carbo_veg',
  'carbón vegetal': 'carbo_veg',
  'vegetable charcoal': 'carbo_veg',
  
  // PHOSPHORUS (Respiratorio, sangre)
  'phosphorus': 'phosphorus',
  'fosforo': 'phosphorus',
  'fósforo': 'phosphorus',
  'phosphoricum': 'phosphorus',
  'phosphore': 'phosphorus',
  'phosph': 'phosphorus',
  
  // ==================== ACEITES ESENCIALES ====================
  
  // TEA TREE (Antiséptico)
  'tea tree': 'tea_tree',
  'tea tree oil': 'tea_tree',
  'melaleuca': 'tea_tree',
  'melaleuca alternifolia': 'tea_tree',
  'arbol del te': 'tea_tree',
  'árbol del té': 'tea_tree',
  'TTO': 'tea_tree',
  'melaleuca oil': 'tea_tree',
  
  // RAVINTSARA (Respiratorio, antiviral)
  'ravintsara': 'ravintsara',
  'ravintsara oil': 'ravintsara',
  'cinamomo': 'ravintsara',
  'raven': 'ravintsara',
  'ravensara': 'ravintsara',
  'cinnamomum camphora': 'ravintsara',
  
  // ORÉGANO (Antiséptico potente)
  'oregano': 'oregano',
  'orégano': 'oregano',
  'origanum vulgare': 'oregano',
  'origano': 'oregano',
  'oregano oil': 'oregano',
  'oregan': 'oregano',
  
  // INCIENSO / FRANKINCENSE
  'incienso': 'incienso',
  'frankincense': 'incienso',
  'boswellia': 'incienso',
  'boswellia serrata': 'incienso',
  'olibano': 'incienso',
  'encens': 'incienso',
  'boswelia': 'incienso',
  'boswellia sacra': 'incienso',
  
  // ROSA MOSQUETA (Piel, cicatrices)
  'rosa mosqueta': 'rosa_mosqueta',
  'rose hip': 'rosa_mosqueta',
  'rosa rubiginosa': 'rosa_mosqueta',
  'rosehip oil': 'rosa_mosqueta',
  'rosa canina': 'rosa_mosqueta',
  'mosqueta': 'rosa_mosqueta',
  
  // ==================== VITAMINAS - POPULARES ====================
  
  // VITAMINA C
  'vitamina c': 'vitamina_c',
  'vitamina c ascorbico': 'vitamina_c',
  'ascorbic acid': 'vitamina_c',
  'ácido ascórbico': 'vitamina_c',
  'acido ascorbico': 'vitamina_c',
  'vit c': 'vitamina_c',
  'vitamina cnatural': 'vitamina_c',
  'ascorbato': 'vitamina_c',
  'sodium ascorbate': 'vitamina_c',
  'calcium ascorbate': 'vitamina_c',
  'cerveza de vitamina c': 'vitamina_c',
  
  // VITAMINA D
  'vitamina d': 'vitamina_d',
  'vitamina d3': 'vitamina_d3',
  'vit d': 'vitamina_d',
  'vit d3': 'vitamina_d3',
  'cholecalciferol': 'vitamina_d',
  'colecalciferol': 'vitamina_d',
  'vitamina d2': 'vitamina_d',
  'ergocalciferol': 'vitamina_d',
  'sunshine vitamin': 'vitamina_d',
  'vit d natural': 'vitamina_d',
  
  // VITAMINA B COMPLEX
  'vitaminas b': 'vitaminas_b',
  'vitaminas del complejo b': 'vitaminas_b',
  'b complex': 'vitaminas_b',
  'complejo b': 'vitaminas_b',
  'vitamin b': 'vitaminas_b',
  'b1 b2 b3 b5 b6 b7 b9 b12': 'vitaminas_b',
  
  // VITAMINA B1 (Tiamina)
  'vitamina b1': 'vitamina_b1',
  'tiamina': 'vitamina_b1',
  'thiamine': 'vitamina_b1',
  'vit b1': 'vitamina_b1',
  'aneurin': 'vitamina_b1',
  
  // VITAMINA B6
  'vitamina b6': 'vitamina_b6',
  'piridoxina': 'vitamina_b6',
  'pyridoxine': 'vitamina_b6',
  'vit b6': 'vitamina_b6',
  'vitamina b6 aktif': 'vitamina_b6',
  
  // VITAMINA B12
  'vitamina b12': 'vitamina_b12',
  'cobalamina': 'vitamina_b12',
  'cobalamin': 'vitamina_b12',
  'cianocobalamina': 'vitamina_b12',
  'metilcobalamina': 'vitamina_b12',
  'hidroxocobalamina': 'vitamina_b12',
  'vit b12': 'vitamina_b12',
  'b12': 'vitamina_b12',
  'cobalamina activa': 'vitamina_b12',
  
  // VITAMINA E
  'vitamina e': 'vitamina_e',
  'tocopherol': 'vitamina_e',
  'tocotrienol': 'vitamina_e',
  'vit e': 'vitamina_e',
  'alpha-tocopherol': 'vitamina_e',
  'mixed tocopherols': 'vitamina_e',
  'tocoferol': 'vitamina_e',
  
  // VITAMINA A
  'vitamina a': 'vitamina_a',
  'retinol': 'vitamina_a',
  'retinoids': 'vitamina_a',
  'betacaroteno': 'vitamina_a',
  'beta carotene': 'vitamina_a',
  'vit a': 'vitamina_a',
  'caroteno': 'vitamina_a',
  
  // VITAMINA K
  'vitamina k': 'vitamina_k',
  'vitamina k2': 'vitamina_k',
  'vit k': 'vitamina_k',
  'phylloquinone': 'vitamina_k',
  'menaquinona': 'vitamina_k',
  'menaq7': 'vitamina_k',
  'k2 mk7': 'vitamina_k',
  
  // ==================== MINERALES - POPULARES ====================
  
  // MAGNESIO
  'magnesio': 'magnesio',
  'magnesium': 'magnesio',
  'mg': 'magnesio',
  'magnesio natural': 'magnesio',
  'magnesio citrato': 'magnesio',
  'magnesio glicinato': 'magnesio',
  'magnesio taurato': 'magnesio',
  'magnesio oxido': 'magnesio',
  'magnesio malato': 'magnesio',
  'magnesium citrate': 'magnesio',
  'magnesium glycinate': 'magnesio',
  'magnesium oxide': 'magnesio',
  'magnesium bisglycinate': 'magnesio',
  'magnesio bisglicinato': 'magnesio',
  'magnesio quelato': 'magnesio',
  
  // ZINC
  'zinc': 'zinc',
  'zincum': 'zinc',
  'zn': 'zinc',
  'zinc natural': 'zinc',
  'zinc citrate': 'zinc',
  'zinc picolinato': 'zinc',
  'zinc quélate': 'zinc',
  'zinc gluconate': 'zinc',
  'zinc carnosina': 'zinc',
  'zinc quelado': 'zinc',
  'zinco': 'zinc',
  
  // HIERRO
  'hierro': 'hierro',
  'iron': 'hierro',
  'fe': 'hierro',
  'ferrum': 'hierro',
  'hierro natural': 'hierro',
  'hierro fumarato': 'hierro',
  'hierro sulfato': 'hierro',
  'hierro bisglicinato': 'hierro',
  'iron bisglycinate': 'hierro',
  'iron ferrous': 'hierro',
  'ferrous sulfate': 'hierro',
  'ferric': 'hierro',
  'ferroso': 'hierro',
  
  // CALCIO
  'calcio': 'calcio',
  'calcium': 'calcio',
  'ca': 'calcio',
  'calcio natural': 'calcio',
  'calcio citrato': 'calcio',
  'calcio carbonato': 'calcio',
  'calcio coral': 'calcio',
  'calcio lactato': 'calcio',
  'calcium citrate': 'calcio',
  'calcium carbonate': 'calcio',
  'calcium d': 'calcio',
  
  // SELENIO
  'selenio': 'selenio',
  'selenium': 'selenio',
  'se': 'selenio',
  'selenio organico': 'selenio',
  'selenometionina': 'selenio',
  'selenomethionine': 'selenio',
  'selenio sel': 'selenio',
  
  // POTASIO
  'potasio': 'potasio',
  'potassium': 'potasio',
  'k': 'potasio',
  'potasio citrato': 'potasio',
  'potassium citrate': 'potasio',
  'potasa': 'potasio',
  
  // CROMO
  'cromo': 'cromo',
  'chromium': 'cromo',
  'cromo picolinato': 'cromo',
  'chromium picolinate': 'cromo',
  'crm': 'cromo',
  
  // ==================== ÁCIDOS GRASOS ====================
  
  // OMEGA 3
  'omega 3': 'omega_3',
  'omega-3': 'omega_3',
  'omega3': 'omega_3',
  'omega 3 aceite': 'omega_3',
  'omega 3 fish oil': 'omega_3',
  'aceite de pescado': 'omega_3',
  'aceite de salmon': 'omega_3',
  'aceite de atun': 'omega_3',
  'fish oil': 'omega_3',
  'salmon oil': 'omega_3',
  'epa': 'omega_3',
  'epa omega 3': 'omega_3',
  'dha': 'omega_3',
  'epa dha': 'omega_3',
  'omega 3 epa dha': 'omega_3',
  'omega 3 marine': 'omega_3',
  'krill oil': 'omega_3',
  'aceite de krill': 'omega_3',
  'aceite de chia': 'omega_3',
  'chia oil': 'omega_3',
  'linaza': 'omega_3',
  'flaxseed': 'omega_3',
  'linaza molida': 'omega_3',
  'omega 3 vegetariano': 'omega_3',
  'algae omega 3': 'omega_3',
  
  // ==================== PROBIÓTICOS ====================
  
  'probióticos': 'probióticos',
  'probioticos': 'probióticos',
  'probiotics': 'probióticos',
  'lactobacillus': 'probióticos',
  'bifidobacterium': 'probióticos',
  'flora intestinal': 'probióticos',
  'flora bacteriana': 'probióticos',
  'bacterias buenas': 'probióticos',
  'good bacteria': 'probióticos',
  'lactobacillus acidophilus': 'probióticos',
  'lactobacillus rhamnosus': 'probióticos',
  'bifidobacterium bifidum': 'probióticos',
  'bifidobacterium longum': 'probióticos',
  'lgg': 'probióticos',
  'lactobacillus gg': 'probióticos',
  'probio': 'probióticos',
  'probiot': 'probióticos',
  
  // ==================== ANTIOXIDANTES ====================
  
  // COQ10
  'coq10': 'coq10',
  'coq 10': 'coq10',
  'coenzyme q10': 'coq10',
  'coenzima q10': 'coq10',
  'ubiquinona': 'coq10',
  'ubiquinol': 'coq10',
  'coq10 natural': 'coq10',
  'q10': 'coq10',
  'coenzyme Q10': 'coq10',
  'coq-10': 'coq10',
  
  // RESVERATROL
  'resveratrol': 'resveratrol',
  'trans-resveratrol': 'resveratrol',
  'resveratrol polygonum': 'resveratrol',
  'polygonum cuspidatum': 'resveratrol',
  'resveratrol uva': 'resveratrol',
  'resver': 'resveratrol',
  'resvet': 'resveratrol',
  
  // QUERCETINA
  'quercetina': 'quercetina',
  'quercetin': 'quercetina',
  'quercitina': 'quercetina',
  'querc': 'quercetina',
  
  // ASTAXANTINA
  'astaxantina': 'astaxantina',
  'astaxanthin': 'astaxantina',
  'haematococcus': 'astaxantina',
  'astax': 'astaxantina',
  
  // ==================== AMINOÁCIDOS ====================
  
  // TRIPTÓFANO
  'triptofano': 'triptofano',
  'triptófano': 'triptofano',
  'tryptophan': 'triptofano',
  '5-htp': 'triptofano',
  '5 htp': 'triptofano',
  '5htp': 'triptofano',
  'tript': 'triptofano',
  'l-tryptophan': 'triptofano',
  
  // TEANINA
  'teanina': 'teanina',
  'l-teanina': 'teanina',
  'l-theanine': 'teanina',
  'theanine': 'teanina',
  'tean': 'teanina',
  'l-tea': 'teanina',
  'suntheanine': 'teanina',
  
  // GABA
  'gaba': 'gaba',
  'ácido gamma-aminobutírico': 'gaba',
  'gamma-aminobutyric acid': 'gaba',
  'gamma gaba': 'gaba',
  'gaba natural': 'gaba',
  
  // GLUTAMINA
  'glutamina': 'glutamina',
  'l-glutamine': 'glutamina',
  'glutamine': 'glutamina',
  'gluta': 'glutamina',
  'l-glut': 'glutamina',
  
  // ARGININA
  'arginina': 'arginina',
  'l-arginina': 'arginina',
  'arginine': 'arginina',
  'l-arginine': 'arginina',
  'arg': 'arginina',
  'argin': 'arginina',
  
  // LISINA
  'lisina': 'lisina',
  'l-lisina': 'lisina',
  'lysine': 'lisina',
  'l-lysine': 'lisina',
  'lis': 'lisina',
  
  // CARNITINA
  'carnitina': 'carnitina',
  'l-carnitina': 'carnitina',
  'carnitine': 'carnitina',
  'l-carnitine': 'carnitina',
  'ALC': 'carnitina',
  'acetil carnitina': 'carnitina',
  
  // CREATINA
  'creatina': 'creatina',
  'creatine': 'creatina',
  'creatina monohidrato': 'creatina',
  'creatine monohydrate': 'creatina',
  'creat': 'creatina',
  
  // ==================== OTROS SUPLEMENTOS POPULARES ====================
  
  // GRIFFONIA (5-HTP natural)
  'griffonia': 'griffonia',
  'griffonia simplicifolia': 'griffonia',
  'griff': 'griffonia',
  
  // KAVA
  'kava': 'kava',
  'kava kava': 'kava',
  'kava k': 'kava',
  'piper methysticum': 'kava',
  'kava root': 'kava',
  'cava': 'kava',
  'kawa': 'kava',
  
  // REISHI
  'reishi': 'reishi',
  'ganoderma': 'reishi',
  'ganoderma lucidum': 'reishi',
  'hongo reishi': 'reishi',
  'lingzhi': 'reishi',
  'reishi mushroom': 'reishi',
  'ganoderma extract': 'reishi',
  
  // CORDYCEPS
  'cordyceps': 'cordyceps',
  'cordyceps sinensis': 'cordyceps',
  'hongo cordyceps': 'cordyceps',
  'caterpillar fungus': 'cordyceps',
  'cordyceps cs-4': 'cordyceps',
  
  // SCHISANDRA
  'schisandra': 'schisandra',
  'schisandra chinensis': 'schisandra',
  'bayas de schisandra': 'schisandra',
  'schizandra': 'schisandra',
  'five flavor berry': 'schisandra',
  'schis': 'schisandra',
  
  // TILA / TILO
  'tila': 'tila',
  'tilo': 'tila',
  'linden': 'tila',
  'tilia': 'tila',
  'flor de tilo': 'tila',
  'tilo europeu': 'tila',
  'linden flower': 'tila',
  'tilo flor': 'tila',
  
  // ==================== COLÁGENO ====================
  
  'colageno': 'colageno',
  'colágeno': 'colageno',
  'collagen': 'colageno',
  'colageno hidrolizado': 'colageno',
  'collagen peptide': 'colageno',
  'colageno tipo 2': 'colageno',
  'colageno tipo 1': 'colageno',
  'colageno marino': 'colageno',
  'fish collagen': 'colageno',
  'bovine collagen': 'colageno',
  'collagen powder': 'colageno',
  'colageno en polvo': 'colageno',
  'colageno verisol': 'colageno',
  
  // ==================== OTROS ====================
  
  // BOLDO
  'boldo': 'boldo',
  'peumus boldus': 'boldo',
  'boldo leaf': 'boldo',
  
  // GAYUBA
  'gayuba': 'gayuba',
  'uva ursi': 'gayuba',
  'arctostaphylos': 'gayuba',
  'bearberry': 'gayuba',
  
  // COLA DE CABALLO
  'cola de caballo': 'cola_caballo',
  'horsetail': 'cola_caballo',
  'equisetum': 'cola_caballo',
  'equisetum arvense': 'cola_caballo',
  'horsetail grass': 'cola_caballo',
  
  // GARCINIA CAMBOGIA
  'garcinia': 'garcinia',
  'garcinia cambogia': 'garcinia',
  'garcinia gummi': 'garcinia',
  'tamarindo malabar': 'garcinia',
  'hydroxycitric acid': 'garcinia',
  'HCA': 'garcinia',
  
  // GREEN COFFEE
  'cafe verde': 'cafe_verde',
  'café verde': 'cafe_verde',
  'green coffee': 'cafe_verde',
  'green coffee bean': 'cafe_verde',
  'cafe verde extracto': 'cafe_verde',
  'green coffee extract': 'cafe_verde',
  'cafe sin tostar': 'cafe_verde',
  
  // MATEÍNA / GUARANÁ
  'mateina': 'guarana',
  'guarana': 'guarana',
  'guarana extract': 'guarana',
  'paullinia cupana': 'guarana',
  'guarana seed': 'guarana',
  
  // SPIRULINA
  'espirulina': 'espirulina',
  'spirulina': 'espirulina',
  'spirulina azul': 'espirulina',
  'arthrospira': 'espirulina',
  'spirulina powder': 'espirulina',
  
  // CLORELA
  'clorela': 'clorela',
  'chlorella': 'clorela',
  'clorela vulgaris': 'clorela',
  'chlorella pyrenoidosa': 'clorela',
  'chlorella tablet': 'clorela',
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
  
  if (!normalized || normalized.length < 2) {
    return null;
  }
  
  // 1. Buscar en mapa de sinónimos directamente
  if (SYNONYMS_MAP[normalized]) {
    const kbEntry = KNOWLEDGE_BASE[SYNONYMS_MAP[normalized]];
    if (kbEntry) return kbEntry;
  }
  
  // 2. Buscar clave parcial en mapa de sinónimos (más flexible)
  for (const [key, id] of Object.entries(SYNONYMS_MAP)) {
    // Coincidencia exacta o parcial
    if (key === normalized || key.includes(normalized) || normalized.includes(key)) {
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
  
  // 4. Búsqueda por palabras clave (mínimo 3 caracteres)
  if (normalized.length >= 3) {
    const words = normalized.split(/\s+/);
    for (const word of words) {
      if (word.length >= 3) {
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
