import { Product } from '../core/types/product.types';
import { formatArrayToString } from '../utils/formatters';
import { configService } from './ConfigService';

export class OllamaService {
  private static instance: OllamaService;
  private hosts = ['http://localhost:11434/api', 'http://127.0.0.1:11434/api'];
  private activeBaseUrl: string | null = null;
  private lastCheckTime = 0;
  private lastCheckResult = false;

  private constructor() {}

  static getInstance(): OllamaService {
    if (!OllamaService.instance) {
      OllamaService.instance = new OllamaService();
    }
    return OllamaService.instance;
  }

  async isAvailable(): Promise<boolean> {
    const config = configService.getConfig();
    if (!config.useOllama) return false;
    
    const now = Date.now();
    // Cachear el resultado por 30 segundos para evitar spam de peticiones
    if (now - this.lastCheckTime < 30000) {
      return this.lastCheckResult;
    }

    this.lastCheckTime = now;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // 3s timeout for availability check

    // Si ya sabemos cual funciona, lo usamos
    if (this.activeBaseUrl) {
      try {
        const res = await fetch(`${this.activeBaseUrl}/tags`, { signal: controller.signal });
        clearTimeout(timeout);
        this.lastCheckResult = res.ok;
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
          mode: 'cors',
          signal: controller.signal
        });
        clearTimeout(timeout);
        if (response.ok) {
          this.activeBaseUrl = host;
          console.log(`[OllamaService] ✅ Conexión exitosa con ${host}`);
          this.lastCheckResult = true;
          return true;
        }
      } catch (e) {
        console.warn(`[OllamaService] ❌ Falló conexión con ${host}. Asegúrate de que Ollama tenga OLLAMA_ORIGINS="*"`);
      }
    }
    this.lastCheckResult = false;
    return false;
  }

  private get baseUrl(): string {
    return this.activeBaseUrl || this.hosts[0];
  }

  async analyzeSynergy(mainProduct: Product, candidates: Product[]): Promise<{
    sugerencia_complementaria: string;
    skus_relacionados: string[];
    explicacion_clinica: string;
  }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout for clinical analysis

    try {
      // 1. Obtener modelos disponibles y elegir el mejor
      const tagsResponse = await fetch(`${this.baseUrl}/tags`, { signal: controller.signal });
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
        signal: controller.signal,
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
      
      try {
        return JSON.parse(data.response);
      } catch (parseError) {
        // Fallback: Intentar extraer JSON con regex si hay texto extra
        const jsonMatch = data.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        throw new Error('No se pudo parsear el JSON de la respuesta de Ollama');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Timeout agotado esperando respuesta de Ollama (60s)');
      }
      console.error('[OllamaService] Error en análisis:', error);
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async analyzeInteractions(products: Product[]): Promise<any> {
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

export const ollamaService = OllamaService.getInstance();
