export const formatArrayToString = (arr: any[] | undefined | null, separator: string = ', '): string => {
  if (!Array.isArray(arr)) return '';
  return arr.map(item => {
    if (typeof item === 'string') return item;
    if (typeof item === 'object' && item !== null) {
      return item.nombre || item.tipo || item.indicacion || item.name || JSON.stringify(item);
    }
    return String(item);
  }).join(separator);
};
