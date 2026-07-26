-- =====================================================
-- VADEMECUM AI - Esquema de Base de Datos Supabase
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA: products
-- Productos del vademécum
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    nombre_comercial VARCHAR(255),
    principio_activo TEXT,
    principios_activos TEXT[],
    categoria_principal VARCHAR(255),
    categorias TEXT[],
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
CREATE INDEX IF NOT EXISTS idx_products_categoria ON products(categoria_principal);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Authenticated insert products" ON products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update products" ON products FOR UPDATE USING (auth.role() = 'authenticated');

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABLA: extended_ingredients
-- Ingredientes extendidos (homeopatía, fitoterapia, suplementos)
-- =====================================================
CREATE TABLE IF NOT EXISTS extended_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ingredient_key VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    scientific_name VARCHAR(255),
    category VARCHAR(50) NOT NULL CHECK (category IN ('homeopatia', 'fitoterapia', 'suplemento', 'mineral', 'vitamin', 'aminoacido', 'otro')),
    origin_type VARCHAR(50) NOT NULL CHECK (origin_type IN ('planta', 'mineral', 'animal', 'sintetico', 'microorganismo')),
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

-- Índice para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_extended_ingredients_name ON extended_ingredients(name);
CREATE INDEX IF NOT EXISTS idx_extended_ingredients_category ON extended_ingredients(category);
CREATE INDEX IF NOT EXISTS idx_extended_ingredients_synonyms ON extended_ingredients USING GIN(synonyms);

-- =====================================================
-- TABLA: organs_pathologies
-- Mapa de órganos y patologías
-- =====================================================
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

-- Índice para búsqueda
CREATE INDEX IF NOT EXISTS idx_organs_pathologies_organ ON organs_pathologies(organ);
CREATE INDEX IF NOT EXISTS idx_organs_pathologies_pathologies ON organs_pathologies USING GIN(pathologies);

-- =====================================================
-- TABLA: ingredient_keywords
-- Palabras clave para detección de ingredientes
-- =====================================================
CREATE TABLE IF NOT EXISTS ingredient_keywords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    keyword VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ingredient_keywords_keyword ON ingredient_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_ingredient_keywords_active ON ingredient_keywords(is_active);

-- =====================================================
-- TABLA: sync_metadata
-- Metadatos de sincronización
-- =====================================================
CREATE TABLE IF NOT EXISTS sync_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version VARCHAR(20) NOT NULL,
    last_sync TIMESTAMP WITH TIME ZONE NOT NULL,
    ingredients_count INTEGER DEFAULT 0,
    organs_count INTEGER DEFAULT 0,
    keywords_count INTEGER DEFAULT 0,
    checksum VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA: product_ingredient_analysis
-- Análisis de ingredientes de productos
-- =====================================================
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

ALTER TABLE product_ingredient_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read product_ingredient_analysis" ON product_ingredient_analysis FOR SELECT USING (true);
CREATE POLICY "Authenticated insert product_ingredient_analysis" ON product_ingredient_analysis FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update product_ingredient_analysis" ON product_ingredient_analysis FOR UPDATE USING (auth.role() = 'authenticated');

DROP TRIGGER IF EXISTS update_product_ingredient_analysis_updated_at ON product_ingredient_analysis;
CREATE TRIGGER update_product_ingredient_analysis_updated_at
    BEFORE UPDATE ON product_ingredient_analysis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABLA: product_synergies
-- Sinergias entre productos
-- =====================================================
CREATE TABLE IF NOT EXISTS product_synergies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producto1_sku VARCHAR(255) NOT NULL,
    producto2_sku VARCHAR(255) NOT NULL,
    nivel_sinergia VARCHAR(20) CHECK (nivel_sinergia IN ('alto', 'medio', 'bajo')),
    tipo_relacion VARCHAR(100),
    descripcion TEXT,
    beneficios_combinados TEXT[],
    explicacion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(producto1_sku, producto2_sku)
);

CREATE INDEX IF NOT EXISTS idx_product_synergies_prod1 ON product_synergies(producto1_sku);
CREATE INDEX IF NOT EXISTS idx_product_synergies_prod2 ON product_synergies(producto2_sku);
CREATE INDEX IF NOT EXISTS idx_product_synergies_nivel ON product_synergies(nivel_sinergia);

ALTER TABLE product_synergies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read product_synergies" ON product_synergies FOR SELECT USING (true);
CREATE POLICY "Authenticated insert product_synergies" ON product_synergies FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update product_synergies" ON product_synergies FOR UPDATE USING (auth.role() = 'authenticated');

DROP TRIGGER IF EXISTS update_product_synergies_updated_at ON product_synergies;
CREATE TRIGGER update_product_synergies_updated_at
    BEFORE UPDATE ON product_synergies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABLA: ingredient_relationships
-- Relaciones entre ingredientes
-- =====================================================
CREATE TABLE IF NOT EXISTS ingredient_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ingrediente1 VARCHAR(255) NOT NULL,
    ingrediente2 VARCHAR(255) NOT NULL,
    tipo_relacion VARCHAR(50) CHECK (tipo_relacion IN ('sinergia', 'antagonismo', 'complemento', 'inductor', 'inhibidor')),
    intensidad VARCHAR(20) CHECK (intensidad IN ('fuerte', 'moderada', 'leve')),
    descripcion TEXT,
    evidencia TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ingrediente1, ingrediente2, tipo_relacion)
);

CREATE INDEX IF NOT EXISTS idx_ingredient_rel_ing1 ON ingredient_relationships(ingrediente1);
CREATE INDEX IF NOT EXISTS idx_ingredient_rel_ing2 ON ingredient_relationships(ingrediente2);
CREATE INDEX IF NOT EXISTS idx_ingredient_rel_tipo ON ingredient_relationships(tipo_relacion);

ALTER TABLE ingredient_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read ingredient_relationships" ON ingredient_relationships FOR SELECT USING (true);
CREATE POLICY "Authenticated insert ingredient_relationships" ON ingredient_relationships FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update ingredient_relationships" ON ingredient_relationships FOR UPDATE USING (auth.role() = 'authenticated');

DROP TRIGGER IF EXISTS update_ingredient_relationships_updated_at ON ingredient_relationships;
CREATE TRIGGER update_ingredient_relationships_updated_at
    BEFORE UPDATE ON ingredient_relationships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para extended_ingredients
DROP TRIGGER IF EXISTS update_extended_ingredients_updated_at ON extended_ingredients;
CREATE TRIGGER update_extended_ingredients_updated_at
    BEFORE UPDATE ON extended_ingredients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para organs_pathologies
DROP TRIGGER IF EXISTS update_organs_pathologies_updated_at ON organs_pathologies;
CREATE TRIGGER update_organs_pathologies_updated_at
    BEFORE UPDATE ON organs_pathologies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- POLICIES RLS (Row Level Security)
-- =====================================================

ALTER TABLE extended_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE organs_pathologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_metadata ENABLE ROW LEVEL SECURITY;

-- Permitir lectura pública
CREATE POLICY "Public read extended_ingredients" ON extended_ingredients
    FOR SELECT USING (true);

CREATE POLICY "Public read organs_pathologies" ON organs_pathologies
    FOR SELECT USING (true);

CREATE POLICY "Public read ingredient_keywords" ON ingredient_keywords
    FOR SELECT USING (true);

CREATE POLICY "Public read sync_metadata" ON sync_metadata
    FOR SELECT USING (true);

-- Permitir escritura solo a usuarios autenticados
CREATE POLICY "Authenticated insert extended_ingredients" ON extended_ingredients
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated update extended_ingredients" ON extended_ingredients
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated insert organs_pathologies" ON organs_pathologies
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated update organs_pathologies" ON organs_pathologies
    FOR UPDATE USING (auth.role() = 'authenticated');

-- =====================================================
-- DATOS INICIALES - Homeopatía básica
-- =====================================================

INSERT INTO extended_ingredients (ingredient_key, name, scientific_name, category, origin_type, origin_description, description, mechanism, indications, contraindications, interactions, dosage, synonyms) VALUES
('arnica', 'Arnica Montana', 'Arnica montana', 'homeopatia', 'planta', 'Planta alpine de Europa', 'Remedio homeopático para traumatismos, golpes y contusiones. Anti-inflamatorio natural.', 'Modula la respuesta inflamatoria y reduce el edema. Estimula la reparación tisular.', ARRAY['Traumatismos', 'Contusiones', 'Dolores musculares', 'Hematomas', 'Fatiga'], ARRAY['Hipersensibilidad a Asteraceae', 'No aplicar sobre heridas abiertas'], ARRAY[' puede interactuar con anticoagulantes'], 'CH 5 a CH 9: 3-5 gránulos cada 2-4 horas', ARRAY['arnica montana', 'wolfs bane']),
('belladonna', 'Belladonna', 'Atropa belladonna', 'homeopatia', 'planta', 'Planta de Europa y Norte de África', 'Remedio para fiebres altas súbitas, inflamación aguda y dolor pulsátil.', 'Regula el sistema nervioso autónomo, reduce la fiebre y calma el dolor agudo.', ARRAY['Fiebre alta', 'Dolor de oído', 'Cefalea pulsátil', 'Amigdalitis aguda'], ARRAY['Glaucoma', 'Hiperplasia prostática', 'Cardiopatías graves'], ARRAY[' puede potencializar efectos de anticolinérgicos'], 'CH 5 a CH 15: 3-5 gránulos cada 15-30 minutos en crisis aguda', ARRAY['belladonna', 'deadly nightshade']),
('chamomilla', 'Chamomilla', 'Matricaria chamomilla', 'homeopatia', 'planta', 'Planta anual de Europa', 'Remedio para el dolor intenso, especialmente en niños y dientes.', 'Acción sedante y analgésica suave. Modula la irritabilidad neuromuscular.', ARRAY['Dolor de muelas', 'Cólicos del lactante', 'Irritabilidad', 'Otalgia'], ARRAY['Hipersensibilidad a Asteraceae'], ARRAY[' puede antagonizar con homeopatía de Ignatia'], 'CH 5 a CH 15: 3-5 gránulos según necesidad', ARRAY['manzanilla', 'chamomile']),
('nux-vomica', 'Nux Vomica', 'Strychnos nux-vomica', 'homeopatia', 'planta', 'Árbol del sudeste asiático', 'Remedio para trastornos digestivos por estrés y excesos.', 'Regula el sistema digestivo, reduce náuseas y espasmos. Antiemético natural.', ARRAY['Náuseas', 'Estreñimiento', 'Resaca', 'Estrés', 'Digestión lenta'], ARRAY['Embarazo (uso con precaución)', 'Hipersensibilidad'], ARRAY[' puede antagonizar con Pulsatilla'], 'CH 5 a CH 15: 3-5 gránulos antes de comidas', ARRAY['nux vomica', 'nux vómica', 'nux']),
('pulsatilla', 'Pulsatilla', 'Anemone pulsatilla', 'homeopatia', 'planta', 'Planta de praderas europeas', 'Remedio para síntomas que cambian y secreciones.', 'Modula las secreciones mucosas y regula el sistema hormonal femenino.', ARRAY['Resfriados', 'Otitis', 'Conjuntivitis', 'Trastornos menstruales', 'Varicela'], ARRAY['No combinar con Mentha piperita'], ARRAY[' puede antagonizar con Nux Vomica'], 'CH 5 a CH 15: 3-5 gránulos 2-3 veces al día', ARRAY['pulsatilla', 'pasque flower']),
('aconitum', 'Aconitum Napellus', 'Aconitum napellus', 'homeopatia', 'planta', 'Planta de montañas europeas', 'Remedio para el inicio súbito de síntomas, especialmente miedo y fiebre.', 'Regula el sistema nervioso simpático, reduce la ansiedad y la fiebre aguda.', ARRAY['Miedo intenso', 'Fiebre súbita', 'Ansiedad', 'Resfriado inicial', 'Otitis'], ARRAY['No usar en fiebre prolongada', 'Precaución en cardiopatías'], ARRAY[' puede interactuar con digitálicos'], 'CH 5 a CH 15: 3-5 gránulos al inicio, repetir según necesidad', ARRAY['aconitum', 'aconite', 'acónito']),
('apis', 'Apis Mellifica', 'Apis mellifera', 'homeopatia', 'animal', 'Abeja común', 'Remedio para picaduras y edema con sensación de quemazón que mejora con frío.', 'Anti-inflamatorio, reduce el edema y alivia el prurito. Vasodilatador suave.', ARRAY['Picaduras de insectos', 'Edema', 'Urticaria', 'Angioedema', 'Orquitis'], ARRAY['Alergia severa a veneno de abeja'], ARRAY[' puede interactuar con antihistamínicos'], 'CH 5 a CH 15: 3-5 gránulos cada 15-30 minutos en agudo', ARRAY['apis', 'apis mellifica', 'abeja']),
('phosphorus', 'Phosphorus', 'Fósforo', 'homeopatia', 'mineral', 'Elemento no metálico', 'Remedio para debilidad, hemorragias y enfermedades febriles.', 'Regenerador celular, hemostático suave. Antioxidante natural.', ARRAY['Hemorragias', 'Bronquitis', 'Hepatitis', 'Fiebre', 'Astenia'], ARRAY['Pacientes con osteonecrosis'], ARRAY[' puede interactuar con anticoagulantes'], 'CH 5 a CH 15: 3-5 gránulos 2-3 veces al día', ARRAY['phosphorus', 'fosforo']),
('sulfur', 'Sulfur', 'Azufre', 'homeopatia', 'mineral', 'Elemento no metálico', 'Remedio profundo para condiciones crónicas con manifestaciones cutáneas.', 'Depurativo, antipruriginoso. Estimula la eliminación de toxinas.', ARRAY['Eccema crónico', 'Psoriasis', 'Acné', 'Dermatitis', 'Resfriados recurrentes'], ARRAY['Precaución en cardiopatías'], ARRAY[' puede antagonizar con muchos remedios en alta dilución'], 'CH 5 a CH 30: según prescripción', ARRAY['sulfur', 'sulphur', 'azufre']),
('calendula', 'Calendula', 'Calendula officinalis', 'homeopatia', 'planta', 'Planta anual ornamental', 'Remedio para heridas, ulceraciones y problemas de piel.', 'Cicatrizante, antiinflamatorio y antiséptico suave.', ARRAY['Heridas', 'Ulcerações', 'Gingivitis', 'Radiodermitis', 'Zoster'], ARRAY['Hipersensibilidad a Asteraceae'], ARRAY[' puede interactuar con inmunodepresores'], 'TM o CH 5: uso tópico y oral según indicación', ARRAY['calendula', 'calendula officinalis'])
ON CONFLICT (ingredient_key) DO UPDATE SET
    name = EXCLUDED.name,
    scientific_name = EXCLUDED.scientific_name,
    category = EXCLUDED.category,
    origin_type = EXCLUDED.origin_type,
    origin_description = EXCLUDED.origin_description,
    description = EXCLUDED.description,
    mechanism = EXCLUDED.mechanism,
    indications = EXCLUDED.indications,
    contraindications = EXCLUDED.contraindications,
    interactions = EXCLUDED.interactions,
    dosage = EXCLUDED.dosage,
    synonyms = EXCLUDED.synonyms,
    updated_at = NOW();

-- =====================================================
-- DATOS INICIALES - Órganos y Patologías
-- =====================================================

INSERT INTO organs_pathologies (organ, aliases, pathologies, categories, ingredients, description) VALUES
('hígado', ARRAY['hepatico', 'hepática', 'liver', 'hepatic'], 
 ARRAY['hepatitis', 'cirrosis', 'esteatosis', 'hígado graso', 'vesícula', 'cálculos biliares', 'ictericia'], 
 ARRAY['hepatoprotector', 'digestivo', 'colerético', 'colagogo'],
 ARRAY['cardo mariano', 'alcachofa', 'diente de leon', 'colina', 'metionina', 'nacetilcisteina', 'sam-e'],
 'El hígado es el órgano más grande del cuerpo, responsable de más de 500 funciones vitales.'),
 
('pulmón', ARRAY['pulmonar', 'lung', 'pulmonary'], 
 ARRAY['tos', 'bronquitis', 'asma', 'gripe', 'resfriado', 'neumonía', 'enfisema', 'epoc'], 
 ARRAY['expectorante', 'antitusivo', 'antiviral', 'inmunomodulador'],
 ARRAY['equinacea', 'propoleo', 'tomillo', 'hisopo', 'pelargonio', 'ajo', 'zinc'],
 'Los pulmones intercambian oxígeno y dióxido de carbono.'),

('corazón', ARRAY['cardiaco', 'cardíaca', 'heart', 'cardiac'], 
 ARRAY['insuficiencia cardíaca', 'arritmia', 'palpitaciones', 'angina', 'infarto'], 
 ARRAY['cardiotónico', 'antiarrítmico', 'vasodilatador'],
 ARRAY['espino blanco', 'muérdago', 'coq10', 'magnesio', 'potasio', 'omega-3'],
 'El corazón bombea sangre a todo el cuerpo.'),

('cerebro', ARRAY['cerebral', 'brain', 'cognitive'], 
 ARRAY['memoria', 'concentración', 'demencia', 'alzheimer', 'parkinson', 'ictus'], 
 ARRAY['nootrópico', 'neuroprotector', 'estimulante cognitivo'],
 ARRAY['ginkgo', 'bacopa', 'omega-3', 'curcuma', 'l-teanina', 'phosphatidylserine'],
 'El cerebro controla pensamiento, memoria, emociones y movimientos.'),

('estómago', ARRAY['gastrico', 'gástrica', 'stomach'], 
 ARRAY['gastritis', 'úlcera', 'reflujo', 'acidez', 'dispepsia'], 
 ARRAY['gastroprotector', 'antiácido', 'digestivo'],
 ARRAY['regaliz', 'manzanilla', 'melisa', 'aloe vera'],
 'El estómago almacena alimentos y los mezcla con ácidos digestivos.'),

('intestino', ARRAY['intestinal', 'bowel', 'gut', 'colon'], 
 ARRAY['estreñimiento', 'diarrea', 'síndrome intestino irritable', 'gases'], 
 ARRAY['laxante', 'prebiótico', 'probiótico'],
 ARRAY['psyllium', 'inulina', 'fibra', 'probióticos', 'lactobacillus'],
 'El intestino es donde se absorbe la mayoría de nutrientes.'),

('articulaciones', ARRAY['articular', 'joint', 'artritis', 'artrosis'], 
 ARRAY['artritis', 'artrosis', 'dolor articular', 'rigidez'], 
 ARRAY['antiinflamatorio', 'condroprotector', 'analgésico'],
 ARRAY['glucosamina', 'condroitina', 'colageno', 'msm', 'harpagofito'],
 'Las articulaciones conectan huesos y permiten el movimiento.'),

('sistema inmune', ARRAY['inmunologico', 'immune', 'immunity', 'defensas'], 
 ARRAY['inmunodeficiencia', 'infecciones recurrentes', 'autoinmunidad', 'alergias'], 
 ARRAY['inmunomodulador', 'inmunoestimulante'],
 ARRAY['equinacea', 'propoleo', 'vitamina c', 'vitamina d', 'zinc', 'selenio'],
 'El sistema inmune protege contra infecciones y enfermedades.'),

('tiroides', ARRAY['tiroideo', 'thyroid'], 
 ARRAY['hipotiroidismo', 'hipertiroidismo', 'tiroiditis', 'hashimoto'], 
 ARRAY['regulador tiroideo', 'antitiroideo'],
 ARRAY['selenio', 'zinc', 'vitamina d', 'ashwagandha'],
 'La tiroides regula el metabolismo y la energía.'),

('huesos', ARRAY['óseo', 'bone', 'osteoporosis'], 
 ARRAY['osteoporosis', 'osteopenia', 'fracturas'], 
 ARRAY['remineralizante', 'anti-resortivo'],
 ARRAY['calcio', 'vitamina d', 'vitamina k2', 'magnesio', 'boro'],
 'Los huesos proporcionan estructura y protección al cuerpo.')
ON CONFLICT DO NOTHING;

-- =====================================================
-- FUNCIONES ÚTILES
-- =====================================================

-- Función para buscar ingredientes por texto
CREATE OR REPLACE FUNCTION search_ingredients(search_text TEXT)
RETURNS TABLE(
    ingredient_key VARCHAR,
    name VARCHAR,
    category VARCHAR,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.ingredient_key,
        e.name,
        e.category,
        e.description
    FROM extended_ingredients e
    WHERE 
        e.name ILIKE '%' || search_text || '%'
        OR e.scientific_name ILIKE '%' || search_text || '%'
        OR EXISTS (
            SELECT 1 FROM UNNEST(e.synonyms) s 
            WHERE s ILIKE '%' || search_text || '%'
        );
END;
$$ LANGUAGE plpgsql;

-- Función para buscar órganos por patología
CREATE OR REPLACE FUNCTION search_organs_by_pathology(pathology TEXT)
RETURNS TABLE(
    organ VARCHAR,
    pathologies TEXT[],
    categories TEXT[],
    ingredients TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.organ,
        o.pathologies,
        o.categories,
        o.ingredients
    FROM organs_pathologies o
    WHERE 
        o.organ ILIKE '%' || pathology || '%'
        OR EXISTS (
            SELECT 1 FROM UNNEST(o.pathologies) p 
            WHERE p ILIKE '%' || pathology || '%'
        )
        OR EXISTS (
            SELECT 1 FROM UNNEST(o.aliases) a 
            WHERE a ILIKE '%' || pathology || '%'
        );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- GRANTS
-- =====================================================
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
