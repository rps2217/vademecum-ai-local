import { HardwareProfile } from '../core/types/hardware.types';
import { Product, SafetyStatus } from '../core/types/product.types';
import { formatArrayToString } from '../utils/formatters';
import { synergyBackgroundService } from './SynergyBackgroundService';
import { taskQueueService } from './TaskQueueService';
import { aiOrchestratorService } from './AIOrchestratorService';

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
    if (this.isReady) {
      synergyBackgroundService.start();
      return true;
    }
    if (this.isInitializing) return false; 

    const now = Date.now();
    const cooldownPeriod = Math.min(this.initRetryCount * 30000, 300000); // Max 5 min
    if (now - this.lastFailedInit < cooldownPeriod) {
      const waitSecs = Math.ceil((cooldownPeriod - (now - this.lastFailedInit)) / 1000);
      console.warn(`[AIService] Enfriamiento de inicialización: Reintentando en ${waitSecs}s...`);
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
                        console.log(`[AIService] Motor verificado y funcional: ${hc.engine}`);
                    } else {
                        console.warn(`[AIService] Motor iniciado pero con advertencias: ${hc.error}`);
                    }
                });
                
                resolve(true);
              } else {
                console.error('Fallo inicialización IA:', error);
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
              console.error('Error en Worker IA:', error);
              if (error && (error.includes('disposed') || error.includes('context lost') || error.includes('external Instance reference'))) {
                console.warn('[AIService] Motor IA reportó estado irrecuperable. Reiniciando...');
                this.restartEngine();
              }
              break;
          }
        };

        this.worker.postMessage({ type: 'INIT', payload: { hardwareTier: this.hardware.aiModelTier } });
      } catch (e) {
        console.error('Error creando Worker:', e);
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

  private async runInWorker(type: string, payload: any, timeoutMs: number = 180000): Promise<any> {
    if (!this.worker || !this.isReady) {
      throw new Error('Motor IA no está listo');
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

  async analyzeSynergy(product: any, candidates: any[]): Promise<any> {
    try {
      return await this.runInWorker('ANALYZE_CLINICAL', { product, candidates, type: 'synergy' });
    } catch (error) {
      console.error('[AIService] Error en analyzeSynergy:', error);
      return null;
    }
  }

  async explainIngredients(productName: string, ingredients: string[]): Promise<Record<string, string>> {
    const tryGemini = async () => {
      try {
        const { geminiService } = await import('./GeminiService');
        return await geminiService.explainActiveIngredients(productName, ingredients);
      } catch (error: any) {
        // Detectar errores de API Key o red para forzar local
        const isAuthError = error?.message?.includes('400') || error?.message?.includes('API key') || error?.message?.includes('401');
        if (isAuthError) {
          console.warn('[AIService] Gemini API Key inválida o expirada. Usando motor local...');
          throw error; // Propagar para caer en el catch del motor local
        }
        throw error;
      }
    };

    const tryLocal = async () => {
      if (!this.worker || !this.isReady) {
        throw new Error('Motor local no disponible para fallback');
      }
      console.log('[AIService] Generando explicación de componentes localmente...');
      try {
        return await this.runInWorker('EXPLAIN_INGREDIENTS', { productName, ingredients }, 60000);
      } catch (e) {
        console.error('[AIService] Error en motor local al explicar componentes:', e);
        return {};
      }
    };

    try {
      return await tryGemini();
    } catch (geminiError) {
      try {
        return await tryLocal();
      } catch (localError) {
        console.error('[AIService] Ambos motores (Gemini y Local) fallaron:', { geminiError, localError });
        return {};
      }
    }
  }

  private startWatchdog() {
    if (this.watchdogInterval) return;
    this.watchdogInterval = window.setInterval(async () => {
      if (this.isReady && this.worker && !this.isBusy) {
        try {
          const health = await this.runHealthCheckTimeout(120000); 
          if (!health.ok) {
            console.warn('[AIService] Watchdog: El motor no responde tras 2 min. Reiniciando...');
            this.restartEngine();
          }
        } catch (e) {
          console.warn('[AIService] Watchdog: Error o Timeout. RE-INICIANDO motor...', e);
          this.restartEngine();
        }
      } else if (this.isBusy) {
        console.log('[AIService] Watchdog: Motor ocupado, posponiendo revisión de salud.');
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
    if (!this.worker || !this.isReady) {
        console.warn('[AIService] Motor IA apagado. Usando modo Lite (Regex).');
        return this.extractDataLite(rawText, url);
    }

    return new Promise((resolve) => {
      const handler = (e: MessageEvent) => {
        const { type, payload, error } = e.data;
        if (type === 'EXTRACT_RESULT' || type === 'ERROR') {
          this.worker?.removeEventListener('message', handler);
          
          if (error) {
            console.error('[AIService] Error extracción IA:', error);
            resolve(this.extractDataLite(rawText, url));
            return;
          }

          try {
            let content = payload.content;
            let data: any = null;
      
            try {
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const cleanContent = jsonMatch[0].replace(/```json/g, '').replace(/```/g, '').trim();
                    data = JSON.parse(cleanContent);
                }
            } catch (jsonError) {
                console.warn('[AIService] JSON del modelo inválido. Iniciando fallback heurístico.');
            }

            if (!data || !data.nombre_comercial) {
                resolve(this.extractDataLite(rawText, url));
                return;
            }

            data.vectores = [];
            data.skus_relacionados = [];
            data.source_url = url;
            
            resolve(data as Product);

          } catch (err) {
            console.error(err);
            resolve(this.extractDataLite(rawText, url));
          }
        }
      };
      this.worker?.addEventListener('message', handler);
      this.worker?.postMessage({ type: 'EXTRACT', payload: { text: rawText, url } });
    });
  }

  private extractDataLite(rawText: string, url: string): Product {
    console.log('[AIService] Ejecutando extracción Lite (Regex)...');
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
    if (!this.worker || !this.isReady) {
      return new Array(384).fill(0);
    }

    return new Promise((resolve) => {
      const handler = (e: MessageEvent) => {
        const { type, payload, error } = e.data;
        if (type === 'EMBED_RESULT' || type === 'ERROR') {
          this.worker?.removeEventListener('message', handler);
          if (error) {
            console.error('[AIService] Error embedding:', error);
            resolve(new Array(384).fill(0));
          } else {
            resolve(payload);
          }
        }
      };
      this.worker?.addEventListener('message', handler);
      this.worker?.postMessage({ type: 'EMBED', payload: { text } });
    });
  }

  async analyze(query: string, products: Product[]): Promise<string> {
    if (!this.worker || !this.isReady) {
      const productNames = products.map(p => p.nombre_comercial).join(' y ');
      return `### ⚡ Modo Lite (Sin IA)\nEl motor de IA no está activo. Mostrando información básica.\n\n**Productos:** ${productNames}\n\nPor favor, active el motor de IA en Configuración para un análisis clínico profundo.`;
    }

    const context = products.map(p => 
      `MEDICAMENTO: ${p.nombre_comercial}\n` +
      `- Principios Activos: ${formatArrayToString(p.principios_activos, ', ')}\n` +
      `- Indicaciones: ${formatArrayToString(p.indicaciones, ', ')}\n` +
      `- Advertencias: ${p.advertencias}\n`
    ).join('\n\n');

    try {
      return await this.runInWorker('ANALYZE', { query, context });
    } catch (error) {
      console.error('[AIService] Error en analyze:', error);
      return 'No se pudo generar el análisis clínico por un error en el motor local.';
    }
  }

  async standardizeTags(tags: string[]): Promise<Record<string, string>> {
    if (!this.worker || !this.isReady) return {};
    try {
      return await this.runInWorker('STANDARDIZE_TAGS', { tags }, 30000); 
    } catch (error) {
      console.error('[AIService] Error en standardizeTags:', error);
      return {};
    }
  }

  async analyzeClinical(product: any, candidates: any[], type: 'synergy' | 'alternatives'): Promise<any> {
    if (this.worker && this.isReady) {
      try {
        return await this.runInWorker('ANALYZE_CLINICAL', { product, candidates, type });
      } catch (error) {
        console.error('[AIService] Error en motor local, probando nube...', error);
      }
    }

    try {
      const { geminiService } = await import('./GeminiService');
      if (type === 'synergy') {
        return await geminiService.analyzeSynergy(product, candidates);
      }
      return null;
    } catch (error: any) {
      const isQuotaError = error?.status === 'RESOURCE_EXHAUSTED' || error?.message?.includes('429') || error?.message?.includes('quota');
      const isNetworkError = error?.status === 'UNKNOWN' || error?.message?.includes('xhr error') || error?.message?.includes('fetch');
      
      if (isQuotaError || isNetworkError) {
        console.warn(`[AIService] ${isQuotaError ? 'Cuota excedida' : 'Error de red'} en la nube, encolando análisis:`, product.sku);
        taskQueueService.addTask('ai_analysis', { product, candidates, type });
      } else {
        console.error('[AIService] Error en análisis clínico en la nube:', error);
      }
      return null;
    }
  }

  async interpretClinicalSearch(query: string): Promise<any> {
    if (!this.worker || !this.isReady) return { isScenario: false };
    try {
      return await this.runInWorker('INTERPRET_SEARCH', { query }, 30000);
    } catch (error) {
      console.error('[AIService] Error interpretando búsqueda:', error);
      return { isScenario: false };
    }
  }

  cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
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
