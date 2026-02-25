// Worker para extraer HTML en segundo plano sin bloquear la UI
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://thingproxy.freeboard.io/fetch/'
];

// Función auxiliar para reintentos con exponential backoff y rotación de proxies
async function fetchWithRetry(url: string, maxRetries = 3): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    // Rotar proxies en cada intento
    const proxy = CORS_PROXIES[i % CORS_PROXIES.length];
    const targetUrl = proxy + encodeURIComponent(url);
    
    try {
      const res = await fetch(targetUrl);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.text();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Esperar 2s, 4s, 8s...
      const delay = Math.pow(2, i) * 1000;
      self.postMessage({ type: 'LOG', message: `Reintentando con proxy alternativo (${i + 1}/${maxRetries})...` });
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries reached');
}

self.onmessage = async (e) => {
  const { type, payload } = e.data;

  if (type === 'FETCH_CATEGORY') {
    try {
      const url = payload.url;
      self.postMessage({ type: 'LOG', message: `Explorando categoría...` });
      
      const html = await fetchWithRetry(url);
      self.postMessage({ type: 'CATEGORY_HTML', payload: { html, url } });
    } catch (error: any) {
      self.postMessage({ type: 'ERROR', message: `Fallo al acceder a categoría: ${error.message}` });
    }
  } 
  
  else if (type === 'FETCH_PRODUCT') {
    try {
      const url = payload.url;
      const html = await fetchWithRetry(url);
      self.postMessage({ type: 'PRODUCT_HTML', payload: { html, url } });
    } catch (error: any) {
      self.postMessage({ type: 'ERROR', message: `Fallo al acceder al producto: ${error.message}` });
    }
  }
};
