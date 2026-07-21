/**
 * Script para migrar datos locales a Supabase
 * 
 * Uso: node scripts/migrate-local-to-cloud.js
 * 
 * Requiere:
 * - Variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
 * - O las variables SUPABASE_URL y SUPABASE_ANON_KEY
 * 
 * Este script:
 * 1. Lee los productos de catalog.json (o los recibe como argumento)
 * 2. Purga todos los productos de Supabase
 * 3. Sube los productos locales a Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

async function migrate() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('     MIGRACIÓN DE DATOS LOCALES A SUPABASE');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Verificar configuración
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ ERROR: Faltan variables de entorno');
    console.error('   Necesitas configurar:');
    console.error('   - SUPABASE_URL (o VITE_SUPABASE_URL)');
    console.error('   - SUPABASE_ANON_KEY o SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  if (SUPABASE_URL.includes('yourproject') || SUPABASE_KEY.includes('your-')) {
    console.error('❌ ERROR: Las credenciales son placeholders');
    console.error('   Por favor configura credenciales reales de Supabase');
    process.exit(1);
  }

  console.log(`✅ Conectado a: ${SUPABASE_URL}\n`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Paso 1: Obtener productos del archivo JSON
  console.log('📁 Paso 1: Cargando productos desde archivo JSON...');
  
  let products = [];
  
  // Buscar archivo JSON con productos
  const possiblePaths = [
    path.join(__dirname, '../public/products.json'),
    path.join(__dirname, '../public/catalog.json'),
    path.join(__dirname, '../dist/products.json'),
    path.join(__dirname, '../src/data/products.json'),
  ];

  let productsPath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      productsPath = p;
      break;
    }
  }

  if (!productsPath) {
    console.error('❌ No se encontró archivo de productos JSON');
    console.error('   Busca en:');
    possiblePaths.forEach(p => console.error(`   - ${p}`));
    console.error('\n   Asegúrate de tener un archivo JSON con los productos');
    process.exit(1);
  }

  try {
    const fileContent = fs.readFileSync(productsPath, 'utf-8');
    products = JSON.parse(fileContent);
    
    if (!Array.isArray(products)) {
      products = [products];
    }
    
    console.log(`   ✅ Encontrados ${products.length} productos en ${path.basename(productsPath)}`);
  } catch (error) {
    console.error(`❌ Error leyendo archivo: ${error.message}`);
    process.exit(1);
  }

  // Paso 2: Contar productos actuales en Supabase
  console.log('\n📊 Paso 2: Verificando productos en Supabase...');
  
  let cloudCount = 0;
  try {
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    cloudCount = count || 0;
    console.log(`   📦 Productos actuales en la nube: ${cloudCount}`);
  } catch (error) {
    console.error(`   ⚠️ No se pudo contar productos: ${error.message}`);
  }

  // Paso 3: Confirmar purga
  if (cloudCount > 0) {
    console.log('\n⚠️  ATENCIÓN: Se eliminarán todos los productos de la nube');
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(resolve => {
      rl.question('   ¿Continuar? (escribe "SI" para confirmar): ', resolve);
    });
    rl.close();

    if (answer.toUpperCase() !== 'SI') {
      console.log('\n❌ Operación cancelada por el usuario');
      process.exit(0);
    }
  }

  // Paso 4: Purga de Supabase
  console.log('\n🗑️  Paso 3: Purgando base de datos en Supabase...');
  
  try {
    // Eliminar en lotes para evitar timeouts
    let deletedTotal = 0;
    let hasMore = true;
    
    while (hasMore) {
      const { data, error } = await supabase
        .from('products')
        .select('sku')
        .limit(1000);
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        hasMore = false;
        break;
      }
      
      const skus = data.map(r => r.sku);
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .in('sku', skus);
      
      if (deleteError) throw deleteError;
      
      deletedTotal += skus.length;
      console.log(`   🗑️  Eliminados ${deletedTotal} productos...`);
      
      if (data.length < 1000) {
        hasMore = false;
      }
    }
    
    console.log(`   ✅ Purgados ${deletedTotal} productos de la nube`);
  } catch (error) {
    console.error(`   ❌ Error purando: ${error.message}`);
    console.error('   Posible causa: RLS bloqueando DELETE');
    console.error('   Solución: Desactiva RLS o usa SERVICE_ROLE_KEY');
    process.exit(1);
  }

  // Paso 5: Subir productos a Supabase
  console.log('\n☁️  Paso 4: Subiendo productos a Supabase...');
  
  const batchSize = 100;
  let uploadedTotal = 0;
  let failedTotal = 0;
  const errors = [];

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(products.length / batchSize);
    
    console.log(`   📤 Subiendo lote ${batchNum}/${totalBatches} (${batch.length} productos)...`);
    
    // Preparar payloads para Supabase
    const payloads = batch.map(product => ({
      sku: product.sku,
      data: {
        ...product,
        is_synced_cloud: true,
        last_synced_cloud: Date.now(),
        last_updated: product.last_updated || Date.now()
      },
      last_updated: new Date(product.last_updated || Date.now()).toISOString()
    }));

    try {
      const { error } = await supabase
        .from('products')
        .upsert(payloads, { onConflict: 'sku' });
      
      if (error) {
        throw error;
      }
      
      uploadedTotal += batch.length;
      console.log(`   ✅ Lote ${batchNum} completado (${uploadedTotal}/${products.length})`);
    } catch (error) {
      failedTotal += batch.length;
      errors.push({ batch: batchNum, error: error.message });
      console.error(`   ❌ Error en lote ${batchNum}: ${error.message}`);
    }
  }

  // Resumen
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                    RESUMEN');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`   📥 Productos en JSON:    ${products.length}`);
  console.log(`   ☁️  Subidos exitosamente: ${uploadedTotal}`);
  console.log(`   ❌ Fallidos:              ${failedTotal}`);
  
  if (errors.length > 0) {
    console.log('\n   📋 Detalle de errores:');
    errors.forEach(e => console.log(`      - Lote ${e.batch}: ${e.error}`));
  }

  if (failedTotal === 0) {
    console.log('\n   ✅ MIGRACIÓN COMPLETADA EXITOSAMENTE');
  } else {
    console.log('\n   ⚠️  MIGRACIÓN COMPLETADA CON ERRORES');
    console.log('   Los productos fallidos pueden requerir intervención manual');
  }
  console.log('═══════════════════════════════════════════════════════════\n');
}

// Ejecutar
migrate().catch(error => {
  console.error('\n❌ Error fatal:', error.message);
  process.exit(1);
});
