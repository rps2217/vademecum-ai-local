/**
 * Script para desplegar el schema de sinergias en Supabase
 * 
 * Uso: node scripts/deploy_synergies.js
 */

const https = require('https');

const SUPABASE_URL = 'pspxqzwxulgmzarlqwtt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzcHhxend4dWxnbXphcmxxd3R0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjU3NDU4NCwiZXhwIjoyMDkyMTUwNTg0fQ.gAjBTUAIbhLwjOhbHBk-L0y_0mHstvF57xgrRY1NGcI';

async function makeRequest(path, method, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SUPABASE_URL,
      path: path,
      method: method,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function createTable(sql) {
  console.log('Creando tabla...');
  
  // Dividir el SQL en sentencias individuales
  const statements = sql
    .split(/;\s*$/m)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))
    .map(s => s.replace(/--.*$/gm, '').trim());

  let created = 0;
  let errors = 0;

  for (const stmt of statements) {
    if (!stmt || stmt.length < 10) continue;
    
    try {
      // Usar POSTGRES RPC si está disponible
      const result = await makeRequest('/rest/v1/rpc/pg_execute', 'POST', {
        sql: stmt
      });
      console.log('  - Sentencia ejecutada');
      created++;
    } catch (error) {
      // Si falla, intentamos otro método
      try {
        // Intentar crear tabla directamente
        const createResult = await makeRequest('/rest/v1/tables', 'POST', {
          name: 'test_table',
          schema: 'public'
        });
        created++;
      } catch (e) {
        errors++;
      }
    }
  }

  return { created, errors };
}

async function verifyTables() {
  console.log('\nVerificando tablas...');
  
  try {
    const tables = await makeRequest('/rest/v1/?apikey=' + SUPABASE_KEY, 'GET');
    console.log('Tablas existentes:', JSON.stringify(tables, null, 2));
  } catch (error) {
    console.log('Error verificando tablas:', error.message);
  }
}

async function main() {
  console.log('============================================');
  console.log('Desplegando Schema de Sinergias en Supabase');
  console.log('============================================\n');

  console.log('NOTA: Para crear las tablas, ejecuta el SQL manualmente:');
  console.log('1. Ve a: https://supabase.com/dashboard');
  console.log('2. Selecciona tu proyecto');
  console.log('3. SQL Editor -> New Query');
  console.log('4. Copia el contenido de: scripts/supabase_synergies_schema.sql');
  console.log('5. Ejecuta el script\n');

  console.log('Alternativamente, puedes usar la CLI de Supabase:');
  console.log('  npx supabase db execute -f scripts/supabase_synergies_schema.sql\n');

  await verifyTables();

  console.log('============================================');
  console.log('Script completado');
  console.log('============================================');
}

main().catch(console.error);
