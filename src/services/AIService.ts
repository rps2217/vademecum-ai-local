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
      if (hardware.aiModelTier === 'HIGH') {
        this.initProgressCallback?.('Iniciando WebLLM (GPU)...', 0);
        
        // Usamos un modelo cuantizado pequeño para la demostración (Llama-3-8B es muy pesado para un iframe)
        // En producción se usaría 'Llama-3-8B-Instruct-q4f32_1-MLC'
        this.webLlmEngine = await CreateMLCEngine('Llama-3-8B-Instruct-q4f16_1-MLC', {
          initProgressCallback: (progress) => {
            this.initProgressCallback?.(`Cargando modelo GPU: ${progress.text}`, progress.progress * 100);
          }
        });
        this.isReady = true;
        this.initProgressCallback?.('WebLLM Listo', 100);

      } else if (hardware.aiModelTier === 'LOW') {
        this.initProgressCallback?.('Iniciando Transformers.js (CPU)...', 0);
        
        // Modelo ligero para CPU
        this.transformersPipeline = await pipeline('text-generation', 'Xenova/TinyLlama-1.1B-Chat-v1.0', {
          progress_callback: (progress: any) => {
            if (progress.status === 'progress') {
              this.initProgressCallback?.(`Cargando modelo CPU: ${progress.file}`, (progress.loaded / progress.total) * 100);
            }
          }
        });
        this.isReady = true;
        this.initProgressCallback?.('Transformers.js Listo', 100);
      } else {
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
    if (!this.webLlmEngine) {
      console.warn('[AIService] WebLLM no está inicializado. No se puede extraer datos en este dispositivo.');
      return null;
    }

    const prompt = `Analiza el siguiente texto extraído de la ficha técnica de un medicamento y devuelve ÚNICAMENTE un objeto JSON válido con esta estructura exacta:
{
  "sku": "string (ej: MED-001)",
  "nombre_comercial": "string",
  "descripcion": "string (resumen breve)",
  "principios_activos": ["string"],
  "posologia": "string",
  "indicaciones": ["string"],
  "advertencias": "string",
  "tags_ia": ["string (5 palabras clave)"],
  "apto_embarazo": "SI" o "NO" o "PRECAUCION",
  "apto_lactancia": "SI" o "NO" o "PRECAUCION",
  "apto_pediatria": "SI" o "NO" o "PRECAUCION",
  "apto_diabeticos": "SI" o "NO" o "PRECAUCION",
  "apto_hipertensos": "SI" o "NO" o "PRECAUCION",
  "apto_celiacos": "SI" o "NO" o "PRECAUCION",
  "sugerencia_complementaria": "string (consejo breve)"
}

Reglas:
- Devuelve SOLO el JSON, sin bloques de código markdown (\`\`\`).
- Si no encuentras un dato, usa "No especificado" o un array vacío.
- Para los campos "apto_*", usa estrictamente "SI", "NO" o "PRECAUCION".

Texto a analizar:
${rawText.substring(0, 2500)}
`;

    try {
      const response = await this.webLlmEngine.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1, // Baja temperatura para JSON determinista
      });

      let content = response.choices[0].message.content || '{}';
      // Limpiar markdown residual si el modelo lo incluye por error
      content = content.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const data = JSON.parse(content);
      
      // Asegurar campos requeridos
      data.vectores = [];
      data.skus_relacionados = [];
      
      return data as Product;
    } catch (e) {
      console.error('[AIService] Error estructurando producto:', e);
      return null;
    }
  }

  static async analyze(query: string, products: Product[]): Promise<string> {
    const context = products.map(p => 
      `Medicamento: ${p.nombre_comercial}\n` +
      `Principios Activos: ${p.principios_activos.join(', ')}\n` +
      `Indicaciones: ${p.indicaciones.join(', ')}\n` +
      `Advertencias: ${p.advertencias}\n` +
      `Sugerencia: ${p.sugerencia_complementaria}`
    ).join('\n\n---\n\n');

    const systemPrompt = "Eres un asistente farmacéutico experto. Responde a la consulta basándote ESTRICTAMENTE en la información proporcionada de los medicamentos. Si hay múltiples medicamentos, presta especial atención a posibles interacciones, duplicidad terapéutica o contraindicaciones cruzadas. Sé conciso y profesional.";
    const userPrompt = `Contexto de los medicamentos:\n${context}\n\nConsulta del farmacéutico: ${query}`;

    try {
      if (this.webLlmEngine) {
        const reply = await this.webLlmEngine.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.2,
        });
        return reply.choices[0].message.content || 'No se pudo generar una respuesta.';
      }

      if (this.transformersPipeline) {
        const messages = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ];
        const text = this.transformersPipeline.tokenizer.apply_chat_template(messages, { tokenize: false, add_generation_prompt: true });
        const result = await this.transformersPipeline(text, { max_new_tokens: 256, temperature: 0.2 });
        
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
    
    // Generar una respuesta simulada inteligente basada en el contexto
    const productNames = products.map(p => p.nombre_comercial).join(' y ');
    const warnings = products.map(p => p.advertencias).join(' Además, ');
    
    return `[Modo Simulación - IA Local Offline]\n\nHe analizado la consulta sobre ${productNames}.\n\nBasado en el vademécum:\n- Tenga en cuenta las siguientes advertencias: ${warnings}.\n- Asegúrese de revisar las contraindicaciones específicas para el paciente antes de la dispensación.`;
  }

  static getStatus() {
    return {
      isReady: this.isReady,
      isInitializing: this.isInitializing,
      engine: this.webLlmEngine ? 'WebLLM' : this.transformersPipeline ? 'Transformers.js' : 'Simulación'
    };
  }
}
