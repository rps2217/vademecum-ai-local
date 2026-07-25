-- =============================================
-- TABLA: scraper_config
-- Control de configuración del scraper en segundo plano
-- =============================================

-- Tabla de configuración del scraper
CREATE TABLE IF NOT EXISTS public.scraper_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de historial de ejecución
CREATE TABLE IF NOT EXISTS public.scraper_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'stopped')),
    products_scraped INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_scraper_config_key ON public.scraper_config(config_key);
CREATE INDEX IF NOT EXISTS idx_scraper_history_status ON public.scraper_history(status);
CREATE INDEX IF NOT EXISTS idx_scraper_history_dates ON public.scraper_history(start_time DESC);

-- Activar RLS
ALTER TABLE public.scraper_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraper_history ENABLE ROW LEVEL SECURITY;

-- Políticas públicas (usar OR REPLACE si ya existe)
DROP POLICY IF EXISTS "Public read scraper_config" ON public.scraper_config;
CREATE POLICY "Public read scraper_config" ON public.scraper_config FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public write scraper_config" ON public.scraper_config;
CREATE POLICY "Public write scraper_config" ON public.scraper_config FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public write scraper_config_update" ON public.scraper_config;
CREATE POLICY "Public write scraper_config_update" ON public.scraper_config FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public read scraper_history" ON public.scraper_history;
CREATE POLICY "Public read scraper_history" ON public.scraper_history FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public write scraper_history" ON public.scraper_history;
CREATE POLICY "Public write scraper_history" ON public.scraper_history FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public write scraper_history_update" ON public.scraper_history;
CREATE POLICY "Public write scraper_history_update" ON public.scraper_history FOR UPDATE USING (true);

-- Insertar configuración inicial
INSERT INTO public.scraper_config (config_key, config_value, description) VALUES
    ('enabled', 'false', 'Control principal del scraper: true/false'),
    ('interval_minutes', '60', 'Intervalo de ejecución en minutos'),
    ('target_url', 'https://www.farmaciasknop.com', 'URL base para scraping'),
    ('categories', 'homeopatia,fitoterapia,vitaminas-y-suplementos,salud-natural', 'Categorías a scrapear'),
    ('last_run', '', 'Última ejecución (timestamp)'),
    ('auto_sync', 'true', 'Sincronizar automáticamente con Supabase')
ON CONFLICT (config_key) DO NOTHING;

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_scraper_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar timestamp
DROP TRIGGER IF EXISTS update_scraper_config_timestamp ON public.scraper_config;
CREATE TRIGGER update_scraper_config_timestamp
    BEFORE UPDATE ON public.scraper_config
    FOR EACH ROW
    EXECUTE FUNCTION update_scraper_timestamp();
