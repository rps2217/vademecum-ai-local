-- =====================================================
-- FIX SYNC RLS POLICIES - Vademecum AI
-- =====================================================
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- URL: https://supabase.com/dashboard/project/pspxqzwxulgmzarlqwtt/sql/new
-- =====================================================
-- PROBLEMA: Error 42501 - RLS bloquea INSERT/UPDATE/DELETE
-- CAUSA: Políticas actuales requieren autenticación para escritura
-- SOLUCIÓN: Crear políticas RLS públicas para escritura
-- =====================================================

-- =====================================================
-- PASO 1: extended_ingredients - Políticas RLS
-- =====================================================

-- Eliminar políticas restrictivas existentes
DROP POLICY IF EXISTS "Allow authenticated insert ingredient_knowledge" ON public.extended_ingredients;
DROP POLICY IF EXISTS "Public insert extended_ingredients" ON public.extended_ingredients;

-- Crear políticas públicas para extended_ingredients
CREATE POLICY "Public can read extended_ingredients" ON public.extended_ingredients
    FOR SELECT USING (true);

CREATE POLICY "Public can insert extended_ingredients" ON public.extended_ingredients
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update extended_ingredients" ON public.extended_ingredients
    FOR UPDATE USING (true);

CREATE POLICY "Public can delete extended_ingredients" ON public.extended_ingredients
    FOR DELETE USING (true);

-- =====================================================
-- PASO 2: ingredient_relationships - Políticas RLS
-- =====================================================

-- Eliminar políticas restrictivas existentes
DROP POLICY IF EXISTS "Allow authenticated insert ingredient_relationships" ON public.ingredient_relationships;
DROP POLICY IF EXISTS "Public insert ingredient_relationships" ON public.ingredient_relationships;

-- Crear políticas públicas para ingredient_relationships
CREATE POLICY "Public can read ingredient_relationships" ON public.ingredient_relationships
    FOR SELECT USING (true);

CREATE POLICY "Public can insert ingredient_relationships" ON public.ingredient_relationships
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update ingredient_relationships" ON public.ingredient_relationships
    FOR UPDATE USING (true);

CREATE POLICY "Public can delete ingredient_relationships" ON public.ingredient_relationships
    FOR DELETE USING (true);

-- =====================================================
-- PASO 3: protocols - Políticas RLS (si existen)
-- =====================================================

-- Verificar si existen y crear políticas si es necesario
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'protocols'
    ) THEN
        DROP POLICY IF EXISTS "Public insert protocols" ON public.protocols;
        
        CREATE POLICY "Public can read protocols" ON public.protocols
            FOR SELECT USING (true);

        CREATE POLICY "Public can insert protocols" ON public.protocols
            FOR INSERT WITH CHECK (true);

        CREATE POLICY "Public can update protocols" ON public.protocols
            FOR UPDATE USING (true);
            
        RAISE NOTICE 'protocols table policies created';
    ELSE
        RAISE NOTICE 'protocols table not found, skipping';
    END IF;
END $$;

-- =====================================================
-- PASO 4: Verificación
-- =====================================================

DO $$
DECLARE
    policies_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policies_count
    FROM pg_policies
    WHERE schemaname = 'public' 
    AND policyname LIKE 'Public%';
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VERIFICACIÓN DE RLS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Políticas públicas creadas: %', policies_count;
    
    IF policies_count >= 4 THEN
        RAISE NOTICE '';
        RAISE NOTICE '✅ RLS corregido exitosamente!';
        RAISE NOTICE '';
        RAISE NOTICE 'Ahora el sync debería funcionar.';
        RAISE NOTICE 'Prueba: Recarga la app y ejecuta sync manual.';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '⚠️ Verifica que las políticas se crearon correctamente.';
    END IF;
END $$;

-- Mostrar políticas creadas
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
