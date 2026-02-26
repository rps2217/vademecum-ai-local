import { CreateMLCEngine, MLCEngine } from '@mlc-ai/web-llm';
import { pipeline, env } from '@xenova/transformers';
import { HardwareProfile } from '../core/types/hardware.types';
import { Product } from '../core/types/product.types';

// Deshabilitar la búsqueda de modelos locales en el sistema de archivos
env.allowLocalModels = false;

export class AIService {
  private static webLlmEngine: MLCEngine | null = null;
  private static transformersPipeline: any = null;
  private static isInitializing = false;
  private static isReady = false;
  private static initProgressCallback: ((text: string, progress: number) => void) | null = null;

  static setProgressCallback(cb: (text: string, progress: number) => void) {
    this.initProgressCallback = cb;
  }

  static async initialize(hardware: HardwareProfile) {
    if (this.isInitializing || this.isReady) return;
    this.isInitializing = true;

    try {
      let gpuSuccess = false;

      if (hardware.aiModelTier === 'HIGH') {
        try {
          this.initProgressCallback?.('Iniciando WebLLM (GPU)...', 0);
          
          // Usamos la versión q4f32_1 que es más compatible (no requiere extensión f16)
          // aunque consume un poco más de memoria, funciona en más dispositivos.
          const modelId = 'Llama-3.2-1B-Instruct-q4f32_1-MLC';
          
          // Race condition: si la GPU tarda demasiado (ej. compilando shaders), forzamos fallback
          const initPromise = CreateMLCEngine(modelId, {
            initProgressCallback: (progress) => {
              this.initProgressCallback?.(`Cargando modelo GPU: ${progress.text}`, progress.progress * 100);
            }
          });

          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('GPU Initialization Timeout')), 30000)
          );

          this.webLlmEngine = await Promise.race([initPromise, timeoutPromise]) as MLCEngine;
          
          this.isReady = true;
          gpuSuccess = true;
          this.initProgressCallback?.('WebLLM Listo', 100);
        } catch (gpuError) {
          console.warn('Error iniciando WebLLM (GPU). Intentando fallback a CPU...', gpuError);
          this.initProgressCallback?.('GPU no compatible. Cambiando a modo CPU...', 0);
          
          // Limpiar cualquier referencia residual
          this.webLlmEngine = null;
          
          // Esperar 2 segundos para que el navegador se recupere del posible crash de contexto WebGL/GPU
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      // Si no era HIGH o si falló la inicialización de GPU (gpuSuccess false), intentamos CPU
      if (!gpuSuccess && (hardware.aiModelTier === 'LOW' || hardware.aiModelTier === 'HIGH')) {
        this.initProgressCallback?.('Iniciando Transformers.js (CPU)...', 0);
        
        // Supprimir advertencias de content-length del CDN de HuggingFace para mantener la consola limpia
        const originalWarn = console.warn;
        console.warn = (...args) => {
          if (args[0] && typeof args[0] === 'string' && args[0].includes('content-length')) return;
          originalWarn.apply(console, args);
        };

        try {
          // Modelo ligero para CPU
          this.transformersPipeline = await pipeline('text-generation', 'Xenova/TinyLlama-1.1B-Chat-v1.0', {
            progress_callback: (progress: any) => {
              if (progress.status === 'progress') {
                // Evitar NaN si el servidor no envía content-length (común en algunos entornos)
                const percent = (progress.total && progress.total > 0) 
                  ? (progress.loaded / progress.total) * 100 
                  : 0;
                
                const text = progress.total 
                  ? `Cargando modelo CPU: ${progress.file}` 
                  : `Descargando recursos CPU: ${progress.file}...`;

                this.initProgressCallback?.(text, percent);
              }
            }
          });
        } finally {
          console.warn = originalWarn;
        }
        
        this.isReady = true;
        this.initProgressCallback?.('Transformers.js Listo', 100);
      } else if (!gpuSuccess && hardware.aiModelTier === 'NONE') {
        this.initProgressCallback?.('Hardware no compatible con IA Local. Usando modo Simulación.', 100);
      }
    } catch (error) {
      console.warn('Error inicializando IA local. Cayendo a modo simulación:', error);
      this.initProgressCallback?.('Error al cargar IA local. Usando modo Simulación.', 100);
    } finally {
      this.isInitializing = false;
    }
  }

  static async extractProductData(rawText: string, url: string): Promise<Product | null> {
    if (!this.webLlmEngine && !this.transformersPipeline) {
      console.warn('[AIService] Motor de IA no inicializado.');
      return null;
    }

    const prompt = `Analiza el texto y extrae datos del medicamento en JSON.
Texto: ${rawText.substring(0, 1500)}

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

    try {
      let content = '';

      if (this.webLlmEngine) {
        const response = await this.webLlmEngine.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
        });
        content = response.choices[0].message.content || '{}';
      } else if (this.transformersPipeline) {
        // Modo CPU (TinyLlama) - Prompt optimizado con one-shot learning
        const messages = [
          { role: 'system', content: 'Tu tarea es extraer datos de medicamentos en formato JSON. No expliques nada, solo JSON.' },
          { role: 'user', content: `Texto: "Producto: Ibuprofeno 400mg. Indicación: Dolor e inflamación."
JSON:
{
  "sku": "IBU-400",
  "nombre_comercial": "Ibuprofeno",
  "descripcion": "Antiinflamatorio no esteroideo",
  "principios_activos": ["Ibuprofeno"],
  "posologia": "1 comprimido cada 8 horas",
  "indicaciones": ["Dolor", "Inflamación"],
  "advertencias": "Tomar con alimentos",
  "tags_ia": ["dolor", "inflamacion"],
  "apto_embarazo": "NO",
  "apto_lactancia": "PRECAUCION",
  "apto_pediatria": "SI",
  "apto_diabeticos": "SI",
  "apto_hipertensos": "PRECAUCION",
  "apto_celiacos": "SI",
  "sugerencia_complementaria": "No exceder dosis"
}

Texto: "${rawText.substring(0, 800)}"
JSON:` }
        ];

        const promptText = this.transformersPipeline.tokenizer.apply_chat_template(messages, { tokenize: false, add_generation_prompt: true });
        const result = await this.transformersPipeline(promptText, { 
          max_new_tokens: 400, 
          temperature: 0.1,
          do_sample: false,
          top_k: 1
        });
        
        const generatedText = result[0].generated_text;
        content = generatedText.split('<|assistant|>')[1]?.trim() || generatedText;
      }

      // Limpieza agresiva para encontrar el JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        content = jsonMatch[0];
      } else {
        // Fallback de emergencia si no hay JSON: Intentar construir algo básico con Regex
        console.warn('[AIService] Falló la generación de JSON puro. Intentando recuperación heurística.');
        const nombreMatch = rawText.match(/Producto:\s*([^.]+)/i) || rawText.match(/Nombre:\s*([^.]+)/i);
        if (nombreMatch) {
            content = JSON.stringify({
                sku: "REC-" + Date.now().toString().slice(-4),
                nombre_comercial: nombreMatch[1].trim(),
                principios_activos: [],
                indicaciones: [],
                advertencias: "Datos extraídos parcialmente",
                tags_ia: [],
                apto_embarazo: "PRECAUCION",
                apto_lactancia: "PRECAUCION",
                apto_pediatria: "PRECAUCION",
                apto_diabeticos: "PRECAUCION",
                apto_hipertensos: "PRECAUCION",
                apto_celiacos: "PRECAUCION",
                sugerencia_complementaria: ""
            });
        }
      }

      // Limpiar markdown residual
      content = content.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const data = JSON.parse(content);
      
      // Asegurar campos requeridos y valores por defecto
      data.vectores = [];
      data.skus_relacionados = [];
      data.source_url = url;
      
      return data as Product;
    } catch (e) {
      console.error('[AIService] Error estructurando producto:', e);
      return null;
    }
  }

  static async analyze(query: string, products: Product[]): Promise<string> {
    const context = products.map(p => 
      `MEDICAMENTO: ${p.nombre_comercial}\n` +
      `- Principios Activos: ${p.principios_activos.join(', ')}\n` +
      `- Indicaciones: ${p.indicaciones.join(', ')}\n` +
      `- Advertencias y Contraindicaciones: ${p.advertencias}\n` +
      `- Sugerencia Complementaria: ${p.sugerencia_complementaria}`
    ).join('\n\n');

    const isPolypharmacy = products.length > 1;

    const systemPrompt = `Eres un Farmacéutico Clínico Experto. Tu tarea es analizar la información proporcionada y responder a la consulta del usuario.
    
REGLAS ESTRICTAS:
1. Basa tu análisis ÚNICAMENTE en los medicamentos proporcionados en el contexto. No inventes interacciones que no estén documentadas o no se deriven lógicamente de los principios activos.
2. Si hay múltiples medicamentos (polifarmacia), tu prioridad absoluta es identificar:
   - Interacciones farmacológicas (ej. inhibición enzimática, sinergia tóxica).
   - Duplicidad terapéutica (ej. dos medicamentos para el mismo síntoma).
   - Contraindicaciones cruzadas.
3. Utiliza un tono profesional, directo y clínico.
4. Formatea tu respuesta usando Markdown para facilitar la lectura rápida.

ESTRUCTURA OBLIGATORIA DE TU RESPUESTA (Usa estos encabezados exactos si aplica):
${isPolypharmacy ? `
### 🔴 Alertas Críticas
(Interacciones graves o contraindicaciones absolutas. Si no hay, escribe "No se detectaron alertas críticas evidentes".)

### 🟡 Precauciones y Duplicidades
(Interacciones moderadas, duplicidad de efectos, o ajustes sugeridos.)

### 🟢 Perfil de Seguridad
(Aspectos seguros o sinergias positivas.)
` : ''}
### 📝 Recomendación Clínica
(Respuesta directa a la consulta del usuario y consejos de dispensación/toma para el paciente.)`;

    const userPrompt = `CONTEXTO DE LOS MEDICAMENTOS:\n${context}\n\nCONSULTA DEL USUARIO: ${query}`;

    try {
      if (this.webLlmEngine) {
        const reply = await this.webLlmEngine.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.2, // Baja temperatura para respuestas clínicas precisas
        });
        return reply.choices[0].message.content || 'No se pudo generar una respuesta.';
      }

      if (this.transformersPipeline) {
        const messages = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ];
        const text = this.transformersPipeline.tokenizer.apply_chat_template(messages, { tokenize: false, add_generation_prompt: true });
        const result = await this.transformersPipeline(text, { max_new_tokens: 512, temperature: 0.2 });
        
        // Extraer solo la respuesta del asistente
        const generatedText = result[0].generated_text;
        const assistantReply = generatedText.split('<|assistant|>')[1]?.trim() || generatedText;
        return assistantReply;
      }
    } catch (error) {
      console.error('Error durante la inferencia:', error);
    }

    // Fallback / Mock si falla la carga o no hay hardware soportado
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const productNames = products.map(p => p.nombre_comercial).join(' y ');
    return `### 🔴 Alertas Críticas\n[Modo Simulación] No se puede garantizar un análisis preciso sin el motor de IA local.\n\n### 📝 Recomendación Clínica\nHe recibido la consulta sobre **${productNames}**. Por favor, revise manualmente las advertencias de cada prospecto antes de la dispensación.`;
  }

  static getStatus() {
    return {
      isReady: this.isReady,
      isInitializing: this.isInitializing,
      engine: this.webLlmEngine ? 'WebLLM' : this.transformersPipeline ? 'Transformers.js' : 'Simulación'
    };
  }
}
