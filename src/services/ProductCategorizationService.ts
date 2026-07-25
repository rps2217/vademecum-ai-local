/**
 * Product Categorization Service
 * Infiere categorías de productos basándose en sus principios activos y la KB
 */

import knowledgeBaseData from '../data/knowledge-base.json';

interface KbData {
  version: string;
  ingredients: KbIngredient[];
}

interface KbIngredient {
  id: string;
  nombre: string;
  sinonimos: string[];
  familia: string;
  tipo: string;
  propiedades: string[];
  sinergias: string[];
  antagonismos: string[];
  contraindicaciones: string[];
  notas: string;
}

// Categorías predefinidas con sus propiedades asociadas
const CATEGORY_RULES: Record<string, {
  keywords: string[];
  tipos: string[];
  propiedades: string[];
}> = {
  'inmunoestimulante': {
    keywords: ['inmune', 'inmun', 'immune', 'resfriado', 'gripe', 'virus', 'infección', 'antibiotico'],
    tipos: ['inmunoestimulante', 'antiviral', 'antibacteriano', 'antimicrobiano'],
    propiedades: ['Inmunoestimulante', 'Antiviral', 'Antimicrobiano', 'Antiinfeccioso']
  },
  'vitaminas-minerales': {
    keywords: ['vitamina', 'mineral', 'calcio', 'hierro', 'zinc', 'magnesio', 'selenio'],
    tipos: ['vitaminico', 'mineral'],
    propiedades: ['Vitamina', 'Mineral', 'Energia', 'Metabolismo']
  },
  'adaptogeno': {
    keywords: ['adaptogeno', 'stress', 'estrés', 'fatiga', 'energia', 'rendimiento'],
    tipos: ['adaptogeno'],
    propiedades: ['Adaptogeno', 'Anti-fatiga', 'Energizante', 'Neuroprotector']
  },
  'nootropico': {
    keywords: ['memoria', 'cognicion', 'cerebral', 'concentracion', 'focus', 'neuro'],
    tipos: ['nootropico', 'neurotransmisor'],
    propiedades: ['Neuroprotector', 'Memoria', 'Funcion cognitiva', 'Concentracion']
  },
  'antiinflamatorio': {
    keywords: ['inflamacion', 'dolor', 'articulacion', 'artritis', 'musculo'],
    tipos: ['fitoterapico'],
    propiedades: ['Antiinflamatorio', 'Analgésico', 'Antiartrítico', 'Relajante muscular']
  },
  'cardiovascular': {
    keywords: ['corazon', 'cardio', 'tension', 'presion', 'colesterol', 'vascular'],
    tipos: [],
    propiedades: ['Cardioprotector', 'Vasodilatador', 'Hipotensor', 'Anticoagulante', 'Cardiotónico']
  },
  'digestivo': {
    keywords: ['digestion', 'estomago', 'intestinal', 'higado', 'vesicula', 'colon'],
    tipos: [],
    propiedades: ['Digestivo', 'Hepatoprotector', 'Antiemetico', 'Carminativo', 'Colerético']
  },
  'respiratorio': {
    keywords: ['respiratorio', 'pulmon', 'tos', 'garganta', 'bronquio', 'nariz'],
    tipos: [],
    propiedades: ['Expectorante', 'Antitusivo', 'Descongestionante', 'Demulcente', 'Antiespasmodico']
  },
  'dermatologico': {
    keywords: ['piel', 'dermat', 'herida', 'cicatriz', 'eccema', 'acne', 'quemadura'],
    tipos: [],
    propiedades: ['Cicatrizante', 'Emoliente', 'Antiinflamatorio', 'Antimicrobiano']
  },
  'hormonal': {
    keywords: ['hormona', 'tiroide', 'menopausia', 'menstrua', 'testosterona', 'estrogeno'],
    tipos: ['hormonal'],
    propiedades: ['Hormonal', 'Balance hormonal', 'Emenagogo', 'Fertilidad']
  },
  'sedante': {
    keywords: ['sueno', 'insomnio', 'ansiedad', 'nervio', 'relax', 'calma'],
    tipos: ['neurotransmisor'],
    propiedades: ['Sedante', 'Ansiolítico', 'Hipnótico', 'Relajante', 'Antiespasmódico']
  },
  'antioxidante': {
    keywords: ['antioxidante', 'aging', 'envejecimiento', 'radical', 'celula'],
    tipos: ['antioxidante', 'polifenol'],
    propiedades: ['Antioxidante', 'Antiaging', 'Antiinflamatorio']
  },
  'antimicotico': {
    keywords: ['hongo', 'candida', 'micotico', 'parasito', 'intestinal'],
    tipos: [],
    propiedades: ['Antimicótico', 'Antiparasitario', 'Antiinfeccioso']
  },
  'probiotico': {
    keywords: ['intestino', 'flora', 'bacteria', 'probiótico', 'digestion'],
    tipos: ['probiotico', 'microbioma'],
    propiedades: ['Salud intestinal', 'Probiótico', 'Microbioma']
  },
  'depurativo': {
    keywords: ['depur', 'detox', 'toxina', 'limpieza', 'renal', 'hepatico'],
    tipos: [],
    propiedades: ['Depurativo', 'Diurético', 'Hepatoprotector', 'Detox']
  },
  'tonico': {
    keywords: ['tonico', 'fortalece', 'recupera', 'vigor'],
    tipos: [],
    propiedades: ['Tónico', 'Energizante', 'Reconstituyente']
  }
};

class ProductCategorizationService {
  private kb: KbIngredient[];
  
  constructor() {
    const kbData = knowledgeBaseData as KbData;
    this.kb = kbData.ingredients;
  }

  /**
   * Infiere categorías para un producto basándose en sus principios activos
   */
  categorizeProduct(product: {
    sku: string;
    nombre_comercial: string;
    principios_activos?: string[];
    descripcion?: string;
    categoria?: string;
  }): string[] {
    const categories = new Set<string>();
    
    // 1. Categoría original del producto
    if (product.categoria) {
      categories.add(this.normalizeCategory(product.categoria));
    }
    
    // 2. Analizar principios activos contra la KB
    if (product.principios_activos && product.principios_activos.length > 0) {
      for (const principio of product.principios_activos) {
        const matches = this.findMatchingIngredients(principio);
        for (const match of matches) {
          // Agregar tipo del ingrediente
          categories.add(this.normalizeCategory(match.tipo));
          
          // Agregar categorías basándose en propiedades
          for (const propiedad of match.propiedades) {
            this.matchPropertyToCategory(propiedad.toLowerCase()).forEach(cat => categories.add(cat));
          }
        }
      }
    }
    
    // 3. Analizar nombre y descripción
    const textToAnalyze = `${product.nombre_comercial} ${product.descripcion || ''}`.toLowerCase();
    
    for (const [category, rules] of Object.entries(CATEGORY_RULES)) {
      // Buscar keywords
      for (const keyword of rules.keywords) {
        if (textToAnalyze.includes(keyword)) {
          categories.add(category);
          break;
        }
      }
      
      // Buscar en propiedades de KB
      for (const propiedad of rules.propiedades) {
        for (const ing of this.kb) {
          if (ing.propiedades.some(p => p.toLowerCase().includes(propiedad.toLowerCase()))) {
            categories.add(category);
            break;
          }
        }
      }
    }
    
    // 4. Agregar categorías basadas en familia de ingredientes
    for (const principio of product.principios_activos || []) {
      const matches = this.findMatchingIngredients(principio);
      for (const match of matches) {
        categories.add(this.normalizeCategory(match.familia));
      }
    }
    
    // Convertir a array y eliminar duplicados
    return Array.from(categories).filter(c => c.length > 2);
  }

  /**
   * Encuentra ingredientes de la KB que coincidan con un principio activo
   */
  private findMatchingIngredients(principio: string): KbIngredient[] {
    const matches: KbIngredient[] = [];
    const searchTerm = principio.toLowerCase().trim();
    
    for (const ing of this.kb) {
      // Buscar en nombre
      if (ing.nombre.toLowerCase().includes(searchTerm) || searchTerm.includes(ing.nombre.toLowerCase())) {
        matches.push(ing);
        continue;
      }
      
      // Buscar en sinónimos
      for (const sinonimo of ing.sinonimos) {
        if (sinonimo.toLowerCase().includes(searchTerm) || searchTerm.includes(sinonimo.toLowerCase())) {
          matches.push(ing);
          break;
        }
      }
    }
    
    return matches;
  }

  /**
   * Relaciona propiedades con categorías
   */
  private matchPropertyToCategory(propiedad: string): string[] {
    const categories: string[] = [];
    
    for (const [category, rules] of Object.entries(CATEGORY_RULES)) {
      for (const prop of rules.propiedades) {
        if (prop.toLowerCase().includes(propiedad) || propiedad.includes(prop.toLowerCase())) {
          categories.push(category);
        }
      }
    }
    
    return categories;
  }

  /**
   * Normaliza el nombre de una categoría
   */
  private normalizeCategory(category: string): string {
    return category
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }

  /**
   * Obtiene información de categorización detallada
   */
  getCategorizationDetails(product: {
    sku: string;
    nombre_comercial: string;
    principios_activos?: string[];
    descripcion?: string;
    categoria?: string;
  }): {
    categories: string[];
    categoryLabels: string[];
    matchedIngredients: Array<{ principle: string; kbMatch: string; tipo: string }>;
    properties: string[];
  } {
    const categories = this.categorizeProduct(product);
    const matchedIngredients: Array<{ principle: string; kbMatch: string; tipo: string }> = [];
    const propertiesSet = new Set<string>();
    
    // Encontrar ingredientes coincidentes
    for (const principio of product.principios_activos || []) {
      const matches = this.findMatchingIngredients(principio);
      for (const match of matches) {
        matchedIngredients.push({
          principle: principio,
          kbMatch: match.nombre,
          tipo: match.tipo
        });
        
        // Recopilar propiedades
        match.propiedades.forEach(p => propertiesSet.add(p));
      }
    }
    
    // Etiquetas amigables de categorías
    const categoryLabels = categories.map(c => this.getCategoryLabel(c));
    
    return {
      categories,
      categoryLabels,
      matchedIngredients,
      properties: Array.from(propertiesSet)
    };
  }

  /**
   * Obtiene etiqueta amigable para una categoría
   */
  private getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      'inmunoestimulante': '🛡️ Inmunológico',
      'vitaminas-minerales': '💊 Vitaminas y Minerales',
      'adaptogeno': '⚡ Adaptógeno',
      'nootropico': '🧠 Nootrópico',
      'antiinflamatorio': '🔥 Antiinflamatorio',
      'cardiovascular': '❤️ Cardiovascular',
      'digestivo': '🔄 Digestivo',
      'respiratorio': '🌬️ Respiratorio',
      'dermatologico': '🩹 Dermatológico',
      'hormonal': '⚖️ Hormonal',
      'sedante': '😴 Sedante',
      'antioxidante': '✨ Antioxidante',
      'antimicotico': '🍄 Antimicótico',
      'probiotico': '🦠 Probiótico',
      'depurativo': '🧹 Depurativo',
      'tonico': '💪 Tónico',
      'homeopatico': '🏠 Homeopático',
      'fitoterapico': '🌿 Fitoterapéutico',
      'mineral': '💎 Mineral',
      'vitaminico': '💊 Vitamínico',
      'fungico': '🍄 Fungico',
      'bacteria': '🦠 Bacteriano'
    };
    
    return labels[category] || category;
  }

  /**
   * Sugiere productos relacionados basándose en categorías
   */
  suggestRelatedProducts(
    productCategories: string[],
    allProducts: Array<{ sku: string; nombre_comercial: string; principios_activos?: string[] }>
  ): Array<{ sku: string; nombre_comercial: string; matchScore: number; sharedCategories: string[] }> {
    const suggestions: Array<{ sku: string; nombre_comercial: string; matchScore: number; sharedCategories: string[] }> = [];
    
    for (const other of allProducts) {
      if (productCategories.length === 0) continue;
      
      const otherCategories = this.categorizeProduct(other);
      const shared = productCategories.filter(c => otherCategories.includes(c));
      
      if (shared.length > 0) {
        suggestions.push({
          sku: other.sku,
          nombre_comercial: other.nombre_comercial,
          matchScore: shared.length,
          sharedCategories: shared.map(c => this.getCategoryLabel(c))
        });
      }
    }
    
    // Ordenar por puntuación de coincidencia
    return suggestions.sort((a, b) => b.matchScore - a.matchScore).slice(0, 10);
  }

  /**
   * Obtiene todas las categorías disponibles
   */
  getAllCategories(): Array<{ id: string; label: string; count: number }> {
    const categoryCounts: Record<string, number> = {};
    
    // Contar ingredientes por tipo/familia
    for (const ing of this.kb) {
      // Por tipo
      categoryCounts[ing.tipo] = (categoryCounts[ing.tipo] || 0) + 1;
      
      // Por familia
      const famCat = this.normalizeCategory(ing.familia);
      categoryCounts[famCat] = (categoryCounts[famCat] || 0) + 1;
    }
    
    // Agregar categorías basadas en reglas
    for (const [cat, rules] of Object.entries(CATEGORY_RULES)) {
      if (!categoryCounts[cat]) {
        categoryCounts[cat] = 0;
        for (const ing of this.kb) {
          if (rules.tipos.includes(ing.tipo)) {
            categoryCounts[cat]++;
          }
          for (const prop of rules.propiedades) {
            if (ing.propiedades.some(p => p.toLowerCase().includes(prop.toLowerCase()))) {
              categoryCounts[cat]++;
              break;
            }
          }
        }
      }
    }
    
    return Object.entries(categoryCounts)
      .map(([id, count]) => ({
        id,
        label: this.getCategoryLabel(id),
        count
      }))
      .filter(c => c.count > 0)
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Obtiene estadísticas de la KB por tipo
   */
  getTypeStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    
    for (const ing of this.kb) {
      stats[ing.tipo] = (stats[ing.tipo] || 0) + 1;
    }
    
    return stats;
  }
}

export const productCategorizationService = new ProductCategorizationService();
export default productCategorizationService;
