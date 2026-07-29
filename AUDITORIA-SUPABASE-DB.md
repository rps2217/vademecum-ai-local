# 🔍 AUDITORÍA TÉCNICA - Base de Datos Supabase

> **Fecha:** Julio 2026  
> **Auditor:** OpenHands Agent  
> **Proyecto:** Vademecum AI  
> **Supabase:** https://pspxqzwxulgmzarlqwtt.supabase.co

---

## 0. Resumen Ejecutivo

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Tablas definidas | ✅ | 10+ tablas |
| Productos (products_v2) | ✅ | Con datos reales |
| Ingredientes (extended_ingredients) | ✅ | Base de conocimiento |
| Protocolos | ✅ | Protocolos de suplementacion |
| Relaciones | ⚠️ | ingredient_relationships vacia |
| Organos/Patologias | ✅ | Mapeo organo-sistema |
| Scraper config | ✅ | Configuracion de scraper |
| Sync metadata | ⚠️ | No encontrada |

**Veredicto: La base de datos tiene una estructura robusta y contiene datos reales de productos farmaceuticos.**

---

## 1. Esquema de Base de Datos

### 1.1 Tablas Principales

| Tabla | Proposito | Campos | Estado |
|-------|-----------|--------|--------|
| `products_v2` | Productos farmaceuticos | 30+ | ✅ Con datos |
| `extended_ingredients` | Base de conocimiento de ingredientes | 18 | ✅ Con datos |
| `protocols` | Protocolos de suplementacion | 26 | ✅ Con datos |
| `ingredient_relationships` | Relaciones entre ingredientes | 9 | ⚠️ Vacia |
| `ingredient_keywords` | Palabras clave | 4 | ⚠️ Revisar |
| `organs_pathologies` | Organos y patologias | 10 | ✅ Con datos |
| `product_synergies` | Sinergias entre productos | 10 | ✅ Con datos |
| `scraper_history` | Historial de scraping | 7 | ⚠️ Revisar |
| `scraper_config` | Configuracion scraper | 5 | ✅ Con datos |
| `user_profiles` | Perfiles de usuario | 6 | ⚠️ Revisar |

### 1.2 Vistas (Views)

| Vista | Proposito |
|-------|-----------|
| `v_products_with_safety` | Productos con informacion de seguridad |
| `v_protocols_active` | Protocolos activos con conteo de ingredientes |
| `product_ingredient_analysis` | Analisis de ingredientes por producto |
| `sync_metadata` | Metadata de sincronizacion |

---

## 2. Tabla: products_v2

### 2.1 Estructura

```sql
products_v2 (
  id              UUID PRIMARY KEY,
  sku             TEXT UNIQUE,
  nombre_comercial TEXT,
  descripcion     TEXT,
  principios_activos JSONB,
  indicaciones    JSONB,
  advertencias   TEXT,
  posologia       TEXT,
  marca          TEXT,
  categoria      TEXT,
  
  -- Seguridad
  apto_celiacos   BOOLEAN,
  apto_embarazo   BOOLEAN,
  apto_lactancia  BOOLEAN,
  apto_pediatria  BOOLEAN,
  apto_diabeticos BOOLEAN,
  alto_consumo_sodio BOOLEAN,
  
  -- IA/ML
  tags_ia         JSONB,
  vectors         vector(384),
  vectors_dims    INTEGER,
  synergy_analyzed BOOLEAN,
  sugerencia_complementaria TEXT,
  analysis_notes  TEXT,
  
  -- Verificacion
  is_verified     BOOLEAN,
  verified_at     TIMESTAMPTZ,
  verified_by     TEXT,
  
  -- Lock para concurrencia
  locked_by_ai    BOOLEAN,
  lock_timestamp  BIGINT,
  lock_uid        TEXT,
  
  -- Relacionados
  skus_relacionados JSONB,
  source_url      TEXT,
  
  -- Sync
  is_synced_cloud BOOLEAN,
  last_synced_cloud TIMESTAMPTZ,
  
  -- Estado
  is_active       BOOLEAN,
  is_featured     BOOLEAN,
  created_at      TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ,
  last_updated    TIMESTAMPTZ
)
```

### 2.2 Campos Destacados

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `principios_activos` | JSONB | Lista de principios activos |
| `vectors` | vector(384) | Embeddings para busqueda semantica |
| `synergy_analyzed` | BOOLEAN | Si ya fue analizado por IA |
| `sugerencia_complementaria` | TEXT | Recomendacion de mezcla |
| `locked_by_ai` | BOOLEAN | Lock para evitar edicion concurrente |

### 2.3 Indices

- `id` (PK)
- `sku` (UNIQUE)
- `nombre_comercial`
- `categoria`
- `is_active`
- `is_featured`
- `is_verified`

### 2.4 Muestra de Datos

```json
{
  "sku": "0606110383103",
  "nombre_comercial": "Vitamina B12 5,8 g (90 porciones) - Dulzura Natural",
  "descripcion": "Producto con certificacion vegana y libre de gluten...",
  "principios_activos": [
    "Vitamina B12 (Cianocobalamina)",
    "Calcio (Carbonato de Calcio)"
  ],
  "indicaciones": [
    "Absorber la B12 necesaria que tu cuerpo necesita",
    "Prevenir la anemia perniciosa"
  ],
  "tags_ia": ["Vitamina B12", "Suplemento alimenticio"],
  "synergy_analyzed": true,
  "sugerencia_complementaria": "### Mezcla Exacta Recomendada...",
  "locked_by_ai": true,
  "skus_relacionados": ["7804611572528", "7805158134187"],
  "is_active": true
}
```

---

## 3. Tabla: extended_ingredients

### 3.1 Estructura

```sql
extended_ingredients (
  id              UUID PRIMARY KEY,
  ingredient_key  TEXT UNIQUE,
  name            TEXT,
  scientific_name TEXT,
  category        TEXT,
  origin_type     TEXT,
  origin_description TEXT,
  description     TEXT,
  mechanism       TEXT,
  indications     JSONB,
  contraindications JSONB,
  interactions    JSONB,
  dosage          TEXT,
  side_effects    TEXT,
  synonyms       JSONB,
  warnings        TEXT,
  created_at      TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ
)
```

### 3.2 Campos Destacados

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `ingredient_key` | TEXT | Slug unico (ej: "valeriana") |
| `scientific_name` | TEXT | Nombre cientifico |
| `category` | TEXT | fitoterapia, homeopatia, etc. |
| `mechanism` | TEXT | Mecanismo de accion |
| `indications` | JSONB | Lista de indicaciones |
| `contraindications` | JSONB | Contraindicaciones |
| `interactions` | JSONB | Interacciones conocidas |
| `synonyms` | JSONB | Sinonimos en multiple idiomas |

### 3.3 Muestra de Datos

```json
{
  "ingredient_key": "arnica",
  "name": "Arnica Montana",
  "scientific_name": "Arnica montana",
  "category": "homeopatia",
  "origin_type": "planta",
  "origin_description": "Planta alpine de Europa",
  "description": "Remedio homeopatico para traumatismos.",
  "mechanism": "Modula la respuesta inflamatoria.",
  "indications": [
    "Traumatismos",
    "Contusiones",
    "Dolores musculares"
  ],
  "contraindications": [
    "Hipersensibilidad a Asteraceae"
  ],
  "interactions": [
    "Puede interactuar con anticoagulantes"
  ],
  "dosage": "CH 5 a CH 9: 3-5 granules",
  "synonyms": ["arnica montana"]
}
```

### 3.4 Categorias Presentes

- `homeopatia` ✅
- `fitoterapia` ✅
- `vitamina` ✅
- `mineral` ✅
- `aceite_esencial` (probable)

---

## 4. Tabla: protocols

### 4.1 Estructura

```sql
protocols (
  id                UUID PRIMARY KEY,
  name              TEXT,
  description       TEXT,
  category          TEXT,
  icon              TEXT,
  color             TEXT,
  objetivo_principal TEXT,
  duracion_dias     INTEGER,
  dificultad        TEXT,
  phases            JSONB,
  ingredients       JSONB,  -- [{dosis, nombre, momento}]
  resultados_esperados JSONB,
  indicadores_seguir JSONB,
  contraindicaciones JSONB,
  advertencias       JSONB,
  interacciones      JSONB,
  evidencia_level   TEXT,  -- A, B, C, D
  referencias        JSONB,
  estudios_clinicos   JSONB,
  is_active         BOOLEAN,
  is_featured       BOOLEAN,
  is_verified       BOOLEAN,
  created_by        TEXT,
  created_at        TIMESTAMPTZ,
  updated_at        TIMESTAMPTZ,
  version           INTEGER
)
```

### 4.2 Muestra de Datos

```json
{
  "name": "Refuerzo Inmunologico",
  "description": "Protocolo para fortalecer el sistema inmune...",
  "category": "inmunidad",
  "objetivo_principal": "Fortalecer el sistema inmunologico de forma natural",
  "duracion_dias": 30,
  "dificultad": "baja",
  "ingredients": [
    { "dosis": "1000mg", "nombre": "Vitamina C", "momento": "manana" },
    { "dosis": "30mg", "nombre": "Zinc", "momento": "almuerzo" },
    { "dosis": "500mg", "nombre": "Equinacea", "momento": "tarde" }
  ],
  "contraindicaciones": [
    "Alergia a algun componente",
    "Enfermedades autoinmunes"
  ],
  "evidencia_level": "B",
  "is_active": true,
  "is_featured": true
}
```

---

## 5. Tabla: organs_pathologies

### 5.1 Estructura

```sql
organs_pathologies (
  id           UUID PRIMARY KEY,
  organ        TEXT,
  aliases      JSONB,
  pathologies   JSONB,
  categories    JSONB,
  ingredients   JSONB,
  description   TEXT,
  created_at    TIMESTAMPTZ,
  updated_at    TIMESTAMPTZ
)
```

### 5.2 Muestra de Datos

```json
{
  "organ": "higado",
  "aliases": ["hepatico", "liver"],
  "pathologies": ["hepatitis", "cirrosis", "higado graso"],
  "categories": ["hepatoprotector", "digestivo"],
  "ingredients": ["cardo mariano", "alcachofa", "sam-e"],
  "description": "El higado es el organo mas grande del cuerpo."
}
```

### 5.3 Organos Presentes

- higado
- pulmon
- corazon
- (probablemente mas)

---

## 6. Tabla: ingredient_relationships

### 6.1 Estructura

```sql
ingredient_relationships (
  id            UUID PRIMARY KEY,
  ingrediente1  TEXT,
  ingrediente2  TEXT,
  tipo_relacion TEXT,  -- sinergia, antagonismo, etc.
  intensidad    TEXT,
  descripcion   TEXT,
  evidencia     TEXT,
  created_at    TIMESTAMPTZ,
  updated_at    TIMESTAMPTZ
)
```

### 6.2 Estado Actual

**Vacia (0 registros)** - Necesita poblarse con las sinergias de la KB local.

---

## 7. Campos de Seguridad en products_v2

### 7.1 Campos Disponibles

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `apto_celiacos` | BOOLEAN | Seguro para celiacos |
| `apto_embarazo` | BOOLEAN | Seguro en embarazo |
| `apto_lactancia` | BOOLEAN | Seguro en lactancia |
| `apto_pediatria` | BOOLEAN | Seguro en pediatria |
| `apto_diabeticos` | BOOLEAN | Seguro para diabeticos |
| `alto_consumo_sodio` | BOOLEAN | Alto en sodio |

### 7.2 Mapeo con Schema Local

El schema local de Dexie usa `SafetyStatus`:
```typescript
type SafetyStatus = 'apto' | 'evitar' | 'contraindicado' | 'desconocido';
```

**No hay mapeo directo** - los campos en Supabase son booleanos, pero en Dexie son enumerables.

---

## 8. Analisis de Integracion

### 8.1 Comparacion: Supabase vs Dexie (Local)

| Aspecto | Supabase | Dexie (Local) |
|---------|----------|---------------|
| Productos | `products_v2` | `products` |
| Ingredientes | `extended_ingredients` | `ingredients` |
| Sinergias | `product_synergies` | `synergies` |
| Protocolos | `protocols` | `protocols` |
| Sync metadata | No existe | `syncMeta` |
| Outbox | No existe | `outbox` |

### 8.2 Diferencias Estructurales

| Aspecto | Supabase | Dexie |
|---------|----------|-------|
| IDs | UUID | Strings arbitrarios |
| Timestamps | ISO 8601 | Unix ms |
| Arrays | JSONB | Arrays nativos |
| Vectores | `vector(384)` | `number[]` |
| Sync | No hay | Outbox pattern |

### 8.3 Campos Unicos en Supabase

- `vectors` - Embeddings para busqueda semantica
- `synergy_analyzed` - Flag de analisis IA
- `sugerencia_complementaria` - Recomendacion generada por IA
- `locked_by_ai` - Lock de concurrencia
- `lock_uid` - Nodo que tiene el lock

---

## 9. Campos de IA/ML

### 9.1 Embeddings

```sql
vectors vector(384)  -- Embeddings para busqueda semantica
vectors_dims INTEGER  -- Dimensiones (384)
```

**Usos potenciales:**
- Busqueda de productos similares
- Recomendaciones basadas en ingredientes
- Clasificacion automatica

### 9.2 Tags IA

```sql
tags_ia JSONB  -- Tags generados por IA
```

### 9.3 Sugerencias

```sql
sugerencia_complementaria TEXT
-- Contenido generado por IA con mezclas recomendadas
```

---

## 10. Recomendaciones de Integracion

### 10.1 Adaptadores Necesarios

Se necesitan adaptadores para:

1. **Conversiones de ID**
   - Supabase: UUID
   - Dexie: strings

2. **Conversiones de timestamp**
   - Supabase: ISO 8601
   - Dexie: Unix ms

3. **Conversiones de arrays**
   - Supabase: JSONB
   - Dexie: arrays nativos

4. **Campos faltantes**
   - Dexie: `lamport`, `deviceId`, `tombstone`
   - Supabase: No tiene (necesita agregarlos)

### 10.2 Nuevo Schema Sync para Supabase

```sql
-- Agregar a products_v2
ALTER TABLE products_v2 ADD COLUMN IF NOT EXISTS lamport INTEGER DEFAULT 0;
ALTER TABLE products_v2 ADD COLUMN IF NOT EXISTS device_id TEXT;
ALTER TABLE products_v2 ADD COLUMN IF NOT EXISTS tombstone INTEGER DEFAULT 0;

-- Agregar a extended_ingredients
ALTER TABLE extended_ingredients ADD COLUMN IF NOT EXISTS lamport INTEGER DEFAULT 0;
ALTER TABLE extended_ingredients ADD COLUMN IF NOT EXISTS device_id TEXT;
ALTER TABLE extended_ingredients ADD COLUMN IF NOT EXISTS tombstone INTEGER DEFAULT 0;

-- Agregar a protocols
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS lamport INTEGER DEFAULT 0;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS device_id TEXT;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS tombstone INTEGER DEFAULT 0;
```

### 10.3 Mapeo de Ingredientes

El campo `category` en Supabase usa valores diferentes a Dexie:

| Supabase | Dexie |
|----------|-------|
| `homeopatia` | `homeopatia` ✅ |
| `fitoterapia` | `fitoterapia` ✅ |
| `vitamina` | `vitamina` ✅ |
| `mineral` | `mineral` ✅ |

---

## 11. Conclusiones

### 11.1 Fortalezas

- ✅ Schema completo y bien diseñado
- ✅ Datos reales de productos farmaceuticos
- ✅ Soporte para embeddings vectoriales
- ✅ Campos de IA/ML para sugerencias
- ✅ Seguridad definida para productos

### 11.2 Areas de Mejora

- ⚠️ `ingredient_relationships` esta vacia
- ⚠️ Falta metadata de sync (lamport, device_id, tombstone)
- ⚠️ No hay tabla de outbox en Supabase
- ⚠️ product_synergies puede no tener todos los datos

### 11.3 Plan de Accion

1. **Corto plazo:**
   - Poblar `ingredient_relationships` con datos de sinergias
   - Agregar campos de sync a todas las tablas

2. **Medio plazo:**
   - Crear tabla `sync_outbox` en Supabase
   - Implementar sync bidireccional real

3. **Largo plazo:**
   - Implementar busqueda vectorial completa
   - Sistema de recomendaciones basado en embeddings

---

## Anexo: API Endpoints Disponibles

```
POST /rest/v1/products_v2
GET  /rest/v1/products_v2?id=eq.{uuid}
POST /rest/v1/extended_ingredients
GET  /rest/v1/extended_ingredients?ingredient_key=eq.valeriana
POST /rest/v1/protocols
GET  /rest/v1/protocols?is_active=eq.true
GET  /rest/v1/organs_pathologies
POST /rest/v1/ingredient_relationships
GET  /rest/v1/v_products_with_safety
```
