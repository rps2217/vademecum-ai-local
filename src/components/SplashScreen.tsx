import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Database, Brain, CheckCircle, AlertCircle, Cpu, Shield } from 'lucide-react';
import { HardwareProfile } from '../core/types/hardware.types';
import { AIService } from '../services/AIService';
import { getDB } from '../core/database/db';

interface InitStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  detail?: string;
  progress?: number;
}

interface SplashScreenProps {
  onComplete: (hardware: HardwareProfile) => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [steps, setSteps] = useState<InitStep[]>([
    { id: 'hardware', label: 'Verificando Hardware', status: 'pending' },
    { id: 'database', label: 'Base de Datos Local', status: 'pending' },
    { id: 'ai_engine', label: 'Motor de Inteligencia Artificial', status: 'pending' },
  ]);
  
  const [hardware, setHardware] = useState<HardwareProfile | null>(null);

  const updateStep = (id: string, updates: Partial<InitStep>) => {
    setSteps(prev => prev.map(step => step.id === id ? { ...step, ...updates } : step));
  };

  useEffect(() => {
    const runInitialization = async () => {
      // 1. Hardware Detection
      updateStep('hardware', { status: 'loading', detail: 'Analizando capacidades...' });
      await new Promise(r => setTimeout(r, 800)); // Small delay for visual pacing
      
      let currentHardware: HardwareProfile;
      try {
        // Simple detection logic moved here for the boot sequence
        const memoryGB = (navigator as any).deviceMemory || 4;
        const logicalProcessors = navigator.hardwareConcurrency || 2;
        let hasGPU = false;
        let gpuName = 'Desconocida';
        
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl');
            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    gpuName = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                    if (!gpuName.toLowerCase().includes('swiftshader') && !gpuName.toLowerCase().includes('llvmpipe')) {
                        hasGPU = true;
                    }
                }
            }
        } catch (e) { console.warn(e); }

        // Determine Tier
        let aiModelTier: 'HIGH' | 'LOW' | 'NONE' = 'NONE';
        const supportsWebGPU = 'gpu' in navigator;
        
        // Detección de Apple Silicon (M1, M2, M3, M4)
        const isAppleSilicon = gpuName.toLowerCase().includes('apple') || 
                              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 0) ||
                              (navigator.userAgent.includes('Macintosh') && logicalProcessors > 8);

        // Detección de GPUs dedicadas (NVIDIA/AMD - Comunes en Windows)
        const isDedicatedGPU = gpuName.toLowerCase().includes('nvidia') || 
                               gpuName.toLowerCase().includes('radeon') ||
                               gpuName.toLowerCase().includes('geforce');

        // Detección de GPUs integradas lentas (Intel)
        const isSlowIntegrated = (gpuName.toLowerCase().includes('intel') || 
                                 gpuName.toLowerCase().includes('uhd') || 
                                 gpuName.toLowerCase().includes('iris')) && !isAppleSilicon && !isDedicatedGPU;
        
        // REGLAS DE TIERING UNIVERSALES:
        // 1. HIGH (GPU): Requiere WebGPU y hardware potente (Apple Silicon, GPU dedicada o 8GB+ RAM)
        if (supportsWebGPU && hasGPU && (isAppleSilicon || isDedicatedGPU || (memoryGB >= 8))) {
             aiModelTier = 'HIGH';
        } 
        // 2. LOW (CPU): Baseline para cualquier equipo moderno con al menos 2GB de RAM detectada
        else if (memoryGB >= 2 || isAppleSilicon || logicalProcessors >= 4) {
             aiModelTier = 'LOW';
        }

        currentHardware = { memoryGB, hasGPU, gpuName, logicalProcessors, aiModelTier };
        setHardware(currentHardware);
        
        updateStep('hardware', { 
            status: 'success', 
            detail: `${aiModelTier === 'HIGH' ? 'GPU Detectada (Modo Rápido)' : aiModelTier === 'LOW' ? 'Modo Compatibilidad (CPU)' : 'IA Desactivada'} • ${memoryGB}GB RAM` 
        });

      } catch (e) {
        updateStep('hardware', { status: 'error', detail: 'Error detectando hardware' });
        return;
      }

      // 2. Database Initialization
      updateStep('database', { status: 'loading', detail: 'Conectando IndexedDB...' });
      try {
        await getDB();
        await new Promise(r => setTimeout(r, 500));
        updateStep('database', { status: 'success', detail: 'Almacenamiento listo' });
      } catch (e) {
        updateStep('database', { status: 'error', detail: 'Fallo en base de datos' });
        return;
      }

      // 3. AI Engine Initialization (SKIPPED FOR LAZY LOADING)
      updateStep('ai_engine', { status: 'success', detail: 'Modo diferido activado' });
      
      // Final delay before completing
      setTimeout(() => {
          onComplete(currentHardware);
      }, 500);

    };

    runInitialization();
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-950 text-white flex flex-col items-center justify-center z-50 p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-4">
            <Activity className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Vademécum AI</h1>
          <p className="text-slate-400">Inicializando sistema clínico...</p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6 backdrop-blur-sm">
          {steps.map((step) => (
            <div key={step.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {step.id === 'hardware' && <Cpu className="w-5 h-5 text-slate-500" />}
                  {step.id === 'database' && <Database className="w-5 h-5 text-slate-500" />}
                  {step.id === 'ai_engine' && <Brain className="w-5 h-5 text-slate-500" />}
                  <span className={`font-medium ${step.status === 'loading' ? 'text-indigo-400' : 'text-slate-200'}`}>
                    {step.label}
                  </span>
                </div>
                {step.status === 'pending' && <div className="w-2 h-2 rounded-full bg-slate-700" />}
                {step.status === 'loading' && <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />}
                {step.status === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                {step.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
              </div>
              
              {(step.status === 'loading' || step.status === 'error' || step.status === 'success') && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pl-8"
                >
                  <p className={`text-xs ${step.status === 'error' ? 'text-red-400' : 'text-slate-500'}`}>
                    {step.detail}
                  </p>
                  {step.progress !== undefined && step.status === 'loading' && (
                    <div className="mt-2 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-indigo-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${step.progress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          ))}
        </div>

        {steps.some(s => s.status === 'error') && (
           <motion.button
             whileHover={{ scale: 1.02 }}
             whileTap={{ scale: 0.98 }}
             onClick={() => onComplete(hardware || { 
                memoryGB: 4, hasGPU: false, gpuName: '', logicalProcessors: 2, aiModelTier: 'NONE' 
             })}
             className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors"
           >
             Continuar en Modo Seguro (Sin IA Local)
           </motion.button>
        )}
      </motion.div>
    </div>
  );
};
