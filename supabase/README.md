# Vademecum AI - Supabase Setup

## Descripción

Configuración de sincronización opcional y experimental con **Supabase** (PostgreSQL + RLS).

> **Estado:** el sync es **unidireccional de lectura** en la práctica. La descarga
> (`downloadRemoteChanges`) funciona con la anon key (RLS de solo lectura). La
> subida (`uploadPendingOps`) requiere `service_role`, que la app frontend nunca
> usa — tras 3 fallos consecutivos (401) el servicio se autodesactiva (fail-fast).
> Ver `AGENTS.md` § "Nota sobre Supabase Sync" para el detalle completo.

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `supabase-schema.sql` (raíz del repo) | Schema PostgreSQL desplegado: tablas, RLS, índices |
| `migrations/` | Migraciones versionadas (fuente de verdad para evolución del schema) |

## Setup Rápido

### 1. Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un proyecto
2. Anota la contraseña del database
3. Espera a que el proyecto esté listo (~2 minutos)

### 2. Ejecutar el Schema

En el dashboard de Supabase → **SQL Editor** → copia y pega el contenido de
`supabase-schema.sql` (raíz del repo) → ejecuta.

### 3. Configurar Variables de Entorno

Crea `.env.local` en la raíz del proyecto (gitignored):

```env
VITE_SUPABASE_URL=https://[tu-proyecto].supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima
```

Las claves están en **Settings → API → Project API keys**. La app usa la
**anon key** (publishable, segura para frontend). La `service_role` bypassa
RLS y **NO** debe ir en el frontend.

## Estructura de la Base de Datos

### Tablas principales

| Tabla | Descripción |
|-------|-------------|
| `ingredients` | Ingredientes terapéuticos (fitoterapia, homeopatía, etc.) |
| `synergies` | Relaciones sinérgicas/antagónicas entre ingredientes |
| `pathologies` | Patologías con contexto clínico |
| `products` | Productos comerciales de farmacia |
| `product_ingredients` | Puente productos ↔ ingredientes |
| `product_ingredient_analysis` | Análisis de ingredientes por producto |
| `protocols` | Protocolos de suplementación |
| `snapshots` | Backups cifrados (E2EE) |
| `sync_meta` | Metadatos de sincronización |

> **Nota:** No existe tabla `antagonisms` ni `audit_log`. Los antagonismos son
> `synergies` con `tipo = 'antagonismo'`. El schema real usa **snake_case**
> en inglés para los nombres de tablas y columnas.

## RLS (Row Level Security)

| Tabla | Lectura (anon) | Escritura |
|-------|----------------|-----------|
| `ingredients` | ✅ | ❌ (requiere service_role) |
| `synergies` | ✅ | ❌ |
| `pathologies` | ✅ | ❌ |
| `products` | ✅ | ❌ |
| `product_ingredients` | ✅ | ❌ |
| `product_ingredient_analysis` | ✅ | ❌ |
| `protocols` | ✅ | ❌ |
| `snapshots` | ✅ | ❌ |
| `sync_meta` | ✅ | ❌ |

## Recursos

- [Documentación de Supabase](https://supabase.com/docs)
- [Vademecum AI GitHub](https://github.com/rps2217/vademecum-ai-local)
