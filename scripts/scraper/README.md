# Scraper de Productos — Farmacias Knop

Pipeline de 5 fases para extraer productos de Farmacias Knop, procesarlos con IA
local (Ollama), matchearlos con la KB de Vademecum AI y subirlos a Supabase.

## Requisitos

- **Node.js** 18+
- **Ollama** corriendo localmente con modelo `llama3.1` descargado
- **Playwright** + Chromium instalados
- **Service role key** de Supabase (`sb_secret_...`) — necesaria para escritura

## Instalación

```bash
cd scripts/scraper
npm install
npx playwright install chromium
```

Configurar Ollama (una sola vez):

```bash
ollama pull llama3.1
ollama serve   # o abre la app de Ollama
```

## Configuración

Crea un archivo `.env` en `scripts/scraper/` (NO se commitea — está en .gitignore):

```env
SUPABASE_URL=https://lcoweosnhdkzogtmsfml.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_tu-clave-aqui
OLLAMA_MODEL=llama3.1
OLLAMA_URL=http://127.0.0.1:11434/api/generate
```

> ⚠️ **NUNCA** pongas la service role key en el código. Siempre como variable
> de entorno. La service role key bypassa RLS y tiene acceso total a Supabase.

## Uso

### Pipeline completo (5 fases)

```bash
npm run pipeline
```

Ejecuta las 5 fases en orden, saltando las ya completadas (resume):

| Fase | Script | Entrada | Salida |
|------|--------|---------|--------|
| 1+2 | `scrape` | URLs de Farmacias Knop | `knop_raw_data.json` |
| 3 | `process` | `knop_raw_data.json` | `knop_processed_data.json` |
| 4 | `match` | `knop_processed_data.json` | `knop_matched_data.json` + `knop_match_report.json` |
| 5 | `upload` | `knop_matched_data.json` | Supabase (products + bridge + analysis) |

### Fases individuales

```bash
npm run scrape          # Solo crawler + extractor
npm run process         # Solo procesador IA (Ollama)
npm run match           # Solo matching con KB
npm run upload          # Solo upload a Supabase
npm run upload:dry      # Upload en modo dry-run (no escribe)
```

### Desde el orquestador

```bash
npx ts-node --transpile-only run_pipeline.ts scrape   # Solo fase 1+2
npx ts-node --transpile-only run_pipeline.ts process   # Solo fase 3
npx ts-node --transpile-only run_pipeline.ts match     # Solo fase 4
npx ts-node --transpile-only run_pipeline.ts upload    # Solo fase 5
npx ts-node --transpile-only run_pipeline.ts all       # Todas (default)
```

## Arquitectura

```
Farmacias Knop (web)
       │
       ▼
┌──────────────────┐
│ FASE 1: Crawler  │  Playwright navega 8 colecciones, extrae URLs
└──────┬───────────┘
       ▼
┌──────────────────┐
│ FASE 2: Extractor │  Playwright extrae: nombre, SKU, marca, ingredientes,
│                   │  modo de uso, advertencias + texto limpio (LD-JSON)
└──────┬───────────┘
       │ knop_raw_data.json
       ▼
┌──────────────────┐
│ FASE 3: Ollama    │  IA local estructura el texto en JSON médico
│                   │  (principios_activos, posología, safety, etc.)
└──────┬───────────┘
       │ knop_processed_data.json
       ▼
┌──────────────────┐
│ FASE 4: Matcher   │  Vincula cada principioText → ingredientId de la KB
│                   │  Estrategia: sinonimos → exact → homeopático → fuzzy
│                   │  Reutiliza: diccionario (918 blacklist + 512 synonyms)
│                   │  + homeopathic-utils.cjs
└──────┬───────────┘
       │ knop_matched_data.json + knop_match_report.json
       ▼
┌──────────────────┐
│ FASE 5: Upload    │  Upsert a Supabase: products + product_ingredients
│                   │  + product_ingredient_analysis (cobertura KB)
└──────────────────┘
```

## Resume (reanudación)

Cada fase guarda su progreso incrementalmente. Si el script se cae (corte de
luz, error, etc.), al re-ejecutar continúa desde donde se quedó:
- Fase 1+2: guarda cada 5 productos
- Fase 3: guarda después de cada producto procesado
- Fase 4 y 5: procesan todo de una vez (son rápidas, <30s)

## Matching con la KB

El matcher (fase 4) usa 5 estrategias en orden de prioridad:

1. **Sinónimos químicos** (diccionario de 512 entradas): "ácido ascórbico" → `vitamina_c`
2. **Match exacto**: por ID, nombre, nombresAlternativos o nombreCientifico de la KB
3. **Homeopático**: "Passiflora D3" → extrae "Passiflora" → `passiflora`
4. **Blacklist** (918 entradas): excipientes/tags/cosméticos → marcados como no-match
5. **Fuzzy Levenshtein**: tolerancia a typos (umbral adaptativo por longitud)

## Notas

- **Rate limiting**: pausas de 800ms entre productos (scraper) y 3s (Ollama)
- **User-Agent realista** para evitar bloqueos por WAF
- **Bloqueo de recursos** innecesarios (imágenes, fuentes) para acelerar
- El scraper está diseñado para correr en **tu PC** (necesita Ollama + Playwright)
