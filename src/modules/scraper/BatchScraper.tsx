import React, { useState, useEffect } from 'react';
import { FileText, Search, Loader2, CheckCircle, AlertCircle, Sparkles, Copy, Play, Globe } from 'lucide-react';
import { AIService } from '../../services/AIService';
import { GeminiService } from '../../services/GeminiService';
import { Product, SafetyStatus } from '../../core/types/product.types';
import { getDB } from '../../core/database/db';
import { useHardwareDetection } from '../../hooks/useHardwareDetection';

interface ExtractedProduct {
  name: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  details?: Partial<Product>;
  errorMsg?: string;
}

type InputMode = 'paste' | 'list' | 'url' | 'search';

export const BatchScraper: React.FC = () => {
  const { hardware } = useHardwareDetection();
  const [mode, setMode] = useState<InputMode>('url');
  const [inputText, setInputText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [products, setProducts] = useState<ExtractedProduct[]>([]);
  const [processedCount, setProcessedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<{ text: string; progress: number }>({ text: '', progress: 0 });

  useEffect(() => {
    if (hardware) {
      AIService.configure(hardware);
    }
  }, [hardware]);

  const logStatus = (text: string, progress: number = 0) => {
    setAiStatus({ text, progress });
  };

  // Paso 1: Extraer nombres de productos del texto pegado o de la lista
  const handleExtractNames = async () => {
    if (!inputText.trim()) return;
    
    setIsExtracting(true);
    setError(null);
    setProducts([]);
    logStatus('Analizando con IA...', 20);
    
    try {
      let extractedNames: string[] = [];

      if (mode === 'list') {
        extractedNames = inputText.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 3);
      } else if (mode === 'url') {
        logStatus('Visitando URL con IA...', 40);
        extractedNames = await GeminiService.extractProductNamesFromUrl(inputText.trim());
      } else if (mode === 'search') {
        logStatus('Buscando en Google con IA...', 40);
        extractedNames = await GeminiService.extractProductNamesFromSearch(inputText.trim());
      } else {
        // paste mode
        const prompt = `
          Extrae una lista de nombres de medicamentos o productos de farmacia del siguiente texto.
          El texto fue copiado y pegado de una página web de farmacia.
          Ignora menús, precios, textos legales, y otra basura.
          Devuelve ÚNICAMENTE los nombres de los productos, uno por línea.
          No incluyas viñetas, números ni texto adicional.
          
          Texto:
          ${inputText.substring(0, 15000)}
        `;
        
        const response = await GeminiService.generateText(prompt);
        extractedNames = response.split('\n')
          .map(line => line.replace(/^[-\*\d\.\s]+/, '').trim())
          .filter(line => line.length > 3 && !line.toLowerCase().includes('precio') && !line.toLowerCase().includes('agregar'));
      }

      if (extractedNames.length === 0) {
        throw new Error("No se encontraron productos válidos. Intenta con otra búsqueda o URL.");
      }

      // Eliminar duplicados
      const uniqueNames = [...new Set(extractedNames)];
      
      setProducts(uniqueNames.map(name => ({
        name,
        status: 'pending'
      })));
      
      logStatus(`¡Se encontraron ${uniqueNames.length} productos!`, 100);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al extraer productos.');
      logStatus('Error en la extracción', 0);
    } finally {
      setIsExtracting(false);
    }
  };

  // Paso 2: Procesar cada producto usando Google Search Grounding
  const handleProcessProducts = async () => {
    if (products.length === 0) return;
    
    setIsProcessing(true);
    setError(null);
    setProcessedCount(0);
    
    const db = await getDB();
    const updatedProducts = [...products];

    for (let i = 0; i < updatedProducts.length; i++) {
      if (updatedProducts[i].status === 'success') continue;
      
      updatedProducts[i].status = 'processing';
      setProducts([...updatedProducts]);
      logStatus(`Buscando información de: ${updatedProducts[i].name}...`, Math.round((i / updatedProducts.length) * 100));

      try {
        // Usamos Gemini con Google Search Grounding para obtener la info real del medicamento
        const prompt = `
          Busca información médica real y actualizada sobre el medicamento o producto farmacéutico: "${updatedProducts[i].name}".
          Devuelve un objeto JSON estricto con la siguiente estructura. No incluyas markdown, solo el JSON puro.
          
          {
            "name": "Nombre comercial y presentación",
            "activePrinciple": "Principio activo principal",
            "therapeuticClass": "Clase terapéutica (ej: Analgésico, Antibiótico)",
            "indications": ["indicación 1", "indicación 2"],
            "contraindications": ["contraindicación 1", "contraindicación 2"],
            "dosage": "Dosis recomendada general",
            "sideEffects": ["efecto 1", "efecto 2"],
            "warnings": ["advertencia 1", "advertencia 2"],
            "safetyStatus": "safe" | "caution" | "danger"
          }
        `;

        const jsonResponse = await GeminiService.generateJSON(prompt);
        const productData = JSON.parse(jsonResponse);

        const newProduct: Product = {
          id: crypto.randomUUID(),
          name: productData.name || updatedProducts[i].name,
          activePrinciple: productData.activePrinciple || 'No especificado',
          therapeuticClass: productData.therapeuticClass || 'General',
          indications: productData.indications || [],
          contraindications: productData.contraindications || [],
          dosage: productData.dosage || 'Consultar al médico',
          sideEffects: productData.sideEffects || [],
          warnings: productData.warnings || [],
          safetyStatus: (productData.safetyStatus as SafetyStatus) || 'caution',
          interactions: [],
          pregnancyCategory: 'C',
          prescriptionRequired: false,
          sourceUrl: 'https://google.com/search?q=' + encodeURIComponent(updatedProducts[i].name),
          lastUpdated: new Date().toISOString()
        };

        await db.put('products', newProduct);
        
        updatedProducts[i].status = 'success';
        updatedProducts[i].details = newProduct;
        setProcessedCount(prev => prev + 1);

        // Pequeña pausa para no saturar la API
        await new Promise(r => setTimeout(r, 1500));

      } catch (err: any) {
        console.error(`Error procesando ${updatedProducts[i].name}:`, err);
        updatedProducts[i].status = 'error';
        updatedProducts[i].errorMsg = err.message;
      }
      
      setProducts([...updatedProducts]);
    }

    setIsProcessing(false);
    logStatus('¡Proceso completado!', 100);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl mb-2">
          <Sparkles className="w-8 h-8 text-indigo-400" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Vademécum IA <span className="text-indigo-400">Builder</span>
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
          Olvida los errores de red. Pega texto de cualquier farmacia o una lista de medicamentos. La IA extraerá los nombres y buscará toda la información médica automáticamente en Google para poblar tu base de datos.
        </p>
      </header>

      {/* Input Section */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-lg space-y-6">
        
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 w-fit">
            <button
                onClick={() => setMode('url')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    mode === 'url' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
            >
                <Globe className="w-4 h-4" />
                Escanear URL
            </button>
            <button
                onClick={() => setMode('search')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    mode === 'search' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
            >
                <Search className="w-4 h-4" />
                Búsqueda Libre
            </button>
            <button
                onClick={() => setMode('paste')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    mode === 'paste' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
            >
                <Copy className="w-4 h-4" />
                Pegar Texto
            </button>
            <button
                onClick={() => setMode('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    mode === 'list' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
            >
                <FileText className="w-4 h-4" />
                Lista Manual
            </button>
        </div>

        <div className="space-y-4">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                {mode === 'url' && '1. Ingresa la URL de la categoría de la farmacia (ej: https://farmaciaknop.com/medicamentos):'}
                {mode === 'search' && '1. Ingresa qué tipo de medicamentos quieres buscar (ej: "Antibióticos en Chile" o "Medicamentos para la alergia"):'}
                {mode === 'paste' && '1. Ve a la página de la farmacia, presiona Ctrl+A, Ctrl+C y pega aquí (Ctrl+V):'}
                {mode === 'list' && '1. Escribe o pega una lista de medicamentos (uno por línea):'}
            </label>
            
            {mode === 'url' || mode === 'search' ? (
              <input 
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={mode === 'url' ? "https://..." : "Ej: Medicamentos para el dolor de cabeza..."}
                className="w-full p-4 bg-slate-950 border border-slate-700 rounded-xl text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono text-sm"
              />
            ) : (
              <textarea 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={mode === 'paste' ? "Pega aquí todo el texto de la página web..." : "Paracetamol 500mg\nIbuprofeno 400mg\nAmoxicilina..."}
                  className="w-full h-48 p-4 bg-slate-950 border border-slate-700 rounded-xl text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono text-sm resize-y"
              />
            )}
            
            <button 
                onClick={handleExtractNames}
                disabled={isExtracting || !inputText.trim()}
                className="w-full md:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-indigo-500/20"
            >
                {isExtracting ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Analizando...</>
                ) : (
                    <><Search className="w-5 h-5" /> Extraer Medicamentos</>
                )}
            </button>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Results Section */}
      {products.length > 0 && (
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-lg space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Productos Encontrados ({products.length})
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Paso 2: La IA buscará la información médica de cada uno en Google.
              </p>
            </div>
            
            <button
              onClick={handleProcessProducts}
              disabled={isProcessing || products.every(p => p.status === 'success')}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
            >
              {isProcessing ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Procesando...</>
              ) : (
                <><Play className="w-5 h-5" /> Iniciar Búsqueda IA</>
              )}
            </button>
          </div>

          {/* Progress Bar */}
          {(isProcessing || processedCount > 0) && (
            <div className="space-y-2 p-4 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex justify-between text-xs font-medium text-slate-400">
                <span>{aiStatus.text}</span>
                <span>{processedCount} / {products.length} completados</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-300 ease-out"
                  style={{ width: `${(processedCount / products.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Product List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {products.map((product, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${
                  product.status === 'success' ? 'bg-emerald-500/5 border-emerald-500/20' :
                  product.status === 'error' ? 'bg-red-500/5 border-red-500/20' :
                  product.status === 'processing' ? 'bg-indigo-500/5 border-indigo-500/20' :
                  'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="mt-0.5">
                  {product.status === 'success' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                  {product.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                  {product.status === 'processing' && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />}
                  {product.status === 'pending' && <div className="w-4 h-4 rounded-full border-2 border-slate-700" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate" title={product.name}>
                    {product.name}
                  </p>
                  {product.status === 'success' && product.details && (
                    <p className="text-[10px] text-emerald-400 mt-1 truncate">
                      {product.details.activePrinciple} • Guardado en BD
                    </p>
                  )}
                  {product.status === 'error' && (
                    <p className="text-[10px] text-red-400 mt-1 line-clamp-2">
                      {product.errorMsg}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
