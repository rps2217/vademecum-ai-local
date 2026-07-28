# 💊 Vademecum AI - Guía Terapéutica para Farmacias

![Version](https://img.shields.io/badge/version-2.2.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![PWA](https://img.shields.io/badge/PWA-ready-60c044)
![Build](https://img.shields.io/badge/build-925KB-60c044)

**Vademecum AI** es una aplicación web progresiva (PWA) para consultoras de farmacia que proporciona:
- Búsqueda inteligente de ingredientes con filtros avanzados
- 217+ ingredientes con información detallada
- Detección de sinergias y antagonismos
- Seguridad integrada (embarazo, lactancia, pediatría)
- Cifrado E2EE opcional para datos sensibles
- 100% offline con Service Worker

---

## 🚀 Inicio Rápido

```bash
# Clonar repositorio
git clone https://github.com/rps2217/vademecum-ai-local.git
cd vademecum-ai-local

# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build de producción
npm run build

# Previsualizar
npm run preview
```

---

## 📁 Estructura del Proyecto

```
src/
├── app/                    # Providers (Db, Theme, E2EE, Toast)
├── components/
│   ├── layout/            # AppShell con Sidebar
│   └── ui/                # IngredientDetail modal
├── core/
│   ├── search/            # IngredientSearchService
│   └── sync/              # SyncService
├── db/
│   ├── schema.ts          # Schema Dexie
│   └── seeders/           # Datos KB (217+ ingredientes)
├── hooks/                 # usePWA, useOfflineStatus
├── pages/                 # 9 páginas rutas
└── ui/                    # Componentes UI base
```

---

## 📊 Base de Conocimiento

| Categoria | Cantidad | Descripcion |
|-----------|----------|------------|
| Fitoterapia | 25+ | Plantas medicinales |
| Homeopatia | 14+ | Remedios homeopaticos |
| Aceites esenciales | 12+ | Aceites con diluciones |
| Vitaminas/Minerales | 12+ | Dosis y biodisponibilidad |
| Probioticos | 10+ | Cepas y beneficios |
| **Total** | **217+** | **ingredientes** |

### Sinergias
- **40+** combinaciones curadas con evidencia
- **Tipos:** sinergia, complemento, interaccion, antagonismo
- **Niveles:** alto, medio, bajo

---

## 🎨 Stack Tecnológico

| Tecnologia | Proposito |
|------------|-----------|
| React 18 | UI framework |
| TypeScript 5 | Tipado estatico |
| Tailwind CSS 4 | Estilos |
| React Router DOM 6 | Enrutamiento |
| Dexie | Base de datos IndexedDB |
| vite-plugin-pwa | PWA + Service Worker |
| tweetnacl | Cifrado E2EE |
| Lucide React | Iconografia |
| Vitest | Testing |

---

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar dev server en localhost:5173

# Build
npm run build            # Build de produccion
npm run preview          # Previsualizar build

# Calidad de codigo
npm run lint             # ESLint
npx tsc --noEmit        # Typecheck

# Testing
npm run test            # Tests unitarios (Vitest)
npm run test:e2e        # Tests E2E (Playwright)
```

---

## 🌐 Variables de Entorno

```env
# Supabase (opcional)
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave
```

---

## 📱 PWA

La aplicación funciona 100% offline:

- **Service Worker** con precaching de assets
- **Runtime caching** para Google Fonts
- **Actualizaciones** automaticas en segundo plano
- **Installable** en escritorio y movil

### Instalación

1. Abrir en Chrome/Edge
2. Click en "Instalar" en el banner
3. Funciona sin internet

---

## 🔐 Seguridad

- **E2EE opcional** con tweetnacl (nacl box)
- **PBKDF2** para derivar claves (600k iteraciones)
- **Recovery phrase** BIP-39 de 12 palabras
- **Datos locales** nunca salen del dispositivo (sin Supabase)

---

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Typecheck completo
npx tsc --noEmit
```

### Tests Disponibles
- Schema de base de datos (insert/retrieve)
- Sincronizacion
- Servicios de negocio

---

## 📝 API Reference

### Servicio de Busqueda

```typescript
import { ingredientSearchService } from '@/core/search';

// Buscar con filtros
const results = await ingredientSearchService.search({
  query: 'valeriana',
  category: 'fitoterapia',
  system: 'nervioso',
  evidenceLevel: 'A',
});
```

### Proveedor de DB

```typescript
import { useDb } from '@/app/DbProvider';

const { isReady, stats } = useDb();
// stats: { ingredients: 217, synergies: 40 }
```

---

## 📄 Licencia

MIT License - Ver [LICENSE](LICENSE)

---

## 🤝 Contribuir

1. Fork el repositorio
2. Crear branch (`git checkout -b feature/nueva-funcion`)
3. Commit cambios (`git commit -m 'feat: nueva funcion'`)
4. Push al branch (`git push origin feature/nueva-funcion`)
5. Abrir Pull Request

---

## 📚 Documentacion Adicional

- [AGENTS.md](./AGENTS.md) - Documentacion para agentes IA
- [/workspace/REDISENO-UI-UX.md](../REDISENO-UI-UX.md) - Especificacion UI/UX
- [/workspace/AUDITORIA-V2.1.0.md](../AUDITORIA-V2.1.0.md) - Auditoria tecnica

---

## 📊 Metricas de Build

| Metrica | Valor |
|---------|-------|
| Tamanio bundle | 925.81 KiB |
| Chunks JS | 7 |
| Precached | 19 archivos |
| TypeScript errors | 0 |

---

**Version:** 2.2.0  
**Ultima actualizacion:** Julio 2026  
**Rama principal:** main
