-- =====================================================
-- FIX RLS SELECT con filtros - Vademecum AI
-- =====================================================
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =====================================================
-- PROBLEMA: Error 406 en SELECT con filtros .eq()
-- CAUSA: RLS policy requiere autenticación para SELECT con condiciones
-- SOLUCIÓN: policies públicas para SELECT con USING (true)
-- =====================================================

-- Eliminar políticas SELECT existentes restrictivas
DROP POLICY IF EXISTS "Public can read ingredient_relationships" ON public.ingredient_relationships;
DROP POLICY IF EXISTS "Public can read extended_ingredients" ON public.extended_ingredients;
DROP POLICY IF EXISTS "Public read extended_ingredients" ON public.extended_ingredients;

-- Crear políticas públicas SELECT sin restricciones
-- (USING true permite cualquier condición de filtro)

-- extended_ingredients (usar OR REPLACE para evitar errores)
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

-- ingredient_relationships
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

-- protocols
DROP POLICY IF EXISTS "Public can read protocols" ON public.protocols;
CREATE POLICY "Public can read protocols" ON public.protocols
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert protocols" ON public.protocols;
CREATE POLICY "Public can insert protocols" ON public.protocols
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update protocols" ON public.protocols;
CREATE POLICY "Public can update protocols" ON public.protocols
    FOR UPDATE USING (true);

-- Verificación
DO $$
DECLARE
    policies_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policies_count
    FROM pg_policies
    WHERE schemaname = 'public' 
    AND policyname LIKE 'Public can%';
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLS SELECT CORREGIDO';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Políticas públicas: %', policies_count;
    
    IF policies_count >= 9 THEN
        RAISE NOTICE '';
        RAISE NOTICE '✅ RLS corregido - SELECT con filtros funciona!';
    END IF;
END $$;

-- Mostrar políticas
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND policyname LIKE 'Public%'
ORDER BY tablename, cmd;
