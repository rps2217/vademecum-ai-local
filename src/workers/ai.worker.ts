import { CreateMLCEngine, MLCEngine } from '@mlc-ai/web-llm';
import { pipeline, env } from '@xenova/transformers';

// Configuración de entorno para Transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

// Estado del Worker
let webLlmEngine: MLCEngine | null = null;
let transformersPipeline: any = null;
let isInitializing = false;
let isReady = false;

// Tipos de mensajes
type WorkerMessage = 
  | { type: 'INIT'; payload: { hardwareTier: 'HIGH' | 'LOW' | 'NONE' } }
  | { type: 'EXTRACT'; payload: { text: string; url: string } }
  | { type: 'ANALYZE'; payload: { query: string; context: string } }
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
      case 'ANALYZE':
        await analyzeText(msg.payload.query, msg.payload.context);
        break;
      case 'HEALTH_CHECK':
        await runHealthCheck();
        break;
      case 'PURGE_CACHE':
        await purgeCache();
        break;
    }
  } catch (error: any) {
    self.postMessage({ type: 'ERROR', error: error.message || String(error) });
  }
};

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
        isReady = true;
        self.postMessage({ type: 'INIT_COMPLETE', success: true, engine: 'WebLLM (GPU)' });
        return;

      } catch (e) {
        console.warn('Fallo GPU, cayendo a CPU...', e);
        self.postMessage({ type: 'PROGRESS', text: 'GPU no disponible. Cambiando a CPU...', progress: 0 });
        webLlmEngine = null;
      }
    }

    // 2. Intentar CPU (Transformers.js)
    if (!gpuSuccess && (tier === 'LOW' || tier === 'HIGH')) {
      self.postMessage({ type: 'PROGRESS', text: 'Iniciando Transformers.js (CPU)...', progress: 10 });

      // Suppress warnings
      const originalWarn = console.warn;
      console.warn = (...args) => {
        if (args[0] && typeof args[0] === 'string' && args[0].includes('content-length')) return;
        originalWarn.apply(console, args);
      };

      try {
        // CAMBIO: Usamos un modelo más ligero y estable (LaMini-Flan-T5) en lugar de TinyLlama
        // Esto reduce drásticamente la probabilidad de corrupción de memoria
        transformersPipeline = await pipeline('text2text-generation', 'Xenova/LaMini-Flan-T5-248M', {
          progress_callback: (progress: any) => {
            if (progress.status === 'progress') {
               const percent = (progress.total && progress.total > 0) 
                  ? (progress.loaded / progress.total) * 100 
                  : 0;
               self.postMessage({ 
                 type: 'PROGRESS', 
                 text: progress.file ? `Descargando modelo ligero: ${progress.file}` : 'Descargando...', 
                 progress: percent 
               });
            }
          }
        });
        
        isReady = true;
        self.postMessage({ type: 'INIT_COMPLETE', success: true, engine: 'Transformers.js (CPU - Lite)' });

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
    } else {
      // Tier NONE o fallo total
      self.postMessage({ type: 'INIT_COMPLETE', success: false, error: 'Hardware no compatible' });
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
      const promptText = `Extract JSON from text: ${prompt}`;
      const result = await transformersPipeline(promptText, { 
        max_new_tokens: 512, 
        temperature: 0.1,
        do_sample: false
      });
      content = result[0].generated_text;
    }

    self.postMessage({ type: 'EXTRACT_RESULT', payload: { content, url } });

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
            const promptText = `Analyze clinical context: ${userPrompt}`;
            const result = await transformersPipeline(promptText, { max_new_tokens: 512, temperature: 0.2 });
            reply = result[0].generated_text;
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
            const messages = [{ role: 'user', content: 'Di "FUNCIONAL"' }];
            const prompt = transformersPipeline.tokenizer.apply_chat_template(messages, { tokenize: false, add_generation_prompt: true });
            const output = await transformersPipeline(prompt, { max_new_tokens: 10, do_sample: false });
            const text = output[0].generated_text;
            response = text.split('<|assistant|>')[1]?.trim() || text;
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
