import json

# Load existing ingredients
fito = json.load(open('src/db/seeders/data/fitoterapia.json'))['ingredientes']
homeo = json.load(open('src/db/seeders/data/homeopatia.json'))['ingredientes']
aceites = json.load(open('src/db/seeders/data/aceites.json'))['ingredientes']
vit = json.load(open('src/db/seeders/data/vitaminas_minerales.json'))['ingredientes']

all_ingredients = {i['id']: i for i in fito + homeo + aceites + vit}

# Load existing synergies
sin1 = json.load(open('src/db/seeders/data/sinergias_1.json'))['sinergias']
sin2 = json.load(open('src/db/seeders/data/sinergias_2.json'))['sinergias']
existing_sin = sin1 + sin2
existing_sin_ids = {s['id'] for s in existing_sin}

print(f"Loaded {len(all_ingredients)} ingredients and {len(existing_sin)} existing synergies.")

new_synergies = []

def add_syn(id_a, id_b, tipo, nivel, desc, beneficios, precauciones, mecanismo, sistemas, custom_id=None):
    assert id_a in all_ingredients, f"Invalid ingredient A: {id_a}"
    assert id_b in all_ingredients, f"Invalid ingredient B: {id_b}"
    syn_id = custom_id or f"sin_{id_a}_{id_b}"
    assert syn_id not in existing_sin_ids, f"Duplicate synergy id: {syn_id}"
    
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
    new_synergies.append(entry)
    existing_sin_ids.add(syn_id)

