-- ============================================================================
-- VADEMECUM AI — Tablas puente producto ↔ ingrediente de la KB
-- ----------------------------------------------------------------------------
-- Relacionan los productos comerciales (tabla products) con los ingredientes
-- de la base de conocimiento (tabla ingredients), materializando el análisis
-- de matching entre los principios activos de cada producto y la KB.
--
-- Dos tablas:
--   * product_ingredients        — detalle normalizado (1 fila por match)
--   * product_ingredient_analysis — resumen agregado por producto
-- ============================================================================

-- ============================================================================
-- Tabla: product_ingredients  (detalle producto ↔ ingrediente)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.product_ingredients (
    producto_sku    TEXT NOT NULL REFERENCES public.products (sku) ON DELETE CASCADE,
    ingredient_id   TEXT REFERENCES public.ingredients (id),  -- NULL = sin match (gap)
    principio_text  TEXT NOT NULL,   -- texto original del principio activo / tag
    match_type      TEXT CHECK (match_type IN ('exact','synonym','prefix','fuzzy','none')),
    match_score     SMALLINT CHECK (match_score IS NULL OR (match_score >= 0 AND match_score <= 100)),
    matched_via     TEXT NOT NULL CHECK (matched_via IN ('principios_activos','tags_ia')),
    is_matched      BOOLEAN NOT NULL DEFAULT false,  -- false = gap (sin match en KB)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (producto_sku, principio_text, matched_via)
);

CREATE INDEX IF NOT EXISTS idx_product_ingredients_producto_sku ON public.product_ingredients (producto_sku);
CREATE INDEX IF NOT EXISTS idx_product_ingredients_ingredient_id ON public.product_ingredients (ingredient_id);
CREATE INDEX IF NOT EXISTS idx_product_ingredients_is_matched ON public.product_ingredients (is_matched) WHERE is_matched = false;

-- ============================================================================
-- Tabla: product_ingredient_analysis  (resumen agregado por producto)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.product_ingredient_analysis (
    producto_sku           TEXT PRIMARY KEY REFERENCES public.products (sku) ON DELETE CASCADE,
    ingredientes_ids       TEXT[] NOT NULL DEFAULT '{}',   -- IDs matcheados (denormalizado)
    ingredientes_count     SMALLINT NOT NULL DEFAULT 0,
    sin_match_count        SMALLINT NOT NULL DEFAULT 0,
    cobertura_kb           SMALLINT NOT NULL DEFAULT 0 CHECK (cobertura_kb BETWEEN 0 AND 100),
    categoria_predominante TEXT,
    analisis_explicacion   TEXT,
    nivel_analisis         SMALLINT NOT NULL DEFAULT 0 CHECK (nivel_analisis BETWEEN 0 AND 100),
    requiere_ia_externa    BOOLEAN NOT NULL DEFAULT false,
    analizado              BOOLEAN NOT NULL DEFAULT false,
    fecha_analisis         TIMESTAMPTZ,
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pia_cobertura   ON public.product_ingredient_analysis (cobertura_kb);
CREATE INDEX IF NOT EXISTS idx_pia_analizado    ON public.product_ingredient_analysis (analizado);
CREATE INDEX IF NOT EXISTS idx_pia_ingredientes ON public.product_ingredient_analysis USING GIN (ingredientes_ids);

-- Trigger updated_at para product_ingredient_analysis
DROP TRIGGER IF EXISTS trg_product_ingredient_analysis_updated_at ON public.product_ingredient_analysis;
CREATE TRIGGER trg_product_ingredient_analysis_updated_at
    BEFORE UPDATE ON public.product_ingredient_analysis
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- Row Level Security
-- ----------------------------------------------------------------------------
-- Las tablas puente son resultado de análisis de la KB (referencia pública).
-- Lectura abierta para anon+authenticated; escritura abierta durante la fase
-- experimental (restringir a auth.uid() / service role en producción).
-- ============================================================================
ALTER TABLE public.product_ingredients        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_ingredient_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pi_read"  ON public.product_ingredients        FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "pi_write" ON public.product_ingredients        FOR ALL    TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "pia_read"  ON public.product_ingredient_analysis FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "pia_write" ON public.product_ingredient_analysis FOR ALL    TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- Comentarios
-- ============================================================================
COMMENT ON TABLE public.product_ingredients IS 'Detalle normalizado producto↔ingrediente (1 fila por match). is_matched=false marca gaps a cubrir en la KB.';
COMMENT ON TABLE public.product_ingredient_analysis IS 'Resumen agregado por producto: cobertura KB, ingredientes matcheados y gaps.';
