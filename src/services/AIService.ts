import { HardwareProfile } from '../core/types/hardware.types';
import { Product, SafetyStatus } from '../core/types/product.types';
import { formatArrayToString } from '../utils/formatters';
import { synergyBackgroundService } from './SynergyBackgroundService';
import { aiOrchestratorService } from './AIOrchestratorService';
import { logger } from './LoggerService';
import { taskQueueService } from './TaskQueueService';
import { medicalRAGService } from './MedicalRAGService';
import { thermalGuardService } from './ThermalGuardService';
import { embeddingCacheService } from './EmbeddingCacheService';
import { configService } from './ConfigService';

class CloudCircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private maxFailures = 3;
  private resetTimeout = 60000 * 5; // 5 min timeout on cloud fail

  canAttempt(): boolean {
    if (this.failures >= this.maxFailures) {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.failures = 0; // Half-open
        return true;
      }
      return false; // Open
    }
    return true; // Closed
  }

  recordFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
  }

  recordSuccess() {
    this.failures = 0;
  }
}

export class AIService {
  private static instance: AIService;
  private worker: Worker | null = null;
  private isInitializing = false;
  private isReady = false;
  private initProgressCallback: ((text: string, progress: number) => void) | null = null;
  private engineName = 'Ninguno';
  private hardware: HardwareProfile | null = null;
  private lastProgress = { text: '', progress: 0 };
  private watchdogInterval: number | null = null;
  private lastFailedInit = 0;
  private initRetryCount = 0;
  private isBusy = false;
  private cloudCircuitBreaker = new CloudCircuitBreaker();

  private constructor() {}

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  setProgressCallback(cb: (text: string, progress: number) => void) {
    this.initProgressCallback = cb;
  }

  // Configurar hardware pero NO iniciar el motor
  configure(hardware: HardwareProfile) {
    this.hardware = hardware;
    aiOrchestratorService.configure(hardware);
  }

  // Iniciar el motor explícitamente (Lazy Load)
  async startEngine(): Promise<boolean> {
    const config = configService.getConfig();
    if (config.aiExecutionMode === 'cloud-only') {
      this.isReady = true;
      this.engineName = 'Gemini Cloud';
      this.lastProgress = { text: 'Gemini Cloud Activo (Modo Ecológico)', progress: 100 };
      this.initProgressCallback?.(this.lastProgress.text, this.lastProgress.progress);
      return true;
    }

    if (this.isReady) {
      synergyBackgroundService.start();
      return true;
    }
    if (this.isInitializing) return false; 

    const now = Date.now();
    const cooldownPeriod = Math.min(this.initRetryCount * 30000, 300000); // Max 5 min
    if (now - this.lastFailedInit < cooldownPeriod) {
      const waitSecs = Math.ceil((cooldownPeriod - (now - this.lastFailedInit)) / 1000);
      logger.warn(`[AIService] Enfriamiento de inicialización: Reintentando en ${waitSecs}s...`);
      return false;
    }

    if (!this.hardware) throw new Error('Hardware no configurado. Llame a AIService.configure() primero.');

    this.isInitializing = true;
    this.lastProgress = { text: 'Iniciando Worker de IA...', progress: 0 };
    this.initProgressCallback?.(this.lastProgress.text, this.lastProgress.progress);

    return new Promise((resolve) => {
      try {
        this.worker = new Worker(new URL('../workers/ai.worker.ts', import.meta.url), { type: 'module' });

        this.worker.onmessage = (e) => {
          const { type, text, progress, success, engine, error } = e.data;

          switch (type) {
            case 'PROGRESS':
              this.lastProgress = { text, progress };
              this.initProgressCallback?.(text, progress);
              break;
            case 'INIT_COMPLETE':
              this.isInitializing = false;
              if (success) {
                this.isReady = true;
                this.initRetryCount = 0; // Resetear contador al éxito
                this.engineName = engine;
                this.lastProgress = { text: `${engine} Listo`, progress: 100 };
                this.initProgressCallback?.(this.lastProgress.text, this.lastProgress.progress);
                
                synergyBackgroundService.init();
                aiOrchestratorService.startWatcher();
                this.startWatchdog();
                
                this.runHealthCheck().then(hc => {
                    if (hc.ok) {
                    } else {
                        logger.warn(`[AIService] Motor iniciado pero con advertencias: ${hc.error}`);
                    }
                });
                
                resolve(true);
              } else {
                logger.error('Fallo inicialización IA:', error);
                this.lastProgress = { text: `Error: ${error}`, progress: 0 };
                this.initProgressCallback?.(this.lastProgress.text, this.lastProgress.progress);
                this.lastFailedInit = Date.now();
                this.initRetryCount++;
                this.worker?.terminate();
                this.worker = null;
                resolve(false);
              }
              break;
            case 'ERROR':
              logger.error('Error en Worker IA:', error);
              if (error && (error.includes('disposed') || error.includes('context lost') || error.includes('external Instance reference'))) {
                logger.warn('[AIService] Motor IA reportó estado irrecuperable. Reiniciando...');
                this.restartEngine();
              }
              break;
          }
        };

        this.worker.postMessage({ type: 'INIT', payload: { hardwareTier: this.hardware.aiModelTier } });
      } catch (e) {
        logger.error('Error creando Worker:', e);
        this.isInitializing = false;
        resolve(false);
      }
    });
  }

  // Método para detener el motor y liberar memoria
  stopEngine() {
    this.stopWatchdog();
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.isReady = false;
    this.isInitializing = false;
    this.engineName = 'Ninguno';
    this.lastProgress = { text: '', progress: 0 };
  }

  private async runInWorker<T = unknown>(type: string, payload: Record<string, unknown>, timeoutMs: number = 180000): Promise<T> {
    if (!this.worker || !this.isReady) {
      throw new Error('Motor IA no está listo');
    }

    if (thermalGuardService.shouldPauseHeavyTask()) {
      logger.info(`Carga térmica alta. Esperando antes de ejecutar tarea: ${type}`, 'AIService');
      await new Promise(r => setTimeout(r, 2000));
    }

    this.isBusy = true;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.worker?.removeEventListener('message', handler);
        this.isBusy = false;
        reject(new Error(`Timeout de IA (${timeoutMs}ms) en operación: ${type}`));
      }, timeoutMs);

      const handler = (e: MessageEvent) => {
        const { type: resType, payload: resPayload, error } = e.data;
        if (resType === `${type}_RESULT` || resType === 'ERROR') {
          clearTimeout(timeout);
          this.worker?.removeEventListener('message', handler);
          this.isBusy = false;
          if (error) reject(new Error(error));
          else resolve(resPayload);
        }
      };

      this.worker.addEventListener('message', handler);
      this.worker.postMessage({ type, payload });
    });
  }

  async analyzeSynergy(product: Product, candidates: Product[]): Promise<string | null> {
    try {
      return await this.runInWorker('ANALYZE_CLINICAL', { product, candidates, type: 'synergy' });
    } catch (error) {
      logger.error('[AIService] Error en analyzeSynergy:', error);
      return null;
    }
  }

  async explainIngredients(productName: string, ingredients: string[]): Promise<Record<string, string>> {
    logger.ai(`Iniciando análisis de principios activos para: ${productName} (${ingredients.length} comp.)`, 'AI_Componentes');

    // Intentar local
    if (this.worker && this.isReady) {
      logger.ai(`Ejecutando análisis con motor local (WebLLM) para ${productName}`, 'AI_Componentes');
      try {
        const result = await this.runInWorker<Record<string, string>>('EXPLAIN_INGREDIENTS', { productName, ingredients }, 60000);
        if (result && Object.keys(result).length > 0) {
          logger.success(`Análisis de componentes completado localmente para ${productName}`, 'AI_Componentes');
        }
        return result;
      } catch (e) {
        logger.warn(`[AIService] Error en motor local al analizar componentes, probando fallback nube...`, e);
      }
    } else {
      logger.warn('[AIService] Motor local no disponible, intentando analizar componentes en la nube...');
    }

    // Circuit Breaker
    if (!this.cloudCircuitBreaker.canAttempt()) {
      logger.warn('[AIService] Circuito en la nube abierto. Encolando análisis de componentes para:', productName);
      taskQueueService.addTask('ingredient_analysis', { product: { nombre_comercial: productName, principios_activos: ingredients } });
      return {};
    }

    // Fallback Nube
    try {
      const { geminiService } = await import('./GeminiService');
      const result = await geminiService.explainActiveIngredients(productName, ingredients);
      this.cloudCircuitBreaker.recordSuccess();
      logger.success(`Análisis en la nube exitoso para ${productName}`, 'AI_Componentes');
      return result;
    } catch (error: any) {
      this.cloudCircuitBreaker.recordFailure();
      const isQuotaError = error?.status === 'RESOURCE_EXHAUSTED' || error?.message?.includes('429') || error?.message?.includes('quota');
      const isNetworkError = error?.status === 'UNKNOWN' || error?.message?.includes('xhr error') || error?.message?.includes('fetch');
      
      if (isQuotaError || isNetworkError) {
        logger.warn(`[AIService] Cuota o red fallida en la nube. Circuito activado, encolando componentes para:`, productName);
        taskQueueService.addTask('ingredient_analysis', { product: { nombre_comercial: productName, principios_activos: ingredients } });
      } else {
        logger.error(`Error en análisis de componentes nube para ${productName}`, 'AI_Componentes', error);
      }
      return {};
    }
  }

  private startWatchdog() {
    if (this.watchdogInterval) return;
    this.watchdogInterval = window.setInterval(async () => {
      if (this.isReady && this.worker && !this.isBusy) {
        try {
          const health = await this.runHealthCheckTimeout(120000); 
          if (!health.ok) {
            logger.warn('[AIService] Watchdog: El motor no responde tras 2 min. Reiniciando...');
            this.restartEngine();
          }
        } catch (e) {
          logger.warn('[AIService] Watchdog: Error o Timeout. RE-INICIANDO motor...', e);
          this.restartEngine();
        }
      } else if (this.isBusy) {
      }
    }, 5 * 60 * 1000);
  }

  private stopWatchdog() {
    if (this.watchdogInterval) {
      clearInterval(this.watchdogInterval);
      this.watchdogInterval = null;
    }
  }

  private async restartEngine() {
    this.stopEngine();
    await new Promise(resolve => setTimeout(resolve, 2000)); 
    this.startEngine();
  }

  private async runHealthCheckTimeout(timeoutMs: number): Promise<{ ok: boolean }> {
    return Promise.race([
      this.runHealthCheck(),
      new Promise<{ ok: boolean }>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), timeoutMs)
      )
    ]);
  }

  async extractProductData(rawText: string, url: string): Promise<Product | null> {
    const doLite = () => this.extractDataLite(rawText, url);

    if (this.worker && this.isReady) {
      try {
        const payload = await this.runInWorker<Record<string, any>>('EXTRACT', { text: rawText, url }, 120000);
        let content = payload.content;
        let data: any = null;

        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const cleanContent = jsonMatch[0].replace(/```json/g, '').replace(/```/g, '').trim();
                data = JSON.parse(cleanContent);
            }
        } catch (jsonError) {
            logger.warn('[AIService] JSON del modelo inválido en local. Iniciando fallback...');
        }

        if (data && data.nombre_comercial) {
            data.vectores = [];
            data.skus_relacionados = [];
            data.source_url = url;
            return data as Product;
        }
      } catch (error) {
        logger.error('[AIService] Error extracción IA local:', error);
      }
    } else {
      logger.warn('[AIService] Motor IA no activo. Intentando nube para extracción.');
    }

    if (!this.cloudCircuitBreaker.canAttempt()) {
      logger.warn('[AIService] Circuito en la nube abierto. Usando modo Lite (Regex) directamente.');
      return doLite();
    }

    try {
      const { geminiService } = await import('./GeminiService');
      const data = await geminiService.extractProductFromPDFText(rawText);
      this.cloudCircuitBreaker.recordSuccess();

      if (data && data.nombre_comercial) {
          data.vectores = [];
          data.skus_relacionados = [];
          data.source_url = url;
          return data as Product;
      }
    } catch (error: any) {
      this.cloudCircuitBreaker.recordFailure();
      logger.error('[AIService] Error extracción en nube:', error);
    }
    
    return doLite();
  }

  private extractDataLite(rawText: string, url: string): Product {
    const nombreMatch = rawText.match(/Producto:\s*([^.]+)/i) || rawText.match(/Nombre:\s*([^.]+)/i);
    const indicacionMatch = rawText.match(/Indicación:\s*([^.]+)/i) || rawText.match(/Para:\s*([^.]+)/i);
    
    return {
        sku: "LITE-" + Date.now().toString().slice(-6),
        nombre_comercial: nombreMatch ? nombreMatch[1].trim() : "Producto Desconocido",
        principios_activos: [],
        indicaciones: indicacionMatch ? [indicacionMatch[1].trim()] : [],
        advertencias: "Datos extraídos en modo Lite (sin IA)",
        posologia: "Consultar prospecto",
        descripcion: "Extracción automática básica",
        tags_ia: ["modo_lite"],
        apto_embarazo: SafetyStatus.PRECAUCION,
        apto_lactancia: SafetyStatus.PRECAUCION,
        apto_pediatria: SafetyStatus.PRECAUCION,
        apto_diabeticos: SafetyStatus.PRECAUCION,
        apto_hipertensos: SafetyStatus.PRECAUCION,
        apto_celiacos: SafetyStatus.PRECAUCION,
        sugerencia_complementaria: "Verificar datos manualmente",
        vectores: [],
        skus_relacionados: [],
        synergy_analyzed: false,
        source_url: url
    };
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!text) return new Array(384).fill(0);

    // 1. Check persistent caching first (O(1) memory or extremely fast Disk db lookup)
    try {
      const cached = await embeddingCacheService.get(text);
      if (cached) {
        return cached;
      }
    } catch (err) {
      logger.warn('[AIService] Failed reading from embedding cache:', err);
    }

    // 2. Fall back to local Worker calculation if ready
    if (!this.worker || !this.isReady) {
      return new Array(384).fill(0);
    }

    try {
      const vector = await this.runInWorker('EMBED', { text }, 60000) as number[];
      
      // 3. Cache the calculated vector for future lookups
      if (vector && vector.length > 0) {
        await embeddingCacheService.set(text, vector);
      }
      return vector;
    } catch (error) {
      logger.error('[AIService] Error embedding:', error);
      return new Array(384).fill(0);
    }
  }

  async analyze(query: string, products: Product[]): Promise<string> {
    const doLite = () => {
      const productNames = products.map(p => p.nombre_comercial).join(' y ');
      return `### ⚡ Modo Lite\nEl motor de IA no pudo conectarse ni en local ni en la nube. Mostrando información básica.\n\n**Productos:** ${productNames}\n\nActiva el motor de IA local o asegúrate de que la conexión funcione.`;
    };

    const context = products.map(p => 
      `MEDICAMENTO: ${p.nombre_comercial}\n` +
      `- Principios Activos: ${formatArrayToString(p.principios_activos, ', ')}\n` +
      `- Indicaciones: ${formatArrayToString(p.indicaciones, ', ')}\n` +
      `- Advertencias: ${p.advertencias}\n`
    ).join('\n\n');

    if (this.worker && this.isReady) {
      try {
        return await this.runInWorker('ANALYZE', { query, context });
      } catch (error) {
        logger.error('[AIService] Error en analyze local:', error);
      }
    } else {
      logger.warn('[AIService] Motor IA no activo, recurriendo a nube para analyze...');
    }

    if (!this.cloudCircuitBreaker.canAttempt()) {
      logger.warn('[AIService] Circuito en la nube abierto. Usando modo Lite para analyze.');
      return doLite();
    }

    try {
      const { geminiService } = await import('./GeminiService');
      const response = await geminiService.generateGeneralAnalysis(query, context);
      this.cloudCircuitBreaker.recordSuccess();
      return response;
    } catch (error: any) {
      this.cloudCircuitBreaker.recordFailure();
      logger.error('[AIService] Error en analyze nube:', error);
      return doLite();
    }
  }

  async standardizeTags(tags: string[]): Promise<Record<string, string>> {
    if (!this.worker || !this.isReady) return {};
    try {
      return await this.runInWorker('STANDARDIZE_TAGS', { tags }, 30000); 
    } catch (error) {
      logger.error('[AIService] Error en standardizeTags:', error);
      return {};
    }
  }

  async analyzeClinical(product: Product, candidates: Product[], type: 'synergy' | 'alternatives'): Promise<string> {
    // Intento con motor local primero
    if (this.worker && this.isReady) {
      try {
        logger.ai(`Análisis clínico (${type}) mediante motor local para: ${product.nombre_comercial}`, 'AI_Clinical');
        return await this.runInWorker('ANALYZE_CLINICAL', { product, candidates, type }, 90000);
      } catch (error) {
        logger.warn(`[AIService] Error en motor local, recurriendo a fallback en la nube...`, error);
      }
    } else {
      logger.warn('[AIService] Motor IA no activo, intentando fallback en la nube...');
    }

    // Circuit Breaker para evitar saturar la nube en caso de caídas
    if (!this.cloudCircuitBreaker.canAttempt()) {
      logger.warn('[AIService] Circuito en la nube abierto (protección). Encolando:', product.sku);
      taskQueueService.addTask('ai_analysis', { product, candidates, type });
      return null;
    }

    // Fallback a Gemini
    try {
      const { geminiService } = await import('./GeminiService');
      let result = null;
      if (type === 'synergy') {
        const clinicalInsights = await medicalRAGService.retrieveClinicalContext(product.principios_activos || []);
        const formattedInsights = medicalRAGService.formatInsightsForPrompt(clinicalInsights);
        result = await geminiService.analyzeSynergy(product, candidates, formattedInsights);
      }
      this.cloudCircuitBreaker.recordSuccess();
      return result;
    } catch (error: any) {
      this.cloudCircuitBreaker.recordFailure();
      
      const isQuotaError = error?.status === 'RESOURCE_EXHAUSTED' || error?.message?.includes('429') || error?.message?.includes('quota');
      const isNetworkError = error?.status === 'UNKNOWN' || error?.message?.includes('xhr error') || error?.message?.includes('fetch');
      
      if (isQuotaError || isNetworkError) {
        logger.warn(`[AIService] ${isQuotaError ? 'Cuota excedida' : 'Error de red'} en la nube. Circuito activado, encolando análisis:`, product.sku);
        taskQueueService.addTask('ai_analysis', { product, candidates, type });
      } else {
        logger.error('[AIService] Error en análisis clínico en la nube:', error);
      }
      return null;
    }
  }

  async interpretClinicalSearch(query: string): Promise<any> {
    if (!this.worker || !this.isReady) return { isScenario: false };
    try {
      return await this.runInWorker('INTERPRET_SEARCH', { query }, 30000);
    } catch (error) {
      logger.error('[AIService] Error interpretando búsqueda:', error);
      return { isScenario: false };
    }
  }


  async runHealthCheck(): Promise<{ ok: boolean; engine: string; response?: string; error?: string }> {
    if (!this.worker || !this.isReady) {
        return { ok: false, engine: 'Ninguno', error: 'Worker no iniciado' };
    }

    return new Promise((resolve) => {
        const handler = (e: MessageEvent) => {
            const { type, ok, engine, response, error } = e.data;
            if (type === 'HEALTH_CHECK_RESULT') {
                this.worker?.removeEventListener('message', handler);
                resolve({ ok, engine, response, error });
            }
        };
        this.worker?.addEventListener('message', handler);
        this.worker?.postMessage({ type: 'HEALTH_CHECK' });
    });
  }

  async purgeCache(): Promise<boolean> {
    try {
      await embeddingCacheService.clear();
    } catch (e) {
      logger.warn('[AIService] Failed clearing embeddingCacheService during purge:', e);
    }

    if (!this.worker) return false;
    
    return new Promise((resolve) => {
      const handler = (e: MessageEvent) => {
        if (e.data.type === 'PURGE_COMPLETE') {
          this.worker?.removeEventListener('message', handler);
          resolve(e.data.success);
        }
      };
      this.worker?.addEventListener('message', handler);
      this.worker?.postMessage({ type: 'PURGE_CACHE' });
    });
  }

  getStatus() {
    return {
      isReady: this.isReady,
      isInitializing: this.isInitializing,
      engine: this.engineName,
      lastProgress: this.lastProgress
    };
  }
}

export const aiService = AIService.getInstance();
