import React, { useState } from 'react';
import { useHardwareDetection } from '../../hooks/useHardwareDetection';
import { Cpu, ShieldCheck, Settings, AlertTriangle, Download, Upload, FileJson, Loader2 } from 'lucide-react';
import { SystemDiagnostics } from '../../components/settings/SystemDiagnostics';
import { DataService } from '../../services/DataService';

export const SettingsModule: React.FC = () => {
  const { hardware } = useHardwareDetection();
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    try {
      const data = await DataService.exportProducts();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vademecum_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error al exportar datos.');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        try {
          const result = await DataService.importProducts(content);
          alert(`Importación completada: ${result.success} productos importados, ${result.errors} errores.`);
        } catch (err: any) {
          alert(err.message);
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsText(file);
    } catch (error) {
      alert('Error al leer el archivo.');
      setIsImporting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto pb-20 animate-in fade-in duration-300">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-400" />
          Configuración del Sistema
        </h2>
        <p className="text-slate-400 mt-1">
          Ajustes globales y diagnóstico del entorno de ejecución local.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Tarjeta de Perfil de Hardware */}
        <div className="bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-800">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Cpu className="w-5 h-5 text-indigo-400" />
            </div>
            Perfil de Hardware (IA)
          </h2>
          
          {hardware ? (
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center py-3 border-b border-slate-800">
                <span className="text-slate-400 font-medium">Memoria RAM Estimada</span>
                <span className="font-semibold text-slate-200">{hardware.memoryGB} GB</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-800">
                <span className="text-slate-400 font-medium">Aceleración GPU (WebGPU)</span>
                <span className="font-semibold text-slate-200">
                  {hardware.hasGPU ? `Sí (${hardware.gpuName})` : 'No detectada'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-800">
                <span className="text-slate-400 font-medium">Motor de IA Asignado</span>
                <span className={`font-semibold px-3 py-1 rounded-full border ${
                  hardware.aiModelTier === 'HIGH' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                  hardware.aiModelTier === 'LOW' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {hardware.aiModelTier === 'HIGH' ? 'WebLLM (GPU)' : 
                   hardware.aiModelTier === 'LOW' ? 'Transformers.js (CPU)' : 'Sin IA Local'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-800">
                <span className="text-slate-400 font-medium">Modelo Principal</span>
                <span className="font-semibold text-slate-200">
                  {hardware.aiModelTier === 'HIGH' ? 'Llama-3.2-1B-Instruct' : 
                   hardware.aiModelTier === 'LOW' ? 'TinyLlama-1.1B-Chat' : 'Ninguno'}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-sm text-slate-500">
              <div className="animate-pulse flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                Cargando perfil...
              </div>
            </div>
          )}
        </div>

        {/* Tarjeta de Gestión de Datos Local */}
        <div className="bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-800">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <FileJson className="w-5 h-5 text-amber-400" />
            </div>
            Gestión de Datos Local
          </h2>
          
          <div className="space-y-6">
            <p className="text-sm text-slate-400 leading-relaxed">
              Importa o exporta tu base de datos local en formato JSON. Útil para sincronizar con scripts externos o realizar copias de seguridad.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleExport}
                className="flex flex-col items-center justify-center gap-3 p-4 bg-slate-800/50 hover:bg-slate-800 rounded-2xl border border-slate-700 transition-all group"
              >
                <Download className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-300">Exportar JSON</span>
              </button>
              
              <label className="flex flex-col items-center justify-center gap-3 p-4 bg-slate-800/50 hover:bg-slate-800 rounded-2xl border border-slate-700 transition-all group cursor-pointer">
                {isImporting ? (
                  <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                ) : (
                  <Upload className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
                )}
                <span className="text-xs font-bold text-slate-300">Importar JSON</span>
                <input type="file" accept=".json" onChange={handleImport} className="hidden" disabled={isImporting} />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Diagnóstico del Sistema */}
      <SystemDiagnostics />

      {/* Tarjeta de Estado del Sistema */}
      <div className="bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-800 mt-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          Seguridad y Privacidad
        </h2>
        
        <div className="space-y-4 text-sm">
          <div className="flex justify-between items-center py-3 border-b border-slate-800">
            <span className="text-slate-400 font-medium">Modo de Operación</span>
            <span className="font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">Local-First (Offline)</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-slate-800">
            <span className="text-slate-400 font-medium">Almacenamiento de Datos</span>
            <span className="font-semibold text-slate-200 bg-slate-800 px-3 py-1 rounded-full">IndexedDB (Navegador)</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-slate-800">
            <span className="text-slate-400 font-medium">Procesamiento de IA</span>
            <span className="font-semibold text-slate-200 bg-slate-800 px-3 py-1 rounded-full">On-Device (Sin Servidor)</span>
          </div>
        </div>

        <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-200 leading-relaxed">
            <strong>Aviso de Privacidad:</strong> Toda la información clínica y los datos de los pacientes procesados por la IA nunca abandonan este dispositivo. No se envían datos a servidores externos.
          </p>
        </div>
      </div>
    </div>
  );
};
