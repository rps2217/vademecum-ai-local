-- ============================================================================
-- Blindaje de integridad referencial para expansión segura de la KB
-- ----------------------------------------------------------------------------
-- Cambia la FK de product_ingredients.ingredient_id de RESTRICT (default)
-- a ON DELETE SET NULL, de modo que borrar un ingrediente de la KB (en una
-- reorganización/expansión) no rompa la integridad: el match queda NULL
-- (gap) en lugar de bloquear el DELETE. synergies ya es ON DELETE CASCADE.
--
-- Seguro: reemplaza la constraint existente por una equivalente con la
-- cláusula ON DELETE. No afecta a los datos actuales.
-- ============================================================================

ALTER TABLE public.product_ingredients
    DROP CONSTRAINT IF EXISTS product_ingredients_ingredient_id_fkey;

ALTER TABLE public.product_ingredients
    ADD CONSTRAINT product_ingredients_ingredient_id_fkey
    FOREIGN KEY (ingredient_id) REFERENCES public.ingredients (id)
    ON DELETE SET NULL;

COMMENT ON CONSTRAINT product_ingredients_ingredient_id_fkey ON public.product_ingredients
    IS 'SET NULL al borrar ingrediente: el match pasa a gap (NULL) en vez de bloquear el DELETE. Permite reorganizar la KB sin romper integridad.';
