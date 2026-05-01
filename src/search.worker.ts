
// search.worker.ts
import { SearchService } from './services/SearchService';

self.onmessage = async (e) => {
  const { type, query, pathologies, products } = e.data;

  if (type === 'INITIALIZE') {
    // Podríamos inicializar algo aquí si fuera necesario
    self.postMessage({ type: 'READY' });
  }

  if (type === 'SEARCH') {
    try {
      // Nota: El worker necesita su propia instancia de lógica o recibir el índice
      // Para este entorno, simplificaremos enviando los resultados procesados 
      // o ejecutando la lógica aquí si las dependencias lo permiten.
      // Dado que SearchService depende de DOM/LocalStorage, haremos una versión ligera.
      
      const results = await SearchService.search(query, pathologies);
      self.postMessage({ type: 'SEARCH_RESULTS', results });
    } catch (error) {
      self.postMessage({ type: 'ERROR', error: (error as Error).message });
    }
  }
};
