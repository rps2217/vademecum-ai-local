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
│   └── providers.tsx             # Composición de providers
├── components/
│   ├── admin/                    # Dashboard de administración
│   │   ├── SynergyGraph.tsx      # Visualización de red SVG
│   │   └── IngredientEditor.tsx  # Editor de ingredientes
│   ├── layout/                   # Layout principal
│   │   └── AppShell.tsx          # Shell de la app
│   └── sync/                     # Componentes de sync
│       └── SyncStatusBar.tsx     # Barra de estado de sync
├── core/
│   ├── search/                   # Motor de búsqueda
│   │   ├── IngredientSearchService.ts  # Servicio de búsqueda
│   │   └── index.ts
│   └── sync/                     # Motor de sincronización
│       ├── SyncService.ts        # Servicio de sync
│       └── index.ts
├── data/
│   ├── adapters/                 # Adaptadores de datos
│   │   ├── IngredientAdapter.ts  # Adaptador para ingredientes
│   │   ├── ProductAdapter.ts    # Adaptador para productos
│   │   ├── SynergyAdapter.ts    # Adaptador para sinergias
│   │   ├── ProtocolAdapter.ts   # Adaptador para protocolos
│   │   └── types.ts             # Tipos compartidos
│   └── sync/                     # Gestor de sincronización
│       └── SyncManager.ts       # Manager de sync (28KB)
├── db/                          # Base de datos Dexie
│   ├── schema.ts                # Schema de la DB
│   ├── index.ts                 # Exports
│   └── seeders/                 # Seeders de datos
│       ├── index.ts
│       └── knowledgeSeeder.ts   # Seeder de KB
├── lib/
│   ├── crypto/                  # Criptografía E2E
│   │   └── e2ee.ts              # Funciones de cifrado
│   └── logger.ts                # Logger centralizado
├── pages/                       # Páginas de la app
│   ├── HomePage.tsx
│   ├── SearchPage.tsx
│   ├── SynergiesPage.tsx
│   ├── KnowledgePage.tsx
│   ├── AdminPage.tsx
│   ├── SettingsPage.tsx
│   ├── LoginPage.tsx
│   ├── OnboardingPage.tsx
│   └── AnalysisPage.tsx
└── hooks/                       # Hooks personalizados
    ├── useAccessibility.tsx
    └── index.ts
```

## Tecnologías Principales

- **React 19** + TypeScript
- **Tailwind CSS** para estilos
- **Dexie** (IndexedDB wrapper) para almacenamiento local
- **Transformers.js** para embeddings (100% local)
- **Supabase** para sincronización (opcional, experimental)
- **PWA** para uso offline
- **TweetNaCl** para E2EE (cifrado de extremo a extremo)
- **@xyflow/react** para visualización de red SVG

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
- `snapshots` - Backups cifrados
- `syncMeta` - Metadatos de sincronización
- `searchHistory` - Historial de búsquedas

## Estado de Implementación

### ✅ Completado
- [x] PWA con Service Worker (vite-plugin-pwa)
- [x] Base de datos Dexie (IndexedDB) con schema v2
- [x] Sistema de sync bidireccional (SyncManager + SyncService)
- [x] E2EE con TweetNaCl (claves en sessionStorage)
- [x] CSP (Content Security Policy)
- [x] Dashboard admin (AdminPage)
- [x] Visualización de sinergias con @xyflow/react
- [x] Búsqueda local con IngredientSearchService

### 🔄 Pendiente / Experimental
- [ ] Sync con Supabase (schema mismatch - ver nota abajo)
- [ ] Tests de integración completos

> **Nota sobre Supabase Sync:** El sync con Supabase es experimental. Existen diferencias de schema entre Dexie (local) y PostgreSQL (remoto) que deben resolverse en una versión futura.

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

// O usando clases con getInstance
export const syncManager = SyncManager.getInstance();
```
