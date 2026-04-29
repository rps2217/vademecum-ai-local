import React, { useState } from 'react';
import { useHardwareDetection } from '../../hooks/useHardwareDetection';
import { Cpu, ShieldCheck, Settings, Download, Upload, Loader2, Brain, Zap, ShieldAlert, Cloud, RefreshCw } from 'lucide-react';
import { DataService } from '../../services/DataService';
import { ConfigService, AppConfig } from '../../services/ConfigService';

export const SettingsModule: React.FC = () => {
  const { hardware } = useHardwareDetection();
  const [isImporting, setIsImporting] = useState(false);
  const [config, setConfig] = useState<AppConfig>(ConfigService.getConfig());

  const handleConfigChange = (updates: Partial<AppConfig>) => {
    const newConfig = ConfigService.updateConfig(updates);
    setConfig(newConfig);
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
        localStorage.removeItem('backend_node_active');
        localStorage.removeItem('force_supabase_direct');
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
                  <p className="text-xs text-slate-500">Respaldo automático (Firebase)</p>
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
