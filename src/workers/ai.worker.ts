import { logger } from '../services/LoggerService';
import { CreateMLCEngine, MLCEngine } from '@mlc-ai/web-llm';
import { pipeline, env } from '@xenova/transformers';

// Configuración de entorno para Transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

// Estado del Worker
let webLlmEngine: MLCEngine | null = null;
let transformersPipeline: any = null;
let embeddingPipeline: any = null;
let isInitializing = false;
let isReady = false;

// Tipos de mensajes
type WorkerMessage = 
  | { type: 'INIT'; payload: { hardwareTier: 'HIGH' | 'LOW' | 'NONE' } }
  | { type: 'EXTRACT'; payload: { text: string; url: string } }
  | { type: 'EMBED'; payload: { text: string } }
  | { type: 'ANALYZE'; payload: { query: string; context: string } }
  | { type: 'ANALYZE_CLINICAL'; payload: { product: any; candidates: any[]; type: 'synergy' | 'alternatives' } }
  | { type: 'INTERPRET_SEARCH'; payload: { query: string } }
  | { type: 'STANDARDIZE_TAGS'; payload: { tags: string[] } }
  | { type: 'EXPLAIN_INGREDIENTS'; payload: { productName: string; ingredients: string[] } }
  | { type: 'HEALTH_CHECK' }
  | { type: 'PURGE_CACHE' };

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const msg = e.data;

  try {
    switch (msg.type) {
      case 'INIT':
        await initializeAI(msg.payload.hardwareTier);
        break;
      case 'EXTRACT':
        await extractData(msg.payload.text, msg.payload.url);
        break;
      case 'EMBED':
        await generateEmbedding(msg.payload.text);
        break;
      case 'ANALYZE':
        await analyzeText(msg.payload.query, msg.payload.context);
        break;
      case 'ANALYZE_CLINICAL':
        await analyzeClinical(msg.payload.product, msg.payload.candidates, msg.payload.type);
        break;
      case 'INTERPRET_SEARCH':
        await interpretSearch(msg.payload.query);
        break;
      case 'STANDARDIZE_TAGS':
        await standardizeTags(msg.payload.tags);
        break;
      case 'EXPLAIN_INGREDIENTS':
        await explainIngredients(msg.payload.productName, msg.payload.ingredients);
        break;
      case 'HEALTH_CHECK':
        await runHealthCheck();
        break;
      case 'PURGE_CACHE':
        await purgeCache();
        break;
    }
  } catch (error: any) {
    logger.error('[Worker] Fatal Error:', error);
    self.postMessage({ type: 'ERROR', error: error.message || String(error) });
  }
};

// ... (purgeCache and initializeAI remain same)

async function purgeCache() {
  try {

    // 1. Borrar Cache Storage específico de IA
    // Solo borramos las cachés relacionadas a nuestros modelos para no afectar la PWA
    if ('caches' in self) {
      const keys = await caches.keys();
      for (const key of keys) {
        if (key.includes('transformers') || key.includes('webllm') || key.includes('model')) {
          await caches.delete(key);
        }
      }
    }

    // 2. Borrar bases de datos IndexedDB específicas de IA
    try {
        if (self.indexedDB && self.indexedDB.databases) {
            const dbs = await self.indexedDB.databases();
            for (const db of dbs) {
                if (db.name) {
                    // Borrar DBs de Transformers.js, WebLLM y ONNX
                    if (db.name.includes('transformers') || 
                        db.name.includes('onnx') || 
                        db.name.includes('webllm') ||
                        db.name.includes('model') // Catch-all para modelos
                    ) {
                        const req = self.indexedDB.deleteDatabase(db.name);
                        req.onerror = () => logger.error(`[Worker] Error borrando DB ${db.name}`);
                    }
                }
            }
        }
    } catch (e) {
        logger.warn('[Worker] No se pudo listar/borrar IndexedDB:', e);
    }

    self.postMessage({ type: 'PURGE_COMPLETE', success: true });
  } catch (e: any) {
    self.postMessage({ type: 'PURGE_COMPLETE', success: false, error: e.message });
  }
}

async function initializeAI(tier: 'HIGH' | 'LOW' | 'NONE') {
  if (isInitializing || isReady) {
    self.postMessage({ type: 'INIT_COMPLETE', success: true, engine: getEngineName() });
    return;
  }

  isInitializing = true;
  let gpuSuccess = false;

  try {
    // 1. Intentar GPU (WebLLM) si el hardware es potente
    if (tier === 'HIGH') {
      try {
        self.postMessage({ type: 'PROGRESS', text: 'Iniciando WebLLM (GPU)...', progress: 10 });
        
        const modelId = 'Llama-3.2-1B-Instruct-q4f32_1-MLC';
        
        const initPromise = CreateMLCEngine(modelId, {
          initProgressCallback: (progress) => {
            self.postMessage({ 
              type: 'PROGRESS', 
              text: `Cargando GPU: ${progress.text}`, 
              progress: 10 + (progress.progress * 80) 
            });
          }
        });

        // Timeout de 60s para GPU
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('GPU Timeout')), 60000)
        );

        webLlmEngine = await Promise.race([initPromise, timeoutPromise]) as MLCEngine;
        gpuSuccess = true;
      } catch (e) {
        logger.warn('Fallo GPU, cayendo a CPU...', e);
        self.postMessage({ type: 'PROGRESS', text: 'GPU no disponible. Cambiando a CPU...', progress: 0 });
        webLlmEngine = null;
      }
    }

    // 2. Cargar Pipeline de Embeddings (Siempre necesario para RAG)
    self.postMessage({ type: 'PROGRESS', text: '[1/3] Cargando Motor Semántico (Embeddings)...', progress: 20 });
    embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

    // 3. Intentar CPU (Transformers.js)
    if (!gpuSuccess && (tier === 'LOW' || tier === 'HIGH')) {
      self.postMessage({ type: 'PROGRESS', text: '[2/3] Iniciando Motor de Inferencia (CPU)...', progress: 40 });

      // Suppress warnings
      const originalWarn = console.warn;
      console.warn = (...args) => {
        if (args[0] && typeof args[0] === 'string' && args[0].includes('content-length')) return;
        originalWarn.apply(console, args);
      };

      try {
        transformersPipeline = await pipeline('text-generation', 'Xenova/Qwen1.5-0.5B-Chat', {
          progress_callback: (progress: any) => {
            if (progress.status === 'progress') {
               const percent = (progress.total && progress.total > 0) 
                  ? (progress.loaded / progress.total) * 100 
                  : 0;
               self.postMessage({ 
                 type: 'PROGRESS', 
                 text: progress.file ? `[DESCARGA] ${progress.file} (${Math.round(percent)}%)` : 'Descargando archivos del modelo...', 
                 progress: 40 + (percent * 0.5) 
               });
            } else if (progress.status === 'init') {
               self.postMessage({ type: 'PROGRESS', text: '[INSTALACIÓN] Inicializando pesos del modelo...', progress: 90 });
            } else if (progress.status === 'ready') {
               self.postMessage({ type: 'PROGRESS', text: '[ACTIVACIÓN] Motor listo para inferencia.', progress: 95 });
            }
          }
        });
        
        isReady = true;
        self.postMessage({ type: 'INIT_COMPLETE', success: true, engine: getEngineName() });

      } catch (cpuError: any) {
        // AUTO-REPARACIÓN: Si detectamos corrupción, borramos caché y reintentamos
        if (cpuError.message && cpuError.message.includes('offset is out of bounds')) {
           logger.error('[Worker] Detectada corrupción de caché. Iniciando auto-reparación...');
           await purgeCache();
           throw new Error('CORRUPTED_CACHE_AUTO_FIXED: Se ha detectado un archivo dañado. La caché ha sido borrada. Por favor, recarga la página para descargar el modelo limpio.');
        }
        throw cpuError;
      } finally {
        console.warn = originalWarn;
      }
    } else if (gpuSuccess) {
      isReady = true;
      self.postMessage({ type: 'INIT_COMPLETE', success: true, engine: getEngineName() });
    } else {
      // Fallback final: Si el tier es NONE pero el hardware parece capaz, intentamos CPU
      if (tier === 'NONE') {
        logger.warn('[Worker] Tier NONE detectado, pero intentando fallback a CPU...');
        // Reutilizamos la lógica de tier LOW
        await initializeAI('LOW');
      } else {
        self.postMessage({ type: 'INIT_COMPLETE', success: false, error: 'Hardware no compatible para IA Local' });
      }
    }

  } catch (error: any) {
    logger.error('[Worker] Fatal Error during init:', error);
    let errorMessage = error.message || String(error);
    
    // Mejorar mensaje para errores de red comunes en dispositivos nuevos o corporativos
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('network error')) {
      errorMessage = 'ERROR_DESCARGA_MODELO: No se pueden descargar los archivos de IA de Hugging Face. Verifica tu conexión a internet o si el dominio huggingface.co está bloqueado en tu red/dispositivo.';
    }
    
    self.postMessage({ type: 'INIT_COMPLETE', success: false, error: errorMessage });
  } finally {
    isInitializing = false;
  }
}

async function extractData(text: string, url: string) {
  if (!isReady) throw new Error('IA no lista');

  const prompt = `Analiza el texto y extrae datos del medicamento en JSON.
Texto: ${text.substring(0, 1500)}

Responde SOLO con este JSON:
{
  "sku": "SKU o ID",
  "nombre_comercial": "Nombre",
  "descripcion": "Breve descripcion",
  "principios_activos": ["Principio 1", "Principio 2"],
  "posologia": "Dosis",
  "indicaciones": ["Indicacion 1"],
  "advertencias": "Advertencias",
  "tags_ia": ["tag1", "tag2"],
  "apto_embarazo": "SI/NO/PRECAUCION",
  "apto_lactancia": "SI/NO/PRECAUCION",
  "apto_pediatria": "SI/NO/PRECAUCION",
  "apto_diabeticos": "SI/NO/PRECAUCION",
  "apto_hipertensos": "SI/NO/PRECAUCION",
  "apto_celiacos": "SI/NO/PRECAUCION",
  "sugerencia_complementaria": "Consejo"
}`;

  let content = '';

  try {
    if (webLlmEngine) {
      const response = await webLlmEngine.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
      });
      content = response.choices[0].message.content || '{}';
    } else if (transformersPipeline) {
      const messages = [
        { role: 'system', content: 'Extract JSON from medicine text. Respond ONLY with JSON.' },
        { role: 'user', content: prompt }
      ];
      const promptText = transformersPipeline.tokenizer.apply_chat_template(messages, { tokenize: false, add_generation_prompt: true });
      const result = await transformersPipeline(promptText, { 
        max_new_tokens: 512, 
        temperature: 0.1,
        do_sample: false
      });
      const genText = result[0].generated_text;
      content = genText.split('<|im_start|>assistant\n')[1]?.trim() || genText;
    }

    self.postMessage({ type: 'EXTRACT_RESULT', payload: { content, url } });

  } catch (e: any) {
    self.postMessage({ type: 'ERROR', error: e.message });
  }
}

async function generateEmbedding(text: string) {
  if (!text) {
    self.postMessage({ type: 'EMBED_RESULT', payload: new Array(384).fill(0) });
    return;
  }
  if (!embeddingPipeline) throw new Error('Motor semántico no listo');
  
  try {
    const output = await embeddingPipeline(text, { pooling: 'mean', normalize: true });
    const embedding = Array.from(output.data as Float32Array);
    self.postMessage({ type: 'EMBED_RESULT', payload: embedding });
  } catch (e: any) {
    self.postMessage({ type: 'ERROR', error: e.message });
  }
}

async function analyzeText(query: string, context: string) {
    if (!isReady) throw new Error('IA no lista');

    const systemPrompt = `Eres el "Vademécum Sintomatológico Experto", un asistente médico farmacéutico de élite. 
Tu función principal es analizar los síntomas del usuario ("CONSULTA") y seleccionar LOS MEJORES productos del "CONTEXTO" para crear una "Mezcla Exacta" o "Receta Perfecta".

REGLAS:
1. No inventes medicamentos. SOLO recomienda productos que aparezcan en el CONTEXTO.
2. Comienza la respuesta con una sección llamada "### 🧪 Mezcla Exacta Recomendada".
3. Luego, enumera cada medicamento seleccionado y explica en 1 sola línea por qué alivia un síntoma específico.
4. Finaliza con una breve sección "### ⚠️ Sinergias y Precauciones" sobre la mezcla.
5. Lenguaje profesional, cálido y enfocado en medicina natural o integrativa si aplica.
6. NO des diagnósticos médicos determinantes, sugiere siempre que la mezcla es una recomendación complementaria.`;

    const userPrompt = `SÍNTOMAS/CONSULTA DEL PACIENTE:\n${query}\n\nMEDICAMENTOS DISPONIBLES EN INVENTARIO (CONTEXTO):\n${context}`;

    try {
        let reply = '';
        if (webLlmEngine) {
            const response = await webLlmEngine.chat.completions.create({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.2
            });
            reply = response.choices[0].message.content || '';
        } else if (transformersPipeline) {
            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ];
            const promptText = transformersPipeline.tokenizer.apply_chat_template(messages, { tokenize: false, add_generation_prompt: true });
            const result = await transformersPipeline(promptText, { max_new_tokens: 512, temperature: 0.2 });
            const genText = result[0].generated_text;
            reply = genText.split('<|im_start|>assistant\n')[1]?.trim() || genText;
        }
        
        self.postMessage({ type: 'ANALYZE_RESULT', payload: reply });

    } catch (e: any) {
        self.postMessage({ type: 'ERROR', error: e.message });
    }
}

// Helper para extraer JSON de forma robusta
const extractJsonBlocks = (text: string): string[] => {
    const results: string[] = [];
    // Intentar encontrar bloques delimitados por llaves (no codicioso)
    const matches = text.match(/\{[\s\S]*?\}/g);
    if (matches) results.push(...matches);
    
    // También intentar la búsqueda codiciosa por si acaso el JSON contiene llaves anidadas
    const greedyMatch = text.match(/\{[\s\S]*\}/);
    if (greedyMatch && !results.includes(greedyMatch[0])) {
        results.push(greedyMatch[0]);
    }
    
    return results;
};

// Helper para intentar parsear JSON con limpiezas progresivas
const tryParseJson = (jsonStr: string): any => {
    // Intentar parseo directo primero
    try {
        return JSON.parse(jsonStr);
    } catch (e) {}

    // Limpiezas progresivas
    let cleaned = jsonStr;
    
    try {
        // 1. Caracteres de control y espacios extraños
        cleaned = cleaned.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
        
        // 2. Comillas inteligentes/tipográficas
        cleaned = cleaned.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");
        
        // 3. Eliminar comentarios de estilo JS (// o /* */) que rompen JSON.parse
        cleaned = cleaned.replace(/\/\/.*$/gm, '');
        cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
        
        // 4. Reemplazar comillas simples por dobles (solo si parecen delimitar llaves o valores)
        // Esta es una heurística arriesgada pero útil para modelos pequeños
        let withDoubleQuotes = cleaned.replace(/'([^']*)'/g, '"$1"');
        try { return JSON.parse(withDoubleQuotes); } catch (e) {}

        // 4. Comas finales (trailing commas) en objetos y arreglos
        cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');
        try { return JSON.parse(cleaned); } catch (e) {}

        // 5. Saltos de línea literales dentro de strings
        cleaned = cleaned.replace(/\n/g, ' ').replace(/\r/g, ' ');
        try { return JSON.parse(cleaned); } catch (e) {}

        // 6. Intentar arreglar JSON truncado (cerrar llaves/corchetes faltantes)
        let openBraces = (cleaned.match(/\{/g) || []).length;
        let closeBraces = (cleaned.match(/\}/g) || []).length;
        if (openBraces > closeBraces) {
            cleaned += '}'.repeat(openBraces - closeBraces);
        }
        try { return JSON.parse(cleaned); } catch (e) {}

    } catch (err) {
        logger.warn('[Worker] Error en fase de limpieza JSON:', err);
    }

    return null;
};

// Heurística de último recurso para extraer datos básicos si el JSON falla totalmente
const lastResortClinicalParse = (text: string): any => {
    try {
        const sugerenciaMatch = text.match(/"sugerencia"\s*:\s*"([^"]*)"/i) || 
                               text.match(/sugerencia\s*[:=-]\s*([^,\n}]*)/i);
        const idsMatch = text.match(/"ids"\s*:\s*\[([^\]]*)\]/i) || 
                         text.match(/ids\s*[:=-]\s*\[([^\]]*)\]/i);
        
        if (sugerenciaMatch || idsMatch) {
            const sugerencia = sugerenciaMatch ? sugerenciaMatch[1].trim().replace(/^["']|["']$/g, '') : "Análisis clínico parcial";
            let ids: string[] = [];
            if (idsMatch) {
                ids = idsMatch[1].split(',').map(s => s.replace(/["'\s\[\]]/g, '')).filter(s => s.length > 0);
            }
            return { 
                sugerencia, 
                ids, 
                explicacion: "Nota: Los datos fueron recuperados mediante un motor de emergencia debido a un error de formato en la IA." 
            };
        }
    } catch (e) {}
    return null;
};

// Heurística de último recurso para extraer mapeos de etiquetas si el JSON falla
const lastResortTagsParse = (text: string): any => {
    try {
        const matches = text.matchAll(/"([^"]+)"\s*[:=-]\s*"([^"]+)"/g);
        const result: Record<string, string> = {};
        let found = false;
        for (const match of matches) {
            result[match[1]] = match[2];
            found = true;
        }
        return found ? result : null;
    } catch (e) {}
    return null;
};

interface ClinicalAnalysisResult {
    sugerencia: string;
    ids: string[];
    explicacion: string;
}

const validateClinicalAnalysis = (parsed: any): ClinicalAnalysisResult => {
    const result: ClinicalAnalysisResult = {
        sugerencia: 'No se encontraron relaciones',
        ids: [],
        explicacion: 'Sin detalles adicionales disponibles.'
    };

    if (parsed && typeof parsed === 'object') {
        if (typeof parsed.sugerencia === 'string') {
            result.sugerencia = parsed.sugerencia;
        } else if (typeof parsed.suggestion === 'string') {
            result.sugerencia = parsed.suggestion;
        }

        if (Array.isArray(parsed.ids)) {
            result.ids = parsed.ids.map((id: any) => String(id));
        } else if (Array.isArray(parsed.skus)) {
            result.ids = parsed.skus.map((id: any) => String(id));
        }

        if (typeof parsed.explicacion === 'string') {
            result.explicacion = parsed.explicacion;
        } else if (typeof parsed.explanation === 'string') {
            result.explicacion = parsed.explanation;
        }
    }

    return result;
};

const validateTagMapping = (parsed: any): Record<string, string> => {
    const result: Record<string, string> = {};
    if (parsed && typeof parsed === 'object') {
        const source = (parsed.tags && typeof parsed.tags === 'object') ? parsed.tags : parsed;
        for (const [key, val] of Object.entries(source)) {
            if (typeof val === 'string') {
                result[key] = val;
            }
        }
    }
    return result;
};

async function standardizeTags(tags: string[]) {
    if (!isReady) throw new Error('IA no lista');

    const prompt = `Actúa como un experto en taxonomía farmacéutica. 
Tu tarea es estandarizar esta lista de etiquetas clínicas.
REGLAS:
1. Unifica términos similares (ej: "dolor", "analgesia", "analgésico" -> "Analgésico").
2. Corrige ortografía y usa Capitalización de Título.
3. Devuelve ÚNICAMENTE un objeto JSON donde la llave es la etiqueta original y el valor es la etiqueta estandarizada.

LISTA DE ETIQUETAS:
${formatArray(tags)}`;

    try {
        let content = '';
        if (webLlmEngine) {
            const response = await webLlmEngine.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.1,
            });
            content = response.choices[0].message.content || '{}';
        } else if (transformersPipeline) {
            const messages = [
                { role: 'system', content: 'Standardize clinical tags. Respond ONLY with JSON mapping.' },
                { role: 'user', content: prompt }
            ];
            const promptText = transformersPipeline.tokenizer.apply_chat_template(messages, { tokenize: false, add_generation_prompt: true });
            const result = await transformersPipeline(promptText, { max_new_tokens: 1024, temperature: 0.1 });
            const genText = result[0].generated_text;
            content = genText.split('<|im_start|>assistant\n')[1]?.trim() || genText;
        }

        // Limpieza de JSON
        const jsonBlocks = extractJsonBlocks(content);
        let parsed = null;
        
        if (jsonBlocks.length > 0) {
            const sortedBlocks = jsonBlocks.sort((a, b) => b.length - a.length);
            for (const rawJson of sortedBlocks) {
                let cleanJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
                const attempt = tryParseJson(cleanJson);
                if (attempt && (attempt.tags || Array.isArray(attempt) || (typeof attempt === 'object' && Object.keys(attempt).length > 0))) {
                    parsed = attempt;
                    break;
                }
            }
        }

        if (!parsed) {
            parsed = lastResortTagsParse(content);
        }

        const validatedPayload = validateTagMapping(parsed);
        self.postMessage({ type: 'STANDARDIZE_TAGS_RESULT', payload: validatedPayload });
    } catch (e: any) {
        self.postMessage({ type: 'ERROR', error: e.message });
    }
}

async function analyzeClinical(product: any, candidates: any[], type: 'synergy' | 'alternatives') {
    if (!isReady) throw new Error('IA no lista');

    const isSynergy = type === 'synergy';
  const prompt = `Actúa como un farmacéutico experto. 
Analiza la relación entre el producto principal y los candidatos.

PRODUCTO PRINCIPAL:
- Nombre: ${product.nombre_comercial}
- Componentes: ${formatArray(product.principios_activos)}
- Indicaciones: ${formatArray(product.indicaciones)}

CANDIDATOS:
${candidates.map((c, i) => `${i+1}. ${c.nombre_comercial} (${formatArray(c.principios_activos)}) - Indicado para: ${formatArray(c.indicaciones)}`).join('\n')}

TAREA: ${isSynergy ? 'Identifica SINERGIAS (productos que complementan o potencian el efecto).' : 'Identifica ALTERNATIVAS (productos bioequivalentes o con el mismo uso terapéutico).'}

REGLAS:
1. Responde ÚNICAMENTE en formato JSON.
2. Estructura: { "sugerencia": "breve resumen", "ids": ["sku1", "sku2"], "explicacion": "detalle clínico" }
3. IMPORTANTE: El campo 'explicacion' debe ser DIRECTO y CONCISO. Ejemplo: "El [Producto A] y el [Producto B] son sinérgicos porque [motivo corto]". Sin introducciones ni verborrea.
4. Si no hay relación clara, devuelve un JSON vacío con sugerencia "No se encontraron relaciones".

Respuesta JSON:`;

    try {
        let content = '';
        if (webLlmEngine) {
            const response = await webLlmEngine.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.2,
            });
            content = response.choices[0].message.content || '{}';
        } else if (transformersPipeline) {
            const messages = [
                { role: 'system', content: 'You are a clinical pharmacist. Respond ONLY with JSON.' },
                { role: 'user', content: prompt }
            ];
            const promptText = transformersPipeline.tokenizer.apply_chat_template(messages, { tokenize: false, add_generation_prompt: true });
            const result = await transformersPipeline(promptText, { max_new_tokens: 1024, temperature: 0.2 });
            const genText = result[0].generated_text;
            content = genText.split('<|im_start|>assistant\n')[1]?.trim() || genText;
        }

        const jsonBlocks = extractJsonBlocks(content);
        let parsed = null;

        if (jsonBlocks.length > 0) {
            const sortedBlocks = jsonBlocks.sort((a, b) => b.length - a.length);
            for (const rawJson of sortedBlocks) {
                let cleanJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
                const attempt = tryParseJson(cleanJson);
                if (attempt && (attempt.sugerencia || attempt.ids)) {
                    parsed = attempt;
                    break;
                }
            }
        }

        // Si no se pudo parsear como JSON válido, intentar rescate heurístico
        if (!parsed || (!parsed.sugerencia && !parsed.ids)) {
            parsed = lastResortClinicalParse(content);
        }

        const validatedPayload = validateClinicalAnalysis(parsed);
        self.postMessage({ type: 'ANALYZE_CLINICAL_RESULT', payload: validatedPayload });
    } catch (e: any) {
        self.postMessage({ type: 'ERROR', error: e.message });
    }
}

async function interpretSearch(query: string) {
    if (!isReady) throw new Error('IA no lista');

    const prompt = `Analiza esta consulta de búsqueda farmacéutica para identificar la intención clínica.
CONSULTA: "${query}"

Tu tarea es extraer:
1. Síntomas o condiciones mencionadas.
2. Factores de riesgo o contraindicaciones implícitas (ej: si dice paciente hipertenso).
3. Una lógica clínica de búsqueda (ej: evitar descongestionantes sistémicos).
4. Sugerencia de filtros de seguridad.

REGLAS:
1. Responde ÚNICAMENTE en JSON.
2. Estructura: { 
    "isScenario": boolean, 
    "symptoms": string[], 
    "risks": string[], 
    "logic": "explicación breve",
    "suggestedFilters": { "avoid": string[], "prefer": string[] } 
}
3. isScenario debe ser true si el usuario describe un paciente o una situación clínica compleja.

Respuesta JSON:`;

    try {
        let content = '';
        if (webLlmEngine) {
            const response = await webLlmEngine.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.1,
            });
            content = response.choices[0].message.content || '{}';
        } else if (transformersPipeline) {
            const messages = [
                { role: 'system', content: 'You are a clinical reasoning engine. Respond ONLY with JSON.' },
                { role: 'user', content: prompt }
            ];
            const promptText = transformersPipeline.tokenizer.apply_chat_template(messages, { tokenize: false, add_generation_prompt: true });
            const result = await transformersPipeline(promptText, { max_new_tokens: 512, temperature: 0.1 });
            const genText = result[0].generated_text;
            content = genText.split('<|im_start|>assistant\n')[1]?.trim() || genText;
        }

        const jsonBlocks = extractJsonBlocks(content);
        let parsed = null;

        if (jsonBlocks.length > 0) {
            const rawJson = jsonBlocks[0].replace(/```json/g, '').replace(/```/g, '').trim();
            parsed = tryParseJson(rawJson);
        }

        if (parsed) {
            // Asegurar estructura completa y valores seguros
            const safePayload = {
                isScenario: !!parsed.isScenario,
                symptoms: Array.isArray(parsed.symptoms) ? parsed.symptoms : [],
                risks: Array.isArray(parsed.risks) ? parsed.risks : [],
                logic: typeof parsed.logic === 'string' ? parsed.logic : '',
                suggestedFilters: {
                    avoid: Array.isArray(parsed.suggestedFilters?.avoid) ? parsed.suggestedFilters.avoid : [],
                    prefer: Array.isArray(parsed.suggestedFilters?.prefer) ? parsed.suggestedFilters.prefer : []
                }
            };
            self.postMessage({ type: 'INTERPRET_SEARCH_RESULT', payload: safePayload });
        } else {
            self.postMessage({ 
                type: 'INTERPRET_SEARCH_RESULT', 
                payload: { isScenario: false, symptoms: [], risks: [], logic: '', suggestedFilters: { avoid: [], prefer: [] } } 
            });
        }
    } catch (e: any) {
        self.postMessage({ 
            type: 'INTERPRET_SEARCH_RESULT', 
            payload: { isScenario: false, symptoms: [], risks: [], logic: '', suggestedFilters: { avoid: [], prefer: [] }, error: e.message } 
        });
    }
}

// Helper para formateo seguro de arrays en el worker
function formatArray(arr: any[] | undefined | null, separator: string = ', '): string {
    if (!Array.isArray(arr)) return '';
    return arr.join(separator);
}

async function explainIngredients(productName: string, ingredients: string[]) {
    if (!isReady) throw new Error('IA no lista');

    const prompt = `Actúa como un Farmacéutico Clínico experto en educación al paciente.
Para el producto "${productName}", explica de forma muy sencilla la función de estos principios activos:
${ingredients.join(', ')}

REGLAS:
1. Lenguaje MUY simple para un paciente (ej. "ayuda a bajar la fiebre" en lugar de "antipirético").
2. Sé breve (máximo 2 frases por ingrediente).
3. Identifica cuál es el Principio Activo principal decorado con "(PA)" al final de la definición.
4. Responde ÚNICAMENTE un objeto JSON donde la llave es el ingrediente y el valor es la explicación.

Respuesta JSON:`;

    try {
        let content = '';
        if (webLlmEngine) {
            const response = await webLlmEngine.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.2,
            });
            content = response.choices[0].message.content || '{}';
        } else if (transformersPipeline) {
            const messages = [
                { role: 'system', content: 'You are a clinical pharmacist. Respond ONLY with JSON.' },
                { role: 'user', content: prompt }
            ];
            const promptText = transformersPipeline.tokenizer.apply_chat_template(messages, { tokenize: false, add_generation_prompt: true });
            const result = await transformersPipeline(promptText, { max_new_tokens: 1024, temperature: 0.2 });
            const genText = result[0].generated_text;
            content = genText.split('<|im_start|>assistant\n')[1]?.trim() || genText;
        }

        const jsonBlocks = extractJsonBlocks(content);
        let parsed = null;

        if (jsonBlocks.length > 0) {
            const rawJson = jsonBlocks[0].replace(/```json/g, '').replace(/```/g, '').trim();
            parsed = tryParseJson(rawJson);
        }

        if (!parsed) {
            parsed = lastResortTagsParse(content); // Reutilizar el de tags que busca "llave": "valor"
        }

        self.postMessage({ type: 'EXPLAIN_INGREDIENTS_RESULT', payload: parsed || {} });

    } catch (e: any) {
        self.postMessage({ type: 'ERROR', error: e.message });
    }
}

async function runHealthCheck() {
    if (!isReady) {
        self.postMessage({ type: 'HEALTH_CHECK_RESULT', ok: false, error: 'IA no inicializada' });
        return;
    }

    try {
        const start = performance.now();
        let response = '';
        let engineName = getEngineName();

        if (webLlmEngine) {
            const reply = await webLlmEngine.chat.completions.create({
                messages: [{ role: 'user', content: 'Responde solo con: FUNCIONAL' }],
                temperature: 0.1,
                max_tokens: 10
            });
            response = reply.choices[0].message.content || '';
        } else if (transformersPipeline) {
            const messages = [{ role: 'user', content: 'Di la palabra: FUNCIONAL' }];
            const prompt = transformersPipeline.tokenizer.apply_chat_template(messages, { tokenize: false, add_generation_prompt: true });
            const output = await transformersPipeline(prompt, { 
                max_new_tokens: 10, 
                do_sample: false,
                temperature: 0.1
            });
            const text = output[0].generated_text;
            response = text.split('<|im_start|>assistant\n')[1]?.trim() || text;
        }

        const duration = Math.round(performance.now() - start);
        
        if (response.length > 0) {
            self.postMessage({ 
                type: 'HEALTH_CHECK_RESULT', 
                ok: true, 
                engine: `${engineName} - Latencia: ${duration}ms`, 
                response 
            });
        } else {
            self.postMessage({ type: 'HEALTH_CHECK_RESULT', ok: false, error: 'Sin respuesta' });
        }

    } catch (e: any) {
        self.postMessage({ type: 'HEALTH_CHECK_RESULT', ok: false, error: e.message });
    }
}

function getEngineName() {
    if (webLlmEngine) return 'WebLLM (GPU)';
    if (transformersPipeline) return 'Transformers.js (CPU)';
    return 'Ninguno';
}
