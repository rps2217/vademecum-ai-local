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
- **Transformers.js** para embeddings (sin Ollama, 100% local)
- **Supabase** para sincronización (opcional)
- **PWA** para uso offline

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

## Búsqueda Semántica

La aplicación soporta búsqueda semántica sin necesidad de Ollama:

### Proveedores disponibles (en orden de prioridad):

1. **Transformers.js** (recomendado, 100% local)
   - Modelo: `Xenova/transformers-mlnl6`
   - ~50MB (se descarga una vez)
   - Funciona offline
   - Indicador: "IA Local" en header

2. **Fallback: Búsqueda Fuzzy Mejorada**
   - Sin modelo de IA
   - Usa sinónimos predefinidos
   - Indicador: "Búsqueda Rápida" en header

### Sinónimos soportados:

```javascript
{
  'dormir': ['insomnio', 'sueño', 'hipnótico', 'sedante'],
  'dolor': ['analgesia', 'antiinflamatorio', 'calma'],
  'estrés': ['ansiedad', 'nerviosismo', 'tensión'],
  // ... 30+ categorías
}
```

## Estado de Implementación

### ✅ Implementado
- [x] Dashboard minimalista inspirado en appsimple
- [x] Búsqueda con type-ahead
- [x] **Base de conocimiento expandida:**
  - 45+ plantas medicinales (Fitoterapia)
  - 30+ remedios homeopáticos
  - 25+ aceites esenciales (Aromaterapia)
- [x] Detección de sinergias
- [x] Modal de detalle de producto
- [x] Sincronización con Supabase (opcional)
- [x] Búsqueda semántica con Transformers.js
- [x] Sistema de alertas de seguridad
- [x] PWA offline con Service Worker avanzado
- [x] Comparador de productos
- [x] **Autenticación simple con contraseña compartida**

### 🔄 En Progreso
- [ ] Tests automatizados (E2E con Playwright)
- [ ] Métricas de uso
- [ ] Documentación API completa

### 📋 Base de Conocimiento Detallada

```
src/core/knowledge-base/
├── PhytotherapyDatabase.ts    # 45+ plantas medicinales
│   ├── Sistema nervioso: Valeriana, Pasiflora, Melisa, Hipérico, Ginkgo
│   ├── Digestivo: Jengibre, Manzanilla, Menta, Cúrcuma, Aloe
│   ├── Inmunidad: Equinácea, Propóleo, Ajo, Sauco, Tomillo
│   ├── Cardiovascular: Espino Blanco, Hoja de Olivo, Ajo Negro
│   ├── Articulaciones: Harpagofito, Árnica, Cúrcuma
│   └── Piel: Caléndula, Lavanda, Hipérico, Aloe
│
├── HomeopathyDatabase.ts      # 30+ remedios homeopáticos
│   ├── Sistema nervioso: Arnica, Nux Vomica, Ignatia, Gelsemium
│   ├── Digestivo: Lycopodium, Carbo Veg, Bryonia, Aloe
│   ├── Inmunidad: Belladonna, Ferrum Phos, Mercurius
│   ├── Articulaciones: Rhus Tox, Ruta, Causticum
│   ├── Piel: Graphites, Sulphur, Apis Mellifica
│   ├── Mujer: Pulsatilla, Sepia, Caulophyllum
│   └── Respiratorio: Aconitum, Allium Cepa
│
└── EssentialOilsDatabase.ts   # 25+ aceites esenciales
    ├── Relajantes: Lavanda, Manzanilla, Vetiver, Cedro
    ├── Energizantes: Romero, Menta, Limón, Eucalipto
    ├── Antiinflamatorios: Gaulteria, Jengibre, Cúrcuma
    ├── Antisépticos: Tea Tree, Canela, Ravintsara
    ├── Piel: Inca Inchi, Rosa Mosqueta, Argán
    ├── Digestivos: Hinojo, Cardamomo
    └── Hormonales: Salvia Esclarea, Incienso
```

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
