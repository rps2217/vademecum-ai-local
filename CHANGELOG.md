# Bitácora de Cambios: Inteligencia Clínica Local-First

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
