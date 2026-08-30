import json

def add_synergies():
    sin3_path = 'src/db/seeders/data/sinergias_3.json'
    sin3_data = json.load(open(sin3_path, 'r', encoding='utf-8'))
    sin_list = sin3_data['sinergias']
    existing_ids = {s['id'] for s in sin_list}

    new_synergies = [
        {
            "id": "sin_serenoa_urtica",
            "ingredienteA": "serenoa_repens",
            "ingredienteB": "ortiga",
            "tipo": "sinergia",
            "nivelEvidencia": "A",
            "descripcion": "Combinación clásica de Saw Palmetto y Raíz de Ortiga para el manejo de la Hiperplasia Prostática Benigna (HPB).",
            "beneficios": ["Reduce síntomas urinarios HPB", "Disminuye inflamación prostática", "Mejora flujo urinario"],
            "precauciones": ["Consultar con urólogo para descartar patología grave"],
            "mecanismo": "Saw Palmetto inhibe 5-alfa-reductasa; la Ortiga inhibe la unión de SHBG a receptores prostáticos. Sinergia urológica complementaria.",
            "categorias": ["fitoterapia", "fitoterapia"],
            "sistemas": ["urinario", "endocrino"]
        },
        {
            "id": "sin_rhodiola_ashwagandha",
            "ingredienteA": "rhodiola_rosea",
            "ingredienteB": "ashwagandha",
            "tipo": "potenciador",
            "nivelEvidencia": "A",
            "descripcion": "Dúo adaptógeno sinérgico: Rhodiola (estimulante/energética) + Ashwagandha (calmante/reguladora del cortisol).",
            "beneficios": ["Equilibrio del estrés", "Energía mental sin nerviosismo", "Resistencia a la fatiga crónica"],
            "precauciones": ["Evitar en trastornos bipolares"],
            "mecanismo": "Rhodiola optimiza monoaminas y ATP mitocondrial; Ashwagandha reduce niveles elevados de cortisol e inhibe respuesta neuroendocrina al estrés.",
            "categorias": ["fitoterapia", "fitoterapia"],
            "sistemas": ["nervioso", "endocrino"]
        },
        {
            "id": "sin_magnesio_melatonina",
            "ingredienteA": "magnesio_bisglicinato",
            "ingredienteB": "melatonina",
            "tipo": "complementario",
            "nivelEvidencia": "A",
            "descripcion": "Sinergia para el descanso profundo: Magnesio Bisglicinato (relajación neuromuscular) + Melatonina (inducción del sueño).",
            "beneficios": ["Inducción rápida del sueño", "Relajación muscular nocturna", "Mejora calidad del descanso"],
            "precauciones": ["Evitar conducir u operar maquinaria tras la toma"],
            "mecanismo": "El magnesio relaja el sistema nervioso central vía receptores NMDA y GABA; la melatonina sincroniza el ritmo circadiano en el núcleo supraquiasmático.",
            "categorias": ["vitaminas_minerales", "fitoterapia"],
            "sistemas": ["nervioso"]
        },
        {
            "id": "sin_ala_cromo",
            "ingredienteA": "acido_alfa_lipoico",
            "ingredienteB": "cromo",
            "tipo": "potenciador",
            "nivelEvidencia": "A",
            "descripcion": "Complejo metabólico sinérgico para la sensibilidad a la insulina y el metabolismo de la glucosa.",
            "beneficios": ["Regulación glucémica", "Disminución de antojos de azúcar", "Optimización energética mitocondrial"],
            "precauciones": ["Monitorear glucemia en pacientes medicados con hipoglucemiantes"],
            "mecanismo": "El ácido alfa lipoico estimula la translocación de GLUT4; el cromo potencia la afinidad del receptor de insulina. Sinergia metabólica bidireccional.",
            "categorias": ["vitaminas_minerales", "vitaminas_minerales"],
            "sistemas": ["metabolico", "cardiovascular"]
        },
        {
            "id": "sin_echinacea_propolis",
            "ingredienteA": "echinacea_purpurea",
            "ingredienteB": "propolis",
            "tipo": "sinergia",
            "nivelEvidencia": "B",
            "descripcion": "Fórmula inmuno-respiratoria de primera línea para prevención y tratamiento de infecciones de vías altas.",
            "beneficios": ["Defensas reforzadas", "Alivio rápido de dolor de garganta", "Acción antiviral y antibacteriana local"],
            "precauciones": ["Evitar en alergia a productos apícolas o asteráceas"],
            "mecanismo": "Equinácea estimula la inmunidad sistémica (células NK y fagocitosis); el propóleo actúa como antiséptico y barrera antimicrobiana directa en mucosa faríngea.",
            "categorias": ["fitoterapia", "fitoterapia"],
            "sistemas": ["inmune", "respiratorio"]
        },
        {
            "id": "sin_castano_vid_roja",
            "ingredienteA": "castano_de_indias",
            "ingredienteB": "vid_roja",
            "tipo": "complementario",
            "nivelEvidencia": "A",
            "descripcion": "Sinergia vascular para insuficiencia venosa crónica, piernas cansadas y varices.",
            "beneficios": ["Tonificación venosa", "Reducción de edema y pesadez en piernas", "Protección capilar"],
            "precauciones": ["Precaución al combinar con anticoagulantes orales"],
            "mecanismo": "La escina del castaño de indias reduce la permeabilidad capilar; los polifenoles y antocianósidos de la vid roja protegen el endotelio vascular y mejoran la microcirculación.",
            "categorias": ["fitoterapia", "fitoterapia"],
            "sistemas": ["cardiovascular", "dermatologico"]
        }
    ]

    added = 0
    for syn in new_synergies:
        if syn['id'] not in existing_ids:
            sin_list.append(syn)
            existing_ids.add(syn['id'])
            added += 1

    json.dump(sin3_data, open(sin3_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print(f"Added {added} new commercial synergies to sinergias_3.json.")

add_synergies()
print("Commercial synergies integration completed successfully!")
