import json

fito = json.load(open('src/db/seeders/data/fitoterapia.json'))['ingredientes']
homeo = json.load(open('src/db/seeders/data/homeopatia.json'))['ingredientes']
aceites = json.load(open('src/db/seeders/data/aceites.json'))['ingredientes']
vit = json.load(open('src/db/seeders/data/vitaminas_minerales.json'))['ingredientes']

all_ingredients = {i['id']: i for i in fito + homeo + aceites + vit}

sin1 = json.load(open('src/db/seeders/data/sinergias_1.json'))['sinergias']
sin2 = json.load(open('src/db/seeders/data/sinergias_2.json'))['sinergias']
existing_sin = sin1 + sin2
existing_sin_ids = {s['id'] for s in existing_sin}

new_synergies = []

def add_s(id_a, id_b, tipo, nivel, desc, beneficios, precauciones, mecanismo, sistemas, custom_id=None):
    if id_a not in all_ingredients:
        print(f"ERROR: Missing ID A: {id_a}")
        return
    if id_b not in all_ingredients:
        print(f"ERROR: Missing ID B: {id_b}")
        return
    syn_id = custom_id or f"sin_{id_a}_{id_b}"
    if syn_id in existing_sin_ids:
        print(f"SKIP existing syn: {syn_id}")
        return
    
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

print("Builder initialized successfully.")
