/**
 * Motor de Análisis de Sinergias - Sin IA
 */

import { getCombinedKnowledgeBase } from './ExpandedIngredients';
import type { IngredientInfo } from './ingredients';
import { Product } from '../types/product.types';

// Usar base de conocimiento combinada
const KNOWLEDGE_BASE = getCombinedKnowledgeBase();

// Función de búsqueda mejorada
function findIngredient(searchTerm: string): IngredientInfo | undefined {
  const normalized = searchTerm.toLowerCase().trim();
  
  // Búsqueda exacta por ID
  if (KNOWLEDGE_BASE[normalized]) {
    return KNOWLEDGE_BASE[normalized];
  }
  
  // Búsqueda por nombre
  for (const key of Object.keys(KNOWLEDGE_BASE)) {
    const info = KNOWLEDGE_BASE[key];
    if (info.nombre.toLowerCase().includes(normalized) || 
        (info.nombre_latin && info.nombre_latin.toLowerCase().includes(normalized))) {
      return info;
    }
  }
  
  // Búsqueda parcial (primeros 4 caracteres)
  const partial = normalized.substring(0, 4);
  for (const key of Object.keys(KNOWLEDGE_BASE)) {
    const info = KNOWLEDGE_BASE[key];
    if (info.nombre.toLowerCase().includes(partial)) {
      return info;
    }
  }
  
  return undefined;
}

export interface SynergyResult {
  producto_principal: string;
  producto_secundario: string;
  nivel_sinergia: 'alto' | 'medio' | 'bajo';
  tipo_relacion: 'potenciador' | 'complementario' | 'cofactor';
  descripcion: string;
  beneficios_combinados: string[];
  recomendaciones: string;
}

export interface ProductSynergyAnalysis {
  producto: Product;
  ingredientes_encontrados: IngredientInfo[];
  ingredientes_sin_match: string[];
  sinergias_detectadas: SynergyResult[];
  sinergias_potenciales: SynergyResult[];
  categoria_predominante: string;
  nivel_analisis_completo: number; // 0-100
  analisis_ia_necesario: boolean;
  explicacion_general: string;
}

/**
 * Analiza los ingredientes de un producto contra la base de conocimiento
 */
export function analyzeProductIngredients(product: Product): ProductSynergyAnalysis {
  const principiosActivos = product.principios_activos || [];
  const ingredientesEncontrados: IngredientInfo[] = [];
  const ingredientesSinMatch: string[] = [];
  
  // Buscar cada principio activo en la base de conocimiento
  for (const principio of principiosActivos) {
    const info = findIngredient(principio);
    if (info) {
      ingredientesEncontrados.push(info);
    } else {
      // Intentar con variaciones comunes
      const variaciones = [
        principio.toLowerCase(),
        principio.replace(/\s+/g, '_'),
        principio.replace(/[_\s]+/g, '').toLowerCase()
      ];
      
      let encontrado = false;
      for (const variacion of variaciones) {
        const match = Object.values(KNOWLEDGE_BASE).find(ing => 
          ing.nombre.toLowerCase().includes(variacion) ||
          ing.id.includes(variacion)
        );
        if (match) {
          ingredientesEncontrados.push(match);
          encontrado = true;
          break;
        }
      }
      
      if (!encontrado) {
        ingredientesSinMatch.push(principio);
      }
    }
  }
  
  // Calcular nivel de análisis
  const nivelAnalisis = principiosActivos.length > 0 
    ? Math.round((ingredientesEncontrados.length / principiosActivos.length) * 100)
    : 0;
  
  // Determinar categoría predominante
  const categorias = ingredientesEncontrados.reduce((acc, ing) => {
    acc[ing.categoria] = (acc[ing.categoria] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const categoriaPredominante = Object.entries(categorias)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'desconocida';
  
  return {
    producto,
    ingredientes_encontrados: ingredientesEncontrados,
    ingredientes_sin_match: ingredientesSinMatch,
    sinergias_detectadas: [],
    sinergias_potenciales: [],
    categoria_predominante: categoriaPredominante,
    nivel_analisis_completo: nivelAnalisis,
    analisis_ia_necesario: nivelAnalisis < 50,
    explicacion_general: generarExplicacionGeneral(ingredientesEncontrados, ingredientesSinMatch)
  };
}

/**
 * Analiza sinergias entre dos productos
 */
export function analyzeProductSynergies(
  producto1: Product, 
  producto2: Product
): SynergyResult[] {
  const sinergias: SynergyResult[] = [];
  
  const analisis1 = analyzeProductIngredients(producto1);
  const analisis2 = analyzeProductIngredients(producto2);
  
  // Verificar sinergias entre todos los ingredientes
  for (const ing1 of analisis1.ingredientes_encontrados) {
    for (const ing2 of analisis2.ingredientes_encontrados) {
      const sinergia = checkSynergy(ing1.id, ing2.id);
      if (sinergia) {
        sinergias.push({
          producto_principal: producto1.nombre_comercial,
          producto_secundario: producto2.nombre_comercial,
          nivel_sinergia: sinergia.nivel,
          tipo_relacion: sinergia.tipo,
          descripcion: sinergia.descripcion,
          beneficios_combinados: [...new Set([...ing1.beneficios, ...ing2.beneficios])].slice(0, 5),
          recomendaciones: generarRecomendacion(sinergia, ing1, ing2)
        });
      }
      
      // También verificar en dirección inversa
      const sinergiaReversa = checkSynergy(ing2.id, ing1.id);
      if (sinergiaReversa && !sinergias.find(s => 
        s.producto_principal === producto2.nombre_comercial && 
        s.producto_secundario === producto1.nombre_comercial
      )) {
        sinergias.push({
          producto_principal: producto2.nombre_comercial,
          producto_secundario: producto1.nombre_comercial,
          nivel_sinergia: sinergiaReversa.nivel,
          tipo_relacion: sinergiaReversa.tipo,
          descripcion: sinergiaReversa.descripcion,
          beneficios_combinados: [...new Set([...ing2.beneficios, ...ing1.beneficios])].slice(0, 5),
          recomendaciones: generarRecomendacion(sinergiaReversa, ing2, ing1)
        });
      }
    }
  }
  
  return sinergias;
}

/**
 * Encuentra productos complementarios en un catálogo
 */
export function findComplementaryProducts(
  producto: Product,
  catalogo: Product[],
  maxResults: number = 5
): Product[] {
  const analisis = analyzeProductIngredients(producto);
  
  // Calcular puntuación de complementariedad para cada producto
  const productosConPuntuacion = catalogo
    .filter(p => p.sku !== producto.sku)
    .map(p => {
      const sinergias = analyzeProductSynergies(producto, p);
      const puntuacion = sinergias.reduce((acc, s) => {
        const peso = s.nivel_sinergia === 'alto' ? 3 : s.nivel_sinergia === 'medio' ? 2 : 1;
        return acc + peso;
      }, 0);
      
      return { producto: p, puntuacion, sinergias };
    })
    .filter(p => p.puntuacion > 0)
    .sort((a, b) => b.puntuacion - a.puntuacion)
    .slice(0, maxResults);
  
  return productosConPuntuacion.map(p => p.producto);
}

/**
 * Genera explicación general del producto
 */
function generarExplicacionGeneral(
  ingredientes: IngredientInfo[],
  sinMatch: string[]
): string {
  if (ingredientes.length === 0) {
    return 'No se encontraron ingredientes en la base de conocimiento.';
  }
  
  const beneficios = [...new Set(ingredientes.flatMap(i => i.beneficios))].slice(0, 6);
  const mecanismos = [...new Set(ingredientes.map(i => i.mecanismo_accion))].slice(0, 3);
  
  let explicacion = '';
  
  if (beneficios.length > 0) {
    explicacion += `Este producto aporta: ${beneficios.join(', ')}. `;
  }
  
  if (mecanismos.length > 0) {
    explicacion += `Mecanismo: ${mecanismos[0].substring(0, 200)}...`;
  }
  
  if (sinMatch.length > 0) {
    explicacion += `\n\nIngredientes sin información detallada: ${sinMatch.join(', ')}.`;
  }
  
  return explicacion;
}

/**
 * Genera recomendación personalizada
 */
function generarRecomendacion(
  sinergia: SynergyRelation,
  ing1: IngredientInfo,
  ing2: IngredientInfo
): string {
  switch (sinergia.tipo) {
    case 'potenciador':
      return `${ing1.nombre} potencia los efectos de ${ing2.nombre}. Tomar juntos puede maximizar los beneficios de ambos.`;
    case 'complementario':
      return `${ing1.nombre} y ${ing2.nombre} trabajan en complementación para efectos sinérgicos. Buena combinación.`;
    case 'cofactor':
      return `${ing2.nombre} es un cofactor que mejora la absorción y utilización de ${ing1.nombre}. Altamente recomendado juntos.`;
    default:
      return `Combinación de ${ing1.nombre} y ${ing2.nombre} presenta sinergia de nivel ${sinergia.nivel}.`;
  }
}

/**
 * Genera análisis completo de producto con sinergias
 */
export function generateFullProductAnalysis(
  producto: Product,
  productosRelacionados: Product[]
): ProductSynergyAnalysis {
  const analisis = analyzeProductIngredients(producto);
  
  // Analizar sinergias con productos relacionados
  const sinergiasDetectadas: SynergyResult[] = [];
  const sinergiasPotenciales: SynergyResult[] = [];
  
  for (const rel of productosRelacionados) {
    const sinergias = analyzeProductSynergies(producto, rel);
    sinergiasDetectadas.push(...sinergias.filter(s => s.nivel_sinergia === 'alto'));
    sinergiasPotenciales.push(...sinergias.filter(s => s.nivel_sinergia !== 'alto'));
  }
  
  return {
    ...analisis,
    sinergias_detectadas: sinergiasDetectadas.slice(0, 10),
    sinergias_potenciales: sinergiasPotenciales.slice(0, 5)
  };
}

/**
 * Exportar análisis como texto legible
 */
export function exportAnalysisAsText(analisis: ProductSynergyAnalysis): string {
  let texto = `# Análisis de ${analisis.producto.nombre_comercial}\n\n`;
  
  texto += `## Ingredientes Identificados (${analisis.ingredientes_encontrados.length})\n`;
  for (const ing of analisis.ingredientes_encontrados) {
    texto += `- **${ing.nombre}** (${ing.categoria})\n`;
    texto += `  ${ing.descripcion}\n`;
    texto += `  Beneficios: ${ing.beneficios.join(', ')}\n\n`;
  }
  
  if (analisis.ingredientes_sin_match.length > 0) {
    texto += `## Ingredientes sin información detallada\n`;
    texto += `${analisis.ingredientes_sin_match.join(', ')}\n\n`;
  }
  
  if (analisis.sinergias_detectadas.length > 0) {
    texto += `## Sinergias de Alto Nivel Detectadas\n`;
    for (const syn of analisis.sinergias_detectadas) {
      texto += `- **${syn.producto_secundario}**: ${syn.descripcion}\n`;
      texto += `  Recomendación: ${syn.recomendaciones}\n\n`;
    }
  }
  
  texto += `## Explicación General\n${analisis.explicacion_general}\n`;
  
  return texto;
}

// Estadísticas de la base de conocimiento
export function getKnowledgeBaseStats() {
  const categorias = Object.values(KNOWLEDGE_BASE).reduce((acc, ing) => {
    acc[ing.categoria] = (acc[ing.categoria] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const totalSinergias = Object.values(KNOWLEDGE_BASE).reduce((acc, ing) => {
    return acc + ing.sinergias.length;
  }, 0);
  
  return {
    total_ingredientes: Object.keys(KNOWLEDGE_BASE).length,
    ingredientes_por_categoria: categorias,
    total_sinergias: totalSinergias,
    promedio_sinergias_por_ingrediente: (totalSinergias / Object.keys(KNOWLEDGE_BASE).length).toFixed(1)
  };
}
