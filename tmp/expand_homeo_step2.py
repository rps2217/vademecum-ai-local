import json

HOMEO_PATH = "src/db/seeders/data/homeopatia.json"
SINERGIAS_PATH = "src/db/seeders/data/sinergias_3.json"

homeo = json.load(open(HOMEO_PATH))
sinergias = json.load(open(SINERGIAS_PATH))

new_remedies = [
    {
        "id": "cocculus_indicus",
        "nombre": "Cocculus Indicus",
        "nombresAlternativos": ["Cocculus", "Anamirta cocculus", "Indian berry"],
        "nombreCientifico": "Anamirta cocculus",
        "familia": "Menispermaceae",
        "categoria": "homeopatia",
        "sistemas": ["nervioso", "digestivo"],
        "indicaciones": ["cinetosis", "vertigo", "insomnio", "nauseas", "agotamiento"],
        "descripcion": "Remedio capital para mareo por movimiento (cinetosis en coche/barco/tren), náuseas con aversión a la comida o su olor, y agotamiento nervioso severo por trasnochar o cuidar a personas enfermas.",
        "mecanismoAccion": "En homeopatia: actúa sobre el centro vestibular cerebeloso y la motilidad gástrica refleja. Modula la sobreexcitabilidad sensorial y el agotamiento del eje neurovegetativo.",
        "nivelEvidencia": "B",
        "dilucionesCH": [5, 7, 9, 15, 30],
        "sintomasClave": [
            "Mareo y vértigo intenso al viajar en coche, barco o mirar objetos en movimiento",
            "Náuseas profundas con el simple olor o vista de los alimentos",
            "Agotamiento y cefalea occipital tras vigilias prolongadas o cuidar enfermos",
            "Sensación de vacío o pesadez en cabeza y abdomen"
        ],
        "modalidades": {
            "empeora": ["movimiento pasivo", "viaje en coche o barco", "trasnochar", "olor a comida", "perdida de sueno"],
            "mejora": ["calor", "habitacion tibia", "acostado quieto", "cerrar los ojos"]
        },
        "seguridad": {
            "embarazo": "apto",
            "lactancia": "apto",
            "pediatria": "apto",
            "hipertension": "apto",
            "diabetes": "apto",
            "celiacos": "apto"
        },
        "interaccionesMedicamentosas": []
    },
    {
        "id": "spongia_tosta",
        "nombre": "Spongia Tosta",
        "nombresAlternativos": ["Spongia", "Esponja marina tostada", "Euspongia officinalis"],
        "nombreCientifico": "Euspongia officinalis",
        "familia": "Spongiidae",
        "categoria": "homeopatia",
        "sistemas": ["respiratorio", "endocrino"],
        "indicaciones": ["tos", "laringitis", "crup", "ronquera", "disfonia"],
        "descripcion": "Gran remedio para la laringitis aguda sofocante, crup infantil, ronquera y tos seca crupal metálica (comparada con serrar madera de pino), con sequedad extrema de vías aéreas.",
        "mecanismoAccion": "En homeopatia: afinidad por la mucosa laríngea, cuerdas vocales y tejido glandular tiroideo. Alivia el espasmo laríngeo y la hiperreactividad tusígena seca.",
        "nivelEvidencia": "B",
        "dilucionesCH": [5, 7, 9, 15, 30],
        "sintomasClave": [
            "Tos muy seca, ruidosa, metálica y aserrada (como sierra en tabla)",
            "Despertar brusco antes de medianoche con sofocación y angustia respiratoria",
            "Ronquera dolorosa con sensación de tapón en la laringe",
            "Mejora inmediata y característica al ingerir bebidas o alimentos calientes"
        ],
        "modalidades": {
            "empeora": ["aire frio y seco", "hablar", "antes de medianoche", "acostado plano con cabeza baja"],
            "mejora": ["bebidas calientes", "comer o tragar caliente", "posicion semisentada", "ambiente humedo y templado"]
        },
        "seguridad": {
            "embarazo": "apto",
            "lactancia": "apto",
            "pediatria": "apto",
            "hipertension": "apto",
            "diabetes": "apto",
            "celiacos": "apto"
        },
        "interaccionesMedicamentosas": []
    },
    {
        "id": "baptisia_tinctoria",
        "nombre": "Baptisia Tinctoria",
        "nombresAlternativos": ["Baptisia", "Wild indigo", "Índigo silvestre"],
        "nombreCientifico": "Baptisia tinctoria",
        "familia": "Fabaceae",
        "categoria": "homeopatia",
        "sistemas": ["inmune", "digestivo", "nervioso"],
        "indicaciones": ["fiebre", "gripe", "infeccion", "postracion", "gastroenteritis"],
        "descripcion": "Remedio de estados infecciosos febriles agudos adinámicos (síndrome gripal severo o tifoideo), caracterizado por postración rápida, confusión mental, dolor muscular generalizado y fetidez de secreciones.",
        "mecanismoAccion": "En homeopatia: actúa sobre el endotelio vascular y la respuesta inmunoinflamatoria sistémica febril, aliviando la sensación de magulladura corporal y el estupor tóxico.",
        "nivelEvidencia": "B",
        "dilucionesCH": [5, 7, 9, 15, 30],
        "sintomasClave": [
            "Estupor febril con cara roja oscura abotagada y confusión mental",
            "Sensación de que el cuerpo está dividido en pedazos en la cama y lucha por juntarlos",
            "Dolor magullado en todos los músculos y la cama se siente intolerablemente dura",
            "Fetidez extrema de aliento, sudor y heces diarreicas"
        ],
        "modalidades": {
            "empeora": ["calor sofocante", "movimiento", "presion", "niebla o humedad"],
            "mejora": ["reposo absoluto", "aire fresco", "bebidas frias en pequenos sorbos"]
        },
        "seguridad": {
            "embarazo": "apto",
            "lactancia": "apto",
            "pediatria": "apto",
            "hipertension": "apto",
            "diabetes": "apto",
            "celiacos": "apto"
        },
        "interaccionesMedicamentosas": []
    },
    {
        "id": "ranunculus_bulbosus",
        "nombre": "Ranunculus Bulbosus",
        "nombresAlternativos": ["Ranunculus", "Buttercup", "Botón de oro"],
        "nombreCientifico": "Ranunculus bulbosus",
        "familia": "Ranunculaceae",
        "categoria": "homeopatia",
        "sistemas": ["dermatologico", "nervioso", "musculoesqueletico"],
        "indicaciones": ["herpes_zoster", "neuralgia_intercostal", "pleurodinia", "dolor_neuropatico"],
        "descripcion": "Remedio de referencia para herpes zóster torácico y neuralgias intercostales severas, punzantes o ardientes, con vesículas azuladas dolorosas que empeoran con cualquier cambio meteorológico o movimiento respiratorio.",
        "mecanismoAccion": "En homeopatia: selectividad por raíces nerviosas intercostales, terminaciones periféricas sensitivas y epitelio cutáneo afectado por reactivación viral o neuralgia aguda.",
        "nivelEvidencia": "B",
        "dilucionesCH": [5, 7, 9, 15, 30],
        "sintomasClave": [
            "Dolor punzante, lancinante o quemante entre las costillas que corta la respiración",
            "Erupciones vesiculares herpéticas dolorosas agrupadas con base cianótica o azulada",
            "Extrema sensibilidad al tacto de la pared torácica",
            "Agravación inmediata al cambio de tiempo a húmedo o frío y con el menor movimiento"
        ],
        "modalidades": {
            "empeora": ["cambio de clima", "frio humedo", "menor movimiento", "respiracion profunda", "tacto de la ropa"],
            "mejora": ["calor local seco", "estar sentado quieto inclinado ligeramente hacia adelante"]
        },
        "seguridad": {
            "embarazo": "apto",
            "lactancia": "apto",
            "pediatria": "apto",
            "hipertension": "apto",
            "diabetes": "apto",
            "celiacos": "apto"
        },
        "interaccionesMedicamentosas": []
    },
    {
        "id": "sambucus_nigra_homeo",
        "nombre": "Sambucus Nigra (Homeo)",
        "nombresAlternativos": ["Sambucus", "Elder", "Saúco homeopático"],
        "nombreCientifico": "Sambucus nigra",
        "familia": "Adoxaceae",
        "categoria": "homeopatia",
        "sistemas": ["respiratorio", "inmune"],
        "indicaciones": ["obstruccion_nasal", "coriza", "laringitis", "sudoracion_profusa", "tos"],
        "descripcion": "Remedio excelente para la nariz tapada seca en lactantes y niños (no pueden mamar ni dormir por obstrucción nasal completa), accesos de tos sofocante nocturna y sudoración profusa al despertar.",
        "mecanismoAccion": "En homeopatia: descongestiona la mucosa nasofaríngea y bronquial espasmódica. Modula los episodios vasomotores y la diaforesis reactiva.",
        "nivelEvidencia": "B",
        "dilucionesCH": [5, 7, 9, 15, 30],
        "sintomasClave": [
            "Nariz completamente obstruida y seca en lactantes durante el sueño y la lactancia",
            "Despertar súbito a medianoche con asfixia y cianosis leve por espasmo laríngeo",
            "Sudoración profusa generalizada inmediatamente al despertar, mientras que durante el sueño la piel está seca y caliente",
            "Tos espasmódica ronca sofocante nocturna"
        ],
        "modalidades": {
            "empeora": ["medianoche", "acostado con cabeza baja", "durante el sueno", "aire frio y seco"],
            "mejora": ["sentarse erguido en la cama", "movimiento suave", "abrigarse bien", "respirar aire templado"]
        },
        "seguridad": {
            "embarazo": "apto",
            "lactancia": "apto",
            "pediatria": "apto",
            "hipertension": "apto",
            "diabetes": "apto",
            "celiacos": "apto"
        },
        "interaccionesMedicamentosas": []
    }
]

# Check existing IDs
existing_ids = {i['id'] for i in homeo['ingredientes']}
to_add = [r for r in new_remedies if r['id'] not in existing_ids]

print(f"Adding {len(to_add)} remedies to homeopatia.json")
homeo['ingredientes'].extend(to_add)
homeo['metadata']['total'] = len(homeo['ingredientes'])
homeo['metadata']['ultimaActualizacion'] = "2026-10-12"
homeo['metadata']['version'] = "2.0.0"

with open(HOMEO_PATH, 'w', encoding='utf-8') as f:
    json.dump(homeo, f, ensure_ascii=False, indent=2)

new_synergies = [
    {
        "id": "sin_cocculus_tabacum_cinetosis",
        "ingredienteA": "cocculus_indicus",
        "ingredienteB": "tabacum",
        "tipo": "sinergia",
        "nivel": "fuerte",
        "descripcion": "Combinación sinérgica de referencia para cinetosis, náuseas del viajero y mareo vestibular en transportes marítimos o terrestres.",
        "mecanismo": "Cocculus estabiliza los centros reflejos del equilibrio ante el movimiento y la fatiga por trasnochar, mientras que Tabacum alivia la palidez gélida y las náuseas de origen neurovegetativo.",
        "indicaciones": ["cinetosis", "vertigo", "nauseas"],
        "evidencia": "B",
        "fuentes": ["Materia Médica Homeopática Boiron", "Repertorio de Boericke"]
    },
    {
        "id": "sin_cocculus_nux_vomica_fatiga",
        "ingredienteA": "cocculus_indicus",
        "ingredienteB": "nux_vomica",
        "tipo": "sinergia",
        "nivel": "moderada",
        "descripcion": "Acción complementaria en cefalea por sobrecarga laboral, insomnio por vigilias continuadas y trastornos digestivos asociados al estrés nervioso.",
        "mecanismo": "Nux vomica modula la irritabilidad gástrica y hepática tras excesos o estrés, mientras Cocculus repara el agotamiento neuromuscular y la pesadez occipital por pérdida de descanso.",
        "indicaciones": ["agotamiento", "insomnio", "nauseas"],
        "evidencia": "B",
        "fuentes": ["Materia Médica Clínica Kent", "Guía Terapéutica Homeopática"]
    },
    {
        "id": "sin_spongia_aconitum_crup",
        "ingredienteA": "spongia_tosta",
        "ingredienteB": "aconitum_napellus",
        "tipo": "sinergia",
        "nivel": "fuerte",
        "descripcion": "Fórmula clásica del trío de crup (Aconitum - Spongia - Hepar sulphur) para laringitis estridente y tos crupal tras exposición a viento frío.",
        "mecanismo": "Aconitum aborta la fase inflamatoria hiperaguda inicial con fiebre y agitación, y Spongia actúa a continuación desinflamando la mucosa laríngea y resolviendo el espasmo de la tos seca áspera.",
        "indicaciones": ["laringitis", "tos", "crup"],
        "evidencia": "B",
        "fuentes": ["Trío del Crup de Hahnemann", "Pediatría Homeopática Boiron"]
    },
    {
        "id": "sin_spongia_hepar_sulphuris_tos",
        "ingredienteA": "spongia_tosta",
        "ingredienteB": "hepar_sulphuris",
        "tipo": "sinergia",
        "nivel": "fuerte",
        "descripcion": "Continuidad sinérgica en la resolución de laringotraqueítis aguda espasmódica con sensibilidad exquisita a corrientes de aire.",
        "mecanismo": "Spongia modula la tos seca áspera y el estridor laríngeo que mejora con líquidos calientes, permitiendo que Hepar sulphur complete la maduración mucosa evitando sobreinfecciones.",
        "indicaciones": ["tos", "laringitis", "ronquera"],
        "evidencia": "B",
        "fuentes": ["Materia Médica Boericke", "Clínica Homeopática Nash"]
    },
    {
        "id": "sin_baptisia_gelsemium_gripe",
        "ingredienteA": "baptisia_tinctoria",
        "ingredienteB": "gelsemium",
        "tipo": "sinergia",
        "nivel": "fuerte",
        "descripcion": "Asociación de choque para estados gripales y febriles infecciosos con postración intensa, pesadez corporal y cefalea congestiva.",
        "mecanismo": "Gelsemium combate la paresia muscular, escalofríos y abatimiento motor, mientras Baptisia combate la fetidez, el dolor sordo de magulladura generalizada y el embotamiento sensorial.",
        "indicaciones": ["gripe", "fiebre", "infeccion"],
        "evidencia": "B",
        "fuentes": ["Materia Médica Kent", "Protocolos de Gripe Boiron"]
    },
    {
        "id": "sin_ranunculus_mezereum_herpes",
        "ingredienteA": "ranunculus_bulbosus",
        "ingredienteB": "mezereum",
        "tipo": "sinergia",
        "nivel": "fuerte",
        "descripcion": "Dúo sinérgico fundamental para neuralgia postherpética y brotes agudos de herpes zóster torácico o facial con vesículas hiperálgicas.",
        "mecanismo": "Ranunculus reduce el dolor punzante intercostal agravado por el movimiento y contacto, y Mezereum alivia el dolor urente ardiente neuropático bajo las costras cutáneas.",
        "indicaciones": ["herpes_zoster", "neuralgia_intercostal", "dolor_neuropatico"],
        "evidencia": "B",
        "fuentes": ["Dermatología Homeopática Jouanny", "Repertorio Boericke"]
    },
    {
        "id": "sin_sambucus_belladonna_obstruccion",
        "ingredienteA": "sambucus_nigra_homeo",
        "ingredienteB": "belladonna",
        "tipo": "sinergia",
        "nivel": "moderada",
        "descripcion": "Manejo coordinado de congestión nasofaríngea aguda febril infantil con espasmos nocturnos y sudoración de rápida aparición.",
        "mecanismo": "Belladonna reduce la congestión vascular cefálica y sequedad febril súbita, y Sambucus destapa la vía aérea nasofaríngea resolviendo el cuadro de asfixia al mamar o dormir.",
        "indicaciones": ["obstruccion_nasal", "laringitis", "tos"],
        "evidencia": "B",
        "fuentes": ["Pediatría Homeopática Boiron", "Materia Médica Boericke"]
    }
]

existing_syn_ids = {s['id'] for s in sinergias['sinergias']}
syn_to_add = [s for r in [new_synergies] for s in r if s['id'] not in existing_syn_ids]

print(f"Adding {len(syn_to_add)} synergies to sinergias_3.json")
sinergias['sinergias'].extend(syn_to_add)

with open(SINERGIAS_PATH, 'w', encoding='utf-8') as f:
    json.dump(sinergias, f, ensure_ascii=False, indent=2)

print("Expansion script completed successfully.")
