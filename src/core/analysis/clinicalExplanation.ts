export function generateClinicalExplanation(
  name: string,
  type: 'ingredient' | 'product',
  pathologyName: string,
  mechanism?: string,
  description?: string,
  principiosActivos?: string[]
): string {
  if (type === 'ingredient') {
    const mechText = mechanism || description || 'aporta compuestos activos específicos que modulan la respuesta biológica';
    return `En el contexto de ${pathologyName}, ${name} actúa mediante ${mechText.toLowerCase()}, lo que ayuda directamente a contrarrestar los síntomas principales, proteger el tejido afectado y favorecer la recuperación clínica de forma natural.`;
  } else {
    const actives = principiosActivos?.length ? ` sus principios activos principales (${principiosActivos.join(', ')})` : '';
    return `Para ${pathologyName}, este producto comercial aporta${actives} con una acción sinérgica orientada a aliviar la sintomatología y apoyar los sistemas corporales implicados, facilitando una recomendación rápida, eficaz y segura en el mostrador.`;
  }
}
