import { AIService } from './AIService';
import { CloudSyncService } from './CloudSyncService';
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
    }, 5 * 60 * 1000); // Revisar cada 5 minutos
    
    // Revisión inicial suave
    setTimeout(() => this.scoutPendingWork(), 10000);
  }

  /**
   * Busca productos que necesitan atención y los encola en el TaskQueue.
   */
  static async scoutPendingWork() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.updateStatus({ isRunning: true, currentTask: 'Scouting work...' });
    
    try {
      const db = await DataService.getDB();
      if (!db) return;

      // Buscar productos sin vectores (Prioridad 1)
      const pendingVector = await db.products.find({
        selector: {
          $or: [
            { vectores: { $exists: false } },
            { vectores: { $size: 0 } }
          ]
        },
        limit: 20
      }).exec();

      if (pendingVector.length > 0) {
        console.log(`[Orchestrator Scout] Encontrados ${pendingVector.length} productos para vectorización.`);
        for (const p of pendingVector) {
          await TaskQueueService.addTask('vectorization', { sku: p.sku });
        }
      }

      // Buscar productos sin análisis clínico (Prioridad 2)
      const pendingAnalysis = await db.products.find({
        selector: {
          synergy_analyzed: { $ne: true }
        },
        limit: 10
      }).exec();

      if (pendingAnalysis.length > 0) {
        console.log(`[Orchestrator Scout] Encontrados ${pendingAnalysis.length} productos para análisis clínico.`);
        for (const p of pendingAnalysis) {
          await TaskQueueService.addTask('ai_analysis', { sku: p.sku, type: 'synergy' });
        }
      }

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
    
    // Enfriamiento natural: ULTRA enfría más rápido (mejor hardware), ECO más lento
    // ULTRA: 2 pts/sec, STANDARD: 1 pt/sec, ECO: 0.5 pts/sec
    const coolingFactors = { ULTRA: 2, STANDARD: 1, ECO: 0.5 };
    const cooling = Math.floor((restTime / 1000) * coolingFactors[tier as keyof typeof coolingFactors]);
    this.thermalStress = Math.max(0, this.thermalStress - cooling);
    
    // Penalización por Tier: ECO acumula el DOBLE de estrés por la misma tarea
    // ULTRA acumula menos estrés por tener mejores núcleos térmicos
    const stressMultiplier = tier === 'ECO' ? 2 : (tier === 'ULTRA' ? 0.7 : 1);
    this.thermalStress += (points * stressMultiplier);
    this.lastTaskTimestamp = now;
    this.notify();
    
    // Umbrales de advertencia dinámicos
    const thresholds = { ULTRA: 300, STANDARD: 150, ECO: 50 };
    if (this.thermalStress > thresholds[tier as keyof typeof thresholds]) {
      console.warn(`[ThermalGuard] Estrés elevado (${Math.round(this.thermalStress)}) en perfil ${tier}. Ralentizando...`);
    }
    
    return this.thermalStress;
  }

  static getThermalDelay(): number {
    const tier = this.hardware?.deviceTier || 'STANDARD';
    const stress = this.thermalStress;

    // Lógica Universal de Retardos (Escalada por Tier)
    if (tier === 'ECO') {
      if (stress > 100) return 60000; // 1 min de respiro
      if (stress > 50)  return 20000; // 20s
      if (stress > 25)  return 10000; // 10s
      return 5000; // 5s mínimo en ECO (Móviles/PDAs)
    }

    if (tier === 'STANDARD') {
      if (stress > 200) return 45000;
      if (stress > 100) return 12000;
      if (stress > 50)  return 5000;
      return 2500;
    }

    // Perfil ULTRA (MacBook M4, High-end PC)
    if (stress > 400) return 40000; 
    if (stress > 250) return 15000;
    if (stress > 150) return 6000;
    return 1500; // 1.5s ráfagas rápidas
  }
}
