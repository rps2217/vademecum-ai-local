-- =====================================================
-- SUPABASE SCHEMA: Sinergias y Base de Conocimiento
-- =====================================================
-- Ejecutar este script en el SQL Editor de Supabase
-- =====================================================

-- =====================================================
-- TABLA: ingredient_knowledge
-- Base de conocimiento de ingredientes (maestra)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ingredient_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_id VARCHAR(100) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    nombre_latin VARCHAR(255),
    categoria VARCHAR(50) NOT NULL,
    descripcion TEXT,
    mecanismo_accion TEXT,
    beneficios TEXT[],
    fuentes_alimentarias TEXT[],
    dosis_recomendada VARCHAR(100),
    interacciones TEXT[],
    contraindicaciones TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para busqueda rapida
CREATE INDEX IF NOT EXISTS idx_ingredient_knowledge_id ON public.ingredient_knowledge(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_knowledge_categoria ON public.ingredient_knowledge(categoria);

-- =====================================================
-- TABLA: ingredient_relationships
-- Relaciones entre ingredientes (sinergias y antagonismos)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ingredient_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient1_id VARCHAR(100) NOT NULL REFERENCES public.ingredient_knowledge(ingredient_id),
    ingredient2_id VARCHAR(100) NOT NULL REFERENCES public.ingredient_knowledge(ingredient_id),
    tipo_relacion VARCHAR(20) NOT NULL CHECK (tipo_relacion IN ('sinergia', 'antagonismo')),
    nivel VARCHAR(10) NOT NULL CHECK (nivel IN ('alto', 'medio', 'bajo')),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('potenciador', 'complementario', 'cofactor', 'competidor', 'inhibidor', 'bloqueador')),
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(ingredient1_id, ingredient2_id)
);

-- Index para busqueda
CREATE INDEX IF NOT EXISTS idx_relationships_ing1 ON public.ingredient_relationships(ingredient1_id);
CREATE INDEX IF NOT EXISTS idx_relationships_ing2 ON public.ingredient_relationships(ingredient2_id);
CREATE INDEX IF NOT EXISTS idx_relationships_tipo ON public.ingredient_relationships(tipo_relacion);

-- =====================================================
-- TABLA: product_synergies
-- Sinergias calculadas entre productos
-- =====================================================
CREATE TABLE IF NOT EXISTS public.product_synergies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto1_sku VARCHAR(100) NOT NULL,
    producto2_sku VARCHAR(100) NOT NULL,
    nivel_sinergia VARCHAR(10) CHECK (nivel_sinergia IN ('alto', 'medio', 'bajo')),
    tipo_relacion VARCHAR(20),
    descripcion TEXT,
    beneficios_combinados TEXT[],
    explicacion TEXT,
    ingredientes_involucrados TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(producto1_sku, producto2_sku)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_product_synergies_p1 ON public.product_synergies(producto1_sku);
CREATE INDEX IF NOT EXISTS idx_product_synergies_p2 ON public.product_synergies(producto2_sku);
CREATE INDEX IF NOT EXISTS idx_product_synergies_nivel ON public.product_synergies(nivel_sinergia);

-- =====================================================
-- TABLA: product_ingredient_analysis
-- Analisis de ingredientes de cada producto
-- =====================================================
CREATE TABLE IF NOT EXISTS public.product_ingredient_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_sku VARCHAR(100) UNIQUE NOT NULL,
    ingredientes_encontrados TEXT[],
    ingredientes_sin_match TEXT[],
    cobertura_kb INTEGER DEFAULT 0,
    categoria_predominante VARCHAR(50),
    analisis_explicacion TEXT,
    nivel_analisis_completo INTEGER DEFAULT 0,
    requiere_ia_externa BOOLEAN DEFAULT FALSE,
    fecha_analisis TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_analysis_producto ON public.product_ingredient_analysis(producto_sku);
CREATE INDEX IF NOT EXISTS idx_analysis_cobertura ON public.product_ingredient_analysis(cobertura_kb);

-- =====================================================
-- TABLA: analysis_cache
-- Cache de analisis por fecha
-- =====================================================
CREATE TABLE IF NOT EXISTS public.analysis_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    cache_type VARCHAR(50) NOT NULL,
    data JSONB NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_cache_key ON public.analysis_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON public.analysis_cache(expires_at);

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Funcion para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para ingredient_knowledge
DROP TRIGGER IF EXISTS update_ingredient_knowledge_updated_at ON public.ingredient_knowledge;
CREATE TRIGGER update_ingredient_knowledge_updated_at
    BEFORE UPDATE ON public.ingredient_knowledge
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para ingredient_relationships
DROP TRIGGER IF EXISTS update_ingredient_relationships_updated_at ON public.ingredient_relationships;
CREATE TRIGGER update_ingredient_relationships_updated_at
    BEFORE UPDATE ON public.ingredient_relationships
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para product_synergies
DROP TRIGGER IF EXISTS update_product_synergies_updated_at ON public.product_synergies;
CREATE TRIGGER update_product_synergies_updated_at
    BEFORE UPDATE ON public.product_synergies
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para product_ingredient_analysis
DROP TRIGGER IF EXISTS update_product_ingredient_analysis_updated_at ON public.product_ingredient_analysis;
CREATE TRIGGER update_product_ingredient_analysis_updated_at
    BEFORE UPDATE ON public.product_ingredient_analysis
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

ALTER TABLE public.ingredient_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredient_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_synergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_ingredient_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_cache ENABLE ROW LEVEL SECURITY;

-- Politicas publicas para lectura
CREATE POLICY "Allow public read ingredient_knowledge" ON public.ingredient_knowledge
    FOR SELECT USING (true);

CREATE POLICY "Allow public read ingredient_relationships" ON public.ingredient_relationships
    FOR SELECT USING (true);

CREATE POLICY "Allow public read product_synergies" ON public.product_synergies
    FOR SELECT USING (true);

CREATE POLICY "Allow public read product_ingredient_analysis" ON public.product_ingredient_analysis
    FOR SELECT USING (true);

CREATE POLICY "Allow public read analysis_cache" ON public.analysis_cache
    FOR SELECT USING (true);

-- Politicas para insert/update (autenticado)
CREATE POLICY "Allow authenticated insert ingredient_knowledge" ON public.ingredient_knowledge
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update ingredient_knowledge" ON public.ingredient_knowledge
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert ingredient_relationships" ON public.ingredient_relationships
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert product_synergies" ON public.product_synergies
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update product_synergies" ON public.product_synergies
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert product_ingredient_analysis" ON public.product_ingredient_analysis
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update product_ingredient_analysis" ON public.product_ingredient_analysis
    FOR UPDATE USING (auth.role() = 'authenticated');

-- =====================================================
-- FUNCIONES UTILES
-- =====================================================

-- Obtener sinergias de un ingrediente
CREATE OR REPLACE FUNCTION public.get_ingredient_synergies(p_ingredient_id VARCHAR)
RETURNS TABLE (
    ingrediente_relacionado VARCHAR,
    nivel VARCHAR,
    tipo VARCHAR,
    descripcion TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN r.ingredient1_id = p_ingredient_id THEN r.ingredient2_id
            ELSE r.ingredient1_id
        END as ingrediente_relacionado,
        r.nivel,
        r.tipo,
        r.descripcion
    FROM public.ingredient_relationships r
    WHERE (r.ingredient1_id = p_ingredient_id OR r.ingredient2_id = p_ingredient_id)
    AND r.tipo_relacion = 'sinergia';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Obtener productos complementarios
CREATE OR REPLACE FUNCTION public.get_complementary_products(p_product_sku VARCHAR)
RETURNS TABLE (
    producto_complementario VARCHAR,
    nivel_sinergia VARCHAR,
    descripcion TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN ps.producto1_sku = p_product_sku THEN ps.producto2_sku
            ELSE ps.producto1_sku
        END as producto_complementario,
        ps.nivel_sinergia,
        ps.descripcion
    FROM public.product_synergies ps
    WHERE (ps.producto1_sku = p_product_sku OR ps.producto2_sku = p_product_sku)
    AND ps.nivel_sinergia = 'alto'
    ORDER BY ps.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SEED DATA: Ingredientes basicos
-- =====================================================

INSERT INTO public.ingredient_knowledge (ingredient_id, nombre, categoria, descripcion, mecanismo_accion, beneficios, dosis_recomendada)
VALUES 
    ('vitamina_c', 'Vitamina C (Acido Ascorbico)', 'vitaminas', 
     'Antioxidante hidrosoluble esencial para el sistema inmunologico, sintesis de kolageno y absorcion de hierro.',
     'Actua como antioxidante, neutraliza radicales libres, esencial para sintesis de kolageno.',
     ARRAY['Refuerza el sistema inmunologico', 'Protege contra dano oxidativo', 'Favorece la sintesis de kolageno'],
     '75-90mg/dia'),
    ('zinc', 'Zinc', 'minerales',
     'Mineral esencial para mas de 300 enzimas, funcion inmune, cicatrizacion y sintesis de proteinas.',
     'Cofactor de metaloenzimas, estructura de proteinas, funcion inmune.',
     ARRAY['Fortalecimiento inmune', 'Cicatrizacion de heridas', 'Sintesis de proteinas'],
     '8-11mg/dia'),
    ('magnesio', 'Magnesio', 'minerales',
     'Mineral esencial para mas de 600 reacciones enzimaticas, funcion muscular, nerviosa y cardiovascular.',
     'Cofactor de ATP, contracciones musculares, transmision nerviosa.',
     ARRAY['Relajacion muscular', 'Funcion nerviosa', 'Salud cardiovascular'],
     '310-420mg/dia'),
    ('vitamina_d3', 'Vitamina D3 (Colecalciferol)', 'vitaminas',
     'Vitamina liposoluble esencial para absorcion de calcio, funcion muscular y neurologica.',
     'Se convierte en calcitriol, hormona que regula absorcion de calcio y fosfato.',
     ARRAY['Esencial para absorcion de calcio', 'Fortalecimiento oseo', 'Soporte inmunologico'],
     '600-2000 UI/dia'),
    ('omega_3', 'Omega-3 (EPA y DHA)', 'acidos_grasos',
     'Acidos grasos esenciales antiinflamatorios para cerebro, corazon y articulaciones.',
     'Precursores de resolvias/protectinas antiinflamatorias, estructura neuronal.',
     ARRAY['Antiinflamatorio natural', 'Salud cardiovascular', 'Funcion cerebral'],
     '1000-3000mg EPA+DHA/dia')
ON CONFLICT (ingredient_id) DO NOTHING;

-- Relaciones basicas
INSERT INTO public.ingredient_relationships (ingredient1_id, ingredient2_id, tipo_relacion, nivel, tipo, descripcion)
VALUES
    ('vitamina_c', 'zinc', 'sinergia', 'alto', 'complementario', 'Sinergia en funcion inmunologica'),
    ('vitamina_d3', 'calcio', 'sinergia', 'alto', 'potenciador', 'Esencial para absorcion de calcio'),
    ('vitamina_d3', 'magnesio', 'sinergia', 'alto', 'cofactor', 'Cofactor en activacion de vitamina D'),
    ('omega_3', 'vitamina_d3', 'sinergia', 'alto', 'complementario', 'Absorcion y utilizacion'),
    ('zinc', 'magnesio', 'sinergia', 'medio', 'complementario', 'Absorcion intestinal competitiva'),
    ('vitamina_c', 'hierro', 'sinergia', 'alto', 'complementario', 'Mejora absorcion de hierro no hemo')
ON CONFLICT (ingredient1_id, ingredient2_id) DO NOTHING;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- =====================================================
-- VERIFICACION
-- =====================================================
SELECT 'Tablas creadas exitosamente' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
