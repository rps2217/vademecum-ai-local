import { AppBootstrapper } from './core/bootstrapper/AppBootstrapper';
import { useHardwareDetection } from './hooks/useHardwareDetection';
import { SearchModule } from './modules/search/SearchModule';
import { Activity, ShieldCheck, Cpu } from 'lucide-react';

function Dashboard() {
  const { hardware } = useHardwareDetection();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-12 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-2xl mb-6">
          <Activity className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
          Vademécum Inteligente
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Consulta de medicamentos con razonamiento clínico local. Rápido, seguro y sin conexión a internet.
        </p>
      </header>

      {/* Módulo Principal de Búsqueda */}
      <div className="mb-16">
        <SearchModule />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Tarjeta de Estado del Sistema */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            Estado del Sistema
          </h2>
          
          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Base de Datos</span>
              <span className="font-semibold text-slate-900 bg-slate-100 px-3 py-1 rounded-full">IndexedDB (Lista)</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Modo de Operación</span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">Local-First (Offline)</span>
            </div>
          </div>
        </div>

        {/* Tarjeta de Perfil de Hardware */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
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
                <span className="text-slate-500 font-medium">Aceleración GPU</span>
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
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppBootstrapper>
      <Dashboard />
    </AppBootstrapper>
  );
}
