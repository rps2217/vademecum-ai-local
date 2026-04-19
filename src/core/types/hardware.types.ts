export type AIModelTier = 'HIGH' | 'LOW' | 'NONE';

/**
 * Clasificación de Potencia de Dispositivo
 * ULTRA: MacBook M4, Workstations (Alto paralelismo)
 * STANDARD: PCs de oficina, laptops modernos gama media
 * ECO: Móviles antiguos, PDAs, PCs de bajos recursos
 */
export type DeviceTier = 'ULTRA' | 'STANDARD' | 'ECO';

export interface HardwareProfile {
  hasGPU: boolean;
  gpuName?: string;
  memoryGB: number;
  logicalProcessors: number;
  aiModelTier: AIModelTier;
  deviceTier: DeviceTier;
}
