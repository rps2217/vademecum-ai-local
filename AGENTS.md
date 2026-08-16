# AGENTS.md - Vademecum AI

> **Documentación clave:**
> - **Metodología de KB:** `docs/KB_DATA_METHODOLOGY.md` — GUÍA OBLIGATORIA
>   para ampliar la base de conocimiento (schema, fuentes, validación)

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
│   │   ├── searchEngine.ts       # Núcleo compartido (índice invertido + TF-IDF + fuzzy)
│   │   ├── IngredientSearchService.ts  # Servicio de búsqueda de ingredientes
│   │   ├── ProductSearchService.ts      # Servicio de búsqueda de productos
│   │   ├── SynergySearchService.ts      # Servicio de búsqueda de sinergias (fuzzy + facets)
│   │   └── index.ts
│   └── sync/                     # Motor de sincronización
│       ├── SyncService.ts        # Servicio de sync (singleton)
│       ├── ConflictResolver.ts   # Resolución de conflictos
│       ├── ProductReplicator.ts  # Replica productos + bridge desde Supabase
│       └── index.ts              # @deprecated: sync Supabase es experimental
│   (NOTA: core/audit y core/auth fueron ELIMINADOS — eran stubs @deprecated
│    que re-exportaban tipos DbAuditLog/UserRole inexistentes en el schema)
├── db/                          # Base de datos Dexie (IndexedDB)
│   ├── schema.ts                # Schema de la DB (versión 4: +bridge productos)
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
│   │   ├── e2ee.ts              # Funciones de cifrado (TweetNaCl + PBKDF2)
│   │   └── index.ts             # Barrel de crypto
│   │   (NOTA: KeyManager.ts ELIMINADO — su lógica (deriveKey, generateAndStoreKeyPair,
│   │    unlockKeyPair, unlockWithRecovery, hasKeyPair, deleteKeyPair) se consolidó
│   │    en e2ee.ts. FieldEncryption.ts ELIMINADO — API de cifrado por campo sin
│   │    consumidores. checkConnectivity() ELIMINADA — nunca llamada.)
│   ├── supabase.ts              # Cliente Supabase
│   ├── logger.ts                # Logger centralizado
│   └── utils.ts                 # cn() y utilidades
│   (NOTA: lib/index.ts barrel ELIMINADO — nadie importaba desde @/lib,
│    todos usan @/lib/logger, @/lib/utils, @/lib/supabase, @/lib/crypto directo.
│    FieldEncryption.ts ELIMINADO — API de cifrado por campo sin consumidores.
│    KeyManager.ts ELIMINADO — consolidado en e2ee.ts. checkConnectivity() ELIMINADA.)
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

### Archivos fuera de `src/` relevantes

- `public/theme-init.js` — Script anti-flash de tema (externalizado en PR #51
  para permitir CSP estricta sin `'unsafe-inline'`). Se carga en `<head>` antes
  del primer paint.
- `eslint.config.js` — ESLint v9 flat config. Define globals de navegador
  (`window`, `document`, `localStorage`, `matchMedia`) para `public/**/*.js`.
- `index.html` — CSP estricta + referencia a `theme-init.js`.

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
- **@radix-ui/react-dialog** como base del Modal
- **clsx** + **tailwind-merge** para variantes UI
- **vitest** (unit) + **Playwright** (E2E) para tests

> **NOTA:** `zod` y `class-variance-authority` fueron ELIMINADAS del proyecto
> (sin uso en el código). El AGENTS.md antiguo las listaba incorrectamente.

> **NOTA:** `SynergyGraph.tsx` usa **SVG nativo**, NO `@xyflow/react`
> (esa dependencia NO está en `package.json`; el AGENTS.md antiguo era incorrecto).
> La capa de visualización de red es un componente SVG propio con layout circular.

## Seguridad

### E2EE (End-to-End Encryption)

**Implementación unificada:** Toda la lógica de cifrado y storage del keypair
vive en `src/lib/crypto/e2ee.ts`. El `E2EEAuthProvider` es un orchestrador
delgado que delega al módulo crypto.

- **`src/lib/crypto/e2ee.ts`** (módulo crypto): todas las funciones de storage
  (`generateAndStoreKeyPair`, `storeKeyPair`, `unlockKeyPair`, `hasKeyPair`,
  `deleteKeyPair`) usan **localStorage** con `KEY_STORAGE_KEY='vademecum.keypair'`
  (punto). El keypair CIFRADO (PBKDF2 600k + AES-GCM/secretbox) se persiste en
  localStorage; la clave de cifrado se deriva del password y nunca se persiste.
  `sessionStorage` solo guarda un flag de sesión (`vademecum.session`).
  Las claves NO se guardan en claro.
- **`storeKeyPair(secretKey, password)`** (nueva en PR #53): re-cifra un
  secretKey existente con una nueva contraseña y lo guarda en localStorage
  (con la key correcta). Usada por `generateAndStoreKeyPair` (nueva cuenta)
  y `E2EEAuthProvider.recover` (recuperación de contraseña). Centraliza la
  lógica de storage en un solo lugar.
- **`src/app/E2EEAuthProvider.tsx`** (provider de la app): `setup`/`unlock`/
  `recover` delegan a e2ee.ts. `recover` usa `storeKeyPair` para re-cifrar con
  la nueva contraseña (antes re-implementaba el storage en sessionStorage con
  keys distintas → bug de inconsistencia, corregido en PR #53).

Sesiones:
- El flag de sesión y el timer (`_sessionExpiry` en e2ee.ts,
  `sessionExpiryRef` en E2EEAuthProvider) viven en memoria + sessionStorage.
- Sesiones expiran después de 30 minutos de inactividad.
- **Cada recarga de página requiere re-unlock** ("always require unlock at boot"):
  el `E2EEAuthProvider` no reactiva la sesión en mount, solo marca
  `isAuthenticated=false` y muestra el login. Navegar dentro de la SPA
  (sin recarga) mantiene la sesión.
- Las claves se cifran con PBKDF2 (600k iteraciones, SHA-256).

### CSP (Content Security Policy)

La aplicación tiene una CSP **estricta** configurada en `index.html`:
```html
<meta http-equiv="Content-Security-Policy"
  content="default-src 'self';
           script-src 'self';
           style-src 'self' 'unsafe-inline';
           img-src 'self' data: blob:;
           font-src 'self' data:;
           connect-src 'self' https://*.supabase.co;
           object-src 'none'; base-uri 'self';" />
```

> **PR #51:** `script-src` es ahora `'self'` (sin `'unsafe-inline'`).
> El script anti-flash de tema (que prevenía FOUC) se movió de inline a
> `public/theme-init.js` (archivo externo, cargado en `<head>` antes del
> primer paint). `style-src` mantiene `'unsafe-inline'` porque Tailwind v4
> y los temas inyectan estilos en runtime. ESLint v9 (flat config) define
> globals de navegador para `public/**/*.js` en `eslint.config.js`.

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
- [x] E2EE con TweetNaCl (keypair cifrado en localStorage vía e2ee.ts; flag de sesión en sessionStorage) — e2ee.ts, E2EEAuthProvider.tsx
- [x] CSP (Content Security Policy) **estricta** — `script-src 'self'` sin `'unsafe-inline'` (PR #51). Script anti-flash externalizado a `public/theme-init.js`.
- [x] Dashboard admin (AdminPage) con IngredientEditor
- [x] Visualización de sinergias con **SVG nativo** (SynergyGraph.tsx)
- [x] Búsqueda local con IngredientSearchService
- [x] Re-siembra automática de KB al detectar cambios de versión
- [x] Sistema de design UI propio en src/ui/ (Button, Input, Card, Modal, Badge, etc.)
- [x] Filtros combinables por chips (sistema corporal, evidencia, patología/indicación, categoría) — 23c5f70 + PR #46 (sistema + evidencia UI)
- [x] Base de datos de patologías (25 patologías con contexto clínico) — commit 77220e0
- [x] Modal PathologyDetail con tratamiento alopático vs natural + red flags
- [x] Contexto clínico extendido en 100% de patologías (116/116) — commits 8563969 + f2de1a0
  - 9 campos: epidemiologia, factoresRiesgo, diagnostico, criteriosDiagnostico,
    escalasClinicas, diagnosticoDiferencial, pronostico, poblacionesEspeciales,
    alertasFarmaceuticas
  - 1044 campos clínicos totales, escalas validadas (GAD-7, PHQ-9, MIDAS, PASI,
    DEXA/FRAX, FIB-4, SCORAD/EASI, WOMAC, Oswestry, y más)
  - Fuentes: DSM-5, ICD-11, NICE, ADA, GINA/GOLD, ESC/ESH, ACR, EAU, Cochrane, EMA
- [x] **Sync fail-fast en uploads 401** (PR #48) — tras `MAX_UPLOAD_401_FAILURES=3`
  consecutivos, `SyncService` desactiva el sync (la anon key solo permite lectura
  por RLS; la escritura requiere service role). Evita reintentos infinitos cada 30s.
- [x] **Purga de ops stale del outbox** (PR #52) — `cleanupStaleOutboxOps()` purga
  ops `synced` tras 1h y `failed` tras 24h, basado en `lastAttemptAt ?? createdAt`.
  Preserva `pending` y `conflict`. Se llama al final de `performFullSync`.
- [x] **Tope por-op en UnauthorizedError** (PR #52) — tras `maxRetries`, marca la
  op como `failed` en vez de re-encolarla para siempre (complementa el fail-fast
  global de PR #48).
- [x] **Tests unitarios del módulo E2EE** (PR #49) — `tests/unit/crypto.test.ts`
  cubre `deriveKey`, `secretbox` encrypt/decrypt, `generateAndStoreKeyPair`,
  `unlockKeyPair`, frase de recuperación.

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

### KB Expansion History (Rondas 1-17)

La KB se expandió en 17 rondas incrementales (ver `git log --oneline`):

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
| 16 | — | 593→610 | 1090→1113 | +17 ingredientes (ocular/urinario/reproductivo/hepático/endocrino), +23 sinergias, +70 sinónimos búsqueda |
| 17 | ec8aa14 | 610→625 | 1113→1154 | +15 ingredientes (mirtilo, aronia, olmaria, verbeno, pueraria, desmodium, achicoria, esquizandra, estevia, naranjo_amargo, sarmiento, 4 probióticos/prebióticos), +41 sinergias, +35 sinónimos búsqueda |

**Estado final:** 619 ingredientes (227 fito, 117 homeo, 83 aceites, 192
vitaminas/compuestos), 1157 sinergias, 0 huérfanos.
KB version: `v227-117-83-192-1157-146-126-n5`.

> **Nota ronda 18 (consolidación de duplicados):** Detectó 15 pares de
> ingredientes duplicados en la KB (mismo ingrediente con IDs diferentes,
> ej: `cola_caballo` vs `cola_de_caballo`, `diente_leon` vs `diente_de_leon`).
> Esto causaba matches inconsistentes en `product_ingredients` de Supabase:
> un producto con "Cola de Caballo" podía matchear a cualquiera de los dos
> IDs según el algoritmo, apareciendo como ingredientes diferentes en la UI.
> La consolidación mergeeó los datos (unión de sistemas, indicaciones,
> sinónimos), re-referenció 39 sinergias al ID canónico, y eliminó 10
> sinergias duplicadas/auto-referenciadas. El ID eliminado se conservó como
> sinónimo del canónico para mantener la búsqueda. Script:
> `scripts/consolidate-duplicates.py`. Pares consolidados:
> `diente_de_leon→diente_leon`, `olivo_hoja→olivo`,
> `cola_de_caballo→cola_caballo`, `vara_de_oro→solidago`,
> `marrubium→marrubio`, `picrorhiza→picrorrhiza`, `guggul→guggulu`,
> `damiana_hoja→damiana`, `ylang_ylang→ilang_ilang`, `clavo_aceite→clavo`,
> `l_triptofano→triptofano`, `pqq_pyrroloquinoline→pqq`,
> `nmn_nicotinamide→nmn`, `lactobacillus_acidophilus→l_acidophilus`,
> `bifidobacterium_longum→b_longum`.

> **Nota rondas 14-15:** La ronda 14 detectó que el estado real de la KB
> (537 ingredientes, 707 sinergias) difería del documentado en AGENTS.md
> (314/414) debido a expansiones previas no reflejadas. La ronda 14
> normalizó categorías/sistemas (146 ingredientes), eliminó 78 huérfanos
> con sinergias curadas, y limpió duplicados preexistentes (propoleo,
> shilajit, l_cisteina, sin_berberina_cromo, 3 refs inválidas a diosmina).
> La ronda 15 añadió ingredientes para sistemas poco cubiertos
> (ocular, urinario, reproductivo, hepático, endocrino).

> **Nota ronda 17:** Amplió sistemas poco representados (ocular 28→31,
> urinario 40→41, reproductivo 42→44, hepático 50→53, endocrino 57→59)
> y añadió 4 probióticos/prebióticos (L. rhamnosus GG, L. acidophilus,
> B. longum, arabinogalactano). Sinónimos coloquiales en `QUERY_SYNONYMS`
> (arandano→mirtilo, kudzu→pueraria, azahar/neroli→naranjo_amargo,
> vid/OPC→sarmiento, flora→probiótico, schisandra→esquizandra, etc.).

### Otros completados
- [x] Routing con react-router-dom v7 (con ProtectedRoute/AuthRoute — auth ACTIVO)
- [x] Toasts con sonner (ToastProvider)
- [x] Resolución de conflictos de sync (ConflictResolver)

### ✅ Auth E2EE — estado actual

- `BYPASS_AUTH` fue **ELIMINADO** de App.tsx (ya no existe el flag).
- La autenticación E2EE está **completamente activa**:
  - `ProtectedRoute` exige `isAuthenticated=true` (del `E2EEAuthProvider`).
  - `AuthRoute` redirige a `/` si ya estás autenticado (login/onboarding).
  - **Cada recarga de página requiere re-unlock** ("always require unlock at
    boot" en `E2EEAuthProvider.tsx:59`). El provider NO reactiva la sesión
    en mount; marca `isAuthenticated=false` y muestra LoginPage.
  - Navegar dentro de la SPA (links, no recarga) mantiene la sesión.
  - Sesión expira a 30 min de inactividad (`SESSION_TIMEOUT_MS`).
- Password de prueba: `test1234`.

### ⚠ Pendiente / Experimental / Deprecated
- [ ] Sync con Supabase (schema mismatch — ver nota abajo). src/core/sync/index.ts
      está marcado @deprecated y recomienda "verificar uso real".
      > **Estado actual (post-PRs #48 + #52):** El download funciona (ingredients,
      > synergies, pathologies, products). El upload tiene fail-fast: tras 3 fallos
      > 401 consecutivos (RLS bloquea escritura con anon key), el sync se desactiva.
      > El outbox se purga automáticamente (synced>1h, failed>24h). El upload real
      > requiere service role (no usada por la app).
- [ ] Tests de integración completos — la suite unitaria ahora cubre 288 tests
      (26 archivos en `tests/unit/` + `src/__tests__/`), pero faltan tests de
      integración end-to-end del flujo de sync real con Supabase.
- [x] ~~**Inconsistencia de storage en E2EE**~~ — RESUELTO (PR #53).
      `e2ee.ts` usaba localStorage (`vademecum.keypair`), pero
      `E2EEAuthProvider.recover` escribía en sessionStorage (`vademecum_keypair`).
      Tras un recovery, `unlockKeyPair` (que lee localStorage) no encontraba el
      keypair. Corregido: `recover` ahora delega a `storeKeyPair()` (nueva en
      e2ee.ts), que centraliza toda la lógica de storage en localStorage con
      las keys correctas. 5 tests de regresión en `crypto.test.ts`.
- [x] ~~src/core/audit/~~ y ~~src/core/auth/~~ — ELIMINADOS (stubs que re-exportaban
      tipos DbAuditLog/UserRole inexistentes; cero importadores).
- [x] ~~src/data/sync/~~ — ELIMINADO (@deprecated, cero importadores).
- [x] ~~src/lib/crypto/FieldEncryption.ts~~ — ELIMINADO (API de cifrado por campo, 315 líneas, cero consumidores).
- [x] ~~src/lib/crypto/KeyManager.ts~~ — ELIMINADO (consolidado en e2ee.ts).
- [x] ~~checkConnectivity()~~ — ELIMINADA (nunca llamada).
- [x] ~~src/lib/index.ts~~ barrel — ELIMINADO (nadie importaba desde @/lib).
- [x] ~~deps zod y class-variance-authority~~ — ELIMINADAS (sin uso en el código).
- [x] ~~BYPASS_AUTH~~ en App.tsx — ELIMINADO (auth E2EE completamente activo).

> **Nota sobre Supabase Sync:** El sync con Supabase era experimental, pero la conexión
> está ahora CONFIGURADA y VERIFICADA end-to-end (2026-08-14):
> - Proyecto: `lcoweosnhdkzogtmsfml` (URL + anon key en `.env.local`, gitignored).
> - `testConnection()` en `src/lib/supabase.ts` consulta `ingredients` (corregido: antes
>   apuntaba a la tabla inexistente `extended_ingredients`). Devuelve success desde la UI
>   (Settings → Sincronización → "Probar conexión" → "Conexión exitosa").
> - `SyncService.downloadRemoteChanges()` lee `ingredients` y `synergies` con
>   `eq('tombstone',0).gte('updated_at', lastSync)` y las mergea a Dexie. El mapeo
>   snake_case↔camelCase es manual en `mergeRemoteIngredient/Synergy` (correcto).
> - El download merge solo aplica si `remoteLamport > localLamport`. Como la KB seed
>   (local y remota) tiene `lamport:0`, el primer sync reporta 0 descargas — esto es
>   CORRECTO (no sobrescribe datos idénticos). Las descargas reales ocurren cuando un
>   registro remoto cambia su `lamport`/`updated_at`.
> - RLS permite a la anon key leer las 9 tablas (ingredients, synergies, pathologies,
>   products, product_ingredients, product_ingredient_analysis, protocols, snapshots,
>   sync_meta). Escritura requiere service role (no usada por la app, solo por seeders).
>
> **Bug resuelto (upload path):** `toSupabaseFormat()` en `src/core/sync/transform.ts`
> ahora (a) usa `toSnakeCase()` que maneja sufijos de palabra (`ingredienteA`→
> `ingrediente_a`) y grupos de mayúsculas consecutivas (`httpURL`→`http_url`), y
> (b) convierte `updatedAt`/`lastSyncAt` de `number` (epoch ms) a ISO string para
> las columnas `TIMESTAMPTZ` de Supabase (antes se enviaba un number, lo que
> rompería el upsert). Tests en `tests/unit/transform.test.ts`.
>
> NO existe SyncManager (fue eliminado); el servicio actual es SyncService.
>
> **Bug resuelto (product replication download path, 2026-08-15):**
> `ProductReplicator.replicateProducts()` usaba `.gt('updated_at', since)` para
> filtrar los productos a descargar. Como los productos seeded tienen
> `updated_at = '1970-01-01T00:00:00Z'` (epoch) y el `since` por defecto es
> exactamente esa misma fecha, `.gt()` (estrictamente mayor) excluía TODOS los
> productos → 0 descargas, catálogo vacío en IndexedDB. Corregido a `.gte()`
> (mayor o igual). Verificado: con `.gt()` → 0 productos; con `.gte()` → 1297.
> El upsert es idempotente, así que re-descargar filas sin cambios no daña.
>
> **Credenciales Supabase:** La app necesita `VITE_SUPABASE_ANON_KEY` (clave
> publishable, segura para frontend) en `.env.local`. Si solo se tiene la
> `sb_secret_...` (service_role), esta bypassa RLS y NO debe ir en el frontend.
> El `.env.local` está gitignored. SyncService y ProductReplicator ahora
> detectan el error 401 y desactivan el sync con un mensaje claro en vez de
> spammear errores de red cada 30s.
>
> **SynergySearchService (2026-08-15):** Nuevo servicio gemelo de
> IngredientSearchService/ProductSearchService que indexa `db.synergies` en el
> mismo `InvertedIndex` (fuzzy Levenshtein + TF-IDF + facets). Permite buscar
> sinergias por nombre de ingrediente con tolerancia a typos ("valerina"→
> "valeriana"), filtrar por tipo (sinergia/complemento/interacción/antagonismo)
> y por evidencia (A/B/C/D). SynergiesPage reescrito para usarlo con paginación
> (24 cards por página, antes renderizaba 1171 a la vez).
>
> **Sync de patologías (2026-08-15):** `downloadRemoteChanges()` ahora descarga
> también la tabla `pathologies` de Supabase (146 patologías con contexto clínico
> extendido). Implementación:
> - `'pathologies'` añadido a `SYNC_TABLES` en `shared-enums.ts` (habilita
>   uploads vía outbox pattern).
> - `mergeRemotePathology()` en `SyncService.ts` mapea las columnas snake_case
>   de Supabase (`tratamiento_alopatico`, `escalas_clinicas`,
>   `poblaciones_especiales`, etc.) al schema camelCase `DbPathology`, con
>   defaults seguros para los campos opcionales de contexto clínico.
> - Usa el mismo patrón de merge Lamport-based que ingredients/synergies:
>   descarga solo si `remoteLamport > localLamport` (o si no existe local),
>   y detecta conflictos vía `ConflictResolver`.
> - Usa `.gte('updated_at', lastSyncDate)` (no `.gt()`) — mismo fix que
>   ProductReplicator, evita excluir filas seeded con `updated_at=epoch`.
> - `toSupabaseFormat()` ahora convierte también `createdAt` a ISO string
>   (antes solo `updatedAt`/`lastSyncAt`; `created_at` es TIMESTAMPTZ en
>   Supabase).
> - Como las patologías seeded (local y remota) tienen `lamport:0`, el primer
>   sync reporta 0 descargas para IDs ya existentes — esto es CORRECTO (no
>   sobrescribe datos idénticos). Las descargas reales ocurren cuando un
>   registro remoto incrementa su `lamport`/`updated_at`.

## Filtros de Búsqueda (UI)

Los filtros de SearchPage están **completos** y son combinables (AND):
patología/indicación, categoría, **sistema corporal** y **evidencia**.
La configuración visual (iconos + labels) vive en `src/ui/searchConfig.ts`
(`CATEGORIES`, `BODY_SYSTEM_CHIPS`, `EVIDENCE_LEVELS`).

### Filtro por Sistema Corporal
- Campo: `sistemas` (array)
- Valores: 13 sistemas del enum `BODY_SYSTEMS` (normalizados ronda 12)
- Datos listos: 0 sistemas inválidos
- UI: chips con icono en SearchPage (commit f9b07a9, PR #46)

### Filtro por Patología / Indicación
- Campo: `indicaciones` (array)
- Valores: etiquetas estandarizadas (normalizadas ronda 13)
- Top: ansiedad(48), inmunidad(45), estrés(41), dispepsia(40), tos(40),
  insomnio(37), articular(35), antioxidante(31), piel(29), cognitivo(27)
- Datos listos: 275 etiquetas estandarizadas

### Filtro por Evidencia
- Campo: `evidencia` (`'A' | 'B' | 'C' | 'D'`)
- UI: chips A/B/C/D en SearchPage (commit f9b07a9, PR #46)

### Combinación
Todos los filtros se combinan con AND (ej: sistema=respiratorio +
patología=tos + evidencia=A). El facet filtering vive en
`IngredientSearchService.runSearch` (`SearchFilters.system` /
`.evidenceLevel` / `.category` / `.indication`). Ver
`docs/KB_DATA_METHODOLOGY.md` § 14 para detalles.

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

El motor de búsqueda (`src/core/search/searchEngine.ts` + `IngredientSearchService.ts`
+ `ProductSearchService.ts` + `SynergySearchService.ts` + `src/lib/text.ts`) combina 6 capas de matching,
todas 100% offline e instantáneas (sin LLM, sin descargas de modelos):

> **searchEngine.ts** es el núcleo compartido genérico (índice invertido + DF +
> TF-IDF + fuzzy Levenshtein + expansión de sinónimos/bigramas). Tanto
> `IngredientSearchService`, `ProductSearchService` como `SynergySearchService` delegan en él, de modo
> que "valerina" (typo) encuentra el ingrediente "valeriana", el producto
> "Ungüento Valeriana" Y las sinergias de valeriana con la misma tolerancia. Cada servicio solo define los
> pesos por campo y facets específicos de su dominio.

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

## Historial de PRs Recientes (2026-08-16)

Los siguientes PRs se mergearon en `main` (squash-merge) en una sesión de
mantenimiento estructurado. Todos con CI 100% verde (7/7 checks cada uno).

| PR | Título | Tipo | Cambios clave |
|----|--------|------|---------------|
| #45 | `fix(ui): abrir ProductDetail con el producto del resultado, no del cache` | fix | Modal `ProductDetail` usa el `DbProduct` del scope en vez de re-buscar en cache (fallaba intermitentemente durante rebuilds del índice) |
| #47 | `fix(kb): integridad referencial y limpieza de datos de la KB` | fix | Valida referencias de sinergias, limpia datos inconsistentes, tests de integridad |
| #48 | `fix(sync): fail-fast en uploads 401 para evitar reintentos infinitos` | fix | `MAX_UPLOAD_401_FAILURES=3`; tras 3 fallos 401 consecutivos, desactiva sync (RLS bloquea escritura con anon key) |
| #49 | `test(crypto): tests unitarios del módulo E2EE` | test | `tests/unit/crypto.test.ts` — deriveKey, secretbox, keypair, recovery |
| #50 | `docs(agents): sincronizar AGENTS.md con el código real` | docs | Corrige BYPASS_AUTH (eliminado), KeyManager.ts (no existe), storage de claves, documenta bug de inconsistencia en recovery |
| #51 | `fix(security): CSP sin 'unsafe-inline' en script-src` | fix | Inline script anti-flash → `public/theme-init.js`; CSP endurecida; ESLint globals para `public/**/*.js` |
| #52 | `fix(sync): purgar ops stale del outbox + respetar maxRetries en 401` | fix | `cleanupStaleOutboxOps()` (synced>1h, failed>24h); UnauthorizedError respeta maxRetries por-op; 7 tests nuevos |

**Estado de `main` post-merge:** commit `3a7ef05`. Suite de tests: 283 tests
(26 archivos), 2 skipped. tsc clean, build OK, E2E OK.
