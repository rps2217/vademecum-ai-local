import { GoogleGenAI, Type } from "@google/genai";
import { Product, SafetyStatus } from "../core/types/product.types";
import { formatArrayToString } from "../utils/formatters";
import { 
  SEARCH_PRODUCT_PROMPT, 
  REANALYZE_PRODUCT_PROMPT, 
  EXTRACT_FROM_MARKDOWN_PROMPT, 
  EXTRACT_NAMES_FROM_URL_PROMPT, 
  EXTRACT_NAMES_FROM_SEARCH_PROMPT,
  CLEAN_VALIDATE_PRODUCTS_PROMPT,
  EXTRACT_FROM_PDF_PROMPT,
  EXTRACT_FROM_IMAGE_PROMPT
} from "../prompts/productPrompts";
import { 
  ANALYZE_SYNERGY_PROMPT, 
  GENERATE_GENERAL_ANALYSIS_PROMPT,
  ANALYZE_INTERACTIONS_PROMPT
} from "../prompts/synergyPrompts";
import { EXPLAIN_INGREDIENTS_PROMPT } from "../prompts/ingredientPrompts";
import {
  validateProductExtraction,
  validateProductList,
  validateInteractionAnalysis,
  validateSynergyAnalysis,
  validateExplanation
} from "../core/validation/aiSchemas";
const MODELS = {
  FLASH: "gemini-2.0-flash",
  PRO: "gemini-2.0-flash", // Use flash by default for speed, or pro if available
};

export class GeminiService {
  private static instance: GeminiService;
  private ai: GoogleGenAI | null = null;

  private constructor() {}

  static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  private getAI() {
    if (!this.ai) {
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

  private cleanAndParseJSON(text: string): any {
    try {
      // Intentar parseo directo primero
      return JSON.parse(text);
    } catch (e) {
      // Limpieza agresiva de caracteres no deseados
      const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (match) {
        try {
          let cleanMatch = match[0]
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Eliminar caracteres de control
            .replace(/[\u201C\u201D]/g, '"') // Comillas inteligentes
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/,\s*([\]}])/g, '$1'); // Comas finales
          
          return JSON.parse(cleanMatch);
        } catch (e2) {
          console.error("[GeminiService] Error en limpieza avanzada de JSON:", e2);
          throw new Error("Respuesta de IA malformada e irrecuperable.");
        }
      }
      throw new Error("No se encontró estructura JSON en la respuesta.");
    }
  }

  private async withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
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

  async searchAndExtractProduct(productName: string, targetUrl?: string): Promise<Product | null> {
    return this.withRetry(async () => {
      try {
        const ai = this.getAI();
        
        const prompt = SEARCH_PRODUCT_PROMPT(productName, targetUrl);

        const response = await ai.models.generateContent({
          model: MODELS.FLASH,
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
        
        if (!validateProductExtraction(data)) {
          console.error("[GeminiService] Schema validation failed for searchAndExtractProduct:", validateProductExtraction.errors);
          return null;
        }
        const validData: any = data;

        if (!validData.nombre_comercial) return null;

        const mapSafety = (val: string): SafetyStatus => {
          const v = String(val).toUpperCase();
          if (v === 'SI') return SafetyStatus.SI;
          if (v === 'NO') return SafetyStatus.NO;
          return SafetyStatus.PRECAUCION;
        };

        return {
          sku: validData.sku || "SEARCH-" + Date.now().toString().slice(-6),
          nombre_comercial: validData.nombre_comercial,
          descripcion: validData.descripcion || "",
          principios_activos: validData.principios_activos || [],
          posologia: validData.posologia || "Consultar prospecto",
          indicaciones: validData.indicaciones || [],
          advertencias: validData.advertencias || "",
          tags_ia: [...(validData.tags_ia || []), "google_search_grounding"],
          categoria_principal: validData.categoria_principal || 'Otro',
          analisis_componentes: validData.analisis_componentes || '',
          vectores: [],
          apto_embarazo: mapSafety(validData.apto_embarazo),
          apto_lactancia: mapSafety(validData.apto_lactancia),
          apto_pediatria: mapSafety(validData.apto_pediatria),
          apto_diabeticos: mapSafety(validData.apto_diabeticos),
          apto_hipertensos: mapSafety(validData.apto_hipertensos),
          apto_celiacos: mapSafety(validData.apto_celiacos),
          sugerencia_complementaria: validData.sugerencia_complementaria || "",
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

  async reanalyzeProduct(product: Product): Promise<Product | null> {
    return this.withRetry(async () => {
      try {
        const ai = this.getAI();
        
        const prompt = REANALYZE_PRODUCT_PROMPT(product);

        const response = await ai.models.generateContent({
          model: MODELS.FLASH,
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

        const data = this.cleanAndParseJSON(responseText);
        
        if (!validateProductExtraction(data)) {
          console.error("[GeminiService] Schema validation failed for reanalyzeProduct:", validateProductExtraction.errors);
          return null;
        }

        const validData: any = data;

        if (!validData.nombre_comercial) {
          console.error("[GeminiService] Missing nombre_comercial in response:", validData);
          return null;
        }

        const mapSafety = (val: string): SafetyStatus => {
          const v = String(val).toUpperCase();
          if (v === 'SI') return SafetyStatus.SI;
          if (v === 'NO') return SafetyStatus.NO;
          return SafetyStatus.PRECAUCION;
        };

        return {
          sku: validData.sku || product.sku,
          nombre_comercial: validData.nombre_comercial,
          descripcion: validData.descripcion || product.descripcion,
          principios_activos: validData.principios_activos || product.principios_activos,
          posologia: validData.posologia || product.posologia,
          indicaciones: validData.indicaciones || product.indicaciones,
          advertencias: validData.advertencias || product.advertencias,
          tags_ia: [...new Set([...(validData.tags_ia || []), ...(product.tags_ia || []), "reanalizado_ia"])],
          categoria_principal: validData.categoria_principal || product.categoria_principal || 'Otro',
          analisis_componentes: validData.analisis_componentes || product.analisis_componentes || '',
          vectores: product.vectores || [], // Keep original vectors, they will be updated by AIService if needed
          apto_embarazo: mapSafety(validData.apto_embarazo),
          apto_lactancia: mapSafety(validData.apto_lactancia),
          apto_pediatria: mapSafety(validData.apto_pediatria),
          apto_diabeticos: mapSafety(validData.apto_diabeticos),
          apto_hipertensos: mapSafety(validData.apto_hipertensos),
          apto_celiacos: mapSafety(validData.apto_celiacos),
          sugerencia_complementaria: validData.sugerencia_complementaria || product.sugerencia_complementaria,
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

  async extractProductFromMarkdown(markdown: string, url: string): Promise<Product | null> {
    return this.withRetry(async () => {
      try {
        const ai = this.getAI();
        
        const response = await ai.models.generateContent({
          model: MODELS.FLASH,
          contents: EXTRACT_FROM_MARKDOWN_PROMPT(markdown, url),
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

        const data = this.cleanAndParseJSON(response.text || "{}");
        
        if (!validateProductExtraction(data)) {
          console.error("[GeminiService] Schema validation failed for extractProductFromMarkdown:", validateProductExtraction.errors);
          return null;
        }
        
        const validData: any = data;

        if (!validData.nombre_comercial) return null;

        // Mapear strings a SafetyStatus enum
        const mapSafety = (val: string): SafetyStatus => {
          const v = String(val).toUpperCase();
          if (v === 'SI') return SafetyStatus.SI;
          if (v === 'NO') return SafetyStatus.NO;
          return SafetyStatus.PRECAUCION;
        };

        return {
          sku: validData.sku || "GEM-" + Date.now().toString().slice(-6),
          nombre_comercial: validData.nombre_comercial,
          descripcion: validData.descripcion || "",
          principios_activos: validData.principios_activos || [],
          posologia: validData.posologia || "Consultar prospecto",
          indicaciones: validData.indicaciones || [],
          advertencias: validData.advertencias || "",
          tags_ia: validData.tags_ia || ["gemini_extracted"],
          categoria_principal: validData.categoria_principal || 'Otro',
          analisis_componentes: validData.analisis_componentes || '',
          vectores: [],
          apto_embarazo: mapSafety(validData.apto_embarazo),
          apto_lactancia: mapSafety(validData.apto_lactancia),
          apto_pediatria: mapSafety(validData.apto_pediatria),
          apto_diabeticos: mapSafety(validData.apto_diabeticos),
          apto_hipertensos: mapSafety(validData.apto_hipertensos),
          apto_celiacos: mapSafety(validData.apto_celiacos),
          sugerencia_complementaria: validData.sugerencia_complementaria || "",
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

  async extractProductNamesFromUrl(url: string): Promise<string[]> {
    return this.withRetry(async () => {
      try {
        const ai = this.getAI();
        const prompt = EXTRACT_NAMES_FROM_URL_PROMPT(url);

        const response = await ai.models.generateContent({
          model: MODELS.FLASH,
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

  async extractProductNamesFromSearch(query: string): Promise<string[]> {
    return this.withRetry(async () => {
      try {
        const ai = this.getAI();
        const prompt = EXTRACT_NAMES_FROM_SEARCH_PROMPT(query);

        const response = await ai.models.generateContent({
          model: MODELS.FLASH,
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

  async generateText(prompt: string): Promise<string> {
    return this.withRetry(async () => {
      try {
        const ai = this.getAI();
        const response = await ai.models.generateContent({
          model: MODELS.FLASH,
          contents: prompt,
        });
        return response.text || "";
      } catch (error) {
        console.error("[GeminiService] Error en generateText:", error);
        throw error;
      }
    });
  }

  async generateJSON(prompt: string): Promise<string> {
    return this.withRetry(async () => {
      try {
        const ai = this.getAI();
        const response = await ai.models.generateContent({
          model: MODELS.FLASH,
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

  async generateGeneralAnalysis(query: string, context: string): Promise<string> {
    return this.withRetry(async () => {
      try {
        const ai = this.getAI();
        const prompt = GENERATE_GENERAL_ANALYSIS_PROMPT(query, context);
        
        const response = await ai.models.generateContent({
          model: MODELS.PRO,
          contents: prompt
        });
        return response.text || "No se pudo generar respuesta clínica.";
      } catch (error) {
        console.error("[GeminiService] Error en generateGeneralAnalysis:", error);
        throw error;
      }
    });
  }

  async analyzeSynergy(mainProduct: Product, relatedProducts: Product[], clinicalInsights?: string): Promise<{
    sugerencia_complementaria: string;
    skus_relacionados: string[];
    explicacion_clinica: string;
  }> {
    return this.withRetry(async () => {
      try {
        const ai = this.getAI();
        
        const prompt = ANALYZE_SYNERGY_PROMPT(mainProduct, relatedProducts, clinicalInsights);

        const response = await ai.models.generateContent({
          model: MODELS.PRO,
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

        const data = this.cleanAndParseJSON(response.text || "{}");
        if (!validateSynergyAnalysis(data)) {
          console.error("[GeminiService] Schema validation failed for analyzeSynergy:", validateSynergyAnalysis.errors);
          throw new Error("Invalid synergy analysis format from AI");
        }
        return data as any;
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

  async explainActiveIngredients(productName: string, ingredients: string[]): Promise<Record<string, string>> {
    return this.withRetry(async () => {
      try {
        const ai = this.getAI();
        const prompt = EXPLAIN_INGREDIENTS_PROMPT(productName, ingredients);

        const response = await ai.models.generateContent({
          model: MODELS.FLASH,
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });

        const data = this.cleanAndParseJSON(response.text || "{}");
        if (!validateExplanation(data)) {
          console.error("[GeminiService] Schema validation failed for explainActiveIngredients:", validateExplanation.errors);
          return {};
        }
        return data as any;
      } catch (error) {
        console.error("[GeminiService] Error explicando principios activos:", error);
        throw error;
      }
    });
  }

  async analyzeInteractions(products: Product[]): Promise<{
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
        
        const prompt = ANALYZE_INTERACTIONS_PROMPT(products);

        const response = await ai.models.generateContent({
          model: MODELS.PRO,
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

        const data = this.cleanAndParseJSON(response.text || "{}");
        if (!validateInteractionAnalysis(data)) {
          console.error("[GeminiService] Schema validation failed for analyzeInteractions:", validateInteractionAnalysis.errors);
          throw new Error("Invalid interaction analysis format from AI");
        }
        return data as any;
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

  async cleanAndValidateProducts(products: Partial<Product>[]): Promise<Product[]> {
    return this.withRetry(async () => {
      try {
        const ai = this.getAI();
        
        const productsJson = JSON.stringify(products.map(p => ({
          sku: p.sku,
          nombre: p.nombre_comercial,
          descripcion: p.descripcion,
          principios: p.principios_activos,
          tags: p.tags_ia,
          categoria: p.categoria_principal
        })));
        const prompt = CLEAN_VALIDATE_PRODUCTS_PROMPT(productsJson);

        const response = await ai.models.generateContent({
          model: MODELS.PRO,
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

        const cleanedData = this.cleanAndParseJSON(text);
        if (!validateProductList(cleanedData)) {
          console.error("[GeminiService] Schema validation failed for cleanAndValidateProducts:", validateProductList.errors);
          throw new Error("Invalid product list format from AI");
        }
        
        const mapSafety = (val: any): SafetyStatus => {
          const v = String(val || '').toUpperCase().trim();
          if (v === 'SI') return SafetyStatus.SI;
          if (v === 'NO') return SafetyStatus.NO;
          return SafetyStatus.PRECAUCION;
        };

        return (cleanedData as any[]).map((p: any) => ({
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

  async extractProductFromPDFText(rawText: string): Promise<Product> {
    return this.withRetry(async () => {
      try {
        const ai = this.getAI();
        
        const prompt = EXTRACT_FROM_PDF_PROMPT(rawText);

        const response = await ai.models.generateContent({
          model: MODELS.FLASH,
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

        const data = this.cleanAndParseJSON(response.text || "{}");
        if (!validateProductExtraction(data)) {
          console.error("[GeminiService] Schema validation failed for extractProductFromPDFText:", validateProductExtraction.errors);
          throw new Error("Invalid product format from PDF AI extraction");
        }
        
        const validData: any = data;
        
        const mapSafety = (val: any): SafetyStatus => {
          const v = String(val || '').toUpperCase().trim();
          if (v === 'SI') return SafetyStatus.SI;
          if (v === 'NO') return SafetyStatus.NO;
          return SafetyStatus.PRECAUCION;
        };

        return {
          sku: validData.sku || `PDF-${Math.random().toString(36).substr(2, 9)}`,
          nombre_comercial: validData.nombre_comercial || "Producto Extraído",
          descripcion: validData.descripcion || "",
          principios_activos: Array.isArray(validData.principios_activos) ? validData.principios_activos : [],
          posologia: validData.posologia || "Ver ficha técnica",
          indicaciones: Array.isArray(validData.indicaciones) ? validData.indicaciones : [],
          advertencias: validData.advertencias || "",
          tags_ia: Array.isArray(validData.tags_ia) ? validData.tags_ia : [],
          categoria_principal: validData.categoria_principal || 'Otro',
          analisis_componentes: validData.analisis_componentes || '',
          anotaciones_componentes: validData.anotaciones_componentes || {},
          vectores: [],
          apto_embarazo: mapSafety(validData.apto_embarazo),
          apto_lactancia: mapSafety(validData.apto_lactancia),
          apto_pediatria: mapSafety(validData.apto_pediatria),
          apto_diabeticos: mapSafety(validData.apto_diabeticos),
          apto_hipertensos: mapSafety(validData.apto_hipertensos),
          apto_celiacos: mapSafety(validData.apto_celiacos),
          sugerencia_complementaria: validData.sugerencia_complementaria || "",
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

  async extractProductFromImage(base64Image: string, mimeType: string): Promise<Product> {
    return this.withRetry(async () => {
      try {
        const ai = this.getAI();
        
        const prompt = EXTRACT_FROM_IMAGE_PROMPT();

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

        const data = this.cleanAndParseJSON(response.text || "{}");
        if (!validateProductExtraction(data)) {
          console.error("[GeminiService] Schema validation failed for extractProductFromImage:", validateProductExtraction.errors);
          throw new Error("Invalid product format from Image AI extraction");
        }
        
        const validData: any = data;
        
        const mapSafety = (val: any): SafetyStatus => {
          const v = String(val || '').toUpperCase().trim();
          if (v === 'SI') return SafetyStatus.SI;
          if (v === 'NO') return SafetyStatus.NO;
          return SafetyStatus.PRECAUCION;
        };

        return {
          sku: validData.sku || `IMG-${Math.random().toString(36).substr(2, 9)}`,
          nombre_comercial: validData.nombre_comercial || "Producto de Captura",
          descripcion: validData.descripcion || "",
          principios_activos: Array.isArray(validData.principios_activos) ? validData.principios_activos : [],
          posologia: validData.posologia || "Ver imagen",
          indicaciones: Array.isArray(validData.indicaciones) ? validData.indicaciones : [],
          advertencias: validData.advertencias || "",
          tags_ia: Array.isArray(validData.tags_ia) ? validData.tags_ia : [],
          categoria_principal: validData.categoria_principal || 'Otro',
          analisis_componentes: validData.analisis_componentes || '',
          anotaciones_componentes: validData.anotaciones_componentes || {},
          vectores: [],
          apto_embarazo: mapSafety(validData.apto_embarazo),
          apto_lactancia: mapSafety(validData.apto_lactancia),
          apto_pediatria: mapSafety(validData.apto_pediatria),
          apto_diabeticos: mapSafety(validData.apto_diabeticos),
          apto_hipertensos: mapSafety(validData.apto_hipertensos),
          apto_celiacos: mapSafety(validData.apto_celiacos),
          sugerencia_complementaria: validData.sugerencia_complementaria || "",
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

export const geminiService = GeminiService.getInstance();

function apiKeyFromEnv(val: any): string | null {
  if (!val || typeof val !== 'string') return null;
  const trimmed = val.trim();
  if (trimmed === '' || trimmed === 'undefined' || trimmed === 'null') return null;
  return trimmed;
}
