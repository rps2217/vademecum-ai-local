const fs = require('fs');
const path = require('path');

const pat3Path = path.join(__dirname, '../src/db/seeders/data/patologias_3.json');
const data = JSON.parse(fs.readFileSync(pat3Path, 'utf8'));

const clinicalData = {
  "ulcera_peptica": {
    "epidemiologia": "Prevalencia global 5-10% a lo largo de la vida. Incidencia decreciente por erradicación de H. pylori, pero sostenida por uso masivo de AINEs en ancianos. H. pylori causa 70-90% de úlceras duodenales y 60% gástricas.",
    "factoresRiesgo": [
      "Infección por Helicobacter pylori",
      "Uso crónico de AINEs/Aspirina",
      "Tabaquismo y consumo de alcohol",
      "Estrés fisiológico grave (úlceras de estrés en UCI)",
      "Síndrome de Zollinger-Ellison",
      "Antecedentes familiares de ulcerogénesis"
    ],
    "diagnostico": "Endoscopia digestiva alta (EDA) con biopsia (elección para confirmación y descartar malignidad en úlcera gástrica). Test de aliento con 13C-urea o antígeno en heces para H. pylori.",
    "criteriosDiagnostico": [
      "Visualización endoscópica de solución de continuidad en mucosa ≥5 mm",
      "Confirmación de H. pylori mediante Ureasa rápida / Histología / Test del aliento",
      "Dolor epigástrico ardoroso (mejora con alimentos en duodenal, empeora en gástrica)",
      "Ausencia de signos de alarma (disfagia, anemia, vómitos recurrentes, pérdida de peso)"
    ],
    "escalasClinicas": [
      {
        "nombre": "Clasificación de Forrest",
        "uso": "Estratificación de riesgo de sangrado en úlcera péptica activa por EDA",
        "rango": "Ia a III",
        "interpretacion": "Ia-Ib sangrado activo (alto riesgo); IIa-IIc estigmas recientes; III base limpia (bajo riesgo)"
      },
      {
        "nombre": "Escala de Rockall",
        "uso": "Predicción de mortalidad y resangrado post-endoscópico",
        "rango": "0-11",
        "interpretacion": "<2 excelente pronóstico; >5 alta mortalidad y riesgo de resangrado"
      }
    ],
    "diagnosticoDiferencial": [
      "Dispepsia funcional",
      "Enfermedad por reflujo gastroesofágico (ERGE)",
      "Adenocarcinoma gástrico",
      "Pancreatitis crónica / Aguda",
      "Colelitiasis / Colecistitis",
      "Isquemia mesentérica"
    ],
    "pronostico": "Excelente con erradicación de H. pylori (>90% curación) y retirada de AINEs. Riesgo de complicaciones (hemorragia 15%, perforación 2-10%, estenosis pilórica)."
  },
  "enfermedad_inflamatoria_intestinal": {
    "epidemiologia": "Prevalencia en aumento global (>0.3% en países desarrollados). Incluye Colitis Ulcerosa (CU) y Enfermedad de Crohn (EC). Pico bimodal de incidencia a los 15-30 años y 50-70 años.",
    "factoresRiesgo": [
      "Disbiosis intestinal y predisposición genética (NOD2 en Crohn)",
      "Tabaquismo (factor de riesgo en Crohn, protector paradójico en CU)",
      "Dieta occidentalizada (alta en ultraprocesados y grasas saturadas)",
      "Uso previo de antibióticos y AINEs",
      "Infecciones entéricas infantiles y falta de lactancia materna"
    ],
    "diagnostico": "Ileocolonoscopia con biopsias segmentarias múltiples. Elevación de calprotectina fecal (>150 µg/g). Entero-RM o entero-TC para evaluación de intestino delgado en Crohn.",
    "criteriosDiagnostico": [
      "Inflamación continua mucosa que inicia en recto y asciende (Colitis Ulcerosa)",
      "Inflamación transmural, salteada ('skip lesions') y granulomas no caseificantes (Crohn)",
      "Calprotectina fecal elevada + reactantes de fase aguda (PCR/VSG)",
      "Descarte de colitis infecciosa (Clostridium difficile, parásitos)"
    ],
    "escalasClinicas": [
      {
        "nombre": "Índice de Mayo (Colitis Ulcerosa)",
        "uso": "Evaluación de severidad clínica y endoscópica en CU",
        "rango": "0-12",
        "interpretacion": "0-2 remisión; 3-5 leve; 6-10 moderada; 11-12 severa"
      },
      {
        "nombre": "CDAI (Crohn's Disease Activity Index)",
        "uso": "Medición de actividad en Enfermedad de Crohn",
        "rango": "0-600",
        "interpretacion": "<150 remisión; 150-220 leve-moderada; 220-450 moderada-severa; >450 muy severa"
      }
    ],
    "diagnosticoDiferencial": [
      "Colitis infecciosa (Campylobacter, Salmonella, C. difficile)",
      "Síndrome de Intestino Irritable (SII-D)",
      "Colitis isquémica",
      "Colitis microscópica (colágena/linfocítica)",
      "Tuberculosis intestinal",
      "Colitis por radiación / AINEs"
    ],
    "pronostico": "Enfermedad crónica con brotes y remisiones. 20-30% de pacientes con CU y hasta 70% con Crohn requerirán cirugía a lo largo de la vida. Riesgo incrementado de adenocarcinoma colorrectal a los 8-10 años de evolución."
  },
  "artritis_psoriasica": {
    "epidemiologia": "Afecta al 10-30% de pacientes con psoriasis cutánea. Prevalencia en población general 0.1-0.25%. Afecta por igual a hombres y mujeres, onset típico entre 30 y 50 años.",
    "factoresRiesgo": [
      "Antecedente de psoriasis cutánea o ungueal (pitting, onicolisis)",
      "Antecedentes familiares de psoriasis o APs (HLA-B27 positivo en forma axial)",
      "Traumatismo articular previo (fenómeno de Koebner profundo)",
      "Infecciones estreptocócicas o estrés psicosocial",
      "Obesidad y síndrome metabólico"
    ],
    "diagnostico": "Clínico y radiológico según criterios CASPAR. Ausencia de factor reumatoide (seronegativa). Ecografía articular o RM para detección temprana de entesitis y dactilitis.",
    "criteriosDiagnostico": [
      "Criterios CASPAR (score ≥3): Evidencia de psoriasis (2 pts si actual, 1 si personal/familiar)",
      "Distrofia ungueal psoriásica (1 pt)",
      "Factor reumatoide negativo (1 pt)",
      "Dactilitis actual o historia de dactilitis ('dedo en salchicha') (1 pt)",
      "Evidencia radiográfica de formación ósea yuxtaarticular (1 pt)"
    ],
    "escalasClinicas": [
      {
        "nombre": "DAPSA (Disease Activity index for PSoriatic Arthritis)",
        "uso": "Evaluación de la actividad articular en APs",
        "rango": "0-150",
        "interpretacion": "≤4 remisión; 5-14 baja; 15-28 moderada; >28 alta actividad"
      },
      {
        "nombre": "MDA (Minimal Disease Activity)",
        "uso": "Objetivo terapéutico de mínima actividad",
        "rango": "7 Dominios",
        "interpretacion": "Cumplimiento de al menos 5 de los 7 criterios para definir remisión clínica"
      }
    ],
    "diagnosticoDiferencial": [
      "Artritis Reumatoide (seropositiva, simétrica, no entesítica)",
      "Gota y Pseudogota (artropatías microcristalinas)",
      "Osteoartrosis nodal de manos",
      "Espondiloartritis anquilosante",
      "Artritis reactiva"
    ],
    "pronostico": "Variable. Forma erosiva destructiva en 40-60% si no se trata precozmente. Alto impacto funcional y en calidad de vida. Fármacos biológicos (anti-TNF, anti-IL-17, anti-IL-23) transforman el pronóstico."
  },
  "asma_alergica": {
    "epidemiologia": "Forma más frecuente de asma (60-80% del asma infantil y 50% en adultos). Afecta a >300 millones de personas en el mundo. Frecuente coetaneidad con rinitis alérgica y dermatitis atópica (marcha atópica).",
    "factoresRiesgo": [
      "Atopia personal o familiar (IgE elevada)",
      "Exposición a aeroalérgenos (ácaros, polen, epitelios de animales, hongos)",
      "Tabaquismo pasivo infantil o activo",
      "Infecciones víricas respiratorias tempranas (VRS, rinovirus)",
      "Contaminación ambiental y exposición laboral"
    ],
    "diagnostico": "Espirometría con prueba de broncodilatación positiva (aumento del FEV1 >12% y >200 mL tras salbutamol). Pruebas cutáneas (Prick test) o IgE específica positiva frente a aeroalérgenos.",
    "criteriosDiagnostico": [
      "Síntomas respiratorios variables (sibilancias, disnea, opresión torácica, tos nocturna)",
      "Demostración de limitación variable al flujo aéreo (espirometría con PBD positiva)",
      "Variabilidad diurna del PEF >10%",
      "Demostración de sensibilización alérgica IgE-mediada"
    ],
    "escalasClinicas": [
      {
        "nombre": "ACT (Asthma Control Test)",
        "uso": "Evaluación del control sintomático del asma en las últimas 4 semanas",
        "rango": "5-25",
        "interpretacion": "<20 asma no controlada; 20-24 bien controlada; 25 totalmente controlada"
      },
      {
        "nombre": "Clasificación GINA de Severidad",
        "uso": "Escalonamiento terapéutico según tratamiento requerido",
        "rango": "Escalones 1 a 5",
        "interpretacion": "Escalón 1-2 asma leve; Escalón 3-4 moderada; Escalón 5 severa/resistente"
      }
    ],
    "diagnosticoDiferencial": [
      "EPOC (limitación irreversible al flujo aéreo)",
      "Síndrome de disfunción de cuerdas vocales / Broncoespasmo inducido por ejercicio",
      "Insuficiencia cardíaca izquierda (asma cardíaca)",
      "Bronquiectasias",
      "Reflujo gastroesofágico con microaspiración",
      "Cuerpo extraño traqueobronquial"
    ],
    "pronostico": "Excelente control con corticoides inhalados (ICS) y agonistas LABA. Riesgo persistente de exacerbaciones graves si hay mala adherencia o exposición continuada al alérgeno."
  },
  "cancer_prevencion": {
    "epidemiologia": "30-50% de los casos de cáncer son prevenibles reduciendo factores de riesgo modificables. El cáncer es la segunda causa de muerte mundial (10 millones de fallecimientos/año).",
    "factoresRiesgo": [
      "Consumo de tabaco (responsable del 25% de muertes por cáncer)",
      "Obesidad, sedentarismo y dieta rica en carnes procesadas/ultraprocesados",
      "Consumo perjudicial de alcohol",
      "Infecciones oncogénicas (VPH, VHB, VHC, H. pylori)",
      "Exposición a radiación UV y radón ambiental",
      "Mutaciones germinales hereditarias (BRCA1/2, Lynch)"
    ],
    "diagnostico": "Estrategias de cribado poblacional primario y secundario (mamografía, citología/VPH, sangre oculta en heces/colonoscopia, TC de baja dosis en fumadores).",
    "criteriosDiagnostico": [
      "Evaluación del perfil de riesgo individual y familiar",
      "Cumplimiento de pautas de cribado según edad y grupo de riesgo",
      "Identificación de lesiones premalignas (pólipos adenomatosos, CIN)",
      "Marcadores genéticos en familias de alto riesgo"
    ],
    "escalasClinicas": [
      {
        "nombre": "Código Europeo Contra el Cáncer",
        "uso": "12 recomendaciones basadas en evidencia para la prevención primaria",
        "rango": "12 Pautas",
        "interpretacion": "Cumplimiento integral reduce significativamente la incidencia tumoral poblacional"
      },
      {
        "nombre": "Gail Model / Tyrer-Cuzick",
        "uso": "Estimación del riesgo de cáncer de mama a 5 años y lifetime",
        "rango": "0-100%",
        "interpretacion": ">1.67% a 5 años se considera riesgo elevado (candidato a quimioprevención/cribado intensivo)"
      }
    ],
    "diagnosticoDiferencial": [
      "Condiciones inflamatorias crónicas benignas",
      "Lesiones benignas fibrocísticas/hiperplásicas",
      "Síndromes de inmunodeficiencia"
    ],
    "pronostico": "La adopción de estilos de vida saludables junto a la detección precoz reduce la mortalidad tumoral hasta en un 40-50%."
  },
  "diabetes_tipo2": {
    "epidemiologia": "Afecta a más de 530 millones de adultos en el mundo (10.5% de prevalencia mundial). Se prevé que alcance los 780 millones en 2045. Representa el 90% de todos los casos de diabetes.",
    "factoresRiesgo": [
      "Sobrepeso u obesidad (IMC ≥25 kg/m² o adiposidad visceral elevada)",
      "Sedentarismo e inactividad física",
      "Antecedentes familiares de diabetes de primer grado",
      "Diabetes gestacional previa o síndrome de ovario poliquístico (SOP)",
      "Hipertensión arterial y dislipidemia (HDL bajo, triglicéridos altos)",
      "Etnias de alto riesgo y edad ≥45 años"
    ],
    "diagnostico": "Criterios ADA: Glucemia en ayunas ≥126 mg/dL, HbA1c ≥6.5%, Glucemia a las 2h de SOG (75g) ≥200 mg/dL, o glucemia aleatoria ≥200 mg/dL con síntomas de hiperglucemia.",
    "criteriosDiagnostico": [
      "HbA1c ≥ 6.5% (confirmada en segunda muestra si asintomático)",
      "Glucemia plasmática en ayunas (≥8h) ≥ 126 mg/dL",
      "SOG 75g a las 2 horas ≥ 200 mg/dL",
      "Síntomas clásicos (poliuria, polidipsia, polifagia, pérdida de peso) + glucemia casual ≥200 mg/dL"
    ],
    "escalasClinicas": [
      {
        "nombre": "FINDRISC (Finnish Diabetes Risk Score)",
        "uso": "Cribado y predicción del riesgo de desarrollar DM2 a 10 años",
        "rango": "0-26",
        "interpretacion": "<7 bajo; 7-11 ligeramente elevado; 12-14 moderado; 15-20 alto; >20 muy alto (>50% riesgo)"
      },
      {
        "nombre": "Objetivos de Control ADA/EASD",
        "uso": "Monitorización del control glucémico",
        "rango": "HbA1c target",
        "interpretacion": "HbA1c <7.0% general; <6.5% joven/sin comorbilidad; <8.0% anciano frágil"
      }
    ],
    "diagnosticoDiferencial": [
      "Diabetes Mellitus Tipo 1 (autoanticuerpos positivos Anti-GAD, IA-2)",
      "LADA (Latent Autoimmune Diabetes in Adults)",
      "Diabetes MODY (monogénica)",
      "Diabetes secundaria a pancreatitis/corticoides",
      "Diabetes insípida"
    ],
    "pronostico": "Enfermedad progresiva. Control intensivo precoz previene complicaciones microvasculares (retinopatía, nefropatía, neuropatía) y macrovasculares (Ictus, IAM, arteriopatía periférica)."
  },
  "neuropatia_periferica": {
    "epidemiologia": "Prevalencia general 2-7%, aumentando a >50% en pacientes con diabetes de larga evolución. Otras causas frecuentes incluyen alcoholismo, quimioterapia (CIPN) y déficit de vitamina B12.",
    "factoresRiesgo": [
      "Diabetes mellitus mal controlada (hiperglucemia crónicamente elevada)",
      "Consumo excesivo de alcohol y deficiencias nutricionales (B1, B6, B12)",
      "Tratamiento con quimioterápicos (oxaliplatino, paclitaxel, vincristina)",
      "Enfermedades autoinmunes (vasculitis, lupus, Sjögren)",
      "Insuficiencia renal crónica (neuropatía urémica)",
      "Infecciones (VIH, lepra, borreliosis de Lyme)"
    ],
    "diagnostico": "Examen neurológico clínico (sensibilidad vibratoria con diapasón 128 Hz, monofilamento de Semmes-Weinstein 10g, reflejos osteotendinosos). Electromiograma y velocidad de conducción nerviosa (ENG/EMG).",
    "criteriosDiagnostico": [
      "Síntomas sensitivos simétricos en 'distribución en guante y calcetín' (parestesias, disestesias, dolor ardoroso)",
      "Pérdida de sensibilidad vibratoria/posicional y/o hipoalgesia distal",
      "Pérdida o disminución de reflejos aquíleos",
      "Anomalías en estudios de conducción nerviosa distal"
    ],
    "escalasClinicas": [
      {
        "nombre": "DN4 (Douleur Neuropathique 4 Questions)",
        "uso": "Cribado de dolor neuropático",
        "rango": "0-10",
        "interpretacion": "Score ≥4/10 sugiere fuertemente dolor neuropático"
      },
      {
        "nombre": "Michigan Neuropathy Screening Instrument (MNSI)",
        "uso": "Cribado de neuropatía diabética periférica",
        "rango": "0-10",
        "interpretacion": ">2.5 puntos en la exploración física es diagnóstico de neuropatía"
      }
    ],
    "diagnosticoDiferencial": [
      "Radiculopatía lumbosacra o cervical (compresión radicular)",
      "Síndrome del túnel carpiano / Atrapamientos nerviosos focales",
      "Enfermedad arterial periférica isquémica",
      "Mielopatía espondilótica o por déficit de B12",
      "SDRC (Síndrome Doloroso Regional Complejo)"
    ],
    "pronostico": "Depende de la causa subyacente. El control estricto de la glucemia detiene la progresión en diabetes. El daño axónico grave puede ser irreversible, requiriendo manejo sintmático sintomático a largo plazo."
  },
  "cancer_mama_prevencion": {
    "epidemiologia": "Es el cáncer más frecuente en mujeres a nivel mundial (2.3 millones de nuevos casos/año). 1 de cada 8 mujeres desarrollará cáncer de mama a lo largo de su vida.",
    "factoresRiesgo": [
      "Edad avanzada y sexo femenino",
      "Mutaciones genéticas hereditarias (BRCA1, BRCA2, PALB2, TP53)",
      "Historia familiar de primer grado de cáncer de mama/ovario",
      "Exposición estrogénica prolongada (menarquia precoz, menopausia tardía, nuliparidad)",
      "Densidad mamaria elevada en mamografía",
      "Consumo de alcohol, obesidad postmenopáusica y terapia hormonal sustitutiva (THS) combinada"
    ],
    "diagnostico": "Cribado mamográfico bienal en mujeres de 50 a 69 años (o desde los 40 en alto riesgo). Complementado con ecografía mamaria y RM mamaria en mamas densas o mutación BRCA.",
    "criteriosDiagnostico": [
      "Mamografía de cribado con clasificación BI-RADS",
      "BI-RADS 1-2: benigno/normal; BI-RADS 3: probablemente benigno (seguimiento 6 meses)",
      "BI-RADS 4-5: sospecha de malignidad -> Biopsia con aguja gruesa (BAG)",
      "Estudio histológico e inmunohistoquímico (RE, RP, HER2, Ki-67)"
    ],
    "escalasClinicas": [
      {
        "nombre": "BI-RADS (Breast Imaging Reporting and Data System)",
        "uso": "Estandarización del informe mamográfico y asignación de riesgo",
        "rango": "0 a 6",
        "interpretacion": "0 incompleto; 1-2 benigno; 3 probablemente benigno; 4 sospechoso; 5 altamente sospechoso de malignidad; 6 malignidad confirmada"
      },
      {
        "nombre": "Gail Model / Tyrer-Cuzick Score",
        "uso": "Cálculo de riesgo individual de cáncer de mama",
        "rango": "0-100%",
        "interpretacion": "Identifica candidatas a quimioprevención (Tamoxifeno/Anastrozol) o RM de cribado"
      }
    ],
    "diagnosticoDiferencial": [
      "Fibroadenoma mamario",
      "Quistes mamarios benignos",
      "Mastopatía fibrocística",
      "Ectasia ductal / Papiloma intraductal",
      "Necrosis grasa mamaria"
    ],
    "pronostico": "La detección en estadios precoces (I-II) presenta una supervivencia a 5 años >90-95%."
  },
  "osteopenia": {
    "epidemiologia": "Afecta a >40% de las mujeres postmenopáusicas y al 20% de los varones >50 años. Precursora directa de la osteoporosis y fracturas fragilidad.",
    "factoresRiesgo": [
      "Deficiencia estrogénica (menopausia precoz, oophorectomía)",
      "Bajo aporte dietético de calcio y vitamina D",
      "Uso crónico de glucocorticoides sistémicos (≥5 mg/día de prednisona >3 meses)",
      "Consumo de tabaco y alcoholismo",
      "Sedentarismo y falta de ejercicio de impacto/fuerza",
      "Bajo peso corporal (IMC <19 kg/m²)"
    ],
    "diagnostico": "Densitometría ósea por absorciometría de rayos X de energía doble (DEXA) en columna lumbar y cuello femoral.",
    "criteriosDiagnostico": [
      "T-score entre -1.0 y -2.5 desviaciones estándar (DE) en DEXA",
      "Ausencia de fractura por fragilidad previa (si hay fractura, se clasifica como osteoporosis grave independientemente del T-score)",
      "Descarte de causas secundarias de pérdida ósea (hiperparatiroidismo, mieloide, déficit de Vit D)"
    ],
    "escalasClinicas": [
      {
        "nombre": "FRAX (Fracture Risk Assessment Tool)",
        "uso": "Cálculo del riesgo de fractura osteoporótica mayor y de cadera a 10 años",
        "rango": "0-100%",
        "interpretacion": "Riesgo alto de fractura mayor (>20%) o cadera (>3%) indica necesidad de tratamiento farmacológico incluso con osteopenia"
      },
      {
        "nombre": "T-Score DEXA",
        "uso": "Clasificación de densidad mineral ósea comparada con joven sano",
        "rango": "-4.0 a +2.0",
        "interpretacion": ">-1.0 Normal; -1.0 a -2.5 Osteopenia; <-2.5 Osteoporosis"
      }
    ],
    "diagnosticoDiferencial": [
      "Osteoporosis (T-score ≤-2.5)",
      "Osteomalacia (deficiencia severa de Vitamina D / mineralización alterada)",
      "Mieloma múltiple",
      "Hiperparatiroidismo primario",
      "Enfermedad de Paget ósea"
    ],
    "pronostico": "Reversible o estabilizable con optimización de estilo de vida, calcio, vitamina D3 + K2, y ejercicio de fuerza. Previene la progresión a osteoporosis."
  },
  "cardiopatia_isquemica": {
    "epidemiologia": "Primera causa de muerte a nivel mundial (9 millones de fallecimientos/año). Afecta al 5-8% de la población adulta en países desarrollados.",
    "factoresRiesgo": [
      "Dislipidemia (LDL elevado, ApoB alta, HDL bajo)",
      "Hipertensión arterial (PAS ≥140 o PAD ≥90 mmHg)",
      "Tabaquismo activo o pasivo",
      "Diabetes mellitus y resistencia a la insulina",
      "Obesidad abdominal y síndrome metabólico",
      "Estrés crónico, sedentarismo y antecedentes familiares tempranos"
    ],
    "diagnostico": "ECG de 12 derivaciones, troponinas cardíacas de alta sensibilidad (I/T), prueba de esfuerzo (ergometría), Ecocardiograma y Angio-TC coronario o Coronariografía invasiva.",
    "criteriosDiagnostico": [
      "Dolor torácico opresivo retroesternal irradiado a brazo izquierdo, cuello o mandíbula",
      "Ascenso o descenso del segmento ST / onda T invertida en ECG",
      "Elevación dinámica de troponinas cardíacas por encima del percentil 99 (SICA)",
      "Estenosis coronaria ≥50% en Angio-TC o Coronariografía"
    ],
    "escalasClinicas": [
      {
        "nombre": "SCORE2 / SCORE2-OP (ESC)",
        "uso": "Estimación del riesgo cardiovascular de eventos fatales y no fatales a 10 años",
        "rango": "0-50%",
        "interpretacion": "Bajo (<2.5%), Moderado (2.5-7.5%), Alto (7.5-15%), Muy Alto (≥15%)"
      },
      {
        "nombre": "Escala GRACE / TIMI",
        "uso": "Estratificación de riesgo de mortalidad en Síndrome Coronario Agudo",
        "rango": "0-200+",
        "interpretacion": "Guía la estrategia invasiva precoz (<24h) en SICA sin elevación del ST"
      }
    ],
    "diagnosticoDiferencial": [
      "Pericarditis / Miocarditis aguda",
      "Tromboembolismo pulmonar (TEP)",
      "Dissección aórtica aguda",
      "Espasmo esofágico / ERGE grave",
      "Costocondritis (Síndrome de Tietze)",
      "Crisis de pánico / Ansiedad"
    ],
    "pronostico": "Marcada mejora en las últimas décadas por angioplastia primaria (SICP) y prevención secundaria (estatinas, antiagregación doble, iSGLT2, IECA/ARA2)."
  },
  "depresion_resistente": {
    "epidemiologia": "Afecta al 20-30% de los pacientes con Trastorno Depresivo Mayor. Alta carga de discapacidad, morbimortalidad y riesgo de suicidio.",
    "factoresRiesgo": [
      "Historia de trauma infantil o estresores graves continuados",
      "Comorbilidad con trastornos de personalidad, ansiedad o dolor crónico",
      "Diagnóstico tardío o infradosificación de antidepresivos previos",
      "Factores biológicos (neuroinflamación, disfunción eje HPA, alteración neuroplasticidad BDNF)",
      "Consumo concomitante de alcohol o drogas"
    ],
    "diagnostico": "Fracaso de al menos dos ensayos terapéuticos con antidepresivos de diferente clase, a dosis adecuadas y durante un tiempo suficiente (4-8 semanas) con adherencia confirmada.",
    "criteriosDiagnostico": [
      "Cumplimiento de criterios DSM-5 de Trastorno Depresivo Mayor",
      "Falta de respuesta (<50% reducción de síntomas) a ≥2 antidepresivos de clases distintas",
      "Adherencia terapéutica adecuadamente verificada (descartar pseudo-resistencia)",
      "Evaluación y descarte de causas médicas subyacentes (hipotiroidismo, déficit B12)"
    ],
    "escalasClinicas": [
      {
        "nombre": "MADRS (Montgomery-Åsberg Depression Rating Scale)",
        "uso": "Evaluación de severidad y cambio sintomático en depresión",
        "rango": "0-60",
        "interpretacion": "0-6 normal; 7-19 leve; 20-34 moderada; >34 severa"
      },
      {
        "nombre": "PHQ-9 (Patient Health Questionnaire-9)",
        "uso": "Cribado y autoinforme de gravedad depresiva",
        "rango": "0-27",
        "interpretacion": "<5 leve; 10-14 moderada; 15-19 moderadamente severa; 20-27 severa"
      }
    ],
    "diagnosticoDiferencial": [
      "Trastorno Bipolar (fase depresiva no reconocida)",
      "Pseudo-resistencia por falta de adherencia o dosis insuficiente",
      "Hipotiroidismo severo / Enfermedad de Cushing",
      "Déficit severo de Vitamina B12 o Folato",
      "Demencia incipiente / Trastorno cognitivo vascular"
    ],
    "pronostico": "Reservado sin intervención especializada. Estrategias de potenciación (Esketamina intranasal, Litio, Antipsicóticos atípicos, Terapia Electroconvulsiva - TEC, Estimulación Magnética Transcraneal - EMT) logran remisión en un porcentaje significativo de casos."
  },
  "enfermedad_renal_cronica": {
    "epidemiologia": "Afecta al 10-14% de la población mundial (>800 millones de personas). Las causas principales son la Diabetes Mellitus (40%) y la Hipertensión Arterial (30%).",
    "factoresRiesgo": [
      "Diabetes Mellitus Tipo 1 y Tipo 2 mal controladas",
      "Hipertensión Arterial no controlada",
      "Glomerulonefritis crónicas y enfermedad poliquística renal",
      "Uso prolongado de AINEs y fármacos nefrotóxicos",
      "Edad >65 años y enfermedad cardiovascular previa",
      "Obesidad y tabaquismo"
    ],
    "diagnostico": "Filtrado Glomerular Estimado (FGe por fórmula CKD-EPI) <60 mL/min/1.73m² y/o presencia de cociente albúmina/creatinina en orina (CAC) ≥30 mg/g persistente durante >3 meses.",
    "criteriosDiagnostico": [
      "FGe < 60 mL/min/1.73m² durante más de 3 meses",
      "Y/o marcadores de daño renal (Albuminuria CAC ≥30 mg/g, alteración en sedimento orina, anomalías estructurales ecográficas)",
      "Estratificación según estadios KDIGO (G1 a G5 y A1 a A3)"
    ],
    "escalasClinicas": [
      {
        "nombre": "Estratificación KDIGO (G1-G5 / A1-A3)",
        "uso": "Clasificación de severidad y riesgo de progresión en ERC",
        "rango": "G1 (≥90) a G5 (<15); A1 (<30) a A3 (>300 mg/g)",
        "interpretacion": "Guía el seguimiento nefrológico, ajuste de dosis de fármacos y preparación para TRS"
      }
    ],
    "diagnosticoDiferencial": [
      "Fracaso Renal Agudo (FRA) / Daño Renal Agudo sobreañadido",
      "Nefropatía obstructiva revertible",
      "Estenosis de arteria renal",
      "Glomerulonefritis rápidamente progresiva"
    ],
    "pronostico": "Progresivo sin tratamiento. La introducción de inhibidores SGLT2, iECA/ARA2 y finerenona ha transformado el pronóstico retrasando significativamente la necesidad de diálisis o trasplante."
  },
  "cirrosis_hepatica": {
    "epidemiologia": "Etapa final de las hepatopatías crónicas. Causa >1.3 millones de muertes/año a nivel mundial. Causas principales: Esteatohepatitis asociada a disfunción metabólica (MASH/MASLD), Alcohol y Hepatitis B/C.",
    "factoresRiesgo": [
      "Consumo crónico y excesivo de alcohol",
      "Infección crónica por Virus de Hepatitis C (VHC) o Hepatitis B (VHB)",
      "Síndrome metabólico, obesidad y diabetes (esteatosis hepática metabólica MASH)",
      "Enfermedades autoinmunes (Colangitis Biliar Primaria, Hepatitis Autoinmune)",
      "Sobrecarga de hierro (Hemocromatosis) o cobre (Enfermedad de Wilson)",
      "Uso continuado de hepatotóxicos"
    ],
    "diagnostico": "Biopsia hepática (gold standard histórico) o métodos no invasivos: Elastografía de transición (FibroScan >12.5-15 kPa), Ecografía abdominal y marcadores serológicos (FIB-4 >2.67).",
    "criteriosDiagnostico": [
      "Signos ecográficos de distorsión de la arquitectura hepática (superficie nodular, hipertrofia del lóbulo izquierdo/caudado)",
      "Evidencia de hipertensión portal (esplenomegalia, varices esofágicas, ascitis)",
      "Rigidez hepática en FibroScan >15 kPa",
      "Alteración del perfil de síntesis (INR elevado, albúmina baja, trombopenia)"
    ],
    "escalasClinicas": [
      {
        "nombre": "Escala Child-Pugh",
        "uso": "Evaluación del pronóstico y severidad de la cirrosis hepática",
        "rango": "5-15 puntos (Clases A, B, C)",
        "interpretacion": "Clase A (5-6 pts): compensada; Clase B (7-9 pts): compromiso funcional; Clase C (10-15 pts): descompensada grave"
      },
      {
        "nombre": "Score MELD / MELD-Na",
        "uso": "Predicción de mortalidad a 3 meses y priorización para trasplante hepático",
        "rango": "6-40",
        "interpretacion": "Score más alto indica mayor urgencia y mortalidad a corto plazo"
      }
    ],
    "diagnosticoDiferencial": [
      "Esteatosis hepática no cirrótica",
      "Síndrome de Budd-Chiari (trombosis venas hepáticas)",
      "Insuficiencia cardíaca derecha / Hígado de congestión",
      "Fibrosis hepática congénita",
      "Esquistosomiasis"
    ],
    "pronostico": "Compensada (Child A): mediana de supervivencia >12 años. Descompensada (ascitis, hemorragia por varices, encefalopatía): supervivencia mediana <2 años sin trasplante."
  },
  "migrana_cronica": {
    "epidemiologia": "Prevalencia global de migraña 14-15%; la migraña crónica afecta al 1-2% de la población general. Marcada predominancia femenina (3:1).",
    "factoresRiesgo": [
      "Abuso de medicación sintomática de rescate (triptanes, analgésicos, opioides >10-15 días/mes)",
      "Frecuencia elevada de crisis de migraña episódica inicial",
      "Obesidad, depresión, ansiedad y trastornos del sueño/apnea",
      "Estrés continuado y consumo excesivo de cafeína",
      "Predisposición genética (sensibilización central)"
    ],
    "diagnostico": "Criterios ICHD-3 de la International Headache Society. Cefalea durante ≥15 días al mes durante >3 meses, de los cuales al menos 8 días/mes cumplen criterios de crisis migrañosa.",
    "criteriosDiagnostico": [
      "Cefalea (tipo migrañoso o tensional) ≥15 días al mes durante >3 meses",
      "Al menos 8 días al mes que cumplen criterios de migraña con o sin aura o responden a triptán",
      "No atribuible a otra patología tras anamnesis y exploración neurológica normal"
    ],
    "escalasClinicas": [
      {
        "nombre": "MIDAS (Migraine Disability Assessment)",
        "uso": "Evaluación del impacto y discapacidad funcional por migraña en los últimos 3 meses",
        "rango": "0-27+",
        "interpretacion": "0-5 mínima; 6-10 leve; 11-20 moderada; ≥21 discapacidad severa"
      },
      {
        "nombre": "HIT-6 (Headache Impact Test-6)",
        "uso": "Medición del impacto de la cefalea en la vida diaria",
        "rango": "36-78",
        "interpretacion": "≤49 poco o ningún impacto; 50-55 moderado; 56-59 sustancial; ≥60 impacto severo"
      }
    ],
    "diagnosticoDiferencial": [
      "Cefalea por abuso de medicación (CAM - frecuentemente solapada)",
      "Cefalea de tensión crónica",
      "Hemicránea continua",
      "Hipertensión intracraneal idiopática",
      "Cefalea por arteritis de células gigantes (ancianos)"
    ],
    "pronostico": "Reversible a migraña episódica con tratamiento preventivo adecuado (Anticuerpos monoclonales anti-CGRP, Toxina Botulínica tipo A, Topiramato, CGRP gepantes) y desintoxicación de analgésicos."
  },
  "fibromialgia_dolor": {
    "epidemiologia": "Afecta al 2-4% de la población general. Predominio femenino (80-90%). Caracterizada por dolor musculoesquelético generalizado persistente y sensibilización central.",
    "factoresRiesgo": [
      "Sexo femenino y edad entre 30 y 60 años",
      "Historia de trauma físico o psíquico grave (estrés postraumático)",
      "Enfermedades reumáticas autoinmunes concomitantes (Lupus, AR)",
      "Trastornos del sueño y alteración del procesamiento del dolor en SNC",
      "Antecedentes familiares de síndromes de dolor somático"
    ],
    "diagnostico": "Criterios ACR 2016 basados en el Índice de Dolor Generalizado (WPI) y la Escala de Severidad de Síntomas (SSS). Diagnóstico clínico de exclusión.",
    "criteriosDiagnostico": [
      "WPI ≥7 y SSS ≥5, O WPI 4-6 y SSS ≥9",
      "Dolor generalizado en al menos 4 de 5 regiones corporales",
      "Síntomas presentes durante al menos 3 meses a un nivel similar",
      "El diagnóstico es independiente de otros diagnósticos clínicos existentes"
    ],
    "escalasClinicas": [
      {
        "nombre": "FIQR (Revised Fibromyalgia Impact Questionnaire)",
        "uso": "Evaluación integral del impacto de la fibromialgia",
        "rango": "0-100",
        "interpretacion": "<39 impacto leve; 39-59 moderado; ≥60 severo"
      },
      {
        "nombre": "ACR 2016 WPI/SSS Score",
        "uso": "Criterios diagnósticos y de severidad",
        "rango": "WPI (0-19), SSS (0-12)",
        "interpretacion": "Permite cuantificar la extensión del dolor y la severidad de fatiga/sueño/cognición"
      }
    ],
    "diagnosticoDiferencial": [
      "Polimialgia reumática (VSG/PCR muy elevadas en ancianos)",
      "Spondiloartritis / Artritis Reumatoide incipiente",
      "Hipotiroidismo severo",
      "Miopatías inflamatorias / Miopatía por estatinas",
      "Síndrome de Fatiga Crónica (ME/CFS - solapamiento frecuente)",
      "Déficit severo de Vitamina D"
    ],
    "pronostico": "Condición crónica. La respuesta óptima requiere abordaje multidisciplinar (ejercicio aeróbico graduado, TCC, Duloxetina/Pregabalina, optimización del sueño y nutracéuticos moduladores)."
  },
  "obesidad_sarcopenica": {
    "epidemiologia": "Fenotipo de alto riesgo que combina exceso de adiposidad y pérdida de masa/fuerza muscular. Prevalencia del 5-15% en ancianos, en rápido aumento por el envejecimiento poblacional.",
    "factoresRiesgo": [
      "Envejecimiento (sarcopenia senil) e inactividad física/sedentarismo",
      "Dietas hipoproteicas o malnutrición en el contexto de sobrepeso",
      "Inflamación crónica de bajo grado (meta-inflamación) y resistencia a la insulina",
      "Tratamiento con glucocorticoides o privación androgénica",
      "Enfermedades crónicas debilitantes (IC, EPOC, ERC)"
    ],
    "diagnostico": "Criterios consensuados ESPEN/EASO: Demostración de masa muscular reducida (DXA/BIA) + fuerza muscular disminuida (dinamometría de mano) + exceso de masa grasa.",
    "criteriosDiagnostico": [
      "Baja fuerza muscular (Dinamometría de prensión manual <27 kg en hombres, <16 kg en mujeres)",
      "Masa grasa elevada (Porcentaje de grasa corporal >30% en hombres, >40% en mujeres O IMC ≥30 kg/m²)",
      "Masa muscular apendicular reducida por DXA o BIA (<7.0 kg/m² hombres, <5.5 kg/m² mujeres)",
      "Rendimiento físico disminuido (Velocidad de marcha <0.8 m/s)"
    ],
    "escalasClinicas": [
      {
        "nombre": "SARC-F Questionnaire",
        "uso": "Cribado de sarcopenia en la práctica clínica",
        "rango": "0-10",
        "interpretacion": "Score ≥4 indica sospecha de sarcopenia y necesidad de evaluación funcional"
      },
      {
        "nombre": "SPPB (Short Physical Performance Battery)",
        "uso": "Evaluación del rendimiento físico y fragilidad",
        "rango": "0-12",
        "interpretacion": "<10 indica limitación funcional y alto riesgo de discapacidad"
      }
    ],
    "diagnosticoDiferencial": [
      "Obesidad mórbida simple sin sarcopenia",
      "Sarcopenia no obesa (caquexia)",
      "Distrofias musculares / Enfermedades motoneuronales",
      "Síndrome de Cushing"
    ],
    "pronostico": "Mayor riesgo de caídas, fracturas, discapacidad funcional, institucionalización y mortalidad cardiovascular en comparación con la obesidad o sarcopenia aisladas. Responde a ejercicio de fuerza + ingesta proteica optimizada (1.2-1.5 g/kg/día) + Leucina/HMB/Vit D."
  },
  "sindrome_fatiga_cronica": {
    "epidemiologia": "Afecta al 0.2-1% de la población (Encefalomielitis Miálgica / SFC). Mayor frecuencia en mujeres (3:1), entre los 20 y 50 años. Frecuente desencadenante post-viral (COVID-19 persistente, EBV).",
    "factoresRiesgo": [
      "Infección viral previa (Virus Epstein-Barr, HHV-6, SARS-CoV-2)",
      "Disfunción mitocondrial y estrés oxidativo severo",
      "Desregulación del sistema nervioso autónomo (disautonomía / POTS)",
      "Neuroinflamación y alteración de la inmunidad celular",
      "Estrés físico o emocional extremo previo al inicio"
    ],
    "diagnostico": "Criterios IOM / NAM (2015). Fatiga profunda de >6 meses no explicada + Malestar Post-Esfuerzo (PEM) + Sueño no reparador + Deterioro cognitivo y/o intolerancia ortostática.",
    "criteriosDiagnostico": [
      "Fatiga sustancialmente reducida de >6 meses no debida a esfuerzo excesivo y no aliviada por el reposo",
      "Malestar post-esfuerzo (PEM): empeoramiento sintomático tras mínimo esfuerzo físico o mental",
      "Sueño no reparador",
      "Al menos uno de los siguientes: Deterioro cognitivo ('niebla mental') O Intolerancia ortostática (POTS)"
    ],
    "escalasClinicas": [
      {
        "nombre": "DePaul Symptom Questionnaire (DSQ)",
        "uso": "Estandarización diagnóstica de Encefalomielitis Miálgica / SFC",
        "rango": "0-100",
        "interpretacion": "Evalúa frecuencia y severidad de PEM, disautonomía y fatiga"
      },
      {
        "nombre": "Bell Disability Scale",
        "uso": "Medición del nivel de restricción funcional en el SFC",
        "rango": "0-100",
        "interpretacion": "100 normal; 30-50 moderada restricción doméstica; <20 encamado/dependiente"
      }
    ],
    "diagnosticoDiferencial": [
      "Hipotiroidismo / Insuficiencia suprarrenal",
      "Apnea Obstructiva del Sueño (AOS)",
      "Esclerosis Múltiple / Lupus Eritematoso Sistémico",
      "Depresión mayor (en depresión hay anhedonia, en SFC deseo activo atajado por PEM)",
      "Anemia severa / Síndrome mieloide"
    ],
    "pronostico": "Condición crónica y fluctuante. La tasa de recuperación completa es baja (<10-15%). El manejo se centra en el ritmo de actividad ('Pacing') para evitar desencadenar PEM, junto a soporte mitocondrial (CoQ10, NADH, Carnitina, Mg)."
  },
  "enfermedad_periodontal": {
    "epidemiologia": "La periodontitis severa afecta al 10-15% de los adultos a nivel mundial. Principal causa de pérdida dentaria en adultos >40 años. Fuerte conexión sistémica con diabetes y enfermedad cardiovascular.",
    "factoresRiesgo": [
      "Higiene bucodental deficiente y acumulación de biofilm/cálculo subgingival",
      "Tabaquismo (factor de riesgo independiente más relevante)",
      "Diabetes mellitus mal controlada (relación bidireccional)",
      "Predisposición genética y respuesta inmune hiperinflamatoria",
      "Estrés psicosocial y cambios hormonales (embarazo)"
    ],
    "diagnostico": "Sondaje periodontal completo de 6 localizaciones por diente (Profundidad de Sondaje PS ≥4 mm y Pérdida de Inserción Clínica CAL) + Radiografías periapicales/Bite-wing.",
    "criteriosDiagnostico": [
      "Gingivitis: Sangrado al sondaje (BOP ≥10%) sin pérdida de inserción",
      "Periodontitis: Pérdida de inserción clínica interdental (CAL) detectable en ≥2 dientes no adyacentes",
      "Profundidad de sondaje ≥4 mm con sangrado al sondaje",
      "Reabsorción ósea radiográfica horizontal o vertical"
    ],
    "escalasClinicas": [
      {
        "nombre": "Clasificación EFP/AAP 2018 (Estadios I a IV)",
        "uso": "Estratificación de la severidad y complejidad de la periodontitis",
        "rango": "Estadios I (inicial) a IV (avanzada compleja)",
        "interpretacion": "Determina el nivel de pérdida ósea, pérdida de dientes y necesidad de rehabilitación compleja"
      },
      {
        "nombre": "Grados de Periodontitis (Grados A, B, C)",
        "uso": "Evaluación del riesgo de progresión rápida e impacto sistémico",
        "rango": "Grado A (lenta), B (moderada), C (rápida/fumador/diabético)",
        "interpretacion": "Grado C requiere terapia periodontal intensiva y coadyuvantes sistémicos"
      }
    ],
    "diagnosticoDiferencial": [
      "Gingivitis inducida por placa (sin pérdida de soporte óseo)",
      "Periodontitis como manifestación de enfermedades sistémicas (agranulocitosis, Papillon-Lefèvre)",
      "Lesiones endoperiodontales combinadas",
      "Hiperplasia gingival medicamentosa (fenitoína, amlodipino, ciclosporina)"
    ],
    "pronostico": "Controlable con detartraje y raspado/alisado radicular (RAR), optimización del control de placa en casa, antisépticos (clorhexidina) y coadyuvantes antioxidantes/probióticos."
  },
  "dermatitis_atopica": {
    "epidemiologia": "Afecta al 15-20% de los niños y al 2-8% de los adultos en países desarrollados. Enfermedad inflamatoria cutánea pruriginosa crónica más frecuente.",
    "factoresRiesgo": [
      "Mutaciones de pérdida de función en el gen de la Filagrina (FLG)",
      "Historia familiar de atopia (asma, rinitis alérgica, dermatitis atópica)",
      "Disfunción de la barrera cutánea e inflamación inmunitaria Th2/Th22",
      "Clima seco/frío, duchas calientes y uso de detergentes agresivos",
      "Colonización/sobrecrecimiento por Staphylococcus aureus"
    ],
    "diagnostico": "Clínico según criterios de Hanifin y Rajka o UK Working Party. Prurito intenso + morfología y distribución típica según la edad.",
    "criteriosDiagnostico": [
      "Prurito (síntoma cardinal obligatorio)",
      "Ecsema flexural (pliegues de codos/rodillas) en niños/adultos o facial/extensor en lactantes",
      "Historia de piel seca (xerosis) generalizada en el último año",
      "Historia personal o familiar de enfermedad atópica",
      "Inicio de síntomas antes de los 2 años de edad"
    ],
    "escalasClinicas": [
      {
        "nombre": "SCORAD (SCORing Atopic Dermatitis)",
        "uso": "Evaluación de la extensión, intensidad de lesiones y síntomas subjetivos (sueño/prurito)",
        "rango": "0-103",
        "interpretacion": "<25 leve; 25-50 moderada; >50 dermatitis atópica severa"
      },
      {
        "nombre": "EASI (Eczema Area and Severity Index)",
        "uso": "Medición estandarizada de severidad en ensayos clínicos y práctica",
        "rango": "0-72",
        "interpretacion": "0 claro; 1.1-7 leve; 7.1-21 moderada; 21.1-50 severa; >50 muy severa"
      }
    ],
    "diagnosticoDiferencial": [
      "Dermatitis de contacto alérgica o irritativa",
      "Dermatitis seborreica",
      "Psoriasis en placas / gutata",
      "Escabiosis (sarna)",
      "Linfoma cutáneo de células T (Micosis fungoide en adultos)"
    ],
    "pronostico": "Evolución en brotes. 60-70% de los casos infantiles mejoran o remiten en la adolescencia. Excelente respuesta a emolientes restauradores de barrera, corticoides tópicos/iCalcineurina e inmunomoduladores (Dupilumab/anti-JAK)."
  },
  "enfermedad_tiroidea_autoinmune": {
    "epidemiologia": "Causa más común de disfunción tiroidea. La Tiroiditis de Hashimoto (hipotiroidismo autoinmune) afecta al 5-10% de las mujeres; la Enfermedad de Graves (hipertiroidismo) al 1-2%. Predominio femenino (8:1).",
    "factoresRiesgo": [
      "Predisposición genética (HLA-DR3, HLA-DR5, CTLA-4)",
      "Sexo femenino y periodos de fluctuación hormonal (postparto, perimenopausia)",
      "Aporte excesivo o deficiente de Yodo",
      "Déficit de Selenio y Vitamina D",
      "Infecciones víricas o estrés emocional severo previa aparición",
      "Presencia de otras enfermedades autoinmunes (Celiaca, Vitíligo, Diabetes Tipo 1)"
    ],
    "diagnostico": "Determinación de TSH, T4 libre y perfil de anticuerpos tiroideos: Anti-TPO y Anti-TG (positivos en Hashimoto) o TSI/TRAb (anticuerpos estimulantes de TSH positivos en Graves). Ecografía tiroidea.",
    "criteriosDiagnostico": [
      "Hashimoto: TSH elevada + T4L baja (hipotiroidismo clínico) o normal (subclínico) + Anti-TPO positivos",
      "Graves: TSH suprimida (<0.01 mUI/L) + T4L/T3L elevadas + TRAb/TSI positivos + Bocio difuso hipervascular",
      "Patrón ecográfico heterogéneo ecohipogénico en Hashimoto o 'infierno tiroideo' vascular en Graves"
    ],
    "escalasClinicas": [
      {
        "nombre": "Clasificación ATA de Disfunción Tiroidea",
        "uso": "Estratificación de hipo/hipertiroidismo subclínico vs manifiesto",
        "rango": "Subclínico vs Manifiesto",
        "interpretacion": "TSH >10 mUI/L o Anti-TPO muy elevados en Hashimoto justifica tratamiento con Levotiroxina"
      },
      {
        "nombre": "Score CAS (Clinical Activity Score - Oftalmopatía de Graves)",
        "uso": "Evaluación de la actividad de la orbitopatía tiroidea",
        "rango": "0-7 puntos",
        "interpretacion": "CAS ≥3 indica orbitopatía activa candidato a tratamiento inmunosupresor"
      }
    ],
    "diagnosticoDiferencial": [
      "Bocio multinodular tóxico / Adenoma tóxico (en hipertiroidismo)",
      "Tiroiditis subaguda de De Quervain (dolorosa, reactantes de fase aguda altos)",
      "Tiroiditis silente o postparto transitoria",
      "Hipotiroidismo secundario (hipofisario)",
      "Efecto medicamentoso (Amiodarona, Litio, Inhibidores de Checkpoint)"
    ],
    "pronostico": "Hashimoto evoluciona habitualmente a hipotiroidismo permanente requiriendo sustitución con Levotiroxina. Graves responde a antitiroideos de síntesis (Metimazol), radioyodo o tiroidectomía. La suplementación con Selenio (200 µg/día) reduce el título de Anti-TPO."
  }
};

let updatedCount = 0;
data.patologias = data.patologias.map(pat => {
  if (clinicalData[pat.id]) {
    updatedCount++;
    return {
      ...pat,
      ...clinicalData[pat.id]
    };
  }
  return pat;
});

fs.writeFileSync(pat3Path, JSON.stringify(data, null, 2), 'utf8');
console.log(`Updated ${updatedCount} pathologies in patologias_3.json!`);
