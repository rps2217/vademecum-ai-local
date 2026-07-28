-- =====================================================
-- SCHEMA PARA VADEMECUM AI - SUPABASE
-- =====================================================
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- https://supabase.com/dashboard
-- =====================================================

-- =====================================================
-- TABLA: ingredients
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ingredients (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    sinonimos TEXT[] DEFAULT '{}',
    categoria TEXT NOT NULL,
    familia TEXT,
    sistemas TEXT[] DEFAULT '{}',
    indicaciones TEXT[] DEFAULT '{}',
    evidencia TEXT DEFAULT 'C' CHECK (evidencia IN ('A', 'B', 'C', 'D')),
    propiedades TEXT[] DEFAULT '{}',
    seguridad JSONB DEFAULT '{}',
    interacciones TEXT[] DEFAULT '{}',
    fuentes TEXT[] DEFAULT '{}',
    lamport INTEGER DEFAULT 0,
    device_id TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tombstone INTEGER DEFAULT 0 CHECK (tombstone IN (0, 1))
);

-- Indices para ingredients
CREATE INDEX IF NOT EXISTS idx_ingredients_categoria ON public.ingredients(categoria);
CREATE INDEX IF NOT EXISTS idx_ingredients_evidencia ON public.ingredients(evidencia);
CREATE INDEX IF NOT EXISTS idx_ingredients_updated_at ON public.ingredients(updated_at);

-- =====================================================
-- TABLA: synergies
-- =====================================================
CREATE TABLE IF NOT EXISTS public.synergies (
    id TEXT PRIMARY KEY,
    ingrediente_a TEXT NOT NULL,
    ingrediente_b TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('sinergia', 'complemento', 'interaccion', 'antagonismo')),
    nivel TEXT DEFAULT 'medio' CHECK (nivel IN ('bajo', 'medio', 'alto', 'critico')),
    mecanismo TEXT,
    evidencia TEXT DEFAULT 'C' CHECK (evidencia IN ('A', 'B', 'C', 'D')),
    descripcion TEXT,
    fuentes TEXT[] DEFAULT '{}',
    lamport INTEGER DEFAULT 0,
    device_id TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    tombstone INTEGER DEFAULT 0 CHECK (tombstone IN (0, 1))
);

-- Indices para synergies
CREATE INDEX IF NOT EXISTS idx_synergies_ingrediente_a ON public.synergies(ingrediente_a);
CREATE INDEX IF NOT EXISTS idx_synergies_ingrediente_b ON public.synergies(ingrediente_b);
CREATE INDEX IF NOT EXISTS idx_synergies_tipo ON public.synergies(tipo);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.synergies ENABLE ROW LEVEL SECURITY;

-- Politicas publicas para sync
CREATE POLICY "Public can read ingredients" ON public.ingredients FOR SELECT USING (true);
CREATE POLICY "Public can insert ingredients" ON public.ingredients FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update ingredients" ON public.ingredients FOR UPDATE USING (true);
CREATE POLICY "Public can delete ingredients" ON public.ingredients FOR DELETE USING (true);

CREATE POLICY "Public can read synergies" ON public.synergies FOR SELECT USING (true);
CREATE POLICY "Public can insert synergies" ON public.synergies FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update synergies" ON public.synergies FOR UPDATE USING (true);
CREATE POLICY "Public can delete synergies" ON public.synergies FOR DELETE USING (true);
