import { Product } from '../core/types/product.types';
import { formatArrayToString } from '../utils/formatters';
import { ConfigService } from './ConfigService';

export class OllamaService {
  private static baseUrl = 'http://localhost:11434/api';

  static async isAvailable(): Promise<boolean> {
    const config = ConfigService.getConfig();
    if (!config.useOllama) return false;
    
    try {
      // console.log(`[OllamaService] Verificando presencia de motor externo en ${this.baseUrl}...`);
      const response = await fetch(`${this.baseUrl}/tags`, { 
        method: 'GET',
        mode: 'cors' 
      });
      if (response.ok) {
        console.log('[OllamaService] ✅ Motor externo Ollama detectado y listo.');
        return true;
      }
      return false;
    } catch (e) {
      // console.warn('[OllamaService] ❌ No se detectó Ollama localmente.');
      return false;
    }
  }

  static async analyzeSynergy(mainProduct: Product, candidates: Product[]): Promise<{
    sugerencia_complementaria: string;
    skus_relacionados: string[];
    explicacion_clinica: string;
  }> {
    const prompt = `Analiza la relación clínica entre el producto principal y los productos relacionados.
    
    PRODUCTO PRINCIPAL:
    - Nombre: ${mainProduct.nombre_comercial}
    - Principios Activos: ${formatArrayToString(mainProduct.principios_activos, ', ')}
    - Indicaciones: ${formatArrayToString(mainProduct.indicaciones, ', ')}
    
    PRODUCTOS RELACIONADOS (CANDIDATOS):
    ${candidates.map(p => `- [${p.sku}] ${p.nombre_comercial}: ${formatArrayToString(p.indicaciones, ', ')}`).join('\n')}
    
    TAREA:
    1. Identifica qué productos son COMPLEMENTARIOS o SIMILARES.
    2. Proporciona una explicación clínica breve.
    3. Responde ÚNICAMENTE con un JSON válido:
    {
      "sugerencia_complementaria": "texto breve",
      "skus_relacionados": ["SKU1", "SKU2"],
      "explicacion_clinica": "explicación"
    }`;

    try {
      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        return {
          sugerencia_complementaria: "",
          skus_relacionados: [],
          explicacion_clinica: "Ollama no está disponible localmente."
        };
      }

      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        body: JSON.stringify({
          model: 'llama3', // O el modelo que el usuario tenga (mistral, qwen, etc)
          prompt: prompt,
          stream: false,
          format: 'json'
        })
      });

      if (!response.ok) throw new Error('Ollama error');
      
      const data = await response.json();
      if (!data || !data.response) throw new Error('Cuerpo de respuesta Ollama inválido');
      return JSON.parse(data.response);
    } catch (error) {
      console.error('[OllamaService] Error:', error);
      throw error;
    }
  }

  static async analyzeInteractions(products: Product[]): Promise<any> {
    const prompt = `Analiza interacciones medicamentosas para:
    ${products.map(p => `- ${p.nombre_comercial} (${formatArrayToString(p.principios_activos, ', ')})`).join('\n')}
    
    Responde ÚNICAMENTE con un JSON:
    {
      "riesgo_total": "BAJO|MEDIO|ALTO|CRITICO",
      "interacciones": [
        { "productos": ["P1", "P2"], "gravedad": "LEVE|MODERADA|GRAVE", "descripcion": "...", "recomendacion": "..." }
      ],
      "resumen_clinico": "..."
    }`;

    try {
      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        return {
          riesgo_total: "BAJO",
          interacciones: [],
          resumen_clinico: "Ollama no está disponible localmente."
        };
      }

      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        body: JSON.stringify({
          model: 'llama3',
          prompt: prompt,
          stream: false,
          format: 'json'
        })
      });

      if (!response.ok) throw new Error('Ollama error');
      
      const data = await response.json();
      return JSON.parse(data.response);
    } catch (error) {
      console.error('[OllamaService] Error:', error);
      throw error;
    }
  }
}
