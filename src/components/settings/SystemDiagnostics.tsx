import React, { useState } from 'react';
import { Activity, Database, Globe, Brain, CheckCircle, XCircle, Loader2, Play, Trash2 } from 'lucide-react';
import { AIService } from '../../services/AIService';
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
  const [aiProgress, setAiProgress] = useState({ text: '', progress: 0 });
  const [tests, setTests] = useState<TestResult[]>([
    { id: 'db', name: 'Base de Datos (IndexedDB)', status: 'pending' },
    { id: 'ai', name: 'Motor de IA (Inferencia)', status: 'pending' },
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
    updateTest('db', { status: 'success', message: 'Sistema centralizado API activo.' });

    // 2. Test AI Engine (Health Check)
    updateTest('ai', { status: 'running', message: 'Iniciando motor de IA...' });
    
    // Configurar callback de progreso para el diagnóstico
    AIService.setProgressCallback((text, progress) => {
      setAiProgress({ text, progress });
      updateTest('ai', { message: text });
    });

    try {
      // Intentar iniciar el motor si no está listo
      const isStarted = await AIService.startEngine();
      
      if (!isStarted) {
         throw new Error('No se pudo iniciar el motor de IA.');
      }

      updateTest('ai', { message: 'Ejecutando prueba de inferencia...' });
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
    } finally {
      setAiProgress({ text: '', progress: 0 });
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
          <div key={test.id} className="bg-slate-950/50 border border-slate-800 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`mt-1 p-1.5 rounded-full ${
                  test.status === 'pending' ? 'bg-slate-800 text-slate-500' :
                  test.status === 'running' ? 'bg-indigo-500/10 text-indigo-400 animate-pulse' :
                  test.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                  'bg-red-500/10 text-red-400'
                }`}>
                  {test.id === 'db' && <Database className="w-4 h-4" />}
                  {test.id === 'ai' && <Brain className="w-4 h-4" />}
                </div>
                
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-slate-200">{test.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {test.message || 'Esperando ejecución...'}
                  </p>
                  
                  {test.id === 'ai' && test.status === 'running' && aiProgress.progress > 0 && (
                    <div className="mt-3 space-y-1.5">
                      <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                        <span>{aiProgress.text}</span>
                        <span>{Math.round(aiProgress.progress)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 transition-all duration-300"
                          style={{ width: `${aiProgress.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {test.details && (
                    <div className="mt-2 p-2 bg-red-500/5 border border-red-500/10 rounded text-xs text-red-300 font-mono break-all">
                      {test.details}
                      {test.id === 'ai' && test.status === 'error' && (
                          <button 
                              onClick={(e) => { e.stopPropagation(); handlePurgeCache(); }}
                              className="mt-2 w-full py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold transition-colors flex items-center justify-center gap-2"
                          >
                              <Trash2 className="w-3 h-3" />
                              REPARAR MODELOS DAÑADOS
                          </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center ml-4">
                {test.status === 'running' && <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />}
                {test.status === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                {test.status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
