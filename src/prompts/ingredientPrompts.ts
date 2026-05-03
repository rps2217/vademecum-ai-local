export const EXPLAIN_INGREDIENTS_PROMPT = (productName: string, ingredients: string[]) => `
Actúa como un Farmacéutico Clínico experto en educación al paciente.
Para el producto "${productName}", explica de forma muy sencilla y clara la función de cada uno de estos principios activos para un paciente:
${ingredients.join(', ')}

REGLAS:
1. Lenguaje MUY simple (ej. "ayuda a bajar la fiebre" en lugar de "antipirético").
2. Sé breve (máximo 2 frases por ingrediente).
3. Identifica cuál de ellos es el Principio Activo principal (si hay varios, el que da el efecto principal decorado con "(PA)") y los demás como coadyuvantes o complementos.
4. No des consejos médicos, solo explica la función.

Devuelve un JSON donde las llaves sean los nombres de los ingredientes y los valores sean las explicaciones.`;
