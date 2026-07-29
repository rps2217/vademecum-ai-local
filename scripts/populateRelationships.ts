/**
 * Script para poblar ingredient_relationships en Supabase
 * con los datos de sinergias locales
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pspxqzwxulgmzarlqwtt.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzcHhxend4dWxnbXphcmxxd3R0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjU3NDU4NCwiZXhwIjoyMDkyMTUwNTg0fQ.gAjBTUAIbhLwjOhbHBk-L0y_0mHstvF57xgrRY1NGcI';

interface SynergyData {
  id: string;
  ingredienteA: string;
  ingredienteB: string;
  tipo: string;
  nivel?: string;
  descripcion?: string;
  mecanismo?: string;
  evidencia?: string;
}

interface SynergyJson {
  metadata: {
    total: number;
  };
  sinergias: Array<{
    id: string;
    ingredienteA: string;
    ingredienteB: string;
    tipo: string;
    nivelEvidencia: string;
    descripcion: string;
    beneficios?: string[];
    precauciones?: string[];
    mecanismo?: string;
  }>;
}

async function populateRelationships() {
  console.log('Iniciando poblamiento de ingredient_relationships...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Cargar datos locales
  const synergyData: SynergyJson = await import('../src/db/seeders/data/sinergias.json', {
    assert: { type: 'json' }
  }) as unknown as SynergyJson;

  const { sinergias, metadata } = synergyData;
  console.log(`Found ${metadata.total} sinergias en archivo local`);
  console.log(`Procesando ${sinergias.length} registros...\n`);

  // Transformar y subir
  const records: SynergyData[] = sinergias.map(s => ({
    id: s.id,
    ingredienteA: s.ingredienteA,
    ingredienteB: s.ingredienteB,
    tipo: s.tipo,
    nivel: s.nivelEvidencia,
    descripcion: s.descripcion,
    mecanismo: s.mecanismo,
    evidencia: s.nivelEvidencia,
  }));

  // Subir en lotes de 10
  const batchSize = 10;
  let uploaded = 0;
  let errors = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('ingredient_relationships')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`Error en lote ${i}-${i + batch.length}:`, error.message);
      errors += batch.length;
    } else {
      uploaded += batch.length;
      console.log(`✓ Subidos ${uploaded}/${records.length} registros`);
    }
  }

  console.log('\n=== RESUMEN ===');
  console.log(`Total registros: ${records.length}`);
  console.log(`Subidos exitosamente: ${uploaded}`);
  console.log(`Errores: ${errors}`);

  // Verificar resultado
  const { count } = await supabase
    .from('ingredient_relationships')
    .select('*', { count: 'exact', head: true });

  console.log(`Total en Supabase: ${count}`);
}

populateRelationships().catch(console.error);
