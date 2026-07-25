-- ============================================
-- Base de Conocimiento - Schema de Supabase
-- ============================================

-- Tabla principal de ingredientes de la base de conocimiento
CREATE TABLE IF NOT EXISTS knowledge_base (
    id VARCHAR(100) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    sinonimos TEXT[] DEFAULT '{}',
    familia VARCHAR(100),
    tipo VARCHAR(100),
    propiedades TEXT[] DEFAULT '{}',
    sinergias TEXT[] DEFAULT '{}',
    antagonismos TEXT[] DEFAULT '{}',
    contraindicaciones TEXT[] DEFAULT '{}',
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de metadatos de la KB
CREATE TABLE IF NOT EXISTS kb_metadata (
    id INTEGER PRIMARY KEY DEFAULT 1,
    version VARCHAR(50) NOT NULL,
    description TEXT,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_kb_familia ON knowledge_base(familia);
CREATE INDEX IF NOT EXISTS idx_kb_tipo ON knowledge_base(tipo);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_kb_timestamp
    BEFORE UPDATE ON knowledge_base
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kb_metadata_timestamp
    BEFORE UPDATE ON kb_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Permisos (ajusta según tu configuración)
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_metadata ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura sin autenticación
CREATE POLICY "Allow public read" ON knowledge_base
    FOR SELECT USING (true);

CREATE POLICY "Allow public read" ON kb_metadata
    FOR SELECT USING (true);

-- Política para permitir escritura (considera autenticación en producción)
CREATE POLICY "Allow public insert" ON knowledge_base
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON knowledge_base
    FOR UPDATE USING (true);

CREATE POLICY "Allow public insert" ON kb_metadata
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON kb_metadata
    FOR UPDATE USING (true);

-- ============================================
-- Función para sincronizar desde JSON
-- ============================================

CREATE OR REPLACE FUNCTION sync_knowledge_base(ingredients_json JSONB)
RETURNS INTEGER AS $$
DECLARE
    inserted_count INTEGER := 0;
BEGIN
    FOR i IN 0..jsonb_array_length(ingredients_json)-1 LOOP
        INSERT INTO knowledge_base (
            id, nombre, sinonimos, familia, tipo,
            propiedades, sinergias, antagonismos,
            contraindicaciones, notas
        )
        VALUES (
            ingredients_json->i->>'id',
            ingredients_json->i->>'nombre',
            (SELECT array_agg(value) FROM jsonb_array_elements_text(ingredients_json->i->'sinonimos')),
            ingredients_json->i->>'familia',
            ingredients_json->i->>'tipo',
            (SELECT array_agg(value) FROM jsonb_array_elements_elements_text(ingredients_json->i->'propiedades')),
            (SELECT array_agg(value) FROM jsonb_array_elements_text(ingredients_json->i->'sinergias')),
            (SELECT array_agg(value) FROM jsonb_array_elements_text(ingredients_json->i->'antagonismos')),
            (SELECT array_agg(value) FROM jsonb_array_elements_text(ingredients_json->i->'contraindicaciones')),
            ingredients_json->i->>'notas'
        )
        ON CONFLICT (id) DO UPDATE SET
            nombre = EXCLUDED.nombre,
            sinonimos = EXCLUDED.sinonimos,
            familia = EXCLUDED.familia,
            tipo = EXCLUDED.tipo,
            propiedades = EXCLUDED.propiedades,
            sinergias = EXCLUDED.sinergias,
            antagonismos = EXCLUDED.antagonismos,
            contraindicaciones = EXCLUDED.contraindicaciones,
            notas = EXCLUDED.notas,
            updated_at = NOW();
        
        inserted_count := inserted_count + 1;
    END LOOP;
    
    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Verificación
-- ============================================

-- Verificar tablas
SELECT 'knowledge_base' as table_name, count(*) as row_count FROM knowledge_base
UNION ALL
SELECT 'kb_metadata', count(*) FROM kb_metadata;
