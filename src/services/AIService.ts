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
        
        // Usamos Llama 3.2 1B, que es ultra ligero (~1GB VRAM) y evita el error GPUDeviceLost (OOM)
        this.webLlmEngine = await CreateMLCEngine('Llama-3.2-1B-Instruct-q4f16_1-MLC', {
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
