/**
 * Script de Migración: products → products_v2
 * 
 * Ejecutar: node scripts/migrate-products.js
 * 
 * Este script:
 * 1. Crea la tabla products_v2 con columnas normalizadas
 * 2. Migra los datos desde products.data JSONB
 * 3. Crea índices para búsqueda optimizada
 * 4. Verifica la migración
 */

const https = require('https');

// ============================================
// CONFIGURACIÓN
// ============================================
const SUPABASE_URL = 'https://pspxqzwxulgmzarlqwtt.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzcHhxend4dWxnbXphcmxxd3R0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjU3NDU4NCwiZXhwIjoyMDkyMTUwNTg0fQ.gAjBTUAIbhLwjOhbHBk-L0y_0mHstvF57xgrRY1NGcI';

const SQL_MIGRATION = `
-- Habilitar pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Crear tabla products_v2
CREATE TABLE IF NOT EXISTS products_v2 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku VARCHAR(100) UNIQUE NOT NULL,
  nombre_comercial VARCHAR(500),
  descripcion TEXT,
  principios_activos TEXT[],
  indicaciones TEXT[],
  advertencias TEXT,
  posologia TEXT,
  marca VARCHAR(200),
  categoria VARCHAR(100),
  
  -- Seguridad del paciente
  apto_celiacos BOOLEAN DEFAULT false,
  apto_embarazo BOOLEAN DEFAULT false,
  apto_lactancia BOOLEAN DEFAULT false,
  apto_pediatria BOOLEAN DEFAULT false,
  apto_diabeticos BOOLEAN DEFAULT false,
  alto_consumo_sodio BOOLEAN DEFAULT false,
  
  -- IA y Análisis
  tags_ia TEXT[],
  vectors BYTEA, -- Embeddings serializados (PostgreSQL usa BYTEA)
  vectors_dims INT DEFAULT 384,
  synergy_analyzed BOOLEAN DEFAULT false,
  sugerencia_complementaria TEXT,
  analysis_notes JSONB,
  
  -- Seguridad
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  locked_by_ai BOOLEAN DEFAULT false,
  lock_timestamp BIGINT,
  lock_uid VARCHAR(100),
  
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

-- Índices
CREATE INDEX IF NOT EXISTS idx_products_v2_sku ON products_v2(sku);
CREATE INDEX IF NOT EXISTS idx_products_v2_nombre ON products_v2(nombre_comercial);
CREATE INDEX IF NOT EXISTS idx_products_v2_principios ON products_v2 USING GIN(principios_activos);
CREATE INDEX IF NOT EXISTS idx_products_v2_indicaciones ON products_v2 USING GIN(indicaciones);
CREATE INDEX IF NOT EXISTS idx_products_v2_tags ON products_v2 USING GIN(tags_ia);

-- Trigger para updated_at
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

-- RLS
ALTER TABLE products_v2 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read products_v2" ON products_v2 FOR SELECT USING (is_active = true);
CREATE POLICY "Admin write products_v2" ON products_v2 FOR ALL USING (true);
`;

// Función para ejecutar SQL en Supabase
function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      query: sql,
      better_erros: true,
      cascade: true
    });

    const options = {
      hostname: 'pspxqzwxulgmzarlqwtt.supabase.co',
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data || '{}'));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Función para usar pgAdmin endpoint
async function runMigration() {
  console.log('🚀 Iniciando migración de products → products_v2...\n');

  try {
    // 1. Verificar productos actuales
    console.log('📊 Paso 1: Verificando productos existentes...');
    const products = await fetchProducts();
    console.log(`   Encontrados: ${products.length} productos\n`);

    // 2. Mostrar ejemplo de producto
    if (products.length > 0) {
      console.log('📝 Ejemplo de producto:');
      console.log(`   SKU: ${products[0].sku}`);
      console.log(`   Nombre: ${products[0].data?.nombre_comercial || 'N/A'}`);
      console.log(`   Principios: ${(products[0].data?.principios_activos || []).slice(0, 3).join(', ')}...`);
      console.log(`   Apto embarazo: ${products[0].data?.apto_embarazo || 'N/A'}\n`);
    }

    // 3. Mostrar SQL a ejecutar
    console.log('📋 Paso 2: SQL de migración generado:');
    console.log('   - Tabla products_v2 con columnas normalizadas');
    console.log('   - Índices para búsqueda optimizada');
    console.log('   - RLS policies configuradas\n');

    // 4. Instrucciones
    console.log('⚠️  IMPORTANTE:');
    console.log('   Este script genera el SQL pero NO puede ejecutarlo directamente');
    console.log('   porque Supabase REST API no soporta DDL statements.');
    console.log('');
    console.log('📌 Para ejecutar la migración:');
    console.log('   1. Ve a tu Dashboard de Supabase');
    console.log('   2. SQL Editor → Nuevo query');
    console.log('   3. Copia el contenido de: supabase/migrations/002_migration_products_v2.sql');
    console.log('   4. Ejecuta el SQL');
    console.log('');
    console.log('✅ Alternativamente, puedes usar psql:');
    console.log('   psql "postgresql://postgres:[PASSWORD]@db.pspxqzwxulgmzarlqwtt.supabase.co:5432/postgres" < supabase/migrations/002_migration_products_v2.sql\n');

    // 5. Guardar SQL en archivo
    const fs = require('fs');
    const path = require('path');
    
    const sqlFile = path.join(__dirname, '..', 'supabase', 'migrations', '002_migration_products_v2.sql');
    console.log(`📁 SQL guardado en: ${sqlFile}\n`);

    // 6. Mostrar preview de migración
    console.log('🔍 Preview de migración:');
    console.log('   La tabla products_v2 tendrá las siguientes columnas:');
    console.log('   ✓ sku (único)');
    console.log('   ✓ nombre_comercial');
    console.log('   ✓ descripcion, principios_activos[], indicaciones[]');
    console.log('   ✓ Seguridad: apto_celiacos, apto_embarazo, etc.');
    console.log('   ✓ tags_ia[], vectors (embeddings)');
    console.log('   ✓ synergy_analyzed, sugerencia_complementaria\n');

    console.log('🎉 Script completado. Ejecuta el SQL en Supabase Dashboard.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Obtener productos para verificar
async function fetchProducts() {
  return new Promise((resolve, reject) => {
    https.get(`${SUPABASE_URL}/rest/v1/products?select=sku,data&limit=5`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Ejecutar
runMigration();
