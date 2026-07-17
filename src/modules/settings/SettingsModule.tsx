import React, { useState, useEffect } from 'react';
import { useHardwareDetection } from '../../hooks/useHardwareDetection';
import { Cpu, ShieldCheck, Settings, Download, Upload, Loader2, Brain, Zap, ShieldAlert, Cloud, RefreshCw, Terminal, XCircle, CheckCircle2, Info, AlertCircle } from 'lucide-react';
import { dataService } from '../../services/DataService';
import { configService, AppConfig } from '../../services/ConfigService';
import { useLogs } from '../../hooks/useLogs';
import { useSettings } from '../../context/SettingsContext';
import { LayoutGrid, Maximize2, Monitor } from 'lucide-react';
import { logger } from '../../services/LoggerService';
import { getDeviceId } from '../../utils/clusterUtils';
import { cloudSyncService } from '../../services/CloudSyncService';

export const SettingsModule: React.FC = () => {
  const { hardware } = useHardwareDetection();
  const [isImporting, setIsImporting] = useState(false);
  const [config, setConfig] = useState<AppConfig>(configService.getConfig());
  const { logs, clearLogs } = useLogs();
  const { settings, updateSettings } = useSettings();
  const nodeId = getDeviceId();
  const [isTestingCluster, setIsTestingCluster] = useState(false);
  const [clusterTestResult, setClusterTestResult] = useState<string | null>(null);
  
  // Estados de diagnóstico de IA
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [queueLength, setQueueLength] = useState(0);

  useEffect(() => {
    const unsubAi = (import('../../services/AIOrchestratorService')).then(m => 
      m.aiOrchestratorService.subscribe(setAiStatus)
    );
    
    // Polling suave para longitud de cola
    const interval = setInterval(async () => {
      try {
        const module = await import('../../services/TaskQueueService');
        const queueService = module.taskQueueService;
        if (queueService && typeof queueService.getQueueLength === 'function') {
           const length = await queueService.getQueueLength();
           setQueueLength(length);
        }
      } catch (e) {
        logger.error('Error polling queue:', e);
      }
    }, 2000);

    return () => {
      unsubAi.then(un => un?.());
      clearInterval(interval);
    };
  }, []);

  const testClusterLock = async () => {
    setIsTestingCluster(true);
    setClusterTestResult(null);
    try {
      // Usamos un SKU ficticio para probar el sistema de colas/locks
      const success = await cloudSyncService.claimProductLock('CLUSTER_TEST_PING', nodeId);
      if (success) {
        setClusterTestResult('Lock adquirido con éxito. Este dispositivo tiene exclusividad sobre la tarea de prueba.');
        logger.success(`Prueba de clúster exitosa: Lock adquirido por ${nodeId}`, 'Cluster');
      } else {
        setClusterTestResult('No se pudo adquirir el lock. Posiblemente otro nodo está en medio de una prueba o hay error de red.');
      }
    } catch (e) {
      setClusterTestResult('Error de conexión con el motor de clúster.');
    } finally {
      setIsTestingCluster(false);
    }
  };

  const handleConfigChange = (updates: Partial<AppConfig>) => {
    const newConfig = configService.updateConfig(updates);
    setConfig(newConfig);
    logger.info(`Configuración actualizada: ${Object.keys(updates).join(', ')}`, 'Config');
  };

  const handleExport = async () => {
    try {
      const all = await dataService.getAllProducts();
      const dataStr = JSON.stringify(all, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vademecum_backup.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error al exportar.');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          if (Array.isArray(imported)) {
            for (const p of imported) {
              await dataService.saveProduct(p);
            }
            alert('Importación completada.');
          }
        } catch (err) {
          alert('Error en formato JSON');
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsText(file);
    } catch (error) {
      setIsImporting(false);
    }
  };

  const handleRestartKernel = async () => {
    if (confirm('¿Estás seguro de que deseas reiniciar el kernel? Esto liberará la memoria caché de los modelos de IA y reiniciará la aplicación para solucionar problemas de memoria.')) {
      try {
        const cacheNames = await caches.keys();
        for (const name of cacheNames) {
          if (name.includes('ai-models') || name.includes('workbox') || name.includes('transformers')) {
            await caches.delete(name);
          }
        }
        window.location.reload();
      } catch (error) {
        logger.error('Error al reiniciar kernel:', error);
        window.location.reload();
      }
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto pb-24 px-4 sm:px-6 animate-in fade-in duration-300 pt-2">
      <div className="mb-6 sm:mb-10">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-3">
          <Settings className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
          Configuración
        </h2>
        <p className="text-muted-foreground mt-2 text-sm sm:text-lg">Administra las preferencias y el respaldo de tu sistema.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
        {/* IA */}
        <div className="bg-card border border-border rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl">
          <h3 className="text-lg sm:text-xl font-bold text-foreground mb-6 flex items-center gap-3">
             <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-primary" /> Inteligencia Artificial
          </h3>
          <div className="space-y-4">
             <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border">
                <div>
                  <p className="text-sm font-bold text-foreground">Análisis en Segundo Plano</p>
                  <p className="text-xs text-muted-foreground">Detecta sinergias automáticamente</p>
                </div>
                <button
                  onClick={() => handleConfigChange({ enableBackgroundSynergy: !config.enableBackgroundSynergy })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${config.enableBackgroundSynergy ? 'bg-primary' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-card rounded-full transition-all ${config.enableBackgroundSynergy ? 'left-7' : 'left-1'}`} />
                </button>
             </div>
             <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border">
                <div>
                  <p className="text-sm font-bold text-foreground">Sincronización Cloud</p>
                  <p className="text-xs text-muted-foreground">Respaldo automático (Supabase)</p>
                </div>
                <button
                  onClick={() => handleConfigChange({ autoSyncCloud: !config.autoSyncCloud })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${config.autoSyncCloud ? 'bg-primary' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-card rounded-full transition-all ${config.autoSyncCloud ? 'left-7' : 'left-1'}`} />
                </button>
             </div>

             <div className="flex items-center justify-between p-4 bg-amber-900/20 rounded-2xl border border-amber-900/30">
                <div>
                  <p className="text-sm font-bold text-amber-400">Motor Externo (Ollama)</p>
                  <p className="text-xs text-amber-500/70">Usa el poder de tu PC (Recomendado)</p>
                </div>
                <button
                  onClick={() => handleConfigChange({ useOllama: !config.useOllama })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${config.useOllama ? 'bg-amber-500' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-card rounded-full transition-all ${config.useOllama ? 'left-7' : 'left-1'}`} />
                </button>
             </div>

             <div className="p-4 bg-card rounded-2xl border border-border">
                <p className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
                   <Zap className="w-4 h-4 text-primary" /> Perfil de Ejecución de IA
                </p>
                <p className="text-[11px] text-muted-foreground mb-3">
                   Optimiza el consumo de batería y almacenamiento del dispositivo clínico.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      handleConfigChange({ aiExecutionMode: 'hybrid-local' });
                    }}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between h-24 ${
                      config.aiExecutionMode !== 'cloud-only'
                        ? 'bg-primary/10 border-primary text-foreground'
                        : 'bg-card border-border hover:border-slate-500 text-muted-foreground'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs font-bold font-sans">Híbrido Local</span>
                      <Brain className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-[9px] leading-tight text-muted-foreground/90 font-medium">WebGPU/Transformers local con fallback. Privacidad.</span>
                  </button>

                  <button
                    onClick={() => {
                      handleConfigChange({ aiExecutionMode: 'cloud-only' });
                    }}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between h-24 ${
                      config.aiExecutionMode === 'cloud-only'
                        ? 'bg-primary/10 border-primary text-foreground'
                        : 'bg-card border-border hover:border-slate-500 text-muted-foreground'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs font-bold font-sans">Nube Directa</span>
                      <Cloud className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-[9px] leading-tight text-muted-foreground/90 font-medium">Gemini Cloud directo. Ideal para dispositivos móviles/ligeros.</span>
                  </button>
                </div>
             </div>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="bg-card border border-border rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl">
          <h3 className="text-lg sm:text-xl font-bold text-foreground mb-6 flex items-center gap-3">
             <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6 text-primary" /> Apariencia
          </h3>
          <div className="space-y-6">
             <div className="p-4 bg-card rounded-2xl border border-border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-bold text-foreground">Columnas de Resultados</p>
                    <p className="text-xs text-muted-foreground">Densidad de la cuadrícula en escritorio</p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-card rounded-lg border border-border">
                    <Monitor className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs font-bold text-primary">{settings.gridColumns} col</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                  {[2, 3, 4, 5].map(cols => (
                    <button
                      key={cols}
                      onClick={() => updateSettings({ gridColumns: cols })}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                        settings.gridColumns === cols 
                          ? 'bg-primary border-primary/50 text-slate-950 shadow-lg shadow-brand-primary/20' 
                          : 'bg-card border-border text-muted-foreground hover:border-slate-500'
                      }`}
                    >
                      {cols}
                    </button>
                  ))}
                </div>
                
                <div className="mt-4 flex items-center gap-3 p-3 bg-primary rounded-xl border border-primary/50">
                   <Maximize2 className="w-4 h-4 text-primary shrink-0" />
                   <p className="text-[10px] text-muted-foreground leading-tight">
                     Al seleccionar menos columnas, las tarjetas se expandirán automáticamente para ofrecer una mejor lectura de las indicaciones clínicas.
                   </p>
                </div>
             </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl">
          <h3 className="text-lg sm:text-xl font-bold text-foreground mb-6 flex items-center gap-3">
             <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" /> Sistema y Backup
          </h3>
          <div className="space-y-4">
             {config.useOllama && (
                <div className="p-4 bg-blue-900/20 rounded-2xl border border-blue-900/30 mb-2">
                  <p className="text-xs font-bold text-blue-400 mb-2 flex items-center gap-2">
                    <Zap className="w-3 h-3" /> CONFIGURAR OLLAMA:
                  </p>
                  <ol className="text-[10px] text-blue-300/80 space-y-1 list-decimal ml-4">
                    <li>Instala Ollama y ejecuta: <code className="text-blue-400">ollama run llama3</code></li>
                    <li>En Windows (CMD): <code className="text-blue-400">setx OLLAMA_ORIGINS "*"</code> (y reinicia)</li>
                    <li>Navegador: Permite "Contenido no seguro" en este sitio.</li>
                  </ol>
                </div>
             )}
             <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border">
                <div className="flex gap-3">
                  <Download className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-sm font-bold text-foreground">Exportar</p>
                    <p className="text-xs text-muted-foreground">Descarga .JSON</p>
                  </div>
                </div>
                <button onClick={handleExport} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold transition-all">Exportar</button>
             </div>
             
             <div className="relative">
                <input type="file" accept=".json" onChange={handleImport} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border hover:border-slate-500 transition-colors">
                   <div className="flex gap-3">
                      {isImporting ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <Upload className="w-5 h-5 text-amber-400" />}
                      <div>
                        <p className="text-sm font-bold text-foreground">Importar</p>
                        <p className="text-xs text-muted-foreground">Cargar .JSON</p>
                      </div>
                   </div>
                   <span className="px-3 py-1 bg-slate-700 rounded-lg text-xs font-bold">Seleccionar</span>
                </div>
             </div>

             <div className="flex items-center justify-between p-4 bg-red-900/10 rounded-2xl border border-red-900/30 hover:border-red-900/50 transition-colors">
                <div className="flex gap-3 items-center">
                  <RefreshCw className="w-5 h-5 text-red-400" />
                  <div>
                    <p className="text-sm font-bold text-red-400">Reiniciar Kernel / IA</p>
                    <p className="text-xs text-red-500/70">Libera memoria caché y recarga</p>
                  </div>
                </div>
                <button onClick={handleRestartKernel} className="px-3 py-1 bg-red-900/40 hover:bg-red-800/60 text-red-200 rounded-lg text-xs font-bold transition-all">Ejecutar</button>
             </div>
          </div>
        </div>
      </div>

      {/* Cluster Status Tool */}
      <div className="mt-8 sm:mt-12 bg-primary border border-primary/50 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-3">
              <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 text-primary" /> Monitor de Clúster
            </h3>
            <p className="text-[10px] sm:text-xs text-primary/60 mt-1">Verifica la identidad y coordinación con otros dispositivos.</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-primary rounded-lg border border-primary/50">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-tight">{nodeId}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-card rounded-2xl border border-border">
            <p className="text-xs font-bold text-primary mb-2 uppercase">Identidad de Nodo</p>
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="p-2 bg-primary rounded-lg">
                <Terminal className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-mono">{nodeId}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 italic">Este ID es único para este navegador/dispositivo y previene conflictos de análisis.</p>
          </div>

          <div className="p-4 bg-card rounded-2xl border border-border flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-primary mb-2 uppercase">Prueba de Concurrencia</p>
              {clusterTestResult && (
                <p className={`text-[10px] p-2 rounded-lg mb-2 ${clusterTestResult.includes('éxito') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                   {clusterTestResult}
                </p>
              )}
            </div>
            <button 
              onClick={testClusterLock} 
              disabled={isTestingCluster}
              className="w-full py-2 bg-primary hover:bg-primary text-foreground rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isTestingCluster ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
              Probar Sistema de Bloqueo
            </button>
          </div>
        </div>

        {/* AI Health Stats */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-card rounded-2xl border border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Estado IA</p>
              <div className={`w-2 h-2 rounded-full ${aiStatus?.isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
            </div>
            <div className="text-lg font-bold text-foreground truncate h-7">
              {aiStatus?.isRunning ? 'Trabajando...' : 'En Espera'}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{aiStatus?.currentTask || 'Sin tareas activas'}</p>
          </div>

          <div className="p-4 bg-card rounded-2xl border border-border">
            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Cola de Tareas</p>
            <div className="text-3xl font-black text-primary">
              {queueLength}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Tareas locales pendientes</p>
          </div>

          <div className="p-4 bg-card rounded-2xl border border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Estrés Térmico</p>
              <span className="text-[10px] font-mono text-muted-foreground">{Math.round(aiStatus?.thermalStress || 0)}/200</span>
            </div>
            <div className="h-2 w-full bg-card rounded-full overflow-hidden">
               <div 
                  className={`h-full transition-all duration-500 ${ (aiStatus?.thermalStress || 0) > 100 ? 'bg-orange-500' : 'bg-primary'}`}
                  style={{ width: `${Math.min(100, ((aiStatus?.thermalStress || 0) / 200) * 100)}%` }}
               />
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-[9px] text-muted-foreground uppercase">Perfil: {aiStatus?.deviceTier}</span>
              <span className="text-[9px] text-primary font-bold">{aiStatus?.thermalStress > 50 ? 'Enfriamiento Activo' : 'Deseable'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Logger Section */}
      <div className="mt-8 sm:mt-12 bg-card border border-border rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-3">
             <Terminal className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" /> Logs de Sistema
          </h3>
          <button 
            onClick={clearLogs}
            className="w-full sm:w-auto px-4 py-2 bg-card hover:bg-red-900/30 text-muted-foreground hover:text-red-400 border border-border hover:border-red-900/50 rounded-xl text-xs font-bold transition-all"
          >
            Limpiar Logs
          </button>
        </div>

        <div className="bg-card rounded-2xl border border-border font-mono text-[11px] overflow-hidden">
          <div className="max-h-[300px] overflow-y-auto p-4 space-y-2">
            {logs.length === 0 ? (
              <div className="text-muted-foreground italic py-10 text-center">No hay registros de actividad todavía.</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex gap-3 animate-in slide-in-from-left-2 duration-200">
                  <span className="text-muted-foreground shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span className={`shrink-0 font-bold ${
                    log.level === 'success' ? 'text-emerald-400' : 
                    log.level === 'error' ? 'text-red-400' :
                    log.level === 'warn' ? 'text-amber-400' : 'text-blue-400'
                  }`}>
                    {log.level.toUpperCase()}
                  </span>
                  <span className="text-muted-foreground font-bold shrink-0">[{log.module}]</span>
                  <span className="text-foreground">{log.message}</span>
                  {log.details && (
                    <span className="text-muted-foreground italic opacity-60 ml-1">({typeof log.details === 'string' ? log.details : JSON.stringify(log.details)})</span>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="bg-slate-950 px-4 py-2 border-t border-border text-[9px] text-muted-foreground flex justify-between uppercase tracking-widest">
            <span>Supabase Cloud Engine: Active</span>
            <span>Local DB Cache: Verified</span>
          </div>
        </div>
      </div>

      <div className="mt-8 p-6 bg-background rounded-3xl border border-border flex items-start gap-4">
        <ShieldAlert className="w-6 h-6 text-primary shrink-0" />
        <div>
           <p className="text-sm font-bold text-foreground">Privacidad en primer plano</p>
           <p className="text-xs text-muted-foreground leading-relaxed mt-1">
             Tu base de datos y conversaciones de IA se procesan localmente. El respaldo en la nube es opcional y se cifra en tu instancia privada de Firebase.
           </p>
        </div>
      </div>
    </div>
  );
};
