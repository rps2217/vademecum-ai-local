import { Product } from '../core/types/product.types';
import { formatArrayToString } from '../utils/formatters';
import { ConfigService } from './ConfigService';

export class OllamaService {
  private static hosts = ['http://localhost:11434/api', 'http://127.0.0.1:11434/api'];
  private static activeBaseUrl: string | null = null;

  static async isAvailable(): Promise<boolean> {
    const config = ConfigService.getConfig();
    if (!config.useOllama) return false;
    
    // Si ya sabemos cual funciona, lo usamos
    if (this.activeBaseUrl) {
      try {
        const res = await fetch(`${this.activeBaseUrl}/tags`);
        return res.ok;
      } catch {
        this.activeBaseUrl = null;
      }
    }

    for (const host of this.hosts) {
      try {
        console.log(`[OllamaService] Intentando conectar con motor en ${host}...`);
        const response = await fetch(`${host}/tags`, { 
          method: 'GET',
          mode: 'cors' 
        });
        if (response.ok) {
          this.activeBaseUrl = host;
          console.log(`[OllamaService] ✅ Conexión exitosa con ${host}`);
          return true;
        }
      } catch (e) {
        console.warn(`[OllamaService] ❌ Falló conexión con ${host}. Asegúrate de que Ollama tenga OLLAMA_ORIGINS="*"`);
      }
    }
    return false;
  }

  private static get baseUrl(): string {
    return this.activeBaseUrl || this.hosts[0];
  }

  static async analyzeSynergy(mainProduct: Product, candidates: Product[]): Promise<{
    sugerencia_complementaria: string;
    skus_relacionados: string[];
    explicacion_clinica: string;
  }> {
    try {
      // 1. Obtener modelos disponibles y elegir el mejor
      const tagsResponse = await fetch(`${this.baseUrl}/tags`);
      const tagsData = await tagsResponse.json();
      const models = tagsData.models || [];
      
      if (models.length === 0) {
        throw new Error('No se encontraron modelos en Ollama. Ejecuta "ollama pull llama3"');
      }

      // Preferencia: llama3 > llama2 > mistral > primero disponible
      const preferredModels = ['llama3', 'llama3:latest', 'llama2', 'mistral'];
      let selectedModel = models[0].name;
      
      for (const pref of preferredModels) {
        if (models.find((m: any) => m.name === pref)) {
          selectedModel = pref;
          break;
        }
      }

      console.log(`[OllamaService] Utilizando modelo: ${selectedModel}`);

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

      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        body: JSON.stringify({
          model: selectedModel,
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
      console.error('[OllamaService] Error en análisis:', error);
      throw error;
    }
  }

  static async analyzeInteractions(products: Product[]): Promise<any> {
    try {
      const tagsResponse = await fetch(`${this.baseUrl}/tags`);
      const tagsData = await tagsResponse.json();
      const models = tagsData.models || [];
      
      if (models.length === 0) {
        throw new Error('No hay modelos en Ollama.');
      }

      const preferredModels = ['llama3', 'llama3:latest', 'llama2', 'mistral'];
      let selectedModel = models[0].name;
      for (const pref of preferredModels) {
        if (models.find((m: any) => m.name === pref)) {
          selectedModel = pref;
          break;
        }
      }

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

      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        body: JSON.stringify({
          model: selectedModel,
          prompt: prompt,
          stream: false,
          format: 'json'
        })
      });

      if (!response.ok) throw new Error('Ollama error');
      
      const data = await response.json();
      return JSON.parse(data.response);
    } catch (error) {
      console.error('[OllamaService] Error en interacciones:', error);
      throw error;
    }
  }
}
