import React, { useState } from 'react';
import { Activity, Database, Globe, Brain, CheckCircle, XCircle, Loader2, Play, Trash2 } from 'lucide-react';
import { AIService } from '../../services/AIService';
import { getDB } from '../../core/database/db';
import { SafetyStatus } from '../../core/types/product.types';

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  details?: string;
}

export const SystemDiagnostics: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [tests, setTests] = useState<TestResult[]>([
    { id: 'db', name: 'Base de Datos (IndexedDB)', status: 'pending' },
    { id: 'ai', name: 'Motor de IA (Inferencia)', status: 'pending' },
    { id: 'scraper', name: 'Conectividad Web (Proxies)', status: 'pending' },
  ]);

  const updateTest = (id: string, updates: Partial<TestResult>) => {
    setTests(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const handlePurgeCache = async () => {
    if (confirm('¿Estás seguro? Esto borrará los modelos de IA descargados y forzará una nueva descarga limpia. Úsalo si tienes errores de "offset" o corrupción.')) {
      setIsRunning(true);
      try {
        await AIService.purgeCache();
        alert('Caché borrada. Por favor recarga la página para descargar los modelos nuevamente.');
        window.location.reload();
      } catch (e) {
        alert('Error borrando caché.');
      } finally {
        setIsRunning(false);
      }
    }
  };

  const runDiagnostics = async () => {
    if (isRunning) return;
    setIsRunning(true);
    
    // Reset statuses
    setTests(prev => prev.map(t => ({ ...t, status: 'pending', message: undefined, details: undefined })));

    // 1. Test Database
    updateTest('db', { status: 'running', message: 'Verificando lectura/escritura...' });
    try {
      const db = await getDB();
      const testId = 'test_diagnostic_' + Date.now();
      await db.put('products', { 
        sku: testId, 
        nombre_comercial: 'TEST_PRODUCT', 
        descripcion: 'Producto de prueba para diagnóstico',
        principios_activos: [], 
        posologia: '', 
        indicaciones: [], 
        advertencias: '', 
        tags_ia: [],
        vectores: [],
        
        // Safety Status
        apto_embarazo: SafetyStatus.NO,
        apto_lactancia: SafetyStatus.NO,
        apto_pediatria: SafetyStatus.NO,
        apto_diabeticos: SafetyStatus.NO,
        apto_hipertensos: SafetyStatus.NO,
        apto_celiacos: SafetyStatus.NO,
        
        // Sinergia
        sugerencia_complementaria: '',
        skus_relacionados: [],
        
        source_url: ''
      });
      const retrieved = await db.get('products', testId);
      if (!retrieved) throw new Error('No se pudo recuperar el registro de prueba.');
      await db.delete('products', testId);
      updateTest('db', { status: 'success', message: 'Operaciones de E/S correctas.' });
    } catch (e: any) {
      updateTest('db', { status: 'error', message: 'Fallo en base de datos', details: e.message });
    }

    // 2. Test AI Engine (Health Check)
    updateTest('ai', { status: 'running', message: 'Verificando integridad del modelo...' });
    try {
      const health = await AIService.runHealthCheck();
      
      if (health.ok) {
        updateTest('ai', { 
            status: 'success', 
            message: `Modelo Operativo: ${health.engine}`,
            details: `Respuesta de prueba: "${health.response}"`
        });
      } else {
        throw new Error(health.error || 'El modelo no respondió correctamente.');
      }
    } catch (e: any) {
      updateTest('ai', { status: 'error', message: 'Fallo crítico de IA', details: e.message });
    }

    // 3. Test Web Scraper (Connectivity)
    updateTest('scraper', { status: 'running', message: 'Probando proxies CORS...' });
    try {
      const worker = new Worker(new URL('../../workers/scraper.worker.ts', import.meta.url), { type: 'module' });
      
      const result = await new Promise<{ success: boolean, message: string }>((resolve, reject) => {
        const timeout = setTimeout(() => {
          worker.terminate();
          reject(new Error('Timeout: Los proxies tardaron demasiado en responder.'));
        }, 15000); // 15s timeout

        worker.onmessage = (e) => {
          const { type, payload } = e.data;
          if (type === 'TEST_RESULT') {
            clearTimeout(timeout);
            resolve(payload);
          }
        };

        worker.postMessage({ type: 'TEST_CONNECTION' });
      });

      worker.terminate();

      if (result.success) {
        updateTest('scraper', { status: 'success', message: result.message });
      } else {
        throw new Error(result.message);
      }

    } catch (e: any) {
      updateTest('scraper', { status: 'error', message: 'Fallo de conectividad', details: e.message });
    }

    setIsRunning(false);
  };

  return (
    <div className="bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-800 mt-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <Activity className="w-5 h-5 text-indigo-400" />
          </div>
          Diagnóstico del Sistema
        </h2>
        
        <div className="flex gap-2">
            <button
            onClick={handlePurgeCache}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20"
            title="Borrar modelos corruptos y descargar de nuevo"
            >
            <Trash2 className="w-4 h-4" />
            Reinstalar Modelos
            </button>

            <button
            onClick={runDiagnostics}
            disabled={isRunning}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                isRunning 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-500'
            }`}
            >
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {isRunning ? 'Ejecutando...' : 'Ejecutar Pruebas'}
            </button>
        </div>
      </div>

      <div className="space-y-4">
        {tests.map((test) => (
          <div key={test.id} className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={`mt-1 p-1.5 rounded-full ${
                test.status === 'pending' ? 'bg-slate-800 text-slate-500' :
                test.status === 'running' ? 'bg-indigo-500/10 text-indigo-400 animate-pulse' :
                test.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                'bg-red-500/10 text-red-400'
              }`}>
                {test.id === 'db' && <Database className="w-4 h-4" />}
                {test.id === 'ai' && <Brain className="w-4 h-4" />}
                {test.id === 'scraper' && <Globe className="w-4 h-4" />}
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-slate-200">{test.name}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {test.message || 'Esperando ejecución...'}
                </p>
                {test.details && (
                  <div className="mt-2 p-2 bg-red-500/5 border border-red-500/10 rounded text-xs text-red-300 font-mono break-all">
                    {test.details}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center">
              {test.status === 'running' && <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />}
              {test.status === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
              {test.status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
