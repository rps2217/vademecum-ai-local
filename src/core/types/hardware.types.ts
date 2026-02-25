export type AIModelTier = 'HIGH' | 'LOW' | 'NONE';

export interface HardwareProfile {
  hasGPU: boolean;
  gpuName?: string;
  memoryGB: number;
  logicalProcessors: number;
  aiModelTier: AIModelTier; // HIGH para WebLLM (GPU), LOW para Transformers.js (CPU), NONE si no soporta
}
