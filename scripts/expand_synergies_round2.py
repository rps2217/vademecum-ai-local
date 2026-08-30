import json

def add_synergies():
    syn_path = 'src/db/seeders/data/sinergias.json'
    syn_data = json.load(open(syn_path, 'r', encoding='utf-8'))
    syn_items = syn_data['sinergias']
    syn_ids = {s['id'] for s in syn_items}

    new_syns = [
        {
            "id": "syn_boswellia_curcumina",
            "ingredienteA": "boswellia_serrata",
            "ingredienteB": "curcumina",
            "tipo": "sinergia",
            "nivel": "potenciadora",
            "descripcion": "Combinación sinérgica de potentes antiinflamatorios naturales (5-LOX y COX-2) para máxima protección y confort articular.",
            "mecanismo": "Bloqueo dual de las vías del ácido araquidónico (leucotrienos vía boswellia y prostaglandinas vía cúrcuma).",
            "advertenciaClinica": "Precaución en pacientes con terapia anticoagulante.",
            "evidencia": "A"
        },
        {
            "id": "syn_pasiflora_melisa",
            "ingredienteA": "pasiflora",
            "ingredienteB": "melisa",
            "tipo": "sinergia",
            "nivel": "potenciadora",
            "descripcion": "Fórmula calmante ideal para la ansiedad diurna y trastornos psicosomáticos digestivos.",
            "mecanismo": "Acción combinada moduladora del GABA y relajante del músculo liso gastrointestinal.",
            "advertenciaClinica": "Puede potenciar efectos de sedantes.",
            "evidencia": "A"
        },
        {
            "id": "syn_bromelina_boswellia",
            "ingredienteA": "bromelina",
            "ingredienteB": "boswellia_serrata",
            "tipo": "sinergia",
            "nivel": "potenciadora",
            "descripcion": "Sinergia antiinflamatoria y antiedematosa para procesos agudos y crónicos del aparato locomotor.",
            "mecanismo": "La bromelina mejora la biodisponibilidad y llegada tisular de los ácidos boswélicos a las articulaciones inflamadas.",
            "advertenciaClinica": "Precaución con anticoagulantes.",
            "evidencia": "B"
        }
    ]

    added = 0
    for s in new_syns:
        if s['id'] not in syn_ids:
            syn_items.append(s)
            added += 1

    syn_data['metadata']['total'] = len(syn_items)
    json.dump(syn_data, open(syn_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print(f"Added {added} new synergies. Total synergies: {len(syn_items)}")

add_synergies()
