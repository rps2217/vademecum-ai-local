import React, { useState, useEffect } from 'react';
import { Globe, Search, Loader2, CheckCircle, AlertCircle, Save, Sparkles, Copy, Trash2, Link, Play, Pause, X, Activity } from 'lucide-react';
import { AIService } from '../../services/AIService';
import { GeminiService } from '../../services/GeminiService';
import { Product, SafetyStatus } from '../../core/types/product.types';
import { getDB } from '../../core/database/db';
import { useHardwareDetection } from '../../hooks/useHardwareDetection';

interface ScrapedLink {
  text: string;
  href: string;
  status: 'pending' | 'processing' | 'success' | 'error' | 'skipped';
  productName?: string;
  method?: 'vtex' | 'gemini' | 'local' | 'search';
}

export const BatchScraper: React.FC = () => {
  const { hardware } = useHardwareDetection();
  const [categoryUrl, setCategoryUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [useSearchMode, setUseSearchMode] = useState(false);
  const [links, setLinks] = useState<ScrapedLink[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<{ text: string; progress: number }>({ text: '', progress: 0 });

  useEffect(() => {
    if (hardware) {
      AIService.configure(hardware);
    }
  }, [hardware]);

  const handleScan = async () => {
    if (!categoryUrl.trim()) return;
    
    setIsScanning(true);
    setError(null);
    setLinks([]);
    
    try {
      const response = await fetch(`/api/scrape?url=${encodeURIComponent(categoryUrl)}`);
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Respuesta no-JSON del servidor:", text);
        throw new Error(`Error del servidor (No JSON): ${text.substring(0, 100)}...`);
      }

      const data = await response.json();
      
      if (data.success && data.links) {
        // Filtrar enlaces irrelevantes
        const relevantLinks = data.links.filter((l: any) => {
            const text = l.text.toLowerCase().trim();
            const href = l.href.toLowerCase().trim();
            
            const forbiddenKeywords = [
                'inicio', 'home', 'portada', 'contacto', 'login', 'registro', 
                'carrito', 'mapa', 'política', 'aviso', 'términos', 'condiciones', 
                'ayuda', 'faq', 'blog', 'nosotros', 'quienes', 'sucursales', 
                'tiendas', 'mi cuenta', 'ver más', 'leer más', 'click aquí', 'despacho'
            ];
            if (forbiddenKeywords.some(k => text === k || text.includes(k))) return false;
            if (text.length < 4 || /^\d+$/.test(text)) return false;
            if (href === categoryUrl || href === categoryUrl + '/') return false;
            
            try {
                const urlObj = new URL(l.href);
                if (urlObj.pathname === '/' || urlObj.pathname === '') return false;
                const categoryDomain = new URL(categoryUrl).hostname;
                if (urlObj.hostname !== categoryDomain) return false;
            } catch(e) { return false; }

            return true;
        }).map((l: any) => ({ ...l, status: 'pending' }));

        const uniqueLinks = Array.from(new Map(relevantLinks.map(item => [item.href, item])).values()) as ScrapedLink[];

        setLinks(uniqueLinks);
        if (uniqueLinks.length === 0) setError('No se encontraron enlaces de productos válidos.');
      } else {
        throw new Error(data.error || 'Error al escanear la categoría.');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setIsScanning(false);
    }
  };

  const processNextLink = async () => {
    const nextIndex = links.findIndex(l => l.status === 'pending');
    if (nextIndex === -1 || !isProcessing) {
        setIsProcessing(false);
        return;
    }

    setLinks(prev => prev.map((l, i) => i === nextIndex ? { ...l, status: 'processing' } : l));
    const link = links[nextIndex];

    try {
        // 1. Fetch Product Page (Markdown)
        setAiStatus({ text: `Descargando: ${link.text}...`, progress: 10 });
        
        let data: any = { success: false };
        let product: Product | null = null;
        let method: 'vtex' | 'gemini' | 'local' | 'search' = 'local';

        try {
            const response = await fetch(`/api/scrape?url=${encodeURIComponent(link.href)}`);
            data = await response.json();
        } catch (fetchError) {
            console.warn(`[Scraper] Falló scraping directo para ${link.href}, intentando búsqueda...`);
        }

        if (!data.success || useSearchMode) {
            // ESTRATEGIA: Google Search Grounding (Evita bloqueos de scraping)
            setAiStatus({ text: `Usando Google Search para: ${link.text}...`, progress: 40 });
            product = await GeminiService.searchAndExtractProduct(link.text, link.href);
            if (product) method = 'search';
        }

        if (!product && data.success) {
            // 2. Extraction Strategy (Normal)
            if (data.productData) {
                setAiStatus({ text: `Usando datos estructurados para: ${link.text}...`, progress: 50 });
                method = 'vtex';
                product = {
                    sku: data.productData.sku || "VTEX-" + Date.now().toString().slice(-6),
                    nombre_comercial: data.productData.name || link.text,
                    descripcion: data.productData.description || "Sin descripción",
                    principios_activos: [],
                    posologia: "Consultar prospecto",
                    indicaciones: [],
                    advertencias: "Datos extraídos de fuente estructurada",
                    tags_ia: ["vtex_direct"],
                    apto_embarazo: SafetyStatus.PRECAUCION,
                    apto_lactancia: SafetyStatus.PRECAUCION,
                    apto_pediatria: SafetyStatus.PRECAUCION,
                    apto_diabeticos: SafetyStatus.PRECAUCION,
                    apto_hipertensos: SafetyStatus.PRECAUCION,
                    apto_celiacos: SafetyStatus.PRECAUCION,
                    sugerencia_complementaria: "Verificar datos manualmente",
                    vectores: [],
                    skus_relacionados: [],
                    source_url: link.href
                };
                
                // Si faltan datos clave, usar Gemini para completar
                if (!product.descripcion || product.descripcion.length < 100) {
                    setAiStatus({ text: `Completando con Gemini: ${link.text}...`, progress: 70 });
                    const geminiProduct = await GeminiService.extractProductFromMarkdown(data.markdown, link.href);
                    if (geminiProduct) {
                        product = { ...product, ...geminiProduct, sku: product.sku };
                        method = 'gemini';
                    }
                }
            } else {
                // Intentar Gemini primero (Alta Precisión)
                setAiStatus({ text: `Extrayendo con Gemini (Alta Precisión): ${link.text}...`, progress: 50 });
                product = await GeminiService.extractProductFromMarkdown(data.markdown, link.href);
                
                if (product) {
                  method = 'gemini';
                } else {
                  // Fallback a Local AI
                  setAiStatus({ text: `Iniciando IA Local...`, progress: 60 });
                  
                  // Suscribirse al progreso de la IA local para mostrarlo en el scraper
                  AIService.setProgressCallback((text, progress) => {
                    setAiStatus({ text: `IA Local: ${text}`, progress: 60 + (progress * 0.4) });
                  });

                  await AIService.startEngine();
                  product = await AIService.extractProductData(data.markdown, link.href);
                  method = 'local';
                }
            }
        }

        if (product && product.nombre_comercial !== 'Producto Desconocido') {
            // 3. Generate Embedding for Semantic Search
            setAiStatus({ text: `Generando firma semántica: ${link.text}...`, progress: 90 });
            await AIService.startEngine();
            const embedding = await AIService.generateEmbedding(`${product.nombre_comercial} ${product.principios_activos.join(' ')} ${product.indicaciones.join(' ')}`);
            product.vectores = embedding;

            // 4. Save to DB
            const db = await getDB();
            const existing = await db.get('products', product.sku);
            if (!existing) {
                await db.put('products', product);
                setLinks(prev => prev.map((l, i) => i === nextIndex ? { 
                  ...l, 
                  status: 'success', 
                  productName: product!.nombre_comercial,
                  method: method
                } : l));
                setProcessedCount(c => c + 1);
            } else {
                setLinks(prev => prev.map((l, i) => i === nextIndex ? { ...l, status: 'skipped', productName: 'Duplicado' } : l));
            }
        } else {
            throw new Error('Datos insuficientes');
        }

    } catch (e) {
        console.error(e);
        setLinks(prev => prev.map((l, i) => i === nextIndex ? { ...l, status: 'error' } : l));
    }

    if (isProcessing) {
      setTimeout(() => processNextLink(), 1000);
    }
  };

  const handleStartBatch = () => {
    setIsProcessing(true);
    processNextLink();
  };

  const handleStopBatch = () => {
    setIsProcessing(false);
  };

  const handleRemoveLink = (index: number) => {
    setLinks(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl mb-4">
          <Globe className="w-8 h-8 text-indigo-400" />
        </div>
        <h2 className="text-3xl font-bold text-white">Scraper Masivo Inteligente</h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Introduce la URL de una categoría o listado de productos. El sistema detectará los enlaces y extraerá la información automáticamente usando IA local.
        </p>
      </header>

      {/* URL Input */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-lg">
        <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-slate-500" />
                </div>
                <input 
                    type="url" 
                    value={categoryUrl}
                    onChange={(e) => setCategoryUrl(e.target.value)}
                    placeholder="https://ejemplo.com/categoria/antibioticos"
                    className="w-full pl-12 pr-4 py-4 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
            </div>
            <button 
                onClick={handleScan}
                disabled={isScanning || !categoryUrl}
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 whitespace-nowrap"
            >
                {isScanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Globe className="w-5 h-5" />}
                Escanear Página
            </button>
            <button 
                onClick={async () => {
                    try {
                        const url = `/health?t=${Date.now()}`;
                        console.log(`Fetching health from: ${url}`);
                        const res = await fetch(url);
                        const contentType = res.headers.get('content-type');
                        
                        if (!res.ok) {
                            const text = await res.text();
                            throw new Error(`Error ${res.status} en ${url}: ${text.substring(0, 50)}...`);
                        }

                        if (!contentType || !contentType.includes('application/json')) {
                            const text = await res.text();
                            throw new Error(`Respuesta no es JSON (${contentType}): ${text.substring(0, 50)}...`);
                        }

                        const data = await res.json();
                        alert(`Conexión exitosa: ${data.status} (${data.timestamp})`);
                    } catch (e: any) {
                        if (confirm(`Error de conexión: ${e.message}\n\n¿Deseas recargar la página para limpiar la conexión?`)) {
                            window.location.reload();
                        }
                    }
                }}
                className="px-4 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                title="Probar conexión con el servidor"
            >
                <Activity className="w-5 h-5" />
            </button>
        </div>
        
        {/* Status Indicators */}
        <div className="mt-4 flex flex-wrap gap-4 items-center">
            <label className="flex items-center gap-2 cursor-pointer group">
                <div className={`relative w-10 h-5 rounded-full transition-colors ${useSearchMode ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                    <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={useSearchMode}
                        onChange={(e) => setUseSearchMode(e.target.checked)}
                    />
                    <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${useSearchMode ? 'translate-x-5' : ''}`} />
                </div>
                <span className="text-xs font-medium text-slate-300 group-hover:text-white transition-colors">
                    Modo Búsqueda (Google Search Grounding)
                </span>
            </label>

            <div className="h-4 w-px bg-slate-800 mx-2" />

            {links.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-medium">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {links.length} enlaces encontrados
                </div>
            )}
            {/* Aquí podríamos añadir un indicador de VTEX si el servidor lo devuelve */}
        </div>

        {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
            </div>
        )}
      </div>

      {/* Results Area */}
      {links.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* List of Links */}
            <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Link className="w-5 h-5 text-indigo-400" />
                        Enlaces Detectados ({links.length})
                    </h3>
                    <div className="flex gap-2">
                        {!isProcessing ? (
                            <button 
                                onClick={handleStartBatch}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                            >
                                <Play className="w-4 h-4" /> Iniciar Proceso
                            </button>
                        ) : (
                            <button 
                                onClick={handleStopBatch}
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                            >
                                <Pause className="w-4 h-4" /> Pausar
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden max-h-[600px] overflow-y-auto">
                    {links.map((link, idx) => (
                        <div key={idx} className={`p-4 border-b border-slate-800 flex items-center justify-between hover:bg-slate-800/50 transition-colors ${
                            link.status === 'processing' ? 'bg-indigo-500/10 border-l-4 border-l-indigo-500' : 
                            link.status === 'success' ? 'bg-emerald-500/5 border-l-4 border-l-emerald-500' :
                            link.status === 'error' ? 'bg-red-500/5 border-l-4 border-l-red-500' : ''
                        }`}>
                            <div className="flex-1 min-w-0 mr-4">
                                <p className="text-sm font-medium text-slate-200 truncate">{link.text}</p>
                                <p className="text-xs text-slate-500 truncate">{link.href}</p>
                                {link.productName && (
                                    <div className="flex items-center gap-2 mt-1">
                                      <p className="text-xs text-emerald-400 font-medium">Detectado: {link.productName}</p>
                                      {link.method && (
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                                          link.method === 'vtex' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                          link.method === 'gemini' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                                          link.method === 'search' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                          'bg-slate-700 text-slate-400'
                                        }`}>
                                          {link.method}
                                        </span>
                                      )}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                {link.status === 'pending' && <span className="text-xs text-slate-500">Pendiente</span>}
                                {link.status === 'processing' && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />}
                                {link.status === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                                {link.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                                {link.status === 'skipped' && <span className="text-xs text-amber-500">Omitido</span>}
                                
                                {link.status === 'pending' && (
                                    <button onClick={() => handleRemoveLink(idx)} className="p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-red-400">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Status Panel */}
            <div className="space-y-6">
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 sticky top-8">
                    <h3 className="text-lg font-semibold text-white mb-4">Estado del Proceso</h3>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Procesados</span>
                            <span className="text-white font-mono">{processedCount} / {links.length}</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div 
                                className="bg-indigo-500 h-full transition-all duration-500"
                                style={{ width: `${(processedCount / links.length) * 100}%` }}
                            />
                        </div>

                        {isProcessing && (
                            <div className="p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20 animate-pulse">
                                <div className="flex items-center gap-2 text-indigo-400 mb-2">
                                    <Sparkles className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">IA Trabajando</span>
                                </div>
                                <p className="text-sm text-slate-300">{aiStatus.text}</p>
                            </div>
                        )}

                        {!isProcessing && processedCount > 0 && (
                            <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                <p className="text-sm text-emerald-400 font-medium text-center">
                                    Proceso completado o pausado.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
