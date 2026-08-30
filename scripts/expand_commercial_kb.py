import json

def expand_kb():
    fito_path = 'src/db/seeders/data/fitoterapia.json'
    fito_data = json.load(open(fito_path, 'r', encoding='utf-8'))
    fito_items = fito_data['ingredientes']
    fito_ids = {i['id'] for i in fito_items}

    new_fito = [
        {
            "id": "serenoa_repens",
            "nombre": "Serenoa Repens (Saw Palmetto)",
            "nombresAlternativos": ["Saw Palmetto", "Serenoa serrulata", "Palma enana americana"],
            "nombreCientifico": "Serenoa repens",
            "familia": "Arecaceae",
            "categoria": "fitoterapia",
            "sistemas": ["urinario", "endocrino"],
            "indicaciones": ["hiperplasia_prostatica_benigna", "problemas_urinarios", "caida_cabello", "disuria"],
            "descripcion": "Extracto lipoesterólico de los frutos de Saw Palmetto, ampliamente utilizado en salud prostática y control de la alopecia androgénica.",
            "mecanismoAccion": "Inhibe la enzima 5-alfa-reductasa (tipos I y II) y bloquea los receptores de dihidrotestosterona (DHT), reduciendo la inflamación prostática.",
            "nivelEvidencia": "A",
            "parteUsada": "fruto",
            "formasPresentacion": ["Capsulas", "Extracto liquido", "Perlas"],
            "tiempoEfecto": "4-8 semanas",
            "duracionTratamiento": "Uso continuo bajo supervision",
            "advertencias": ["Puede causar leves molestias gastrointestinales", "Consultar con urologo antes de iniciar"],
            "interaccionesMedicamentosas": ["Anticonceptivos hormonales", "Anticoagulantes"],
            "tags": ["prostata", "saw_palmetto", "alopecia", "urologia"],
            "metadata": {"fechaCreacion": "2026-08-30", "fuente": "EMA / ESCOP Monographs"},
            "seguridad": {"embarazo": "contraindicado", "lactancia": "contraindicado", "pediatria": "contraindicado", "hipertension": "apto", "diabetes": "apto", "celiacos": "apto"}
        },
        {
            "id": "rhodiola_rosea",
            "nombre": "Rhodiola Rosea",
            "nombresAlternativos": ["Raíz de oro", "Rhodiola", "Arctic root"],
            "nombreCientifico": "Rhodiola rosea",
            "familia": "Crassulaceae",
            "categoria": "fitoterapia",
            "sistemas": ["nervioso", "endocrino"],
            "indicaciones": ["estres_adaptogeno", "fatiga_mental", "agotamiento", "ansiedad", "rendimiento_cognitivo"],
            "descripcion": "Adaptógeno potente que mejora la resistencia física y mental frente al estrés y la fatiga crónica.",
            "mecanismoAccion": "Modula los niveles de neurotransmisores (serotonina, dopamina, noradrenalina) y el eje HPA (hipotálamo-hipófisis-adrenal), optimizando la producción de ATP celular.",
            "nivelEvidencia": "A",
            "parteUsada": "raiz",
            "formasPresentacion": ["Extracto estandarizado", "Capsulas", "Comprimidos"],
            "tiempoEfecto": "1-2 semanas",
            "duracionTratamiento": "6-8 semanas con descansos",
            "advertencias": ["Evitar en trastornos bipolares por posible estimulacion", "Tomar preferentemente por la manana"],
            "interaccionesMedicamentosas": ["Antidepresivos IMAO", "Estimulantes"],
            "tags": ["adaptogeno", "fatiga", "estres", "energia"],
            "metadata": {"fechaCreacion": "2026-08-30", "fuente": "EMA / HMPC"},
            "seguridad": {"embarazo": "evitar", "lactancia": "evitar", "pediatria": "evitar", "hipertension": "apto", "diabetes": "apto", "celiacos": "apto"}
        },
        {
            "id": "echinacea_purpurea",
            "nombre": "Equinácea (Echinacea purpurea)",
            "nombresAlternativos": ["Echinacea", "Equinacea purpurea", "Purple coneflower"],
            "nombreCientifico": "Echinacea purpurea",
            "familia": "Asteraceae",
            "categoria": "fitoterapia",
            "sistemas": ["inmune", "respiratorio"],
            "indicaciones": ["infecciones_respiratorias", "defensas", "resfriado", "gripe", "prevencion_infecciones"],
            "descripcion": "Estimulante inmunitario tradicional utilizado para la prevención y el tratamiento sintomático de resfriados comunes y afecciones de las vías respiratorias altas.",
            "mecanismoAccion": "Estimula la fagocitosis, la actividad de las células NK (natural killer) y la liberación de citoquinas proinflamatorias reguladas, incrementando la respuesta inmune innata.",
            "nivelEvidencia": "A",
            "parteUsada": "raiz_y_parte_aerea",
            "formasPresentacion": ["Comprimidos", "Jarabe", "Tintura", "Capsulas"],
            "tiempoEfecto": "Inmediato (al inicio de sintomas)",
            "duracionTratamiento": "Maximo 8 semanas continuas",
            "advertencias": ["Precaucion en enfermedades autoinmunes", "Evitar alergicos a asteraceas"],
            "interaccionesMedicamentosas": ["Inmunosupresores"],
            "tags": ["inmunidad", "resfriado", "equinacea", "defensas"],
            "metadata": {"fechaCreacion": "2026-08-30", "fuente": "ESCOP / EMA"},
            "seguridad": {"embarazo": "evitar", "lactancia": "evitar", "pediatria": "apto", "hipertension": "apto", "diabetes": "apto", "celiacos": "apto"}
        },
        {
            "id": "propolis",
            "nombre": "Propóleo (Propolis)",
            "nombresAlternativos": ["Propolis", "Própolis", "Balsamo de abejas"],
            "nombreCientifico": "Propolis",
            "familia": "Apidae",
            "categoria": "fitoterapia",
            "sistemas": ["inmune", "respiratorio", "dermatologico"],
            "indicaciones": ["infecciones_garganta", "defensas", "cicatrizacion", "faringitis", "antiseptico_bucal"],
            "descripcion": "Sustancia resinosa elaborada por las abejas con potentes propiedades antibacterianas, antivirales, antifúngicas y antiinflamatorias.",
            "mecanismoAccion": "Los flavonoides y ácidos fenólicos inhiben el crecimiento bacteriano y viral, alterando la membrana celular microbiana y estimulando la epitelización.",
            "nivelEvidencia": "B",
            "parteUsada": "resina",
            "formasPresentacion": ["Spray bucal", "Jarabe", "Comprimidos para chupar", "Gotas"],
            "tiempoEfecto": "1-3 dias",
            "duracionTratamiento": "Curas de 2-3 semanas",
            "advertencias": ["Contraindicado en alergia a productos apicolas o picadura de abeja"],
            "interaccionesMedicamentosas": ["Anticoagulantes (a altas dosis)"],
            "tags": ["propolis", "garganta", "antibiotico_natural", "inmunidad"],
            "metadata": {"fechaCreacion": "2026-08-30", "fuente": "Farmacopea Europea"},
            "seguridad": {"embarazo": "apto", "lactancia": "apto", "pediatria": "apto", "hipertension": "apto", "diabetes": "apto", "celiacos": "apto"}
        },
        {
            "id": "castano_de_indias",
            "nombre": "Castaño de Indias",
            "nombresAlternativos": ["Aesculus hippocastanum", "Horse chestnut", "Castaño indio"],
            "nombreCientifico": "Aesculus hippocastanum",
            "familia": "Sapindaceae",
            "categoria": "fitoterapia",
            "sistemas": ["cardiovascular", "dermatologico"],
            "indicaciones": ["insuficiencia_venosa", "varices", "hemorroides", "piernas_cansadas", "edema"],
            "descripcion": "Extracto rico en escina, empleado tradicionalmente para mejorar el tono vascular, reducir la permeabilidad capilar y aliviar los síntomas de insuficiencia venosa crónica.",
            "mecanismoAccion": "La escina inhibe las enzimas lisosomales (hialuronidasa y elastasa), protegiendo las fibras de colágeno vascular y aumentando la contracción de las venas.",
            "nivelEvidencia": "A",
            "parteUsada": "semilla",
            "formasPresentacion": ["Capsulas", "Comprimidos de liberacion prolongada", "Gel topico"],
            "tiempoEfecto": "2-4 semanas",
            "duracionTratamiento": "Uso prolongado bajo control",
            "advertencias": ["Puede causar molestias gastricas leves", "No aplicar sobre heridas abiertas en uso topico"],
            "interaccionesMedicamentosas": ["Anticoagulantes", "Antiagregantes plaquetarios"],
            "tags": ["circulacion", "varices", "venas", "escina"],
            "metadata": {"fechaCreacion": "2026-08-30", "fuente": "EMA / ESCOP"},
            "seguridad": {"embarazo": "evitar", "lactancia": "evitar", "pediatria": "contraindicado", "hipertension": "apto", "diabetes": "apto", "celiacos": "apto"}
        }
    ]

    added_fito = 0
    for item in new_fito:
        if item['id'] not in fito_ids:
            fito_items.append(item)
            added_fito += 1

    json.dump(fito_data, open(fito_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print(f"Added {added_fito} new commercial fitotherapy ingredients.")

    vit_path = 'src/db/seeders/data/vitaminas_minerales.json'
    vit_data = json.load(open(vit_path, 'r', encoding='utf-8'))
    vit_items = vit_data['ingredientes']
    vit_ids = {i['id'] for i in vit_items}

    new_vit = [
        {
            "id": "acido_alfa_lipoico",
            "nombre": "Ácido Alfa Lipoico (ALA)",
            "nombresAlternativos": ["ALA", "Thiotic acid", "Ácido tióctico"],
            "categoria": "vitaminas_minerales",
            "sistemas": ["metabolico", "nervioso", "cardiovascular"],
            "indicaciones": ["neuropatia_diabetica", "antioxidante_potente", "metabolismo_glucosa", "resistencia_insulina"],
            "descripcion": "Antioxidante universal altamente versátil soluble tanto en agua como en grasa, esencial para la producción de energía mitocondrial y la protección nerviosa.",
            "mecanismoAccion": "Actúa como cofactor enzimático en el ciclo de Krebs, regenera otros antioxidantes (Vitamina C, E, glutatión) y mejora la captación de glucosa mediada por insulina.",
            "nivelEvidencia": "A",
            "formasPresentacion": ["Capsulas", "Comprimidos"],
            "tiempoEfecto": "2-4 semanas",
            "duracionTratamiento": "Continuo en neuropatia o resistencia insulinica",
            "advertencias": ["Puede reducir la glucemia, monitorizar en diabeticos medicados"],
            "interaccionesMedicamentosas": ["Insulina", "Hipoglucemiantes orales", "Antiácidos"],
            "tags": ["ala", "antioxidante", "metabolismo", "neuropatia"],
            "metadata": {"fechaCreacion": "2026-08-30", "fuente": "Clinical Nutrition Reviews"},
            "seguridad": {"embarazo": "evitar", "lactancia": "evitar", "pediatria": "evitar", "hipertension": "apto", "diabetes": "apto", "celiacos": "apto"}
        },
        {
            "id": "magnesio_bisglicinato",
            "nombre": "Magnesio Bisglicinato Quelado",
            "nombresAlternativos": ["Bisglicinato de magnesio", "Magnesio quelado", "Magnesium bisglycinate"],
            "categoria": "vitaminas_minerales",
            "sistemas": ["nervioso", "musculoesqueletico", "metabolico"],
            "indicaciones": ["relajacion_muscular", "insomnio", "estres", "calambres", "fatiga_cronica", "ansiedad"],
            "descripcion": "Forma de magnesio unida a dos moléculas de glicina, ofreciendo máxima biodisponibilidad y excelente tolerancia digestiva sin efecto laxante adverso.",
            "mecanismoAccion": "La glicina actúa como neurotransmisor inhibitorio sinérgico, mientras que el ion magnesio relaja la fibra muscular y modula los receptores NMDA cerebrales.",
            "nivelEvidencia": "A",
            "formasPresentacion": ["Polvo soluble", "Capsulas", "Comprimidos"],
            "tiempoEfecto": "Inmediato a 7 dias",
            "duracionTratamiento": "Uso diario continuado",
            "advertencias": ["Precaucion en insuficiencia renal severa"],
            "interaccionesMedicamentosas": ["Tetraciclinas", "Bifosfonatos"],
            "tags": ["magnesio", "relajacion", "sueño", "bisglicinato"],
            "metadata": {"fechaCreacion": "2026-08-30", "fuente": "EFSA Scientific Opinion"},
            "seguridad": {"embarazo": "apto", "lactancia": "apto", "pediatria": "apto", "hipertension": "apto", "diabetes": "apto", "celiacos": "apto"}
        }
    ]

    added_vit = 0
    for item in new_vit:
        if item['id'] not in vit_ids:
            vit_items.append(item)
            added_vit += 1

    json.dump(vit_data, open(vit_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print(f"Added {added_vit} new commercial vitamin/mineral ingredients.")

expand_kb()
print("Commercial KB expansion completed successfully!")
