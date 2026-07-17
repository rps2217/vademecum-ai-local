/**
 * AI Load Strategy - Carga progresiva del motor de IA
 * 
 * Estrategia: No cargar modelos pesados al inicio. Cargar bajo demanda.
 * 
 * Niveles de carga:
 * - LEVEL_0_CLOUD: Solo Gemini Cloud (instantáneo)
 * - LEVEL_1_EMBEDDINGS: Embeddings locales cargados (5-10s)
 * - LEVEL_2_FULL: Modelo completo de IA local (30-60s)
 */

import { HardwareProfile } from '../core/types/hardware.types';
import { logger } from './LoggerService';

export type AILoadLevel = 'LEVEL_0_CLOUD' | 'LEVEL_1_EMBEDDINGS' | 'LEVEL_2_FULL';

export interface AILoadStrategyConfig {
  // Cuándo cargar embeddings locales
  loadEmbeddingsOnSearch: boolean;
  // Cuándo cargar modelo completo
  loadFullModelOnAssistant: boolean;
  // Delay antes de cargar en background (ms)
  backgroundLoadDelay: number;
  // Máx tiempo de carga permitido (ms)
  maxLoadTime: number;
}

const DEFAULT_STRATEGY: AILoadStrategyConfig = {
  loadEmbeddingsOnSearch: true,      // Cargar cuando usuario busca
  loadFullModelOnAssistant: true,     // Cargar cuando abre asistente
  backgroundLoadDelay: 2000,          // 2 segundos de delay
  maxLoadTime: 60000,                // 60 segundos máximo
};

export class AILoadStrategy {
  private static instance: AILoadStrategy;
  private currentLevel: AILoadLevel = 'LEVEL_0_CLOUD';
  private isLoading = false;
  private config: AILoadStrategyConfig;
  private loadCallbacks: ((level: AILoadLevel) => void)[] = [];

  private constructor() {
    this.config = this.loadConfig();
  }

  static getInstance(): AILoadStrategy {
    if (!AILoadStrategy.instance) {
      AILoadStrategy.instance = new AILoadStrategy();
    }
    return AILoadStrategy.instance;
  }

  private loadConfig(): AILoadStrategyConfig {
    const saved = localStorage.getItem('ai_load_strategy');
    if (!saved) return DEFAULT_STRATEGY;
    try {
      return { ...DEFAULT_STRATEGY, ...JSON.parse(saved) };
    } catch {
      return DEFAULT_STRATEGY;
    }
  }

  updateConfig(updates: Partial<AILoadStrategyConfig>) {
    this.config = { ...this.config, ...updates };
    localStorage.setItem('ai_load_strategy', JSON.stringify(this.config));
  }

  getConfig(): AILoadStrategyConfig {
    return { ...this.config };
  }

  getCurrentLevel(): AILoadLevel {
    return this.currentLevel;
  }

  isEngineReady(): boolean {
    return this.currentLevel !== 'LEVEL_0_CLOUD';
  }

  isFullyLoaded(): boolean {
    return this.currentLevel === 'LEVEL_2_FULL';
  }

  isLoadingEngine(): boolean {
    return this.isLoading;
  }

  /**
   * Determina el nivel de carga basado en el hardware
   */
  determineOptimalLevel(hardware: HardwareProfile): AILoadLevel {
    const { aiModelTier, memoryGB, hasGPU } = hardware;

    // Nunca cargar modelos locales en equipos limitados
    if (aiModelTier === 'NONE') {
      logger.info('Hardware no soporta IA local, usando modo nube', 'AILoadStrategy');
      return 'LEVEL_0_CLOUD';
    }

    // Equipos ECO: solo embeddings
    if (hardware.deviceTier === 'ECO' || memoryGB < 4) {
      logger.info('Dispositivo limitado, cargando solo embeddings', 'AILoadStrategy');
      return 'LEVEL_1_EMBEDDINGS';
    }

    // Equipos estándar con GPU o buena RAM: modelo completo
    if (aiModelTier === 'HIGH' || (hasGPU && memoryGB >= 8)) {
      logger.info('Hardware potente, cargando modelo completo', 'AILoadStrategy');
      return 'LEVEL_2_FULL';
    }

    // Equipos estándar sin GPU: solo embeddings
    return 'LEVEL_1_EMBEDDINGS';
  }

  /**
   * Solicitar carga de nivel específico
   */
  async requestLevel(targetLevel: AILoadLevel, priority: 'immediate' | 'background' = 'background'): Promise<void> {
    // Si ya estamos en el nivel solicitado o más alto, no hacer nada
    if (this.compareLevels(this.currentLevel, targetLevel) >= 0) {
      return;
    }

    // Si ya está cargando, no hacer nada
    if (this.isLoading) {
      logger.info('Carga de IA ya en progreso', 'AILoadStrategy');
      return;
    }

    if (priority === 'background') {
      // Cargar en background con delay
      setTimeout(() => this.loadLevel(targetLevel), this.config.backgroundLoadDelay);
    } else {
      // Cargar inmediatamente
      await this.loadLevel(targetLevel);
    }
  }

  /**
   * Solicitar carga para búsqueda semántica
   */
  async requestForSearch(): Promise<void> {
    logger.info('Solicitando IA para búsqueda...', 'AILoadStrategy');
    await this.requestLevel('LEVEL_1_EMBEDDINGS', 'background');
  }

  /**
   * Solicitar carga para asistente clínico
   */
  async requestForAssistant(): Promise<void> {
    logger.info('Solicitando IA para asistente...', 'AILoadStrategy');
    await this.requestLevel('LEVEL_2_FULL', 'immediate');
  }

  /**
   * Solicitar carga para análisis de sinergia
   */
  async requestForSynergy(): Promise<void> {
    logger.info('Solicitando IA para sinergia...', 'AILoadStrategy');
    await this.requestLevel('LEVEL_2_FULL', 'immediate');
  }

  private async loadLevel(level: AILoadLevel): Promise<void> {
    if (this.isLoading) return;
    
    this.isLoading = true;
    logger.info(`Iniciando carga de IA: ${level}`, 'AILoadStrategy');

    try {
      // Simular fases de carga para feedback
      if (level === 'LEVEL_1_EMBEDDINGS' || level === 'LEVEL_2_FULL') {
        this.notifyCallbacks('LEVEL_1_EMBEDDINGS');
        await this.simulateLoadPhase('Cargando modelo de embeddings...', 1000);
      }

      if (level === 'LEVEL_2_FULL') {
        this.currentLevel = 'LEVEL_1_EMBEDDINGS';
        this.notifyCallbacks('LEVEL_1_EMBEDDINGS');
        
        this.notifyCallbacks('LEVEL_2_FULL');
        await this.simulateLoadPhase('Cargando modelo de análisis...', 2000);
      }

      this.currentLevel = level;
      this.notifyCallbacks(level);
      logger.success(`IA cargada exitosamente: ${level}`, 'AILoadStrategy');
    } catch (error) {
      logger.error('Error cargando IA', 'AILoadStrategy', error);
      // En caso de error, mantener modo nube
      this.currentLevel = 'LEVEL_0_CLOUD';
    } finally {
      this.isLoading = false;
    }
  }

  private async simulateLoadPhase(message: string, duration: number): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < duration) {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      logger.info(`${message} ${Math.round(progress * 100)}%`, 'AILoadStrategy');
      await new Promise(r => setTimeout(r, 500));
    }
  }

  private compareLevels(a: AILoadLevel, b: AILoadLevel): number {
    const levels = ['LEVEL_0_CLOUD', 'LEVEL_1_EMBEDDINGS', 'LEVEL_2_FULL'];
    return levels.indexOf(a) - levels.indexOf(b);
  }

  /**
   * Suscribirse a cambios de nivel
   */
  onLevelChange(callback: (level: AILoadLevel) => void): () => void {
    this.loadCallbacks.push(callback);
    return () => {
      this.loadCallbacks = this.loadCallbacks.filter(cb => cb !== callback);
    };
  }

  private notifyCallbacks(level: AILoadLevel): void {
    this.loadCallbacks.forEach(cb => cb(level));
  }

  /**
   * Resetear estado de carga
   */
  reset(): void {
    this.currentLevel = 'LEVEL_0_CLOUD';
    this.isLoading = false;
    logger.info('Estado de IA reseteado', 'AILoadStrategy');
  }
}

export const aiLoadStrategy = AILoadStrategy.getInstance();
