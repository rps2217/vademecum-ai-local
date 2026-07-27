-- ============================================
-- VADEMECUM AI - MIGRATION V2
-- Productos normalizados + Protocols + pgvector
-- ============================================

-- 1. HABILITAR pgvector para búsqueda semántica
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- PRODUCTS_V2 - Productos normalizados
-- Usamos TEXT en lugar de VARCHAR para evitar problemas de longitud
-- ============================================

CREATE TABLE IF NOT EXISTS products_v2 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku TEXT UNIQUE NOT NULL,
  nombre_comercial TEXT,
  
  -- Datos principales (TEXT para evitar truncamiento)
  descripcion TEXT,
  principios_activos TEXT[],
  indicaciones TEXT[],
  advertencias TEXT,
  posologia TEXT,
  marca TEXT,
  categoria TEXT,
  
  -- Seguridad del paciente (campos booleanos)
  apto_celiacos BOOLEAN DEFAULT false,
  apto_embarazo BOOLEAN DEFAULT false,
  apto_lactancia BOOLEAN DEFAULT false,
  apto_pediatria BOOLEAN DEFAULT false,
  apto_diabeticos BOOLEAN DEFAULT false,
  alto_consumo_sodio BOOLEAN DEFAULT false,
  
  -- IA y Análisis
  tags_ia TEXT[],
  vectors BYTEA,
  vectors_dims INT DEFAULT 384,
  synergy_analyzed BOOLEAN DEFAULT false,
  sugerencia_complementaria TEXT,
  analysis_notes JSONB,
  
  -- Seguridad y verificación
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  locked_by_ai BOOLEAN DEFAULT false,
  lock_timestamp BIGINT,
  lock_uid TEXT,
  
  -- SKUs relacionados
  skus_relacionados TEXT[],
  source_url TEXT,
  
  -- Sync
  is_synced_cloud BOOLEAN DEFAULT false,
  last_synced_cloud TIMESTAMPTZ,
  
  -- Estados
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ
);

-- Índices para products_v2
CREATE INDEX IF NOT EXISTS idx_products_v2_sku ON products_v2(sku);
CREATE INDEX IF NOT EXISTS idx_products_v2_nombre ON products_v2(nombre_comercial);
CREATE INDEX IF NOT EXISTS idx_products_v2_marca ON products_v2(marca);
CREATE INDEX IF NOT EXISTS idx_products_v2_categoria ON products_v2(categoria);
CREATE INDEX IF NOT EXISTS idx_products_v2_principios ON products_v2 USING GIN(principios_activos);
CREATE INDEX IF NOT EXISTS idx_products_v2_indicaciones ON products_v2 USING GIN(indicaciones);
CREATE INDEX IF NOT EXISTS idx_products_v2_tags ON products_v2 USING GIN(tags_ia);
CREATE INDEX IF NOT EXISTS idx_products_v2_synergy ON products_v2(synergy_analyzed) WHERE synergy_analyzed = true;

-- ============================================
-- PROTOCOLS - Protocolos de suplementación
-- ============================================

CREATE TABLE IF NOT EXISTS protocols (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identificación
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  icon TEXT,
  color TEXT,
  
  -- Objetivo
  objetivo_principal TEXT,
  duracion_dias INT,
  dificultad TEXT DEFAULT 'intermedia',
  
  -- Fases del protocolo
  phases JSONB,
  
  -- Ingredientes del protocolo
  ingredients JSONB,
  
  -- Resultados esperados
  resultados_esperados TEXT[],
  indicadores_seguir TEXT[],
  
  -- Precauciones
  contraindicaciones TEXT[],
  advertencias TEXT,
  interacciones TEXT[],
  
  -- Evidencia
  evidencia_level TEXT DEFAULT 'C',
  referencias TEXT[],
  estudios_clinicos TEXT[],
  
  -- Estados
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  
  -- Metadata
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INT DEFAULT 1
);

-- Índices para protocols
CREATE INDEX IF NOT EXISTS idx_protocols_name ON protocols(name);
CREATE INDEX IF NOT EXISTS idx_protocols_category ON protocols(category);
CREATE INDEX IF NOT EXISTS idx_protocols_difficulty ON protocols(dificultad);
CREATE INDEX IF NOT EXISTS idx_protocols_duration ON protocols(duracion_dias);
CREATE INDEX IF NOT EXISTS idx_protocols_evidence ON protocols(evidencia_level);

-- ============================================
-- MIGRATE DATA - De products a products_v2
-- ============================================

-- Función helper para convertir JSON array a TEXT[]
CREATE OR REPLACE FUNCTION jsonb_to_text_array(val JSONB)
RETURNS TEXT[] AS $$
BEGIN
  IF val IS NULL THEN
    RETURN NULL;
  END IF;
  IF jsonb_typeof(val) = 'array' THEN
    RETURN ARRAY(SELECT jsonb_array_elements_text(val));
  END IF;
  -- Si es scalar, envolver en array
  RETURN ARRAY[val #>> '{}'];
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Migrar productos existentes
INSERT INTO products_v2 (
  sku,
  nombre_comercial,
  descripcion,
  principios_activos,
  indicaciones,
  advertencias,
  posologia,
  tags_ia,
  vectors,
  synergy_analyzed,
  sugerencia_complementaria,
  analysis_notes,
  source_url,
  is_verified,
  verified_at,
  verified_by,
  locked_by_ai,
  lock_timestamp,
  lock_uid,
  skus_relacionados,
  is_synced_cloud,
  last_synced_cloud,
  is_active,
  created_at,
  updated_at,
  last_updated
)
SELECT 
  p.sku,
  COALESCE(p.nombre_comercial, p.data->>'nombre_comercial'),
  p.data->>'descripcion',
  jsonb_to_text_array(p.data->'principios_activos'),
  jsonb_to_text_array(p.data->'indicaciones'),
  p.data->>'advertencias',
  p.data->>'posologia',
  jsonb_to_text_array(p.data->'tags_ia'),
  NULL,
  COALESCE((p.data->>'synergy_analyzed')::BOOLEAN, false),
  p.data->>'sugerencia_complementaria',
  p.data->'analisis_componentes',
  p.data->>'source_url',
  COALESCE((p.data->>'is_verified')::BOOLEAN, false),
  CASE WHEN p.data->>'verified_at' IS NOT NULL 
    THEN (p.data->>'verified_at')::TIMESTAMPTZ 
    ELSE NULL END,
  NULL,
  COALESCE((p.data->>'locked_by_ai')::BOOLEAN, false),
  CASE WHEN p.data->>'lock_timestamp' IS NOT NULL 
    THEN (p.data->>'lock_timestamp')::BIGINT 
    ELSE NULL END,
  p.data->>'lock_uid',
  jsonb_to_text_array(p.data->'skus_relacionados'),
  COALESCE((p.data->>'is_synced_cloud')::BOOLEAN, false),
  CASE WHEN p.data->>'last_synced_cloud' IS NOT NULL 
    THEN (p.data->>'last_synced_cloud')::TIMESTAMPTZ 
    ELSE NULL END,
  true,
  p.last_updated,
  p.last_updated,
  p.last_updated
FROM products p
ON CONFLICT (sku) DO NOTHING;

-- Log de migración
DO $$
DECLARE
  migrated_count INT;
BEGIN
  SELECT COUNT(*) INTO migrated_count FROM products_v2;
  RAISE NOTICE 'MIGRACIÓN COMPLETADA: % productos migrados a products_v2', migrated_count;
END $$;

-- ============================================
-- FUNCTIONS Y TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_products_v2_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_products_v2_updated_at
  BEFORE UPDATE ON products_v2
  FOR EACH ROW
  EXECUTE FUNCTION update_products_v2_timestamp();

CREATE OR REPLACE FUNCTION update_protocols_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_protocols_updated_at
  BEFORE UPDATE ON protocols
  FOR EACH ROW
  EXECUTE FUNCTION update_protocols_timestamp();

-- ============================================
-- VISTAS ÚTILES
-- ============================================

CREATE OR REPLACE VIEW v_products_with_safety AS
SELECT 
  id,
  sku,
  nombre_comercial,
  descripcion,
  principios_activos,
  indicaciones,
  marca,
  categoria,
  CASE WHEN apto_celiacos THEN '✅' ELSE '❌' END as celiacos,
  CASE WHEN NOT apto_embarazo THEN '⚠️' ELSE '✅' END as embarazo,
  CASE WHEN NOT apto_lactancia THEN '⚠️' ELSE '✅' END as lactancia,
  CASE WHEN NOT apto_pediatria THEN '⚠️' ELSE '✅' END as pediatria,
  synergy_analyzed,
  tags_ia,
  sugerencia_complementaria,
  is_verified,
  is_featured,
  created_at
FROM products_v2
WHERE is_active = true;

CREATE OR REPLACE VIEW v_protocols_active AS
SELECT 
  id,
  name,
  description,
  category,
  objetivo_principal,
  duracion_dias,
  dificultad,
  evidencia_level,
  is_featured,
  jsonb_array_length(COALESCE(ingredients, '[]'::JSONB)) as total_ingredientes
FROM protocols
WHERE is_active = true
ORDER BY is_featured DESC, created_at DESC;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE products_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read products_v2" ON products_v2
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read protocols" ON protocols
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin write products_v2" ON products_v2
  FOR ALL USING (true);

CREATE POLICY "Admin write protocols" ON protocols
  FOR ALL USING (true);

-- ============================================
-- DATOS DE EJEMPLO - Protocolos
-- ============================================

INSERT INTO protocols (name, description, category, objetivo_principal, duracion_dias, dificultad, evidencia_level, ingredients, contraindicaciones, is_active, is_featured) VALUES
(
  'Refuerzo Inmunológico',
  'Protocolo para fortalecer el sistema inmune durante épocas de frío o estrés.',
  'inmunidad',
  'Fortalecer el sistema inmunológico de forma natural',
  30,
  'baja',
  'B',
  '[{"nombre": "Vitamina C", "dosis": "1000mg", "momento": "mañana"}, {"nombre": "Zinc", "dosis": "30mg", "momento": "almuerzo"}, {"nombre": "Equinácea", "dosis": "500mg", "momento": "tarde"}]'::JSONB,
  ARRAY['Alergia a algún componente', 'Enfermedades autoinmunes'],
  true,
  true
),
(
  'Mejora del Sueño',
  'Protocolo natural para mejorar la calidad del sueño sin efectos secundarios.',
  'sueño',
  'Mejorar la calidad y duración del sueño',
  45,
  'baja',
  'B',
  '[{"nombre": "Melatonina", "dosis": "3mg", "momento": "30min antes de dormir"}, {"nombre": "Valeriana", "dosis": "500mg", "momento": "30min antes de dormir"}, {"nombre": "Magnesio", "dosis": "400mg", "momento": "cena"}]'::JSONB,
  ARRAY['Embarazo', 'Lactancia', 'Conducción nocturna'],
  true,
  true
),
(
  'Salud Articular',
  'Protocolo para mantener articulaciones sanas y reducir inflamación.',
  'articulaciones',
  'Reducir inflamación articular y mejorar movilidad',
  90,
  'intermedia',
  'B',
  '[{"nombre": "Colágeno", "dosis": "10g", "momento": "mañana en ayunas"}, {"nombre": "Glucosamina", "dosis": "1500mg", "momento": "almuerzo"}, {"nombre": "Omega-3", "dosis": "2000mg", "momento": "cena"}]'::JSONB,
  ARRAY['Alergia al marisco (Omega-3)', 'Anticoagulantes'],
  true,
  false
),
(
  'Manejo del Estrés',
  'Protocolo adaptogénico para manejar el estrés crónico.',
  'estres',
  'Reducir niveles de cortisol y mejorar respuesta al estrés',
  60,
  'intermedia',
  'B',
  '[{"nombre": "Ashwagandha", "dosis": "600mg", "momento": "mañana"}, {"nombre": "Magnesio", "dosis": "400mg", "momento": "tarde"}, {"nombre": "Vitamina B Complex", "dosis": "1 cápsula", "momento": "desayuno"}]'::JSONB,
  ARRAY['Embarazo', 'Lactancia', 'Tiroides'],
  true,
  false
),
(
  'Energía y Vitalidad',
  'Protocolo para combatir la fatiga y mejorar niveles de energía.',
  'energia',
  'Aumentar energía y reducir fatiga',
  30,
  'baja',
  'B',
  '[{"nombre": "Vitamina B12", "dosis": "1000mcg", "momento": "mañana sublingual"}, {"nombre": "Hierro", "dosis": "18mg", "momento": "almuerzo"}, {"nombre": "CoQ10", "dosis": "100mg", "momento": "desayuno"}]'::JSONB,
  ARRAY['Hemocromatosis', 'Embarazo'],
  true,
  false
);

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE products_v2 IS 'Productos normalizados - migración desde products.data JSONB';
COMMENT ON TABLE protocols IS 'Protocolos de suplementación personalizados';

-- ============================================
-- FIN MIGRATION V2
-- ============================================
