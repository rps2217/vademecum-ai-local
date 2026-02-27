import { GoogleGenAI, Type } from "@google/genai";
import { Product, SafetyStatus } from "../core/types/product.types";

export class GeminiService {
  private static ai: GoogleGenAI | null = null;

  private static getAI() {
    if (!this.ai) {
      // Intentar obtener la key tanto de process.env (si estuviera disponible) como de import.meta.env
      const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY no configurada en el entorno.");
      }
      this.ai = new GoogleGenAI({ apiKey });
    }
    return this.ai;
  }

  static async searchAndExtractProduct(productName: string, targetUrl?: string): Promise<Product | null> {
    try {
      const ai = this.getAI();
      
      const prompt = `Busca información detallada sobre el producto farmacéutico: "${productName}".
      ${targetUrl ? `Enfócate en la información de este sitio si es posible: ${targetUrl}` : ''}
      
      Necesito extraer: SKU, nombre comercial, descripción completa, principios activos, posología, indicaciones, advertencias y si es apto para diferentes perfiles (embarazo, lactancia, pediatría, diabéticos, hipertensos, celíacos).`;

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

      const data = JSON.parse(response.text || "{}");
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
        vectores: [],
        apto_embarazo: mapSafety(data.apto_embarazo),
        apto_lactancia: mapSafety(data.apto_lactancia),
        apto_pediatria: mapSafety(data.apto_pediatria),
        apto_diabeticos: mapSafety(data.apto_diabeticos),
        apto_hipertensos: mapSafety(data.apto_hipertensos),
        apto_celiacos: mapSafety(data.apto_celiacos),
        sugerencia_complementaria: data.sugerencia_complementaria || "",
        skus_relacionados: [],
        source_url: targetUrl || "google_search"
      };

    } catch (error) {
      console.error("[GeminiService] Error en búsqueda y extracción:", error);
      return null;
    }
  }

  static async extractProductFromMarkdown(markdown: string, url: string): Promise<Product | null> {
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
        vectores: [],
        apto_embarazo: mapSafety(data.apto_embarazo),
        apto_lactancia: mapSafety(data.apto_lactancia),
        apto_pediatria: mapSafety(data.apto_pediatria),
        apto_diabeticos: mapSafety(data.apto_diabeticos),
        apto_hipertensos: mapSafety(data.apto_hipertensos),
        apto_celiacos: mapSafety(data.apto_celiacos),
        sugerencia_complementaria: data.sugerencia_complementaria || "",
        skus_relacionados: [],
        source_url: url
      };

    } catch (error) {
      console.error("[GeminiService] Error en extracción:", error);
      return null;
    }
  }

  static async extractProductNamesFromUrl(url: string): Promise<string[]> {
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
  }

  static async extractProductNamesFromSearch(query: string): Promise<string[]> {
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
  }

  static async generateText(prompt: string): Promise<string> {
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
  }

  static async generateJSON(prompt: string): Promise<string> {
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
  }
}
