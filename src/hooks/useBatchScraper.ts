import { useState, useRef, useEffect } from 'react';
import { GeminiService } from '../services/GeminiService';
import { DataService } from '../services/DataService';
import { Product, SafetyStatus } from '../core/types/product.types';

export interface Log {
  time: string;
  text: string;
  type: 'info' | 'success' | 'error';
}

export const useBatchScraper = () => {
  const [targetUrl, setTargetUrl] = useState('');
  const [logs, setLogs] = useState<Log[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  const isRunningRef = useRef(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (text: string, type: 'info' | 'success' | 'error' = 'info') => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text, type }]);
  };

  const startScraping = async () => {
    if (!targetUrl) {
      addLog('Falta la URL objetivo.', 'error');
      return;
    }

    setIsRunning(true);
    isRunningRef.current = true;
    setLogs([]);
    addLog('Iniciando motor de scraping distribuido...', 'info');

    try {
      addLog(`Conectando a: ${targetUrl}`, 'info');
      const catRes = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`);
      const catData = await catRes.json();
      
      if (!catData.contents) throw new Error(`Error del proxy: No se pudo obtener el contenido`);
      addLog('Página descargada correctamente. Buscando productos...', 'success');

      const parser = new DOMParser();
      const doc = parser.parseFromString(catData.contents, 'text/html');
      const anchors = Array.from(doc.querySelectorAll('a'));
      
      let links = anchors
        .map(a => a.getAttribute('href'))
        .filter(href => href && !href.startsWith('#') && !href.startsWith('javascript:') && !href.includes('cdn-cgi'))
        .map(href => {
          try {
            return new URL(href!, targetUrl).href;
          } catch { 
            return ''; 
          }
        })
        .filter(href => href !== '')
        .filter(href => href.includes('/p/') || href.includes('/producto/') || href.includes('/products/') || href.match(/\d{4,}/) || href.includes('-p-'));
      
      links = [...new Set(links)];
      
      if (links.length === 0) {
        throw new Error('No se encontraron enlaces de productos. Intenta con otra URL o ajusta los filtros.');
      }
      
      addLog(`Se encontraron ${links.length} productos potenciales.`, 'success');

      for (let i = 0; i < links.length; i++) {
        if (!isRunningRef.current) {
          addLog('Proceso detenido por el usuario.', 'error');
          break;
        }

        const link = links[i];
        addLog(`[${i+1}/${links.length}] Extrayendo: ${link}`, 'info');
        
        try {
          const prodRes = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(link)}`);
          const prodData = await prodRes.json();
          
          if (!prodData.contents) {
            addLog(`Error al descargar HTML del producto`, 'error');
            continue;
          }

          addLog(`Extrayendo metadatos exactos y limpiando página...`, 'info');
          const parser = new DOMParser();
          const doc = parser.parseFromString(prodData.contents, 'text/html');
          
          let exactSku = '';
          let exactName = '';
          let exactBrand = '';
          
          doc.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
            try {
              const data = JSON.parse(script.textContent || '{}');
              const schemas = Array.isArray(data) ? data : [data];
              schemas.forEach(schema => {
                if (schema['@type'] === 'Product') {
                  if (schema.sku) exactSku = schema.sku;
                  if (schema.name) exactName = schema.name;
                  if (schema.brand && schema.brand.name) exactBrand = schema.brand.name;
                }
              });
            } catch (e) { }
          });

          if (!exactName) {
            const h1 = doc.querySelector('h1');
            if (h1) exactName = h1.textContent?.trim() || '';
          }
          if (!exactSku) {
            const skuEl = doc.querySelector('.sku, [data-sku], [itemprop="sku"], .product-single__sku');
            if (skuEl) exactSku = skuEl.textContent?.trim() || '';
          }

          const elementsToRemove = [
            'script', 'style', 'nav', 'footer', 'header', 'noscript', 'iframe', 'svg', 
            '.menu', '.sidebar', '#shopify-section-header', '#shopify-section-footer',
            '[role="navigation"]', '.cart', '.checkout', '.related-products', '.product-recommendations'
          ];
          elementsToRemove.forEach(selector => {
            doc.querySelectorAll(selector).forEach(el => el.remove());
          });

          const mainContent = doc.querySelector('.product-single__description') || doc.querySelector('.rte') || doc.querySelector('main') || doc.body;
          let cleanText = mainContent.textContent || (mainContent as HTMLElement).innerText || '';
          cleanText = cleanText.replace(/\s+/g, ' ').trim();

          addLog(`Analizando estructura médica con IA...`, 'info');
          const prompt = `Actúa como un experto farmacólogo. Extrae la información médica de este producto a partir de los siguientes datos extraídos de su página web.
          
          DATOS EXACTOS EXTRAÍDOS POR SCRIPT:
          - Nombre Comercial: ${exactName || 'No encontrado, búscalo en el texto'}
          - SKU / Código: ${exactSku || 'No encontrado, búscalo en el texto'}
          - Marca: ${exactBrand || 'No encontrada'}

          TEXTO DE LA DESCRIPCIÓN DEL PRODUCTO:
          ${cleanText.substring(0, 8000)}

          Devuelve un JSON estricto con esta estructura. Usa los "DATOS EXACTOS" si están disponibles, y usa el "TEXTO" para deducir el resto (posología, advertencias, etc.):
          {
            "sku": "SKU o Código del producto",
            "nombre_comercial": "Nombre comercial y presentación",
            "descripcion": "Descripción breve del producto",
            "principios_activos": ["principio activo 1", "principio activo 2"],
            "posologia": "Dosis recomendada general",
            "indicaciones": ["indicación 1", "indicación 2"],
            "advertencias": "Advertencias y contraindicaciones",
            "tags_ia": ["etiqueta 1", "etiqueta 2"],
            "categoria_principal": "Belleza" o "Medicamento" o "Suplemento" o "Homeopatía" o "Otro",
            "analisis_componentes": "Análisis de la función de cada componente en la formulación",
            "apto_embarazo": "SI" o "NO" o "PRECAUCION",
            "apto_lactancia": "SI" o "NO" o "PRECAUCION",
            "apto_pediatria": "SI" o "NO" o "PRECAUCION",
            "apto_diabeticos": "SI" o "NO" o "PRECAUCION",
            "apto_hipertensos": "SI" o "NO" o "PRECAUCION",
            "apto_celiacos": "SI" o "NO" o "PRECAUCION",
            "sugerencia_complementaria": "Sugerencia de producto complementario"
          }`;
          
          const jsonStr = await GeminiService.generateJSON(prompt);
          const productData = JSON.parse(jsonStr);

          if (!productData.nombre_comercial) throw new Error("La IA no pudo identificar el producto.");

          const realSku = productData.sku && String(productData.sku).trim().length > 1 ? String(productData.sku).trim() : null;
          const finalSku = realSku || 'SCR-' + Date.now().toString().slice(-6) + '-' + Math.floor(Math.random() * 1000);

          const newProduct: Product = {
            sku: finalSku,
            nombre_comercial: productData.nombre_comercial,
            descripcion: productData.descripcion || 'Sin descripción',
            principios_activos: productData.principios_activos || [],
            posologia: productData.posologia || 'Consultar al médico',
            indicaciones: productData.indicaciones || [],
            advertencias: productData.advertencias || 'Sin advertencias específicas',
            tags_ia: productData.tags_ia || [],
            categoria_principal: productData.categoria_principal || 'Otro',
            analisis_componentes: productData.analisis_componentes || '',
            vectores: [],
            apto_embarazo: (productData.apto_embarazo as SafetyStatus) || SafetyStatus.PRECAUCION,
            apto_lactancia: (productData.apto_lactancia as SafetyStatus) || SafetyStatus.PRECAUCION,
            apto_pediatria: (productData.apto_pediatria as SafetyStatus) || SafetyStatus.PRECAUCION,
            apto_diabeticos: (productData.apto_diabeticos as SafetyStatus) || SafetyStatus.PRECAUCION,
            apto_hipertensos: (productData.apto_hipertensos as SafetyStatus) || SafetyStatus.PRECAUCION,
            apto_celiacos: (productData.apto_celiacos as SafetyStatus) || SafetyStatus.PRECAUCION,
            sugerencia_complementaria: productData.sugerencia_complementaria || '',
            skus_relacionados: [],
            source_url: link,
            last_updated: Date.now()
          };

          await DataService.saveProduct(newProduct);
          addLog(`💾 Guardado en base de datos: ${newProduct.nombre_comercial}`, 'success');

        } catch (err: any) {
          addLog(`❌ Error en producto: ${err.message}`, 'error');
        }
        
        addLog(`Esperando 10 segundos para no saturar la cuota de IA...`, 'info');
        await new Promise(r => setTimeout(r, 10000));
      }
      
      addLog('🎉 Proceso de scraping finalizado.', 'success');
    } catch (err: any) {
      addLog(`❌ Error crítico: ${err.message}`, 'error');
    } finally {
      setIsRunning(false);
      isRunningRef.current = false;
    }
  };

  const stopScraping = () => {
    isRunningRef.current = false;
    setIsRunning(false);
    addLog('Deteniendo proceso...', 'info');
  };

  return {
    targetUrl,
    setTargetUrl,
    logs,
    isRunning,
    logsEndRef,
    startScraping,
    stopScraping
  };
};
