import React, { useState, useEffect, useRef } from 'react';
import { Globe, Database, Play, Square, FileCode2, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Terminal } from 'lucide-react';
import { GeminiService } from '../../services/GeminiService';

const GAS_SCRIPT = `function doGet(e) {
  if (e.parameter.action === 'scrape') {
    try {
      var response = UrlFetchApp.fetch(e.parameter.url, { muteHttpExceptions: true });
      return ContentService.createTextOutput(JSON.stringify({ 
        success: true, 
        html: response.getContentText() 
      })).setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput("API Activa");
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Fecha', 'Nombre', 'Principio Activo', 'Clase', 'Indicaciones', 'Dosis', 'Efectos Secundarios', 'Advertencias', 'Seguridad', 'URL']);
      sheet.getRange("A1:J1").setFontWeight("bold").setBackground("#f3f4f6");
    }
    
    sheet.appendRow([
      new Date().toISOString(),
      data.name || '',
      data.activePrinciple || '',
      data.therapeuticClass || '',
      (data.indications || []).join(', '),
      data.dosage || '',
      (data.sideEffects || []).join(', '),
      (data.warnings || []).join(', '),
      data.safetyStatus || '',
      data.sourceUrl || ''
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

export const BatchScraper: React.FC = () => {
  const [gasUrl, setGasUrl] = useState(() => localStorage.getItem('gas_sheets_url') || '');
  const [targetUrl, setTargetUrl] = useState('');
  const [logs, setLogs] = useState<{time: string, text: string, type: 'info'|'success'|'error'}[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showInstructions, setShowInstructions] = useState(!gasUrl);
  
  const isRunningRef = useRef(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('gas_sheets_url', gasUrl);
  }, [gasUrl]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (text: string, type: 'info'|'success'|'error' = 'info') => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text, type }]);
  };

  const startScraping = async () => {
    if (!gasUrl || !targetUrl) {
      addLog('Falta la URL del script o la URL objetivo.', 'error');
      return;
    }

    setIsRunning(true);
    isRunningRef.current = true;
    setLogs([]);
    addLog('Iniciando motor de scraping distribuido...', 'info');

    try {
      // 1. Obtener HTML de la categoría
      addLog(`Conectando a: ${targetUrl}`, 'info');
      const catRes = await fetch(`${gasUrl}?action=scrape&url=${encodeURIComponent(targetUrl)}`);
      const catData = await catRes.json();
      
      if (!catData.success) throw new Error(`Error del proxy: ${catData.error}`);
      addLog('Página descargada correctamente. Buscando productos...', 'success');

      // 2. Extraer enlaces
      const parser = new DOMParser();
      const doc = parser.parseFromString(catData.html, 'text/html');
      const anchors = Array.from(doc.querySelectorAll('a'));
      
      let links = anchors
        .map(a => a.href)
        .filter(href => href && href.startsWith('http'))
        // Heurística básica para detectar productos (ajustable según la farmacia)
        .filter(href => href.includes('/p/') || href.includes('/producto/') || href.match(/\d{4,}/) || href.includes('-p-'));
      
      // Limpiar URLs relativas que el DOMParser resolvió mal si la base no estaba
      links = links.map(link => {
        try {
          return new URL(link, targetUrl).href;
        } catch { return link; }
      });

      links = [...new Set(links)]; // Únicos
      
      if (links.length === 0) {
        throw new Error('No se encontraron enlaces de productos. Intenta con otra URL o ajusta los filtros.');
      }
      
      addLog(`Se encontraron ${links.length} productos potenciales.`, 'success');

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
          const prodRes = await fetch(`${gasUrl}?action=scrape&url=${encodeURIComponent(link)}`);
          const prodData = await prodRes.json();
          
          if (!prodData.success) {
            addLog(`Error al descargar HTML: ${prodData.error}`, 'error');
            continue;
          }

          // Analizar con Gemini
          addLog(`Analizando estructura médica con IA...`, 'info');
          const prompt = `Extrae la información médica de este producto farmacéutico a partir del siguiente HTML.
          Devuelve un JSON estricto con esta estructura:
          {
            "name": "Nombre del producto",
            "activePrinciple": "Principio activo",
            "therapeuticClass": "Clase terapéutica",
            "indications": ["indicacion 1"],
            "dosage": "Dosis",
            "sideEffects": ["efecto 1"],
            "warnings": ["advertencia 1"],
            "safetyStatus": "safe" o "caution" o "danger"
          }
          HTML: ${prodData.html.substring(0, 15000)}`;
          
          const jsonStr = await GeminiService.generateJSON(prompt);
          const productInfo = JSON.parse(jsonStr);
          productInfo.sourceUrl = link;

          if (!productInfo.name) throw new Error("La IA no pudo identificar el producto.");

          // Guardar en Google Sheets
          addLog(`Guardando "${productInfo.name}" en Google Sheets...`, 'info');
          const saveRes = await fetch(gasUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // text/plain evita el preflight CORS
            body: JSON.stringify(productInfo)
          });
          
          const saveData = await saveRes.json();
          if (saveData.success) {
            addLog(`✅ Guardado exitosamente: ${productInfo.name}`, 'success');
          } else {
            throw new Error(saveData.error);
          }

        } catch (err: any) {
          addLog(`❌ Error en producto: ${err.message}`, 'error');
        }
        
        // Pausa para no saturar los límites de Google Apps Script / Gemini
        await new Promise(r => setTimeout(r, 2000));
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
          <h1 className="text-3xl font-bold text-white">Google Sheets Scraper</h1>
        </div>
        <p className="text-slate-400 text-lg">
          Extrae datos de farmacias y guárdalos directamente en Google Sheets. Funciona en Vercel y Localhost sin problemas de CORS.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Panel de Configuración */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Instrucciones */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <button 
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-2 font-medium text-slate-200">
                <FileCode2 className="w-5 h-5 text-indigo-400" />
                Instrucciones de Configuración
              </div>
              {showInstructions ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </button>
            
            {showInstructions && (
              <div className="p-5 space-y-4 text-sm text-slate-300">
                <p>Para saltar los bloqueos de Vercel y guardar datos, usaremos Google Apps Script como puente y base de datos.</p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Crea un nuevo <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">Google Sheet</a>.</li>
                  <li>Ve a <strong>Extensiones &gt; Apps Script</strong>.</li>
                  <li>Borra el código que haya y pega este:</li>
                </ol>
                
                <div className="relative group">
                  <pre className="bg-slate-950 p-4 rounded-xl overflow-x-auto text-[11px] font-mono text-slate-400 border border-slate-800 max-h-48 custom-scrollbar">
                    {GAS_SCRIPT}
                  </pre>
                  <button 
                    onClick={() => navigator.clipboard.writeText(GAS_SCRIPT)}
                    className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Copiar
                  </button>
                </div>

                <ol className="list-decimal pl-5 space-y-2" start={4}>
                  <li>Haz clic en <strong>Implementar &gt; Nueva implementación</strong>.</li>
                  <li>Tipo: <strong>Aplicación web</strong>.</li>
                  <li>Acceso: <strong>Cualquier persona</strong>.</li>
                  <li>Copia la <strong>URL de la aplicación web</strong> y pégala abajo.</li>
                </ol>
              </div>
            )}
          </div>

          {/* Formulario */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                1. URL de Google Apps Script
              </label>
              <input 
                type="url"
                value={gasUrl}
                onChange={(e) => setGasUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                2. URL de la Farmacia a Escanear
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
                disabled={!gasUrl || !targetUrl}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
              >
                <Play className="w-5 h-5" /> Iniciar Scraping a Sheets
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

