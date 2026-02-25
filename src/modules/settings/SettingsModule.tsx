import React, { useState, useEffect } from 'react';
import { useHardwareDetection } from '../../hooks/useHardwareDetection';
import { Cpu, ShieldCheck, Settings, AlertTriangle, Cloud, Copy, Check } from 'lucide-react';
import { GoogleSyncService } from '../../services/GoogleSyncService';

export const SettingsModule: React.FC = () => {
  const { hardware } = useHardwareDetection();
  const [gasUrl, setGasUrl] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    setGasUrl(GoogleSyncService.getGasUrl());
  }, []);

  const handleSaveGasUrl = () => {
    GoogleSyncService.setGasUrl(gasUrl);
    alert('URL de Google Apps Script guardada correctamente.');
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GoogleSyncService.getGasScriptTemplate());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto pb-20 animate-in fade-in duration-300">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-600" />
          Configuración del Sistema
        </h2>
        <p className="text-slate-500 mt-1">
          Ajustes globales y diagnóstico del entorno de ejecución local.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Tarjeta de Perfil de Hardware */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Cpu className="w-5 h-5 text-indigo-600" />
            </div>
            Perfil de Hardware (IA)
          </h2>
          
          {hardware ? (
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Memoria RAM Estimada</span>
                <span className="font-semibold text-slate-900">{hardware.memoryGB} GB</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Aceleración GPU (WebGPU)</span>
                <span className="font-semibold text-slate-900">
                  {hardware.hasGPU ? `Sí (${hardware.gpuName})` : 'No detectada'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Motor de IA Asignado</span>
                <span className={`font-semibold px-3 py-1 rounded-full border ${
                  hardware.aiModelTier === 'HIGH' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                  hardware.aiModelTier === 'LOW' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  'bg-slate-50 text-slate-700 border-slate-200'
                }`}>
                  {hardware.aiModelTier === 'HIGH' ? 'WebLLM (GPU)' : 
                   hardware.aiModelTier === 'LOW' ? 'Transformers.js (CPU)' : 'Sin IA Local'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Modelo Principal</span>
                <span className="font-semibold text-slate-900">
                  {hardware.aiModelTier === 'HIGH' ? 'Llama-3.2-1B-Instruct' : 
                   hardware.aiModelTier === 'LOW' ? 'TinyLlama-1.1B-Chat' : 'Ninguno'}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-sm text-slate-500">
              <div className="animate-pulse flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                Cargando perfil...
              </div>
            </div>
          )}
        </div>

        {/* Tarjeta de Estado del Sistema */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            Seguridad y Privacidad
          </h2>
          
          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Modo de Operación</span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">Local-First (Offline)</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Almacenamiento de Datos</span>
              <span className="font-semibold text-slate-900 bg-slate-100 px-3 py-1 rounded-full">IndexedDB (Navegador)</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Procesamiento de IA</span>
              <span className="font-semibold text-slate-900 bg-slate-100 px-3 py-1 rounded-full">On-Device (Sin Servidor)</span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Aviso de Privacidad:</strong> Toda la información clínica y los datos de los pacientes procesados por la IA nunca abandonan este dispositivo. No se envían datos a servidores externos.
            </p>
          </div>
        </div>
      </div>

      {/* Configuración de Google Sheets Sync */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Cloud className="w-5 h-5 text-blue-600" />
          </div>
          Sincronización con Google Sheets
        </h2>
        <p className="text-slate-500 text-sm mb-6">
          Respalda tu base de datos local en la nube para no perder el trabajo del scraper o para sincronizar múltiples dispositivos.
        </p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              URL del Web App (Google Apps Script)
            </label>
            <div className="flex gap-3">
              <input
                type="url"
                value={gasUrl}
                onChange={(e) => setGasUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
              />
              <button
                onClick={handleSaveGasUrl}
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                Guardar URL
              </button>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-900">¿Cómo configurar Google Sheets?</h3>
              <button
                onClick={handleCopyScript}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {isCopied ? 'Copiado' : 'Copiar Código'}
              </button>
            </div>
            <ol className="list-decimal list-inside text-sm text-slate-600 space-y-2 mb-4">
              <li>Crea un nuevo Google Sheet.</li>
              <li>Ve a <strong>Extensiones &gt; Apps Script</strong>.</li>
              <li>Borra el código existente y pega el código que puedes copiar arriba.</li>
              <li>Haz clic en <strong>Implementar &gt; Nueva implementación</strong>.</li>
              <li>Selecciona tipo <strong>Aplicación web</strong>.</li>
              <li>En "Quién tiene acceso", selecciona <strong>Cualquier persona</strong>.</li>
              <li>Copia la URL generada y pégala en el campo de arriba.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
