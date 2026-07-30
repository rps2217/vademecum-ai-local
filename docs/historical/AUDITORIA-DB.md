# 🔍 AUDITORÍA TÉCNICA - Capa de Base de Datos

> **Fecha:** Julio 2026  
> **Auditor:** OpenHands Agent  
> **Versión analizada:** v2.2.0

---

## 0. Resumen Ejecutivo

| Área | Estado | Criticidad |
|------|--------|------------|
| Schema Dexie | ✅ Implementado correctamente | - |
| DbProvider | ⚠️ Funciona pero incompleto | Media |
| Seeder | ✅ Carga 217+ ingredientes | - |
| Servicio de Busqueda | ⚠️ Uso inconsistente | Alta |
| Servicio de Sincronización | ⚠️ Esqueleto sin implementar | Alta |
| Uso directo de `db` | ❌ Inconsistente en páginas | Alta |
| Tests | ❌ Fallan (mock incompleto) | Alta |
| Índices | ⚠️ Definidos pero no usados | Media |
| Limpieza de datos | ❌ No implementada | Baja |

---

## 1. Schema de Base de Datos (Dexie)

### 1.1 Evaluación ✅

El schema en `src/db/schema.ts` está bien diseñado:

```typescript
// Tablas definidas
- products (sku)
- ingredients (id)
- synergies (id)
- protocols (id)
- outbox (id)
- snapshots (id)
- syncMeta (key)
- searchHistory (id)
```

**Fortalezas:**
- Tipos TypeScript completos
- Timestamps y metadatos de sync (Lamport clock)
- Índices definidos para consultas frecuentes
- Device ID único persistido

**Debilidades:**
- Los índices compuestos no se declaran correctamente en Dexie 4
- Falta índice en `sistemas` para ingredientes

### 1.2 Recomendación

```typescript
// En schema.ts, cambiar:
this.version(DB_VERSION).stores({
  // Agregar índice para sistemas
  ingredients: 'id, categoria, evidencia, updatedAt, tombstone',
  'ingredients[sistemas]': 'sistemas', // ← AGREGAR
});
```

---

## 2. DbProvider

### 2.1 Evaluación ⚠️

**Ubicación:** `src/app/DbProvider.tsx`

**Lo que hace:**
```typescript
- Abre la base de datos
- Verifica si KB está seedeada
- Si no, ejecuta seedKnowledgeBase()
- Expone isReady, error, stats
```

**Problemas identificados:**

| Problema | Descripción | Impacto |
|----------|-------------|---------|
| Sin retry logic | Si falla el open, solo registra error | Alta |
| Sin cleanup de outbox | Operaciones pendientes no se limpian | Media |
| Sin verificación de version | No migra datos si cambia el schema | Alta |
| No expone db instance | Las páginas usan `db` directamente | Media |

### 2.2 Código actual (parcial)

```typescript
// DbProvider.tsx
useEffect(() => {
  async function initDb() {
    try {
      await db.open();
      const seeded = await isKnowledgeBaseSeeded();
      if (!seeded) {
        await seedKnowledgeBase();
      }
      setIsReady(true);
    } catch (err) {
      setError(err);
    }
  }
  initDb();
}, []);
```

### 2.3 Recomendación

```typescript
// Mejorar DbProvider:
useEffect(() => {
  async function initDb() {
    try {
      // 1. Verificar versión y migrar si es necesario
      const currentVersion = localStorage.getItem('db_version');
      if (currentVersion !== String(DB_VERSION)) {
        await migrateIfNeeded(currentVersion, DB_VERSION);
        localStorage.setItem('db_version', String(DB_VERSION));
      }
      
      // 2. Abrir DB
      await db.open();
      
      // 3. Limpiar outbox antiguo
      await cleanupOutbox();
      
      // 4. Seed si necesario
      const seeded = await isKnowledgeBaseSeeded();
      if (!seeded) {
        await seedKnowledgeBase();
      }
      
      setIsReady(true);
    } catch (err) {
      setError(err);
      // Retry logic
      setTimeout(initDb, 5000);
    }
  }
  initDb();
}, []);
```

---

## 3. Seeder (KnowledgeSeeder)

### 3.1 Evaluación ✅

**Ubicación:** `src/db/seeders/knowledgeSeeder.ts`

**Funciona correctamente:**
- Carga 5 archivos JSON
- Transforma datos al schema
- Muestra logs de progreso

**Datos cargados:**

| Archivo | Ingredientes | Estado |
|---------|--------------|--------|
| fitoterapia.json | ~35 | ✅ |
| homeopatia.json | ~15 | ✅ |
| aceites.json | ~12 | ✅ |
| vitaminas_minerales.json | ~12 | ✅ |
| sinergias.json | ~40 | ✅ |
| **Total** | **~217** | ✅ |

### 3.2 Problemas identificados

| Problema | Descripción | Impacto |
|----------|-------------|---------|
| Sin bulk delete | No hay forma de resetear KB | Media |
| Sin verificación de integridad | No valida datos | Baja |
| Sin logging detallado | Solo console.log | Baja |
| Mapeo de categorías débil | Usa fallback 'fitoterapia' | Baja |

### 3.3 Mapeo de categorías (actual)

```typescript
function mapCategory(cat: string): IngredientCategory {
  const map = { /* ... */ };
  return map[cat] || 'fitoterapia'; // ← Fallback incorrecto
}
```

**Recomendación:** Lanzar error en vez de fallback silencioso.

---

## 4. Servicio de Búsqueda

### 4.1 Evaluación ⚠️

**Ubicación:** `src/core/search/IngredientSearchService.ts`

**Fortalezas:**
- Scoring de resultados (exact, fuzzy, synonym)
- Filtros por categoría, sistema, evidencia
- findSynergies implementado

**Debilidades:**

| Problema | Descripción | Impacto |
|----------|-------------|--------|
| No usa índices | `toArray()` luego `filter()` | Alta |
| No usa `where()` | Ignora índices definidos | Alta |
| Sin paginación | Carga todo en memoria | Media |
| Sin caché | Cada búsqueda recarga | Media |

### 4.2 Código problemático

```typescript
// IngredientSearchService.ts - INCORRECTO
async search(filters: SearchFilters): Promise<SearchResult[]> {
  // Carga TODOS los ingredientes
  let ingredients = await db.ingredients.toArray(); // ← LENTO
  
  // Filtra en memoria (no usa índices)
  if (category) {
    ingredients = ingredients.filter(i => i.categoria === category); // ← NO USA ÍNDICE
  }
  // ...
}
```

### 4.3 Recomendación

```typescript
// CORRECTO - Usar where() e índices
async search(filters: SearchFilters): Promise<SearchResult[]> {
  let collection = db.ingredients.toCollection();
  
  // Usar índice si hay filtro de categoría
  if (filters.category) {
    collection = db.ingredients.where('categoria').equals(filters.category);
  }
  
  const ingredients = await collection.toArray();
  // Ahora filtrar en memoria solo los campos sin índice
  // ...
}
```

---

## 5. Uso Directo de `db` en Páginas

### 5.1 Evaluación ❌

**Problema crítico:** Las páginas importan `db` directamente en lugar de usar el servicio.

**Archivos afectados:**

| Archivo | Uso | Problema |
|---------|-----|----------|
| HomePage.tsx | ✅ Correcto (stats) | Aceptable |
| KnowledgePage.tsx | ❌ Directo | Inconsistente |
| SynergiesPage.tsx | ❌ Directo | Inconsistente |
| AdminPage.tsx | ✅ Correcto | Aceptable |
| SearchPage.tsx | ✅ Correcto | Usa servicio |

### 5.2 Código problemático

```typescript
// KnowledgePage.tsx - PROBLEMA
useEffect(() => {
  async function loadIngredients() {
    const all = await db.ingredients.toArray(); // ← Directo
    // filtrado manual...
  }
}, [query, category]);
```

```typescript
// Debería usar el servicio:
useEffect(() => {
  async function loadIngredients() {
    const results = await ingredientSearchService.search({ 
      query, 
      category 
    });
    setIngredients(results.map(r => r.ingredient));
  }
}, [query, category]);
```

### 5.3 Recomendación

1. **Opción A:** Refactorizar páginas para usar `ingredientSearchService`
2. **Opción B:** Crear hooks especializados `useIngredients`, `useSynergies`

```typescript
// hooks/useIngredients.ts
export function useIngredients(filters?: SearchFilters) {
  const [ingredients, setIngredients] = useState<DbIngredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const results = await ingredientSearchService.search(filters || {});
      setIngredients(results.map(r => r.ingredient));
      setIsLoading(false);
    }
    load();
  }, [JSON.stringify(filters)]);
  
  return { ingredients, isLoading };
}
```

---

## 6. Servicio de Sincronización

### 6.1 Evaluación ⚠️

**Ubicación:** `src/core/sync/SyncService.ts`

**Estado:** Esqueleto implementado, sin conexión real a Supabase.

**Lo que funciona:**
- ✅ Patrón outbox
- ✅ Estados (pending, in_flight, synced, failed)
- ✅ Listeners online/offline
- ✅ Snapshots locales

**Lo que falta:**

| Funcionalidad | Estado | Prioridad |
|---------------|--------|-----------|
| Conexión Supabase | ❌ No implementada | Alta |
| Sync bidireccional | ❌ No implementada | Alta |
| Resolución de conflictos | ❌ No implementada | Alta |
| Retry con backoff | ⚠️ Básica | Media |
| Observabilidad | ❌ No hay logs | Media |

### 6.2 Código actual

```typescript
// SyncService.ts - INCOMPLETO
private async syncOp(op: DbOutboxOp): Promise<void> {
  if (!this.config.enabled || !this.config.supabaseUrl) {
    op.status = 'synced'; // ← Fake sync
    await db.outbox.put(op);
    return;
  }
  // Supabase no implementado
}
```

### 6.3 Recomendación

Implementar conexión real a Supabase o documentar que sync no está disponible.

```typescript
// Implementación mínima para Supabase
private async syncToSupabase(op: DbOutboxOp): Promise<void> {
  const { supabaseUrl, supabaseKey } = this.config;
  if (!supabaseUrl || !supabaseKey) return;
  
  const endpoint = `${supabaseUrl}/rest/v1/${op.table}`;
  const response = await fetch(endpoint, {
    method: op.type === 'delete' ? 'DELETE' : 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(op.payload),
  });
  
  if (!response.ok) throw new Error('Sync failed');
}
```

---

## 7. Tests de Base de Datos

### 7.1 Evaluación ❌

**Estado:** Los tests fallan.

```bash
$ npm run test
❌ ReferenceError: indexedDB is not defined
```

### 7.2 Problema

El mock en `src/test/setup.ts` es incompleto:

```typescript
// setup.ts - INCOMPLETO
const mockIndexedDB = {
  open: () => Promise.resolve({}),
  // Faltan: createObjectStore, transaction, etc.
};
indexedDB = mockIndexedDB;
```

### 7.3 Recomendación

Usar `fake-indexeddb` para testing real:

```bash
npm install --save-dev fake-indexeddb
```

```typescript
// setup.ts - CORRECTO
import 'fake-indexeddb/auto';
```

---

## 8. Índices Definidos vs Usados

### 8.1 Estado

Los índices están definidos pero NO se usan:

```typescript
// schema.ts - DEFINIDOS
this.version(DB_VERSION).stores({
  ingredients: 'id, categoria, evidencia, updatedAt, tombstone',
  'ingredients[nombre]': '', // ← Índice en nombre
});

// Pero en search se hace:
await db.ingredients.toArray(); // ← NO USA ÍNDICE
.then(items => items.filter(i => i.nombre.includes(q))); // ← Filter manual
```

### 8.2 Recomendación

Usar `where()` para aprovechar índices:

```typescript
// Búsqueda por nombre - CORRECTO
const results = await db.ingredients
  .where('nombre')
  .startsWithIgnoreCase(query)
  .toArray();

// Búsqueda por categoría
const results = await db.ingredients
  .where('categoria')
  .equals(category)
  .toArray();
```

---

## 9. Mejoras Recomendadas - Priorizadas

### Alta Prioridad

| # | Mejora | Impacto | Esfuerzo |
|---|--------|---------|-----------|
| 1 | Usar `fake-indexeddb` para tests | Corrige tests | Bajo |
| 2 | Refactorizar páginas para usar servicio | Consistencia | Medio |
| 3 | Implementar conexión Supabase o deshabilitar | Sync real | Alto |
| 4 | Usar índices en búsquedas | Performance | Medio |

### Media Prioridad

| # | Mejora | Impacto | Esfuerzo |
|---|--------|---------|-----------|
| 5 | Agregar retry logic en DbProvider | Robustez | Bajo |
| 6 | Agregar paginación en search | Performance | Medio |
| 7 | Implementar verificación de versión DB | Migraciones | Medio |
| 8 | Agregar índices para sistemas | Performance | Bajo |

### Baja Prioridad

| # | Mejora | Impacto | Esfuerzo |
|---|--------|---------|-----------|
| 9 | Logging estructurado | Observabilidad | Bajo |
| 10 | Documentar limitaciones de sync | Claridad | Bajo |
| 11 | Agregar cache en búsquedas | Performance | Medio |

---

## 10. Plan de Implementación

### Sprint 1: Correcciones Críticas (2h)

```bash
# 1. Fix tests
npm install --save-dev fake-indexeddb

# 2. Actualizar setup.ts
# 3. Verificar tests pasan
npm run test

# 4. Crear hooks/useIngredients.ts
# 5. Refactorizar HomePage y KnowledgePage
```

### Sprint 2: Optimización (4h)

```bash
# 1. Optimizar IngredientSearchService para usar índices
# 2. Agregar paginación
# 3. Implementar cache simple
# 4. Tests de performance
```

### Sprint 3: Sync (8h)

```bash
# 1. Decidir: implementar Supabase o deshabilitar
# 2. Si implementar: conectar SyncService
# 3. Tests E2E de sync
# 4. Documentar limitaciones
```

---

## 11. Métricas de Salud

| Métrica | Actual | Objetivo |
|---------|--------|----------|
| Tests pasando | 0/3 | 3/3 |
| Uso de índices | 0% | 100% |
| Páginas usando servicio | 2/5 | 5/5 |
| Sync implementado | 0% | 100% o 0% (documentado) |
| Cobertura tests | ~10% | >50% |

---

## 12. Conclusión

La capa de base de datos tiene una **buena base** (schema, tipos, seeder) pero presenta **problemas críticos** en:

1. **Consistencia:** Uso mixto de `db` directo y servicios
2. **Performance:** No se usan índices, se carga todo en memoria
3. **Testing:** Tests no funcionan
4. **Sync:** No está implementado

Las mejoras de **Alta Prioridad** pueden completarse en ~4 horas de trabajo.

---

## Anexo: Archivos Analizados

```
src/db/
├── schema.ts              # Schema Dexie completo
├── index.ts               # Exports
└── seeders/
    ├── index.ts           # Exports
    ├── knowledgeSeeder.ts  # Seeder KB
    └── data/              # JSON datos
        ├── fitoterapia.json
        ├── homeopatia.json
        ├── aceites.json
        ├── vitaminas_minerales.json
        └── sinergias.json

src/core/
├── search/
│   └── IngredientSearchService.ts
└── sync/
    └── SyncService.ts

src/app/
└── DbProvider.tsx

src/pages/
├── HomePage.tsx
├── KnowledgePage.tsx
├── SearchPage.tsx
├── SynergiesPage.tsx
└── AdminPage.tsx

src/__tests__/
└── db.test.ts
```
