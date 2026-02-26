// Worker para extraer HTML en segundo plano sin bloquear la UI
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://thingproxy.freeboard.io/fetch/',
  'https://api.codetabs.com/v1/proxy?quest='
];

// Función auxiliar para reintentos con exponential backoff y rotación de proxies
async function fetchWithRetry(url: string, maxRetries = 5): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    // Rotar proxies en cada intento
    const proxy = CORS_PROXIES[i % CORS_PROXIES.length];
    const targetUrl = proxy + encodeURIComponent(url);
    
    try {
      const res = await fetch(targetUrl);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.text();
    } catch (error: any) {
      const isLastAttempt = i === maxRetries - 1;
      const errorMsg = `Proxy ${i + 1}/${maxRetries} (${new URL(proxy).hostname}) falló: ${error.message}`;
      
      self.postMessage({ type: 'LOG', message: errorMsg });
      
      if (isLastAttempt) throw new Error(`Todos los proxies fallaron. Último error: ${error.message}`);
      
      // Esperar 2s, 4s, 8s...
      const delay = Math.pow(2, i) * 1000;
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

  else if (type === 'TEST_CONNECTION') {
    try {
      // Intentamos conectar a una URL simple y confiable a través del proxy
      // Usamos google.com porque es rápido y siempre está arriba
      const testUrl = 'https://www.google.com'; 
      const html = await fetchWithRetry(testUrl, 3); // Solo 3 intentos para el test
      
      if (html && html.length > 0) {
        self.postMessage({ type: 'TEST_RESULT', payload: { success: true, message: 'Conexión a través de proxy exitosa.' } });
      } else {
        throw new Error('Respuesta vacía');
      }
    } catch (error: any) {
      self.postMessage({ type: 'TEST_RESULT', payload: { success: false, message: `Fallo en prueba de conexión: ${error.message}` } });
    }
  }
};
