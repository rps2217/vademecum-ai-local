import { logger } from '../services/LoggerService';

/**
 * ThermalGuardService
 * Gestiona la carga de cómputo local para mantener la reactividad de la UI
 * en dispositivos con recursos limitados.
 */
export class ThermalGuardService {
  private static instance: ThermalGuardService;
  private isThermalLimitExceeded = false;
  private loadThreshold = 0.8; // 80% de carga percibida

  private constructor() {}

  static getInstance(): ThermalGuardService {
    if (!ThermalGuardService.instance) {
      ThermalGuardService.instance = new ThermalGuardService();
    }
    return ThermalGuardService.instance;
  }

  // Permite verificar si se deben pausar tareas pesadas (GPU/CPU)
  shouldPauseHeavyTask(): boolean {
    // Aquí implementaremos heurísticas basadas en FPS o tiempo de ejecución de tareas
    return this.isThermalLimitExceeded;
  }

  setLoadStatus(isHigh: boolean) {
    this.isThermalLimitExceeded = isHigh;
    logger.info(`[ThermalGuard]: Carga térmica alta - ${isHigh}`);
  }
}

export const thermalGuardService = ThermalGuardService.getInstance();
