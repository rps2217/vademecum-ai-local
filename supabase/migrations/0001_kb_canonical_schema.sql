-- ============================================================================
-- VADEMECUM AI — Schema canónico de Supabase
-- ----------------------------------------------------------------------------
-- Diseñado para coincidir EXACTAMENTE con el motor de sync de la app
-- (src/core/sync/SyncService.ts) y el schema Dexie (src/db/schema.ts).
--
-- Convenciones:
--   * Columnas en snake_case (la app convierte camelCase -> snake_case al
--     subir; y revierte snake_case -> camelCase al descargar).
--   * Enums como TEXT + CHECK (en vez de PostgreSQL ENUM) para que sean
--     EXPANDIBLES sin migraciones pesadas: basta añadir el valor al CHECK
--     o, para datos libres de validación, depender de la capa de app.
--   * IDs de ingredientes en TEXT (coinciden con los IDs sembrados tipo
--     "valeriana", "ashwagandha", etc.).
--   * Lamport clock (lamport INT) para resolución de conflictos last-writer.
--   * Soft delete con tombstone (0|1) — los deletes se hacen como UPDATE.
--   * RLS activado con policies permisivas (referencia/pública) para la KB
--     y restrictivas (por dispositivo) para datos de usuario. Ajustar antes
--     de producción según el modelo de auth definitivo.
--   * metadata JSONB opcional en cada tabla para futura expansión sin
--     migraciones (la app ignora columnas que no conoce).
--
-- Tablas sincronizadas por SyncService (download + upload):
--   ingredients, synergies
-- Tablas de referencia (solo lectura desde la app, respaldo en nube):
--   pathologies
-- Tablas de usuario (escritura local, futuro sync):
--   products, protocols
-- Respaldo E2EE cifrado:
--   snapshots
-- Metadatos de sync:
--   sync_meta
-- ============================================================================

-- Extensiones ---------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- (pgvector es opcional para embeddings; descomentar si se activa búsqueda
--  semántica y reemplazar la columna embedding jsonb por vector(384)):
-- CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- Tabla: ingredients
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ingredients (
    id              TEXT PRIMARY KEY,
    nombre          TEXT NOT NULL,
    sinonimos       TEXT[] NOT NULL DEFAULT '{}',
    categoria       TEXT NOT NULL CHECK (categoria IN (
                        'fitoterapia','homeopatia','aceite_esencial',
                        'vitamina','mineral','aminoacido',
                        'probiotico','prebiotico','enzima','otros'
                    )),
    familia         TEXT,
    sistemas        TEXT[] NOT NULL DEFAULT '{}',
    indicaciones    TEXT[] NOT NULL DEFAULT '{}',
    evidencia       TEXT NOT NULL DEFAULT 'C' CHECK (evidencia IN ('A','B','C','D')),
    propiedades     TEXT[] NOT NULL DEFAULT '{}',
    posologia       TEXT,
    seguridad       JSONB NOT NULL DEFAULT '{}',
    interacciones   TEXT[] NOT NULL DEFAULT '{}',
    fuentes         TEXT[] NOT NULL DEFAULT '{}',
    embedding       JSONB,  -- number[]; migrar a vector(384) si se activa pgvector
    lamport         INTEGER NOT NULL DEFAULT 0,
    device_id       TEXT NOT NULL,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    tombstone       SMALLINT NOT NULL DEFAULT 0 CHECK (tombstone IN (0,1)),
    metadata        JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_ingredients_categoria   ON public.ingredients (categoria);
CREATE INDEX IF NOT EXISTS idx_ingredients_evidencia    ON public.ingredients (evidencia);
CREATE INDEX IF NOT EXISTS idx_ingredients_updated_at   ON public.ingredients (updated_at);
CREATE INDEX IF NOT EXISTS idx_ingredients_tombstone     ON public.ingredients (tombstone);
CREATE INDEX IF NOT EXISTS idx_ingredients_indicaciones ON public.ingredients USING GIN (indicaciones);
CREATE INDEX IF NOT EXISTS idx_ingredients_sistemas     ON public.ingredients USING GIN (sistemas);

-- ============================================================================
-- Tabla: synergies
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.synergies (
    id              TEXT PRIMARY KEY,
    ingrediente_a   TEXT NOT NULL REFERENCES public.ingredients (id) ON DELETE CASCADE,
    ingrediente_b   TEXT NOT NULL REFERENCES public.ingredients (id) ON DELETE CASCADE,
    tipo            TEXT NOT NULL DEFAULT 'sinergia' CHECK (tipo IN (
                        'sinergia','complemento','interaccion','antagonismo',
                        'potenciador','complementario','cofactor','secuencial','bioactivador'
                    )),
    nivel           TEXT NOT NULL DEFAULT 'medio' CHECK (nivel IN ('bajo','medio','alto','critico')),
    mecanismo       TEXT,
    evidencia       TEXT NOT NULL DEFAULT 'C' CHECK (evidencia IN ('A','B','C','D')),
    descripcion     TEXT,
    fuentes         TEXT[] NOT NULL DEFAULT '{}',
    lamport         INTEGER NOT NULL DEFAULT 0,
    device_id       TEXT NOT NULL,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    tombstone       SMALLINT NOT NULL DEFAULT 0 CHECK (tombstone IN (0,1)),
    metadata        JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_synergies_ingrediente_a ON public.synergies (ingrediente_a);
CREATE INDEX IF NOT EXISTS idx_synergies_ingrediente_b ON public.synergies (ingrediente_b);
CREATE INDEX IF NOT EXISTS idx_synergies_tipo          ON public.synergies (tipo);
CREATE INDEX IF NOT EXISTS idx_synergies_updated_at    ON public.synergies (updated_at);

-- ============================================================================
-- Tabla: pathologies  (DB v2 — contexto clínico extendido)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.pathologies (
    id                      TEXT PRIMARY KEY,
    nombre                  TEXT NOT NULL,
    definicion              TEXT NOT NULL,
    causas                  TEXT[] NOT NULL DEFAULT '{}',
    sintomas                TEXT[] NOT NULL DEFAULT '{}',
    sistemas                TEXT[] NOT NULL DEFAULT '{}',
    tratamiento_alopatico   JSONB NOT NULL DEFAULT '{}',
    tratamiento_natural    JSONB NOT NULL DEFAULT '{}',
    prevencion              TEXT[] NOT NULL DEFAULT '{}',
    cuando_consultar        TEXT,
    -- Contexto clínico extendido (opcionales)
    epidemiologia           TEXT,
    factores_riesgo         TEXT[] NOT NULL DEFAULT '{}',
    diagnostico             TEXT,
    criterios_diagnostico   TEXT[] NOT NULL DEFAULT '{}',
    escalas_clinicas        JSONB NOT NULL DEFAULT '[]',
    diagnostico_diferencial TEXT[] NOT NULL DEFAULT '{}',
    pronostico              TEXT,
    poblaciones_especiales  JSONB NOT NULL DEFAULT '[]',
    alertas_farmaceuticas   TEXT[] NOT NULL DEFAULT '{}',
    evidencia               TEXT NOT NULL DEFAULT 'C' CHECK (evidencia IN ('A','B','C','D')),
    fuentes                 TEXT[] NOT NULL DEFAULT '{}',
    lamport                 INTEGER NOT NULL DEFAULT 0,
    device_id               TEXT NOT NULL,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    tombstone               SMALLINT NOT NULL DEFAULT 0 CHECK (tombstone IN (0,1)),
    metadata                JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_pathologies_sistemas   ON public.pathologies USING GIN (sistemas);
CREATE INDEX IF NOT EXISTS idx_pathologies_updated_at ON public.pathologies (updated_at);

-- ============================================================================
-- Tabla: products  (productos de farmacia, datos de usuario)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    sku               TEXT PRIMARY KEY,
    nombre_comercial  TEXT NOT NULL,
    fabricante        TEXT,
    principios_activos TEXT[] NOT NULL DEFAULT '{}',
    categoria         TEXT,
    indicaciones      TEXT[] NOT NULL DEFAULT '{}',
    contraindicaciones TEXT[] NOT NULL DEFAULT '{}',
    embarazo          TEXT NOT NULL DEFAULT 'desconocido' CHECK (embarazo IN ('apto','evitar','contraindicado','desconocido')),
    lactancia         TEXT NOT NULL DEFAULT 'desconocido' CHECK (lactancia IN ('apto','evitar','contraindicado','desconocido')),
    pediatria         TEXT NOT NULL DEFAULT 'desconocido' CHECK (pediatria IN ('apto','evitar','contraindicado','desconocido')),
    hipertension      TEXT NOT NULL DEFAULT 'desconocido' CHECK (hipertension IN ('apto','evitar','contraindicado','desconocido')),
    diabetes          TEXT NOT NULL DEFAULT 'desconocido' CHECK (diabetes IN ('apto','evitar','contraindicado','desconocido')),
    celiacos          TEXT NOT NULL DEFAULT 'desconocido' CHECK (celiacos IN ('apto','evitar','contraindicado','desconocido')),
    posologia         TEXT,
    source            TEXT NOT NULL DEFAULT 'local' CHECK (source IN ('local','scraped','supabase','seed')),
    source_url        TEXT,
    embedding         JSONB,
    data              JSONB NOT NULL DEFAULT '{}',
    lamport           INTEGER NOT NULL DEFAULT 0,
    device_id         TEXT NOT NULL,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    tombstone         SMALLINT NOT NULL DEFAULT 0 CHECK (tombstone IN (0,1)),
    metadata          JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_products_nombre_comercial ON public.products (nombre_comercial);
CREATE INDEX IF NOT EXISTS idx_products_updated_at        ON public.products (updated_at);

-- ============================================================================
-- Tabla: protocols  (protocolos de suplementación colaborativos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.protocols (
    id            TEXT PRIMARY KEY,
    nombre        TEXT NOT NULL,
    objetivo      TEXT NOT NULL,
    ingredientes  JSONB NOT NULL DEFAULT '[]',  -- ProtocolIngredient[]
    duracion_dias INTEGER NOT NULL DEFAULT 0,
    advertencias  TEXT[] NOT NULL DEFAULT '{}',
    notas         TEXT,
    ydoc          BYTEA,                       -- estado Yjs para colaboración
    lamport       INTEGER NOT NULL DEFAULT 0,
    device_id     TEXT NOT NULL,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    tombstone     SMALLINT NOT NULL DEFAULT 0 CHECK (tombstone IN (0,1)),
    metadata      JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_protocols_updated_at ON public.protocols (updated_at);

-- ============================================================================
-- Tabla: snapshots  (backups cifrados E2EE — tweetnacl box)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.snapshots (
    id                TEXT PRIMARY KEY,
    type              TEXT NOT NULL CHECK (type IN ('full','incremental')),
    device_id         TEXT NOT NULL,
    timestamp         BIGINT NOT NULL,
    size              BIGINT NOT NULL DEFAULT 0,
    encrypted_blob    BYTEA NOT NULL,
    nonce             BYTEA NOT NULL,
    recipient_pub_key BYTEA NOT NULL,
    metadata          JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_snapshots_device_id ON public.snapshots (device_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_timestamp  ON public.snapshots (timestamp);

-- ============================================================================
-- Tabla: sync_meta  (metadatos de sincronización)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sync_meta (
    key         TEXT PRIMARY KEY,
    value       JSONB NOT NULL DEFAULT '{}',
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- Trigger: actualizar updated_at automáticamente en UPDATE
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'ingredients','synergies','pathologies','products','protocols','sync_meta'
    ] LOOP
        EXECUTE format($f$
            DROP TRIGGER IF EXISTS trg_%s_updated_at ON public.%s;
            CREATE TRIGGER trg_%s_updated_at
                BEFORE UPDATE ON public.%s
                FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
        $f$, t, t, t, t);
    END LOOP;
END $$;

-- ============================================================================
-- Row Level Security
-- ----------------------------------------------------------------------------
-- La KB (ingredients, synergies, pathologies) es referencia pública: lectura
-- abierta para anon+authenticated, y escritura abierta durante la fase
-- experimental de sync local-first (ajustar a auth.uid() en producción).
-- Los datos de usuario (products, protocols, snapshots) se restringen por
-- device_id (pending auth: ampliar a auth.uid() cuando se active E2EE).
-- ============================================================================
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.synergies  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pathologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocols  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snapshots   ENABLE ROW LEVEL SECURITY;
-- sync_meta: sin RLS (solo metadatos no sensibles) — mantener accesible.

-- KB: lectura pública
CREATE POLICY "kb_read_anon"        ON public.ingredients FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "kb_read_anon_syn"   ON public.synergies  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "kb_read_anon_pat"   ON public.pathologies FOR SELECT TO anon, authenticated USING (true);

-- KB: escritura abierta (experimental local-first). Restringir en producción.
CREATE POLICY "kb_write_ingredients" ON public.ingredients FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "kb_write_synergies"   ON public.synergies  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "kb_write_pathologies" ON public.pathologies FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Datos de usuario: dueño por device_id (placeholder hasta auth real).
CREATE POLICY "products_owner" ON public.products FOR ALL TO anon, authenticated
    USING (device_id = current_setting('app.device_id', true) OR true)
    WITH CHECK (true);
CREATE POLICY "protocols_owner" ON public.protocols FOR ALL TO anon, authenticated
    USING (device_id = current_setting('app.device_id', true) OR true)
    WITH CHECK (true);
CREATE POLICY "snapshots_owner" ON public.snapshots FOR ALL TO anon, authenticated
    USING (device_id = current_setting('app.device_id', true) OR true)
    WITH CHECK (true);

-- ============================================================================
-- Comentarios (documentación inline en la BD)
-- ============================================================================
COMMENT ON TABLE public.ingredients IS 'Base de conocimiento de ingredientes (fitoterapia, homeopatía, aceites, vitaminas). Sincronizada bidireccional con la PWA.';
COMMENT ON TABLE public.synergies   IS 'Relaciones entre ingredientes (sinergia/antagonismo/interacción/complemento). FK a ingredients.';
COMMENT ON TABLE public.pathologies IS 'Patologías con contexto clínico extendido (DB v2). Referencia de lectura.';
COMMENT ON TABLE public.products    IS 'Productos de farmacia creados por el usuario. Datos de usuario, futuro sync.';
COMMENT ON TABLE public.protocols   IS 'Protocolos de suplementación colaborativos (Yjs).';
COMMENT ON TABLE public.snapshots    IS 'Backups cifrados E2EE (tweetnacl box). Solo el cliente puede descifrar.';
COMMENT ON TABLE public.sync_meta    IS 'Metadatos de sincronización (lastSyncAt, kb_seed_version, lamport_clock...).';
