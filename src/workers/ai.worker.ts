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
  | { type: 'NORMALIZE_TAG'; payload: { tag: string } }
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
      case 'NORMALIZE_TAG':
        await normalizeTag(msg.payload.tag);
        break;
      case 'HEALTH_CHECK':
        await runHealthCheck();
        break;
      case 'PURGE_CACHE':
        await purgeCache();
        break;
    }
  } catch (error: any) {
    console.error('[Worker] Fatal Error:', error);
    self.postMessage({ type: 'ERROR', error: error.message || String(error) });
  }
};

// ... (purgeCache and initializeAI remain same)

async function normalizeTag(tag: string) {
  if (!isReady) throw new Error('IA no lista');

  const prompt = `Estandariza esta etiqueta de producto. 
  REGLAS:
  1. NO uses sinónimos complejos.
  2. Mantén el término más reconocible.
  3. Solo corrige ortografía, plurales y capitalización.
  Etiqueta: "${tag}"
  Respuesta (solo la etiqueta):`;

  try {
    let normalized = tag;
    if (webLlmEngine) {
      const response = await webLlmEngine.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 10
      });
      normalized = response.choices[0].message.content || tag;
    } else if (transformersPipeline) {
      const result = await transformersPipeline(prompt, { max_new_tokens: 10, temperature: 0.1 });
      normalized = result[0].generated_text.replace(prompt, '').trim();
    }
    
    self.postMessage({ type: 'NORMALIZE_TAG_RESULT', payload: normalized.replace(/[".]/g, '') });
  } catch (e: any) {
    self.postMessage({ type: 'ERROR', error: e.message });
  }
}

async function purgeCache() {
  try {
    console.log('[Worker] Iniciando purga completa de caché...');

    // 1. Borrar TODO el Cache Storage (Nuclear option)
    // Esto es necesario porque los nombres de caché pueden variar o estar corruptos
    if ('caches' in self) {
      const keys = await caches.keys();
      for (const key of keys) {
        console.log(`[Worker] Borrando caché: ${key}`);
        await caches.delete(key);
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
                        console.log(`[Worker] Borrando DB: ${db.name}`);
                        const req = self.indexedDB.deleteDatabase(db.name);
                        req.onsuccess = () => console.log(`[Worker] DB ${db.name} borrada.`);
                        req.onerror = () => console.error(`[Worker] Error borrando DB ${db.name}`);
                    }
                }
            }
        }
    } catch (e) {
        console.warn('[Worker] No se pudo listar/borrar IndexedDB:', e);
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
        console.warn('Fallo GPU, cayendo a CPU...', e);
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
           console.error('[Worker] Detectada corrupción de caché. Iniciando auto-reparación...');
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
        console.warn('[Worker] Tier NONE detectado, pero intentando fallback a CPU...');
        // Reutilizamos la lógica de tier LOW
        await initializeAI('LOW');
      } else {
        self.postMessage({ type: 'INIT_COMPLETE', success: false, error: 'Hardware no compatible para IA Local' });
      }
    }

  } catch (error: any) {
    self.postMessage({ type: 'INIT_COMPLETE', success: false, error: error.message });
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

    const systemPrompt = `Eres un Farmacéutico Clínico Experto. Analiza la información y responde.
REGLAS:
1. Basa tu análisis ÚNICAMENTE en los medicamentos proporcionados.
2. Identifica interacciones y duplicidades.
3. Sé profesional y directo.`;

    const userPrompt = `CONTEXTO:\n${context}\n\nCONSULTA: ${query}`;

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
