-- VADEMECUM AI - Esquema de Base de Datos Supabase

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language plpgsql;

-- TABLA: products
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    nombre_comercial VARCHAR(255),
    principio_activo TEXT,
    principios_activos TEXT[],
    categoria VARCHAR(255),
    laboratorio VARCHAR(255),
    descripcion TEXT,
    posologia TEXT,
    indicaciones TEXT[],
    contraindicaciones TEXT[],
    interacciones TEXT[],
    efectos_secundarios TEXT[],
    cobertura_kb INTEGER DEFAULT 0,
    sinergias_detectadas TEXT[],
    last_updated TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_nombre ON products(nombre_comercial);
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- TABLA: extended_ingredients
CREATE TABLE IF NOT EXISTS extended_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ingredient_key VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    scientific_name VARCHAR(255),
    category VARCHAR(50) NOT NULL,
    origin_type VARCHAR(50) NOT NULL,
    origin_description TEXT,
    description TEXT NOT NULL,
    mechanism TEXT,
    indications TEXT[],
    contraindications TEXT[],
    interactions TEXT[],
    dosage TEXT,
    side_effects TEXT[],
    synonyms TEXT[],
    warnings TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_extended_ingredients_name ON extended_ingredients(name);
CREATE TRIGGER update_extended_ingredients_updated_at BEFORE UPDATE ON extended_ingredients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- TABLA: organs_pathologies
CREATE TABLE IF NOT EXISTS organs_pathologies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organ VARCHAR(100) NOT NULL,
    aliases TEXT[],
    pathologies TEXT[],
    categories TEXT[],
    ingredients TEXT[],
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organs_pathologies_organ ON organs_pathologies(organ);
CREATE TRIGGER update_organs_pathologies_updated_at BEFORE UPDATE ON organs_pathologies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- TABLA: ingredient_keywords
CREATE TABLE IF NOT EXISTS ingredient_keywords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    keyword VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA: sync_metadata
CREATE TABLE IF NOT EXISTS sync_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version VARCHAR(20) NOT NULL,
    last_sync TIMESTAMP WITH TIME ZONE NOT NULL,
    ingredients_count INTEGER DEFAULT 0,
    organs_count INTEGER DEFAULT 0,
    keywords_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA: product_ingredient_analysis
CREATE TABLE IF NOT EXISTS product_ingredient_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producto_sku VARCHAR(255) UNIQUE NOT NULL,
    ingredientes_encontrados TEXT[],
    ingredientes_sin_match TEXT[],
    cobertura_kb NUMERIC(5,2) DEFAULT 0,
    categoria_predominante VARCHAR(255),
    analisis_explicacion TEXT,
    nivel_analisis_completo INTEGER DEFAULT 0,
    requiere_ia_externa BOOLEAN DEFAULT FALSE,
    extended_ingredients TEXT[],
    organs_related TEXT[],
    pathologies_related TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_analysis_sku ON product_ingredient_analysis(producto_sku);

-- TABLA: product_synergies
CREATE TABLE IF NOT EXISTS product_synergies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producto1_sku VARCHAR(255) NOT NULL,
    producto2_sku VARCHAR(255) NOT NULL,
    nivel_sinergia VARCHAR(20),
    tipo_relacion VARCHAR(100),
    descripcion TEXT,
    beneficios_combinados TEXT[],
    explicacion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(producto1_sku, producto2_sku)
);

-- TABLA: ingredient_relationships
CREATE TABLE IF NOT EXISTS ingredient_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ingrediente1 VARCHAR(255) NOT NULL,
    ingrediente2 VARCHAR(255) NOT NULL,
    tipo_relacion VARCHAR(50),
    intensidad VARCHAR(20),
    descripcion TEXT,
    evidencia TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DATOS: Homeopatia
INSERT INTO extended_ingredients (ingredient_key, name, scientific_name, category, origin_type, origin_description, description, mechanism, indications, contraindications, interactions, dosage, synonyms) VALUES
('arnica', 'Arnica Montana', 'Arnica montana', 'homeopatia', 'planta', 'Planta alpine de Europa', 'Remedio homeopatico para traumatismos.', 'Modula la respuesta inflamatoria.', ARRAY['Traumatismos', 'Contusiones', 'Dolores musculares'], ARRAY['Hipersensibilidad a Asteraceae'], ARRAY['Puede interactuar con anticoagulantes'], 'CH 5 a CH 9: 3-5 granules', ARRAY['arnica montana']),
('belladonna', 'Belladonna', 'Atropa belladonna', 'homeopatia', 'planta', 'Planta de Europa', 'Remedio para fiebres altas.', 'Regula el sistema nervioso autonomo.', ARRAY['Fiebre alta', 'Dolor de oido'], ARRAY['Glaucoma'], ARRAY['Puede interactuar con anticolinergicos'], 'CH 5 a CH 15: 3-5 granules', ARRAY['belladonna']),
('nux-vomica', 'Nux Vomica', 'Strychnos nux-vomica', 'homeopatia', 'planta', 'Arbol del sudeste asiatico', 'Remedio para trastornos digestivos.', 'Regula el sistema digestivo.', ARRAY['Nauseas', 'Estreenimiento', 'Resaca'], ARRAY['Embarazo con precaution'], ARRAY['Puede antagonizar con Pulsatilla'], 'CH 5 a CH 15: 3-5 granules', ARRAY['nux vomica', 'nux']),
('pulsatilla', 'Pulsatilla', 'Anemone pulsatilla', 'homeopatia', 'planta', 'Planta de praderas europeas', 'Remedio para sintomas que cambian.', 'Modula las secreciones mucosas.', ARRAY['Resfriados', 'Otitis', 'Conjuntivitis'], ARRAY['No combinar con Mentha piperita'], ARRAY['Puede antagonizar con Nux Vomica'], 'CH 5 a CH 15: 3-5 granules', ARRAY['pulsatilla']),
('chamomilla', 'Chamomilla', 'Matricaria chamomilla', 'homeopatia', 'planta', 'Planta anual de Europa', 'Remedio para el dolor intenso.', 'Accion sedante y analgsica suave.', ARRAY['Dolor de muelas', 'Colicos del lactante'], ARRAY['Hipersensibilidad a Asteraceae'], ARRAY[]::TEXT[], 'CH 5 a CH 15: 3-5 granules', ARRAY['manzanilla', 'chamomile'])
ON CONFLICT (ingredient_key) DO UPDATE SET name = EXCLUDED.name;

-- DATOS: Organos y Patologias
INSERT INTO organs_pathologies (organ, aliases, pathologies, categories, ingredients, description) VALUES
('higado', ARRAY['hepatico', 'liver'], ARRAY['hepatitis', 'cirrosis', 'higado graso'], ARRAY['hepatoprotector', 'digestivo'], ARRAY['cardo mariano', 'alcachofa', 'sam-e'], 'El higado es el organo mas grande del cuerpo.'),
('pulmon', ARRAY['pulmonar', 'lung'], ARRAY['tos', 'bronquitis', 'asma', 'gripe'], ARRAY['expectorante', 'antitusivo'], ARRAY['equinacea', 'propoleo', 'tomillo'], 'Los pulmones intercambian oxigeno.'),
('corazon', ARRAY['cardiaco', 'heart'], ARRAY['insuficiencia cardiaca', 'arritmia'], ARRAY['cardiotonico', 'antiarritmico'], ARRAY['espino blanco', 'coq10', 'magnesio'], 'El corazon bombea sangre.'),
('cerebro', ARRAY['cerebral', 'brain'], ARRAY['memoria', 'concentracion', 'demencia'], ARRAY['nootropico', 'neuroprotector'], ARRAY['ginkgo', 'bacopa', 'omega-3'], 'El cerebro controla funciones cognitivas.'),
('estomago', ARRAY['gastrico', 'stomach'], ARRAY['gastritis', 'ulcera', 'reflujo'], ARRAY['gastroprotector', 'antiacido'], ARRAY['regaliz', 'manzanilla', 'aloe vera'], 'El estomago almacena alimentos.'),
('intestino', ARRAY['intestinal', 'gut', 'colon'], ARRAY['estrenimiento', 'diarrea', 'sindrome intestino irritable'], ARRAY['laxante', 'probiotico'], ARRAY['psyllium', 'inulina', 'probioticos'], 'El intestino absorbe nutrientes.'),
('articulaciones', ARRAY['articular', 'joint', 'artritis'], ARRAY['artritis', 'artrosis', 'dolor articular'], ARRAY['antiinflamatorio', 'condroprotector'], ARRAY['glucosamina', 'condroitina', 'msm'], 'Las articulaciones permiten el movimiento.'),
('sistema inmune', ARRAY['inmune', 'immune'], ARRAY['infecciones recurrentes', 'alergias'], ARRAY['inmunomodulador'], ARRAY['equinacea', 'vitamina c', 'zinc'], 'El sistema inmune protege contra infecciones.'),
('tiroides', ARRAY['tiroideo', 'thyroid'], ARRAY['hipotiroidismo', 'hipertiroidismo'], ARRAY['regulador tiroideo'], ARRAY['selenio', 'zinc', 'ashwagandha'], 'La tiroides regula el metabolismo.'),
('huesos', ARRAY['oseo', 'bone'], ARRAY['osteoporosis', 'fracturas'], ARRAY['remineralizante'], ARRAY['calcio', 'vitamina d', 'magnesio'], 'Los huesos dan estructura al cuerpo.')
ON CONFLICT DO NOTHING;
