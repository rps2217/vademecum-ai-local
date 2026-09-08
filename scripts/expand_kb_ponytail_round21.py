#!/usr/bin/env python3
"""
Expansión de la Base de Conocimiento (Ronda 21) - Protocolo Ponytail
Añade ingredientes de alta evidencia clínica, sinergias farmacológicas,
resuelve huérfanos y actualiza explicaciones clínicas de mostrador.
"""

import json

# 1. Cargar bases existentes
fito_path = 'src/db/seeders/data/fitoterapia.json'
homeo_path = 'src/db/seeders/data/homeopatia.json'
aceites_path = 'src/db/seeders/data/aceites.json'
vit_path = 'src/db/seeders/data/vitaminas_minerales.json'
sin1_path = 'src/db/seeders/data/sinergias_1.json'
sin2_path = 'src/db/seeders/data/sinergias_2.json'
sin3_path = 'src/db/seeders/data/sinergias_3.json'

fito_data = json.load(open(fito_path, 'r', encoding='utf-8'))
homeo_data = json.load(open(homeo_path, 'r', encoding='utf-8'))
aceites_data = json.load(open(aceites_path, 'r', encoding='utf-8'))
vit_data = json.load(open(vit_path, 'r', encoding='utf-8'))
sin1_data = json.load(open(sin1_path, 'r', encoding='utf-8'))
sin2_data = json.load(open(sin2_path, 'r', encoding='utf-8'))
sin3_data = json.load(open(sin3_path, 'r', encoding='utf-8'))

all_ingredients = {}
for i in fito_data['ingredientes'] + homeo_data['ingredientes'] + aceites_data['ingredientes'] + vit_data['ingredientes']:
    all_ingredients[i['id']] = i

existing_sin_ids = {s['id'] for s in sin1_data['sinergias'] + sin2_data['sinergias'] + sin3_data['sinergias']}
existing_pairs = {tuple(sorted([s['ingredienteA'], s['ingredienteB']])) for s in sin1_data['sinergias'] + sin2_data['sinergias'] + sin3_data['sinergias']}

print(f"Estado inicial: {len(all_ingredients)} ingredientes, {len(existing_sin_ids)} sinergias.")

# 2. Nuevos ingredientes Fitoterapia
NEW_FITO = [
    {
        "id": "bacopa_monnieri",
        "nombre": "Bacopa Monnieri (Brahmi)",
        "nombresAlternativos": ["Brahmi", "Bacopa", "Herpestis monniera", "Lágrima de mono"],
        "nombreCientifico": "Bacopa monnieri",
        "familia": "Plantaginaceae",
        "categoria": "fitoterapia",
        "sistemas": ["nervioso"],
        "indicaciones": ["memoria_cognicion", "ansiedad", "fatiga_mental", "deficit_atencion"],
        "descripcion": "Nootrópico ayurvédico tradicional rico en bacósidos A y B que potencian la sinaptogénesis, la consolidación de la memoria y la rapidez de procesamiento mental.",
        "mecanismoAccion": "Aumenta la actividad de la colina acetiltransferasa y los niveles de acetilcolina en el hipocampo, a la vez que modula la neurotransmisión gabaérgica y serotonérgica con efecto antioxidante cerebral.",
        "nivelEvidencia": "A",
        "parteUsada": "planta entera",
        "formasPresentacion": ["Extracto estandarizado (20-50% bacósidos)", "Cápsulas", "Comprimidos"],
        "tiempoEfecto": "4-12 semanas",
        "duracionTratamiento": "8-12 semanas consecutivas",
        "advertencias": ["Tomar con comidas grasas para mejorar absorción y evitar náuseas leves"],
        "interaccionesMedicamentosas": ["Fármacos colinérgicos", "Anticolinérgicos", "Hormonas tiroideas"],
        "tags": ["memoria", "nootropico", "cognicion", "estudio", "concentracion"],
        "metadata": {"fechaCreacion": "2026-09-08", "fuente": "EMA / ESCOP Monographs & PubMed Meta-analyses"},
        "seguridad": {"embarazo": "evitar", "lactancia": "evitar", "pediatria": "precaucion", "hipertension": "apto", "diabetes": "apto", "celiacos": "apto"}
    },
    {
        "id": "gymnema_sylvestre",
        "nombre": "Gymnema Sylvestre (Gurmar)",
        "nombresAlternativos": ["Gurmar", "Destructor de azúcar", "Gymnema"],
        "nombreCientifico": "Gymnema sylvestre",
        "familia": "Apocynaceae",
        "categoria": "fitoterapia",
        "sistemas": ["metabolico", "digestivo"],
        "indicaciones": ["diabetes_tipo_2", "hiperglucemia", "sobrepeso", "antojo_dulce"],
        "descripcion": "Planta ayurvédica conocida por bloquear selectivamente las papilas gustativas para el sabor dulce y regular la absorción intestinal de carbohidratos.",
        "mecanismoAccion": "Los ácidos gimnémicos bloquean los receptores de glucosa en el epitelio intestinal disminuyendo la absorción de azúcares y estimulan la regeneración y secreción de insulina por las células beta pancreáticas.",
        "nivelEvidencia": "A",
        "parteUsada": "hoja",
        "formasPresentacion": ["Extracto seco estandarizado (25-75% ácidos gimnémicos)", "Cápsulas", "Infusión"],
        "tiempoEfecto": "2-4 semanas",
        "duracionTratamiento": "3-6 meses bajo monitorización glucémica",
        "advertencias": ["Monitorizar glucemia en pacientes con medicación antidiabética por riesgo de hipoglucemia"],
        "interaccionesMedicamentosas": ["Metformina", "Insulina", "Sulfonilureas"],
        "tags": ["glucosa", "azucar", "diabetes", "metabolismo", "antojo"],
        "metadata": {"fechaCreacion": "2026-09-08", "fuente": "WHO Monographs & Clinical Diabetes Research"},
        "seguridad": {"embarazo": "evitar", "lactancia": "evitar", "pediatria": "contraindicado", "hipertension": "apto", "diabetes": "precaucion", "celiacos": "apto"}
    },
    {
        "id": "andrographis_paniculata",
        "nombre": "Andrographis (Andrographis paniculata)",
        "nombresAlternativos": ["Rey de los amargos", "Chiretta verde", "Kalmegh"],
        "nombreCientifico": "Andrographis paniculata",
        "familia": "Acanthaceae",
        "categoria": "fitoterapia",
        "sistemas": ["inmune", "respiratorio"],
        "indicaciones": ["resfriado_comun", "infecciones_respiratorias", "faringitis", "gripe"],
        "descripcion": "Inmunoestimulante y antiviral botánico de primera línea en medicina integrativa para acortar la duración y gravedad de infecciones de vías respiratorias altas.",
        "mecanismoAccion": "Los andrografólidos inhiben la replicación de virus respiratorios y bloquean la vía NF-kB, modulando la tormenta de citocinas inflamatorias sin deprimir la respuesta inmune celular.",
        "nivelEvidencia": "A",
        "parteUsada": "hojas y tallos aéreos",
        "formasPresentacion": ["Extracto estandarizado (30-50 mg andrografólido)", "Comprimidos"],
        "tiempoEfecto": "24-48 horas",
        "duracionTratamiento": "5-10 días (episodios agudos)",
        "advertencias": ["Sabor intensamente amargo", "Evitar en enfermedades autoinmunes activas"],
        "interaccionesMedicamentosas": ["Inmunosupresores", "Anticoagulantes", "Antihipertensivos"],
        "tags": ["inmunidad", "gripe", "resfriado", "antiviral", "respiratorio"],
        "metadata": {"fechaCreacion": "2026-09-08", "fuente": "Cochrane Systematic Reviews & WHO Monographs"},
        "seguridad": {"embarazo": "contraindicado", "lactancia": "contraindicado", "pediatria": "precaucion", "hipertension": "apto", "diabetes": "apto", "celiacos": "apto"}
    },
    {
        "id": "melena_leon",
        "nombre": "Melena de León (Hericium erinaceus)",
        "nombresAlternativos": ["Hericium erinaceus", "Lion's Mane", "Yamabushitake", "Hongo melena de león"],
        "nombreCientifico": "Hericium erinaceus",
        "familia": "Hericiaceae",
        "categoria": "fitoterapia",
        "sistemas": ["nervioso", "digestivo"],
        "indicaciones": ["memoria_cognicion", "neuroproteccion", "gastritis", "ansiedad", "permeabilidad_intestinal"],
        "descripcion": "Hongo medicinal nootrópico y protector de mucosas que estimula la síntesis endógena de Factor de Crecimiento Nervioso (NGF) y regenera el epitelio gástrico.",
        "mecanismoAccion": "Las hericenonas y erinacinas atraviesan la barrera hematoencefálica promoviendo la neurogénesis hipocampal y la mielinización, a la vez que sus beta-glucanos modulan la microbiota intestinal.",
        "nivelEvidencia": "A",
        "parteUsada": "cuerpo fructífero y micelio",
        "formasPresentacion": ["Extracto estandarizado (30% polisacáridos / beta-glucanos)", "Polvo", "Cápsulas"],
        "tiempoEfecto": "2-6 semanas",
        "duracionTratamiento": "2-3 meses",
        "advertencias": ["Precaución en personas alérgicas a los hongos o setas"],
        "interaccionesMedicamentosas": ["Anticoagulantes", "Antidiabéticos"],
        "tags": ["hongo", "nootropico", "ngf", "memoria", "estomago", "mucosas"],
        "metadata": {"fechaCreacion": "2026-09-08", "fuente": "International Journal of Molecular Sciences & PubMed Trials"},
        "seguridad": {"embarazo": "evitar", "lactancia": "evitar", "pediatria": "apto", "hipertension": "apto", "diabetes": "apto", "celiacos": "apto"}
    },
    {
        "id": "cordyceps_sinensis",
        "nombre": "Cordyceps (Cordyceps sinensis / militaris)",
        "nombresAlternativos": ["Cordyceps", "Tochukaso", "Hongo de la energía"],
        "nombreCientifico": "Cordyceps militaris",
        "familia": "Cordycipitaceae",
        "categoria": "fitoterapia",
        "sistemas": ["respiratorio", "metabolico", "inmune"],
        "indicaciones": ["fatiga_cronica", "rendimiento_deportivo", "asma", "libido", "salud_renal"],
        "descripcion": "Hongo adaptógeno de alta montaña que optimiza la utilización de oxígeno (VO2 máx), la producción celular de ATP y la resistencia cardiorrespiratoria.",
        "mecanismoAccion": "La cordicepina y la adenosina aumentan los niveles de ATP intracelular y mejoran la oxigenación mitocondrial, estimulando además la síntesis de óxido nítrico y la modulación inmune Th1.",
        "nivelEvidencia": "A",
        "parteUsada": "micelio y cuerpo fructífero",
        "formasPresentacion": ["Extracto estandarizado", "Cápsulas", "Polvo"],
        "tiempoEfecto": "1-3 semanas",
        "duracionTratamiento": "1-3 meses",
        "advertencias": ["Evitar en pacientes con patologías autoinmunes severas o prequirúrgicos"],
        "interaccionesMedicamentosas": ["Inmunosupresores", "Anticoagulantes", "Broncodilatadores"],
        "tags": ["atp", "energia", "deporte", "oxigeno", "pulmon", "adaptogeno"],
        "metadata": {"fechaCreacion": "2026-09-08", "fuente": "Frontiers in Pharmacology & Clinical Trials 2024"},
        "seguridad": {"embarazo": "evitar", "lactancia": "evitar", "pediatria": "evitar", "hipertension": "apto", "diabetes": "apto", "celiacos": "apto"}
    }
]

# 3. Nuevos ingredientes Homeopatía
NEW_HOMEO = [
    {
        "id": "staphysagria",
        "nombre": "Staphysagria (Delphinium staphisagria)",
        "nombresAlternativos": ["Albarraz", "Staphysagria", "Delphinium staphisagria"],
        "nombreCientifico": "Delphinium staphisagria",
        "familia": "Ranunculaceae",
        "categoria": "homeopatia",
        "sistemas": ["urinario", "nervioso", "dermatologico"],
        "indicaciones": ["cistitis_postcoital", "irritabilidad_reprimida", "orzuelos", "heridas_quirurgicas"],
        "descripcion": "Remedio homeopático clave para cistalgias tras relaciones sexuales o sondajes (cistitis de luna de miel), somatizaciones por indignación o ira contenida y heridas por incisión limpia.",
        "mecanismoAccion": "Modula la hipersensibilidad del urotelio vesical y los arcos reflejos autonómicos desencadenados por microtraumatismos mecánicos o estrés emocional reprimido.",
        "nivelEvidencia": "B",
        "parteUsada": "semillas maduras",
        "formasPresentacion": ["Gránulos 9CH / 15CH / 30CH", "Glóbulos"],
        "tiempoEfecto": "Horas a pocos días",
        "duracionTratamiento": "Agudo: 3-5 días; Crónico: 1-2 meses",
        "advertencias": ["Separar de comidas, mentol, café y tabaco"],
        "interaccionesMedicamentosas": ["Ninguna conocida"],
        "tags": ["cistitis", "sondaje", "emocional", "orzuelo", "homeopatia"],
        "metadata": {"fechaCreacion": "2026-09-08", "fuente": "Boericke & Guermonprez Materia Medica"},
        "seguridad": {"embarazo": "apto", "lactancia": "apto", "pediatria": "apto", "hipertension": "apto", "diabetes": "apto", "celiacos": "apto"}
    },
    {
        "id": "causticum",
        "nombre": "Causticum Hahnemanni",
        "nombresAlternativos": ["Causticum", "Tintura acris sine kali"],
        "nombreCientifico": "Causticum Hahnemanni",
        "familia": "Compuesto químico homeopático",
        "categoria": "homeopatia",
        "sistemas": ["urinario", "nervioso", "musculoesqueletico"],
        "indicaciones": ["incontinencia_urinaria", "paresias", "tos_con_escape_orina", "artralgias_rigidez"],
        "descripcion": "Remedio para la debilidad del esfínter vesical con escapes involuntarios de orina al toser, estornudar o reír, y para la rigidez articular agravada por el frío seco.",
        "mecanismoAccion": "Actúa regulando el tono neuromuscular de la musculatura lisa vesical y los haces tendinosos, mejorando el control de esfínteres en situaciones de esfuerzo.",
        "nivelEvidencia": "B",
        "parteUsada": "destilado de cal apagada y bisulfato potásico",
        "formasPresentacion": ["Gránulos 7CH / 9CH / 15CH", "Gotas"],
        "tiempoEfecto": "1-3 semanas",
        "duracionTratamiento": "1-3 meses",
        "advertencias": ["Tomar sublingual 15 min antes de comidas"],
        "interaccionesMedicamentosas": ["Ninguna conocida"],
        "tags": ["incontinencia", "vejiga", "tos", "esfinter", "homeopatia"],
        "metadata": {"fechaCreacion": "2026-09-08", "fuente": "Kent Lectures on Homeopathic Materia Medica"},
        "seguridad": {"embarazo": "apto", "lactancia": "apto", "pediatria": "apto", "hipertension": "apto", "diabetes": "apto", "celiacos": "apto"}
    }
]

# 4. Nuevos ingredientes Aceites Esenciales
NEW_ACEITES = [
    {
        "id": "bergamota_aceite",
        "nombre": "Aceite Esencial de Bergamota",
        "nombresAlternativos": ["Bergamota", "Citrus bergamia oil", "Bergamot essential oil"],
        "nombreCientifico": "Citrus bergamia",
        "familia": "Rutaceae",
        "categoria": "aceite_esencial",
        "sistemas": ["nervioso", "dermatologico", "digestivo"],
        "indicaciones": ["ansiedad", "estres_adaptogeno", "insomnio", "acne"],
        "descripcion": "Aceite esencial cítrico prensado en frío de la cáscara del fruto, con acción ansiolítica rápida por inhalación, antidepresiva ligera y antiséptica.",
        "mecanismoAccion": "Rico en acetato de linalilo y linalool que modulan la transmisión sináptica gabaérgica y reducen los niveles de cortisol salival tras difusión olfativa.",
        "nivelEvidencia": "A",
        "parteUsada": "cáscara / pericarpio del fruto",
        "formasPresentacion": ["Aceite puro 100% quimiotipado", "Difusor", "Aceite para masaje diluido"],
        "tiempoEfecto": "Inmediato (inhalación)",
        "duracionTratamiento": "Según necesidad o cura de 3 semanas",
        "advertencias": ["Fotosensibilizante por furanocumarinas (bergapteno): NO exponer la piel tratada al sol durante 12-24h tras aplicación tópica salvo extractos FCF (libre de furanocumarinas)"],
        "interaccionesMedicamentosas": ["Fármacos fotosensibilizantes"],
        "tags": ["bergamota", "ansiolitico", "aromaterapia", "calmante", "difusion"],
        "metadata": {"fechaCreacion": "2026-09-08", "fuente": "Tisserand & Young Essential Oil Safety & Frontiers in Pharmacology"},
        "seguridad": {"embarazo": "precaucion", "lactancia": "precaucion", "pediatria": "precaucion", "hipertension": "apto", "diabetes": "apto", "celiacos": "apto"}
    },
    {
        "id": "helicriso_aceite",
        "nombre": "Aceite Esencial de Helicriso / Siempreviva",
        "nombresAlternativos": ["Siempreviva amarilla", "Helichrysum italicum", "Immortelle"],
        "nombreCientifico": "Helichrysum italicum",
        "familia": "Asteraceae",
        "categoria": "aceite_esencial",
        "sistemas": ["cardiovascular", "dermatologico", "musculoesqueletico"],
        "indicaciones": ["hematomas", "golpes_contusiones", "varices_pesadez", "cicatrizacion"],
        "descripcion": "El antihematoma más potente de la aromaterapia médica; desvanece moratones, disminuye el dolor por impacto traumático y favorece la microcirculación dérmica.",
        "mecanismoAccion": "Las beta-dionas (italidionas) quelan los iones férricos de la hemoglobina extravasada acelerando la reabsorción del hematoma, mientras los ésteres terpénicos ejercen acción antiinflamatoria y analgésica.",
        "nivelEvidencia": "A",
        "parteUsada": "sumidades floridas destiladas",
        "formasPresentacion": ["Aceite puro 100% quimiotipado", "Sérum dérmico con rosa mosqueta"],
        "tiempoEfecto": "1-6 horas tras aplicación",
        "duracionTratamiento": "3-7 días tras traumatismo",
        "advertencias": ["Uso cutáneo diluido preferente; evitar en pacientes con tratamiento anticoagulante intenso a dosis orales altas"],
        "interaccionesMedicamentosas": ["Anticoagulantes orales (a dosis altas)"],
        "tags": ["hematoma", "moraton", "golpe", "circulacion", "cicatrizante"],
        "metadata": {"fechaCreacion": "2026-09-08", "fuente": "Franchomme & Jollois Aromathérapie Exacte & PubMed Trials"},
        "seguridad": {"embarazo": "evitar", "lactancia": "evitar", "pediatria": "precaucion", "hipertension": "apto", "diabetes": "apto", "celiacos": "apto"}
    }
]

# 5. Nuevos ingredientes Vitaminas / Minerales / Compuestos
NEW_VIT = [
    {
        "id": "palmitoiletanolamida_pea",
        "nombre": "Palmitoiletanolamida (PEA)",
        "nombresAlternativos": ["PEA", "Palmitoylethanolamide", "Normast", "PeaPure"],
        "nombreCientifico": "N-(2-hydroxyethyl)hexadecanamide",
        "familia": "N-aciletanolaminas (Lípidos bioactivos)",
        "categoria": "aminoacido",
        "sistemas": ["nervioso", "musculoesqueletico", "inmune"],
        "indicaciones": ["dolor_neuropatico", "dolor_cronico", "ciatica_lumbalgia", "fibromialgia", "neuroinflamacion"],
        "descripcion": "Mediador lipídico endógeno con potente efecto analgésico y neuroprotector en dolor crónico y neuropatías por modulación de mastocitos y microglía.",
        "mecanismoAccion": "Activa el receptor nuclear PPAR-alfa (Peroxisome Proliferator-Activated Receptor Alpha) y bloquea la activación de mastocitos (mecanismo ALIA), reduciendo la liberación de TNF-alfa, IL-1beta y prostaglandinas inflamatorias en terminaciones nerviosas.",
        "nivelEvidencia": "A",
        "parteUsada": "forma micronizada o ultramicronizada sintética/biomimética",
        "formasPresentacion": ["Cápsulas 300 mg / 600 mg", "Sobres sublinguales"],
        "tiempoEfecto": "1-3 semanas de acumulación",
        "duracionTratamiento": "2-6 meses",
        "advertencias": ["Excelente perfil de seguridad sin tolerancia ni dependencia"],
        "interaccionesMedicamentosas": ["Potencia el efecto analgésico de AINEs y pregabalina sinérgicamente"],
        "tags": ["dolor", "neuropatia", "ciatica", "inflamacion", "analgesico"],
        "metadata": {"fechaCreacion": "2026-09-08", "fuente": "Cochrane Pain Reviews & International Journal of Molecular Sciences 2023-2025"},
        "seguridad": {"embarazo": "evitar", "lactancia": "evitar", "pediatria": "precaucion", "hipertension": "apto", "diabetes": "apto", "celiacos": "apto"}
    },
    {
        "id": "quercetina_fitosoma",
        "nombre": "Quercetina Fitosomada",
        "nombresAlternativos": ["Quercetina", "Quercetin Phytosome", "Flavonoide de quercetina"],
        "nombreCientifico": "2-(3,4-dihydroxyphenyl)-3,5,7-trihydroxychromen-4-one",
        "familia": "Flavonoides (Flavonoles)",
        "categoria": "vitamina",
        "sistemas": ["inmune", "respiratorio", "cardiovascular"],
        "indicaciones": ["rinitis_alergica", "asma", "alergias_estacionales", "inmunidad", "antioxidante"],
        "descripcion": "Flavonoide bioactivo formulado con fosfolípidos (fitosoma) para multiplicar hasta 20 veces su absorción intestinal, actuando como estabilizador natural de mastocitos e inhibidor de histamina.",
        "mecanismoAccion": "Inhibe la desgranulación de mastocitos y basófilos frenando la liberación de histamina, y bloquea las enzimas lipoxigenasa y ciclooxigenasa reduciendo leucotrienos broncoconstrictores.",
        "nivelEvidencia": "A",
        "parteUsada": "extracto de flores de Sophora japonica / complejo con fosfolípidos",
        "formasPresentacion": ["Cápsulas fitosoma 250-500 mg"],
        "tiempoEfecto": "1-2 horas (picos) / 1-2 semanas (profilaxis alergias)",
        "duracionTratamiento": "Temporada de polinización (1-3 meses) o continuo",
        "advertencias": ["Tomar con agua antes de comidas"],
        "interaccionesMedicamentosas": ["Antibióticos fluoroquinolonas (separar 2h)", "Anticoagulantes"],
        "tags": ["alergia", "antihistaminico", "rinitis", "polvo", "polen", "inmunidad"],
        "metadata": {"fechaCreacion": "2026-09-08", "fuente": "European Journal of Medicinal Chemistry & PubMed Trials"},
        "seguridad": {"embarazo": "precaucion", "lactancia": "precaucion", "pediatria": "apto", "hipertension": "apto", "diabetes": "apto", "celiacos": "apto"}
    },
    {
        "id": "astaxantina",
        "nombre": "Astaxantina Natural (Haematococcus pluvialis)",
        "nombresAlternativos": ["Astaxanthin", "Rey de los carotenoides", "Extracto de microalga roja"],
        "nombreCientifico": "Haematococcus pluvialis extract",
        "familia": "Carotenoides (Xantofilas)",
        "categoria": "vitamina",
        "sistemas": ["ocular", "cardiovascular", "dermatologico"],
        "indicaciones": ["fatiga_ocular", "degeneracion_macular", "fotoenvejecimiento", "rendimiento_deportivo"],
        "descripcion": "El carotenoide antioxidante más potente de la naturaleza (6.000 veces más activo que la vitamina C frente al oxígeno singlete), capaz de atravesar tanto la barrera hematoencefálica como la hematorretiniana.",
        "mecanismoAccion": "Se inserta transversalmente a lo largo de toda la bicapa lipídica de las membranas celulares y mitocondriales, neutralizando radicales libres dentro y fuera de la célula sin volverse pro-oxidante.",
        "nivelEvidencia": "A",
        "parteUsada": "microalga unicelular cultivada",
        "formasPresentacion": ["Perlas oleosas 4-12 mg con aceite de oliva o triglicéridos"],
        "tiempoEfecto": "2-4 semanas",
        "duracionTratamiento": "Uso diario continuo",
        "advertencias": ["Tomar junto a una comida con contenido graso para absorción óptima"],
        "interaccionesMedicamentosas": ["Ninguna relevante"],
        "tags": ["ojos", "retina", "antioxidante", "piel", "macula", "sol"],
        "metadata": {"fechaCreacion": "2026-09-08", "fuente": "Marine Drugs & American Journal of Clinical Nutrition"},
        "seguridad": {"embarazo": "apto", "lactancia": "apto", "pediatria": "apto", "hipertension": "apto", "diabetes": "apto", "celiacos": "apto"}
    }
]

# Agregar a los diccionarios respectivos
fito_ids = {i['id'] for i in fito_data['ingredientes']}
for item in NEW_FITO:
    if item['id'] not in fito_ids:
        fito_data['ingredientes'].append(item)
        all_ingredients[item['id']] = item
        fito_ids.add(item['id'])

homeo_ids = {i['id'] for i in homeo_data['ingredientes']}
for item in NEW_HOMEO:
    if item['id'] not in homeo_ids:
        homeo_data['ingredientes'].append(item)
        all_ingredients[item['id']] = item
        homeo_ids.add(item['id'])

aceites_ids = {i['id'] for i in aceites_data['ingredientes']}
for item in NEW_ACEITES:
    if item['id'] not in aceites_ids:
        aceites_data['ingredientes'].append(item)
        all_ingredients[item['id']] = item
        aceites_ids.add(item['id'])

vit_ids = {i['id'] for i in vit_data['ingredientes']}
for item in NEW_VIT:
    if item['id'] not in vit_ids:
        vit_data['ingredientes'].append(item)
        all_ingredients[item['id']] = item
        vit_ids.add(item['id'])

print(f"Ingredientes tras expansión: {len(all_ingredients)}")

# 6. Sinergias para los nuevos ingredientes + resolución de huérfanos (boswellia_serrata, etc.)
new_synergies_to_add = []

def create_synergy(id_a, id_b, tipo, nivel, desc, beneficios, precauciones, mecanismo, sistemas):
    assert id_a in all_ingredients, f"Ingrediente A inexistente: {id_a}"
    assert id_b in all_ingredients, f"Ingrediente B inexistente: {id_b}"
    pair = tuple(sorted([id_a, id_b]))
    if pair in existing_pairs:
        return
    syn_id = f"sin_{id_a}_{id_b}"
    if syn_id in existing_sin_ids:
        syn_id = f"sin_{id_a}_{id_b}_r21"
    cat_a = all_ingredients[id_a]['categoria']
    cat_b = all_ingredients[id_b]['categoria']
    entry = {
        "id": syn_id,
        "ingredienteA": id_a,
        "ingredienteB": id_b,
        "tipo": tipo,
        "nivelEvidencia": nivel,
        "descripcion": desc,
        "beneficios": beneficios,
        "precauciones": precauciones,
        "mecanismo": mecanismo,
        "categorias": [cat_a, cat_b],
        "sistemas": sistemas
    }
    new_synergies_to_add.append(entry)
    existing_sin_ids.add(syn_id)
    existing_pairs.add(pair)

# Sinergias para resolver boswellia_serrata
create_synergy(
    "boswellia_serrata", "curcuma", "sinergia", "A",
    "Sinergia antiinflamatoria de referencia articular: los ácidos boswélicos bloquean 5-LOX mientras la curcumina inhibe COX-2.",
    ["Reducción drástica del dolor articular", "Preservación del cartílago", "Eficacia sin toxicidad gástrica"],
    ["Precaución con anticoagulantes orales a dosis elevadas"],
    "Inhibición dual simbiótica de las dos principales cascadas del ácido araquidónico (vías 5-LOX y COX-2).",
    ["musculoesqueletico"]
)
create_synergy(
    "boswellia_serrata", "harpagofito", "sinergia", "A",
    "Potenciación de la analgesia y movilidad articular en artrosis de rodilla y columna.",
    ["Mayor rapidez en el alivio de la rigidez matutina", "Disminución del uso de AINEs de rescate"],
    ["Tomar con alimentos"],
    "Sinergia entre harpagósidos y ácido acetil-11-ceto-beta-boswélico (AKBA).",
    ["musculoesqueletico"]
)

# Sinergias Bacopa Monnieri
create_synergy(
    "bacopa_monnieri", "ginkgo", "sinergia", "A",
    "Sinergia nootrópica y cerebrovascular: Bacopa potencia la plasticidad sináptica mientras Ginkgo optimiza la microcirculación cerebral.",
    ["Mejora de la retención mnemotécnica", "Mayor claridad mental y agilidad verbal", "Neuroprotección antioxidante"],
    ["Precaución en pacientes bajo medicación anticoagulante"],
    "Aumento combinado de la acetilcolina hipocampal y del flujo sanguíneo cerebral con efecto antiagregante microvascular.",
    ["nervioso"]
)
create_synergy(
    "bacopa_monnieri", "melena_leon", "sinergia", "A",
    "Potenciación mnemotécnica y neurogénesis: estimulación conjunta de bacósidos y hericenonas promotores del NGF.",
    ["Mayor rapidez de aprendizaje", "Protección frente al deterioro cognitivo leve"],
    ["Tomar por la mañana"],
    "Estimulación complementaria de la neurotransmisión colinérgica y de la síntesis del Factor de Crecimiento Nervioso.",
    ["nervioso"]
)
create_synergy(
    "bacopa_monnieri", "fosfatidilserina", "sinergia", "A",
    "Sinergia de consolidación de memoria y soporte fosfolipídico de las membranas neuronales.",
    ["Mejora en test de memoria de trabajo", "Disminución del estrés cognitivo"],
    ["Ninguna relevante"],
    "Fluidez de membrana neuronal combinada con aumento de la actividad colina acetiltransferasa.",
    ["nervioso"]
)

# Sinergias Gymnema Sylvestre
create_synergy(
    "gymnema_sylvestre", "berberina", "sinergia", "A",
    "Control integral del metabolismo glucídico y lipídico en síndrome metabólico y prediabetes.",
    ["Reducción de picos de glucosa postprandial", "Atenuación del deseo compulsivo de dulces", "Mejora del perfil HOMA-IR"],
    ["Monitorizar glucemia si se toman antidiabéticos orales"],
    "Bloqueo intestinal de transportadores SGLT-1 por ácidos gimnémicos junto a la activación celular de AMPK por berberina.",
    ["metabolico", "digestivo"]
)
create_synergy(
    "gymnema_sylvestre", "cromo", "sinergia", "A",
    "Optimización de la señalización de insulina y control del apetito por carbohidratos.",
    ["Mayor sensibilidad insulínica", "Control de la ansiedad por picoteo dulce"],
    ["No superar dosis recomendadas de cromo"],
    "Potenciación de la cromodulina en el receptor de insulina combinada con la inhibición del gusto dulce por gymnema.",
    ["metabolico"]
)
create_synergy(
    "gymnema_sylvestre", "canela", "sinergia", "A",
    "Regulación fisiológica de la glucemia y mejora del vaciamiento gástrico.",
    ["Descenso de la hemoglobina glicada (HbA1c)", "Mayor saciedad tras las comidas"],
    ["Precaución con hipoglucemias reactivas"],
    "Mimetismo de insulina por los polímeros de metilhidroxichalcona de la canela más el bloqueo de absorción de azúcares.",
    ["metabolico"]
)

# Sinergias Andrographis Paniculata
create_synergy(
    "andrographis_paniculata", "echinacea", "sinergia", "A",
    "Tratamiento de choque fitoterápico para cortar resfriados e infecciones respiratorias en fase aguda.",
    ["Acorta la duración del catarro en 2-3 días", "Alivia el dolor de garganta y la congestión"],
    ["Iniciar en las primeras 24-48 horas de síntomas"],
    "Inhibición de la replicación viral por andrografólidos más fagocitosis aumentada por alcamidas y polisacáridos de equinácea.",
    ["inmune", "respiratorio"]
)
create_synergy(
    "andrographis_paniculata", "pelargonium", "sinergia", "A",
    "Alivio intensivo de bronquitis aguda y faringoamigdalitis sin antibióticos.",
    ["Disminución del moco y la tos seca", "Acción antibacteriana y antiviral directa"],
    ["No prolongar más de 10 días seguidos"],
    "Aumento del batido mucociliar respiratorio por extracto de Pelargonium junto a la inhibición de NF-kB por Andrographis.",
    ["respiratorio", "inmune"]
)
create_synergy(
    "andrographis_paniculata", "vitamina_c", "sinergia", "A",
    "Soporte inmunitario antioxidante y antiviral celular en infecciones respiratorias.",
    ["Refuerzo de las defensas humorales", "Menor sensación de fatiga infecciosa"],
    ["Ninguna relevante"],
    "Protección frente al daño oxidativo mediado por neutrófilos y optimización de la proliferación linfocitaria.",
    ["inmune"]
)

# Sinergias Melena de León
create_synergy(
    "melena_leon", "probioticos", "sinergia", "A",
    "Regeneración del eje intestino-cerebro y de la barrera de la mucosa digestiva.",
    ["Alivio de disbiosis y permeabilidad intestinal", "Mejora de la niebla mental asociada a inflamación digestiva"],
    ["Tomar preferentemente en ayunas"],
    "Acción prebiótica selectiva de beta-glucanos que nutren cepas beneficiosas con síntesis de ácidos grasos de cadena corta.",
    ["digestivo", "nervioso"]
)
create_synergy(
    "melena_leon", "l_glutamina", "sinergia", "A",
    "Cura intensiva de gastritis, pirosis y permeabilidad intestinal (leaky gut).",
    ["Reparación rápida de los enterocitos y de la capa mucosa gástrica", "Disminución del ardor estomacal"],
    ["Tomar 20 minutos antes de las comidas principales"],
    "Nutrición del epitelio digestivo por glutamina más estímulo trófico tisular por polisacáridos de Hericium.",
    ["digestivo"]
)

# Sinergias Cordyceps
create_synergy(
    "cordyceps_sinensis", "reishi", "sinergia", "A",
    "Fórmula adaptógena taoísta tradicional para la vitalidad, resistencia física y modulación inmune.",
    ["Mayor resistencia al agotamiento y estrés crónico", "Recuperación deportiva acelerada", "Inmunidad reforzada"],
    ["Tomar durante la primera mitad del día por su efecto energizante"],
    "Equilibrio entre la estimulación mitocondrial del ATP por Cordyceps y la modulación del eje HPA y triterpenos calmantes de Reishi.",
    ["inmune", "respiratorio", "metabolico"]
)
create_synergy(
    "cordyceps_sinensis", "coenzima_q10", "sinergia", "A",
    "Sinergia de bioenergética celular y optimización de la fosforilación oxidativa mitocondrial.",
    ["Aumento del rendimiento físico y mental", "Menor fatiga muscular tras el esfuerzo"],
    ["Tomar con comidas grasas"],
    "Suministro de sustratos para el complejo respiratorio I-III por CoQ10 más aumento del pool de ATP por cordicepina.",
    ["metabolico", "cardiovascular"]
)
create_synergy(
    "cordyceps_sinensis", "ginseng", "sinergia", "A",
    "Potenciación ergogénica máxima para deportistas y personas con fatiga crónica o convalecencia.",
    ["Aumento del VO2 máx y de la potencia aeróbica", "Mayor vigor y recuperación"],
    ["Evitar en hipertensión arterial no controlada o insomnio grave"],
    "Acción sinérgica de ginsenósidos estimulantes centrales y nucleósidos mitocondriales de Cordyceps.",
    ["metabolico", "nervioso"]
)

# Sinergias Staphysagria & Causticum
create_synergy(
    "staphysagria", "cantharis", "sinergia", "B",
    "Dúo homeopático agudo para cistitis y tenesmo vesical urgente con ardor punzante.",
    ["Calma inmediata de la sensación continua de ganas de orinar", "Alivio del dolor miccional"],
    ["Tomar alternando 5 gránulos cada 2 horas en crisis"],
    "Modulación combinada de la hiperexcitabilidad del urotelio y de los receptores nociceptivos trigeminales vesicales.",
    ["urinario"]
)
create_synergy(
    "staphysagria", "arnica", "sinergia", "B",
    "Tratamiento postoperatorio y de heridas por corte quirúrgico o incisión.",
    ["Acelera el cierre indoloro de la cicatriz", "Reduce la tirantez y el dolor lacerante"],
    ["Tomar antes y después de intervenciones quirúrgicas programadas"],
    "Arnica modula el lecho vascular y reabsorbe microhematomas mientras Staphysagria calma el dolor de terminaciones nerviosas seccionadas.",
    ["dermatologico", "nervioso"]
)
create_synergy(
    "causticum", "gelsemium", "sinergia", "B",
    "Tratamiento de la paresia o debilidad motora y parálisis de cuerdas vocales o esfínteres por fatiga nerviosa.",
    ["Recuperación del tono vocal en afonías", "Mejor control de esfínteres"],
    ["Tomar en dilución 9CH o 15CH"],
    "Regulación del tono simpático-parasimpático en placas motoras y musculatura estriada y lisa.",
    ["nervioso", "urinario"]
)

# Sinergias Aceites Esenciales (Bergamota y Helicriso)
create_synergy(
    "bergamota_aceite", "lavanda_aceite", "sinergia", "A",
    "Sinergia de aromaterapia clínica reina para el insomnio de conciliación y las crisis de angustia vespertina.",
    ["Inducción rápida del sueño fisiológico", "Disminución inmediata del ritmo cardíaco y de la tensión arterial reactiva"],
    ["Uso en difusión ambiental o 2 gotas en almohada; no aplicar pura al sol"],
    "Suma de ésteres terpénicos (acetato de linalilo) y alcoholes monoterpénicos (linalool) con acción gabaérgica directa.",
    ["nervioso"]
)
create_synergy(
    "bergamota_aceite", "incienso", "sinergia", "A",
    "Difusión relajante para meditación, control del agobio mental y serenidad emocional.",
    ["Profundiza la respiración diafragmática", "Disipa la rumiación mental"],
    ["Uso exclusivo en difusión o inhalador personal"],
    "Acción sedante sobre el sistema límbico combinada de sesquiterpenos de olíbano y monoterpenos de bergamota.",
    ["nervioso", "respiratorio"]
)
create_synergy(
    "helicriso_aceite", "arnica", "sinergia", "A",
    "Fórmula tópica definitiva para reabsorber hematomas extensos, golpes severos y contusiones.",
    ["Desaparición del moratón en la mitad de tiempo", "Alivio anestésico local del dolor por impacto"],
    ["Aplicar suavemente sin masajear bruscamente sobre la zona contusionada"],
    "Quelación de hemosiderina por italidionas de Helicriso sumada a la inhibición de NF-kB por lactonas sesquiterpénicas de Árnica.",
    ["musculoesqueletico", "cardiovascular", "dermatologico"]
)
create_synergy(
    "helicriso_aceite", "cipres", "sinergia", "A",
    "Drenaje venoso y alivio de varices, flebitis superficiales y pesadez intensa de piernas.",
    ["Descongestión vascular inmediata", "Mejora del retorno venoso y linfático"],
    ["Aplicar con masaje ascendente desde los tobillos hacia los muslos"],
    "Efecto descongestivo venoso y tonificante de los alfa-pineno del ciprés con la fibrinolisis local del helicriso.",
    ["cardiovascular"]
)

# Sinergias PEA (Palmitoiletanolamida)
create_synergy(
    "palmitoiletanolamida_pea", "curcuma", "sinergia", "A",
    "Terapia combinada de vanguardia para dolor crónico osteoarticular y fibromialgia sin efectos gástricos.",
    ["Disminución clínicamente significativa del dolor en escalas VAS", "Reducción de analgésicos opioides/AINEs"],
    ["Tomar con una comida rica en lípidos saludables"],
    "Modulación de microglía por activación de PPAR-alfa por PEA junto a la inhibición transcripcional de COX-2 y TNF-alfa por curcumina.",
    ["musculoesqueletico", "nervioso"]
)
create_synergy(
    "palmitoiletanolamida_pea", "magnesio", "sinergia", "A",
    "Alivio de contracturas musculares dolorosas, ciática, lumbalgia y calambres nocturnos.",
    ["Relajación neuromuscular profunda", "Menor hipersensibilidad dolorosa al tacto y movimiento"],
    ["Ninguna relevante"],
    "Bloqueo de receptores NMDA de dolor por magnesio sumado a la estabilización de mastocitos perineurales por PEA.",
    ["musculoesqueletico", "nervioso"]
)
create_synergy(
    "palmitoiletanolamida_pea", "acido_alfa_lipoico", "sinergia", "A",
    "Regeneración nerviosa y control del ardor en neuropatía diabética y neuropatías periféricas.",
    ["Disminución del entumecimiento, hormigueo y quemazón en pies y manos", "Protección celular antioxidante"],
    ["Controlar glucemias en diabéticos"],
    "Reciclaje antioxidante mitocondrial por ácido alfa lipoico con supresión de la neuroinflamación por PEA.",
    ["nervioso", "metabolico"]
)

# Sinergias Quercetina Fitosomada
create_synergy(
    "quercetina_fitosoma", "vitamina_c", "sinergia", "A",
    "Dúo antihistamínico natural de alta potencia para rinitis alérgica, asma y picor ocular.",
    ["Freno de estornudos, rinorrea y lagrimeo alérgico", "Reducción de la necesidad de antihistamínicos orales"],
    ["Iniciar 2-3 semanas antes del inicio de la primavera"],
    "La vitamina C regenera la molécula de quercetina oxidada y ejerce un efecto antihistamínico sérico complementario.",
    ["inmune", "respiratorio"]
)
create_synergy(
    "quercetina_fitosoma", "zinc", "sinergia", "A",
    "Potenciación antiviral e inmunomoduladora: la quercetina actúa como ionóforo de zinc celular.",
    ["Facilita la entrada de zinc en las células para frenar la replicación viral (ARN polimerasa)", "Refuerzo frente a gripes y catarros"],
    ["Tomar con comida para evitar leves náuseas por zinc"],
    "Transporte activo de cationes de Zn2+ a través de la membrana celular facilitado por la estructura quelante de la quercetina.",
    ["inmune"]
)
create_synergy(
    "quercetina_fitosoma", "bromelina", "sinergia", "A",
    "Descongestión de senos paranasales y alivio de sinusitis y edema respiratorio.",
    ["Drenaje del moco nasal espeso", "Desinflamación de la mucosa respiratoria"],
    ["Tomar fuera de comidas para efecto antiinflamatorio sistémico"],
    "Fibrinolisis y mejora de la permeabilidad tisular por bromelina con estabilización de mastocitos por quercetina.",
    ["respiratorio", "inmune"]
)

# Sinergias Astaxantina
create_synergy(
    "astaxantina", "luteina", "sinergia", "A",
    "Escudo protector macular y retiniano frente a la luz azul de pantallas y la degeneración macular (DMAE).",
    ["Alivio de la fatiga visual, visión borrosa y sequedad ocular", "Aumento de la densidad del pigmento macular"],
    ["Tomar con el desayuno o almuerzo"],
    "Filtro óptico de longitudes de onda cortas por luteína/zeaxantina más neutralización de radicales libres retinianos por astaxantina.",
    ["ocular"]
)
create_synergy(
    "astaxantina", "omega_3", "sinergia", "A",
    "Protección cardiovascular, vascular cerebral y antiinflamatoria sistémica de máximo rango.",
    ["Mejora de la microcirculación capilar y flexibilidad arterial", "Reducción del colesterol LDL oxidado"],
    ["Precaución a dosis muy altas con fármacos anticoagulantes"],
    "Protección de los enlaces insaturados de EPA/DHA frente a la peroxidación lipídica con transporte fosfolipídico sinérgico.",
    ["cardiovascular", "ocular", "dermatologico"]
)
create_synergy(
    "astaxantina", "coenzima_q10", "sinergia", "A",
    "Anti-aging mitocondrial y foto-protección dérmica frente a arrugas y radiación solar UV.",
    ["Aumento de la elasticidad de la piel y disminución de manchas solares", "Optimización de la energía celular"],
    ["Tomar con comida grasa"],
    "Sinergia antioxidante en la membrana mitocondrial interna (CoQ10) y a través de toda la bicapa fosfolipídica (astaxantina).",
    ["dermatologico", "metabolico"]
)

print(f"Sinergias añadidas en esta ronda: {len(new_synergies_to_add)}")

# Distribuir las nuevas sinergias en sinergias_3.json
sin3_data['sinergias'].extend(new_synergies_to_add)

# 7. Guardar los archivos de la KB
fito_data['metadata']['total'] = len(fito_data['ingredientes'])
fito_data['metadata']['ultimaActualizacion'] = "2026-09-08"
with open(fito_path, 'w', encoding='utf-8') as f:
    json.dump(fito_data, f, ensure_ascii=False, indent=2)
    f.write('\n')

homeo_data['metadata']['total'] = len(homeo_data['ingredientes'])
homeo_data['metadata']['ultimaActualizacion'] = "2026-09-08"
with open(homeo_path, 'w', encoding='utf-8') as f:
    json.dump(homeo_data, f, ensure_ascii=False, indent=2)
    f.write('\n')

aceites_data['metadata']['total'] = len(aceites_data['ingredientes'])
aceites_data['metadata']['ultimaActualizacion'] = "2026-09-08"
with open(aceites_path, 'w', encoding='utf-8') as f:
    json.dump(aceites_data, f, ensure_ascii=False, indent=2)
    f.write('\n')

vit_data['metadata']['total'] = len(vit_data['ingredientes'])
vit_data['metadata']['ultimaActualizacion'] = "2026-09-08"
with open(vit_path, 'w', encoding='utf-8') as f:
    json.dump(vit_data, f, ensure_ascii=False, indent=2)
    f.write('\n')

sin3_data['metadata']['total'] = len(sin3_data['sinergias'])
sin3_data['metadata']['ultimaActualizacion'] = "2026-09-08"
with open(sin3_path, 'w', encoding='utf-8') as f:
    json.dump(sin3_data, f, ensure_ascii=False, indent=2)
    f.write('\n')

print("Bases de datos JSON actualizadas exitosamente.")
