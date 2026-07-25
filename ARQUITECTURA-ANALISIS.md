# Análisis de Arquitectura - Vademecum AI Local

## 📊 Estado Actual

### Estructura de Archivos
```
src/
├── components/           # Componentes React
│   ├── layout/          # Dashboard, Layouts
│   ├── product/        # Cards de productos
│   ├── common/          # Componentes compartidos
│   ├── ui/             # Componentes UI base
│   └── ...
├── services/            # Lógica de negocio (37 servicios)
├── core/                # Nucleo compartido
├── data/                # Datos estáticos (KB)
├── hooks/               # Custom hooks
├── store/               # Estado global
├── pages/               # Páginas
└── utils/               # Utilidades
```

---

## 🔴 PROBLEMAS CRÍTICOS

### 1. **Componente DashboardSimple.tsx Monolítico (~1600+ líneas)**
```
❌ Problema: Un solo archivo massive que hace TODO
   - Navegación
   - Búsqueda
   - Scraping
   - Análisis de productos
   - Vista de catálogo
   - Vista de sinergias
   - Gestión de estado local
   - Llamadas a múltiples servicios

✅ Oportunidad: Dividir en componentes más pequeños
```

### 2. **Duplicación de Servicios**
```
❌ Servicios similares pero diferentes:
- KnowledgeService.ts      → Análisis local de KB
- KnowledgeSyncService.ts  → Sincronización con Supabase
- KnowledgeAnalysisService.ts → Análisis avanzado (IA)
- SynergyBackgroundService.ts → Sinergias en background
- SupabaseSynergiesService.ts → Sinergias en Supabase

✅ Oportunidad: Unificar en un solo KnowledgeService modular
```

### 3. **Falta de Tipos Centralizados**
```
❌ Tipos definidos en múltiples lugares:
- Product interfaces en varios archivos
- Tipos de scraping dispersos
- AnalyzedProduct redefinido en Dashboard

✅ Oportunidad: Centralizar en src/types/
```

### 4. **Carga de KB Ineficiente**
```
❌ Problema: KB cargada múltiples veces
- KnowledgeService.ts → getAllIngredients()
- Dashboard → getCombinedKnowledgeBase()
- ProductCategorizationService →Otra carga

✅ Oportunidad: Cache centralizado con Zustand/React Query
```

---

## 🟡 PROBLEMAS MEDIOS

### 5. **Estado Fragmentado**
```
❌ Estado en múltiples lugares:
- useState locales en componentes
- localStorage para cache
- Zustand store
- Context API

✅ Oportunidad: Estado unificado con Zustand
```

### 6. **Business Logic en Componentes**
```
❌ Lógica de negocio en JSX:
- analyzeProduct() dentro del componente
-Categorización en el momento de render
- Filtros de búsqueda en el componente

✅ Oportunidad: Mover a servicios/hooks
```

### 7. **Sin Tests**
```
❌ No hay tests configurados (vitest está en package.json pero no se usa)

✅ Oportunidad: Agregar tests unitarios para servicios
```

### 8. **Bundle Size Grande**
```
⚠️ Warning: 728KB bundle después de minificar
- Todo en un solo chunk
- Sin code splitting
- KB grande embebida

✅ Oportunidad: Lazy loading + chunks
```

---

## 🟢 MEJORAS RECOMENDADAS

### Fase 1: Limpieza (1-2 horas)
```typescript
// 1. Crear archivo de tipos centralizado
src/types/index.ts
├── Product
├── AnalyzedProduct  
├── KbIngredient
├── Synergy
└── Category

// 2. Unificar servicios de conocimiento
src/services/KnowledgeService.ts
├── analyzeIngredients()
├── syncWithCloud()
├── getLocalCache()
└── mergeBases()
```

### Fase 2: Componentes (2-3 horas)
```typescript
// Dividir DashboardSimple en:
src/components/dashboard/
├── DashboardSimple.tsx        # Orquestador
├── Header.tsx               # Barra de búsqueda
├── ProductGrid.tsx            # Lista de productos
├── ProductFilters.tsx         # Filtros
├── SyncStatus.tsx            # Estado de sincronización
├── ScrapingPanel.tsx         # Panel de scraping
└── views/
    ├── CatalogView.tsx
    ├── SynergiesView.tsx
    └── SettingsView.tsx
```

### Fase 3: Estado (1-2 horas)
```typescript
// Zustand store unificado
src/store/useAppStore.ts
├── products: AnalyzedProduct[]
├── kbIngredients: KbIngredient[]
├── syncStatus: SyncStatus
├── filters: ProductFilters
└── actions:
    ├── loadProducts()
    ├── syncKnowledgeBase()
    ├── categorizeProduct()
    └── scrapeProduct()
```

### Fase 4: Optimización (1 hora)
```typescript
// Code splitting
const SynergiesView = lazy(() => import('./views/SynergiesView'));
const CatalogView = lazy(() => import('./views/CatalogView'));

// KB como chunk separado
export default defineConfig({
  rollupOptions: {
    output: {
      manualChunks: {
        'kb': ['./src/data/knowledge-base.json'],
        'vendor': ['react', 'react-dom', 'lucide-react']
      }
    }
  }
})
```

---

## 📈 Métricas de Éxito

| Métrica | Actual | Objetivo |
|---------|--------|----------|
| Líneas DashboardSimple | ~1600 | <300 |
| Servicios duplicados | 5 | 1-2 |
| Bundle size | 728KB | <400KB |
| Test coverage | 0% | >60% |
| Tiempo de carga | ? | <2s |

---

## 🎯 Priorización

1. **Alta prioridad**: Dividir DashboardSimple
2. **Alta prioridad**: Centralizar tipos
3. **Media prioridad**: Zustand store
4. **Media prioridad**: Code splitting
5. **Baja prioridad**: Tests (largo plazo)
