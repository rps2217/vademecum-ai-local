# AGENTS.md - Vademecum AI

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
- [x] Base de datos Dexie (IndexedDB) con schema **versión 1**
- [x] E2EE con TweetNaCl (claves en sessionStorage) — e2ee.ts, KeyManager.ts, FieldEncryption.ts
- [x] CSP (Content Security Policy)
- [x] Dashboard admin (AdminPage) con IngredientEditor
- [x] Visualización de sinergias con **SVG nativo** (SynergyGraph.tsx)
- [x] Búsqueda local con IngredientSearchService
- [x] Re-siembra automática de KB al detectar cambios de versión
- [x] Sistema de design UI propio en src/ui/ (Button, Input, Card, Modal, Badge, etc.)

### Re-siembra Automática de KB

El seeder (`src/db/seeders/knowledgeSeeder.ts`) detecta automáticamente
cuando los datos JSON cambiaron y re-siembra la KB sin borrar datos del
usuario. Mecanismo:

1. `computeKbVersion()` calcula un hash de versión desde los conteos de
   los JSON (`v{fito}-{homeo}-{aceites}-{vitaminas}-{sinergias}`)
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
