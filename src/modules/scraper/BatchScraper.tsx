import React, { useState, useEffect } from 'react';
import { Globe, Search, Loader2, CheckCircle, AlertCircle, Save, Sparkles, Copy, Trash2, Link, Play, Pause, X, Activity } from 'lucide-react';
import { AIService } from '../../services/AIService';
import { Product } from '../../core/types/product.types';
import { getDB } from '../../core/database/db';
import { useHardwareDetection } from '../../hooks/useHardwareDetection';

interface ScrapedLink {
  text: string;
  href: string;
  status: 'pending' | 'processing' | 'success' | 'error' | 'skipped';
  productName?: string;
}

export const BatchScraper: React.FC = () => {
  const { hardware } = useHardwareDetection();
  const [categoryUrl, setCategoryUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
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
        // Filtrar enlaces irrelevantes (heurística más estricta)
        const relevantLinks = data.links.filter((l: any) => {
            const text = l.text.toLowerCase().trim();
            const href = l.href.toLowerCase().trim();
            
            // 1. Excluir palabras clave de navegación comunes
            const forbiddenKeywords = [
                'inicio', 'home', 'portada', 'contacto', 'login', 'registro', 
                'carrito', 'mapa', 'política', 'aviso', 'términos', 'condiciones', 
                'ayuda', 'faq', 'blog', 'nosotros', 'quienes', 'sucursales', 
                'tiendas', 'mi cuenta', 'ver más', 'leer más', 'click aquí'
            ];
            if (forbiddenKeywords.some(k => text === k || text.includes(k))) return false;
            
            // 2. Excluir si el texto es muy corto o solo números
            if (text.length < 4 || /^\d+$/.test(text)) return false;
            
            // 3. Excluir si es la misma URL de categoría
            if (href === categoryUrl || href === categoryUrl + '/') return false;
            
            // 4. Excluir si es la raíz del dominio (Home)
            try {
                const urlObj = new URL(l.href);
                // Si no tiene ruta o la ruta es solo '/', es la portada
                if (urlObj.pathname === '/' || urlObj.pathname === '') return false;
                
                // Excluir dominios externos si los hay (por seguridad)
                const categoryDomain = new URL(categoryUrl).hostname;
                if (urlObj.hostname !== categoryDomain) return false;
            } catch(e) { return false; }

            return true;
        }).map((l: any) => ({ ...l, status: 'pending' }));

        // Eliminar duplicados de URL en la lista
        const uniqueLinks = Array.from(new Map(relevantLinks.map(item => [item.href, item])).values()) as ScrapedLink[];

        setLinks(uniqueLinks);
        if (uniqueLinks.length === 0) setError('No se encontraron enlaces de productos válidos en esta página.');
      } else {
        throw new Error(data.error || 'Error al escanear la categoría.');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión con el servidor de scraping.');
    } finally {
      setIsScanning(false);
    }
  };

  const processNextLink = async () => {
    const nextIndex = links.findIndex(l => l.status === 'pending');
    if (nextIndex === -1) {
        setIsProcessing(false);
        return;
    }

    // Marcar como procesando
    setLinks(prev => prev.map((l, i) => i === nextIndex ? { ...l, status: 'processing' } : l));
    const link = links[nextIndex];

    try {
        // 1. Fetch Product Page
        setAiStatus({ text: `Descargando: ${link.text}...`, progress: 10 });
        const response = await fetch(`/api/scrape?url=${encodeURIComponent(link.href)}`);
        const data = await response.json();

        if (!data.success) throw new Error(data.error);

        // 2. AI Extraction
        setAiStatus({ text: `Analizando: ${link.text}...`, progress: 50 });
        
        // Asegurar motor encendido (lazy load)
        await AIService.startEngine();
        
        const product = await AIService.extractProductData(data.text, link.href);

        if (product && product.nombre_comercial !== 'Producto Desconocido') {
            // 3. Save to DB
            const db = await getDB();
            // Evitar duplicados por SKU o Nombre
            const existing = await db.get('products', product.sku);
            if (!existing) {
                await db.put('products', product);
                setLinks(prev => prev.map((l, i) => i === nextIndex ? { ...l, status: 'success', productName: product.nombre_comercial } : l));
                setProcessedCount(c => c + 1);
            } else {
                setLinks(prev => prev.map((l, i) => i === nextIndex ? { ...l, status: 'skipped', productName: 'Duplicado' } : l));
            }
        } else {
            throw new Error('Datos insuficientes');
        }

    } catch (e) {
        setLinks(prev => prev.map((l, i) => i === nextIndex ? { ...l, status: 'error' } : l));
    }

    // Continuar con el siguiente (recursivo con pequeño delay para no saturar)
    setTimeout(() => processNextLink(), 1000);
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
                        const res = await fetch('/api/test');
                        const data = await res.json();
                        alert(`Conexión exitosa: ${data.message}`);
                    } catch (e: any) {
                        alert(`Error de conexión: ${e.message}`);
                    }
                }}
                className="px-4 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                title="Probar conexión con el servidor"
            >
                <Activity className="w-5 h-5" />
            </button>
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
                                    <p className="text-xs text-emerald-400 mt-1 font-medium">Detectado: {link.productName}</p>
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
