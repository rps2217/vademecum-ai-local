-- =====================================================
-- FIX SYNC RLS POLICIES - Vademecum AI
-- =====================================================
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- URL: https://supabase.com/dashboard/project/pspxqzwxulgmzarlqwtt/sql/new
-- =====================================================
-- PROBLEMA: Error 42501 - RLS bloquea INSERT/UPDATE/DELETE
-- SOLUCIÓN: Crear políticas RLS públicas para escritura
-- =====================================================

-- =====================================================
-- PASO 1: extended_ingredients RLS
-- =====================================================

-- =====================================================
-- PASO 1: Crear tabla extended_ingredients
-- =====================================================
CREATE TABLE IF NOT EXISTS public.extended_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_key VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    scientific_name VARCHAR(200),
    category VARCHAR(50) NOT NULL,
    origin_type VARCHAR(50),
    origin_description TEXT,
    description TEXT,
    mechanism TEXT,
    indications TEXT[] DEFAULT '{}',
    contraindications TEXT[] DEFAULT '{}',
    interactions TEXT[] DEFAULT '{}',
    dosage VARCHAR(100),
    side_effects TEXT,
    synonyms TEXT[] DEFAULT '{}',
    warnings TEXT,
    lamport INTEGER DEFAULT 0,
    device_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    tombstone INTEGER DEFAULT 0 CHECK (tombstone IN (0, 1))
);

-- =====================================================
-- PASO 2: Crear tabla ingredient_relationships
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ingredient_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingrediente1 VARCHAR(100) NOT NULL,
    ingrediente2 VARCHAR(100) NOT NULL,
    tipo_relacion VARCHAR(50) NOT NULL,
    intensidad VARCHAR(20) DEFAULT 'medio',
    nivel VARCHAR(20) DEFAULT 'medio',
    evidencia VARCHAR(10) DEFAULT 'C',
    mecanismo TEXT,
    descripcion TEXT,
    fuentes TEXT[] DEFAULT '{}',
    lamport INTEGER DEFAULT 0,
    device_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    tombstone INTEGER DEFAULT 0 CHECK (tombstone IN (0, 1)),
    UNIQUE(ingrediente1, ingrediente2, tipo_relacion)
);

-- =====================================================
-- PASO 3: Crear índices
-- =====================================================

-- extended_ingredients indices
CREATE INDEX IF NOT EXISTS idx_extended_ingredients_key ON public.extended_ingredients(ingredient_key);
CREATE INDEX IF NOT EXISTS idx_extended_ingredients_category ON public.extended_ingredients(category);
CREATE INDEX IF NOT EXISTS idx_extended_ingredients_updated_at ON public.extended_ingredients(updated_at);

-- ingredient_relationships indices
CREATE INDEX IF NOT EXISTS idx_ingredient_relationships_ing1 ON public.ingredient_relationships(ingrediente1);
CREATE INDEX IF NOT EXISTS idx_ingredient_relationships_ing2 ON public.ingredient_relationships(ingrediente2);
CREATE INDEX IF NOT EXISTS idx_ingredient_relationships_tipo ON public.ingredient_relationships(tipo_relacion);
CREATE INDEX IF NOT EXISTS idx_ingredient_relationships_updated_at ON public.ingredient_relationships(updated_at);

-- =====================================================
-- PASO 4: Habilitar RLS
-- =====================================================
ALTER TABLE public.extended_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredient_relationships ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PASO 5: Crear políticas RLS públicas
-- (Permite operaciones sin autenticación)
-- =====================================================

-- extended_ingredients policies
DROP POLICY IF EXISTS "Public can read extended_ingredients" ON public.extended_ingredients;
CREATE POLICY "Public can read extended_ingredients" ON public.extended_ingredients
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert extended_ingredients" ON public.extended_ingredients;
CREATE POLICY "Public can insert extended_ingredients" ON public.extended_ingredients
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update extended_ingredients" ON public.extended_ingredients;
CREATE POLICY "Public can update extended_ingredients" ON public.extended_ingredients
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public can delete extended_ingredients" ON public.extended_ingredients;
CREATE POLICY "Public can delete extended_ingredients" ON public.extended_ingredients
    FOR DELETE USING (true);

-- ingredient_relationships policies
DROP POLICY IF EXISTS "Public can read ingredient_relationships" ON public.ingredient_relationships;
CREATE POLICY "Public can read ingredient_relationships" ON public.ingredient_relationships
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert ingredient_relationships" ON public.ingredient_relationships;
CREATE POLICY "Public can insert ingredient_relationships" ON public.ingredient_relationships
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update ingredient_relationships" ON public.ingredient_relationships;
CREATE POLICY "Public can update ingredient_relationships" ON public.ingredient_relationships
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public can delete ingredient_relationships" ON public.ingredient_relationships;
CREATE POLICY "Public can delete ingredient_relationships" ON public.ingredient_relationships
    FOR DELETE USING (true);

-- =====================================================
-- PASO 6: Otorgar permisos
-- =====================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- =====================================================
-- PASO 7: Verificación
-- =====================================================
DO $$
DECLARE
    ext_count INTEGER;
    rel_count INTEGER;
BEGIN
    -- Verificar tablas
    SELECT COUNT(*) INTO ext_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'extended_ingredients';
    
    SELECT COUNT(*) INTO rel_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'ingredient_relationships';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VERIFICACIÓN DE SCHEMA';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'extended_ingredients existe: %', ext_count > 0;
    RAISE NOTICE 'ingredient_relationships existe: %', rel_count > 0;
    
    IF ext_count > 0 AND rel_count > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '✅ Schema corregido exitosamente!';
        RAISE NOTICE 'Ahora puedes ejecutar sync nuevamente.';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '❌ Error: Tablas no creadas correctamente';
    END IF;
END $$;

-- Mostrar tablas creadas
SELECT 
    'extended_ingredients' as table_name,
    (SELECT COUNT(*) FROM public.extended_ingredients) as row_count
UNION ALL
SELECT 
    'ingredient_relationships',
    (SELECT COUNT(*) FROM public.ingredient_relationships);

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
