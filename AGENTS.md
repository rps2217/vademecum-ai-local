# AGENTS.md - Vademecum AI

## Descripción del Proyecto

**Vademecum AI** es una aplicación web para consultoras de farmacia que proporciona:
- Búsqueda de medicamentos con información detallada
- Base de conocimiento de ingredientes (homeopatía, fitoterapia, suplementos)
- Detección de sinergias y antagonismos entre ingredientes
- Alertas de seguridad en tiempo real
- Búsqueda semántica inteligente

## Arquitectura

```
src/
├── core/
│   ├── ingredient-database/     # Base de conocimiento de ingredientes
│   ├── knowledge-base/         # Base de conocimiento de medicamentos
│   ├── semantic-search/         # Búsqueda semántica con embeddings
│   ├── sync/                   # Sincronización con Supabase
│   └── categorization/         # Categorización de productos
├── components/
│   ├── ui/                     # Componentes UI
│   ├── layout/                 # Layout del dashboard
│   └── product/                # Modal de detalle de producto
├── hooks/                      # Custom React hooks
├── services/                   # Servicios (búsqueda, scraping, sync)
└── store/                      # Zustand stores
```

## Tecnologías Principales

- **React 18** + TypeScript
- **Tailwind CSS** para estilos
- **Zustand** para estado global
- **Dexie.js** para IndexedDB
- **Ollama** para embeddings (opcional)
- **Supabase** para sincronización (opcional)

## Comandos Importantes

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Previsualizar build
npm run preview
```

## Variables de Entorno

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave
```

## Endpoints de Ollama

```env
OLLAMA_URL=http://localhost:11434
EMBEDDING_MODEL=nomic-embed-text
```

## Estado de Implementación

### ✅ Implementado
- [x] Dashboard minimalista inspirado en appsimple
- [x] Búsqueda con type-ahead
- [x] Base de conocimiento de 157+ medicamentos
- [x] Base de conocimiento de 20+ ingredientes
- [x] Detección de sinergias
- [x] Modal de detalle de producto
- [x] Sincronización con Supabase (opcional)
- [x] Búsqueda semántica con Ollama (opcional)
- [x] Sistema de alertas de seguridad

### 🔄 En Progreso
- [ ] PWA completo para uso offline
- [ ] Base de datos expandida de ingredientes

## Patrones de Código

### Store de Zustand
```typescript
import { create } from 'zustand';

interface AppState {
  products: Product[];
  setProducts: (products: Product[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  products: [],
  setProducts: (products) => set({ products }),
}));
```

### Componente con useMemo
```typescript
const expensiveResult = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);
```

### Servicio de Búsqueda
```typescript
// Los servicios van en src/services/
// Usar clases singleton exportadas como default
export const searchService = new SearchService();
```
