/**
 * Fase 3: Procesador IA local con Ollama.
 *
 * Lee knop_raw_data.json, envía el texto limpio a Ollama (llama3.1) para
 * estructurarlo en JSON médico, y guarda en knop_processed_data.json.
 *
 * El schema de salida coincide con las columnas de la tabla `products` de
 * Supabase (snake_case) para facilitar el upload posterior:
 *   - SafetyStatus: SI→apto, NO→evitar, PRECAUCION→contraindicado
 *   - advertencias (string) → contraindicaciones[] (array)
 *   - fabricante se preserva del scraper
 *   - source='scraped', source_url preservado
 *
 * Resume: si el archivo de salida ya existe, continúa desde donde se quedó.
 *
 * Uso:  npx ts-node --transpile-only scripts/scraper/processor_ia.ts
 */
import fs from 'fs';
import { OLLAMA_URL, OLLAMA_MODEL, OLLAMA_COOLDOWN_MS, FILES } from './config';
import type { RawProduct } from './scraper_local';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface ProcessedProduct {
  sku: string;
  nombre_comercial: string;
  fabricante: string | null;
  descripcion: string;
  principios_activos: string[];
  posologia: string;
  indicaciones: string[];
  contraindicaciones: string[];
  categoria: string | null;
  data: Record<string, unknown>;
  embarazo: string;
  lactancia: string;
  pediatria: string;
  hipertension: string;
  diabetes: string;
  celiacos: string;
  source: string;
  source_url: string;
  lamport: number;
}

/** Mapea SI/NO/PRECAUCION del LLM → valores del enum SafetyStatus de la app. */
function mapSafety(value: string): string {
  const v = (value || '').toUpperCase().trim();
  if (v === 'SI' || v === 'SÍ' || v === 'APTO') return 'apto';
  if (v === 'NO' || v === 'EVITAR') return 'evitar';
  if (v === 'PRECAUCION' || v === 'PRECAUCIÓN') return 'contraindicado';
  return 'desconocido';
}

/** Convierte un string de advertencias en un array de items. */
function splitAdvertencias(text: string): string[] {
  if (!text || !text.trim()) return [];
  return text
    .split(/[;•·|\n]+|(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2 && !/^consult/i.test(s));
}

// ─── Prompt ──────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Eres un Ingeniero de Datos Médicos y Farmacólogo Experto.
Tu tarea es analizar el texto extraído de la ficha técnica de un producto de farmacia
(medicamento natural, homeopático o suplemento) y estructurarlo en formato JSON.

REGLAS CRÍTICAS:
1. Extrae los principios activos reales (ej: "Extracto de Valeriana", "Ácido ascórbico"),
   NO excipientes (ej: "Agua", "Glicerina", "Gelatina").
2. Si la posología no se menciona, escribe "Consultar al médico o farmacéutico".
3. Para el semáforo de seguridad, usa SOLO estos valores: "SI", "NO", o "PRECAUCION".
   - "NO" si el texto dice "No usar en embarazo/lactancia", "Contraindicado".
   - "PRECAUCION" si dice "Consulte a su médico" o no menciona nada (por seguridad).
   - "SI" solo si es explícitamente seguro.
4. En advertencias, incluye contraindicaciones, efectos secundarios y precauciones.
5. Limpia cualquier etiqueta HTML residual. Devuelve SOLO texto limpio.
6. Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional.`;

function buildPrompt(item: RawProduct): string {
  return `Analiza este producto de farmacia y extrae la información médica.

DATOS EXTRAÍDOS:
- Nombre: ${item.exactName || 'N/A'}
- Marca: ${item.exactBrand || 'N/A'}
- Presentación: ${item.presentation || 'No detectada'}
- Beneficios: ${item.benefits || 'No detectados'}
- Modo de Uso: ${item.usage || 'No detectado'}
- Ingredientes/Composición: ${item.ingredients || 'No detectados'}
- Advertencias: ${item.warnings || 'No detectadas'}
- Precauciones: ${item.precautions || 'No detectadas'}

TEXTO ADICIONAL (Respaldo):
${item.cleanText.substring(0, 3000)}

Responde ÚNICAMENTE con un JSON válido con esta estructura:
{
  "descripcion": "Descripción general del producto",
  "principios_activos": ["Principio 1", "Principio 2"],
  "posologia": "Dosis recomendada",
  "indicaciones": ["Indicación 1"],
  "advertencias": "Texto de advertencias y contraindicaciones",
  "categoria": "fitoterapia|homeopatia|vitaminas|suplementos|cosmetica|otros",
  "tags_ia": ["tag1", "tag2", "tag3"],
  "apto_embarazo": "SI|NO|PRECAUCION",
  "apto_lactancia": "SI|NO|PRECAUCION",
  "apto_pediatria": "SI|NO|PRECAUCION",
  "apto_diabeticos": "SI|NO|PRECAUCION",
  "apto_hipertensos": "SI|NO|PRECAUCION",
  "apto_celiacos": "SI|NO|PRECAUCION",
  "sugerencia_complementaria": "Consejo breve"
}`;
}

// ─── Llamada a Ollama ────────────────────────────────────────────────────────

async function processWithOllama(item: RawProduct): Promise<ProcessedProduct | null> {
  const prompt = buildPrompt(item);

  try {
    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: `${SYSTEM_PROMPT}\n\n${prompt}`,
        stream: false,
        format: 'json',
        options: {
          temperature: 0.1,
          num_ctx: 4096,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API Error (${response.status}): ${errorText}`);
    }

    const data: any = await response.json();
    let jsonStr: string = data.response || '';

    if (!jsonStr) throw new Error('Ollama devolvió una respuesta vacía.');

    // Extraer el JSON de la respuesta (por si hay texto extra)
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }

    const parsed = JSON.parse(jsonStr);

    const sku =
      item.exactSku || `SCR-${Date.now().toString().slice(-6)}`;
    const nombreComercial = parsed.nombre_comercial || item.exactName || 'Desconocido';

    return {
      sku,
      nombre_comercial: nombreComercial,
      fabricante: item.exactBrand || null,
      descripcion: parsed.descripcion || '',
      principios_activos: Array.isArray(parsed.principios_activos)
        ? parsed.principios_activos
        : [],
      posologia: parsed.posologia || 'Consultar al médico o farmacéutico',
      indicaciones: Array.isArray(parsed.indicaciones) ? parsed.indicaciones : [],
      contraindicaciones: splitAdvertencias(parsed.advertencias || ''),
      categoria: parsed.categoria || null,
      data: {
        tags_ia: Array.isArray(parsed.tags_ia) ? parsed.tags_ia : [],
        descripcion: parsed.descripcion || '',
        sugerencia_complementaria: parsed.sugerencia_complementaria || '',
        apto_embarazo_raw: parsed.apto_embarazo || 'PRECAUCION',
        apto_lactancia_raw: parsed.apto_lactancia || 'PRECAUCION',
        apto_pediatria_raw: parsed.apto_pediatria || 'PRECAUCION',
        apto_diabeticos_raw: parsed.apto_diabeticos || 'PRECAUCION',
        apto_hipertensos_raw: parsed.apto_hipertensos || 'PRECAUCION',
        apto_celiacos_raw: parsed.apto_celiacos || 'PRECAUCION',
      },
      embarazo: mapSafety(parsed.apto_embarazo),
      lactancia: mapSafety(parsed.apto_lactancia),
      pediatria: mapSafety(parsed.apto_pediatria),
      hipertension: mapSafety(parsed.apto_hipertensos),
      diabetes: mapSafety(parsed.apto_diabeticos),
      celiacos: mapSafety(parsed.apto_celiacos),
      source: 'scraped',
      source_url: item.url,
      lamport: 1,
    };
  } catch (err: any) {
    if (err.message.includes('ECONNREFUSED')) {
      console.error(
        '   🛑 ¡Ollama no está corriendo! Ejecuta "ollama serve" o abre la app.',
      );
      return null;
    }
    console.error(`   ❌ Error procesando: ${err.message}`);
    return null;
  }
}

// ─── Orquestador ─────────────────────────────────────────────────────────────

export async function runProcessor() {
  console.log('🧠 Iniciando Procesador IA LOCAL (Ollama)...');
  console.log(`📂 Entrada: ${FILES.RAW_DATA}`);
  console.log(`📂 Salida: ${FILES.PROCESSED}`);
  console.log(`🤖 Modelo: ${OLLAMA_MODEL}`);
  console.log(`❄️ Pausa: ${OLLAMA_COOLDOWN_MS}ms entre productos`);
  console.log('─'.repeat(50));

  if (!fs.existsSync(FILES.RAW_DATA)) {
    console.error(`❌ No se encontró ${FILES.RAW_DATA}. Ejecuta el scraper primero.`);
    return;
  }

  const rawData: RawProduct[] = JSON.parse(
    fs.readFileSync(FILES.RAW_DATA, 'utf-8'),
  );
  const processedData: ProcessedProduct[] = [];

  // Resume
  if (fs.existsSync(FILES.PROCESSED)) {
    try {
      const existing = JSON.parse(fs.readFileSync(FILES.PROCESSED, 'utf-8'));
      processedData.push(...existing);
      console.log(`🔄 Retomando: ${processedData.length} productos ya procesados.`);
    } catch {
      console.warn('⚠️ Error leyendo archivo procesado previo.');
    }
  }

  // Filtrar pendientes
  const processedUrls = new Set(processedData.map((p) => p.source_url));
  const pending = rawData.filter((r) => !processedUrls.has(r.url));
  console.log(`📊 Pendientes: ${pending.length} productos\n`);

  for (let i = 0; i < pending.length; i++) {
    const item = pending[i];
    console.log(
      `[${i + 1}/${pending.length}] ⏳ ${item.exactName || item.url}`,
    );

    const result = await processWithOllama(item);
    if (result) {
      processedData.push(result);
      console.log(`   ✅ ${result.nombre_comercial}`);
      console.log(
        `      🧪 ${result.principios_activos.length} principios activos`,
      );
      fs.writeFileSync(FILES.PROCESSED, JSON.stringify(processedData, null, 2));
    }

    await new Promise((r) => setTimeout(r, OLLAMA_COOLDOWN_MS));
  }

  console.log(`\n🎉 PROCESAMIENTO FINALIZADO.`);
  console.log(`📊 Total: ${processedData.length} productos en ${FILES.PROCESSED}`);
}

if (require.main === module) {
  runProcessor().catch((err) => {
    console.error('Error fatal:', err);
    process.exit(1);
  });
}
