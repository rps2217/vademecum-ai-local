-- =====================================================
-- FIX RLS COMPLETO - Vademecum AI
-- =====================================================
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =====================================================
-- Este script elimina TODAS las políticas y las recrea
-- =====================================================

-- =====================================================
-- 1. Eliminar TODAS las políticas de extended_ingredients
-- =====================================================
DROP POLICY IF EXISTS "Public can read extended_ingredients" ON public.extended_ingredients;
DROP POLICY IF EXISTS "Public can insert extended_ingredients" ON public.extended_ingredients;
DROP POLICY IF EXISTS "Public can update extended_ingredients" ON public.extended_ingredients;
DROP POLICY IF EXISTS "Public can delete extended_ingredients" ON public.extended_ingredients;
DROP POLICY IF EXISTS "Public read extended_ingredients" ON public.extended_ingredients;
DROP POLICY IF EXISTS "Public insert extended_ingredients" ON public.extended_ingredients;
DROP POLICY IF EXISTS "Public update extended_ingredients" ON public.extended_ingredients;
DROP POLICY IF EXISTS "Public delete extended_ingredients" ON public.extended_ingredients;
DROP POLICY IF EXISTS "Allow public read extended_ingredients" ON public.extended_ingredients;
DROP POLICY IF EXISTS "Allow public insert extended_ingredients" ON public.extended_ingredients;
DROP POLICY IF EXISTS "Allow public update extended_ingredients" ON public.extended_ingredients;
DROP POLICY IF EXISTS "Allow public delete extended_ingredients" ON public.extended_ingredients;
DROP POLICY IF EXISTS "Allow authenticated insert extended_ingredients" ON public.extended_ingredients;

-- Recrear políticas públicas
CREATE POLICY "Public can read extended_ingredients" ON public.extended_ingredients FOR SELECT USING (true);
CREATE POLICY "Public can insert extended_ingredients" ON public.extended_ingredients FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update extended_ingredients" ON public.extended_ingredients FOR UPDATE USING (true);
CREATE POLICY "Public can delete extended_ingredients" ON public.extended_ingredients FOR DELETE USING (true);

-- =====================================================
-- 2. Eliminar TODAS las políticas de ingredient_relationships
-- =====================================================
DROP POLICY IF EXISTS "Public can read ingredient_relationships" ON public.ingredient_relationships;
DROP POLICY IF EXISTS "Public can insert ingredient_relationships" ON public.ingredient_relationships;
DROP POLICY IF EXISTS "Public can update ingredient_relationships" ON public.ingredient_relationships;
DROP POLICY IF EXISTS "Public can delete ingredient_relationships" ON public.ingredient_relationships;
DROP POLICY IF EXISTS "Public read ingredient_relationships" ON public.ingredient_relationships;
DROP POLICY IF EXISTS "Public insert ingredient_relationships" ON public.ingredient_relationships;
DROP POLICY IF EXISTS "Public update ingredient_relationships" ON public.ingredient_relationships;
DROP POLICY IF EXISTS "Public delete ingredient_relationships" ON public.ingredient_relationships;
DROP POLICY IF EXISTS "Allow public read ingredient_relationships" ON public.ingredient_relationships;
DROP POLICY IF EXISTS "Allow public insert ingredient_relationships" ON public.ingredient_relationships;
DROP POLICY IF EXISTS "Allow public update ingredient_relationships" ON public.ingredient_relationships;
DROP POLICY IF EXISTS "Allow public delete ingredient_relationships" ON public.ingredient_relationships;
DROP POLICY IF EXISTS "Allow authenticated insert ingredient_relationships" ON public.ingredient_relationships;

-- Recrear políticas públicas
CREATE POLICY "Public can read ingredient_relationships" ON public.ingredient_relationships FOR SELECT USING (true);
CREATE POLICY "Public can insert ingredient_relationships" ON public.ingredient_relationships FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update ingredient_relationships" ON public.ingredient_relationships FOR UPDATE USING (true);
CREATE POLICY "Public can delete ingredient_relationships" ON public.ingredient_relationships FOR DELETE USING (true);

-- =====================================================
-- 3. Eliminar TODAS las políticas de protocols
-- =====================================================
DROP POLICY IF EXISTS "Public can read protocols" ON public.protocols;
DROP POLICY IF EXISTS "Public can insert protocols" ON public.protocols;
DROP POLICY IF EXISTS "Public can update protocols" ON public.protocols;
DROP POLICY IF EXISTS "Public read protocols" ON public.protocols;
DROP POLICY IF EXISTS "Public insert protocols" ON public.protocols;
DROP POLICY IF EXISTS "Public update protocols" ON public.protocols;
DROP POLICY IF EXISTS "Allow public read protocols" ON public.protocols;
DROP POLICY IF EXISTS "Allow public insert protocols" ON public.protocols;
DROP POLICY IF EXISTS "Allow public update protocols" ON public.protocols;

-- Recrear políticas públicas
CREATE POLICY "Public can read protocols" ON public.protocols FOR SELECT USING (true);
CREATE POLICY "Public can insert protocols" ON public.protocols FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update protocols" ON public.protocols FOR UPDATE USING (true);

-- Verificación
SELECT 'RLS fix applied successfully' as status;
