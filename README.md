# 💊 Vademecum AI - Guía Terapéutica para Farmacias

![Version](https://img.shields.io/badge/version-1.2.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![PWA](https://img.shields.io/badge/PWA-ready-60c044)

**Vademecum AI** es una aplicación web progresiva (PWA) para consultoras de farmacia que proporciona información detallada sobre productos naturales y suplementos, detecta sinergias entre ingredientes, y funciona 100% offline.

---

## ✨ Características Principales

| Característica | Descripción |
|----------------|-------------|
| 🔍 **Búsqueda Inteligente** | 360+ sinónimos en español, inglés y latín |
| 🤝 **Detección de Sinergias** | Encuentra combinaciones beneficiosas automáticamente |
| 🧠 **IA Local** | Búsqueda semántica con Transformers.js (sin Ollama) |
| 📴 **100% Offline** | PWA funciona sin conexión a internet |
| 🔄 **Sincronización** | Supabase para compartir datos entre dispositivos |
| 📊 **Dashboard Admin** | Panel completo para gestionar la base de conocimiento |
| 🔐 **Autenticación** | Contraseña protegida para equipos |
| 📱 **PWA** | Instalable en móvil y escritorio |

---

## 📚 Base de Conocimiento

### Datos Actuales

| Categoría | Cantidad | Descripción |
|-----------|----------|-------------|
| **Fitoterapia** | 25+ | Plantas medicinales con indicaciones, posología |
| **Homeopatía** | 14+ | Remedios con diluciones CH y síntomas clave |
| **Aceites Esenciales** | 12+ | Diluciones, metodos de uso, precauciones |
| **Vitaminas/Minerales** | 12+ | Dosis RDA, biodisponibilidad, interacciones |
| **Sinergias** | 25+ | Relaciones curadas con evidencia científica |

### Sistemas Corporales Cubiertos

| Sistema | Ingredientes Principales |
|---------|------------------------|
| 🧠 Nervioso | Valeriana, Pasiflora, Melisa, Ashwagandha |
| 🫃 Digestivo | Jengibre, Manzanilla, Menta, Cúrcuma |
| 🛡️ Inmunidad | Equinácea, Propóleo, Sauco, Reishi |
| ❤️ Cardiovascular | Espino Blanco, Omega-3, CoQ10 |
| 🫁 Respiratorio | Tomillo, Ravintsara, Eucalipto |
| 💪 Musculoesquelético | Harpagofito, Cúrcuma, Arnica |
| 🧘 Endocrino | Maca, Ashwagandha, Rodiola |

---

## 🚀 Instalación

### Requisitos
- [Node.js](https://nodejs.org/) v18 o superior
- [npm](https://www.npmjs.com/) o [pnpm](https://pnpm.io/)

### Desarrollo
```bash
# Clonar repositorio
git clone https://github.com/rps2217/vademecum-ai-local.git
cd vademecum-ai-local

# Instalar dependencias
npm install

# Iniciar servidor local
npm run dev
# Abre http://localhost:5173
```

### Producción
```bash
# Build
npm run build

# Previsualizar build
npm run preview
```

---

## 🏗️ Arquitectura

```
src/
├── components/
│   ├── admin/              # Dashboard de administración KB
│   │   ├── KBDashboard.tsx    # Panel principal
│   │   ├── SynergyGraph.tsx    # Visualización de red
│   │   └── IngredientEditor.tsx # Editor de ingredientes
│   ├── auth/               # Login, autenticación
│   ├── layout/             # Dashboard, navegación
│   └── ui/                 # Componentes UI reutilizables
│
├── core/
│   ├── knowledge-base/      # Base de conocimiento modular
│   │   ├── data/          # Datos JSON por categoría
│   │   │   ├── schema.ts               # Tipos TypeScript
│   │   │   ├── fitoterapia.json       # Plantas medicinales
│   │   │   ├── homeopatia.json       # Remedios homeopáticos
│   │   │   ├── aceites.json          # Aceites esenciales
│   │   │   └── vitaminas_minerales.json
│   │   ├── synergies/     # Red de relaciones
│   │   │   └── synergies.json # 25+ sinergias curadas
│   │   └── services/
│   │       ├── KnowledgeLoader.ts   # Carga de datos
│   │       └── SynergyEngineV2.ts # Motor de sinergias
│   │
│   ├── ingredient-database/ # Base de ingredientes legacy
│   │   └── SynonymsService.ts    # 360+ sinónimos
│   │
│   └── semantic-search/     # Búsqueda con IA
│
├── services/
│   ├── SupabaseService.ts      # Sincronización productos
│   └── SupabaseKBService.ts   # Sincronización KB
│
└── store/                   # Estado global (Zustand)
```

---

## 📖 Documentación

### Base de Conocimiento Modular

La base de conocimiento está separada en archivos JSON modulares:

```typescript
// Cargar datos
import { knowledgeLoader } from './core/knowledge-base';

// Buscar ingredientes
const results = knowledgeLoader.search('valeriana');

// Obtener por categoría
const plantas = knowledgeLoader.getByCategory('fitoterapia');

// Obtener sinergias
const sinergias = knowledgeLoader.getSynergiesFor('equinacea');
```

### Motor de Sinergias

```typescript
import { synergyEngineV2 } from './core/knowledge-base';

// Analizar sinergias entre ingredientes
const analysis = synergyEngineV2.analyze(['valeriana', 'pasiflora']);

// Sugerir compañeros sinérgicos
const suggestions = synergyEngineV2.suggestPartners('equinacea', { system: 'inmune' });
```

---

## ☁️ Supabase (Opcional)

### Configuración

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ejecutar `supabase/schema.sql` en SQL Editor
3. Configurar variables de entorno:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anon
```

### Schema de Base de Datos

Ver `supabase/schema.sql` para:
- Tablas: ingredients, synergies, categories, products
- Relaciones N:M entre ingredientes y sistemas/indicaciones
- Auditoría de cambios
- Row Level Security (RLS)

### Sincronización

```typescript
import { supabaseKBService } from './services/SupabaseKBService';

// Sincronizar datos
const result = await supabaseKBService.syncAll();

// Estadísticas
const stats = await supabaseKBService.getSyncStats();
```

---

## 🔐 Autenticación

La aplicación usa autenticación simple con contraseña compartida:

1. **Primera vez**: Configura una contraseña para proteger la app
2. **Otros dispositivos**: Usa la misma contraseña para acceder
3. **Seguridad**: La contraseña se guarda localmente (hash SHA-256)

Para cambiar contraseña: **Configuración → Seguridad**

---

## 📱 Instalación como PWA

1. Abre la aplicación en Chrome/Edge/Safari
2. En móvil: "Añadir a pantalla de inicio"
3. En escritorio: Click en el icono de instalación

La app funcionará **sin conexión** una vez instalada.

---

## 🧪 Tests

```bash
# Tests E2E con Playwright
npm run test:e2e
```

---

## 📊 API de Componentes

### KBDashboard

Panel de administración de la base de conocimiento:

```tsx
import { KBDashboard } from './components/admin';

<KBDashboard onClose={() => navigate('/')} />
```

**Pestañas:**
- **Resumen**: Estadísticas y gráficos
- **Ingredientes**: Lista, búsqueda, filtros
- **Sinergias**: Grafo interactivo + lista
- **Sync**: Estado de sincronización

### SynergyGraph

Visualización de red de sinergias:

```tsx
import { SynergyGraph } from './components/admin';

<SynergyGraph />
```

**Controles:**
- Arrastrar para mover nodos
- Rueda del mouse para zoom
- Click en nodo para ver detalles
- Hover en enlace para info

---

## 🛠️ Desarrollo

### Scripts Disponibles

| Comando | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run preview` | Previsualizar build |
| `npm run test:e2e` | Tests E2E con Playwright |

### Agregar Nuevo Ingrediente

1. Crear archivo en `src/core/knowledge-base/data/`
2. Agregar a `KnowledgeLoader.ts`
3. Opcional: Añadir sinergias en `synergies/synergies.json`

---

## 📝 Changelog

### v1.2.0 (2026-01)
- ✅ Arquitectura modular de base de conocimiento
- ✅ Dashboard admin con estadísticas
- ✅ Visualización de red de sinergias
- ✅ Integración con Supabase
- ✅ 360+ sinónimos expandidos
- ✅ Motor de detección de sinergias V2

### v1.1.0 (2025-12)
- ✅ PWA con Service Worker avanzado
- ✅ Búsqueda semántica local (Transformers.js)
- ✅ Panel de métricas integrado
- ✅ Sidebar contraíble

---

## 📄 Licencia

MIT License - Ver [LICENSE](LICENSE)

---

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/nueva-caracteristica`)
3. Commit (`git commit -m 'Agregar nueva característica'`)
4. Push (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

---

## 📞 Soporte

- 📖 [Documentación](supabase/README.md)
- 🐛 [Issues](https://github.com/rps2217/vademecum-ai-local/issues)
- 💬 [Discussions](https://github.com/rps2217/vademecum-ai-local/discussions)
