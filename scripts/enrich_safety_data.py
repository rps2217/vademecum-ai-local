import json

def enrich_fitoterapia(item):
    name = item['id'].lower()
    desc = (item.get('descripcion', '') + ' ' + ' '.join(item.get('advertencias', []))).lower()
    
    embarazo = 'evitar'
    lactancia = 'evitar'
    pediatria = 'evitar'
    hipertension = 'apto'
    diabetes = 'apto'
    celiacos = 'apto'

    if 'embarazo' in desc or 'contraindicado en embarazo' in desc or 'gestación' in desc:
        embarazo = 'contraindicado'
    if 'lactancia' in desc or 'contraindicado en lactancia' in desc:
        lactancia = 'contraindicado'
    
    safe_herbs = ['manzanilla', 'melisa', 'jengibre', 'menta', 'pasiflora', 'valeriana', 'avena', 'rooibos', 'tila', 'hinojo', 'escaramujo']
    if any(h in name for h in safe_herbs):
        embarazo = 'apto' if name not in ['menta', 'valeriana'] else 'evitar'
        lactancia = 'apto' if name not in ['salvia', 'perejil'] else 'evitar'
        pediatria = 'apto'

    potent_herbs = ['ajenjo', 'tanaceto', 'ruda', 'poleo', 'estramonio', 'belladonna', 'aconito', 'digital', 'efedra', 'grifonia', 'hiperico']
    if any(h in name for h in potent_herbs):
        embarazo = 'contraindicado'
        lactancia = 'contraindicado'
        pediatria = 'contraindicado'

    if 'hipertension' in desc or 'presión arterial' in desc or 'regaliz' in name or 'ginseng' in name:
        hipertension = 'evitar' if 'regaliz' in name else 'apto'

    item['seguridad'] = {
        "embarazo": embarazo,
        "lactancia": lactancia,
        "pediatria": pediatria,
        "hipertension": hipertension,
        "diabetes": diabetes,
        "celiacos": celiacos
    }
    return item

def enrich_homeopatia(item):
    item['seguridad'] = {
        "embarazo": "apto",
        "lactancia": "apto",
        "pediatria": "apto",
        "hipertension": "apto",
        "diabetes": "apto",
        "celiacos": "apto"
    }
    return item

def enrich_aceites(item):
    name = item['id'].lower()
    
    embarazo = 'contraindicado'
    lactancia = 'contraindicado'
    pediatria = 'contraindicado'
    hipertension = 'apto'
    diabetes = 'apto'
    celiacos = 'apto'

    gentle_eos = ['lavanda', 'mandarina', 'naranja', 'camomila', 'tea_tree']
    if any(g in name for g in gentle_eos):
        embarazo = 'evitar'
        lactancia = 'apto'
        pediatria = 'evitar'

    item['seguridad'] = {
        "embarazo": embarazo,
        "lactancia": lactancia,
        "pediatria": pediatria,
        "hipertension": hipertension,
        "diabetes": diabetes,
        "celiacos": celiacos
    }
    return item

def enrich_vitaminas(item):
    name = item['id'].lower()
    
    embarazo = 'apto'
    lactancia = 'apto'
    pediatria = 'apto'
    hipertension = 'apto'
    diabetes = 'apto'
    celiacos = 'apto'

    if 'vitamina_a' in name or 'retinol' in name:
        embarazo = 'evitar'

    item['seguridad'] = {
        "embarazo": embarazo,
        "lactancia": lactancia,
        "pediatria": pediatria,
        "hipertension": hipertension,
        "diabetes": diabetes,
        "celiacos": celiacos
    }
    return item

files_config = [
    ('src/db/seeders/data/fitoterapia.json', enrich_fitoterapia),
    ('src/db/seeders/data/homeopatia.json', enrich_homeopatia),
    ('src/db/seeders/data/aceites.json', enrich_aceites),
    ('src/db/seeders/data/vitaminas_minerales.json', enrich_vitaminas),
]

for filepath, enrich_fn in files_config:
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    items = data.get('ingredientes', [])
    enriched_items = [enrich_fn(item) for item in items]
    data['ingredientes'] = enriched_items

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print(f"Enriched {filepath}: {len(enriched_items)} items.")

print("All safety profiles successfully populated!")
