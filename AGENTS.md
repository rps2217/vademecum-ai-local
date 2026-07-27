# AGENTS.md - Vademecum AI

## Descripción del Proyecto

**Vademecum AI** es una aplicación web progresiva (PWA) para consultoras de farmacia que proporciona:
- Búsqueda de medicamentos e ingredientes con información detallada
- Base de conocimiento modular (fitoterapia, homeopatía, aceites esenciales, vitaminas)
- Detección de sinergias y antagonismos entre ingredientes
- Dashboard admin para gestionar la base de conocimiento
- Visualización de red de relaciones entre ingredientes
- Búsqueda semántica inteligente con IA local (100% offline)

## Arquitectura General

```
src/
├── components/
│   ├── admin/                    # Dashboard de administración KB
│   │   ├── KBDashboard.tsx        # Panel principal admin
│   │   ├── SynergyGraph.tsx       # Visualización de red SVG
│   │   └── IngredientEditor.tsx   # Editor de ingredientes
│   ├── auth/                     # Login, autenticación
│   ├── layout/                    # Dashboard, navegación
│   └── ui/                       # Componentes UI reutilizables
├── core/
│   ├── knowledge-base/           # Base de conocimiento modular
│   │   ├── data/                 # Datos JSON por categoría
│   │   │   ├── schema.ts                   # Tipos TypeScript
│   │   │   ├── fitoterapia.json           # 25+ plantas medicinales
│   │   │   ├── homeopatia.json           # 14+ remedios homeopáticos
│   │   │   ├── aceites.json              # 12+ aceites esenciales
│   │   │   └── vitaminas_minerales.json  # 12+ vitaminas/minerales
│   │   ├── synergies/           # Red de relaciones
│   │   │   └── synergies.json             # 25+ sinergias curadas
│   │   └── services/
│   │       ├── KnowledgeLoader.ts         # Carga de datos
│   │       └── SynergyEngineV2.ts     # Motor de sinergias
│   ├── ingredient-database/      # Base legacy + sinónimos
│   │   └── SynonymsService.ts            # 360+ sinónimos
│   ├── smart-search/             # 🔥 HERO SEARCH - Motor de chips inteligentes
│   │   └── SmartChipEngine.ts            # Chips auto-clasificados
│   ├── semantic-search/          # Búsqueda con IA (Transformers.js)
│   │   ├── KBEmbeddingService.ts
│   │   └── embedding-service.ts
│   └── protocols/                # Protocolos de suplementación
├── modules/
│   ├── search/
│   │   └── components/
│   │       └── HeroSearch.tsx        # 🔥 BUSCADOR PROTAGONISTA
│   └── protocols/
│       └── ProtocolsModule.tsx
├── services/
│   ├── SupabaseService.ts          # Sync productos
│   └── SupabaseKBService.ts        # Sync base conocimiento
└── store/                       # Zustand stores
```

## Tecnologías Principales

- **React 18** + TypeScript
- **Tailwind CSS** para estilos
- **Zustand** para estado global
- **Transformers.js** para embeddings (100% local)
- **Supabase** para sincronización (opcional)
- **PWA** para uso offline
- **SVG** para visualización de red

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

## Base de Conocimiento Modular

### Datos por Categoría

```typescript
// fitoterapia.json - Plantas medicinales
{
  "id": "valeriana",
  "nombre": "Valeriana",
  "sistemas": ["nervioso"],
  "indicaciones": ["insomnio", "ansiedad"],
  "parteUsada": "raiz",
  "advertencias": ["Puede causar somnolencia"]
}

// homeopatia.json - Remedios
{
  "id": "arnica",
  "dilucionesCH": [5, 7, 9, 15, 30],
  "sintomasClave": ["Sensacion de golpeado", "No quiere ser tocado"],
  "modalidades": { "empeora": ["toque"], "mejora": ["acostado"] }
}

// aceites.json - Aceites esenciales
{
  "id": "lavanda_aceite",
  "dilucionRecomendada": "1-3% para piel",
  "metodosUso": ["difusion", "topico", "inhalacion"]
}

// vitaminas_minerales.json
{
  "id": "magnesio",
  "dosisDiaria": "300-400mg/dia",
  "formaQuimica": ["citrato", "glicinato", "taurato"]
}
```

### Schema Unificado (schema.ts)

```typescript
export type IngredientCategory = 
  | 'fitoterapia' | 'homeopatia' | 'aceite_esencial'
  | 'vitaminas' | 'minerales' | 'aminoacidos' | 'probioticos';

export type BodySystem = 
  | 'nervioso' | 'digestivo' | 'inmune' | 'cardiovascular'
  | 'respiratorio' | 'musculoesqueletico' | 'endocrino';

export type SynergyType = 
  | 'potenciador' | 'complementario' | 'cofactor' | 'secuencial' | 'bioactivador';

export type EvidenceLevel = 'A' | 'B' | 'C' | 'D';
```

## Motor de Sinergias

```typescript
import { synergyEngineV2 } from './core/knowledge-base';

// Analizar sinergias
const analysis = synergyEngineV2.analyze(['valeriana', 'pasiflora']);
// → { sinergiasDetectadas: [...], puntuacion: 85, recomendacion: "..." }

// Sugerir compañeros
const suggestions = synergyEngineV2.suggestPartners('equinacea', 5);
// → [{ ingredient: {...}, synergy: {...} ]

// Verificar antagonismos
const warnings = synergyEngineV2.checkAntagonisms(['warfarin', 'ginkgo']);
```

## 🔥 Hero Search - Buscador Protagonista

El buscador es el elemento central de la aplicación con chips inteligentes que se auto-clasifican.

### SmartChipEngine

```typescript
import { smartChipEngine } from './core/smart-search';

// Obtener chips para mostrar (se actualizan según query)
const chips = smartChipEngine.getChips({ query: 'ansiedad', limit: 8 });

// Detectar intención del usuario
const suggestions = smartChipEngine.detectIntentAndSuggest('dormir');
// → [{ id: 'sleep', label: '😴 Dormir mejor', intent: 'health_goal', ... }]

// Registrar búsqueda para mejorar sugerencias futuras
smartChipEngine.registerSearch('valeriana');
```

### Características del Motor de Chips

- **Auto-clasificación**: Analiza la KB y genera chips automáticamente
- **Detección de intención**: Identifica si el usuario busca objetivos, condiciones, síntomas
- **Sinonimia inteligente**: Expandir queries con términos relacionados
- **Historial adaptativo**: Aprende de las búsquedas del usuario
- **Priorización dinámica**: Ordena chips por relevancia

### Intenciones Detectadas

```typescript
type ChipIntent = 
  | 'health_goal'    // Objetivos: dormir, energía, memoria
  | 'condition'      // Condiciones: ansiedad, inflamación
  | 'symptom'        // Síntomas: dolor, fatiga
  | 'category'       // Categorías: vitaminas, plantas
  | 'action';        // Acciones: prevenir, mejorar
```

## 🤖 Motor de Sugerencias IA

```typescript
import { suggestionEngine } from './core/ai-suggestions';

// Actualizar contexto del usuario
suggestionEngine.updateContext({ currentQuery: 'ansiedad' });

// Obtener sugerencias inteligentes
const suggestions = await suggestionEngine.getSuggestions(5);
// → [{ type: 'synergy', title: 'Combinación sinérgica', ... }]

// Registrar click para aprendizaje
suggestionEngine.registerClick('ashwagandha');

// Obtener insights de uso
const insights = suggestionEngine.getUsageInsights();
// → { totalSearches: 42, topSymptoms: ['estrés', 'sueño'], ... }
```

### Tipos de Sugerencias

- **synergy**: Combinaciones sinérgicas conocidas entre ingredientes
- **complementary**: Ingredientes que combinan bien con selección actual
- **alternative**: Alternativas populares para el síntoma detectado
- **educational**: Patrones aprendidos del historial del usuario

### Detección de Síntomas

El motor detecta automáticamente síntomas por palabras clave:
- Sueño: dormir, insomnio, fatiga, cansancio
- Dolor: dolor, inflamación, artritis, migraña
- Estrés: estrés, ansiedad, nervios, tensión
- Inmunidad: inmune, defensas, resfriado, gripe
- Digestivo: digestivo, estómago, náuseas, intestino

## Búsqueda con Sinónimos

```typescript
import { SYNONYMS_MAP, findIngredientByAny } from './SynonymsService';

// 360+ sinónimos en español, inglés, latín
SYNONYMS_MAP['valerian']      // → 'valeriana'
SYNONYMS_MAP['st johns wort'] // → 'hipérico'
SYNONYMS_MAP['omega-3']      // → 'omega_3'
SYNONYMS_MAP['l-theanine']   // → 'teanina'
```

## Servicios de Datos

### KnowledgeLoader

```typescript
import { knowledgeLoader } from './core/knowledge-base';

await knowledgeLoader.load();
knowledgeLoader.search('valeriana');           // → [...]
knowledgeLoader.getByCategory('fitoterapia');  // → [...]
knowledgeLoader.getBySystem('nervioso');      // → [...]
knowledgeLoader.getSynergiesFor('equinacea');   // → [...]
```

### SupabaseKBService

```typescript
import { supabaseKBService } from './services/SupabaseKBService';

await supabaseKBService.syncAll();             // Sync bidireccional
await supabaseKBService.getSyncStats();       // Estadísticas
supabaseKBService.getCachedIngredients();    // Datos en caché
```

## Dashboard Admin

```tsx
import { KBDashboard } from './components/admin';

<KBDashboard />
```

**Pestañas:**
- **Resumen**: Stats, gráficos, categorías
- **Ingredientes**: Lista, búsqueda, filtros
- **Sinergias**: Grafo interactivo + lista
- **Sync**: Estado de sincronización

## Estado de Implementación

### ✅ Completado
- [x] Arquitectura modular de base de conocimiento
- [x] Schema unificado con tipos TypeScript
- [x] Datos JSON separados por categoría
- [x] 360+ sinónimos multilingüe
- [x] Motor de detección de sinergias V2
- [x] Visualización de red SVG interactiva
- [x] Dashboard admin con estadísticas
- [x] Editor de ingredientes
- [x] Integración con Supabase
- [x] Schema PostgreSQL completo
- [x] Sincronización bidireccional
- [x] PWA con Service Worker
- [x] Búsqueda semántica local (Transformers.js)

### 🔄 En Desarrollo
- [x] Editor visual de sinergias
- [x] Dashboard admin para CRUD de KB
- [x] Motor de sugerencias IA

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

### Servicio Singleton
```typescript
// Los servicios van en src/services/
// Usar clases singleton exportadas como default
export const searchService = new SearchService();
```
