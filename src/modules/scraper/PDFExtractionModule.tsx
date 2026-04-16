import React, { useState } from 'react';
import { FileText, Upload, Loader2, CheckCircle2, AlertTriangle, Save, RefreshCw, FileSearch, Image as ImageIcon } from 'lucide-react';
import { extractTextFromPDF } from '../../utils/pdfExtractor';
import { GeminiService } from '../../services/GeminiService';
import { DataService } from '../../services/DataService';
import { Product } from '../../core/types/product.types';
import { motion, AnimatePresence } from 'motion/react';

export const PDFExtractionModule: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedProduct, setExtractedProduct] = useState<Product | null>(null);
  const [status, setStatus] = useState<'idle' | 'extracting' | 'analyzing' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && (selectedFile.type === 'application/pdf' || selectedFile.type.startsWith('image/'))) {
      setFile(selectedFile);
      setExtractedProduct(null);
      setStatus('idle');
      setError(null);
    } else {
      alert('Por favor, selecciona un archivo PDF o una imagen válida.');
    }
  };

  const processFile = async () => {
    if (!file) return;

    setIsProcessing(true);
    setStatus('extracting');
    setError(null);

    try {
      let product: Product;

      if (file.type === 'application/pdf') {
        // 1. Extraer texto del PDF
        const text = await extractTextFromPDF(file);
        if (!text.trim()) {
          throw new Error('No se pudo extraer texto del PDF. Asegúrate de que no sea solo una imagen.');
        }
        setStatus('analyzing');
        // 2. Usar Gemini para estructurar la información
        product = await GeminiService.extractProductFromPDFText(text);
      } else {
        // Es una imagen
        setStatus('analyzing');
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        product = await GeminiService.extractProductFromImage(base64, file.type);
      }

      setExtractedProduct(product);
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al procesar el archivo.');
      setStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const saveToDatabase = async () => {
    if (!extractedProduct) return;

    try {
      await DataService.saveProduct(extractedProduct);
      alert('Producto guardado exitosamente en la base de datos.');
      setFile(null);
      setExtractedProduct(null);
      setStatus('idle');
    } catch (err) {
      alert('Error al guardar el producto.');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-20 animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileSearch className="w-6 h-6 text-brand-primary" />
          Extractor de Fichas (PDF / Imagen)
        </h2>
        <p className="text-slate-400 mt-1">
          Sube fichas técnicas en PDF o capturas de pantalla para extraer automáticamente la información clínica.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Zona de Carga */}
        <div className="space-y-6">
          <div className={`relative border-2 border-dashed rounded-[2.5rem] p-12 flex flex-col items-center justify-center transition-all ${
            file ? 'border-brand-primary/50 bg-brand-primary/5' : 'border-slate-800 hover:border-slate-700 bg-slate-900/50'
          }`}>
            <input 
              type="file" 
              accept=".pdf,image/*" 
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={isProcessing}
            />
            
            {file ? (
              <div className="text-center">
                <div className="p-4 bg-brand-primary/20 rounded-2xl mb-4 inline-block">
                  {file.type.startsWith('image/') ? <ImageIcon className="w-10 h-10 text-brand-primary" /> : <FileText className="w-10 h-10 text-brand-primary" />}
                </div>
                <p className="text-sm font-bold text-white truncate max-w-[200px]">{file.name}</p>
                <p className="text-xs text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div className="text-center">
                <div className="p-4 bg-slate-800 rounded-2xl mb-4 inline-block">
                  <Upload className="w-10 h-10 text-slate-500" />
                </div>
                <p className="text-sm font-bold text-slate-300">Arrastra PDF o Imagen</p>
                <p className="text-xs text-slate-500 mt-1">Fichas, catálogos o capturas de pantalla</p>
              </div>
            )}
          </div>

          <button
            onClick={processFile}
            disabled={!file || isProcessing}
            className="w-full py-4 bg-brand-primary text-white rounded-2xl font-bold shadow-lg shadow-brand-primary/20 hover:bg-brand-primary/90 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {status === 'extracting' ? 'Leyendo archivo...' : 'IA Analizando Imagen/PDF...'}
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                Procesar Ficha
              </>
            )}
          </button>

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
              <p className="text-xs text-rose-200">{error}</p>
            </div>
          )}
        </div>

        {/* Vista Previa de Extracción */}
        <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-8 min-h-[400px] flex flex-col">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            Vista Previa de Datos
            {status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          </h3>

          <AnimatePresence mode="wait">
            {extractedProduct ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 flex flex-col"
              >
                <div className="space-y-6 flex-1 overflow-y-auto pr-2 no-scrollbar">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nombre Comercial</p>
                    <p className="text-lg font-bold text-white">{extractedProduct.nombre_comercial}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">SKU</p>
                      <p className="text-xs font-mono text-slate-300">{extractedProduct.sku}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Categoría</p>
                      <p className="text-xs text-slate-300">{extractedProduct.categoria_principal}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Principios Activos</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {extractedProduct.principios_activos.map(pa => (
                        <span key={pa} className="px-2 py-0.5 bg-slate-800 rounded text-[10px] text-slate-300 border border-slate-700">{pa}</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Análisis de Componentes</p>
                    <p className="text-xs text-slate-400 leading-relaxed italic">"{extractedProduct.analisis_componentes}"</p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Indicaciones</p>
                    <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                      {extractedProduct.indicaciones.map((ind, i) => (
                        <li key={i}>{ind}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <button
                  onClick={saveToDatabase}
                  className="mt-8 w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Guardar en Base de Datos
                </button>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-slate-700" />
                </div>
                <p className="text-sm text-slate-500">Sube un archivo y procésalo para ver los resultados aquí.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
