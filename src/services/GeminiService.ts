import { GoogleGenAI, Type } from "@google/genai";
import { Product, SafetyStatus } from "../core/types/product.types";
import { formatArrayToString } from "../utils/formatters";

export class GeminiService {
  private static ai: GoogleGenAI | null = null;

  private static getAI() {
    if (!this.ai) {
      // Intentar usar el nuevo secreto primero, si no, el original
      const myKey = process.env.MY_GEMINI_API_KEY || (import.meta.env && (import.meta.env as any).VITE_MY_GEMINI_API_KEY);
      const originalKey = process.env.GEMINI_API_KEY || (import.meta.env && (import.meta.env as any).VITE_GEMINI_API_KEY);
      
      const apiKey = apiKeyFromEnv(myKey) || apiKeyFromEnv(originalKey);
      
      if (!apiKey) {
        throw new Error(`GEMINI_API_KEY no configurada. Por favor, ve a Configuración (icono de engranaje) y pega tu clave de Google AI Studio en el campo GEMINI_API_KEY.`);
      }
      
      this.ai = new GoogleGenAI({ apiKey });
    }
    return this.ai;
  }

  private static cleanAndParseJSON(text: string): any {
    try {
      // Limpieza básica de caracteres de control
      const cleanText = text.replace(/[\u0000-\u001F\u007F-\u009F]/g, (match) => {
        if (match === '\n') return '\\n';
        if (match === '\r') return '\\r';
        if (match === '\t') return '\\t';
        return '';
      });
      return JSON.parse(cleanText);
    } catch (e) {
      // Intento de extracción de bloque JSON
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          let cleanMatch = match[0].replace(/[\u0000-\u001F\u007F-\u009F]/g, (match) => {
            if (match === '\n') return '\\n';
            if (match === '\r') return '\\r';
            if (match === '\t') return '\\t';
            return '';
          });
          
          // Limpiezas adicionales para modelos menos precisos
          cleanMatch = cleanMatch.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");
          cleanMatch = cleanMatch.replace(/,\s*([\]}])/g, '$1');
          
          return JSON.parse(cleanMatch);
        } catch (e2) {
          console.error("[GeminiService] Error en segundo intento de parseo:", e2);
        }
      }
      throw new Error("No se pudo extraer JSON válido de la respuesta.");
    }
  }

  private static async withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        // Si el error es de cuota (429) o sobrecarga (503), reintentar con backoff
        const isQuotaError = error.message?.includes('429') || error.status === 'RESOURCE_EXHAUSTED' || error.message?.includes('quota');
        const isOverloaded = error.message?.includes('503') || error.status === 'SERVICE_UNAVAILABLE';
        const isNetworkError = error.status === 'UNKNOWN' || error.message?.includes('xhr error') || error.message?.includes('fetch');
        
        if ((isQuotaError || isOverloaded || isNetworkError) && i < maxRetries - 1) {
          const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
          console.warn(`[GeminiService] Error de red, cuota o sobrecarga. Reintentando en ${Math.round(delay)}ms... (Intento ${i + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
    throw lastError;
  }

  static async searchAndExtractProduct(productName: string, targetUrl?: string): Promise<Product | null> {
    return this.withRetry(async () => {
      try {
        const ai = this.getAI();
        
        const prompt = `Busca información detallada sobre el producto farmacéutico: "${productName}".
        ${targetUrl ? `Enfócate en la información de este sitio si es posible: ${targetUrl}` : ''}
        
        Necesito extraer: SKU, nombre comercial, descripción completa, principios activos, posología, indicaciones, advertencias, análisis de los componentes y su función, y si es apto para diferentes perfiles (embarazo, lactancia, pediatría, diabéticos, hipertensos, celíacos).
        Adicionalmente, dame un diccionario 'anotaciones_componentes' con una breve explicación de 1-2 frases de cada principio activo.`;

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                sku: { type: Type.STRING },
                nombre_comercial: { type: Type.STRING },
                descripcion: { type: Type.STRING },
                principios_activos: { 
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                posologia: { type: Type.STRING },
                indicaciones: { 
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                advertencias: { type: Type.STRING },
                tags_ia: { 
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                categoria_principal: { type: Type.STRING, description: "Belleza, Medicamento, Suplemento, Homeopatía u Otro" },
                analisis_componentes: { type: Type.STRING, description: "Análisis de la función de cada componente en la formulación" },
                apto_embarazo: { type: Type.STRING, description: "SI, NO o PRECAUCION" },
                apto_lactancia: { type: Type.STRING, description: "SI, NO o PRECAUCION" },
                apto_pediatria: { type: Type.STRING, description: "SI, NO o PRECAUCION" },
                apto_diabeticos: { type: Type.STRING, description: "SI, NO o PRECAUCION" },
                apto_hipertensos: { type: Type.STRING, description: "SI, NO o PRECAUCION" },
                apto_celiacos: { type: Type.STRING, description: "SI, NO o PRECAUCION" },
                sugerencia_complementaria: { type: Type.STRING }
              },
              required: ["nombre_comercial"]
            }
          }
        });

        const responseText = response.text || "{}";
        const data = this.cleanAndParseJSON(responseText);
        
        if (!data.nombre_comercial) return null;

        const mapSafety = (val: string): SafetyStatus => {
          const v = String(val).toUpperCase();
          if (v === 'SI') return SafetyStatus.SI;
          if (v === 'NO') return SafetyStatus.NO;
          return SafetyStatus.PRECAUCION;
        };

        return {
          sku: data.sku || "SEARCH-" + Date.now().toString().slice(-6),
          nombre_comercial: data.nombre_comercial,
          descripcion: data.descripcion || "",
          principios_activos: data.principios_activos || [],
          posologia: data.posologia || "Consultar prospecto",
          indicaciones: data.indicaciones || [],
          advertencias: data.advertencias || "",
          tags_ia: [...(data.tags_ia || []), "google_search_grounding"],
          categoria_principal: data.categoria_principal || 'Otro',
          analisis_componentes: data.analisis_componentes || '',
          vectores: [],
          apto_embarazo: mapSafety(data.apto_embarazo),
          apto_lactancia: mapSafety(data.apto_lactancia),
          apto_pediatria: mapSafety(data.apto_pediatria),
          apto_diabeticos: mapSafety(data.apto_diabeticos),
          apto_hipertensos: mapSafety(data.apto_hipertensos),
          apto_celiacos: mapSafety(data.apto_celiacos),
          sugerencia_complementaria: data.sugerencia_complementaria || "",
          skus_relacionados: [],
          synergy_analyzed: false,
          source_url: targetUrl || "google_search"
        };

      } catch (error) {
        console.error("[GeminiService] Error en búsqueda y extracción:", error);
        return null;
      }
    });
  }

  static async reanalyzeProduct(product: Product): Promise<Product | null> {
    return this.withRetry(async () => {
      try {
        const ai = this.getAI();
        
        const prompt = `Re-analiza y completa la información de este producto farmacéutico.
        
        DATOS ACTUALES:
        - Nombre: ${product.nombre_comercial}
        - SKU: ${product.sku}
        - Descripción actual: ${product.descripcion}
        - Principios Activos: ${(Array.isArray(product.principios_activos) ? product.principios_activos : []).join(', ')}
        - Indicaciones: ${(Array.isArray(product.indicaciones) ? product.indicaciones : []).join(', ')}
        - Advertencias: ${product.advertencias}
        - URL de origen: ${product.source_url || 'No disponible'}
        
        TAREA:
        1. Busca información oficial y actualizada sobre este medicamento (usa la URL de origen si está disponible, o busca por su nombre comercial y principios activos).
        2. Completa los campos vacíos o incompletos (especialmente advertencias, posología, y restricciones para embarazo/lactancia/etc).
        3. Clasifica el producto en una de estas categorías principales (categoria_principal): "Belleza", "Medicamento", "Suplemento", "Homeopatía" u "Otro".
        4. Analiza los componentes de la formulación (principios activos) y en el contexto del producto indica la función de cada componente (analisis_componentes).
        5. Genera etiquetas (tags_ia) útiles para búsqueda clínica (ej. "analgésico", "AINE", "hepatotóxico").
        6. Devuelve el JSON completo actualizado. Mantén el SKU original.`;

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                sku: { type: Type.STRING },
                nombre_comercial: { type: Type.STRING },
                descripcion: { type: Type.STRING },
                principios_activos: { 
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                posologia: { type: Type.STRING },
                indicaciones: { 
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                advertencias: { type: Type.STRING },
                tags_ia: { 
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                categoria_principal: { type: Type.STRING, description: "Belleza, Medicamento, Suplemento, Homeopatía u Otro" },
                analisis_componentes: { type: Type.STRING, description: "Análisis de la función de cada componente en la formulación" },
                apto_embarazo: { type: Type.STRING, description: "SI, NO o PRECAUCION" },
                apto_lactancia: { type: Type.STRING, description: "SI, NO o PRECAUCION" },
                apto_pediatria: { type: Type.STRING, description: "SI, NO o PRECAUCION" },
                apto_diabeticos: { type: Type.STRING, description: "SI, NO o PRECAUCION" },
                apto_hipertensos: { type: Type.STRING, description: "SI, NO o PRECAUCION" },
                apto_celiacos: { type: Type.STRING, description: "SI, NO o PRECAUCION" },
                sugerencia_complementaria: { type: Type.STRING }
              },
              required: ["nombre_comercial", "sku"]
            }
          }
        });

        let responseText = "";
        try {
          responseText = response.text || "{}";
        } catch (e) {
          console.error("[GeminiService] Error getting response text (possibly blocked by safety):", e, response);
          return null;
        }

        const data = JSON.parse(responseText);
        if (!data.nombre_comercial) {
          console.error("[GeminiService] Missing nombre_comercial in response:", data);
          return null;
        }

        const mapSafety = (val: string): SafetyStatus => {
          const v = String(val).toUpperCase();
          if (v === 'SI') return SafetyStatus.SI;
          if (v === 'NO') return SafetyStatus.NO;
          return SafetyStatus.PRECAUCION;
        };

        return {
          sku: data.sku || product.sku,
          nombre_comercial: data.nombre_comercial,
          descripcion: data.descripcion || product.descripcion,
          principios_activos: data.principios_activos || product.principios_activos,
          posologia: data.posologia || product.posologia,
          indicaciones: data.indicaciones || product.indicaciones,
          advertencias: data.advertencias || product.advertencias,
          tags_ia: [...new Set([...(data.tags_ia || []), ...(product.tags_ia || []), "reanalizado_ia"])],
          categoria_principal: data.categoria_principal || product.categoria_principal || 'Otro',
          analisis_componentes: data.analisis_componentes || product.analisis_componentes || '',
          vectores: product.vectores || [], // Keep original vectors, they will be updated by AIService if needed
          apto_embarazo: mapSafety(data.apto_embarazo),
          apto_lactancia: mapSafety(data.apto_lactancia),
          apto_pediatria: mapSafety(data.apto_pediatria),
          apto_diabeticos: mapSafety(data.apto_diabeticos),
          apto_hipertensos: mapSafety(data.apto_hipertensos),
          apto_celiacos: mapSafety(data.apto_celiacos),
          sugerencia_complementaria: data.sugerencia_complementaria || product.sugerencia_complementaria,
          skus_relacionados: product.skus_relacionados || [],
          synergy_analyzed: false,
          source_url: product.source_url
        };

      } catch (error) {
        console.error("[GeminiService] Error en reanálisis:", error);
        return null;
      }
    });
  }

  static async extractProductFromMarkdown(markdown: string, url: string): Promise<Product | null> {
    return this.withRetry(async () => {
      try {
        const ai = this.getAI();
        
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Analiza el siguiente contenido en Markdown de una página de farmacia y extrae la información del medicamento en formato JSON.
          
          CONTENIDO:
          ${markdown.substring(0, 10000)}
          
          URL: ${url}`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                sku: { type: Type.STRING },
                nombre_comercial: { type: Type.STRING },
                descripcion: { type: Type.STRING },
                principios_activos: { 
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                posologia: { type: Type.STRING },
                indicaciones: { 
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                advertencias: { type: Type.STRING },
                tags_ia: { 
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                categoria_principal: { type: Type.STRING, description: "Belleza, Medicamento, Suplemento, Homeopatía u Otro" },
                analisis_componentes: { type: Type.STRING, description: "Análisis de la función de cada componente en la formulación" },
                apto_embarazo: { type: Type.STRING, description: "SI, NO o PRECAUCION" },
                apto_lactancia: { type: Type.STRING, description: "SI, NO o PRECAUCION" },
                apto_pediatria: { type: Type.STRING, description: "SI, NO o PRECAUCION" },
                apto_diabeticos: { type: Type.STRING, description: "SI, NO o PRECAUCION" },
                apto_hipertensos: { type: Type.STRING, description: "SI, NO o PRECAUCION" },
                apto_celiacos: { type: Type.STRING, description: "SI, NO o PRECAUCION" },
                sugerencia_complementaria: { type: Type.STRING }
              },
              required: ["nombre_comercial", "sku"]
            }
          }
        });

        const data = JSON.parse(response.text || "{}");
        
        if (!data.nombre_comercial) return null;

        // Mapear strings a SafetyStatus enum
        const mapSafety = (val: string): SafetyStatus => {
          const v = String(val).toUpperCase();
          if (v === 'SI') return SafetyStatus.SI;
          if (v === 'NO') return SafetyStatus.NO;
          return SafetyStatus.PRECAUCION;
        };

        return {
          sku: data.sku || "GEM-" + Date.now().toString().slice(-6),
          nombre_comercial: data.nombre_comercial,
          descripcion: data.descripcion || "",
          principios_activos: data.principios_activos || [],
          posologia: data.posologia || "Consultar prospecto",
          indicaciones: data.indicaciones || [],
          advertencias: data.advertencias || "",
          tags_ia: data.tags_ia || ["gemini_extracted"],
          categoria_principal: data.categoria_principal || 'Otro',
          analisis_componentes: data.analisis_componentes || '',
          vectores: [],
          apto_embarazo: mapSafety(data.apto_embarazo),
          apto_lactancia: mapSafety(data.apto_lactancia),
          apto_pediatria: mapSafety(data.apto_pediatria),
          apto_diabeticos: mapSafety(data.apto_diabeticos),
          apto_hipertensos: mapSafety(data.apto_hipertensos),
          apto_celiacos: mapSafety(data.apto_celiacos),
          sugerencia_complementaria: data.sugerencia_complementaria || "",
          skus_relacionados: [],
          synergy_analyzed: false,
          source_url: url
        };

      } catch (error) {
        console.error("[GeminiService] Error en extracción:", error);
        return null;
      }
    });
  }

  static async extractProductNamesFromUrl(url: string): Promise<string[]> {
    return this.withRetry(async () => {
      try {
        const ai = this.getAI();
        const prompt = `Visita la siguiente página web de farmacia y extrae una lista de todos los nombres de medicamentos o productos farmacéuticos que aparezcan en ella.
        Ignora menús, precios, textos legales y otra basura.
        Devuelve ÚNICAMENTE los nombres de los productos, uno por línea.
        No incluyas viñetas, números ni texto adicional.
        
        Página: ${url}`;

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: {
            tools: [{ urlContext: {} }]
          }
        });

        const text = response.text || "";
        return text.split('\n')
          .map(line => line.replace(/^[-\*\d\.\s]+/, '').trim())
          .filter(line => line.length > 3 && !line.toLowerCase().includes('precio') && !line.toLowerCase().includes('agregar'));
      } catch (error: any) {
        console.error("[GeminiService] Error en extractProductNamesFromUrl:", error);
        throw new Error(`Error al leer la URL con IA: ${error.message}`);
      }
    });
  }

  static async extractProductNamesFromSearch(query: string): Promise<string[]> {
    return this.withRetry(async () => {
      try {
        const ai = this.getAI();
        const prompt = `Busca en la web y recopila una lista de medicamentos o productos farmacéuticos relacionados con la siguiente búsqueda: "${query}".
        Devuelve ÚNICAMENTE los nombres de los productos comerciales, uno por línea.
        No incluyas viñetas, números, explicaciones ni texto adicional.`;

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }]
          }
        });

        const text = response.text || "";
        return text.split('\n')
          .map(line => line.replace(/^[-\*\d\.\s]+/, '').trim())
          .filter(line => line.length > 3 && !line.toLowerCase().includes('precio') && !line.toLowerCase().includes('agregar'));
      } catch (error: any) {
        console.error("[GeminiService] Error en extractProductNamesFromSearch:", error);
        throw new Error(`Error en la búsqueda con IA: ${error.message}`);
      }
    });
  }

  static async generateText(prompt: string): Promise<string> {
    return this.withRetry(async () => {
      try {
        const ai = this.getAI();
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
        });
        return response.text || "";
      } catch (error) {
        console.error("[GeminiService] Error en generateText:", error);
        throw error;
      }
    });
  }

  static async generateJSON(prompt: string): Promise<string> {
    return this.withRetry(async () => {
      try {
        const ai = this.getAI();
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });
        return response.text || "{}";
      } catch (error) {
        console.error("[GeminiService] Error en generateJSON:", error);
        throw error;
      }
    });
  }

  static async analyzeSynergy(mainProduct: Product, relatedProducts: Product[]): Promise<{
    sugerencia_complementaria: string;
    skus_relacionados: string[];
    explicacion_clinica: string;
  }> {
    return this.withRetry(async () => {
      try {
        const ai = this.getAI();
        
        const prompt = `Analiza la relación clínica entre el producto principal y los productos relacionados.
        
        PRODUCTO PRINCIPAL:
        - Nombre: ${mainProduct.nombre_comercial}
        - Principios Activos: ${formatArrayToString(mainProduct.principios_activos, ', ')}
        - Indicaciones: ${formatArrayToString(mainProduct.indicaciones, ', ')}
        
        PRODUCTOS RELACIONADOS:
        ${relatedProducts.map(p => `- [${p.sku}] ${p.nombre_comercial}: ${formatArrayToString(p.indicaciones, ', ')}`).join('\n')}
        
        TAREA:
        Identifica productos complementarios o similares.
        Devuelve un JSON con:
        - sugerencia_complementaria: Texto breve.
        - skus_relacionados: Lista de SKUs.
        - explicacion_clinica: Explicación breve.
        
        [ignoring loop detection]`;

        const response = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                sugerencia_complementaria: { type: Type.STRING },
                skus_relacionados: { 
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                explicacion_clinica: { type: Type.STRING }
              },
              required: ["explicacion_clinica", "skus_relacionados"]
            }
          }
        });

        return JSON.parse(response.text || "{}");
      } catch (error: any) {
        const isQuotaError = error?.status === 'RESOURCE_EXHAUSTED' || error?.message?.includes('429') || error?.message?.includes('quota');
        const isNetworkError = error?.status === 'UNKNOWN' || error?.message?.includes('xhr error') || error?.message?.includes('fetch');
        
        if (isQuotaError || isNetworkError) {
          console.warn(`[GeminiService] ${isQuotaError ? 'Cuota excedida' : 'Error de red'} en analyzeSynergy.`);
        } else {
          console.error("[GeminiService] Error en analyzeSynergy:", error);
        }
        // Rethrow the error so the caller (AIService) can catch it and enqueue the task
        throw error;
      }
    });
  }

  static async analyzeInteractions(products: Product[]): Promise<{
    riesgo_total: 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';
    interacciones: {
      productos: string[];
      gravedad: 'LEVE' | 'MODERADA' | 'GRAVE';
      descripcion: string;
      recomendacion: string;
    }[];
    resumen_clinico: string;
  }> {
    return this.withRetry(async () => {
      try {
        const ai = this.getAI();
        
        const prompt = `Realiza un análisis profundo de interacciones medicamentosas para la siguiente lista de productos.
        
        PRODUCTOS:
        ${products.map(p => `- ${p.nombre_comercial} (${formatArrayToString(p.principios_activos, ', ')})`).join('\n')}
        
        TAREA:
        1. Identifica interacciones entre los principios activos de estos productos.
        2. Clasifica el riesgo total de la combinación.
        3. Detalla cada interacción encontrada con su gravedad, descripción y recomendación clínica.
        4. Proporciona un resumen clínico ejecutivo.
        5. Devuelve un JSON estructurado.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                riesgo_total: { type: Type.STRING, enum: ['BAJO', 'MEDIO', 'ALTO', 'CRITICO'] },
                interacciones: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      productos: { type: Type.ARRAY, items: { type: Type.STRING } },
                      gravedad: { type: Type.STRING, enum: ['LEVE', 'MODERADA', 'GRAVE'] },
                      descripcion: { type: Type.STRING },
                      recomendacion: { type: Type.STRING }
                    },
                    required: ["productos", "gravedad", "descripcion", "recomendacion"]
                  }
                },
                resumen_clinico: { type: Type.STRING }
              },
              required: ["riesgo_total", "interacciones", "resumen_clinico"]
            }
          }
        });

        return JSON.parse(response.text || "{}");
      } catch (error) {
        console.error("[GeminiService] Error en analyzeInteractions:", error);
        return {
          riesgo_total: 'BAJO',
          interacciones: [],
          resumen_clinico: "No se pudo realizar el análisis automático de interacciones."
        };
      }
    });
  }

  static async cleanAndValidateProducts(products: Partial<Product>[]): Promise<Product[]> {
    return this.withRetry(async () => {
      try {
        const ai = this.getAI();
        
        const prompt = `Actúa como un experto en Data Engineering Farmacéutico y Editor Clínico Senior.
        Tu tarea es realizar una CURACIÓN PROFUNDA de la siguiente lista de productos.
        
        PRODUCTOS A PROCESAR (JSON):
        ${JSON.stringify(products.map(p => ({
          sku: p.sku,
          nombre: p.nombre_comercial,
          descripcion: p.descripcion,
          principios: p.principios_activos,
          tags: p.tags_ia,
          categoria: p.categoria_principal
        })))}
        
        REGLAS DE CURACIÓN PROFUNDA:
        1. **Inferencia de Seguridad**: Si el producto contiene principios activos conocidos (ej. Ibuprofeno), INFIERE los campos de aptitud (embarazo, lactancia, etc.) basándote en el conocimiento médico estándar si no están presentes.
        2. **Normalización de Principios**: Unifica nombres (ej. "Vit. C" -> "Vitamina C"). Usa nombres genéricos estándar.
        3. **Enriquecimiento de Indicaciones**: Si las indicaciones son pobres, añade las indicaciones clínicas estándar para esos principios activos.
        4. **Análisis de Componentes**: Genera un breve análisis técnico de por qué se combinan esos principios activos.
        5. **Categorización Estricta**: Clasifica en: "Belleza", "Medicamento", "Suplemento", "Homeopatía", "Otro".
        6. **Tags Clínicos**: Genera etiquetas de alta calidad para búsqueda (ej. "Antipirético", "Fotosensibilizante", "Hepatoprotector").
        
        Devuelve un ARREGLO JSON de objetos con la estructura completa.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sku: { type: Type.STRING },
                  nombre_comercial: { type: Type.STRING },
                  descripcion: { type: Type.STRING },
                  principios_activos: { type: Type.ARRAY, items: { type: Type.STRING } },
                  posologia: { type: Type.STRING },
                  indicaciones: { type: Type.ARRAY, items: { type: Type.STRING } },
                  advertencias: { type: Type.STRING },
                  tags_ia: { type: Type.ARRAY, items: { type: Type.STRING } },
                  categoria_principal: { type: Type.STRING, description: "Belleza, Medicamento, Suplemento, Homeopatía u Otro" },
                  analisis_componentes: { type: Type.STRING },
                  anotaciones_componentes: { type: Type.OBJECT, description: "Diccionario clave-valor. Clave: principio activo. Valor: breve explicación." },
                  apto_embarazo: { type: Type.STRING, description: "SI, NO o PRECAUCION" },
                  apto_lactancia: { type: Type.STRING, description: "SI, NO o PRECAUCION" },
                  apto_pediatria: { type: Type.STRING, description: "SI, NO o PRECAUCION" },
                  apto_diabeticos: { type: Type.STRING, description: "SI, NO o PRECAUCION" },
                  apto_hipertensos: { type: Type.STRING, description: "SI, NO o PRECAUCION" },
                  apto_celiacos: { type: Type.STRING, description: "SI, NO o PRECAUCION" },
                  sugerencia_complementaria: { type: Type.STRING }
                },
                required: ["sku", "nombre_comercial"]
              }
            }
          }
        });

        const text = response.text;
        if (!text) {
          throw new Error("La IA no devolvió ninguna respuesta.");
        }

        const cleanedData = JSON.parse(text);
        
        const mapSafety = (val: any): SafetyStatus => {
          const v = String(val || '').toUpperCase().trim();
          if (v === 'SI') return SafetyStatus.SI;
          if (v === 'NO') return SafetyStatus.NO;
          return SafetyStatus.PRECAUCION;
        };

        return cleanedData.map((p: any) => ({
          sku: p.sku || `SKU-${Math.random().toString(36).substr(2, 9)}`,
          nombre_comercial: p.nombre_comercial || "Producto sin nombre",
          descripcion: p.descripcion || "",
          principios_activos: Array.isArray(p.principios_activos) ? p.principios_activos : [],
          posologia: p.posologia || "Consultar prospecto",
          indicaciones: Array.isArray(p.indicaciones) ? p.indicaciones : [],
          advertencias: p.advertencias || "",
          tags_ia: Array.isArray(p.tags_ia) ? p.tags_ia : [],
          categoria_principal: p.categoria_principal || 'Otro',
          analisis_componentes: p.analisis_componentes || '',
          anotaciones_componentes: p.anotaciones_componentes || {},
          vectores: [],
          apto_embarazo: mapSafety(p.apto_embarazo),
          apto_lactancia: mapSafety(p.apto_lactancia),
          apto_pediatria: mapSafety(p.apto_pediatria),
          apto_diabeticos: mapSafety(p.apto_diabeticos),
          apto_hipertensos: mapSafety(p.apto_hipertensos),
          apto_celiacos: mapSafety(p.apto_celiacos),
          sugerencia_complementaria: p.sugerencia_complementaria || "",
          skus_relacionados: [],
          synergy_analyzed: false,
          last_updated: Date.now()
        }));
      } catch (error) {
        console.error("[GeminiService] Error en limpieza masiva:", error);
        throw error;
      }
    });
  }

  static async extractProductFromPDFText(rawText: string): Promise<Product> {
    return this.withRetry(async () => {
      try {
        const ai = this.getAI();
        
        const prompt = `Analiza el siguiente texto extraído de una ficha técnica de producto farmacéutico y extrae la información estructurada.
        
        TEXTO DE LA FICHA:
        """
        ${rawText}
        """
        
        TAREA:
        Extrae todos los campos necesarios para nuestra base de datos siguiendo estrictamente el esquema JSON proporcionado. 
        Si algún dato no está presente, intenta inferirlo basándote en el conocimiento clínico o deja el campo vacío/por defecto.
        Asegúrate de generar un análisis de componentes detallado y etiquetas (tags) relevantes.
        Además, genera el diccionario 'anotaciones_componentes' con una brevísima explicación (1-2 frases) para cada principio activo identificado.`;

        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                sku: { type: Type.STRING },
                nombre_comercial: { type: Type.STRING },
                descripcion: { type: Type.STRING },
                principios_activos: { type: Type.ARRAY, items: { type: Type.STRING } },
                posologia: { type: Type.STRING },
                indicaciones: { type: Type.ARRAY, items: { type: Type.STRING } },
                advertencias: { type: Type.STRING },
                tags_ia: { type: Type.ARRAY, items: { type: Type.STRING } },
                categoria_principal: { type: Type.STRING, enum: ["Belleza", "Medicamento", "Suplemento", "Homeopatía", "Otro"] },
                analisis_componentes: { type: Type.STRING },
                anotaciones_componentes: { type: Type.OBJECT, description: "Claves: nombre del principio activo, Valores: breve anotación médica" },
                apto_embarazo: { type: Type.STRING, enum: ["SI", "NO", "PRECAUCION"] },
                apto_lactancia: { type: Type.STRING, enum: ["SI", "NO", "PRECAUCION"] },
                apto_pediatria: { type: Type.STRING, enum: ["SI", "NO", "PRECAUCION"] },
                apto_diabeticos: { type: Type.STRING, enum: ["SI", "NO", "PRECAUCION"] },
                apto_hipertensos: { type: Type.STRING, enum: ["SI", "NO", "PRECAUCION"] },
                apto_celiacos: { type: Type.STRING, enum: ["SI", "NO", "PRECAUCION"] },
                sugerencia_complementaria: { type: Type.STRING }
              },
              required: ["sku", "nombre_comercial", "principios_activos"]
            }
          }
        });

        const data = JSON.parse(response.text || "{}");
        
        const mapSafety = (val: any): SafetyStatus => {
          const v = String(val || '').toUpperCase().trim();
          if (v === 'SI') return SafetyStatus.SI;
          if (v === 'NO') return SafetyStatus.NO;
          return SafetyStatus.PRECAUCION;
        };

        return {
          sku: data.sku || `PDF-${Math.random().toString(36).substr(2, 9)}`,
          nombre_comercial: data.nombre_comercial || "Producto Extraído",
          descripcion: data.descripcion || "",
          principios_activos: Array.isArray(data.principios_activos) ? data.principios_activos : [],
          posologia: data.posologia || "Ver ficha técnica",
          indicaciones: Array.isArray(data.indicaciones) ? data.indicaciones : [],
          advertencias: data.advertencias || "",
          tags_ia: Array.isArray(data.tags_ia) ? data.tags_ia : [],
          categoria_principal: data.categoria_principal || 'Otro',
          analisis_componentes: data.analisis_componentes || '',
          anotaciones_componentes: data.anotaciones_componentes || {},
          vectores: [],
          apto_embarazo: mapSafety(data.apto_embarazo),
          apto_lactancia: mapSafety(data.apto_lactancia),
          apto_pediatria: mapSafety(data.apto_pediatria),
          apto_diabeticos: mapSafety(data.apto_diabeticos),
          apto_hipertensos: mapSafety(data.apto_hipertensos),
          apto_celiacos: mapSafety(data.apto_celiacos),
          sugerencia_complementaria: data.sugerencia_complementaria || "",
          skus_relacionados: [],
          synergy_analyzed: false,
          last_updated: Date.now()
        };
      } catch (error) {
        console.error("[GeminiService] Error extrayendo de PDF:", error);
        throw error;
      }
    });
  }

  static async extractProductFromImage(base64Image: string, mimeType: string): Promise<Product> {
    return this.withRetry(async () => {
      try {
        const ai = this.getAI();
        
        const prompt = `Analiza la siguiente imagen que es una captura de pantalla de una ficha técnica o capacitación de un producto farmacéutico.
        
        TAREA:
        Lee y extrae toda la información relevante para nuestra base de datos siguiendo el esquema JSON proporcionado.
        Si hay texto borroso o incompleto, usa tu conocimiento clínico para completar los campos de forma coherente.
        Asegúrate de extraer: SKU, nombre, principios activos, beneficios/indicaciones y perfiles de seguridad.
        Además, genera el diccionario 'anotaciones_componentes' con una brevísima explicación (1-2 frases) para cada principio activo identificado.`;

        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: [
            { text: prompt },
            {
              inlineData: {
                data: base64Image.split(',')[1] || base64Image,
                mimeType: mimeType
              }
            }
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                sku: { type: Type.STRING },
                nombre_comercial: { type: Type.STRING },
                descripcion: { type: Type.STRING },
                principios_activos: { type: Type.ARRAY, items: { type: Type.STRING } },
                posologia: { type: Type.STRING },
                indicaciones: { type: Type.ARRAY, items: { type: Type.STRING } },
                advertencias: { type: Type.STRING },
                tags_ia: { type: Type.ARRAY, items: { type: Type.STRING } },
                categoria_principal: { type: Type.STRING, enum: ["Belleza", "Medicamento", "Suplemento", "Homeopatía", "Otro"] },
                analisis_componentes: { type: Type.STRING },
                anotaciones_componentes: { type: Type.OBJECT, description: "Claves: nombre del principio activo, Valores: breve anotación médica" },
                apto_embarazo: { type: Type.STRING, enum: ["SI", "NO", "PRECAUCION"] },
                apto_lactancia: { type: Type.STRING, enum: ["SI", "NO", "PRECAUCION"] },
                apto_pediatria: { type: Type.STRING, enum: ["SI", "NO", "PRECAUCION"] },
                apto_diabeticos: { type: Type.STRING, enum: ["SI", "NO", "PRECAUCION"] },
                apto_hipertensos: { type: Type.STRING, enum: ["SI", "NO", "PRECAUCION"] },
                apto_celiacos: { type: Type.STRING, enum: ["SI", "NO", "PRECAUCION"] },
                sugerencia_complementaria: { type: Type.STRING }
              },
              required: ["sku", "nombre_comercial", "principios_activos"]
            }
          }
        });

        const data = JSON.parse(response.text || "{}");
        
        const mapSafety = (val: any): SafetyStatus => {
          const v = String(val || '').toUpperCase().trim();
          if (v === 'SI') return SafetyStatus.SI;
          if (v === 'NO') return SafetyStatus.NO;
          return SafetyStatus.PRECAUCION;
        };

        return {
          sku: data.sku || `IMG-${Math.random().toString(36).substr(2, 9)}`,
          nombre_comercial: data.nombre_comercial || "Producto de Captura",
          descripcion: data.descripcion || "",
          principios_activos: Array.isArray(data.principios_activos) ? data.principios_activos : [],
          posologia: data.posologia || "Ver imagen",
          indicaciones: Array.isArray(data.indicaciones) ? data.indicaciones : [],
          advertencias: data.advertencias || "",
          tags_ia: Array.isArray(data.tags_ia) ? data.tags_ia : [],
          categoria_principal: data.categoria_principal || 'Otro',
          analisis_componentes: data.analisis_componentes || '',
          anotaciones_componentes: data.anotaciones_componentes || {},
          vectores: [],
          apto_embarazo: mapSafety(data.apto_embarazo),
          apto_lactancia: mapSafety(data.apto_lactancia),
          apto_pediatria: mapSafety(data.apto_pediatria),
          apto_diabeticos: mapSafety(data.apto_diabeticos),
          apto_hipertensos: mapSafety(data.apto_hipertensos),
          apto_celiacos: mapSafety(data.apto_celiacos),
          sugerencia_complementaria: data.sugerencia_complementaria || "",
          skus_relacionados: [],
          synergy_analyzed: false,
          last_updated: Date.now()
        };
      } catch (error) {
        console.error("[GeminiService] Error extrayendo de Imagen:", error);
        throw error;
      }
    });
  }
}

function apiKeyFromEnv(val: any): string | null {
  if (!val || typeof val !== 'string') return null;
  const trimmed = val.trim();
  if (trimmed === '' || trimmed === 'undefined' || trimmed === 'null') return null;
  return trimmed;
}
