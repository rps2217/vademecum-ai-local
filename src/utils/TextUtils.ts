/**
 * Utilidades para comparación de texto y normalización determinista
 */

export const TextUtils = {
  /**
   * Calcula la distancia de Levenshtein entre dos strings
   * Determina cuántos cambios se necesitan para transformar un string en otro
   */
  levenshteinDistance: (a: string, b: string): number => {
    const matrix = Array.from({ length: a.length + 1 }, () =>
      Array.from({ length: b.length + 1 }, (_, i) => i)
    );

    for (let i = 1; i <= a.length; i++) {
      matrix[i][0] = i;
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    return matrix[a.length][b.length];
  },

  /**
   * Calcula el porcentaje de similitud entre dos strings (0 a 1)
   */
  similarity: (a: string, b: string): number => {
    const distance = TextUtils.levenshteinDistance(a.toLowerCase(), b.toLowerCase());
    const maxLength = Math.max(a.length, b.length);
    if (maxLength === 0) return 1;
    return 1 - distance / maxLength;
  },

  /**
   * Limpieza básica de strings para comparación
   */
  clean: (text: string): string => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
      .replace(/[^a-z0-9\s]/g, "") // Quitar símbolos
      .trim();
  }
};
