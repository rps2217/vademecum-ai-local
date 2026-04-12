import { GoogleGenAI, Type } from "@google/genai";
import { Product, SafetyStatus } from "../core/types/product.types";
import { formatArrayToString } from "../utils/formatters";

export class GeminiService {
  private static ai: GoogleGenAI | null = null;

  private static getAI() {
    if (!this.ai) {
      let apiKey: string | undefined = undefined;

      // 1. Intentar obtener de Vite (Vercel / Cliente)
      try {
        // Vite reemplaza esto estáticamente durante el build
        if (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
          apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        }
      } catch (e) {
        // Ignorar si import.meta no está disponible
      }

      // 2. Intentar obtener de process.env (AI Studio / Servidor)
      if (!apiKey) {
        try {
          if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
            apiKey = process.env.GEMINI_API_KEY;
          }
        } catch (e) {
          // Ignorar si process no está disponible
        }
      }

      if (!apiKey) {
        throw new Error("GEMINI_API_KEY no configurada. Si estás en Vercel, asegúrate de haber creado la variable VITE_GEMINI_API_KEY en el entorno de Producción y haber hecho un nuevo despliegue (sin caché).");
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
      
      Necesito extraer: SKU, nombre comercial, descripción completa, principios activos, posología, indicaciones, advertencias, análisis de los componentes y su función, y si es apto para diferentes perfiles (embarazo, lactancia, pediatría, diabéticos, hipertensos, celíacos).`;

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
  }

  static async reanalyzeProduct(product: Product): Promise<Product | null> {
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

  static async analyzeSynergy(mainProduct: Product, relatedProducts: Product[]): Promise<{
    sugerencia_complementaria: string;
    skus_relacionados: string[];
    explicacion_clinica: string;
  }> {
    try {
      const ai = this.getAI();
      
      const prompt = `Analiza la relación clínica entre el producto principal y los productos relacionados encontrados en la base de datos local.
      
      PRODUCTO PRINCIPAL:
      - Nombre: ${mainProduct.nombre_comercial}
      - Principios Activos: ${formatArrayToString(mainProduct.principios_activos, ', ')}
      - Indicaciones: ${formatArrayToString(mainProduct.indicaciones, ', ')}
      
      PRODUCTOS RELACIONADOS (CANDIDATOS):
      ${relatedProducts.map(p => `- [${p.sku}] ${p.nombre_comercial}: ${formatArrayToString(p.indicaciones, ', ')}`).join('\n')}
      
      TAREA:
      1. Identifica qué productos de la lista de candidatos podrían ser COMPLEMENTARIOS (ayudan a tratar la misma dolencia o síntomas asociados sin interactuar negativamente).
      2. Identifica qué productos son SIMILARES (atacan la misma patología).
      3. Proporciona una explicación clínica breve de por qué se sugieren estos productos.
      4. Devuelve un JSON con:
         - sugerencia_complementaria: Un texto breve sugiriendo el uso conjunto si aplica.
         - skus_relacionados: Los SKUs de los productos que realmente tienen una relación clínica útil.
         - explicacion_clinica: Una explicación de la sinergia encontrada.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
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
    } catch (error) {
      console.error("[GeminiService] Error en analyzeSynergy:", error);
      return {
        sugerencia_complementaria: "",
        skus_relacionados: [],
        explicacion_clinica: "No se pudo realizar el análisis de sinergia en este momento."
      };
    }
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
        model: "gemini-3-flash-preview",
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
  }
}
