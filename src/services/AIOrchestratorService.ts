import { dataService } from './DataService';
import { taskQueueService } from './TaskQueueService';
import { logger } from './LoggerService';

export interface OrchestratorStatus {
  isRunning: boolean;
  progress: number;
  currentTask: string;
  thermalStress: number;
  deviceTier: string;
}

export class AIOrchestratorService {
  private static instance: AIOrchestratorService;
  private isRunning = false;
  private isWatching = false;
  private status: OrchestratorStatus = { 
    isRunning: false, 
    progress: 0, 
    currentTask: '', 
    thermalStress: 0,
    deviceTier: 'STANDARD'
  };
  private listeners: Array<(status: OrchestratorStatus) => void> = [];
  
  private thermalStress = 0;
  private lastTaskTimestamp = Date.now();
  private hardware: any = null;

  private constructor() {}

  static getInstance(): AIOrchestratorService {
    if (!AIOrchestratorService.instance) {
      AIOrchestratorService.instance = new AIOrchestratorService();
    }
    return AIOrchestratorService.instance;
  }

  configure(hardware: any) {
    this.hardware = hardware;
    this.status.deviceTier = hardware?.deviceTier || 'STANDARD';
    logger.info(`[ThermalGuard] Sistema configurado para perfil: ${this.status.deviceTier}`);
    this.notify();
  }

  subscribe(listener: (status: OrchestratorStatus) => void) {
    this.listeners.push(listener);
    listener({ ...this.status });
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  private notify() {
    this.status.thermalStress = this.thermalStress;
    this.listeners.forEach(l => l({ ...this.status }));
  }

  updateStatus(updates: Partial<OrchestratorStatus>) {
    this.status = { ...this.status, ...updates };
    this.notify();
  }

  startWatcher() {
    if (this.isWatching) return;
    this.isWatching = true;
    
    window.setInterval(() => {
      this.scoutPendingWork().catch(err => logger.error('[Orchestrator Scout] Failed:', err));
    }, 2 * 60 * 1000); 
    
    setTimeout(() => this.scoutPendingWork(), 15000);
  }

  async scoutPendingWork() {
    if (this.isRunning) return;
    
    // Thermal Guard: Skip background work if already stressed
    const tier = this.hardware?.deviceTier || 'STANDARD';
    const thresholds = { ULTRA: 250, STANDARD: 150, ECO: 70 };
    if (this.thermalStress > thresholds[tier as keyof typeof thresholds]) {
      logger.info(`[Orchestrator] Saltando scout por estrés térmico (${Math.round(this.thermalStress)})`);
      return;
    }

    const { configService } = await import('./ConfigService');
    const config = configService.getConfig();
    if (!config.enableBackgroundSynergy) {
      return;
    }

    try {
      const { aiService } = await import('./AIService');
      const aiStatus = aiService.getStatus();
      
      if (aiStatus.lastProgress.text.toLowerCase().includes('error') || aiStatus.isInitializing) {
        return;
      }
    } catch (e) {
      return; 
    }

    this.isRunning = true;
    this.updateStatus({ isRunning: true, currentTask: 'Explorando inventario...' });
    
    try {
      const { cloudSyncService } = await import('./CloudSyncService');
      
      const allProducts = await dataService.getAllProducts();
      if (!allProducts || allProducts.length === 0) return;

      const now = Date.now();
      const ONE_HOUR = 60 * 60 * 1000;

      const deviceId = (await import('../utils/clusterUtils')).getDeviceId();
      
      const validForAnalysis = allProducts.filter(p => {
        if (p.synergy_analyzed) return false;
        
        const retries = (p as any).synergy_retries || 0;
        const lastAttempt = p.last_synergy_analysis || 0;

        if (retries >= 3) return false;
        if (retries > 0 && (now - lastAttempt < ONE_HOUR)) return false;

        return true;
      });

      const needsVector = validForAnalysis.filter(p => !p.vectores || p.vectores.length === 0).slice(0, 10);
      
      for (const p of needsVector) {
        const canWork = await cloudSyncService.claimProductLock(p.sku, deviceId);
        if (canWork) {
           await taskQueueService.addTask('vectorization', { sku: p.sku });
        }
      }

      const halfDone = validForAnalysis.filter(p => p.vectores && p.vectores.length > 0).slice(0, 10);
      const totallyPending = validForAnalysis.filter(p => !p.vectores || p.vectores.length === 0).slice(0, 5);
      
      const needsAnalysis = [...halfDone, ...totallyPending].slice(0, 10);

      let claimedCount = 0;
      for (const p of needsAnalysis) {
        const canWork = await cloudSyncService.claimProductLock(p.sku, deviceId);
        if (canWork) {
          claimedCount++;
          await taskQueueService.addTask('ai_analysis', { sku: p.sku, type: 'synergy' });
        }
      }

      if (claimedCount > 0) {
        logger.info(`Reservados ${claimedCount} productos para análisis en este nodo.`, 'AI_Clúster');
      }

      // Scout para análisis de componentes/ingredientes
      const needsIngredientAnalysis = allProducts.filter(p => {
        // Solo si tiene principios activos
        if (!p.principios_activos || p.principios_activos.length === 0) return false;
        // Solo si NO tiene anotaciones_componentes (o están vacías)
        if (p.anotaciones_componentes && Object.keys(p.anotaciones_componentes).length > 0) return false;
        return true;
      }).slice(0, 5); // Por ejemplo, 5 por ciclo de scouting

      let ingredientClaimedCount = 0;
      for (const p of needsIngredientAnalysis) {
        // Aprovecha los mismos locks para evitar colisiones
        const canWork = await cloudSyncService.claimProductLock(`${p.sku}_ingredients`, deviceId);
        if (canWork) {
          ingredientClaimedCount++;
          await taskQueueService.addTask('ingredient_analysis', { sku: p.sku, type: 'ingredient_analysis' });
        }
      }

      if (ingredientClaimedCount > 0) {
        logger.info(`Reservados ${ingredientClaimedCount} productos para análisis de componentes.`, 'AI_Clúster');
      }

    } catch (error) {
      logger.error('[Orchestrator Scout] Error en exploración de clúster:', error);
    } finally {
      this.isRunning = false;
      this.updateStatus({ isRunning: false, currentTask: '' });
    }
  }

  trackActivity(points: number) {
    const now = Date.now();
    const restTime = now - this.lastTaskTimestamp;
    const tier = this.hardware?.deviceTier || 'STANDARD';
    
    const coolingFactors = { ULTRA: 1, STANDARD: 0.5, ECO: 0.2 };
    const cooling = Math.floor((restTime / 1000) * coolingFactors[tier as keyof typeof coolingFactors]);
    this.thermalStress = Math.max(0, this.thermalStress - cooling);
    
    const stressMultiplier = tier === 'ECO' ? 2 : (tier === 'ULTRA' ? 0.8 : 1);
    this.thermalStress += (points * stressMultiplier);
    this.lastTaskTimestamp = now;
    this.notify();
    
    const thresholds = { ULTRA: 200, STANDARD: 120, ECO: 50 };
    if (this.thermalStress > thresholds[tier as keyof typeof thresholds]) {
      logger.warn(`[ThermalGuard] Estrés elevado (${Math.round(this.thermalStress)}) en perfil ${tier}. Ralentizando hardware...`);
    }
    
    return this.thermalStress;
  }

  getThermalDelay(): number {
    const tier = this.hardware?.deviceTier || 'STANDARD';
    const stress = this.thermalStress;

    if (tier === 'ECO') {
      if (stress > 100) return 90000; 
      if (stress > 50)  return 40000; 
      if (stress > 25)  return 20000; 
      return 10000; 
    }

    if (tier === 'STANDARD') {
      if (stress > 150) return 60000; 
      if (stress > 100) return 25000; 
      if (stress > 50)  return 12000; 
      return 6000;  
    }

    if (stress > 300) return 60000; 
    if (stress > 180) return 25000; 
    if (stress > 80) return 12000;  
    return 7000; 
  }
}

export const aiOrchestratorService = AIOrchestratorService.getInstance();
