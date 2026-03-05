import fs from 'fs';
import path from 'path';

// ============================================================================
// CONFIGURACIÓN DEL PROCESADOR IA (LOCAL OLLAMA)
// ============================================================================
const INPUT_FILE = path.join(process.cwd(), 'knop_raw_data.json');
const OUTPUT_FILE = path.join(process.cwd(), 'knop_processed_data.json');
const OLLAMA_URL = 'http://127.0.0.1:11434/api/generate'; 
const OLLAMA_MODEL = 'llama3.1'; 

// ============================================================================
// INTERFACES
// ============================================================================
interface RawProduct {
  url: string;
  exactName: string;
  exactSku: string;
  exactBrand: string;
  presentation: string;
  benefits: string;
  usage: string;
  storage: string;
  warnings: string;
  precautions: string;
  ingredients: string;
  cleanText: string;
  scrapedAt: string;
}

interface ProcessedProduct {
  sku: string;
  nombre_comercial: string;
  descripcion: string;
  principios_activos: string[];
  posologia: string;
  indicaciones: string[];
  advertencias: string;
  tags_ia: string[];
  apto_embarazo: string;
  apto_lactancia: string;
  apto_pediatria: string;
  apto_diabeticos: string;
  apto_hipertensos: string;
  apto_celiacos: string;
  sugerencia_complementaria: string;
  source_url: string;
}

// ============================================================================
// MOTOR DE PROCESAMIENTO IA (LOCAL OLLAMA)
// ============================================================================
async function runProcessor() {
  console.log(`🧠 Iniciando Procesador IA LOCAL (Ollama)...`);
  console.log(`📂 Leyendo archivo: ${INPUT_FILE}`);
  console.log(`🤖 Usando modelo: ${OLLAMA_MODEL}`);
  console.log(`❄️ Pausa de enfriamiento: 3 segundos entre productos`);
  console.log(`--------------------------------------------------`);

  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Error: No se encontró el archivo ${INPUT_FILE}. Ejecuta primero el scraper.`);
    return;
  }

  const rawData: RawProduct[] = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  const processedData: ProcessedProduct[] = [];
  
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      const existingData = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
      processedData.push(...existingData);
      console.log(`🔄 Retomando proceso: ${processedData.length} productos ya procesados.`);
    } catch (e) {
      console.warn('⚠️ Error leyendo archivo procesado previo.');
    }
  }

  const pendingData = rawData.filter(raw => !processedData.some(p => p.source_url === raw.url));
  console.log(`📊 Productos pendientes por procesar: ${pendingData.length}`);

  for (let i = 0; i < pendingData.length; i++) {
    const item = pendingData[i];
    console.log(`[${i + 1}/${pendingData.length}] ⏳ Analizando localmente: ${item.exactName || item.url}`);

    try {
      const prompt = `Actúa como un experto farmacólogo. Extrae la información médica de este producto.
      
      DATOS EXTRAÍDOS QUIRÚRGICAMENTE:
      - Nombre: ${item.exactName}
      - Marca: ${item.exactBrand}
      - Presentación: ${item.presentation || 'No detectada'}
      - Beneficios: ${item.benefits || 'No detectados'}
      - Modo de Uso: ${item.usage || 'No detectado'}
      - Ingredientes/Composición: ${item.ingredients || 'No detectados'}
      - Advertencias: ${item.warnings || 'No detectadas'}
      - Precauciones: ${item.precautions || 'No detectadas'}

      TEXTO ADICIONAL (Respaldo):
      ${item.cleanText.substring(0, 3000)}

      Responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta:
      {
        "sku": "SKU",
        "nombre_comercial": "Nombre",
        "descripcion": "Descripción",
        "principios_activos": ["A", "B"],
        "posologia": "Dosis",
        "indicaciones": ["I1", "I2"],
        "advertencias": "Advertencias",
        "tags_ia": ["T1", "T2"],
        "apto_embarazo": "SI/NO/PRECAUCION",
        "apto_lactancia": "SI/NO/PRECAUCION",
        "apto_pediatria": "SI/NO/PRECAUCION",
        "apto_diabeticos": "SI/NO/PRECAUCION",
        "apto_hipertensos": "SI/NO/PRECAUCION",
        "apto_celiacos": "SI/NO/PRECAUCION",
        "sugerencia_complementaria": "Sugerencia"
      }`;

      const response = await fetch(OLLAMA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt: prompt,
          stream: false,
          format: 'json',
          options: {
            temperature: 0.1,
            num_ctx: 4096
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API Error (${response.status}): ${errorText}`);
      }
      
      const data: any = await response.json();
      let jsonStr = data.response || "";
      
      if (!jsonStr) throw new Error("Ollama devolvió una respuesta vacía.");

      // Limpieza de posibles caracteres extraños
      const firstBrace = jsonStr.indexOf('{');
      const lastBrace = jsonStr.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
      }
      
      const productData = JSON.parse(jsonStr);

      const processedProduct: ProcessedProduct = {
        sku: productData.sku || item.exactSku || `SCR-${Date.now().toString().slice(-6)}`,
        nombre_comercial: productData.nombre_comercial || item.exactName || 'Desconocido',
        descripcion: productData.descripcion || '',
        principios_activos: Array.isArray(productData.principios_activos) ? productData.principios_activos : [],
        posologia: productData.posologia || 'Consultar al médico',
        indicaciones: Array.isArray(productData.indicaciones) ? productData.indicaciones : [],
        advertencias: productData.advertencias || 'Sin advertencias específicas',
        tags_ia: Array.isArray(productData.tags_ia) ? productData.tags_ia : [],
        apto_embarazo: productData.apto_embarazo || 'PRECAUCION',
        apto_lactancia: productData.apto_lactancia || 'PRECAUCION',
        apto_pediatria: productData.apto_pediatria || 'PRECAUCION',
        apto_diabeticos: productData.apto_diabeticos || 'PRECAUCION',
        apto_hipertensos: productData.apto_hipertensos || 'PRECAUCION',
        apto_celiacos: productData.apto_celiacos || 'PRECAUCION',
        sugerencia_complementaria: productData.sugerencia_complementaria || '',
        source_url: item.url
      };

      processedData.push(processedProduct);
      console.log(`   ✅ Procesado: ${processedProduct.nombre_comercial}`);

      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(processedData, null, 2));
      
      // Pausa de enfriamiento para Mac M4
      await new Promise(r => setTimeout(r, 3000));

    } catch (err: any) {
      console.error(`   ❌ Error procesando ${item.url}: ${err.message}`);
      if (err.message.includes('ECONNREFUSED')) {
        console.error("   🛑 ¡Ollama no parece estar corriendo! Asegúrate de ejecutar 'ollama serve'.");
        break;
      }
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log(`\n🎉 PROCESAMIENTO FINALIZADO.`);
  console.log(`📊 Total procesado: ${processedData.length} productos.`);
}

runProcessor();
