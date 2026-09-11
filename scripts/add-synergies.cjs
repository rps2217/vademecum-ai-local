const fs = require('fs');
const path = require('path');

const fito = require('../src/db/seeders/data/fitoterapia.json');
const homeo = require('../src/db/seeders/data/homeopatia.json');
const aceites = require('../src/db/seeders/data/aceites.json');
const vit = require('../src/db/seeders/data/vitaminas_minerales.json');

const s1 = require('../src/db/seeders/data/sinergias_1.json');
const s2 = require('../src/db/seeders/data/sinergias_2.json');
const s3Path = path.join(__dirname, '../src/db/seeders/data/sinergias_3.json');
const s3 = JSON.parse(fs.readFileSync(s3Path, 'utf8'));

const allIngs = [...fito.ingredientes, ...homeo.ingredientes, ...aceites.ingredientes, ...vit.ingredientes];
const ingIds = new Set(allIngs.map(i => i.id));

const existingPairs = new Set();
const allSin = [...s1.sinergias, ...s2.sinergias, ...s3.sinergias];
for (const s of allSin) {
  const pairKey = [s.ingredienteA, s.ingredienteB].sort().join('::');
  existingPairs.add(pairKey);
}

const newSynergies = [
  {
    id: "sin_berberina_cromo_picolinato",
    ingredienteA: "berberina",
    ingredienteB: "cromo",
    tipo: "sinergia",
    nivelEvidencia: "A",
    descripcion: "Sinergia metabólica potente: la berberina activa AMPK y el cromo sensibiliza los receptores de insulina para control glucémico óptimo.",
    beneficios: ["Sensibilidad a la insulina", "Reducción de HbA1c", "Pérdida de grasa visceral"],
    precauciones: ["Monitorizar glucemia si toma antidiabéticos orales"],
    mecanismo: "Berberina estimula la captación de glucosa por vía AMPK; Cromo potencia la autofosforilación del receptor de insulina.",
    categorias: ["fitoterapia", "mineral"],
    sistemas: ["metabolico", "cardiovascular"]
  },
  {
    id: "sin_ashwagandha_rodiola_adaptogenos",
    ingredienteA: "ashwagandha",
    ingredienteB: "rodiola",
    tipo: "sinergia",
    nivelEvidencia: "A",
    descripcion: "Dúo adaptógeno integral: Ashwagandha modula el cortisol nocturno y Rodiola optimiza la síntesis de ATP y rendimiento psíquico matutino.",
    beneficios: ["Resiliencia al estrés", "Energía mental", "Reducción de fatiga adrenal"],
    precauciones: ["Evitar en hipertensión no controlada o hipertiroidismo"],
    mecanismo: "Modulación dual del eje HPA y optimización de monoaminas cerebrales (serotonina y dopamina).",
    categorias: ["fitoterapia", "fitoterapia"],
    sistemas: ["nervioso", "endocrino"]
  },
  {
    id: "sin_magnesio_vitamina_b6_sinergia",
    ingredienteA: "magnesio_glicinato",
    ingredienteB: "vitamina_b6",
    tipo: "sinergia",
    nivelEvidencia: "A",
    descripcion: "Co-factor esencial: La Vitamina B6 actúa como ligando para la penetración intracelular del magnesio en neuronas y miocardiocitos.",
    beneficios: ["Relajación muscular", "Reducción de ansiedad", "Alivio del síndrome premenstrual"],
    precauciones: ["No superar 25 mg/día de B6 en tratamientos crónicos"],
    mecanismo: "La B6 facilita el transporte activo de magnesio a través de membranas celulares y potencia la síntesis de GABA.",
    categorias: ["mineral", "vitamina"],
    sistemas: ["nervioso", "musculoesqueletico"]
  },
  {
    id: "sin_curcuma_piperina_absorcion",
    ingredienteA: "curcuma",
    ingredienteB: "pimienta_negra",
    tipo: "sinergia",
    nivelEvidencia: "A",
    descripcion: "Aumento masivo de biodisponibilidad: La piperina inhibe la glucuronidación hepática de los curcuminoides aumentando su absorción un 2000%.",
    beneficios: ["Acción antiinflamatoria sistémica", "Alivio articular", "Protección antioxidante"],
    precauciones: ["Precaución si toma anticoagulantes o sustratos de CYP3A4"],
    mecanismo: "Inhibición de la glucuronidación intestinal y hepática mediante piperina.",
    categorias: ["fitoterapia", "fitoterapia"],
    sistemas: ["musculoesqueletico", "digestivo"]
  },
  {
    id: "sin_quercetina_vitamina_c_inmune",
    ingredienteA: "quercetina",
    ingredienteB: "vitamina_c",
    tipo: "sinergia",
    nivelEvidencia: "B",
    descripcion: "Reciclaje antioxidante e inmunomodulación: La Vitamina C regenera la quercetina reducida y potencia su efecto antihistamínico.",
    beneficios: ["Estabilización de mastocitos", "Defensa antiviral", "Salud vascular"],
    precauciones: ["Tomar con alimentos para evitar molestias gástricas"],
    mecanismo: "La Vitamina C reduce los radicales fenoxil de la quercetina, regenerando su capacidad antioxidante activa.",
    categorias: ["fitoterapia", "vitamina"],
    sistemas: ["inmune", "respiratorio"]
  },
  {
    id: "sin_probiotico_inulina_simbiotico",
    ingredienteA: "l_acidophilus",
    ingredienteB: "inulina",
    tipo: "sinergia",
    nivelEvidencia: "A",
    descripcion: "Efecto simbiótico perfecto: La inulina actúa como sustrato prebiótico selectivo estimulando la colonización de cepas probióticas.",
    beneficios: ["Producción de AGCC (butirato)", "Tránsito intestinal", "Inmunidad mucosa"],
    precauciones: ["Introducir gradualmente en SII para evitar meteorismo inicial"],
    mecanismo: "Fermentación colónica de inulina por Lactobacillus generando acetato, propionato y butirato.",
    categorias: ["probiotico", "fitoterapia"],
    sistemas: ["digestivo", "inmune"]
  },
  {
    id: "sin_nac_selenio_glutation",
    ingredienteA: "nac",
    ingredienteB: "selenio",
    tipo: "sinergia",
    nivelEvidencia: "A",
    descripcion: "Sinergia precursora del Glutatión: NAC aporta L-cisteína y el Selenio es el cofactor catalítico de la Glutatión Peroxidasa (GPx).",
    beneficios: ["Detoxificación hepática", "Mucolítico pulmonar", "Protección mitocondrial"],
    precauciones: ["Asegurar hidratación adecuada"],
    mecanismo: "NAC dona el grupo sulfhidrilo limiting step para GSH; Selenio integra el sitio activo de la enzima selenoproteína GPx.",
    categorias: ["aminoacido", "mineral"],
    sistemas: ["hepatico", "respiratorio"]
  },
  {
    id: "sin_coq10_omega_3_cardio",
    ingredienteA: "coq10",
    ingredienteB: "omega_3",
    tipo: "sinergia",
    nivelEvidencia: "A",
    descripcion: "Protección cardiovascular y biodisponibilidad: La matriz lipídica de los ácidos grasos Omega-3 optimiza la absorción de CoQ10.",
    beneficios: ["Función endotelial", "Energía miocárdica", "Reducción de triglicéridos"],
    precauciones: ["Controlar INR si toma antivitaminas K"],
    mecanismo: "CoQ10 sostiene la fosforilación oxidativa mitocondrial; EPA/DHA reducen la síntesis hepática de VLDL.",
    categorias: ["vitamina", "vitamina"],
    sistemas: ["cardiovascular", "metabolico"]
  },
  {
    id: "sin_ginkgo_bacopa_cognitivo",
    ingredienteA: "ginkgo",
    ingredienteB: "bacopa",
    tipo: "sinergia",
    nivelEvidencia: "B",
    descripcion: "Alineación nootrópica: Ginkgo mejora la perfusión microvascular cerebral y Bacopa promueve la arborización dendrítica.",
    beneficios: ["Memoria a corto/largo plazo", "Velocidad de procesamiento", "Microcirculación cerebral"],
    precauciones: ["Suspender 14 días antes de cirugías programadas"],
    mecanismo: "Ginkgólidos inhiben el PAF vasodilatando capilares; Bacosidos A y B estimulan la quinasa neuronal.",
    categorias: ["fitoterapia", "fitoterapia"],
    sistemas: ["nervioso"]
  },
  {
    id: "sin_passiflora_valeriana_sueño",
    ingredienteA: "pasiflora",
    ingredienteB: "valeriana",
    tipo: "sinergia",
    nivelEvidencia: "A",
    descripcion: "Dúo ansiolítico-sedante clásico: Pasiflora inhibe la recaptación de GABA y Valeriana modula la respuesta del receptor GABA-A.",
    beneficios: ["Inducción rápida del sueño", "Sueño profundo no-REM", "Reducción de despertares"],
    precauciones: ["Evitar conducir o usar maquinaria tras la toma"],
    mecanismo: "Potenciación alostérica y reducción de la degradación enzimática de GABA por GABA-transaminasa.",
    categorias: ["fitoterapia", "fitoterapia"],
    sistemas: ["nervioso"]
  }
];

let addedCount = 0;
for (const syn of newSynergies) {
  if (!ingIds.has(syn.ingredienteA) || !ingIds.has(syn.ingredienteB)) {
    console.log(`Skipping ${syn.id}: invalid ingredient references (${syn.ingredienteA}, ${syn.ingredienteB})`);
    continue;
  }
  const pairKey = [syn.ingredienteA, syn.ingredienteB].sort().join('::');
  if (existingPairs.has(pairKey)) {
    console.log(`Skipping ${syn.id}: pair already exists`);
    continue;
  }
  s3.sinergias.push(syn);
  existingPairs.add(pairKey);
  addedCount++;
}

fs.writeFileSync(s3Path, JSON.stringify(s3, null, 2), 'utf8');
console.log(`Successfully added ${addedCount} new high-value clinical synergies to sinergias_3.json!`);
