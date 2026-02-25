// Worker para extraer HTML en segundo plano sin bloquear la UI
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

self.onmessage = async (e) => {
  const { type, payload } = e.data;

  if (type === 'FETCH_CATEGORY') {
    try {
      const url = payload.url;
      self.postMessage({ type: 'LOG', message: `Explorando categoría...` });
      
      const res = await fetch(CORS_PROXY + encodeURIComponent(url) + `&t=${Date.now()}`);
      if (!res.ok) throw new Error('Error de red al acceder a la categoría');
      
      const html = await res.text();
      self.postMessage({ type: 'CATEGORY_HTML', payload: { html, url } });
    } catch (error: any) {
      self.postMessage({ type: 'ERROR', message: error.message });
    }
  } 
  
  else if (type === 'FETCH_PRODUCT') {
    try {
      const url = payload.url;
      const res = await fetch(CORS_PROXY + encodeURIComponent(url) + `&t=${Date.now()}`);
      if (!res.ok) throw new Error('Error de red al acceder al producto');
      
      const html = await res.text();
      self.postMessage({ type: 'PRODUCT_HTML', payload: { html, url } });
    } catch (error: any) {
      self.postMessage({ type: 'ERROR', message: error.message });
    }
  }
};
