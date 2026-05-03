import { SYSTEM_PHILOSOPHY } from "./systemPrompts";

export const SEARCH_PRODUCT_PROMPT = (productName: string, targetUrl?: string) => `
${SYSTEM_PHILOSOPHY}

Busca información detallada sobre el producto farmacéutico: "${productName}".
${targetUrl ? `Enfócate en la información de este sitio si es posible: ${targetUrl}` : ''}

Necesito extraer: SKU, nombre comercial, descripción completa, principios activos, posología, indicaciones, advertencias, análisis de los componentes y su función, y si es apto para diferentes perfiles (embarazo, lactancia, pediatría, diabéticos, hipertensos, celíacos).
Adicionalmente, dame un diccionario 'anotaciones_componentes' con una breve explicación de 1-2 frases de cada principio activo.`;

export const REANALYZE_PRODUCT_PROMPT = (product: any) => `
${SYSTEM_PHILOSOPHY}

Re-analiza y completa la información de este producto farmacéutico.

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

export const EXTRACT_FROM_MARKDOWN_PROMPT = (markdown: string, url: string) => `
Analiza el siguiente contenido en Markdown de una página de farmacia y extrae la información del medicamento en formato JSON.

CONTENIDO:
${markdown.substring(0, 10000)}

URL: ${url}`;

export const EXTRACT_NAMES_FROM_URL_PROMPT = (url: string) => `
Visita la siguiente página web de farmacia y extrae una lista de todos los nombres de medicamentos o productos farmacéuticos que aparezcan en ella.
Ignora menús, precios, textos legales y otra basura.
Devuelve ÚNICAMENTE los nombres de los productos, uno por línea.
No incluyas viñetas, números ni texto adicional.

URL A ANALIZAR: ${url}`;

export const EXTRACT_NAMES_FROM_SEARCH_PROMPT = (query: string) => `
Busca en la web y recopila una lista de medicamentos o productos farmacéuticos relacionados con la siguiente búsqueda: "${query}".
Devuelve ÚNICAMENTE los nombres de los productos comerciales, uno por línea.
No incluyas viñetas, números, explicaciones ni texto adicional.`;

export const CLEAN_VALIDATE_PRODUCTS_PROMPT = (productsJson: string) => `
${SYSTEM_PHILOSOPHY}

Actúa como un experto en Data Engineering Farmacéutico y Editor Clínico Senior.
Tu tarea es realizar una CURACIÓN PROFUNDA de la siguiente lista de productos.

PRODUCTOS A PROCESAR (JSON):
${productsJson}

REGLAS DE CURACIÓN PROFUNDA:
1. **Inferencia de Seguridad**: Si el producto contiene principios activos conocidos (ej. Ibuprofeno), INFIERE los campos de aptitud (embarazo, lactancia, etc.) basándote en el conocimiento médico estándar si no están presentes.
2. **Normalización de Principios**: Unifica nombres (ej. "Vit. C" -> "Vitamina C"). Usa nombres genéricos estándar.
3. **Enriquecimiento de Indicaciones**: Si las indicaciones son pobres, añade las indicaciones clínicas estándar para esos principios activos.
4. **Análisis de Componentes**: Genera un breve análisis técnico de por qué se combinan esos principios activos.
5. **Categorización Estricta**: Clasifica en: "Belleza", "Medicamento", "Suplemento", "Homeopatía", "Otro".
6. **Tags Clínicos**: Genera etiquetas de alta calidad para búsqueda (ej. "Antipirético", "Fotosensibilizante", "Hepatoprotector").

Devuelve un ARREGLO JSON de objetos con la estructura completa.`;

export const EXTRACT_FROM_PDF_PROMPT = (rawText: string) => `
Analiza el siguiente texto extraído de una ficha técnica de producto farmacéutico y extrae la información estructurada.

TEXTO DE LA FICHA:
"""
${rawText}
"""

TAREA:
Extrae todos los campos necesarios para nuestra base de datos siguiendo estrictamente el esquema JSON proporcionado. 
Si algún dato no está presente, intenta inferirlo basándote en el conocimiento clínico o deja el campo vacío/por defecto.
Asegúrate de generar un análisis de componentes detallado y etiquetas (tags) relevantes.
Además, genera el diccionario 'anotaciones_componentes' con una brevísima explicación (1-2 frases) para cada principio activo identificado.`;

export const EXTRACT_FROM_IMAGE_PROMPT = () => `
${SYSTEM_PHILOSOPHY}

Analiza la siguiente imagen que es una captura de pantalla de una ficha técnica o capacitación de un producto farmacéutico.

TAREA:
Lee y extrae toda la información relevante para nuestra base de datos siguiendo el esquema JSON proporcionado.
Si hay texto borroso o incompleto, usa tu conocimiento clínico para completar los campos de forma coherente.
Asegúrate de extraer: SKU, nombre, principios activos, beneficios/indicaciones y perfiles de seguridad.
Además, genera el diccionario 'anotaciones_componentes' con una brevísima explicación (1-2 frases) para cada principio activo identificado.`;
