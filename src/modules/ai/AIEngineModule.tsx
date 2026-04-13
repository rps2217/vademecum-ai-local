import React, { useState, useEffect, useMemo } from 'react';
import { 
  Cpu, Activity, Zap, Terminal, RefreshCw, Trash2, 
  Play, Pause, CheckCircle2, AlertCircle, Info,
  Layers, Database, Search, CloudUpload, Tags, Sparkles,
  Stethoscope
} from 'lucide-react';
import { AIService } from '../../services/AIService';
import { getDB } from '../../core/database/db';
import { Product } from '../../core/types/product.types';
import { FirebaseSyncService } from '../../services/FirebaseSyncService';
import { TaxonomyBackgroundService, TaxonomyStatus } from '../../services/TaxonomyBackgroundService';
import { VectorBackgroundService, VectorizationStatus } from '../../services/VectorBackgroundService';
import { AIOrchestratorService } from '../../services/AIOrchestratorService';

export const AIEngineModule: React.FC = () => {
  const [status, setStatus] = useState(AIService.getStatus());
  const [health, setHealth] = useState<{ ok: boolean; engine: string; response?: string; error?: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [isAnalyzingClinical, setIsAnalyzingClinical] = useState(false);
  const [vectorStatus, setVectorStatus] = useState<VectorizationStatus>(VectorBackgroundService.getStatus());
  const [taxonomyStatus, setTaxonomyStatus] = useState<TaxonomyStatus>(TaxonomyBackgroundService.getStatus());
  const [logs, setLogs] = useState<{ time: string; msg: string; type: 'info' | 'success' | 'warn' | 'error' }[]>([]);
  const [playgroundText, setPlaygroundText] = useState('');
  const [playgroundResult, setPlaygroundResult] = useState<number[] | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasPendingSync, setHasPendingSync] = useState(false);

  useEffect(() => {
    const unsubTaxonomy = TaxonomyBackgroundService.subscribe(status => {
      setTaxonomyStatus(status);
      if (status.lastLog) addLog(status.lastLog.msg, status.lastLog.type);
    });

    const unsubVector = VectorBackgroundService.subscribe(status => {
      setVectorStatus(status);
      if (status.lastLog) addLog(status.lastLog.msg, status.lastLog.type);
    });

    const handleComplete = () => setHasPendingSync(true);

    window.addEventListener('taxonomy_completed', handleComplete);
    window.addEventListener('vectorization_completed', handleComplete);
    
    return () => {
      unsubTaxonomy();
      unsubVector();
      window.removeEventListener('taxonomy_completed', handleComplete);
      window.removeEventListener('vectorization_completed', handleComplete);
    };
  }, []);

  const addLog = (msg: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [{ time, msg, type }, ...prev].slice(0, 50));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(AIService.getStatus());
    }, 1000);
    
    addLog('Módulo de Control de IA iniciado.', 'info');
    return () => clearInterval(interval);
  }, []);

  const handleHealthCheck = async () => {
    setIsTesting(true);
    addLog('Ejecutando prueba de latencia y respuesta...', 'info');
    try {
      const result = await AIService.runHealthCheck();
      setHealth(result);
      if (result.ok) {
        addLog(`Prueba exitosa: ${result.engine}`, 'success');
      } else {
        addLog(`Fallo en prueba: ${result.error}`, 'error');
      }
    } catch (e) {
      addLog('Error crítico en Health Check', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const handlePurgeCache = async () => {
    if (!confirm('Esto borrará todos los modelos descargados y la caché de IA. ¿Continuar?')) return;
    setIsPurging(true);
    addLog('Iniciando purga nuclear de caché y modelos...', 'warn');
    try {
      const success = await AIService.purgeCache();
      if (success) {
        addLog('Caché purgada. El motor se reiniciará en la próxima tarea.', 'success');
      } else {
        addLog('Error al purgar caché.', 'error');
      }
    } catch (e) {
      addLog('Error durante la purga.', 'error');
    } finally {
      setIsPurging(false);
    }
  };

  const handleVectorizeAll = () => {
    VectorBackgroundService.startVectorization();
  };

  const handleTestPlayground = async () => {
    if (!playgroundText) return;
    addLog(`Generando embedding para: "${playgroundText.substring(0, 30)}..."`, 'info');
    const result = await AIService.generateEmbedding(playgroundText);
    setPlaygroundResult(result);
    addLog('Embedding generado con éxito (384 dimensiones).', 'success');
  };

  const handleSyncToCloud = async () => {
    setIsSyncing(true);
    addLog('Iniciando respaldo masivo (Vectores + Taxonomía) en la nube...', 'info');
    try {
      const count = await FirebaseSyncService.uploadLocalProducts();
      addLog(`Respaldo completado: ${count} productos actualizados en la nube.`, 'success');
      setHasPendingSync(false);
    } catch (e) {
      addLog('Error al sincronizar con la nube.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleStandardizeTags = () => {
    TaxonomyBackgroundService.startStandardization();
  };

  const handleLocalClinicalAnalysis = async () => {
    setIsAnalyzingClinical(true);
    addLog('Iniciando análisis clínico local masivo...', 'info');
    
    try {
      const db = await getDB();
      const products = await db.getAll('products');
      const pending = products.filter(p => !p.synergy_analyzed);
      
      if (pending.length === 0) {
        addLog('No hay productos pendientes de análisis clínico.', 'success');
        return;
      }

      addLog(`Procesando ${pending.length} productos con el motor local...`, 'info');

      for (let i = 0; i < pending.length; i++) {
        const product = pending[i];
        
        if (!product.vectores || product.vectores.length === 0) continue;

        const candidates = products
          .filter(p => p.sku !== product.sku && p.vectores && p.vectores.length > 0)
          .map(p => ({
            product: p,
            score: AIService.cosineSimilarity(product.vectores!, p.vectores!)
          }))
          .filter(item => item.score > 0.7)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .map(item => item.product);

        if (candidates.length > 0) {
          const result = await AIService.analyzeClinical(product, candidates, 'synergy');
          
          if (result) {
            await db.put('products', {
              ...product,
              synergy_analyzed: true,
              last_synergy_analysis: Date.now(),
              sugerencia_complementaria: result.sugerencia,
              skus_relacionados: result.ids,
              last_updated: Date.now()
            });
          }
        } else {
          await db.put('products', {
            ...product,
            synergy_analyzed: true,
            last_synergy_analysis: Date.now(),
            last_updated: Date.now()
          });
        }

        if ((i + 1) % 5 === 0) {
          addLog(`Analizados ${i + 1}/${pending.length} productos...`, 'info');
        }
      }

      addLog('¡Análisis clínico local completado!', 'success');
      setHasPendingSync(true);
      window.dispatchEvent(new Event('db_updated'));
    } catch (e) {
      addLog('Error durante el análisis clínico local.', 'error');
      console.error(e);
    } finally {
      setIsAnalyzingClinical(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto pb-20 px-4 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-primary/10 rounded-2xl">
            <Cpu className="w-8 h-8 text-brand-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">AI Engine Dashboard</h2>
            <p className="text-slate-400 font-medium">Monitor de inferencia local y gestión de modelos Transformers.js</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => AIService.startEngine()}
            disabled={status.isReady || status.isInitializing}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white rounded-2xl hover:bg-brand-primary/80 transition-all font-bold shadow-lg disabled:opacity-50"
          >
            <Play className="w-4 h-4" /> Iniciar Motor
          </button>
          <button 
            onClick={() => AIService.stopEngine()}
            disabled={!status.isReady}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-slate-300 rounded-2xl hover:bg-red-500/10 hover:text-red-400 transition-all font-bold border border-slate-700"
          >
            <Pause className="w-4 h-4" /> Detener
          </button>
        </div>
      </div>

      {/* Cloud Sync Banner */}
      {hasPendingSync && (
        <div className="mb-8 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top duration-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 rounded-2xl">
              <CloudUpload className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-white font-bold">Cambios de IA Pendientes</h4>
              <p className="text-xs text-emerald-400/70">Tienes vectores o taxonomías actualizadas localmente que aún no están en la nube.</p>
            </div>
          </div>
          <button 
            onClick={handleSyncToCloud}
            disabled={isSyncing}
            className="w-full md:w-auto px-8 py-3 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-all font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
            Sincronizar Todo con la Nube
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda: Status y Salud */}
        <div className="lg:col-span-2 space-y-8">
          {/* Status Card */}
          <div className="bg-brand-surface border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-brand-primary" />
                Estado del Sistema
              </h3>
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                status.isReady ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                status.isInitializing ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                'bg-slate-800 text-slate-500 border border-slate-700'
              }`}>
                {status.isReady ? 'Activo' : status.isInitializing ? 'Inicializando' : 'Inactivo'}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 bg-brand-bg rounded-2xl border border-slate-800">
                  <div className="text-xs text-slate-500 font-bold uppercase mb-1">Motor de Inferencia</div>
                  <div className="text-white font-bold flex items-center gap-2">
                    <Zap className="w-4 h-4 text-brand-primary" />
                    {status.engine}
                  </div>
                </div>
                <div className="p-4 bg-brand-bg rounded-2xl border border-slate-800">
                  <div className="text-xs text-slate-500 font-bold uppercase mb-1">Última Actividad</div>
                  <div className="text-slate-300 text-sm font-medium italic">
                    {status.lastProgress.text || 'Esperando tareas...'}
                  </div>
                  {status.isInitializing && (
                    <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-brand-primary h-full transition-all duration-300" 
                        style={{ width: `${status.lastProgress.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-brand-bg rounded-2xl border border-slate-800 h-full flex flex-col justify-between">
                  <div>
                    <div className="text-xs text-slate-500 font-bold uppercase mb-3">Prueba de Latencia</div>
                    {health ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          {health.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
                          <span className={health.ok ? 'text-emerald-400' : 'text-red-400 font-bold'}>
                            {health.ok ? 'Motor Respondiendo' : 'Error de Respuesta'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono bg-slate-900 p-2 rounded-lg">
                          {health.engine}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-600 italic">No se han realizado pruebas recientemente.</p>
                    )}
                  </div>
                  <button 
                    onClick={handleHealthCheck}
                    disabled={isTesting || !status.isReady}
                    className="w-full mt-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {isTesting ? 'Probando...' : 'Ejecutar Health Check'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* AI Orchestrator */}
            <div className="bg-brand-surface border border-slate-800 rounded-3xl p-6 shadow-xl md:col-span-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  Orquestador de IA (Pipeline Completo)
                </h3>
                <button 
                  onClick={async () => {
                    addLog('Iniciando Pipeline Completo en modo Cluster...', 'info');
                    await AIOrchestratorService.runPipeline();
                    addLog('Pipeline finalizado.', 'success');
                  }}
                  disabled={!status.isReady}
                  className="px-6 py-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl hover:bg-indigo-500/20 transition-all font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Zap className="w-4 h-4" />
                  Ejecutar Pipeline Completo
                </button>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ejecuta el pipeline secuencial (Taxonomía {'->'} Vectorización {'->'} Análisis Clínico {'->'} Respaldo). Este proceso respeta los bloqueos de clúster, permitiendo que varios dispositivos colaboren simultáneamente sin conflictos.
              </p>
            </div>

            {/* Vector Factory */}
            <div className="bg-brand-surface border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                Fábrica de Vectores
              </h3>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Genera representaciones matemáticas (embeddings) para todos los productos. Esto es vital para la búsqueda semántica "por intención".
              </p>
              
              {vectorStatus.isProcessing ? (
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-indigo-400">Procesando catálogo...</span>
                    <span className="text-white">{Math.round((vectorStatus.current / vectorStatus.total) * 100) || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full transition-all duration-300" 
                      style={{ width: `${(vectorStatus.current / vectorStatus.total) * 100 || 0}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 text-center">
                    {vectorStatus.current} de {vectorStatus.total} productos vectorizados
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <button 
                    onClick={handleVectorizeAll}
                    disabled={!status.isReady}
                    className="w-full py-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl hover:bg-indigo-500/20 transition-all font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4" />
                    Iniciar Vectorización Masiva
                  </button>
                </div>
              )}
            </div>

            {/* Cache Management */}
            <div className="bg-brand-surface border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-400" />
                Gestión de Modelos
              </h3>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Si el motor se comporta de forma errática o quieres liberar espacio en disco (IndexedDB), puedes purgar los modelos descargados.
              </p>
              <button 
                onClick={handlePurgeCache}
                disabled={isPurging}
                className="w-full py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl hover:bg-red-500/20 transition-all font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isPurging ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Purgar Caché Nuclear
              </button>
            </div>

            {/* Tag Standardizer */}
            <div className="bg-brand-surface border border-slate-800 rounded-3xl p-6 shadow-xl md:col-span-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Tags className="w-5 h-5 text-amber-400" />
                  Organizador de Etiquetas (Taxonomía IA)
                </h3>
                <button 
                  onClick={handleStandardizeTags}
                  disabled={!status.isReady || taxonomyStatus.isProcessing}
                  className="px-6 py-2.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-2xl hover:bg-amber-500/20 transition-all font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {taxonomyStatus.isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {taxonomyStatus.isProcessing ? 'Procesando...' : 'Estandarizar Taxonomía Local'}
                </button>
              </div>
              {taxonomyStatus.isProcessing && (
                <div className="mb-4 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10">
                  <div className="flex justify-between text-[10px] font-bold text-amber-500 uppercase mb-1">
                    <span>{taxonomyStatus.progress}</span>
                    <span>{Math.round((taxonomyStatus.processedTags / taxonomyStatus.totalTags) * 100) || 0}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 transition-all duration-500"
                      style={{ width: `${(taxonomyStatus.processedTags / taxonomyStatus.totalTags) * 100 || 0}%` }}
                    />
                  </div>
                </div>
              )}
              <p className="text-xs text-slate-400 leading-relaxed">
                Esta herramienta analiza todas las etiquetas de tu base de datos local y utiliza el motor de IA para unificar términos similares, corregir ortografía y estandarizar la nomenclatura clínica. Ideal para mantener un catálogo limpio y profesional sin enviar datos a la nube.
              </p>
            </div>

            {/* Local Clinical Analyzer */}
            <div className="bg-brand-surface border border-slate-800 rounded-3xl p-6 shadow-xl md:col-span-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-emerald-400" />
                  Analizador Clínico Local (Sinergias)
                </h3>
                <button 
                  onClick={handleLocalClinicalAnalysis}
                  disabled={!status.isReady || isAnalyzingClinical}
                  className="px-6 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl hover:bg-emerald-500/20 transition-all font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isAnalyzingClinical ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Stethoscope className="w-4 h-4" />}
                  {isAnalyzingClinical ? 'Analizando...' : 'Ejecutar Análisis Clínico Local'}
                </button>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Utiliza la potencia de tu GPU/CPU local para encontrar sinergias y relaciones terapéuticas entre productos. A diferencia de Gemini, este proceso no consume tokens externos y mantiene toda la lógica médica dentro de tu navegador, utilizando tus propios vectores semánticos para identificar candidatos.
              </p>
            </div>
          </div>

          {/* Semantic Playground */}
          <div className="bg-brand-surface border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-emerald-400" />
              Semantic Playground
            </h3>
            <div className="flex gap-3 mb-4">
              <input 
                type="text" 
                placeholder="Escribe algo para ver cómo lo entiende la IA..."
                value={playgroundText}
                onChange={(e) => setPlaygroundText(e.target.value)}
                className="flex-1 bg-brand-bg border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-brand-primary outline-none"
              />
              <button 
                onClick={handleTestPlayground}
                disabled={!status.isReady || !playgroundText}
                className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-all disabled:opacity-50"
              >
                Probar
              </button>
            </div>
            {playgroundResult && (
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="text-[10px] text-slate-500 font-bold uppercase mb-2">Vector Resultante (Primeros 20 valores de 384)</div>
                <div className="grid grid-cols-5 gap-1">
                  {playgroundResult.slice(0, 20).map((v, i) => (
                    <div key={i} className="text-[9px] font-mono text-emerald-500/70 bg-emerald-500/5 p-1 rounded border border-emerald-500/10 text-center">
                      {v.toFixed(4)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Logs de Consola */}
        <div className="bg-brand-surface border border-slate-800 rounded-3xl flex flex-col shadow-xl h-[600px] lg:h-auto">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/30">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-brand-primary" />
              AI Engine Logs
            </h3>
            <button 
              onClick={() => setLogs([])}
              className="text-[10px] text-slate-500 hover:text-white uppercase font-bold"
            >
              Limpiar
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-[11px]">
            {logs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-600 italic">
                Esperando eventos...
              </div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="flex gap-2 animate-in slide-in-from-left-2 duration-200">
                  <span className="text-slate-600 shrink-0">[{log.time}]</span>
                  <span className={`
                    ${log.type === 'success' ? 'text-emerald-400' : ''}
                    ${log.type === 'warn' ? 'text-amber-400' : ''}
                    ${log.type === 'error' ? 'text-red-400' : ''}
                    ${log.type === 'info' ? 'text-indigo-300' : ''}
                  `}>
                    {log.msg}
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="p-4 bg-slate-950/50 border-t border-slate-800">
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <Info className="w-3 h-3" />
              <span>Los logs se borran al recargar la página.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
