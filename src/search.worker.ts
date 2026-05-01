
// search.worker.ts
import { searchService } from './services/SearchService';

self.onmessage = async (e) => {
  const { type, query, pathologies } = e.data;

  if (type === 'INITIALIZE') {
    self.postMessage({ type: 'READY' });
  }

  if (type === 'SEARCH') {
    try {
      const results = await searchService.search(query, pathologies);
      self.postMessage({ type: 'SEARCH_RESULTS', results });
    } catch (error) {
      self.postMessage({ type: 'ERROR', error: (error as Error).message });
    }
  }
};
