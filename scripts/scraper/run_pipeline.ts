/**
 * Orquestador del pipeline completo de scraping (5 fases).
 *
 *   Fase 1+2: Scraper (crawler + extractor) → knop_raw_data.json
 *   Fase 3:   Procesador IA (Ollama)        → knop_processed_data.json
 *   Fase 4:   Matcher KB                    → knop_matched_data.json + report
 *   Fase 5:   Upload Supabase               → products + bridge + analysis
 *
 * Uso:
 *   npx ts-node --transpile-only scripts/scraper/run_pipeline.ts [fase]
 *
 * Fases:
 *   (sin arg)  Ejecuta las 5 fases en orden (saltando las ya completadas)
 *   scrape     Solo fase 1+2 (scraper)
 *   process    Solo fase 3 (procesador IA)
 *   match      Solo fase 4 (matcher)
 *   upload     Solo fase 5 (upload a Supabase)
 *   all        Todas las fases (igual que sin arg)
 */
import { runScraper } from './scraper_local';
import { runProcessor } from './processor_ia';
import { runMatcher } from './kb_matcher';
import { runUploader } from './supabase_uploader';

const PHASE = process.argv[2]?.toLowerCase() || 'all';

async function main() {
  console.log('═'.repeat(60));
  console.log('  PIPELINE DE SCRAPING — Vademecum AI');
  console.log('═'.repeat(60));
  console.log(`  Fase solicitada: ${PHASE}`);
  console.log('═'.repeat(60));

  const runAll = PHASE === 'all';

  if (runAll || PHASE === 'scrape') {
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  FASE 1+2: SCRAPER (Crawler + Extractor)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    await runScraper();
  }

  if (runAll || PHASE === 'process') {
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  FASE 3: PROCESADOR IA (Ollama)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    await runProcessor();
  }

  if (runAll || PHASE === 'match') {
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  FASE 4: MATCHER KB');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    await runMatcher();
  }

  if (runAll || PHASE === 'upload') {
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  FASE 5: UPLOAD SUPABASE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    await runUploader();
  }

  console.log('\n\n═'.repeat(60));
  console.log('  ✅ PIPELINE COMPLETADO');
  console.log('═'.repeat(60));
}

main().catch((err) => {
  console.error('\n❌ Error fatal en pipeline:', err);
  process.exit(1);
});
