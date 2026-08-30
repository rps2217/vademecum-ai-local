export function generateClinicalExplanation(
  name: string,
  type: 'ingredient' | 'product',
  pathologyName: string,
  mechanism?: string,
  description?: string,
  principiosActivos?: string[]
): string {
  const info = (mechanism || description || '').trim();

  // Si no tenemos info técnica, usamos una respuesta genérica suave
  if (!info || info === 'mecanismo desconocido.') {
    return `${name} es una excelente opción para ${pathologyName} por sus propiedades de apoyo al bienestar general.`;
  }

  // Extraer la primera frase técnica y limpiarla un poco
  const mainPoint = info.split('.')[0].replace(/\.$/, '');

  // Formateo conciso: [Nombre] ayuda en [Patología] mediante [Mecanismo].
  // Esto es directo, específico y verificable.
  return `${name} es eficaz en ${pathologyName} porque ${mainPoint.toLowerCase()}.`;
}
