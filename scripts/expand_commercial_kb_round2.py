import json

def expand_round2():
    fito_path = 'src/db/seeders/data/fitoterapia.json'
    fito_data = json.load(open(fito_path, 'r', encoding='utf-8'))
    fito_items = fito_data['ingredientes']
    fito_ids = {i['id'] for i in fito_items}

    new_fito = [
        {
            "id": "boswellia_serrata",
            "nombre": "Boswellia (Boswellia serrata)",
            "nombresAlternativos": ["Incienso indio", "Boswellia", "Boswellic acids"],
            "nombreCientifico": "Boswellia serrata",
            "familia": "Burseraceae",
            "categoria": "fitoterapia",
            "sistemas": ["musculoesqueletico", "digestivo"],
            "indicaciones": ["artritis", "dolor_articular", "inflamacion", "osteoartritis", "colitis_ulcerosa"],
            "descripcion": "Extracto resinoso rico en ácidos boswélicos, potente antiinflamatorio natural con especial afinidad por el tejido articular y la mucosa intestinal.",
            "mecanismoAccion": "Inhibe de forma específica la enzima 5-lipooxigenasa (5-LOX), bloqueando la síntesis de leucotrienos inflamatorios sin causar los efectos secundarios gástricos típicos de los AINEs.",
            "nivelEvidencia": "A",
            "parteUsada": "resina_goma",
            "formasPresentacion": ["Comprimidos", "Capsulas estandarizadas", "Extracto seco"],
            "tiempoEfecto": "1-2 semanas",
            "duracionTratamiento": "Uso prolongado seguro en patologias cronicas",
            "advertencias": ["Leves molestias gastrointestinales ocasionales"],
            "interaccionesMedicamentosas": ["Antiinflamatorios no esteroideos (AINEs)"],
            "tags": ["articulaciones", "boswellia", "antiinflamatorio", "reuma"],
            "metadata": {"fechaCreacion": "2026-08-30", "fuente": "EMA / ESCOP"},
            "seguridad": {"embarazo": "evitar", "lactancia": "evitar", "pediatria": "evitar", "hipertension": "apto", "diabetes": "apto", "celiacos": "apto"}
        },
        {
            "id": "bromelina",
            "nombre": "Bromelina (Enzima de Piña)",
            "nombresAlternativos": ["Bromelain", "Extracto de piña", "Bromelaína"],
            "categoria": "fitoterapia",
            "sistemas": ["musculoesqueletico", "digestivo"],
            "indicaciones": ["edema", "inflamacion_post_quirurgica", "mala_gestion_proteica", "sinusitis", "contusiones"],
            "descripcion": "Complejo de enzimas proteolíticas extraídas del tallo y fruto de la piña, con probada acción antiinflamatoria, antiedematosa y digestiva.",
            "mecanismoAccion": "Hidroliza proteínas, reduce la formación de kinasas inflamatorias y disminuye la permeabilidad vascular, acelerando la reabsorción de hematomas y edemas.",
            "nivelEvidencia": "A",
            "parteUsada": "tallo_y_fruto",
            "formasPresentacion": ["Capsulas gastrorresistentes", "Comprimidos"],
            "tiempoEfecto": "3-5 dias",
            "duracionTratamiento": "Curas de 2-4 semanas",
            "advertencias": ["Precaucion en pacientes con trastornos de coagulacion"],
            "interaccionesMedicamentosas": ["Anticoagulantes", "Antibioticos (aumenta su absorcion)"],
            "tags": ["bromelina", "enzimas", "edema", "inflamacion"],
            "metadata": {"fechaCreacion": "2026-08-30", "fuente": "Clinical Phytomedicine Review"},
            "seguridad": {"embarazo": "evitar", "lactancia": "evitar", "pediatria": "apto", "hipertension": "apto", "diabetes": "apto", "celiacos": "apto"}
        },
        {
            "id": "pasiflora",
            "nombre": "Pasiflora (Passiflora incarnata)",
            "nombresAlternativos": ["Flor de la pasión", "Passiflora", "Passionflower"],
            "nombreCientifico": "Passiflora incarnata",
            "familia": "Passifloraceae",
            "categoria": "fitoterapia",
            "sistemas": ["nervioso"],
            "indicaciones": ["ansiedad_leve", "insomnio", "nerviosismo", "taquicardia_ansiosa", "estres"],
            "descripcion": "Planta medicinal sedante y ansiolítica utilizada para calmar el sistema nervioso central y facilitar un sueño reparador sin provocar somnolencia residual matutina.",
            "mecanismoAccion": "Potencia la actividad del neurotransmisor GABA (ácido gamma-aminobutírico) en el cerebro, reduciendo la excitabilidad neuronal y relajando la tensión muscular.",
            "nivelEvidencia": "A",
            "parteUsada": "parte_aerea",
            "formasPresentacion": ["Infusion", "Extracto fluido", "Capsulas", "Comprimidos"],
            "tiempoEfecto": "30-60 minutos",
            "duracionTratamiento": "Tratamientos intermitentes o de 4 semanas",
            "advertencias": ["Puede provocar somnolencia leve"],
            "interaccionesMedicamentosas": ["Sedantes", "Alcohol", "Benzodiacepinas"],
            "tags": ["pasiflora", "ansiedad", "calmante", "sueno"],
            "metadata": {"fechaCreacion": "2026-08-30", "fuente": "EMA / HMPC Monographs"},
            "seguridad": {"embarazo": "evitar", "lactancia": "evitar", "pediatria": "apto", "hipertension": "apto", "diabetes": "apto", "celiacos": "apto"}
        },
        {
            "id": "melisa",
            "nombre": "Melisa (Melissa officinalis)",
            "nombresAlternativos": ["Toronjil", "Cidron", "Lemon balm"],
            "nombreCientifico": "Melissa officinalis",
            "familia": "Lamiaceae",
            "categoria": "fitoterapia",
            "sistemas": ["nervioso", "digestivo"],
            "indicaciones": ["dispepsia_nerviosa", "ansiedad", "espasmos_estomacales", "insomnio_leve", "palpitaciones"],
            "descripcion": "Planta aromática con acción calmante sobre el sistema nervioso y el tracto gastrointestinal, excelente para trastornos psicosomáticos digestivos.",
            "mecanismoAccion": "Inhibe la enzima GABA-transaminasa (incrementando GABA cerebral) y posee aceites esenciales con efecto antiespasmódico directo sobre el músculo liso intestinal.",
            "nivelEvidencia": "B",
            "parteUsada": "hoja",
            "formasPresentacion": ["Infusion", "Tintura", "Capsulas"],
            "tiempoEfecto": "30-45 minutos",
            "duracionTratamiento": "Uso libre segun sintomas",
            "advertencias": ["Precaucion en hipotiroidismo (puede inhibir TSH a altas dosis)"],
            "interaccionesMedicamentosas": ["Sedantes", "Hormonas tiroideas"],
            "tags": ["melisa", "toronjil", "estomago", "nervios"],
            "metadata": {"fechaCreacion": "2026-08-30", "fuente": "ESCOP Monographs"},
            "seguridad": {"embarazo": "evitar", "lactancia": "evitar", "pediatria": "apto", "hipertension": "apto", "diabetes": "apto", "celiacos": "apto"}
        }
    ]

    added = 0
    for item in new_fito:
        if item['id'] not in fito_ids:
            fito_items.append(item)
            added += 1

    fito_data['metadata']['total'] = len(fito_items)
    json.dump(fito_data, open(fito_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print(f"Added {added} new round 2 commercial ingredients to fitoterapia.json.")

expand_round2()
