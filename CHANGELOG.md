# Changelog

Todos los cambios notables de este proyecto seran documentados en este archivo.

El formato esta basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

## [2.2.0] - 2026-07-27

### Agregado

#### Redeseno UI/UX
- **HomePage**: Hero search con placeholder "¿Que buscás?", chips de sugerencias rapidas clickeables, stats cards con conteos reales de la DB
- **SearchPage**: Filtros avanzados (categoria, sistema corporal, evidencia), panel de filtros colapsable, modal de detalle al click
- **KnowledgePage**: Cards con iconos por categoria (Leaf, FlaskConical, BookOpen), badges de evidencia con colores (A/B/C/D), contador "X de Y ingredientes"
- **SynergiesPage**: Grid 2 columnas en desktop, cards con iconos por tipo (sinergia, complemento, antagonismo), placeholder de grafo

#### Infraestructura
- **IngredientSearchService**: Servicio de busqueda con filtros y scoring de resultados
- **SyncService**: Sincronizacion local-first con patron outbox
- **usePWA hook**: Hooks para estado de PWA y conexion offline

### Cambiado
- **Componentes UI**: Consistencia en badges, iconografia (Lucide React), espaciado y tipografia
- **Responsive design**: Breakpoints verificados (mobile/tablet/desktop)
- **Empty states**: Mejorados en todas las vistas

## [2.1.0] - 2026-07-27

### Completado

#### FASE 0-1: Fundaciones
- Setup inicial con Vite + React + TypeScript
- Sistema de diseno con tokens CSS
- AppShell con sidebar colapsable
- Providers (Theme, DB, E2EE Auth, Toast)

#### FASE 2: Capa de datos local
- Schema Dexie con tipos TypeScript completos
- Seeder para 217+ ingredientes
- Tablas: ingredients, synergies, products, protocols, outbox, snapshots

#### FASE 3: Busqueda + Workers
- Servicio de busqueda con filtros avanzados
- Búsqueda por nombre, sinonimos, indicaciones

#### FASE 4: Sync + Cloud
- SyncService con sincronizacion local-first
- Patron outbox para consistencia
- Soporte para snapshots cifrados

#### FASE 5: Modulos de UI
- IngredientDetail modal
- Paginas mejoradas (Knowledge, Search, Synergies)

#### FASE 6: PWA + Service Worker
- vite-plugin-pwa configurado
- Hooks usePWA y useOfflineStatus
- Precaching de assets criticos

#### FASE 7: Tests + Hardening
- Tests basicos para schema de base de datos
- Setup de Vitest configurado

## [2.0.0] - 2026-07-26

### Completado (Reconstruccion)

- Eliminacion de codigo huérfano/viejo (~100 archivos)
- Reescritura de App.tsx con routing
- Creacion de 9 paginas rutas
- Limpieza de package.json

## [1.x.x] - Versiones anteriores

Ver historial completo en [GitHub Releases](https://github.com/rps2217/vademecum-ai-local/releases).
