#!/usr/bin/env node
/**
 * Corrige los matches producto ↔ ingrediente en Supabase.
 *
 * El algoritmo de matching original era muy agresivo: matcheaba excipientes,
 * tags genéricos y químicos cosméticos a ingredientes aleatorios de la KB.
 * De 6841 matches, 4853 (71%) eran falsos positivos.
 *
 * Este script aplica correcciones en 3 fases:
 *
 * FASE 1 — Re-referenciar IDs consolidados:
 *   Los 15 IDs eliminados en la consolidación de duplicados se re-referencian
 *   al ID canónico (cola_de_caballo → cola_caballo, etc.).
 *
 * FASE 2 — Desmatchear excipientes/tags/químicos (blacklist):
 *   Excipientes farmacéuticos (agua, glicerina, gelatina, estearato de magnesio),
 *   tags genéricos (suplemento, natural, homeopático) y químicos cosméticos
 *   (colorantes, conservantes, emulsionantes) se desmatchean
 *   (is_matched=false, ingredient_id=null, match_type='none').
 *
 * FASE 3 — Corregir matches a ingredientes reales:
 *   Mapa manual de sinónimos químicos (ácido ascórbico → vitamina_c,
 *   cianocobalamina → vitamina_b12, etc.) y corrección de matches obvios
 *   (Vitamina D → vitamina_d3, no d_glucarato).
 *
 * Uso:
 *   SUPABASE_URL=https://tu-proyecto.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=sb_secret_... \
 *   node scripts/correct-product-matches.cjs
 *
 * Flags:
 *   --dry-run   Muestra los cambios sin escribir en Supabase.
 *   --phase=1   Solo ejecuta la fase indicada (1, 2, o 3).
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const DRY_RUN = process.argv.includes('--dry-run');
const PHASE_ARG = process.argv.find((a) => a.startsWith('--phase='));
const ONLY_PHASE = PHASE_ARG ? parseInt(PHASE_ARG.split('=')[1], 10) : null;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Faltan credenciales. Define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

// ═══════════════════════════════════════════════════════════════════════════
// FASE 1: Mapeo de IDs consolidados
// ═══════════════════════════════════════════════════════════════════════════
const CONSOLIDACION = {
  'diente_de_leon': 'diente_leon',
  'olivo_hoja': 'olivo',
  'cola_de_caballo': 'cola_caballo',
  'vara_de_oro': 'solidago',
  'marrubium': 'marrubio',
  'picrorhiza': 'picrorrhiza',
  'guggul': 'guggulu',
  'damiana_hoja': 'damiana',
  'ylang_ylang': 'ilang_ilang',
  'clavo_aceite': 'clavo',
  'l_triptofano': 'triptofano',
  'pqq_pyrroloquinoline': 'pqq',
  'nmn_nicotinamide': 'nmn',
  'lactobacillus_acidophilus': 'l_acidophilus',
  'bifidobacterium_longum': 'b_longum',
  'lúpulo': 'lupulo',
};

// ═══════════════════════════════════════════════════════════════════════════
// FASE 2: Blacklist de excipientes, tags y químicos cosméticos
// Estos principioText NO son ingredientes activos y no deben matchear
// ═══════════════════════════════════════════════════════════════════════════

// Excipientes farmacéuticos y formuladores (INCI/genéricos)
const EXCIPIENTES = [
  // Agua y solventes
  'aqua', 'agua', 'agua purificada', 'purified water', 'distilled water',
  // Glicerina y humectantes
  'glycerin', 'glicerina', 'glycerol', 'propylene glycol', 'propanediol',
  'butylene glycol', 'pentylene glycol', 'hexylene glycol',
  // Alcohol
  'alcohol', 'ethanol', 'alcohol denat', 'alcohol denat.',
  // Gelatina y cápsulas
  'gelatina', 'gelatin', 'gelatina blanda', 'softgel',
  // Lubricantes
  'estearato de magnesio', 'magnesium stearate', 'stearic acid', 'acido estearico',
  // Antiaglomerantes
  'silicon dioxide', 'silice', 'silica', 'dioxido de silicio', 'titanium dioxide',
  'dioxido de titanio', 'bióxido de titanio',
  // Celulosa
  'cellulose', 'celulosa', 'microcrystalline cellulose', 'celulosa microcristalina',
  'hydroxypropyl methylcellulose', 'hidroxipropilmetilcelulosa', 'hpmc',
  'carboxymethyl cellulose', 'carboximetilcelulosa', 'cmc',
  // Aceites minerales
  'mineral oil', 'aceite mineral', 'paraffinum liquidum',
  // Conservantes
  'methylparaben', 'metilparabeno', 'ethylparaben', 'propylparaben',
  'phenoxyethanol', 'sodium benzoate', 'benzoato de sodio', 'potassium sorbate',
  'sorbic acid', 'acido sorbico', 'sodium metabisulfite', 'sodium metabisulphite',
  'chlorphenesin', 'diazolidinyl urea', 'imidazolidinyl urea',
  'methylchloroisothiazolinone', 'methylisothiazolinone',
  // Espesantes/gelificantes
  'carbomer', 'xanthan gum', 'goma xantan', 'goma xantana', 'carrageenan',
  'carragenina', 'acacia gum', 'goma arabiga', 'tragacanth', 'goma tragacanto',
  // Emulsionantes
  'cetearyl alcohol', 'ceteareth-20', 'ceteareth-30', 'cetostearyl alcohol',
  'polysorbate 20', 'polysorbate 80', 'sorbitan oleate', 'sorbitan stearate',
  'glyceryl stearate', 'peg-100 stearate', 'cetrimonium chloride',
  'stearamidopropyl dimethylamine', 'behentrimonium chloride',
  // Fragancias
  'parfum', 'fragancia', 'fragrance', 'perfume', 'aroma',
  // Colorantes
  'ci 19140', 'ci 15985', 'ci 42090', 'ci 16035', 'hc blue n°2', 'hc blue n2',
  'hc yellow n°2', 'hc red n°1', 'hc red n1',
  // Otros
  'talc', 'talco', 'mica', 'silica dimethyl silylate',
  'propoxytetramethylpiperidinyl dimethicone',
];

// Tags genéricos (no son ingredientes)
const TAGS_GENERICOS = [
  'suplemento', 'suplemento alimenticio', 'suplemento alimentario',
  'suplemento alimentario natural', 'complemento', 'complemento alimenticio',
  'complemento alimentario', 'complemento nutricional', 'complemento nutricion',
  'natural', 'producto natural', '100% natural',
  'homeopático', 'homeopatico', 'tratamiento homeopático',
  'cuidado de la piel', 'cuidado personal', 'cosmético', 'cosmetico',
  'alimentacion', 'alimentación', 'nutricion', 'nutrición',
  'coadyuvante', 'suplemento vitamínico',
  'hidratación', 'hidratacion', 'relajante', 'antioxidante',
  'protección solar', 'proteccion solar', 'cabello', 'cruelty free',
  'infusión', 'infusion', 'via oral', 'via topica', 'vía oral',
  'alimentación saludable', 'complemento vitaminico',
  'teñido capilar', 'tenido capilar', 'tintura permanente',
  'salud capilar', 'pérdida de peso', 'perdida de peso',
  'flores de bach', 'remedio natural', 'terapia natural',
  'medicina natural', 'bienestar', 'energia', 'energía', 'vitalidad',
  'sin azúcar', 'sin azucar', 'sin gluten', 'sin lactosa',
  'vegano', 'vegetariano', 'organic', 'orgánico', 'organico',
];

// Químicos cosméticos (colorantes de pelo, tensioactivos, etc.)
const QUIMICOS_COSMETICOS = [
  'p-phenylenediamine', 'p-aminohenol', 'p-aminoohenol', 'p-aminophenol',
  'm-aminophenol', 'm-aminophenol',
  '2-amino-6-chloro-4-nitrophenol', '2-amino-3-hydroxypyridine',
  '3-nitro-p-hydroxyethylaminophenol', '4-amino-2-hydroxytoluene',
  '2,4-diaminophenoxyethanol hcl', '4-chlororesorcinol',
  'resorcinol', 'resorcina',
  'laureth-4', 'laureth-23', 'laureth-2', 'laureth-7',
  'sodium lauryl sulfate', 'sodium laureth sulfate',
  'cocamidopropyl betaine', 'disodium edta', 'edta',
  'triethanolamine', 'peg-8', 'peg-40', 'peg-150', 'ppg-15',
  'dimethicone', 'cyclomethicone', 'cyclopentasiloxane',
  'isopropyl myristate', 'isopropyl palmitate', 'isopropyl alcohol',
  'prunus amygdalus dulcis oil', 'sweet almond oil',
  'saccharide isomerate', 'caprylic/capric triglyceride',
  'polysilicone-11', 'acrylates/c10-30 alkyl acrylate crosspolymer',
  // Aceites cosméticos
  'aceite de jojoba', 'jojoba oil', 'simmondsia chinensis oil',
  'aceite de almendras dulces', 'aceite de almendra',
  // Tintes naturales
  'henna', 'indigofera tinctoria', 'indigo',
  // Emulsionantes y alcoholes grasos
  'cetyl alcohol', 'oleyl alcohol', 'stearyl alcohol',
  'behenyl alcohol', 'myristyl alcohol',
  // Ácidos como excipientes
  'ácido cítrico', 'acido citrico', 'citric acid',
  'ácido láctico', 'acido lactico', 'lactic acid',
  'ácido salicílico', 'acido salicilico', 'salicylic acid',
  // Otros
  'sodium pca', 'sodium hyaluronate', 'hyaluronic acid',
  'ácido hialurónico', 'acido hialuronico',
  'sodium chloride', 'cloruro de sodio', 'sal',
  'sodium citrate', 'citrato de sodio',
  'polysorbate 60', 'sorbitan olivate', 'sclerotium gum', 'pullulan',
];

const BLACKLIST = new Set([
  ...EXCIPIENTES,
  ...TAGS_GENERICOS,
  ...QUIMICOS_COSMETICOS,
]);

function isBlacklisted(text) {
  const t = text.toLowerCase().trim();
  // Match exacto
  if (BLACKLIST.has(t)) return true;
  // Normalizar para match
  const normalized = t
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]/g, ' ');
  for (const item of BLACKLIST) {
    const itemNorm = item
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[_-]/g, ' ');
    if (normalized === itemNorm) return true;
  }
  return false;
}

// ═══════════════════════════════════════════════════════════════════════════
// FASE 3: Mapa manual de sinónimos químicos y correcciones de matches
// principioText → ingredientId correcto
// ═══════════════════════════════════════════════════════════════════════════
const SINONIMOS_QUIMICOS = {
  // Vitaminas (nombre químico → ID KB)
  'ácido ascórbico': 'vitamina_c',
  'acido ascorbico': 'vitamina_c',
  'ascorbic acid': 'vitamina_c',
  'vitamina c': 'vitamina_c',
  'vitamina d': 'vitamina_d3',
  'vitamina d3': 'vitamina_d3',
  'colecalciferol': 'vitamina_d3',
  'cholecalciferol': 'vitamina_d3',
  'vitamina b1': 'tiamina',
  'tiamina': 'tiamina',
  'thiamine': 'tiamina',
  'vitamina b2': 'vitamina_b2',
  'riboflavina': 'vitamina_b2',
  'riboflavin': 'vitamina_b2',
  'vitamina b6': 'vitamina_b6',
  'piridoxina': 'vitamina_b6',
  'pyridoxine': 'vitamina_b6',
  'vitamina b12': 'vitamina_b12',
  'cianocobalamina': 'vitamina_b12',
  'cyanocobalamin': 'vitamina_b12',
  'metilcobalamina': 'metilcobalamina',
  'methylcobalamin': 'metilcobalamina',
  'vitamina e': 'vitamina_e',
  'tocoferol': 'vitamina_e',
  'tocopherol': 'vitamina_e',
  'tocopheryl acetate': 'vitamina_e',
  'acetato de tocoferol': 'vitamina_e',
  'ácido fólico': 'acido_folico',
  'acido folico': 'acido_folico',
  'folic acid': 'acido_folico',
  'folato': 'folato',
  'vitamina b3': 'niacina',
  'niacina': 'niacina',
  'nicotinamide': 'niacinamida',
  'niacinamide': 'niacinamida',
  'biotina': 'biotina',
  'biotin': 'biotina',
  'ácido pantoténico': 'acido_pantotenico',
  'acido pantotenico': 'acido_pantotenico',
  'pantothenic acid': 'acido_pantotenico',
  'panthenol': 'acido_pantotenico',
  'd-panthenol': 'acido_pantotenico',
  'calcio pantotenato': 'vitamina_b5_pantotenato',
  'vitamina k2': 'vitamina_k2',
  'vitamina k': 'vitamina_k1',
  'menaquinona': 'vitamina_k2',
  'filoquinona': 'vitamina_k1',

  // Minerales
  'óxido de magnesio': 'magnesio',
  'oxido de magnesio': 'magnesio',
  'magnesium oxide': 'magnesio',
  'citrato de magnesio': 'magnesio',
  'magnesium citrate': 'magnesio',
  'carbonato de magnesio': 'magnesio',
  'estearato de magnesio': null, // es excipiente, pero ya está en blacklist
  'carbonato de calcio': 'calcio_microcristalino',
  'calcium carbonate': 'calcio_microcristalino',
  'citrato de calcio': 'calcio_microcristalino',
  'calcium citrate': 'calcio_microcristalino',
  'sulfato de zinc': 'zinc',
  'zinc sulfate': 'zinc',
  'picolinato de zinc': 'zinc_picolinato',
  'zinc picolinate': 'zinc_picolinato',
  'sulfato de hierro': 'hierro',
  'ferrous sulfate': 'hierro',
  'hierro bisglicinato': 'hierro_bisglicinato',
  'ferrous bisglycinate': 'hierro_bisglicinato',
  'selenito de sodio': 'selenio',
  'sodium selenite': 'selenio',
  'cromato de potasio': 'cromo',
  'cromo picolinato': 'cromo',
  'chromium picolinate': 'cromo',
  'molibdato de sodio': 'molibdeno',
  'sodium molybdate': 'molibdeno',
  'borato de sodio': 'boro',
  'potasio yodato': 'yodo',
  'potasio yoduro': 'yoduro_potasio_lugol',
  'potassium iodide': 'yoduro_potasio_lugol',

  // Aminoácidos
  'l-triptófano': 'triptofano',
  'l-triptofano': 'triptofano',
  'l-tryptophan': 'triptofano',
  'triptófano': 'triptofano',
  'triptofano': 'triptofano',
  'l-glicina': 'l_glicina',
  'glycine': 'l_glicina',
  'l-tirosina': 'l_tirosina',
  'l-tyrosine': 'l_tirosina',
  'l-carnitina': 'l_carnitina',
  'l-carnitine': 'l_carnitina',
  'acetil l-carnitina': 'acetil_l_carnitina',
  'acetil-l-carnitina': 'acetil_l_carnitina',
  'l-arginina': 'l_arginina',
  'l-arginine': 'l_arginina',
  'l-cisteína': 'l_cisteina',
  'l-cisteina': 'l_cisteina',
  'n-acetil cisteína': 'nac',
  'n-acetilcisteína': 'nac',
  'nac': 'nac',
  'l-glutamina': 'l_glutamina',
  'l-glutamine': 'l_glutamina',
  'l-lisina': 'l_lisina',
  'l-lysine': 'l_lisina',

  // Colágeno
  'colágeno hidrolizado': 'colageno_hidrolizado',
  'colageno hidrolizado': 'colageno_hidrolizado',
  'hydrolyzed collagen': 'colageno_hidrolizado',
  'colágeno': 'colageno',
  'colageno': 'colageno',
  'péptidos de colágeno': 'colageno_hidrolizado',
  'peptidos de colageno': 'colageno_hidrolizado',

  // Omega y aceites
  'aceite de coco': 'mct',
  'coconut oil': 'mct',
  'aceite de krill': 'krill_oil',
  'krill oil': 'krill_oil',
  'aceite de pescado': 'omega_3',
  'fish oil': 'omega_3',
  'omega 3': 'omega_3',
  'omega-3': 'omega_3',
  'epa': 'omega_3',
  'dha': 'omega_3',
  'aceite de onagra': 'aceite_onagra',
  'evening primrose oil': 'aceite_onagra',
  'aceite de borraje': 'omega_7',

  // Extractos y plantas
  'valeriana': 'valeriana',
  'pasiflora': 'pasiflora',
  'melisa': 'melisa',
  'manzanilla': 'manzanilla',
  'jengibre': 'jengibre',
  'ginger': 'jengibre',
  'cúrcuma': 'curcuma',
  'curcuma': 'curcuma',
  'turmeric': 'curcuma',
  'curcumina': 'curcumina',
  'ginkgo biloba': 'ginkgo',
  'equinácea': 'equinacea',
  'echinacea': 'equinacea',
  'ajo': 'ajo',
  'garlic': 'ajo',
  'espino blanco': 'espino_blanco',
  'hoja de olivo': 'olivo',
  'olive leaf': 'olivo',
  'diente de león': 'diente_leon',
  'diente de leon': 'diente_leon',
  'dandelion': 'diente_leon',
  'cola de caballo': 'cola_caballo',
  'horsetail': 'cola_caballo',
  'sauco': 'sauco',
  'elderberry': 'sauco',
  'menta': 'menta',
  'peppermint': 'menta',
  'mentol': 'menta',
  'romero': 'romero',
  'rosemary': 'romero',
  'té verde': 'te_verde',
  'green tea': 'te_verde',
  'te verde': 'te_verde',
  'ga de te verde': 'te_verde',
  'griffonia simplicifolia': '5_htp',

  // Probióticos
  'lactobacillus rhamnosus': 'l_rhamnosus_gg',
  'l. rhamnosus': 'l_rhamnosus_gg',
  'bifidobacterium longum': 'b_longum',
  'lactobacillus acidophilus': 'l_acidophilus',

  // Otros compuestos
  'coenzima q10': 'coq10',
  'coq10': 'coq10',
  'ubiquinone': 'coq10',
  'ubiquinona': 'coq10',
  'melatonina': 'melatonina',
  'melatonin': 'melatonina',
  'quercetina': 'quercetina',
  'quercetin': 'quercetina',
  'resveratrol': 'resveratrol',
  'astaxantina': 'astaxantina',
  'astaxanthin': 'astaxantina',
  'glutatión': 'glutathion',
  'glutation': 'glutathion',
  'glutathione': 'glutathion',
  'nadh': 'nadh',
  'nmn': 'nmn',
  'nr': 'nr',
  'pqq': 'pqq',
  'd-manosa': 'd_manosa',
  'd-mannose': 'd_manosa',
  'manosa': 'd_manosa',
  'alpha gpc': 'alpha_gpc',
  'citicolina': 'citicolina',
  'cdp-choline': 'citicolina',
  'fosfatidilcolina': 'fosfatidilcolina',
  'colina': 'colina',
  'choline': 'colina',
  'inositol': 'inositol',
  'inositol': 'inositol',
  'gaba': 'gaba_pharma',
  'gaba': 'gaba_pharma',
  'l-teanina': 'l_teanina',
  'l-theanine': 'l_teanina',
  'teanina': 'l_teanina',
  'huperzina a': 'huperzina_a',
  'huperzine a': 'huperzina_a',
  'vinpocetina': 'vinpocetina',
  'vinpocetine': 'vinpocetina',
  'fosfatidilserina': 'fosfatidilserina',
  'phosphatidylserine': 'fosfatidilserina',
  'lecitina': 'lecitina',
  'lecithin': 'lecitina',
  'propóleo': 'propoleo',
  'propoleo': 'propoleo',
  'propolis': 'propoleo',
  'jalea real': 'jalea_real',
  'royal jelly': 'jalea_real',
  'polen': 'polen',
  'bee pollen': 'polen',
  'espirulina': 'espirulina',
  'spirulina': 'espirulina',
  'chlorella': 'chlorella',
  'crocetina': 'crocetina',
  'fisetina': 'fisetina',
  'pterostilbeno': 'pterostilbeno',
  'pterostilbene': 'pterostilbeno',
  'urolitina a': 'urolithin_a',
  'urolithin a': 'urolithin_a',

  // Plantas (nombres botánicos y extractos)
  'aloe barbadensis leaf juice': 'aloe_vera',
  'aloe vera': 'aloe_vera',
  'aloe': 'aloe_vera',
  'sábila': 'aloe_vera',
  'sabila': 'aloe_vera',
  'extracto de manzanilla': 'manzanilla',
  'manzanilla': 'manzanilla',
  'chamomile': 'manzanilla',
  'matricaria chamomilla': 'manzanilla',
  'extracto de valeriana': 'valeriana',
  'valeriana officinalis': 'valeriana',
  'extracto de pasiflora': 'pasiflora',
  'passiflora incarnata': 'pasiflora',
  'extracto de melisa': 'melisa',
  'melissa officinalis': 'melisa',
  'extracto de jengibre': 'jengibre',
  'zingiber officinale': 'jengibre',
  'extracto de cúrcuma': 'curcuma',
  'curcuma longa': 'curcuma',
  'extracto de ginkgo': 'ginkgo',
  'ginkgo biloba extract': 'ginkgo',
  'extracto de equinácea': 'equinacea',
  'echinacea purpurea': 'equinacea',
  'extracto de ajo': 'ajo',
  'allium sativum': 'ajo',
  'extracto de espino blanco': 'espino_blanco',
  'crataegus monogyna': 'espino_blanco',
  'extracto de hoja de olivo': 'olivo',
  'olea europaea': 'olivo',
  'extracto de diente de león': 'diente_leon',
  'taraxacum officinale': 'diente_leon',
  'extracto de cola de caballo': 'cola_caballo',
  'equisetum arvense': 'cola_caballo',
  'extracto de sauco': 'sauco',
  'sambucus nigra': 'sauco',
  'extracto de menta': 'menta',
  'mentha piperita': 'menta',
  'extracto de romero': 'romero',
  'rosmarinus officinalis': 'romero',
  'extracto de té verde': 'te_verde',
  'camellia sinensis': 'te_verde',
  'theanine': 'l_teanina',

  // Más vitaminas y compuestos
  'beta caroteno': 'betacaroteno',
  'betacaroteno': 'betacaroteno',
  'beta-carotene': 'betacaroteno',
  'luteína': 'luteina',
  'zeaxantina': 'zeaxantina',
  'astaxantina': 'astaxantina',
  'licopeno': 'licopeno',
  'lycopene': 'licopeno',
  'ácido alfa lipoico': 'alfa_lipoico',
  'acido alpha lipoico': 'alfa_lipoico',
  'alpha lipoic acid': 'alfa_lipoico',
  'n-acetilglucosamina': 'glucosamina',
  'glucosamina': 'glucosamina',
  'glucosamine': 'glucosamina',
  'sulfato de glucosamina': 'glucosamina',
  'condroitina': 'condroitina',
  'chondroitin': 'condroitina',
  'sulfato de condroitina': 'condroitina',
  'msm': 'msm',
  'metilsulfonilmetano': 'msm',
  'methylsulfonylmethane': 'msm',
  'ácido hialurónico': 'acido_hialuronico',
  'acido hialuronico': 'acido_hialuronico',
  'hyaluronic acid': 'acido_hialuronico',
  'silimarina': 'silimarina',
  'silymarin': 'silimarina',
  'cardo mariano': 'cardo_mariano',
  'silybum marianum': 'cardo_mariano',
  'boswellia': 'boswellia',
  'boswellia serrata': 'boswellia',
};

// ═══════════════════════════════════════════════════════════════════════════
// Supabase helpers
// ═══════════════════════════════════════════════════════════════════════════
async function supabaseSelectAll(table, columns) {
  let allRows = [];
  let offset = 0;
  const PAGE = 1000;
  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(columns)}&order=producto_sku&limit=${PAGE}&offset=${offset}`;
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!res.ok) throw new Error(`Select ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!data || data.length === 0) break;
    allRows.push(...data);
    offset += PAGE;
    if (data.length < PAGE) break;
    process.stdout.write(`\r   ${allRows.length} filas...`);
  }
  console.log('');
  return allRows;
}

async function supabaseUpdate(table, filters, updates) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    params.set(k, `eq.${v}`);
  }
  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`Update ${res.status}: ${await res.text()}`);
  return res.json();
}

// ═══════════════════════════════════════════════════════════════════════════
// Normalización para matching de sinónimos
// ═══════════════════════════════════════════════════════════════════════════
function normalize(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findSynonymMatch(text) {
  const norm = normalize(text);
  for (const [key, id] of Object.entries(SINONIMOS_QUIMICOS)) {
    if (normalize(key) === norm) return id;
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// Ejecución
// ═══════════════════════════════════════════════════════════════════════════
async function main() {
  console.log('═'.repeat(60));
  console.log('  CORRECCIÓN DE MATCHES — Supabase product_ingredients');
  console.log('═'.repeat(60));
  if (DRY_RUN) console.log('  ⚠  MODO DRY-RUN (no escribe)\n');

  // Descargar todos los product_ingredients
  console.log('📥 Descargando product_ingredients...');
  const rows = await supabaseSelectAll(
    'product_ingredients',
    'producto_sku,ingredient_id,principio_text,match_type,match_score,matched_via,is_matched'
  );
  console.log(`   ${rows.length} filas descargadas\n`);

  const stats = {
    fase1_rebasados: 0,
    fase2_desmatheados: 0,
    fase3_corregidos: 0,
    fase3_ya_correctos: 0,
    sin_cambio: 0,
  };

  // Agrupar cambios por tipo para batch updates
  const updatesRebase = []; // fase 1
  const updatesBlacklist = []; // fase 2
  const updatesSynonym = []; // fase 3

  for (const row of rows) {
    const principio = row.principio_text;
    const currentId = row.ingredient_id;

    // FASE 1: Re-referenciar IDs consolidados
    if (currentId && currentId in CONSOLIDACION) {
      const newId = CONSOLIDACION[currentId];
      if (!ONLY_PHASE || ONLY_PHASE === 1) {
        updatesRebase.push({ row, newId, type: 'rebase' });
      }
      continue;
    }

    // FASE 2: Desmatchear excipientes/tags/químicos
    if (currentId && isBlacklisted(principio)) {
      if (!ONLY_PHASE || ONLY_PHASE === 2) {
        updatesBlacklist.push({ row, type: 'blacklist' });
      }
      continue;
    }

    // FASE 3: Corregir matches con sinónimos químicos
    if (currentId) {
      const correctId = findSynonymMatch(principio);
      if (correctId && correctId !== currentId) {
        if (!ONLY_PHASE || ONLY_PHASE === 3) {
          updatesSynonym.push({ row, newId: correctId, type: 'synonym' });
        }
        continue;
      }
      // Si ya está matcheado al ID correcto, no hacer nada
    }

    stats.sin_cambio++;
  }

  // --- Aplicar FASE 1 ---
  if (updatesRebase.length > 0 && (!ONLY_PHASE || ONLY_PHASE === 1)) {
    console.log(`\nFASE 1: Re-referenciar ${updatesRebase.length} IDs consolidados`);
    let applied = 0;
    for (const u of updatesRebase) {
      if (DRY_RUN) {
        if (applied < 10) console.log(`  [DRY] ${u.row.producto_sku} | "${u.row.principio_text}" | ${u.row.ingredient_id} → ${u.newId}`);
        applied++;
        continue;
      }
      try {
        await supabaseUpdate('product_ingredients', {
          producto_sku: u.row.producto_sku,
          principio_text: u.row.principio_text,
          matched_via: u.row.matched_via,
        }, { ingredient_id: u.newId });
        applied++;
      } catch (err) {
        if (applied < 5) console.error(`  ❌ ${u.row.producto_sku}: ${err.message}`);
      }
    }
    stats.fase1_rebasados = applied;
    console.log(`  ✅ ${applied} filas re-referenciadas`);
  }

  // --- Aplicar FASE 2 ---
  if (updatesBlacklist.length > 0 && (!ONLY_PHASE || ONLY_PHASE === 2)) {
    console.log(`\nFASE 2: Desmatchear ${updatesBlacklist.length} excipientes/tags/químicos`);
    let applied = 0;
    for (const u of updatesBlacklist) {
      if (DRY_RUN) {
        if (applied < 15) console.log(`  [DRY] ${u.row.producto_sku} | "${u.row.principio_text}" | ${u.row.ingredient_id} → NULL (blacklist)`);
        applied++;
        continue;
      }
      try {
        await supabaseUpdate('product_ingredients', {
          producto_sku: u.row.producto_sku,
          principio_text: u.row.principio_text,
          matched_via: u.row.matched_via,
        }, { ingredient_id: null, match_type: 'none', match_score: 0, is_matched: false });
        applied++;
      } catch (err) {
        if (applied < 5) console.error(`  ❌ ${u.row.producto_sku}: ${err.message}`);
      }
    }
    stats.fase2_desmatheados = applied;
    console.log(`  ✅ ${applied} filas desmatheadas (is_matched=false)`);
  }

  // --- Aplicar FASE 3 ---
  if (updatesSynonym.length > 0 && (!ONLY_PHASE || ONLY_PHASE === 3)) {
    console.log(`\nFASE 3: Corregir ${updatesSynonym.length} matches con sinónimos químicos`);
    let applied = 0;
    for (const u of updatesSynonym) {
      if (DRY_RUN) {
        if (applied < 20) console.log(`  [DRY] ${u.row.producto_sku} | "${u.row.principio_text}" | ${u.row.ingredient_id} → ${u.newId}`);
        applied++;
        continue;
      }
      try {
        await supabaseUpdate('product_ingredients', {
          producto_sku: u.row.producto_sku,
          principio_text: u.row.principio_text,
          matched_via: u.row.matched_via,
        }, { ingredient_id: u.newId, match_type: 'synonym', match_score: 95, is_matched: true });
        applied++;
      } catch (err) {
        if (applied < 5) console.error(`  ❌ ${u.row.producto_sku}: ${err.message}`);
      }
    }
    stats.fase3_corregidos = applied;
    console.log(`  ✅ ${applied} matches corregidos`);
  }

  // --- Resumen ---
  console.log('\n' + '═'.repeat(60));
  console.log('  RESUMEN');
  console.log('═'.repeat(60));
  console.log(`  FASE 1 — IDs consolidados re-referenciados: ${stats.fase1_rebasados}`);
  console.log(`  FASE 2 — Excipientes/tags desmatheados:     ${stats.fase2_desmatheados}`);
  console.log(`  FASE 3 — Matches corregidos (sinónimos):   ${stats.fase3_corregidos}`);
  console.log(`  Sin cambio necesario:                       ${stats.sin_cambio}`);
  console.log('═'.repeat(60));
}

main().catch((err) => { console.error('Error fatal:', err); process.exit(1); });
