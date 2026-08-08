# KB Data Methodology — Vademecum AI

> **Propósito:** Este documento describe la metodología completa para
> ampliar y mantener la base de conocimiento (KB) de Vademecum AI.
> Cualquier agente de IA o desarrollador debe seguir este patrón para
> garantizar consistencia, calidad científica e integridad de datos.

## 1. Estructura de Archivos

```
src/db/seeders/data/
├── fitoterapia.json          # Plantas medicinales y hongos (114)
├── homeopatia.json           # Remedios homeopáticos y sales Schüssler (69)
├── aceites.json              # Aceites esenciales (44)
├── vitaminas_minerales.json  # Vitaminas, minerales, aminoácidos, compuestos (87)
└── sinergias.json            # Relaciones entre ingredientes (414)
```

**Total:** 314 ingredientes únicos + 414 sinergias.

## 2. Schema de Ingrediente

Cada ingrediente es un objeto JSON con estos campos:

```json
{
  "id": "valeriana",                    // UNIQUE, snake_case, sin acentos
  "nombre": "Valeriana",                // Nombre común en español
  "nombresAlternativos": [              // Sinónimos, nombre científico, inglés
    "Valeriana officinalis",
    "Valerian",
    "Raíz de valeriana"
  ],
  "nombreCientifico": "Valeriana officinalis",
  "familia": "Caprifoliaceae",          // Familia botológica o categoría
  "categoria": "fitoterapia",           // Ver § 3 Categorías
  "sistemas": ["nervioso"],             // Ver § 4 Sistemas Corporales
  "indicaciones": ["insomnio", "ansiedad", "estrés"],  // Ver § 5 Etiquetas
  "descripcion": "Planta sedante...",   // Descripción clínica 1-3 frases
  "mecanismoAccion": "Modula GABA-A...",// Mecanismo bioquímico
  "nivelEvidencia": "B",               // A/B/C/D (ver § 6)
  "parteUsada": "raiz",
  "formasPresentacion": ["Cápsulas", "Tintura", "Infusión"],
  "tiempoEfecto": "30-60 minutos",
  "duracionTratamiento": "2-4 semanas",
  "advertencias": ["Somnolencia", "No combinar con benzodiacepinas"],
  "interaccionesMedicamentosas": ["Benzodiacepinas", "Alcohol"],
  "tags": ["sedante", "ansiolitico", "sueño"],
  "metadata": {
    "fechaCreacion": "2024-01-01",
    "fuente": "EMA HMPC monograph + WHO Monographs"
  }
}
```

## 3. Categorías (`categoria`)

Definidas en `src/types/shared-enums.ts` → `INGREDIENT_CATEGORIES`:

| Categoría | Descripción |
|-----------|-------------|
| `fitoterapia` | Plantas medicinales, hongos, resinas |
| `homeopatia` | Remedios homeopáticos, nosodos, sales de Schüssler |
| `aceite_esencial` | Aceites esenciales (aromaterapia) |
| `vitamina` | Vitaminas y compuestos bioactivos |
| `mineral` | Minerales y oligoelementos |
| `aminoacido` | Aminoácidos y derivados |
| `probiotico` | Probióticos, prebióticos, postbióticos |

**Nota:** El archivo `vitaminas_minerales.json` agrupa vitaminas,
minerales, aminoácidos y probióticos. El campo `categoria` de cada
ingrediente indica su tipo real.

## 4. Sistemas Corporales (`sistemas`)

Definidos en `src/types/shared-enums.ts` → `BODY_SYSTEMS`.
**SOLO se permiten estos 13 valores** (normalizado en ronda 12):

| Sistema | Descripción |
|---------|-------------|
| `nervioso` | SNC, ansiedad, sueño, cognitivo, humor |
| `digestivo` | Digestión, boca, intestino, hígado |
| `inmune` | Inmunidad, infecciones, antiviral |
| `cardiovascular` | Corazón, vasos, presión arterial |
| `respiratorio` | Vías respiratorias, tos, asma |
| `musculoesqueletico` | Articulaciones, músculos, huesos |
| `endocrino` | Hormonas, tiroides, menopausia |
| `dermatologico` | Piel, cicatrización, cabello |
| `urinario` | Vejiga, vías urinarias, riñón |
| `reproductivo` | Fertilidad, libido, próstata |
| `ocular` | Ojos, mácula, retina |
| `hepatico` | Hígado, detox, bilis |
| `metabolico` | Glucosa, lípidos, energía, mitocondrias |

## 5. Indicaciones Estandarizadas (`indicaciones`)

Normalizadas en ronda 13 (861 correcciones). Las indicaciones deben
usar etiquetas estandarizadas para habilitar el **filtro por patología**.

**Top 30 etiquetas** (por frecuencia en la KB):

```
ansiedad(48)  inmunidad(45)  estrés(41)     dispepsia(40)
tos(40)       insomnio(37)   articular(35)  antioxidante(31)
piel(29)      cognitivo(27)  energía(26)    fatiga(26)
cicatrización(25) hepático(23) cardiovascular(21) muscular(21)
inflamación(20) gripe(19)    colesterol(19) respiratorio(19)
glucosa(18)   gases(16)      depresión(15)  menopausia(15)
dolor(13)     rendimiento(13) migraña(13)   intestinal(12)
urinario(12)  eccema(12)
```

**Reglas para nuevas indicaciones:**
- Usar minúsculas, sin acentos especiales
- Una palabra o frase corta (ej: "ansiedad", no "trastorno de ansiedad generalizada")
- Si la indicación no existe, usar la etiqueta más cercana
- Un ingrediente puede tener múltiples indicaciones

## 6. Niveles de Evidencia (`nivelEvidencia`)

| Nivel | Significado | Criterio |
|-------|-------------|----------|
| `A` | Evidencia fuerte | Meta-análisis, ensayos clínicos RCT, guías clínicas, farmacopea oficial |
| `B` | Evidencia moderada | Ensayos clínicos individuales, estudios controlados |
| `C` | Evidencia limitada | Uso tradicional, estudios preclínicos, EMA HMPC uso tradicional |
| `D` | Evidencia teórica | Mecanismo plausible sin estudios |

## 7. Schema de Sinergia

```json
{
  "id": "sin_valeriana_pasiflora",      // UNIQUE, prefijo sin_
  "ingredienteA": "valeriana",           // ID de ingrediente existente
  "ingredienteB": "pasiflora",           // ID de ingrediente existente
  "tipo": "potenciador",                 // Ver § 8
  "nivelEvidencia": "A",
  "descripcion": "Combinación clásica para insomnio...",
  "beneficios": ["Mayor eficacia sedante", "Reduce latencia"],
  "precauciones": ["Somnolencia matutina"],
  "mecanismo": "Ambas modulan GABA-A...",
  "categorias": ["fitoterapia", "fitoterapia"],  // Auto-calculado
  "sistemas": ["nervioso"]
}
```

## 8. Tipos de Sinergia (`tipo`)

| Tipo | Descripción |
|------|-------------|
| `potenciador` | Un ingrediente amplifica el efecto del otro |
| `complementario` | Vías de acción complementarias, efecto conjunto |
| `cofactor` | Uno es cofactor bioquímico del otro |
| `sinergia` | Efecto conjunto mayor que la suma (general) |
| `complemento` | Acción de soporte general |
| `antagonismo` | Se oponen (usar con precaución) |
| `interaccion` | Interacción farmacológica relevante |

## 9. Fuentes Científicas Oficiales

**OBLIGATORIO:** Cada ingrediente debe indicar su fuente en
`metadata.fuente`. Fuentes aceptadas (por orden de preferencia):

### Fitoterapia
1. **EMA HMPC** (European Medicines Agency, Herbal Medicinal Products Committee)
2. **WHO Monographs** (World Health Organization)
3. **ESCOP Monographs** (European Scientific Cooperative on Phytotherapy)
4. **German Commission E** (German regulatory monographs)
5. **European Pharmacopoeia**
6. **Clinical trials** (PubMed/PMC meta-análisis)
7. **Ayurvedic Pharmacopoeia** (para plantas ayurvédicas)
8. **TCM Pharmacopoeia** (para plantas chinas)

### Homeopatía
1. **Materias Médicas**: Boericke, Clarke, Kent, Allen, Nash
2. **Schüssler** (para sales tisulares)
3. **Repertorio homeopático** (sintomas y modalidades)

### Vitaminas/Compuestos
1. **EFSA** (European Food Safety Authority) health claims
2. **Clinical trials** (PubMed meta-análisis)
3. **AREDS2** (ocular), **GAIT** (articular), **ONTRAC** (piel)
4. **WHO EML** (Essential Medicines List)
5. **Dietary Reference Intakes** (IOM)

### Aceites Esenciales
1. **EMA HMPC** (donde aplique)
2. **Aromaterapia clínica** (Tisserand, Franchomme)
3. **ISO standards** (quimiotipos)
4. **Estudios farmacológicos** (NF, PubMed)

## 10. Metodología de Expansión (Paso a Paso)

### Fase 1: Planificación
1. Analizar gaps actuales: ingredientes huérfanos (sin sinergias),
   sistemas corporales poco cubiertos, categorías desbalanceadas
2. Identificar ingredientes nuevos con evidencia científica
3. Planificar sinergias que conecten ingredientes nuevos y existentes

### Fase 2: Crear Script Python de Expansión
Crear un script temporal `expand_kbXX.py`:

```python
#!/usr/bin/env python3
import json

DATA = "src/db/seeders/data"

def load(p): return json.load(open(p))
def save(p, d):
    json.dump(d, open(p, "w"), ensure_ascii=False, indent=2)
    open(p, "a").write("\n")

# Definir ingredientes nuevos (siguiendo el schema § 2)
fito_new = [
    {
        "id": "nuevo_ingrediente",
        "nombre": "...",
        # ... todos los campos del schema
    },
]

def apply_ingredients(file, new_entries):
    d = load(f"{DATA}/{file}.json")
    existing_ids = {i["id"] for i in d["ingredientes"]}
    added = 0
    for entry in new_entries:
        if entry["id"] in existing_ids:
            print(f"  SKIP duplicate {entry['id']}")
            continue
        d["ingredientes"].append(entry)
        added += 1
    d["metadata"]["ultimaActualizacion"] = "2026-XX-XX"
    d["metadata"]["total"] = len(d["ingredientes"])
    save(f"{DATA}/{file}.json", d)
    print(f"{file}.json: +{added} (total {len(d['ingredientes'])})")

apply_ingredients("fitoterapia", fito_new)
```

### Fase 3: Crear Script de Sinergias
Crear `expand_sinergiasXX.py`:

```python
def get_all_ids():
    ids = set()
    for f in ["fitoterapia", "homeopatia", "aceites", "vitaminas_minerales"]:
        d = load(f"{DATA}/{f}.json")
        for i in d["ingredientes"]:
            ids.add(i["id"])
    return ids

def get_id_category():
    m = {}
    for f in ["fitoterapia", "homeopatia", "aceites", "vitaminas_minerales"]:
        d = load(f"{DATA}/{f}.json")
        for i in d["ingredientes"]:
            m[i["id"]] = i["categoria"]
    return m

sinergias_new = [
    {
        "id": "sin_...",
        "ingredienteA": "id_existente",
        "ingredienteB": "id_existente",
        "tipo": "complementario",
        # ... campos del schema § 7
    },
]

# VALIDACIÓN OBLIGATORIA:
all_ids = get_all_ids()
cat_map = get_id_category()
d = load(f"{DATA}/sinergias.json")
existing_ids = {s["id"] for s in d["sinergias"]}

for s in sinergias_new:
    assert s["id"] not in existing_ids, f"Duplicate synergy ID: {s['id']}"
    assert s["ingredienteA"] in all_ids, f"MISSING A: {s['ingredienteA']}"
    assert s["ingredienteB"] in all_ids, f"MISSING B: {s['ingredienteB']}"
    s["categorias"] = [cat_map[s["ingredienteA"]], cat_map[s["ingredienteB"]]]
    d["sinergias"].append(s)

d["metadata"]["total"] = len(d["sinergias"])
save(f"{DATA}/sinergias.json", d)
```

### Fase 4: Validación
Ejecutar SIEMPRE estos 4 checks antes de commitear:

```bash
# 1. JSON válido
for f in fitoterapia homeopatia aceites vitaminas_minerales sinergias; do
  python3 -c "import json; json.load(open('src/db/seeders/data/$f.json')); print('$f.json: OK')"
done

# 2. Typecheck (debe mantener errores preexistentes, 0 nuevos)
npx tsc --noEmit 2>&1 | grep -c "error TS"

# 3. Build
npm run build

# 4. Validación de integridad
python3 -c "
import json
from collections import Counter
# IDs únicos
all_ids = set()
for f in ['fitoterapia','homeopatia','aceites','vitaminas_minerales']:
    d=json.load(open(f'src/db/seeders/data/{f}.json'))
    for i in d['ingredientes']:
        all_ids.add(i['id'])
# Sinergias válidas
d=json.load(open('src/db/seeders/data/sinergias.json'))
syn_ids = [s['id'] for s in d['sinergias']]
dupes = [k for k,v in Counter(syn_ids).items() if v>1]
orphans = [iid for iid in all_ids if iid not in
    {s['ingredienteA'] for s in d['sinergias']} | {s['ingredienteB'] for s in d['sinergias']}]
missing = [s['id'] for s in d['sinergias']
           if s['ingredienteA'] not in all_ids or s['ingredienteB'] not in all_ids]
print(f'IDs únicos: {len(all_ids)}')
print(f'Sinergias: {len(syn_ids)}')
print(f'Duplicados: {dupes if dupes else \"NINGUNO\"}')
print(f'Huérfanos: {len(orphans)}')
print(f'Referencias inválidas: {missing if missing else \"NINGUNA\"}')
"
```

### Fase 5: Limpieza y Commit
```bash
# Eliminar scripts temporales
rm -f expand_kbXX.py expand_sinergiasXX.py

# Commit con mensaje detallado
git add -A
git commit -m "feat(kb): ampliar KB con N ingredientes y M sinergias (XXª ronda)
...
KB version: vOLD → vNEW
La re-siembra automática se dispara por el cambio de versión.
...
Co-authored-by: openhands <openhands@all-hands.dev>"

git push origin main
```

## 11. Reglas de ID

### Ingredientes
- Formato: `snake_case` sin acentos ni espacios
- Únicos entre TODOS los archivos
- Aceites con nombre compartido: sufijo `_aceite` (ej: `menta` vs `menta_aceite`)
- Homeopáticos: usar nombre latino tradicional (ej: `belladonna`, `pulsatilla`)
- Sales Schüssler: nombre homeopático (ej: `kali_phosphoricum`)

### Sinergias
- Formato: `sin_{ingredienteA}_{ingredienteB}` o `sin_{tema}_{ingredienteA}_{ingredienteB}`
- Prefijo obligatorio: `sin_`
- Únicos

## 12. Reglas de Calidad de Datos

### Obligatorias
1. **IDs únicos** (ingredientes y sinergias)
2. **Referencias válidas** (sinergias → ingredientes existentes)
3. **Sistemas corporales** del enum `BODY_SYSTEMS` (13 valores)
4. **Indicaciones** estandarizadas (etiquetas cortas, minúsculas)
5. **Fuente científica** en `metadata.fuente`
6. **`metadata.total`** actualizado tras cada expansión
7. **`metadata.ultimaActualizacion`** actualizado

### Recomendadas
8. **0 huérfanos**: cada ingrediente debe tener ≥1 sinergia
9. **Grado medio ≥ 2.5**: red densamente conectada
10. **Nivel de evidencia** honesto (no inflar evidencia)
11. **Advertencias** completas para ingredientes con riesgos
12. **Interacciones medicamentosas** documentadas

## 13. Normalización de Datos

### Sistemas Corporales (ronda 12)
Mapeo de variantes a enum estándar:
```
inmunologico → inmune
musculo-esqueletico → musculoesqueletico
reproductor → reproductivo
piel → dermatologico
oftalmologico → ocular
sueno, cognitivo, cerebro, psiquico → nervioso
bucal → digestivo
sangre, sanguineo → cardiovascular
articaciones, huesos → musculoesqueletico
urogenital → urinario
oro-faríngeo → respiratorio
energia → metabolico
tiroides → endocrino
antioxidante → metabolico
```

### Indicaciones (ronda 13)
Mapeo por palabra clave a etiqueta estandarizada. Ver lista de top
etiquetas en § 5. Proceso:
1. Pasada 1: mapeo exacto de frases conocidas
2. Pasada 2: mapeo de variantes largas
3. Pasada 3: mapeo por palabra clave contenida

## 14. Filtros Planeados (UI)

### Filtro por Sistema Corporal
- **Datos:** listos (campo `sistemas`, 13 valores normalizados)
- **UI:** chips/etiquetas filtrables en SearchPage y KnowledgePage

### Filtro por Patología
- **Datos:** listos (campo `indicaciones`, etiquetas estandarizadas)
- **UI:** chips/etiquetas filtrables, combinables con filtro por sistema

### Combinación
Ambos filtros deben poder combinarse (ej: sistema=respiratorio +
patología=tos). Esto requiere un componente de filtros en la UI que
actualmente no existe.

## 15. Métricas de la Red

```bash
python3 -c "
import json
from collections import Counter
all_ids = {}
for f in ['fitoterapia','homeopatia','aceites','vitaminas_minerales']:
    d=json.load(open(f'src/db/seeders/data/{f}.json'))
    for i in d['ingredientes']:
        all_ids[i['id']] = i['nombre']
d=json.load(open('src/db/seeders/data/sinergias.json'))
counts = Counter()
for s in d['sinergias']:
    counts[s['ingredienteA']] += 1
    counts[s['ingredienteB']] += 1
orphans = [iid for iid in all_ids if iid not in counts]
deg1 = [iid for iid in all_ids if counts.get(iid,0) == 1]
print(f'Ingredientes: {len(all_ids)}')
print(f'Sinergias: {len(d[\"sinergias\"])}')
print(f'Grado medio: {sum(counts.values())/len(all_ids):.1f}')
print(f'Huérfanos: {len(orphans)}')
print(f'Grado 1: {len(deg1)}')
"
```

**Métricas actuales (ronda 13):**
- Ingredientes: 314
- Sinergias: 414
- Grado medio: 2.6
- Huérfanos: 0
- Grado 1: 116
