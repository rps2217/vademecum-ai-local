import { formatArrayToString } from "../utils/formatters";
import { SYSTEM_PHILOSOPHY } from "./systemPrompts";
import { Product } from "../core/types/product.types";

export const ANALYZE_SYNERGY_PROMPT = (mainProduct: Product, relatedProducts: Product[], clinicalInsights?: string) => `
${SYSTEM_PHILOSOPHY}

Analiza la relación clínica entre el producto principal y los productos relacionados.

${clinicalInsights ? `CONTEXTO CLÍNICO RECUPERADO (RAG):\n${clinicalInsights}\n\n` : ''}

PRODUCTO PRINCIPAL:
- Nombre: ${mainProduct.nombre_comercial}
- Principios Activos: ${formatArrayToString(mainProduct.principios_activos, ', ')}
- Indicaciones: ${formatArrayToString(mainProduct.indicaciones, ', ')}

PRODUCTOS RELACIONADOS:
${relatedProducts.map(p => `- [${p.sku}] ${p.nombre_comercial}: ${formatArrayToString(p.indicaciones, ', ')}`).join('\n')}

TAREA:
Identifica productos complementarios registrados en la lista anterior que potencien el efecto del producto principal o traten síntomas relacionados de forma segura.
Usa el contexto clínico recuperado para fundamentar tu respuesta y evitar alucinaciones.

Devuelve un JSON con:
- sugerencia_complementaria: Resumen breve para el usuario (máx 150 chars).
- skus_relacionados: Lista de SKUs de los productos que REALMENTE son sinérgicos o complementarios.
- explicacion_clinica: Explicación técnica de la sinergia basada en los mecanismos de acción.`;

export const GENERATE_GENERAL_ANALYSIS_PROMPT = (query: string, context: string) => `
${SYSTEM_PHILOSOPHY}

Actúa como un analista clínico avanzado. Analiza la siguiente consulta y constrúyelo basándote SOLO en el contexto de los productos proporcionados.

CONSULTA: ${query}

PRODUCTOS RELACIONADOS:
${context}

Requerimientos: Responde de forma clara, priorizando opciones seguras y detalla los riesgos de interacción o perfil de los pacientes.`;

export const ANALYZE_INTERACTIONS_PROMPT = (products: Product[]) => `
${SYSTEM_PHILOSOPHY}

Realiza un análisis profundo de interacciones medicamentosas para la siguiente lista de productos.

PRODUCTOS:
${products.map(p => `- ${p.nombre_comercial} (${formatArrayToString(p.principios_activos, ', ')})`).join('\n')}

TAREA:
1. Identifica interacciones entre los principios activos de estos productos.
2. Clasifica el riesgo total de la combinación.
3. Detalla cada interacción encontrada con su gravedad, descripción y recomendación clínica.
4. Proporciona un resumen clínico ejecutivo.
5. Devuelve un JSON estructurado.`;
