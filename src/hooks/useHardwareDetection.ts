import { useState, useEffect } from 'react';
import { HardwareProfile, AIModelTier } from '../core/types/hardware.types';

export const useHardwareDetection = () => {
  const [hardware, setHardware] = useState<HardwareProfile | null>(null);
  const [isDetecting, setIsDetecting] = useState(true);

  useEffect(() => {
    const detectHardware = async () => {
      try {
        // Detectar Memoria RAM (Aproximada)
        const memoryGB = (navigator as any).deviceMemory || 4; // Fallback a 4GB
        const logicalProcessors = navigator.hardwareConcurrency || 2;
        
        // Detectar GPU mediante WebGL
        let hasGPU = false;
        let gpuName = 'Unknown';
        
        try {
          const canvas = document.createElement('canvas');
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          if (gl) {
            const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
              gpuName = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
              // Filtramos renderizadores por software conocidos (SwiftShader, llvmpipe)
              if (!gpuName.toLowerCase().includes('swiftshader') && !gpuName.toLowerCase().includes('llvmpipe')) {
                hasGPU = true;
              }
            }
          }
        } catch (e) {
          console.warn('No se pudo detectar GPU via WebGL', e);
        }

        // Determinar el tier del modelo de IA (Graceful Degradation)
        let aiModelTier: AIModelTier = 'NONE';
        
        // WebLLM requiere WebGPU, pero como aproximación usamos la memoria y existencia de GPU de hardware
        // Idealmente aquí se verificaría `navigator.gpu` para WebGPU
        const supportsWebGPU = 'gpu' in navigator;
        
        if (supportsWebGPU && hasGPU && memoryGB >= 8) {
          aiModelTier = 'HIGH'; // Capaz de correr WebLLM (ej. Llama-3-8B-Instruct-q4f32_1)
        } else if (memoryGB >= 4) {
          aiModelTier = 'LOW'; // Capaz de correr Transformers.js (ej. modelos cuantizados pequeños)
        }

        setHardware({
          hasGPU,
          gpuName,
          memoryGB,
          logicalProcessors,
          aiModelTier
        });
      } catch (error) {
        console.error('Error detectando hardware:', error);
        // Fallback seguro
        setHardware({
          hasGPU: false,
          memoryGB: 2,
          logicalProcessors: 2,
          aiModelTier: 'NONE'
        });
      } finally {
        setIsDetecting(false);
      }
    };

    detectHardware();
  }, []);

  return { hardware, isDetecting };
};
