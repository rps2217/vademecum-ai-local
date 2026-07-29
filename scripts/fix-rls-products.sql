-- =====================================================
-- FIX RLS para tabla PRODUCTS - Vademecum AI
-- =====================================================
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =====================================================

-- =====================================================
-- products
-- =====================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Public can read products" ON public.products;
DROP POLICY IF EXISTS "Public can insert products" ON public.products;
DROP POLICY IF EXISTS "Public can update products" ON public.products;
DROP POLICY IF EXISTS "Public can delete products" ON public.products;
DROP POLICY IF EXISTS "Public read products" ON public.products;
DROP POLICY IF EXISTS "Public insert products" ON public.products;
DROP POLICY IF EXISTS "Public update products" ON public.products;
DROP POLICY IF EXISTS "Public delete products" ON public.products;
DROP POLICY IF EXISTS "Allow public read products" ON public.products;
DROP POLICY IF EXISTS "Allow public insert products" ON public.products;
DROP POLICY IF EXISTS "Allow public update products" ON public.products;
DROP POLICY IF EXISTS "Allow public delete products" ON public.products;
DROP POLICY IF EXISTS "anon_read_products" ON public.products;
DROP POLICY IF EXISTS "anon_insert_products" ON public.products;
DROP POLICY IF EXISTS "anon_update_products" ON public.products;
DROP POLICY IF EXISTS "anon_delete_products" ON public.products;
DROP POLICY IF EXISTS "authenticated_read_products" ON public.products;
DROP POLICY IF EXISTS "authenticated_insert_products" ON public.products;
DROP POLICY IF EXISTS "authenticated_update_products" ON public.products;
DROP POLICY IF EXISTS "authenticated_delete_products" ON public.products;

-- Recrear políticas públicas
CREATE POLICY "Public can read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public can insert products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Public can delete products" ON public.products FOR DELETE USING (true);

-- Verificación
SELECT 'RLS for products applied successfully' as status;
