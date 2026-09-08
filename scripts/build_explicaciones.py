#!/usr/bin/env python3
"""
Generador y Validador Exhaustivo de la Base de Conocimiento de Explicaciones Clínicas ("El Cómo")
Protocolo Ponytail para Vademecum AI.
"""

import json
import re

# 1. Cargar bases de conocimiento canónicas
fito = {i['id']: i for i in json.load(open('src/db/seeders/data/fitoterapia.json'))['ingredientes']}
homeo = {i['id']: i for i in json.load(open('src/db/seeders/data/homeopatia.json'))['ingredientes']}
aceites = {i['id']: i for i in json.load(open('src/db/seeders/data/aceites.json'))['ingredientes']}
vit = {i['id']: i for i in json.load(open('src/db/seeders/data/vitaminas_minerales.json'))['ingredientes']}
all_kb = {**fito, **homeo, **aceites, **vit}

pats = {}
for f in ['patologias_1.json', 'patologias_2.json', 'patologias_3.json']:
    for p in json.load(open('src/db/seeders/data/' + f))['patologias']:
        pats[p['id']] = p

print(f"KB Cargada: {len(all_kb)} ingredientes, {len(pats)} patologías.")

# Banco de explicaciones artesanales hiper-específicas de mostrador
CURATED_EXPLANATIONS = {
    # Ansiedad
    ("valeriana", "ansiedad"): "En la ansiedad, la Valeriana estimula los receptores GABA del cerebro, actuando como el freno natural de la hiperactividad nerviosa sin causar dependencia.",
    ("pasiflora", "ansiedad"): "La Pasiflora relaja la tensión mental y calma el nerviosismo continuo a través de sus flavonoides sedantes, evitando la sensación de embotamiento.",
    ("melisa", "ansiedad"): "La Melisa alivia la ansiedad somatizada en el aparato digestivo o con palpitaciones nerviosas leves, relajando el eje intestino-cerebro.",
    ("ashwagandha", "ansiedad"): "La Ashwagandha modula los niveles de cortisol y el eje del estrés, aumentando la serenidad y la resistencia mental ante situaciones de sobrecarga.",
    ("amapola_californiana", "ansiedad"): "La Amapola de California disminuye la hiperexcitabilidad nerviosa y la sensación de agobio, ayudando a recuperar la calma de forma natural.",
    ("espino_blanco", "ansiedad"): "El Espino Blanco regula el ritmo cardíaco y suaviza las palpitaciones y la opresión en el pecho provocadas por el nerviosismo.",
    ("lupulo", "ansiedad"): "El Lúpulo ejerce un efecto calmante directo sobre el sistema nervioso central, aliviando la inquietud motora y la irritabilidad.",
    ("magnesio_glicinato", "ansiedad"): "El Magnesio en forma de glicinato relaja directamente las fibras musculares tensas y frena la sobreexcitación neuronal.",
    ("triptofano", "ansiedad"): "El Triptófano es el precursor directo de la serotonina cerebral, mejorando la estabilidad emocional y reduciendo la vulnerabilidad al pánico.",
    ("gaba", "ansiedad"): "El GABA actúa como el freno relajante principal del sistema nervioso, reduciendo la rumiación mental y la sobrecarga sensorial.",
    ("l_teanina", "ansiedad"): "La L-Teanina estimula la generación de ondas alfa cerebrales, induciendo un estado de calma lúcida y concentración relajada sin somnolencia.",
    ("gelsemium", "ansiedad"): "En homeopatía, Gelsemium es el remedio clave para la ansiedad de anticipación (miedo a exámenes, citas o hablar en público), aliviando temblores y bloqueo mental.",
    ("ignatia", "ansiedad"): "Ignatia modula el impacto de disgustos, contrariedades o duelos, aliviando el nudo en la garganta, los suspiros involuntarios y la labilidad emocional.",
    ("aconitum_napellus", "ansiedad"): "Aconitum actúa en crisis de pánico o angustia súbita con taquicardia y miedo intenso desencadenadas de forma repentina, restableciendo la calma.",
    ("argentum_nitricum", "ansiedad"): "Argentum Nitricum alivia la ansiedad con prisas continuas, agitación motora y molestias digestivas o diarrea nerviosa antes de un compromiso.",
    ("arsenicum_album", "ansiedad"): "Arsenicum Album calma la angustia y la inquietud nocturna en personas que sienten temor por su salud y necesitan sentirse acompañadas.",
    ("lavanda_aceite", "ansiedad"): "El aroma de Lavanda activa el sistema parasimpático gracias al linalool, disminuyendo la frecuencia cardíaca y sosegando la mente de inmediato.",
    ("neroli", "ansiedad"): "El Neroli (azahar) calma de forma instantánea crisis de angustia y taquicardias emocionales mediante su inhalación relajante.",
    ("ilang_ilang", "ansiedad"): "El Ilang-Ilang reduce la presión arterial reactiva y calma la respiración agitada en momentos de tensión nerviosa aguda.",

    # Insomnio
    ("valeriana", "insomnio"): "La Valeriana reduce el tiempo necesario para conciliar el sueño y mejora su calidad global sin alterar las fases fisiológicas del descanso.",
    ("pasiflora", "insomnio"): "La Pasiflora frena el flujo incesante de pensamientos a la hora de acostarse, permitiendo una transición suave hacia el sueño profundo.",
    ("amapola_californiana", "insomnio"): "La Amapola de California previene los despertares nocturnos frecuentes y las pesadillas, prolongando el descanso continuo.",
    ("lupulo", "insomnio"): "El Lúpulo actúa en sinergia con otras plantas relajantes reforzando la inducción del sueño profundo en casos de insomnio por agotamiento.",
    ("melatonina", "insomnio"): "La Melatonina sincroniza el reloj biológico cerebral indicándole al cuerpo que es hora de dormir, reduciendo la latencia de conciliación.",
    ("magnesio", "insomnio"): "El Magnesio activa los receptores cerebrales de relajación y relaja la musculatura, evitando los calambres nocturnos y microdespertares.",
    ("chamomilla", "insomnio"): "Chamomilla sosiega el insomnio acompañado de gran irritabilidad o hipersensibilidad al malestar en personas que no logran estar quietas.",
    ("nux_vomica", "insomnio"): "Nux Vomica es el remedio para quien despierta hacia las 3 o 4 de la madrugada rumiando preocupaciones o tras excesos de café, pantallas o cenas copiosas.",

    # Artrosis / Artritis / Dolor
    ("curcuma", "artrosis"): "La Cúrcuma frena las enzimas inflamatorias y citoquinas que destruyen el cartílago, calmando el dolor articular continuo y la rigidez.",
    ("harpagofito", "artrosis"): "El Harpagofito contiene harpagósidos con acción antiinflamatoria natural comparable a los analgésicos clásicos pero sin irritar la mucosa gástrica.",
    ("boswelia", "artrosis"): "Los ácidos boswélicos bloquean selectivamente la enzima 5-LOX, reduciendo el derrame articular y devolviendo la flexibilidad a la articulación.",
    ("sauce", "artrosis"): "La corteza de Sauce aporta salicina que se transforma en analgésico natural en el cuerpo, aliviando el dolor articular de manera progresiva.",
    ("glucosamina", "artrosis"): "La Glucosamina nutre directamente los proteoglicanos del cartílago, frenando el desgaste y amortiguando el roce entre los huesos.",
    ("msm", "artrosis"): "El MSM aporta azufre biológico indispensable para la síntesis de colágeno articular y reduce la inflamación de los tejidos periarticulares.",
    ("omega_3", "artrosis"): "Los ácidos grasos EPA del Omega 3 compiten con las grasas proinflamatorias, reduciendo el dolor articular matutino.",
    ("arnica", "artrosis"): "Arnica calma la sensación de articulación dolorida, sensible al frío o magullada tras el esfuerzo.",
    ("rhus_toxicodendron", "artrosis"): "Rhus Toxicodendron alivia la articulación que duele y cruje al empezar a moverse pero mejora a medida que se calienta y camina suavemente.",
    ("bryonia", "artrosis"): "Bryonia es específica para el dolor punzante en la articulación que empeora con el menor movimiento y exige reposo absoluto.",
    ("gaulteria", "artrosis"): "El aceite de Gaulteria, compuesto casi enteramente por salicilato de metilo natural, es un potente analgésico tópico inmediato para masajear la zona.",

    # Acné
    ("tea_tree", "acne"): "El Tea Tree destruye las bacterias causantes de las pústulas (C. acnes) y reduce la inflamación del poro sin resecar agresivamente la piel.",
    ("bardana", "acne"): "La Bardana depura la piel regulando la secreción sebácea y favoreciendo el drenaje hepático de toxinas.",
    ("zinc", "acne"): "El Zinc inhibe la producción excesiva de sebo y acelera la cicatrización de las lesiones inflamatorias.",
    ("silicea", "acne"): "Silicea favorece la maduración y eliminación de espinillas y pústulas enquistadas, promoviendo la regeneración de la piel.",
    ("sulphur", "acne"): "Sulphur depura la piel con tendencia a comedones, granitos rojizos y secreción grasa que empeora con el calor.",

    # Cistitis
    ("arandano_rojo", "cistitis"): "Las proantocianidinas del Arándano Rojo impiden mecánicamente que la bacteria E. coli se pegue a la pared de la vejiga, expulsándola al orinar.",
    ("uva_ursi", "cistitis"): "La Uva Ursi (Gayuba) libera arbutina que se transforma en un potente desinfectante urinario natural en la orina alcalina.",
    ("d_manosa", "cistitis"): "La D-Manosa atrae a las bacterias patógenas como un imán para que sean arrastradas con el chorro de orina sin alterar la flora íntima.",
    ("staphysagria", "cistitis"): "Staphysagria alivia el dolor y las molestias urinarias desencadenadas tras relaciones íntimas o con hipersensibilidad en la uretra.",

    # Gripe / Resfriado
    ("equinacea", "gripe"): "La Equinácea activa los glóbulos blancos y macrófagos, frenando la multiplicación viral y acortando la duración de los síntomas gripales.",
    ("sauco", "gripe"): "Las antocianinas del Saúco bloquean la entrada de los virus a las células respiratorias y calman la congestión y el dolor de cabeza.",
    ("propoleo", "gripe"): "El Própolis actúa como escudo protector en la garganta, impidiendo el avance de virus y bacterias oportunistas.",
    ("ravintsara", "gripe"): "El aceite esencial de Ravintsara es un potente antiviral que estimula las defensas y descongestiona el pecho rápidamente.",
    ("belladonna", "gripe"): "Belladonna trata la fiebre alta súbita con rostro enrojecido, sudoración y garganta inflamada ardiente.",
    ("gelsemium", "gripe"): "Gelsemium alivia el cuadro gripal dominado por un cansancio extremo, pesadez en los párpados y dolor muscular generalizado sin sed.",

    # Tos
    ("tomillo", "tos"): "El Tomillo ejerce una doble acción: es antiséptico contra los gérmenes de la garganta y relaja los bronquios facilitando la expectoración.",
    ("llanten", "tos"): "El Llantén recubre la garganta irritada con mucílagos protectores, calmando inmediatamente el cosquilleo de la tos seca.",
    ("hiedra", "tos"): "La Hiedra fluidifica las flemas densas atrapadas en los bronquios y relaja el músculo bronquial para una respiración más limpia.",
    ("drosera", "tos"): "La Drosera calma los accesos de tos espasmódica y quintosa que impiden descansar o hablar, relajando el reflejo de toser.",
    ("eucalipto", "tos"): "El Eucalipto abre las vías respiratorias y ayuda a disolver la mucosidad espesa gracias a su compuesto natural cineol."
}

def clean_clause(text):
    if not text:
        return ""
    text = text.strip()
    # Quitar puntos finales
    text = re.sub(r'\.+$', '', text)
    # Si empieza por mayúscula, poner en minúscula la primera letra
    if len(text) > 1 and text[0].isupper() and not text[1].isupper():
        text = text[0].lower() + text[1:]
    return text

def generate_tailored_explanation(ing, pat):
    ing_name = ing['nombre']
    cat = ing.get('categoria', '')
    pat_name = pat['nombre']
    mecanismo = ing.get('mecanismoAccion', '').strip()
    desc = ing.get('descripcion', '').strip()
    principios = ing.get('principiosActivos', [])

    # Extraer la primera frase del mecanismo o descripción
    raw_info = mecanismo if mecanismo else desc
    sentences = [s.strip() for s in raw_info.split('.') if s.strip()]
    core_point = clean_clause(sentences[0]) if sentences else ""

    # Quitar prefijos redundantes de la frase
    core_point = re.sub(r'^(en fitoterapia:?|en homeopatia:?|los compuestos|actua como|ejerce una?)\s*', '', core_point, flags=re.I)

    # Formulación según categoría
    if cat == 'homeopatia':
        if core_point:
            return f"En homeopatía, {ing_name} modula la reactividad del organismo en {pat_name}: {core_point}, aliviando el malestar de forma suave y sin interacciones."
        else:
            return f"En homeopatía, {ing_name} ayuda en {pat_name} estimulando los mecanismos propios de autorregulación del cuerpo, proporcionando alivio sin efectos secundarios."

    elif cat == 'aceites':
        if core_point:
            return f"El aceite esencial de {ing_name} actúa en {pat_name} mediante {core_point}, proporcionando un alivio rápido y directo por vía aromática o tópica."
        else:
            return f"El aceite esencial de {ing_name} aporta propiedades específicas para {pat_name}, ejerciendo una acción concentrada y de rápida absorción."

    elif cat == 'vitaminas_minerales':
        if core_point:
            return f"{ing_name} es fundamental en {pat_name} porque {core_point}, optimizando el metabolismo celular y acelerando la recuperación."
        else:
            return f"{ing_name} aporta un soporte nutricional clave en {pat_name}, reforzando los procesos biológicos necesarios para restablecer el equilibrio fisiológico."

    else:
        # Fitoterapia por defecto
        activos_str = f" (rico en {', '.join(principios[:2])})" if principios else ""
        if core_point:
            return f"{ing_name}{activos_str} actúa en {pat_name} porque {core_point}, ofreciendo un tratamiento natural eficaz y bien tolerado."
        else:
            return f"{ing_name}{activos_str} ayuda en {pat_name} apoyando las defensas y la fisiología propia del tejido afectado de forma segura y natural."

# Generación exhaustiva
all_entries = []
seen_pairs = set()

# 1. Primero incorporar todas las entradas curadas que sean válidas
for (ing_id, pat_id), explicacion in CURATED_EXPLANATIONS.items():
    if ing_id in all_kb and pat_id in pats:
        entry_id = f"exp_{ing_id}_{pat_id}"
        all_entries.append({
            "id": entry_id,
            "ingredienteId": ing_id,
            "patologiaId": pat_id,
            "explicacion": explicacion
        })
        seen_pairs.add((ing_id, pat_id))

# 2. Iterar por todas las patologías y sus tratamientos naturales en la KB
for pat_id, pat in pats.items():
    tn = pat.get('tratamientoNatural', {})
    for cat in ['fitoterapia', 'homeopatia', 'suplementos', 'aceites']:
        for ing_id in tn.get(cat, []):
            if (ing_id, pat_id) in seen_pairs:
                continue
            if ing_id not in all_kb:
                continue  # Ya garantizamos que todos existen, pero por seguridad
            ing = all_kb[ing_id]
            explicacion = generate_tailored_explanation(ing, pat)
            entry_id = f"exp_{ing_id}_{pat_id}"
            all_entries.append({
                "id": entry_id,
                "ingredienteId": ing_id,
                "patologiaId": pat_id,
                "explicacion": explicacion
            })
            seen_pairs.add((ing_id, pat_id))

print(f"\nTotal explicaciones generadas: {len(all_entries)}")

# 3. Auditoría de Calidad e Integridad (Protocolo Ponytail)
invalid_ing = 0
invalid_pat = 0
empty_exp = 0
duplicate_ids = set()
unique_check = set()

for e in all_entries:
    if e['ingredienteId'] not in all_kb:
        invalid_ing += 1
    if e['patologiaId'] not in pats:
        invalid_pat += 1
    if not e['explicacion'] or len(e['explicacion'].strip()) < 15:
        empty_exp += 1
    if e['id'] in unique_check:
        duplicate_ids.add(e['id'])
    unique_check.add(e['id'])

print("--- AUDITORÍA PONYTAIL FINAL ---")
print(f"Ingredientes inválidos: {invalid_ing}")
print(f"Patologías inválidas: {invalid_pat}")
print(f"Explicaciones vacías o cortas: {empty_exp}")
print(f"IDs duplicados: {len(duplicate_ids)}")

assert invalid_ing == 0, "Error: Hay ingredientes inválidos"
assert invalid_pat == 0, "Error: Hay patologías inválidas"
assert empty_exp == 0, "Error: Hay explicaciones vacías"
assert len(duplicate_ids) == 0, "Error: Hay IDs duplicados"

# Guardar en archivo oficial
output_data = {
    "metadata": {
        "total": len(all_entries),
        "version": "1.2.0",
        "descripcion": "Base de datos completa de explicaciones clínicas directas para el mostrador farmacéutico ('El Cómo')",
        "ultimaActualizacion": "2026-09-08"
    },
    "explicaciones": all_entries
}

with open('src/db/seeders/data/explicaciones_clinicas.json', 'w', encoding='utf-8') as f:
    json.dump(output_data, f, ensure_ascii=False, indent=2)
    f.write('\n')

print(f"Archivo guardado exitosamente: src/db/seeders/data/explicaciones_clinicas.json ({len(all_entries)} registros)")
