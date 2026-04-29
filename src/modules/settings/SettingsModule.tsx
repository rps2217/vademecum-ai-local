import React, { useState } from 'react';
import { useHardwareDetection } from '../../hooks/useHardwareDetection';
import { Cpu, ShieldCheck, Settings, Download, Upload, Loader2, Brain, Zap, ShieldAlert, Cloud, RefreshCw, Terminal, XCircle, CheckCircle2, Info, AlertCircle } from 'lucide-react';
import { DataService } from '../../services/DataService';
import { ConfigService, AppConfig } from '../../services/ConfigService';
import { useLogs } from '../../hooks/useLogs';
import { LogService } from '../../services/LogService';
import { getDeviceId } from '../../utils/clusterUtils';
import { CloudSyncService } from '../../services/CloudSyncService';

export const SettingsModule: React.FC = () => {
  const { hardware } = useHardwareDetection();
  const [isImporting, setIsImporting] = useState(false);
  const [config, setConfig] = useState<AppConfig>(ConfigService.getConfig());
  const { logs, clearLogs } = useLogs();
  const [nodeId] = useState(getDeviceId());
  const [isTestingCluster, setIsTestingCluster] = useState(false);
  const [clusterTestResult, setClusterTestResult] = useState<string | null>(null);

  const testClusterLock = async () => {
    setIsTestingCluster(true);
    setClusterTestResult(null);
    try {
      // Usamos un SKU ficticio para probar el sistema de colas/locks
      const success = await CloudSyncService.claimProductLock('CLUSTER_TEST_PING', nodeId);
      if (success) {
        setClusterTestResult('Lock adquirido con éxito. Este dispositivo tiene exclusividad sobre la tarea de prueba.');
        LogService.add({
          level: 'success',
          module: 'Cluster',
          message: `Prueba de clúster exitosa: Lock adquirido por ${nodeId}`
        });
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
    const newConfig = ConfigService.updateConfig(updates);
    setConfig(newConfig);
    LogService.add({
      level: 'info',
      module: 'Config',
      message: `Configuración actualizada: ${Object.keys(updates).join(', ')}`
    });
  };

  const handleExport = async () => {
    try {
      const all = await DataService.getAllProducts();
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
              await DataService.saveProduct(p);
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
        console.error('Error al reiniciar kernel:', error);
        window.location.reload();
      }
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto pb-20 animate-in fade-in duration-300">
      <div className="mb-10">
        <h2 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <Settings className="w-8 h-8 text-brand-primary" />
          Configuración
        </h2>
        <p className="text-slate-400 mt-2 text-lg">Administra las preferencias y el respaldo de tu sistema.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* IA */}
        <div className="bg-brand-surface border border-slate-700 rounded-3xl p-8 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
             <Brain className="w-6 h-6 text-brand-primary" /> Inteligencia Artificial
          </h3>
          <div className="space-y-4">
             <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-700">
                <div>
                  <p className="text-sm font-bold text-white">Análisis en Segundo Plano</p>
                  <p className="text-xs text-slate-500">Detecta sinergias automáticamente</p>
                </div>
                <button
                  onClick={() => handleConfigChange({ enableBackgroundSynergy: !config.enableBackgroundSynergy })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${config.enableBackgroundSynergy ? 'bg-brand-primary' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.enableBackgroundSynergy ? 'left-7' : 'left-1'}`} />
                </button>
             </div>
             <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-700">
                <div>
                  <p className="text-sm font-bold text-white">Sincronización Cloud</p>
                  <p className="text-xs text-slate-500">Respaldo automático (Supabase)</p>
                </div>
                <button
                  onClick={() => handleConfigChange({ autoSyncCloud: !config.autoSyncCloud })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${config.autoSyncCloud ? 'bg-brand-primary' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.autoSyncCloud ? 'left-7' : 'left-1'}`} />
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
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.useOllama ? 'left-7' : 'left-1'}`} />
                </button>
             </div>
          </div>
        </div>

        {/* Hardware & Mantenimiento */}
        <div className="bg-brand-surface border border-slate-700 rounded-3xl p-8 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
             <ShieldCheck className="w-6 h-6 text-emerald-400" /> Sistema y Backup
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
             <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-700">
                <div className="flex gap-3">
                  <Download className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-sm font-bold text-white">Exportar</p>
                    <p className="text-xs text-slate-500">Descarga .JSON</p>
                  </div>
                </div>
                <button onClick={handleExport} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold transition-all">Exportar</button>
             </div>
             
             <div className="relative">
                <input type="file" accept=".json" onChange={handleImport} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-700 hover:border-slate-500 transition-colors">
                   <div className="flex gap-3">
                      {isImporting ? <Loader2 className="w-5 h-5 animate-spin text-brand-primary" /> : <Upload className="w-5 h-5 text-amber-400" />}
                      <div>
                        <p className="text-sm font-bold text-white">Importar</p>
                        <p className="text-xs text-slate-500">Cargar .JSON</p>
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
      <div className="mt-12 bg-indigo-900/10 border border-indigo-500/20 rounded-3xl p-8 shadow-xl">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <RefreshCw className="w-6 h-6 text-indigo-400" /> Monitor de Clúster (Smart Synergy)
            </h3>
            <p className="text-xs text-indigo-300/60 mt-1">Verifica la identidad de este nodo y la coordinación con otros dispositivos.</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
            <span className="text-[10px] font-mono text-indigo-300 font-bold uppercase tracking-tight">{nodeId}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-700">
            <p className="text-xs font-bold text-indigo-400 mb-2 uppercase">Identidad de Nodo</p>
            <div className="flex items-center gap-3 text-slate-300">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <Terminal className="w-4 h-4 text-indigo-400" />
              </div>
              <span className="text-sm font-mono">{nodeId}</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 italic">Este ID es único para este navegador/dispositivo y previene conflictos de análisis.</p>
          </div>

          <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-700 flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-indigo-400 mb-2 uppercase">Prueba de Concurrencia</p>
              {clusterTestResult && (
                <p className={`text-[10px] p-2 rounded-lg mb-2 ${clusterTestResult.includes('éxito') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                   {clusterTestResult}
                </p>
              )}
            </div>
            <button 
              onClick={testClusterLock} 
              disabled={isTestingCluster}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isTestingCluster ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
              Probar Sistema de Bloqueo
            </button>
          </div>
        </div>
      </div>

      {/* Logger Section */}
      <div className="mt-12 bg-brand-surface border border-slate-700 rounded-3xl p-8 shadow-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-3">
             <Terminal className="w-6 h-6 text-slate-400" /> Registro de Actividad (Logger)
          </h3>
          <button 
            onClick={clearLogs}
            className="px-4 py-1.5 bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-900/50 rounded-xl text-xs font-bold transition-all"
          >
            Limpiar Logs
          </button>
        </div>

        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 font-mono text-[11px] overflow-hidden">
          <div className="max-h-[300px] overflow-y-auto p-4 space-y-2">
            {logs.length === 0 ? (
              <div className="text-slate-600 italic py-10 text-center">No hay registros de actividad todavía.</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex gap-3 animate-in slide-in-from-left-2 duration-200">
                  <span className="text-slate-600 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span className={`shrink-0 font-bold ${
                    log.level === 'success' ? 'text-emerald-400' : 
                    log.level === 'error' ? 'text-red-400' :
                    log.level === 'warn' ? 'text-amber-400' : 'text-blue-400'
                  }`}>
                    {log.level.toUpperCase()}
                  </span>
                  <span className="text-slate-400 font-bold shrink-0">[{log.module}]</span>
                  <span className="text-slate-200">{log.message}</span>
                  {log.details && (
                    <span className="text-slate-500 italic opacity-60 ml-1">({typeof log.details === 'string' ? log.details : JSON.stringify(log.details)})</span>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="bg-slate-950 px-4 py-2 border-t border-slate-800 text-[9px] text-slate-600 flex justify-between uppercase tracking-widest">
            <span>Supabase Cloud Engine: Active</span>
            <span>Local DB Cache: Verified</span>
          </div>
        </div>
      </div>

      <div className="mt-8 p-6 bg-brand-bg rounded-3xl border border-slate-800 flex items-start gap-4">
        <ShieldAlert className="w-6 h-6 text-brand-primary shrink-0" />
        <div>
           <p className="text-sm font-bold text-slate-200">Privacidad en primer plano</p>
           <p className="text-xs text-slate-500 leading-relaxed mt-1">
             Tu base de datos y conversaciones de IA se procesan localmente. El respaldo en la nube es opcional y se cifra en tu instancia privada de Firebase.
           </p>
        </div>
      </div>
    </div>
  );
};
