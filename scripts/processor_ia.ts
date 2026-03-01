import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from "@google/generative-ai";

// ============================================================================
// CONFIGURACIÓN DEL PROCESADOR IA
// ============================================================================
const INPUT_FILE = path.join(process.cwd(), 'knop_raw_data.json');
const OUTPUT_FILE = path.join(process.cwd(), 'knop_processed_data.json');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'TU_API_KEY_AQUI'; // ¡Pon tu API Key aquí!

// ============================================================================
// INTERFACES
// ============================================================================
interface RawProduct {
  url: string;
  exactName: string;
  exactSku: string;
  exactBrand: string;
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
// MOTOR DE PROCESAMIENTO IA (GEMINI)
// ============================================================================
async function runProcessor() {
  console.log(`🧠 Iniciando Procesador IA Masivo...`);
  console.log(`📂 Leyendo archivo: ${INPUT_FILE}`);
  console.log(`--------------------------------------------------`);

  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Error: No se encontró el archivo ${INPUT_FILE}. Ejecuta primero el scraper.`);
    return;
  }

  const rawData: RawProduct[] = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  const processedData: ProcessedProduct[] = [];
  
  // Si ya hay un archivo procesado, cargarlo para continuar desde donde nos quedamos
  if (fs.existsSync(OUTPUT_FILE)) {
    const existingData = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
    processedData.push(...existingData);
    console.log(`🔄 Retomando proceso: ${processedData.length} productos ya procesados.`);
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  // Filtrar los que ya procesamos
  const pendingData = rawData.filter(raw => !processedData.some(p => p.source_url === raw.url));
  console.log(`📊 Productos pendientes por procesar: ${pendingData.length}`);

  for (let i = 0; i < pendingData.length; i++) {
    const item = pendingData[i];
    console.log(`[${i + 1}/${pendingData.length}] ⏳ Analizando: ${item.exactName || item.url}`);

    try {
      const prompt = `Actúa como un experto farmacólogo. Extrae la información médica de este producto a partir de los siguientes datos extraídos de su página web.
      
      DATOS EXACTOS EXTRAÍDOS POR SCRIPT:
      - Nombre Comercial: ${item.exactName || 'No encontrado, búscalo en el texto'}
      - SKU / Código: ${item.exactSku || 'No encontrado, búscalo en el texto'}
      - Marca: ${item.exactBrand || 'No encontrada'}

      TEXTO DE LA DESCRIPCIÓN DEL PRODUCTO:
      ${item.cleanText.substring(0, 8000)}

      Devuelve un JSON estricto con esta estructura. Usa los "DATOS EXACTOS" si están disponibles, y usa el "TEXTO" para deducir el resto (posología, advertencias, etc.):
      {
        "sku": "SKU o Código del producto",
        "nombre_comercial": "Nombre comercial y presentación",
        "descripcion": "Descripción breve del producto",
        "principios_activos": ["principio activo 1", "principio activo 2"],
        "posologia": "Dosis recomendada general",
        "indicaciones": ["indicación 1", "indicación 2"],
        "advertencias": "Advertencias y contraindicaciones",
        "tags_ia": ["etiqueta 1", "etiqueta 2"],
        "apto_embarazo": "SI" o "NO" o "PRECAUCION",
        "apto_lactancia": "SI" o "NO" o "PRECAUCION",
        "apto_pediatria": "SI" o "NO" o "PRECAUCION",
        "apto_diabeticos": "SI" o "NO" o "PRECAUCION",
        "apto_hipertensos": "SI" o "NO" o "PRECAUCION",
        "apto_celiacos": "SI" o "NO" o "PRECAUCION",
        "sugerencia_complementaria": "Sugerencia de producto complementario"
      }`;

      const response = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      });

      let jsonStr = response.response.text() || "{}";
      
      // Limpieza extrema: buscar el primer '{' y el último '}'
      // Esto ignora cualquier texto o comilla Markdown que Gemini ponga antes o después
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
        principios_activos: productData.principios_activos || [],
        posologia: productData.posologia || 'Consultar al médico',
        indicaciones: productData.indicaciones || [],
        advertencias: productData.advertencias || 'Sin advertencias específicas',
        tags_ia: productData.tags_ia || [],
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

      // Guardar progreso en cada iteración por si se corta
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(processedData, null, 2));

      // Pausa estricta para no saturar los límites de Gemini (15 RPM = 1 cada 4 segundos)
      // Usamos 5 segundos para estar seguros. Como esto corre en tu PC, no importa si tarda horas.
      await new Promise(r => setTimeout(r, 5000));

    } catch (err: any) {
      console.error(`   ❌ Error procesando ${item.url}: ${err.message}`);
      // Si hay error de cuota (429), pausar más tiempo
      if (err.message.includes('429') || err.message.includes('quota')) {
        console.log(`   ⚠️ Límite de cuota alcanzado. Pausando 60 segundos...`);
        await new Promise(r => setTimeout(r, 60000));
      }
    }
  }

  console.log(`\n🎉 PROCESAMIENTO FINALIZADO CON ÉXITO.`);
  console.log(`📁 Archivo final guardado en: ${OUTPUT_FILE}`);
  console.log(`📊 Total procesado: ${processedData.length} productos.`);
}

runProcessor();
