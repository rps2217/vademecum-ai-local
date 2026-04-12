import React, { useState, useEffect, useRef } from 'react';
import { Globe, Database, Play, Square, FileCode2, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Terminal } from 'lucide-react';
import { GeminiService } from '../../services/GeminiService';
import { Product, SafetyStatus } from '../../core/types/product.types';
import { getDB } from '../../core/database/db';

export const BatchScraper: React.FC = () => {
  const [targetUrl, setTargetUrl] = useState('');
  const [logs, setLogs] = useState<{time: string, text: string, type: 'info'|'success'|'error'}[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  const isRunningRef = useRef(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (text: string, type: 'info'|'success'|'error' = 'info') => {
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
      // 1. Obtener HTML de la categoría
      addLog(`Conectando a: ${targetUrl}`, 'info');
      const catRes = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`);
      const catData = await catRes.json();
      
      if (!catData.contents) throw new Error(`Error del proxy: No se pudo obtener el contenido`);
      addLog('Página descargada correctamente. Buscando productos...', 'success');

      // 2. Extraer enlaces
      const parser = new DOMParser();
      const doc = parser.parseFromString(catData.contents, 'text/html');
      const anchors = Array.from(doc.querySelectorAll('a'));
      
      let links = anchors
        .map(a => a.getAttribute('href')) // Usar getAttribute para obtener la ruta relativa real, no la resuelta por el navegador
        .filter(href => href && !href.startsWith('#') && !href.startsWith('javascript:') && !href.includes('cdn-cgi')) // Ignorar basura y cloudflare
        .map(href => {
          try {
            // Resolver la URL relativa contra la URL objetivo real (Farmacias Knop)
            return new URL(href!, targetUrl).href;
          } catch { 
            return ''; 
          }
        })
        .filter(href => href !== '')
        // Heurística mejorada para detectar productos (incluye Shopify /products/)
        .filter(href => href.includes('/p/') || href.includes('/producto/') || href.includes('/products/') || href.match(/\d{4,}/) || href.includes('-p-'));
      
      links = [...new Set(links)]; // Únicos
      
      if (links.length === 0) {
        throw new Error('No se encontraron enlaces de productos. Intenta con otra URL o ajusta los filtros.');
      }
      
      addLog(`Se encontraron ${links.length} productos potenciales.`, 'success');

      const db = await getDB();

      // 3. Procesar cada enlace
      for (let i = 0; i < links.length; i++) {
        if (!isRunningRef.current) {
          addLog('Proceso detenido por el usuario.', 'error');
          break;
        }

        const link = links[i];
        addLog(`[${i+1}/${links.length}] Extrayendo: ${link}`, 'info');
        
        try {
          // Descargar HTML del producto
          const prodRes = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(link)}`);
          const prodData = await prodRes.json();
          
          if (!prodData.contents) {
            addLog(`Error al descargar HTML del producto`, 'error');
            continue;
          }

          // --- SISTEMA HÍBRIDO AVANZADO: Extracción Quirúrgica + Limpieza ---
          addLog(`Extrayendo metadatos exactos y limpiando página...`, 'info');
          const parser = new DOMParser();
          const doc = parser.parseFromString(prodData.contents, 'text/html');
          
          // 1. Buscar el "Santo Grial" del e-commerce: LD-JSON (Schema.org)
          // Esto nos da el SKU real y el nombre exacto sin que la IA tenga que adivinarlo
          let exactSku = '';
          let exactName = '';
          let exactBrand = '';
          
          doc.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
            try {
              const data = JSON.parse(script.textContent || '{}');
              // A veces es un array de schemas, a veces un objeto
              const schemas = Array.isArray(data) ? data : [data];
              schemas.forEach(schema => {
                if (schema['@type'] === 'Product') {
                  if (schema.sku) exactSku = schema.sku;
                  if (schema.name) exactName = schema.name;
                  if (schema.brand && schema.brand.name) exactBrand = schema.brand.name;
                }
              });
            } catch (e) { /* Ignorar errores de parseo JSON */ }
          });

          // 2. Si no hay LD-JSON, buscar en selectores clásicos de Shopify/Knop
          if (!exactName) {
            const h1 = doc.querySelector('h1');
            if (h1) exactName = h1.textContent?.trim() || '';
          }
          if (!exactSku) {
            const skuEl = doc.querySelector('.sku, [data-sku], [itemprop="sku"], .product-single__sku');
            if (skuEl) exactSku = skuEl.textContent?.trim() || '';
          }

          // 3. Eliminar basura visual, menús y código innecesario
          const elementsToRemove = [
            'script', 'style', 'nav', 'footer', 'header', 'noscript', 'iframe', 'svg', 
            '.menu', '.sidebar', '#shopify-section-header', '#shopify-section-footer',
            '[role="navigation"]', '.cart', '.checkout', '.related-products', '.product-recommendations'
          ];
          elementsToRemove.forEach(selector => {
            doc.querySelectorAll(selector).forEach(el => el.remove());
          });

          // 4. Enfocar en el contenido principal (Descripción, Tabs de ingredientes, etc.)
          // Farmacias Knop usa mucho .rte (Rich Text Editor) y .tabs
          const mainContent = doc.querySelector('.product-single__description') || doc.querySelector('.rte') || doc.querySelector('main') || doc.body;
          
          // 5. Extraer solo el texto limpio
          let cleanText = mainContent.textContent || (mainContent as HTMLElement).innerText || '';
          cleanText = cleanText.replace(/\s+/g, ' ').trim(); // Quitar saltos de línea y espacios extra

          // Analizar con Gemini (ahora recibe datos pre-digeridos y texto limpio)
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

          // Intentar usar el SKU real, si no, generar uno
          const realSku = productData.sku && String(productData.sku).trim().length > 1 ? String(productData.sku).trim() : null;
          const finalSku = realSku || 'SCR-' + Date.now().toString().slice(-6) + '-' + Math.floor(Math.random() * 1000);

          // Crear objeto Product completo
          const newProduct: Product = {
            sku: finalSku,
            nombre_comercial: productData.nombre_comercial,
            descripcion: productData.descripcion || 'Sin descripción',
            principios_activos: productData.principios_activos || [],
            posologia: productData.posologia || 'Consultar al médico',
            indicaciones: productData.indicaciones || [],
            advertencias: productData.advertencias || 'Sin advertencias específicas',
            tags_ia: productData.tags_ia || [],
            vectores: [],
            apto_embarazo: (productData.apto_embarazo as SafetyStatus) || SafetyStatus.PRECAUCION,
            apto_lactancia: (productData.apto_lactancia as SafetyStatus) || SafetyStatus.PRECAUCION,
            apto_pediatria: (productData.apto_pediatria as SafetyStatus) || SafetyStatus.PRECAUCION,
            apto_diabeticos: (productData.apto_diabeticos as SafetyStatus) || SafetyStatus.PRECAUCION,
            apto_hipertensos: (productData.apto_hipertensos as SafetyStatus) || SafetyStatus.PRECAUCION,
            apto_celiacos: (productData.apto_celiacos as SafetyStatus) || SafetyStatus.PRECAUCION,
            sugerencia_complementaria: productData.sugerencia_complementaria || '',
            skus_relacionados: [],
            source_url: link
          };

          // 1. Guardar en Base de Datos Local (IndexedDB)
          await db.put('products', newProduct);
          addLog(`💾 Guardado en base de datos local: ${newProduct.nombre_comercial}`, 'success');

        } catch (err: any) {
          addLog(`❌ Error en producto: ${err.message}`, 'error');
        }
        
        // Pausa estricta para no saturar los límites de Gemini (15 RPM = 1 cada 4 segundos, usamos 10s para estar seguros)
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

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-xl">
            <Database className="w-6 h-6 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Scraper de Farmacias</h1>
        </div>
        <p className="text-slate-400 text-lg">
          Extrae datos de farmacias y guárdalos directamente en tu base de datos local.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Panel de Configuración */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Formulario */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                URL de la Farmacia a Escanear
              </label>
              <input 
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://farmacia.com/categoria/analgesicos"
                className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
              />
            </div>

            {isRunning ? (
              <button 
                onClick={stopScraping}
                className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
              >
                <Square className="w-5 h-5" /> Detener Proceso
              </button>
            ) : (
              <button 
                onClick={startScraping}
                disabled={!targetUrl}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
              >
                <Play className="w-5 h-5" /> Iniciar Scraping
              </button>
            )}
          </div>
        </div>

        {/* Terminal / Logs */}
        <div className="lg:col-span-7 bg-[#0D1117] rounded-2xl border border-slate-800 flex flex-col overflow-hidden h-[600px]">
          <div className="flex items-center gap-2 px-4 py-3 bg-slate-900/50 border-b border-slate-800">
            <Terminal className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-mono text-slate-300">Terminal de Scraping</span>
            <div className="ml-auto flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
            </div>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-2 custom-scrollbar">
            {logs.length === 0 ? (
              <div className="text-slate-600 italic">Esperando inicio de proceso...</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-slate-600 shrink-0">[{log.time}]</span>
                  <span className={`
                    ${log.type === 'error' ? 'text-red-400' : ''}
                    ${log.type === 'success' ? 'text-emerald-400' : ''}
                    ${log.type === 'info' ? 'text-slate-300' : ''}
                  `}>
                    {log.text}
                  </span>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>

      </div>
    </div>
  );
};

