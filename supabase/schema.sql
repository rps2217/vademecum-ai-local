-- ============================================
-- VADEMECUM AI - SUPABASE SCHEMA
-- Base de Conocimiento Modular
-- ============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

-- Categorías de ingredientes
CREATE TYPE ingredient_category AS ENUM (
  'fitoterapia',
  'homeopatia',
  'aceite_esencial',
  'vitaminas',
  'minerales',
  'aminoacidos',
  'probioticos',
  'enzimas',
  'otros'
);

-- Sistemas corporales
CREATE TYPE body_system AS ENUM (
  'nervioso',
  'digestivo',
  'inmune',
  'cardiovascular',
  'respiratorio',
  'musculoesqueletico',
  'endocrino',
  'dermatologico',
  'urinario',
  'reproductivo',
  'ocular',
  'hepatico',
  'metabolico'
);

-- Nivel de evidencia
CREATE TYPE evidence_level AS ENUM (
  'A',  -- Ensayos clínicos sólidos
  'B',  -- Estudios preliminares
  'C',  -- Evidencia tradicional/anecdótica
  'D'   -- Evidencia limitada
);

-- Tipo de sinergia
CREATE TYPE synergy_type AS ENUM (
  'potenciador',    -- Potencia el efecto
  'complementario', -- Completa el efecto
  'cofactor',       -- Es necesario como cofactor
  'secuencial',     -- Actúa en secuencia
  'bioactivador'    -- Activa procesos biológicos
);

-- ============================================
-- TABLAS PRINCIPALES
-- ============================================

-- Tabla de categorías
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES categories(id),
  icon VARCHAR(50),
  color VARCHAR(20),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de sistemas corporales
CREATE TABLE body_systems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla principal de ingredientes
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingredient_key VARCHAR(100) NOT NULL UNIQUE, -- ID semántico: 'valeriana', 'arnica', etc.
  name VARCHAR(200) NOT NULL,
  scientific_name VARCHAR(200),
  family VARCHAR(100), -- Familia botánica/zoológica
  
  category ingredient_category NOT NULL,
  
  -- Información general
  description TEXT,
  mechanism TEXT, -- Mecanismo de acción
  evidence_level evidence_level DEFAULT 'C',
  
  -- Metadata
  origin_type VARCHAR(50), -- planta, mineral, animal, sintetico, microrganismo
  origin_description TEXT,
  
  -- Campos específicos por categoría (JSONB para flexibilidad)
  fitoterapia_data JSONB,
  homeopatia_data JSONB,
  aceite_data JSONB,
  supplements_data JSONB,
  
  -- Búsqueda y SEO
  search_terms TEXT[], -- Términos de búsqueda
  synonyms TEXT[],
  
  -- Estados
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  version INT DEFAULT 1
);

-- Tabla de relaciones ingrediente-sistema
CREATE TABLE ingredient_body_systems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  system_id UUID NOT NULL REFERENCES body_systems(id) ON DELETE CASCADE,
  importance VARCHAR(20) DEFAULT 'primary', -- primary, secondary, tertiary
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ingredient_id, system_id)
);

-- Tabla de indicaciones
CREATE TABLE indications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de relaciones ingrediente-indicación
CREATE TABLE ingredient_indications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  indication_id UUID NOT NULL REFERENCES indications(id) ON DELETE CASCADE,
  evidence_level evidence_level DEFAULT 'C',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ingredient_id, indication_id)
);

-- ============================================
-- TABLAS DE SINERGIAS Y RELACIONES
-- ============================================

-- Tabla de sinergias entre ingredientes
CREATE TABLE synergies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  ingredient_a_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  ingredient_b_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  
  synergy_type synergy_type NOT NULL,
  evidence_level evidence_level DEFAULT 'C',
  
  -- Descripción y detalles
  description TEXT,
  mechanism TEXT, -- Mecanismo de la sinergia
  benefits TEXT[], -- Beneficios específicos
  precautions TEXT[], -- Precauciones
  dosage_notes TEXT, -- Notas de dosificación
  
  -- Validación
  is_validated BOOLEAN DEFAULT false,
  validated_by UUID,
  validated_at TIMESTAMPTZ,
  
  -- Estados
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(ingredient_a_id, ingredient_b_id),
  CHECK (ingredient_a_id < ingredient_b_id) -- Asegurar orden consistente
);

-- Tabla de antagonismos
CREATE TABLE antagonisms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  ingredient_a_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  ingredient_b_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  
  severity VARCHAR(20) DEFAULT 'media', -- alta, media, baja
  
  description TEXT,
  mechanism TEXT,
  alternatives TEXT[], -- Alternativas seguras
  references TEXT[], -- Referencias bibliográficas
  
  is_validated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(ingredient_a_id, ingredient_b_id),
  CHECK (ingredient_a_id < ingredient_b_id)
);

-- ============================================
-- TABLAS DE PRODUCTOS
-- ============================================

-- Tabla de productos
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku VARCHAR(100) UNIQUE,
  name VARCHAR(300) NOT NULL,
  brand VARCHAR(200),
  description TEXT,
  
  -- Información de categorización
  category VARCHAR(100),
  subcategory VARCHAR(100),
  
  -- Estados
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

-- Tabla de relaciones producto-ingrediente
CREATE TABLE product_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  
  amount VARCHAR(50),
  unit VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, ingredient_id)
);

-- ============================================
-- TABLAS DE AUDITORÍA
-- ============================================

-- Historial de cambios
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  operation VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
  old_data JSONB,
  new_data JSONB,
  changed_by UUID,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- ============================================
-- ÍNDICES
-- ============================================

-- Índices para ingredientes
CREATE INDEX idx_ingredients_category ON ingredients(category);
CREATE INDEX idx_ingredients_name ON ingredients(name);
CREATE INDEX idx_ingredients_search_terms ON ingredients USING GIN(search_terms);
CREATE INDEX idx_ingredients_scientific_name ON ingredients(scientific_name);

-- Índices para sinergias
CREATE INDEX idx_synergies_ingredient_a ON synergies(ingredient_a_id);
CREATE INDEX idx_synergies_ingredient_b ON synergies(ingredient_b_id);
CREATE INDEX idx_synergies_type ON synergies(synergy_type);
CREATE INDEX idx_synergies_active ON synergies(is_active) WHERE is_active = true;

-- Índices para antagonismos
CREATE INDEX idx_antagonisms_ingredient_a ON antagonisms(ingredient_a_id);
CREATE INDEX idx_antagonisms_ingredient_b ON antagonisms(ingredient_b_id);

-- Índices para productos
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_brand ON products(brand);

-- Índices para relaciones
CREATE INDEX idx_ingredient_systems_ingredient ON ingredient_body_systems(ingredient_id);
CREATE INDEX idx_ingredient_systems_system ON ingredient_body_systems(system_id);
CREATE INDEX idx_ingredient_indications_ingredient ON ingredient_indications(ingredient_id);
CREATE INDEX idx_ingredient_indications_indication ON ingredient_indications(indication_id);
CREATE INDEX idx_product_ingredients_product ON product_ingredients(product_id);
CREATE INDEX idx_product_ingredients_ingredient ON product_ingredients(ingredient_id);

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en ingredients
CREATE TRIGGER trigger_ingredients_updated_at
  BEFORE UPDATE ON ingredients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Trigger para actualizar updated_at en sinergias
CREATE TRIGGER trigger_synergies_updated_at
  BEFORE UPDATE ON sinergias
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Trigger para actualizar updated_at en antagonismos
CREATE TRIGGER trigger_antagonisms_updated_at
  BEFORE UPDATE ON antagonismos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Trigger para actualizar updated_at en products
CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Función para registrar auditoría
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (table_name, record_id, operation, old_data, new_data)
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers de auditoría
CREATE TRIGGER audit_ingredients
  AFTER INSERT OR UPDATE OR DELETE ON ingredients
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_synergies
  AFTER INSERT OR UPDATE OR DELETE ON sinergias
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista de ingredientes con categorías y sistemas
CREATE OR REPLACE VIEW v_ingredients_full AS
SELECT 
  i.*,
  c.name AS category_name,
  COALESCE(
    (SELECT json_agg(json_build_object(
      'id', bs.id,
      'name', bs.name,
      'importance', ibs.importance
    ))
    FROM ingredient_body_systems ibs
    JOIN body_systems bs ON bs.id = ibs.system_id
    WHERE ibs.ingredient_id = i.id
  ) AS systems,
  COALESCE(
    (SELECT json_agg(json_build_object(
      'id', ind.id,
      'name', ind.name,
      'evidence', iind.evidence_level
    ))
    FROM ingredient_indications iind
    JOIN indications ind ON ind.id = iind.indication_id
    WHERE iind.ingredient_id = i.id
  ) AS indications
FROM ingredients i
JOIN categories c ON c.name = i.category;

-- Vista de sinergias con nombres de ingredientes
CREATE OR REPLACE VIEW v_synergies_full AS
SELECT 
  s.*,
  ia.name AS ingredient_a_name,
  ib.name AS ingredient_b_name,
  ia.category AS ingredient_a_category,
  ib.category AS ingredient_b_category
FROM sinergias s
JOIN ingredients ia ON ia.id = s.ingredient_a_id
JOIN ingredients ib ON ib.id = s.ingredient_b_id
WHERE s.is_active = true;

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Insertar categorías principales
INSERT INTO categories (name, description, sort_order) VALUES
  ('fitoterapia', 'Plantas medicinales para uso terapéutico', 1),
  ('homeopatia', 'Remedios homeopáticos', 2),
  ('aceite_esencial', 'Aceites esenciales para aromaterapia', 3),
  ('vitaminas', 'Vitaminas y suplementos vitamínicos', 4),
  ('minerales', 'Minerales y oligoelementos', 5),
  ('aminoacidos', 'Aminoácidos y proteínas', 6),
  ('probioticos', 'Bacterias beneficiosas', 7),
  ('otros', 'Otros suplementos', 99);

-- Insertar sistemas corporales
INSERT INTO body_systems (name, description, sort_order) VALUES
  ('nervioso', 'Sistema nervioso central y periférico', 1),
  ('digestivo', 'Sistema digestivo y metabolismo', 2),
  ('inmune', 'Sistema inmunológico', 3),
  ('cardiovascular', 'Sistema cardiovascular', 4),
  ('respiratorio', 'Sistema respiratorio', 5),
  ('musculoesqueletico', 'Sistema musculoesquelético', 6),
  ('endocrino', 'Sistema endocrino y hormonal', 7),
  ('dermatologico', 'Piel y anexos', 8),
  ('urinario', 'Sistema urinario', 9),
  ('reproductivo', 'Sistema reproductor', 10),
  ('ocular', 'Salud ocular', 11),
  ('hepatico', 'Hígado y detoxificación', 12),
  ('metabolico', 'Metabolismo general', 13);

-- Insertar indicaciones principales
INSERT INTO indications (name, description, category) VALUES
  ('ansiedad', 'Ansiedad y nerviosismo', 'mental'),
  ('insomnio', 'Trastornos del sueño', 'mental'),
  ('estres', 'Estrés y fatiga', 'mental'),
  ('depresion', 'Depresión leve a moderada', 'mental'),
  ('memoria', 'Memoria y cognición', 'mental'),
  ('inmunidad', 'Fortalecimiento inmune', 'inmune'),
  ('inflamacion', 'Procesos inflamatorios', 'inmune'),
  ('dolor', 'Dolor y analgesia', 'musculoesqueletico'),
  ('articulaciones', 'Salud articular', 'musculoesqueletico'),
  ('huesos', 'Salud ósea', 'musculoesqueletico'),
  ('digestion', 'Función digestiva', 'digestivo'),
  ('nauseas', 'Náuseas y vómitos', 'digestivo'),
  ('higado', 'Función hepática', 'hepatico'),
  ('corazon', 'Salud cardiovascular', 'cardiovascular'),
  ('antioxidante', 'Protección antioxidante', 'general'),
  ('energia', 'Energía y vitalidad', 'general'),
  ('sexual', 'Salud sexual', 'reproductivo');

-- ============================================
-- POLICIES DE SEGURIDAD (RLS)
-- ============================================

-- Habilitar RLS
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE sinergias ENABLE ROW LEVEL SECURITY;
ALTER TABLE antagonismos ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policies públicas (lectura para todos)
CREATE POLICY "Public read ingredients" ON ingredients
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read synergies" ON sinergias
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read antagonisms" ON antagonismos
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read products" ON products
  FOR SELECT USING (is_active = true);

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE ingredients IS 'Tabla principal de ingredientes terapéuticos';
COMMENT ON TABLE synergies IS 'Relaciones sinérgicas entre ingredientes';
COMMENT ON TABLE antagonisms IS 'Relaciones antagónicas entre ingredientes';
COMMENT ON TABLE products IS 'Productos comerciales';
COMMENT ON TABLE audit_log IS 'Historial de cambios para auditoría';

-- ============================================
-- FIN DEL SCHEMA
-- ============================================
