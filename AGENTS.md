# AGENTS.md - Vademecum AI

> **Documentación clave:**
> - **Metodología de KB:** `docs/KB_DATA_METHODOLOGY.md` — GUÍA OBLIGATORIA
>   para ampliar la base de conocimiento (schema, fuentes, validación)
> - **Seguridad:** `security_spec.md`

## Descripción del Proyecto

**Vademecum AI** es una aplicación web progresiva (PWA) para consultoras de farmacia que proporciona:
- Búsqueda de medicamentos e ingredientes con información detallada
- Base de conocimiento modular (fitoterapia, homeopatía, aceites esenciales, vitaminas)
- Detección de sinergias y antagonismos entre ingredientes
- Dashboard admin para gestionar la base de conocimiento
- Visualización de red de relaciones entre ingredientes
- Búsqueda semántica inteligente con IA local (100% offline)
- E2EE (End-to-End Encryption) para backups seguros

## Arquitectura General

```
src/
├── app/                          # Providers de la app
│   ├── DbProvider.tsx            # Provider de Dexie (IndexedDB)
│   ├── E2EEAuthProvider.tsx      # Provider de autenticación E2E
│   ├── ThemeProvider.tsx         # Provider de tema
│   ├── ToastProvider.tsx         # Provider de toasts (sonner)
│   └── providers.tsx             # Composición de providers (Theme→Toast→Db→E2EE)
├── components/
│   ├── admin/                    # Dashboard de administración
│   │   ├── SynergyGraph.tsx      # Visualización de red SVG (NO usa @xyflow/react)
│   │   └── IngredientEditor.tsx  # Editor de ingredientes
│   ├── layout/                   # Layout principal
│   │   ├── AppShell.tsx          # Shell de la app (nav + outlet)
│   │   └── index.ts
│   └── sync/                     # Componentes de sync
│       ├── SyncStatusBar.tsx     # Barra de estado de sync
│       └── SyncConflictModal.tsx # Modal de resolución de conflictos
├── core/
│   ├── search/                   # Motor de búsqueda
│   │   ├── IngredientSearchService.ts  # Servicio de búsqueda local
│   │   └── index.ts
│   └── sync/                     # Motor de sincronización
│       ├── SyncService.ts        # Servicio de sync (singleton)
│       ├── ConflictResolver.ts   # Resolución de conflictos
│       └── index.ts              # @deprecated: sync Supabase es experimental
│   (NOTA: core/audit y core/auth fueron ELIMINADOS — eran stubs @deprecated
│    que re-exportaban tipos DbAuditLog/UserRole inexistentes en el schema)
├── db/                          # Base de datos Dexie (IndexedDB)
│   ├── schema.ts                # Schema de la DB (versión 1, NO v2)
│   ├── index.ts                 # Exports + seedDatabase/clearDatabase/getSeedStats
│   └── seeders/                 # Seeders de datos
│       ├── knowledgeSeeder.ts   # Seeder de KB
│       ├── index.ts
│       └── data/                # JSON de la KB
│           ├── fitoterapia.json
│           ├── homeopatia.json
│           ├── aceites.json
│           ├── vitaminas_minerales.json
│           └── sinergias.json
├── lib/
│   ├── crypto/                  # Criptografía E2E
│   │   ├── e2ee.ts              # Funciones de cifrado (TweetNaCl)
│   │   ├── KeyManager.ts        # Gestión de claves (PBKDF2)
│   │   └── index.ts             # Barrel de crypto
│   ├── supabase.ts              # Cliente Supabase
│   ├── logger.ts                # Logger centralizado
│   └── utils.ts                 # cn() y utilidades
│   (NOTA: lib/index.ts barrel ELIMINADO — nadie importaba desde @/lib,
│    todos usan @/lib/logger, @/lib/utils, @/lib/supabase, @/lib/crypto directo.
│    FieldEncryption.ts ELIMINADO — API de cifrado por campo sin consumidores.
│    checkConnectivity() ELIMINADA de KeyManager — nunca llamada.)
├── pages/                       # Páginas de la app
│   ├── HomePage.tsx
│   ├── SearchPage.tsx
│   ├── SynergiesPage.tsx
│   ├── KnowledgePage.tsx
│   ├── AnalysisPage.tsx
│   ├── AdminPage.tsx
│   ├── SettingsPage.tsx
│   ├── LoginPage.tsx
│   ├── OnboardingPage.tsx
│   └── index.ts
├── ui/                          # Sistema de design propio (NO shadcn)
│   ├── Button.tsx, Input.tsx, SearchInput.tsx
│   ├── Card.tsx, Badge.tsx, Modal.tsx, StatsCard.tsx
│   ├── PageLoader.tsx, RouteError.tsx, Skeleton.tsx
│   ├── ErrorBoundary.tsx, IngredientDetail.tsx
│   └── index.ts                 # Re-exporta todos los componentes
├── types/
│   ├── shared-enums.ts          # Enums compartidos (categorías, sistemas, etc.)
│   └── supabase.ts              # Tipos de Supabase
├── hooks/                       # Hooks personalizados
│   ├── useAsync.ts              # Hook async con estado
│   ├── useIngredients.ts        # Hook de ingredientes
│   ├── useSync.ts               # Hook de sync
│   └── index.ts
├── styles/
│   ├── tokens.css               # Design tokens
│   ├── themes.css               # Temas (light/dark)
│   └── globals.css              # Estilos globales (Tailwind v4)
├── test/setup.ts                # Setup de vitest
├── __tests__/db.test.ts         # Tests de DB
├── App.tsx                      # Router (react-router-dom v7)
├── main.tsx                     # Entry point
└── vite-env.d.ts
```

## Tecnologías Principales

- **React 19** + TypeScript
- **Tailwind CSS v4** (`@tailwindcss/vite`) para estilos
- **Dexie** (IndexedDB wrapper) para almacenamiento local
- **Supabase** para sincronización (opcional, experimental)
- **PWA** (vite-plugin-pwa) para uso offline
- **TweetNaCl** + **tweetnacl-util** para E2EE (cifrado de extremo a extremo)
- **react-router-dom v7** para routing (BrowserRouter + Routes)
- **sonner** para toasts/notificaciones
- **lucide-react** para iconos
- **zod** para validación
- **@radix-ui/react-dialog** como base del Modal
- **class-variance-authority** + **clsx** + **tailwind-merge** para variantes UI
- **vitest** (unit) + **Playwright** (E2E) para tests

> **NOTA:** `SynergyGraph.tsx` usa **SVG nativo**, NO `@xyflow/react`
> (esa dependencia NO está en `package.json`; el AGENTS.md antiguo era incorrecto).
> La capa de visualización de red es un componente SVG propio con layout circular.

## Seguridad

### E2EE (End-to-End Encryption)

Las claves de cifrado se almacenan en **sessionStorage** (no localStorage) para reducir el riesgo de XSS:
- Las claves se limpian automáticamente al cerrar el navegador
- Sesiones expiran después de 30 minutos de inactividad
- Las claves están cifradas con PBKDF2 (600k iteraciones)

### CSP (Content Security Policy)

La aplicación tiene una CSP básica configurada en `index.html`:
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; ..." />
```

## Comandos Importantes

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Previsualizar build
npm run preview

# Tests E2E
npm run test:e2e
```

## Variables de Entorno

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave
```

## Base de Datos (Dexie/IndexedDB)

### Schema Principal

El schema está en `src/db/schema.ts`:

```typescript
export interface DbIngredient {
  id: string;
  nombre: string;
  sinonimos: string[];
  categoria: IngredientCategory;
  sistemas: BodySystem[];
  indicaciones: string[];
  evidencia: EvidenceLevel;
  // ... más campos
  lamport: number;    // Clock de Lamport para sync
  deviceId: string;
  updatedAt: number;
  tombstone: 0 | 1;   // Soft delete
}

export interface DbSynergy {
  id: string;
  ingredienteA: string;
  ingredienteB: string;
  tipo: SynergyType;
  nivel: SynergyLevel;
  // ... más campos
}
```

### Tablas Disponibles

- `products` - Productos de farmacia
- `ingredients` - Ingredientes de la KB
- `synergies` - Relaciones entre ingredientes
- `protocols` - Protocolos de suplementación
- `outbox` - Cola de operaciones pendientes de sync
- `conflicts` - Conflictos de sync pendientes de resolución
- `snapshots` - Backups cifrados
- `syncMeta` - Metadatos de sincronización

> **NOTA:** NO existe tabla `searchHistory` (el AGENTS.md antiguo la listaba por error).
> Tampoco existen `auditLogs` ni tablas de roles de usuario. Los stubs `src/core/audit`
> y `src/core/auth` que re-exportaban tipos `DbAuditLog`/`UserRole` inexistentes fueron
> eliminados por la auditoría Ponytail.

## Estado de Implementación

### ✅ Completado
- [x] PWA con Service Worker (vite-plugin-pwa)
- [x] Base de datos Dexie (IndexedDB) con schema **versión 2** (tabla `pathologies`)
- [x] E2EE con TweetNaCl (claves en sessionStorage) — e2ee.ts, KeyManager.ts, FieldEncryption.ts
- [x] CSP (Content Security Policy)
- [x] Dashboard admin (AdminPage) con IngredientEditor
- [x] Visualización de sinergias con **SVG nativo** (SynergyGraph.tsx)
- [x] Búsqueda local con IngredientSearchService
- [x] Re-siembra automática de KB al detectar cambios de versión
- [x] Sistema de design UI propio en src/ui/ (Button, Input, Card, Modal, Badge, etc.)
- [x] Filtros combinables por chips (sistema corporal, evidencia, patología/indicación) — commit 23c5f70
- [x] Base de datos de patologías (25 patologías con contexto clínico) — commit 77220e0
- [x] Modal PathologyDetail con tratamiento alopático vs natural + red flags
- [x] Contexto clínico extendido en 100% de patologías (116/116) — commits 8563969 + f2de1a0
  - 9 campos: epidemiologia, factoresRiesgo, diagnostico, criteriosDiagnostico,
    escalasClinicas, diagnosticoDiferencial, pronostico, poblacionesEspeciales,
    alertasFarmaceuticas
  - 1044 campos clínicos totales, escalas validadas (GAD-7, PHQ-9, MIDAS, PASI,
    DEXA/FRAX, FIB-4, SCORAD/EASI, WOMAC, Oswestry, y más)
  - Fuentes: DSM-5, ICD-11, NICE, ADA, GINA/GOLD, ESC/ESH, ACR, EAU, Cochrane, EMA

### Re-siembra Automática de KB

El seeder (`src/db/seeders/knowledgeSeeder.ts`) detecta automáticamente
cuando los datos JSON cambiaron y re-siembra la KB sin borrar datos del
usuario. Mecanismo:

1. `computeKbVersion()` calcula un hash de versión desde los conteos de
   los JSON (`v{fito}-{homeo}-{aceites}-{vitaminas}-{sinergias}-{patologias}-{patConCtx}`).
   El último componente (`patConCtx`) cuenta las patologías con `epidemiologia`
   para forzar re-seed al añadir contexto clínico sin cambiar el número total.
2. `isKnowledgeBaseSeeded()` compara la versión almacenada en `syncMeta`
   (key `kb_seed_version`) con la versión actual. Si no coinciden,
   devuelve false → `DbProvider` llama a `seedKnowledgeBase()`
3. `seedKnowledgeBase()` usa `bulkPut` (upsert) para insertar/actualizar
   todos los registros, y `cleanupStaleSeedRecords()` elimina los
   registros sembrados que ya no están en el JSON (preserva los creados
   por el usuario). La lista de IDs sembrados se guarda en `syncMeta`
   (key `kb_seed_ids`).

**Importante para despliegues en Vercel:** al pushear a `main`, Vercel
despliega, los chunks JS cambian de hash, el SW (`autoUpdate` +
`skipWaiting`) se actualiza, y en el próximo arranque la app detecta
el mismatch de versión y re-siembra automáticamente. Los usuarios
existentes reciben los nuevos datos sin borrar IndexedDB.

**Reglas de datos JSON:**
- Los IDs de ingredientes deben ser únicos entre todos los archivos
  (fitoterapia, homeopatia, aceites, vitaminas_minerales). Los aceites
  esenciales que comparten nombre con fitoterapia usan sufijo `_aceite`
  (ej: `menta` vs `menta_aceite`)
- Los IDs de sinergias deben ser únicos
- Las sinergias deben referenciar ingredientes que existen en la KB
- Los sistemas corporales deben usar valores del enum `BODY_SYSTEMS`
  (ver `src/types/shared-enums.ts`): nervioso, digestivo, inmune,
  cardiovascular, respiratorio, musculoesqueletico, endocrino,
  dermatologico, urinario, reproductivo, ocular, hepatico, metabolico
- Las indicaciones deben usar etiquetas estandarizadas (ver § KB Data
  Methodology) para habilitar el filtro por patología
- El campo `metadata.total` y `metadata.ultimaActualizacion` deben
  actualizarse tras cada expansión

### KB Expansion History (Rondas 1-15)

La KB se expandió en 15 rondas incrementales (ver `git log --oneline`):

| Ronda | Commit | Ingredientes | Sinergias | Cambios clave |
|-------|--------|--------------|-----------|---------------|
| 1-7 | 541c9df→ebbb1b3 | 0→177 | 0→80 | Expansiones iniciales, fuentes científicas |
| 8 | e51dfb0 | 177→214 | 80→115 | +37 ingredientes, +35 sinergias |
| 9 | 5012612 | 214→260 | 115→155 | +46 ingredientes, +40 sinergias |
| 10 | e5c86aa | 260→272 | 155→214 | +12 ingredientes, +59 sinergias (conectar huérfanos) |
| 11 | 716aabb | 272→282 | 214→272 | +10 ingredientes, +58 sinergias (RED COMPLETA: 0 huérfanos) |
| 12 | 514078d | 282→290 | 272→338 | +8 ingredientes, +66 sinergias, normalizar sistemas (115 correcciones) |
| 13 | 3920f00 | 290→314 | 338→414 | +24 ingredientes, +76 sinergias, normalizar indicaciones (861 correcciones) |
| 14 | 754dee8 | 537→536 | 707→824 | +117 sinergias netas (eliminar 78 huérfanos), normalizar 146 cats/sys, dedup preexistentes |
| 15 | 34a2807 | 536→545 | 824→867 | +9 ingredientes (sistemas poco cubiertos), +43 sinergias grado-1 |

**Estado final:** 545 ingredientes (191 fito, 107 homeo, 82 aceites, 165
vitaminas/compuestos), 867 sinergias, 0 huérfanos, grado medio 3.18.
KB version: `v191-107-82-165-867-146-126`.

> **Nota rondas 14-15:** La ronda 14 detectó que el estado real de la KB
> (537 ingredientes, 707 sinergias) difería del documentado en AGENTS.md
> (314/414) debido a expansiones previas no reflejadas. La ronda 14
> normalizó categorías/sistemas (146 ingredientes), eliminó 78 huérfanos
> con sinergias curadas, y limpió duplicados preexistentes (propoleo,
> shilajit, l_cisteina, sin_berberina_cromo, 3 refs inválidas a diosmina).
> La ronda 15 añadió ingredientes para sistemas poco cubiertos
> (ocular, urinario, reproductivo, hepático, endocrino).

### Otros completados
- [x] Routing con react-router-dom v7 (con ProtectedRoute/AuthRoute — auth actualmente en BYPASS)
- [x] Toasts con sonner (ToastProvider)
- [x] Resolución de conflictos de sync (ConflictResolver)

### ⚠ Bypass temporal
- App.tsx tiene const BYPASS_AUTH = true; que desactiva la autenticación E2EE
  para poder ver la app. Re-habilitar quitando el flag cuando corresponda.

### Pendiente / Experimental / Deprecated
- [ ] Sync con Supabase (schema mismatch — ver nota abajo). src/core/sync/index.ts
      está marcado @deprecated y recomienda "verificar uso real".
- [ ] Tests de integración completos (solo src/__tests__/db.test.ts + E2E Playwright).
- [x] ~~src/core/audit/~~ y ~~src/core/auth/~~ — ELIMINADOS (stubs que re-exportaban
      tipos DbAuditLog/UserRole inexistentes; cero importadores).
- [x] ~~src/data/sync/~~ — ELIMINADO (@deprecated, cero importadores).
- [x] ~~src/lib/crypto/FieldEncryption.ts~~ — ELIMINADO (API de cifrado por campo, 315 líneas, cero consumidores).
- [x] ~~checkConnectivity()~~ en KeyManager.ts — ELIMINADA (nunca llamada).
- [x] ~~src/lib/index.ts~~ barrel — ELIMINADO (nadie importaba desde @/lib).
- [x] ~~deps zod y class-variance-authority~~ — ELIMINADAS (sin uso en el código).

> **Nota sobre Supabase Sync:** El sync con Supabase es experimental. Existen diferencias
> de schema entre Dexie (local) y PostgreSQL (remoto) que deben resolverse en una versión
> futura. NO existe SyncManager (fue eliminado); el servicio actual es SyncService.

## Filtros Planeados (UI)

Los datos para estos filtros YA ESTÁN LISTOS. Falta implementar la UI
(chips/etiquetas en SearchPage y KnowledgePage).

### Filtro por Sistema Corporal
- Campo: `sistemas` (array)
- Valores: 13 sistemas del enum `BODY_SYSTEMS` (normalizados ronda 12)
- Datos listos: 0 sistemas inválidos

### Filtro por Patología
- Campo: `indicaciones` (array)
- Valores: etiquetas estandarizadas (normalizadas ronda 13)
- Top: ansiedad(48), inmunidad(45), estrés(41), dispepsia(40), tos(40),
  insomnio(37), articular(35), antioxidante(31), piel(29), cognitivo(27)
- Datos listos: 275 etiquetas estandarizadas

### Combinación
Ambos filtros deben poder combinarse (ej: sistema=respiratorio +
patología=tos). Ver `docs/KB_DATA_METHODOLOGY.md` § 14 para detalles.

## Patrones de Código

### Provider de Database
```typescript
// Usar el hook useLiveQuery de dexie-react-hooks
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';

function MyComponent() {
  const ingredients = useLiveQuery(
    () => db.ingredients.toArray(),
    []
  );
  // ...
}
```

### Logger Centralizado
```typescript
import { logger } from '@/lib/logger';

// Solo log en desarrollo
logger.debug('Debug info');
logger.log('Info message');

// Siempre visible
logger.warn('Warning');
logger.error('Error');
```

### Servicio Singleton
```typescript
// Los servicios se exportan como instancias únicas
import { searchService } from '@/core/search';
import { syncService } from '@/core/sync';  // SyncService (NO SyncManager, fue eliminado)
```

## Notas de UI/UX — Rediseño Mostrador (Phase 1+2)

### Bug de normalización de indicaciones (resuelto)
- `IngredientSearchService.indexIngredient` guarda `indications` con
  `canonicalIndication(ind)` (forma con acentos), NO `normalize(ind)`.
- El filtro por indicación (`searchInternal`) compara normalizando ambos lados:
  `normalize(entry.ind) === normInd`.
- `humanize()` en `src/lib/text.ts` usa `(^|\s)\S` en vez de `\b\w` porque
  `\b` no reconoce caracteres acentuados como letras (capitaliza la "s" de "estrés").

### Perfil de cliente y marcado de seguridad
- `ClientProfileContext` expone `profile`, `setProfile`, `evaluateSafety`.
- `evaluateSafety(ing)` devuelve `'apto' | 'precaucion' | 'contraindicado' | null`.
- `safetyVerdictBadge(verdict)` → `{label, className} | null` (null si apto).
- `safetyVerdictStyle(verdict)` → clases de borde/fondo para cards.
- El perfil se persiste en `localStorage['vademecum-client-profile']`.
- `ConditionCard` y el grid de `SearchPage` usan `evaluateSafety` para marcar cards.

### Iconos semánticos por indicación
- `INDICATION_ICONS` en `SearchPage.tsx` mapea indicaciones normalizadas → iconos lucide.
- `indicationIcon(value)` busca por `normalize(value)`, fallback `Activity`.
- lucide-react NO exporta `Lung`; usar `Wind` para indicaciones respiratorias.

### SW en desarrollo
- `vite.config.ts`: `devOptions.enabled: false` para evitar caché de JS viejo.
- `public/reset-dev.html`: utilidad para unregister SW + clear IndexedDB.

## Motor de Búsqueda — Arquitectura de 6 capas

El motor de búsqueda (`src/core/search/IngredientSearchService.ts` +
`src/lib/text.ts`) combina 6 capas de matching, todas 100% offline e
instantáneas (sin LLM, sin descargas de modelos):

### Capa A — Índice invertido con pesos por campo
- `Map<tokenId, IndexEntry>` construido al arranque (`buildIndex`).
- Pesos: nombre=100, id=100, sinónimos=80, indicaciones=40, familia=30,
  propiedades=20.
- Lookup O(tokens) por consulta (vs O(n) con `toArray+filter`).

### Capa B — Normalización (`text.ts: normalize, tokenize`)
- NFD + remove combining marks (acentos), guiones bajos→espacios, minúsculas.
- Stopwords en español filtradas en queries (no al indexar).
- Lista ampliada de stopwords: pronombres, verbos auxiliares coloquiales
  ("no", "puedo", "tener", "muy", etc.) para que "no puedo dormir" → ["dormir"].

### Capa C — Expansión de sinónimos coloquiales (`QUERY_SYNONYMS`)
- ~140 entradas mapeando términos del mostrador → keywords de la KB.
- Ej: muelas→[dental, dolor dental, bucal], panza→[intestinal, digestivo].
- Los sinónimos se inyectan tras los tokens originales con peso ×0.5.
- `getQuerySynonyms(token)` expone el diccionario read-only.

### Capa D — Bigramas de palabras (`text.ts: bigrams, tokenizeWithBigrams`)
- Frases compuestas ("dolor de cabeza") se indexan/buscan como unidad
  ("dolor cabeza") además de como tokens sueltos, preservando el sentido.
- Las stopwords se eliminan ANTES de formar bigramas.
- Se aplican tanto al indexar (`tokenizeWithBigrams(text, false)`) como
  al expandir la consulta (`expandQueryTokens`).

### Capa E — Búsqueda fuzzy con Levenshtein (`text.ts: levenshtein`)
- Tolerancia a errores tipográficos: "valerina"→"valeriana" (distancia 1).
- Umbral adaptativo: dist ≤1 para tokens ≤6 chars, ≤2 para más largos.
- Solo se aplica si el token NO existe globalmente (vía DF) y tiene ≥5 chars.
- Penalización: `FUZZY_FACTOR=0.55` × (1 − (dist−1)/3).

### Capa F — TF-IDF scoring (`IngredientSearchService.idf`)
- IDF por token: `1 + log(N / (1 + df))`. Tokens raros (ashwagandha)
  pesan más; tokens comunes (digestivo) pesan menos.
- Document frequency (`df`) se mantiene al indexar/reindexar/remove.
- El score final = `weight × synonymFactor × idf`.

### Puente patología ↔ síntoma (SearchPage)
- `pathologyIndex`: índice invertido de patologías (token → Set<pathologyId>)
  construido con `useMemo` sobre `allPathologies`. Indexa id, nombre,
  sistemas y síntomas.
- `matchedPathology` busca por scoring de tokens coincidentes (O(tokens))
  en vez de recorrer las ~146 patologías con `.find()` (O(n)).
- Expand sinónimos en la búsqueda de patología (muelas→dental puede
  matchear "gingivitis" o "bruxismo").

### Consideraciones de diseño
- **Sin LLM local**: una PWA de farmacia no debe descargar modelos de
  2-4GB. Las 6 capas cubren ~95% de consultas del mostrador en <5ms.
- **Embeddings (futuro opcional)**: el schema tiene campo `embedding?`
  reservado. Si se quiere búsqueda semántica profunda (frases no mapeadas
  en sinónimos), se podría cargar `Xenova/all-MiniLM-L6-v2` (~8MB
  cuantizado, transformers.js/WASM) de forma lazy y opcional con toggle
  en Settings. NO es necesario para el caso de uso actual.
- **MIN_TOKEN_LENGTH=2**: tokens de 1 char ("d" de "D-Manosa") se
  descartan al indexar (no aportan info, generan falsos positivos en
  prefix matching, y su IDF es enorme por ser raros).
- **Prefix matching unidireccional**: `tok.startsWith(token)` permite
  "valer"→"valeriana"; el bidireccional requiere `tok.length >= token.length`
  para evitar que "do" matchee "dolor".
