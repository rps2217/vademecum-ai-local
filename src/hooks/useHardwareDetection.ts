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
        const supportsWebGPU = 'gpu' in navigator;
        
        if (supportsWebGPU && hasGPU && memoryGB >= 8) {
          aiModelTier = 'HIGH'; 
        } else if (memoryGB >= 4) {
          aiModelTier = 'LOW';
        }

        // Determinar DeviceTier para el sistema de enfriamiento universal
        // Detectar si es móvil mediante userAgent y capacidades básicas
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        let deviceTier: HardwareProfile['deviceTier'] = 'STANDARD';
        if (!isMobile && logicalProcessors >= 8 && memoryGB >= 16) {
          deviceTier = 'ULTRA'; // MacBook M4, Workstations
        } else if (isMobile || logicalProcessors <= 2 || memoryGB <= 4) {
          deviceTier = 'ECO';   // Móviles, PDAs, PCs antiguos o de oficina básica
        }

        setHardware({
          hasGPU,
          gpuName,
          memoryGB,
          logicalProcessors,
          aiModelTier,
          deviceTier
        });
      } catch (error) {
        console.error('Error detectando hardware:', error);
        // Fallback seguro
        setHardware({
          hasGPU: false,
          memoryGB: 2,
          logicalProcessors: 2,
          aiModelTier: 'NONE',
          deviceTier: 'ECO'
        });
      } finally {
        setIsDetecting(false);
      }
    };

    detectHardware();
  }, []);

  return { hardware, isDetecting };
};
