# Documentos históricos

> ⚠️ **SNAPSHOTS HISTÓRICOS — Julio 2026 (v2.2.0)**
>
> Los documentos en esta carpeta son snapshots de análisis y planes
> realizados sobre la versión **v2.2.0** del proyecto (Julio 2026).
> **La mayoría de sus hallazgos ya están resueltos** en PRs posteriores.
> No usarlos como fuente de verdad del estado actual — consultar
> `AGENTS.md` en la raíz del repo para el estado actual.

## Estado de resolución

Muchos hallazgos críticos de estos documentos fueron resueltos en
PRs posteriores (#43–#60). A continuación, un mapeo de los hallazgos
más citados y su estado actual:

| Hallazgo histórico | Documento origen | Estado actual |
|---|---|---|
| `console.*` dispersos en 175 archivos | ANALISIS-DEBILIDADES.md | ✅ Resuelto — 0 `console.*` fuera de `logger.ts` |
| SyncService sin implementar (esqueleto) | AUDITORIA-DB.md, AUDITORIA-SUPABASE.md | ✅ Resuelto — SyncService funcional (download verificado) |
| Cliente Supabase no creado | AUDITORIA-SUPABASE.md | ✅ Resuelto — `src/lib/supabase.ts` con `createClient` |
| Schema PostgreSQL no definido | AUDITORIA-SUPABASE.md | ✅ Resuelto — ver `supabase/migrations/` |
| Tests fallan (mock incompleto) | AUDITORIA-DB.md | ✅ Resuelto — 339 tests pasan |
| Seeder carga 217 ingredientes | AUDITORIA-DB.md | ✅ Resuelto — 625 ingredientes |
| Auth E2EE incompleta | ANALISIS-DEBILIDADES.md | ✅ Resuelto — E2EE con TweetNaCl + PBKDF2 |
| Sin code splitting | ANALISIS-MEJORAS.md | ✅ Resuelto — React.lazy en App.tsx (PR #58) |
| Sin RBAC para /admin | ANALISIS-DEBILIDADES.md | ✅ Resuelto — Gate de PIN (PR #60) |

## Índice de documentos

### Auditorías técnicas
- **AUDITORIA-DB.md** — Capa de base de datos local (Dexie/IndexedDB)
- **AUDITORIA-SUPABASE.md** — Conexión Supabase (cliente, config, sync)
- **AUDITORIA-SUPABASE-DB.md** — Base de datos remota Supabase (tablas, datos)
  > ⚠️ Referencia el proyecto `pspxqzwxulgmzarlqwtt.supabase.co`, que ya NO es
  > el proyecto actual. El proyecto vigente es `lcoweosnhdkzogtmsfml`
  > (ver `AGENTS.md`).
- **AUDITORIA-SYNC-ERRORS.md** — Errores de sincronización

### Análisis
- **ANALISIS-DEBILIDADES.md** — Análisis de debilidades técnicas
- **ANALISIS-MEJORAS.md** — Análisis de oportunidades de mejora
- **ARQUITECTURA-ANALISIS.md** — Análisis de arquitectura

### Planes
- **PLAN-SUPABASE-IMPLEMENTATION.md** — Plan de implementación Supabase
- **PLAN-SYNC-BIDIRECCIONAL.md** — Plan de sync bidireccional
- **PLAN-FIX-SYNC.md** — Plan de fix de errores de sync
- **INSTRUCCIONES_SUPABASE.md** — Instrucciones de configuración Supabase

### Tests legacy
- **tests-legacy/SyncEngine.test.ts** — Test legacy del engine de sync (eliminado)

## Política de vida útil

Estos documentos se conservan como referencia histórica de las
decisiones de diseño. No se actualizan — si un hallazgo cambia de
estado, se refleja en `AGENTS.md`, no aquí. Si en el futuro se
decide archivar fuera del repo (wiki, Notion), esta carpeta es
candidata a eliminación.
