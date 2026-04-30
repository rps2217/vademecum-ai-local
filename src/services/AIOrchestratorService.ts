import { Product } from '../core/types/product.types';
import { DataService } from './DataService';
import { TaskQueueService } from './TaskQueueService';

export interface OrchestratorStatus {
  isRunning: boolean;
  progress: number;
  currentTask: string;
  thermalStress: number;
  deviceTier: string;
}

export class AIOrchestratorService {
  private static isRunning = false;
  private static isWatching = false;
  private static status: OrchestratorStatus = { 
    isRunning: false, 
    progress: 0, 
    currentTask: '', 
    thermalStress: 0,
    deviceTier: 'STANDARD'
  };
  private static listeners: Array<(status: OrchestratorStatus) => void> = [];
  
  // Gestión Térmica Dinámica Universal
  private static thermalStress = 0;
  private static lastTaskTimestamp = Date.now();
  private static hardware: any = null;

  static configure(hardware: any) {
    this.hardware = hardware;
    this.status.deviceTier = hardware?.deviceTier || 'STANDARD';
    console.log(`[ThermalGuard] Sistema configurado para perfil: ${this.status.deviceTier}`);
    this.notify();
  }

  static subscribe(listener: (status: OrchestratorStatus) => void) {
    this.listeners.push(listener);
    listener({ ...this.status });
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  private static notify() {
    this.status.thermalStress = this.thermalStress;
    this.listeners.forEach(l => l({ ...this.status }));
  }

  static updateStatus(updates: Partial<OrchestratorStatus>) {
    this.status = { ...this.status, ...updates };
    this.notify();
  }

  static startWatcher() {
    if (this.isWatching) return;
    this.isWatching = true;
    
    // El orquestador ya no "hace" el trabajo, solo "busca" trabajo pendiente
    window.setInterval(() => {
      this.scoutPendingWork().catch(err => console.error('[Orchestrator Scout] Failed:', err));
    }, 2 * 60 * 1000); // Revisar cada 2 minutos en lugar de 5
    
    // Revisión inicial suave
    setTimeout(() => this.scoutPendingWork(), 15000); // Dar 15s de margen inicial
  }

  /**
   * Busca productos que necesitan atención y los encola en el TaskQueue.
   */
  static async scoutPendingWork() {
    if (this.isRunning) return;
    
    // Verificar configuración
    const { ConfigService } = await import('./ConfigService');
    const config = ConfigService.getConfig();
    if (!config.enableBackgroundSynergy) {
      return;
    }

    // Verificar estado del motor IA (Import dinámico para romper ciclo circular)
    try {
      const { AIService } = await import('./AIService');
      const aiStatus = AIService.getStatus();
      
      // Si el motor falló o está cargando, abortamos búsqueda para no saturar memoria
      if (aiStatus.lastProgress.text.toLowerCase().includes('error') || aiStatus.isInitializing) {
        return;
      }
    } catch (e) {
      return; // AIService no disponible aún
    }

    this.isRunning = true;
    this.updateStatus({ isRunning: true, currentTask: 'Explorando inventario...' });
    
    try {
      const { LocalDBService } = await import('./LocalDBService');
      const { CloudSyncService } = await import('./CloudSyncService');
      
      const allProducts = await LocalDBService.getAllProducts();
      if (!allProducts || allProducts.length === 0) return;

      const deviceId = (await import('../utils/clusterUtils')).getDeviceId();
      
      // 1. Identificar candidatos para Vectorización
      const needsVector = allProducts.filter(p => !p.vectores || p.vectores.length === 0).slice(0, 10);
      
      for (const p of needsVector) {
        // En vectorización el bloqueo es menos crítico pero igual lo aplicamos para orden
        const canWork = await CloudSyncService.claimProductLock(p.sku, deviceId);
        if (canWork) {
           await TaskQueueService.addTask('vectorization', { sku: p.sku });
        }
      }

      // 2. Identificar candidatos para Análisis Clínico (Sinergia)
      // Priorizamos productos que tienen vectores pero no analisis (Mitad de camino)
      const halfDone = allProducts.filter(p => !p.synergy_analyzed && p.vectores && p.vectores.length > 0).slice(0, 10);
      const totallyPending = allProducts.filter(p => !p.synergy_analyzed && (!p.vectores || p.vectores.length === 0)).slice(0, 5);
      
      const needsAnalysis = [...halfDone, ...totallyPending].slice(0, 10);

      let claimedCount = 0;
      for (const p of needsAnalysis) {
        const canWork = await CloudSyncService.claimProductLock(p.sku, deviceId);
        if (canWork) {
          claimedCount++;
          await TaskQueueService.addTask('ai_analysis', { sku: p.sku, type: 'synergy' });
        }
      }

      if (claimedCount > 0) {
        (await import('./LogService')).LogService.add({
          level: 'info',
          module: 'AI_Clúster',
          message: `Reservados ${claimedCount} productos para análisis en este nodo.`
        });
      }

    } catch (error) {
      console.error('[Orchestrator Scout] Error en exploración de clúster:', error);
    } finally {
      this.isRunning = false;
      this.updateStatus({ isRunning: false, currentTask: '' });
    }
  }

  /**
   * Registra actividad térmica para frenar el sistema si es necesario.
   * El estrés se escala según la potencia del dispositivo.
   */
  static trackActivity(points: number) {
    const now = Date.now();
    const restTime = now - this.lastTaskTimestamp;
    const tier = this.hardware?.deviceTier || 'STANDARD';
    
    // Enfriamiento natural: WebGPU genera calor rápido que no disipa instantáneamente.
    // Reducimos los factores para que el "estrés lógico" aguante más y obligue a pausar.
    const coolingFactors = { ULTRA: 1, STANDARD: 0.5, ECO: 0.2 };
    const cooling = Math.floor((restTime / 1000) * coolingFactors[tier as keyof typeof coolingFactors]);
    this.thermalStress = Math.max(0, this.thermalStress - cooling);
    
    // Penalización por Tier
    const stressMultiplier = tier === 'ECO' ? 2 : (tier === 'ULTRA' ? 0.8 : 1);
    this.thermalStress += (points * stressMultiplier);
    this.lastTaskTimestamp = now;
    this.notify();
    
    // Umbrales de advertencia dinámicos (Más restrictivos)
    const thresholds = { ULTRA: 200, STANDARD: 120, ECO: 50 };
    if (this.thermalStress > thresholds[tier as keyof typeof thresholds]) {
      console.warn(`[ThermalGuard] Estrés elevado (${Math.round(this.thermalStress)}) en perfil ${tier}. Ralentizando hardware...`);
    }
    
    return this.thermalStress;
  }

  static getThermalDelay(): number {
    const tier = this.hardware?.deviceTier || 'STANDARD';
    const stress = this.thermalStress;

    // Lógica Universal de Retardos (Escalada por Tier - Enfoque WebGPU)
    // El objetivo es darle al ventilador/chasis tiempo de extraer el calor entre ráfagas
    
    if (tier === 'ECO') {
      if (stress > 100) return 90000; // 1.5 min de respiro vital
      if (stress > 50)  return 40000; // 40s
      if (stress > 25)  return 20000; // 20s
      return 10000; // 10s mínimo. No quemar teléfonos.
    }

    if (tier === 'STANDARD') {
      if (stress > 150) return 60000; // 1 min pause
      if (stress > 100) return 25000; // 25s
      if (stress > 50)  return 12000; // 12s
      return 6000;  // 6s mínimo base.
    }

    // Perfil ULTRA (MacBook M4, High-end PC)
    // Aunque tenga potencia, WebGPU usa el 100% de la GPU dedicada/integrada.
    if (stress > 300) return 60000; // Demasiado caliente, dormimos un minuto.
    if (stress > 180) return 25000; // Respiro severo para bajar ventilador.
    if (stress > 80) return 12000;  // Pre-enfriamiento.
    return 7000; // 7s MÍNIMO. Dar espacio a que la RAM unificada se vacíe limpiamente.
  }
}
