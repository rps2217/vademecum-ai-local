# Bitácora de Cambios: Inteligencia Clínica Local-First

## [2.1.0] - 2026-07-27

### Added
- **Design System**: Complete design token system with light/dark themes (CSS custom properties)
- **UI Components**: Button, Input, Card, Badge, Modal, SearchInput, StatsCard
- **SearchModuleSimple**: Hero search with new design system
- **DashboardSimple**: Dashboard with metrics and stats cards
- **Web Vitals**: Core Web Vitals tracking (LCP, FID, CLS, FCP, TTFB, INP)
- **Performance Module**: Preloading hooks, performance budget checking
- **Crypto E2E**: End-to-end encryption with tweetnacl (PBKDF2 key derivation)
- **SyncEngine**: Sync with outbox pattern and Lamport clock
- **Unit Tests**: Tests for cn utility, DB schema, and SyncEngine

### Changed
- Vercel deployment with security headers (COOP/COEP)
- PWA manifest with updated theme colors
- Service Worker with stale-while-revalidate strategy

## [2.0.0] - 2026-07-01

### Added
- Initial reconstruction from legacy codebase
- Vademecum AI PWA for pharmacy consultants
- Local-first architecture with Dexie.js
- 360+ ingredient synonyms
- Synergy detection engine
- Smart search with AI embeddings (Transformers.js)
- Supabase integration for optional cloud sync

## [0.1.0] - 2026-05-15
### Añadido
- **SemanticSearchService**: Motor de búsqueda semántica con vectores utilizando `transformers.js`.
- **CYPInteractionGraph**: Módulo de visualización de interacciones farmacológicas (CYP450) usando `d3.js`.
- **ThermalGuardService**: Servicio de gestión de carga térmica y de recursos para tareas pesadas local-first.
- **Integración ThermalGuard**: Implementado back-pressure preventivo en `SynergyBackgroundService` y `AIService`.
- **Refactor CloudSync**: Implementación de sincronización adaptativa basada en perfil de red (Network-Aware Sync).
- **Hybrid RAG Service**: Refactorizado `MedicalRAGService` para búsqueda híbrida (Local+Cloud) consciente de la carga térmica.
- **Formateo RAG IA**: Integrado formateador de insights (`formatInsightsForPrompt`) para mejorar el contexto clínico enviado al Asistente.
- **ClinicalAssistant RAG**: Integración de contexto médico inteligente (RAG) en el asistente clínico utilizando el nuevo formateador.
- **Interfaz UI Minimalista**: Rediseño completo de la interfaz hacia una estética soberana, moderna y simple (baja carga cognitiva).
- **Rediseño Palette**: Transición a colores sólidos, eliminación de transparencias/blurs y ajuste de contrastes para mejorar la legibilidad.

### Cambios
- Refactorización de `useProductSearch` para soportar búsqueda semántica.
- Actualización de `SearchModule` para alternar entre búsqueda texto vs IA.
- Integración de `CYPInteractionGraph` en `GraphExplorerModule`.
