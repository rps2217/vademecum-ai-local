/**
 * AI Categorization Service
 * Usa Ollama local para categorizar y enriquecer productos
 */

import type { Product } from '../types';
import { PRODUCT_TYPES, THERAPEUTIC_FUNCTIONS, BODY_SYSTEMS, type ProductType, type TherapeuticFunction, type BodySystem } from '../core/categorization/categories';

interface CategorizationResult {
  type: ProductType | null;
  functions: TherapeuticFunction[];
  systems: BodySystem[];
  posologia: string;
  indicaciones: string[];
  contraindicaciones: string[];
  description: string;
  confidence: number;
  reasoning: string;
}

interface OllamaResponse {
  model: string;
  response: string;
  done: boolean;
}

class AICategorizationService {
  private baseUrl: string;
  private model: string;
  private isAvailable: boolean = false;
  private checkPromise: Promise<boolean> | null = null;

  constructor() {
    // Configuración de Ollama
    this.baseUrl = 'http://localhost:11434';
    this.model = 'llama3.2'; // Modelo local
  }

  /**
   * Verificar si Ollama está disponible
   */
  async checkAvailability(): Promise<boolean> {
    if (this.checkPromise) return this.checkPromise;
    
    this.checkPromise = (async () => {
      try {
        const response = await fetch(`${this.baseUrl}/api/tags`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(3000),
        });
        this.isAvailable = response.ok;
        return this.isAvailable;
      } catch {
        this.isAvailable = false;
        return false;
      } finally {
        this.checkPromise = null;
      }
    })();
    
    return this.checkPromise;
  }

  /**
   * Hacer request a Ollama
   */
  private async ollamaRequest(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.3, // Baja temperatura para respuestas más consistentes
          num_predict: 500,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    const data: OllamaResponse = await response.json();
    return data.response;
  }

  /**
   * Categorizar un producto usando IA
   */
  async categorizeProduct(product: Partial<Product>): Promise<CategorizationResult> {
    const available = await this.checkAvailability();
    
    if (!available) {
      // Si Ollama no está disponible, usar categorización basada en reglas
      return this.ruleBasedCategorization(product);
    }

    try {
      const principios = (product.principios_activos || []).join(', ') || 'desconocido';
      const nombre = product.nombre_comercial || 'desconocido';
      const categoria = product.categoria_principal || 'desconocida';

      const prompt = `Eres un experto en productos farmacéuticos y suplementos. Analiza el siguiente producto y categorízalo.

PRODUCTO:
- Nombre: ${nombre}
- Principios activos: ${principios}
- Categoría: ${categoria}

TIPOS DE PRODUCTO (elige uno):
${Object.entries(PRODUCT_TYPES).map(([key, val]) => `  - ${key}: ${val}`).join('\n')}

FUNCIONES TERAPÉUTICAS (puede ser varias):
${Object.entries(THERAPEUTIC_FUNCTIONS).map(([key, val]) => `  - ${key}: ${val}`).join('\n')}

SISTEMAS DEL CUERPO (puede ser varios):
${Object.entries(BODY_SYSTEMS).map(([key, val]) => `  - ${key}: ${val}`).join('\n')}

Responde en JSON con este formato exacto (sin markdown):
{
  "type": "tipo_de_producto",
  "functions": ["funcion1", "funcion2"],
  "systems": ["sistema1"],
  "posologia": "dosis habitual o descripción de uso",
  "indicaciones": ["indicacion1", "indicacion2"],
  "contraindicaciones": ["contraindicacion1"],
  "description": "breve descripción del producto",
  "confidence": 0.85,
  "reasoning": "explicación breve"
}`;

      const response = await this.ollamaRequest(prompt);
      return this.parseAIResponse(response, product);
    } catch (error) {
      console.error('Error en categorización IA:', error);
      return this.ruleBasedCategorization(product);
    }
  }

  /**
   * Enriquecer un producto con información adicional
   */
  async enrichProduct(product: Partial<Product>): Promise<Partial<Product>> {
    const categorization = await this.categorizeProduct(product);
    
    return {
      ...product,
      posologia: product.posologia || categorization.posologia,
      indicaciones: product.indicaciones || categorization.indicaciones,
      contraindicaciones: product.contraindicaciones || categorization.contraindicaciones,
      descripcion: product.descripcion || categorization.description,
    };
  }

  /**
   * Categorización basada en reglas (fallback)
   */
  private ruleBasedCategorization(product: Partial<Product>): CategorizationResult {
    const principios = (product.principios_activos || []).map(p => p.toLowerCase());
    const nombre = (product.nombre_comercial || '').toLowerCase();
    const categoria = (product.categoria_principal || '').toLowerCase();

    const functions: TherapeuticFunction[] = [];
    const systems: BodySystem[] = [];
    let type: ProductType | null = null;
    const description = product.descripcion || '';
    const indicaciones: string[] = [];
    const contraindicaciones: string[] = [];

    // Detectar tipo desde categoría
    if (categoria.includes('vitamina') || categoria.includes('mineral')) {
      type = PRODUCT_TYPES.FITOTERAPIA;
    } else if (categoria.includes('homeopat')) {
      type = PRODUCT_TYPES.HOMEOPATIA;
    } else if (categoria.includes('suplemento')) {
      type = PRODUCT_TYPES.SUPLEMENTO;
    }

    // Detectar funciones desde principios activos
    if (principios.some(p => p.includes('omega') || p.includes('epa') || p.includes('dha'))) {
      functions.push(THERAPEUTIC_FUNCTIONS.ANTIINFLAMATORIO);
      functions.push(THERAPEUTIC_FUNCTIONS.CARDIOVASCULAR);
    }
    if (principios.some(p => p.includes('colageno') || p.includes('glucosamina'))) {
      functions.push(THERAPEUTIC_FUNCTIONS.CONDROPROTECTOR);
      systems.push(BODY_SYSTEMS.MUSCULOESQUELETICO);
    }
    if (principios.some(p => p.includes('probiotico') || p.includes('lactobac') || p.includes('bifidobac'))) {
      functions.push(THERAPEUTIC_FUNCTIONS.PROBIOTICO);
      functions.push(THERAPEUTIC_FUNCTIONS.DIGESTIVO);
      systems.push(BODY_SYSTEMS.DIGESTIVO);
    }
    if (principios.some(p => p.includes('vitamina_c') || p.includes('ascorbic'))) {
      functions.push(THERAPEUTIC_FUNCTIONS.INMUNOESTIMULANTE);
      functions.push(THERAPEUTIC_FUNCTIONS.ANTIOXIDANTE);
      systems.push(BODY_SYSTEMS.INMUNE);
    }
    if (principios.some(p => p.includes('magnesio'))) {
      functions.push(THERAPEUTIC_FUNCTIONS.RELAJANTE_MUSCULAR);
      functions.push(THERAPEUTIC_FUNCTIONS.CARDIOVASCULAR);
    }
    if (principios.some(p => p.includes('zinc'))) {
      functions.push(THERAPEUTIC_FUNCTIONS.INMUNOMODULADOR);
      systems.push(BODY_SYSTEMS.INMUNE);
    }
    if (principios.some(p => p.includes('vitamina_d') || p.includes('calciferol'))) {
      functions.push(THERAPEUTIC_FUNCTIONS.METABOLICO);
      functions.push(THERAPEUTIC_FUNCTIONS.ANTIINFLAMATORIO);
      systems.push(BODY_SYSTEMS.MUSCULOESQUELETICO);
    }
    if (principios.some(p => p.includes('curcuma') || p.includes('curcumin'))) {
      functions.push(THERAPEUTIC_FUNCTIONS.ANTIINFLAMATORIO);
      functions.push(THERAPEUTIC_FUNCTIONS.ANTIOXIDANTE);
    }
    if (principios.some(p => p.includes('ginkgo'))) {
      functions.push(THERAPEUTIC_FUNCTIONS.NEUROPROTECTOR);
      systems.push(BODY_SYSTEMS.NERVIOSO);
    }
    if (principios.some(p => p.includes('valeriana') || p.includes('melatonina') || p.includes('gaba'))) {
      functions.push(THERAPEUTIC_FUNCTIONS.SEDANTE);
      systems.push(BODY_SYSTEMS.NERVIOSO);
    }
    if (principios.some(p => p.includes('ashwagandha') || p.includes('rhodiola') || p.includes('ginseng'))) {
      functions.push(THERAPEUTIC_FUNCTIONS.ANSIOLITICO);
      functions.push(THERAPEUTIC_FUNCTIONS.METABOLICO);
    }
    if (principios.some(p => p.includes('reishi') || p.includes('cordyceps') || p.includes('shiitake'))) {
      functions.push(THERAPEUTIC_FUNCTIONS.INMUNOMODULADOR);
      systems.push(BODY_SYSTEMS.INMUNE);
    }

    // Detectar desde palabras clave en nombre
    if (nombre.includes('articul') || nombre.includes('joint')) {
      systems.push(BODY_SYSTEMS.MUSCULOESQUELETICO);
    }
    if (nombre.includes('digest') || nombre.includes('stom') || nombre.includes('intestin')) {
      systems.push(BODY_SYSTEMS.DIGESTIVO);
    }
    if (nombre.includes('inmune') || nombre.includes('defensa')) {
      systems.push(BODY_SYSTEMS.INMUNE);
    }
    if (nombre.includes('cardio') || nombre.includes('corazon') || nombre.includes('coração')) {
      systems.push(BODY_SYSTEMS.CARDIOVASCULAR);
    }
    if (nombre.includes('neuro') || nombre.includes('cerebro') || nombre.includes('memoria')) {
      systems.push(BODY_SYSTEMS.NERVIOSO);
    }

    return {
      type,
      functions: [...new Set(functions)],
      systems: [...new Set(systems)],
      posologia: product.posologia || 'Consultar prospecto',
      indicaciones,
      contraindicaciones,
      description,
      confidence: 0.6,
      reasoning: 'Categorización basada en reglasheurísticas',
    };
  }

  /**
   * Parsear respuesta de IA
   */
  private parseAIResponse(response: string, product: Partial<Product>): CategorizationResult {
    try {
      // Extraer JSON de la respuesta
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return this.ruleBasedCategorization(product);
      }

      const data = JSON.parse(jsonMatch[0]);

      // Validar y mapear tipos
      const type = this.validateType(data.type) || null;
      const functions = (data.functions || []).filter(this.validateFunction).map(this.validateFunction).filter(Boolean) as TherapeuticFunction[];
      const systems = (data.systems || []).filter(this.validateSystem).map(this.validateSystem).filter(Boolean) as BodySystem[];

      return {
        type,
        functions,
        systems,
        posologia: data.posologia || '',
        indicaciones: data.indicaciones || [],
        contraindicaciones: data.contraindicaciones || [],
        description: data.description || '',
        confidence: data.confidence || 0.5,
        reasoning: data.reasoning || '',
      };
    } catch {
      return this.ruleBasedCategorization(product);
    }
  }

  private validateType(type: string): ProductType | null {
    const normalized = type.toLowerCase().replace(/-/g, '_');
    if (normalized in PRODUCT_TYPES) {
      return (PRODUCT_TYPES as any)[normalized];
    }
    // Mapeo de variaciones
    const mappings: Record<string, ProductType> = {
      'fitoterapia': PRODUCT_TYPES.FITOTERAPIA,
      'suplemento': PRODUCT_TYPES.SUPLEMENTO,
      'suplemento_alimenticio': PRODUCT_TYPES.SUPLEMENTO,
      'homeopatia': PRODUCT_TYPES.HOMEOPATIA,
      'dispositivo': PRODUCT_TYPES.DISPOSITIVO,
      'cosmetico': PRODUCT_TYPES.COSMETICO,
      'medicamento': PRODUCT_TYPES.MEDICAMENTO,
    };
    return mappings[normalized] || null;
  }

  private validateFunction(fn: string): TherapeuticFunction | null {
    const normalized = fn.toLowerCase().replace(/[áéíóú]/g, (c) => 'aeiou'['áéíóú'.indexOf(c)]).replace(/-/g, '_');
    if (normalized in THERAPEUTIC_FUNCTIONS) {
      return (THERAPEUTIC_FUNCTIONS as any)[normalized];
    }
    return null;
  }

  private validateSystem(system: string): BodySystem | null {
    const normalized = system.toLowerCase().replace(/-/g, '_');
    if (normalized in BODY_SYSTEMS) {
      return (BODY_SYSTEMS as any)[normalized];
    }
    return null;
  }
}

export const aiCategorizationService = new AICategorizationService();
export default aiCategorizationService;
