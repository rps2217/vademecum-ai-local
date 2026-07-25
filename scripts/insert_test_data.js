/**
 * Script para insertar datos de prueba en Supabase
 * 
 * Uso: node scripts/insert_test_data.js
 * 
 * NOTA: Requiere que las tablas ya estén creadas en Supabase.
 */

const https = require('https');

const SUPABASE_URL = 'pspxqzwxulgmzarlqwtt.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzcHhxend4dWxnbXphcmxxd3R0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjU3NDU4NCwiZXhwIjoyMDkyMTUwNTg0fQ.gAjBTUAIbhLwjOhbHBk-L0y_0mHstvF57xgrRY1NGcI';

async function insertData(table, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: SUPABASE_URL,
      path: `/rest/v1/${table}`,
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function getData(table) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SUPABASE_URL,
      path: `/rest/v1/${table}?select=*`,
      method: 'GET',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('============================================');
  console.log('Insertando datos de prueba en Supabase');
  console.log('============================================\n');

  // Verificar conexión
  console.log('1. Verificando conexión...');
  try {
    const existingData = await getData('ingredient_knowledge');
    if (Array.isArray(existingData) && existingData.length > 0) {
      console.log(`   Ya hay ${existingData.length} ingredientes en la base de datos.\n`);
      console.log('   Datos existentes:');
      existingData.forEach(ing => {
        console.log(`   - ${ing.nombre} (${ing.categoria})`);
      });
      console.log('\n');
      console.log('Las tablas ya están creadas y tienen datos.');
      console.log('============================================');
      return;
    }
  } catch (error) {
    console.log(`   Error: ${error.message}`);
    console.log('   Las tablas probablemente no existen.\n');
    console.log('   CREA LAS TABLAS PRIMERO desde el Dashboard de Supabase:');
    console.log('   1. Ve a: https://supabase.com/dashboard');
    console.log('   2. SQL Editor -> New Query');
    console.log('   3. Copia el contenido de scripts/supabase_synergies_schema.sql');
    console.log('   4. Ejecuta el SQL\n');
    console.log('   O sigue las instrucciones en INSTRUCCIONES_SUPABASE.md\n');
    console.log('============================================');
    return;
  }

  // Insertar ingredientes
  console.log('2. Insertando ingredientes...');
  const ingredientes = [
    {
      ingredient_id: 'vitamina_c',
      nombre: 'Vitamina C (Ácido Ascórbico)',
      categoria: 'vitaminas',
      descripcion: 'Antioxidante hidrosoluble esencial para el sistema inmunológico, síntesis de colágeno y absorción de hierro.',
      mecanismo_accion: 'Actúa como antioxidante, neutraliza radicales libres, esencial para síntesis de colágeno.',
      beneficios: ['Refuerza el sistema inmunológico', 'Protege contra daño oxidativo', 'Favorece la síntesis de colágeno', 'Mejora la absorción de hierro'],
      dosis_recomendada: '75-90mg/día'
    },
    {
      ingredient_id: 'zinc',
      nombre: 'Zinc',
      categoria: 'minerales',
      descripcion: 'Mineral esencial para más de 300 enzimas, función inmune, cicatrización y síntesis de proteínas.',
      mecanismo_accion: 'Cofactor de metaloenzimas, estructura de proteínas, función inmune.',
      beneficios: ['Fortalecimiento inmune', 'Cicatrización de heridas', 'Síntesis de proteínas', 'Función cognitiva'],
      dosis_recomendada: '8-11mg/día'
    },
    {
      ingredient_id: 'magnesio',
      nombre: 'Magnesio',
      categoria: 'minerales',
      descripcion: 'Mineral esencial para más de 600 reacciones enzimáticas, función muscular, nerviosa y cardiovascular.',
      mecanismo_accion: 'Cofactor de ATP, contracciones musculares, transmisión nerviosa.',
      beneficios: ['Relajación muscular', 'Función nerviosa', 'Salud cardiovascular', 'Calidad del sueño'],
      dosis_recomendada: '310-420mg/día'
    },
    {
      ingredient_id: 'vitamina_d3',
      nombre: 'Vitamina D3 (Colecalciferol)',
      categoria: 'vitaminas',
      descripcion: 'Vitamina liposoluble esencial para la absorción de calcio, función muscular, neurológica e inmunológica.',
      mecanismo_accion: 'Se convierte en calcitriol, hormona que regula la absorción intestinal de calcio.',
      beneficios: ['Esencial para absorción de calcio', 'Fortalecimiento óseo', 'Soporte inmunológico', 'Función muscular óptima'],
      dosis_recomendada: '600-2000 UI/día'
    },
    {
      ingredient_id: 'omega_3',
      nombre: 'Omega-3 (EPA y DHA)',
      categoria: 'acidos_grasos',
      descripcion: 'Ácidos grasos esenciales antiinflamatorios para cerebro, corazón y articulaciones.',
      mecanismo_accion: 'Precursores de resolvinas antiinflamatorias, estructura neuronal.',
      beneficios: ['Antiinflamatorio natural', 'Salud cardiovascular', 'Función cerebral', 'Articulaciones'],
      dosis_recomendada: '1000-3000mg EPA+DHA/día'
    },
    {
      ingredient_id: 'vitamina_e',
      nombre: 'Vitamina E (Tocoferoles)',
      categoria: 'vitaminas',
      descripcion: 'Antioxidante liposoluble que protege las membranas celulares del daño oxidativo.',
      mecanismo_accion: 'Neutraliza radicales libres en membranas lipídicas.',
      beneficios: ['Potente antioxidante', 'Protege membranas celulares', 'Salud cardiovascular'],
      dosis_recomendada: '15mg/día'
    },
    {
      ingredient_id: 'selenio',
      nombre: 'Selenio',
      categoria: 'minerales',
      descripcion: 'Mineral traza esencial para antioxidantes, función tiroidea y sistema inmune.',
      mecanismo_accion: 'Componente de selenoproteínas (glutatión peroxidasa).',
      beneficios: ['Antioxidante potente', 'Función tiroidea', 'Soporte inmune', 'Salud cardiovascular'],
      dosis_recomendada: '55mcg/día'
    },
    {
      ingredient_id: 'hierro',
      nombre: 'Hierro',
      categoria: 'minerales',
      descripcion: 'Mineral esencial para transporte de oxígeno, formación de hemoglobina.',
      mecanismo_accion: 'Componente de hemoglobina y mioglobina.',
      beneficios: ['Transporte de oxígeno', 'Formación de hemoglobina', 'Producción de energía'],
      dosis_recomendada: '8-18mg/día'
    }
  ];

  for (const ing of ingredientes) {
    try {
      await insertData('ingredient_knowledge', ing);
      console.log(`   ✓ ${ing.nombre}`);
    } catch (error) {
      console.log(`   ✗ ${ing.nombre}: ${error.message}`);
    }
  }

  // Insertar relaciones
  console.log('\n3. Insertando relaciones de sinergia...');
  const relaciones = [
    { ingredient1_id: 'vitamina_c', ingredient2_id: 'zinc', tipo_relacion: 'sinergia', nivel: 'alto', tipo: 'complementario', descripcion: 'Sinergia en función inmunológica' },
    { ingredient1_id: 'vitamina_d3', ingredient2_id: 'calcio', tipo_relacion: 'sinergia', nivel: 'alto', tipo: 'potenciador', descripcion: 'Esencial para absorción de calcio' },
    { ingredient1_id: 'vitamina_d3', ingredient2_id: 'magnesio', tipo_relacion: 'sinergia', nivel: 'alto', tipo: 'cofactor', descripcion: 'Cofactor en activación de vitamina D' },
    { ingredient1_id: 'omega_3', ingredient2_id: 'vitamina_d3', tipo_relacion: 'sinergia', nivel: 'alto', tipo: 'complementario', descripcion: 'Absorción y utilización' },
    { ingredient1_id: 'zinc', ingredient2_id: 'magnesio', tipo_relacion: 'sinergia', nivel: 'medio', tipo: 'complementario', descripcion: 'Absorción intestinal competitiva' },
    { ingredient1_id: 'vitamina_c', ingredient2_id: 'hierro', tipo_relacion: 'sinergia', nivel: 'alto', tipo: 'complementario', descripcion: 'Mejora absorción de hierro no hemo' },
    { ingredient1_id: 'vitamina_e', ingredient2_id: 'vitamina_c', tipo_relacion: 'sinergia', nivel: 'alto', tipo: 'potenciador', descripcion: 'Regenera vitamina E oxidada' },
    { ingredient1_id: 'selenio', ingredient2_id: 'vitamina_e', tipo_relacion: 'sinergia', nivel: 'alto', tipo: 'potenciador', descripcion: 'Sinergia antioxidante' }
  ];

  for (const rel of relaciones) {
    try {
      await insertData('ingredient_relationships', rel);
      console.log(`   ✓ ${rel.ingredient1_id} ↔ ${rel.ingredient2_id} (${rel.nivel})`);
    } catch (error) {
      console.log(`   ✗ ${rel.ingredient1_id} ↔ ${rel.ingredient2_id}: ${error.message}`);
    }
  }

  console.log('\n============================================');
  console.log('Datos insertados exitosamente!');
  console.log('============================================');
  console.log('\nPuedes verificar los datos en:');
  console.log('https://supabase.com/dashboard/project/pspxqzwxulgmzarlqwtt/editor');
}

main().catch(console.error);
