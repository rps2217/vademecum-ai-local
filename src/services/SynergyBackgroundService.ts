import { Product } from '../core/types/product.types';
import { aiService } from './AIService';
import { geminiService } from './GeminiService';
import { ollamaService } from './OllamaService';
import { cloudSyncService } from './CloudSyncService';
import { formatArrayToString } from '../utils/formatters';
import { configService } from './ConfigService';
import { dataService } from './DataService';
import { taskQueueService } from './TaskQueueService';
import { EventBus, EventType } from './EventBus';
import { logger } from './LoggerService';

export class SynergyBackgroundService {
  private static instance: SynergyBackgroundService;
  private isRunning = false;
  private isFatalError = false;
  private currentProcessingSku: string | null = null;
  private currentProcessingName: string | null = null;
  private currentEngine: string | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): SynergyBackgroundService {
    if (!SynergyBackgroundService.instance) {
      SynergyBackgroundService.instance = new SynergyBackgroundService();
    }
    return SynergyBackgroundService.instance;
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      currentProcessingSku: this.currentProcessingSku,
      currentProcessingName: this.currentProcessingName,
      currentEngine: this.currentEngine,
      isFatalError: this.isFatalError
    };
  }

  private notifyListeners() {
    EventBus.emit(EventType.SYNERGY_STATUS_CHANGED, this.getStatus());
  }

  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    window.addEventListener('config_updated', (e: any) => {
      const newConfig = e.detail;
      if (newConfig.enableBackgroundSynergy) {
        this.start();
      } else {
        this.stop();
      }
    });

    this.isRunning = true;
  }

  start() {
    this.isRunning = true;
  }

  stop() {
    this.isRunning = false;
  }

  async forceAnalyze(product: Product) {
    if (!product) return false;
    
    if (this.currentProcessingSku) {
      logger.info(`Ocupado con ${this.currentProcessingSku}, encolando ${product.sku}.`, 'Sinergia');
      await taskQueueService.addTask('ai_analysis', { sku: product.sku, type: 'synergy' });
      return false;
    }

    logger.info(`Análisis forzado para: ${product.nombre_comercial}`, 'Sinergia');
    await this.processProduct({ ...product, synergy_analyzed: false }, true);
    return true;
  }

  async processProduct(product: Product, isForced: boolean = false) {
    const startTimestamp = Date.now();
    
    try {
      const status = aiService.getStatus();
      
      const { getDeviceId } = await import('../utils/clusterUtils');
      const deviceId = getDeviceId();
      const canLock = await cloudSyncService.claimProductLock(product.sku, deviceId);
      if (!isForced && !canLock) {
         console.warn(`[ClusterSync] Sku ${product.sku} saltado. Otro PC (${deviceId}) ya lo está analizando.`);
         return; 
      }
      
      this.currentProcessingSku = product.sku;
      this.currentProcessingName = product.nombre_comercial;
      this.notifyListeners();

      logger.info(`Analizando: ${product.nombre_comercial}`, 'Sinergia', { sku: product.sku, source: isForced ? 'manual' : 'background' });
      
      // 1. Vectorización (si es necesaria)
      let mainVector = product.vectores;
      if (!mainVector || mainVector.length === 0) {
        if (status.isReady) {
          logger.info(`Generando Vector para ${product.sku}...`, 'Sinergia');
          const text = `${product.nombre_comercial} ${formatArrayToString(product.indicaciones, ' ')} ${product.analisis_componentes || ''}`;
          mainVector = await aiService.generateEmbedding(text);
          product.vectores = mainVector;
          await dataService.saveProduct({ ...product, vectores: mainVector }, { silent: true });
        } else {
          logger.warn(`Motor IA local no listo para vectorización. Saltando.`, 'Sinergia');
          await dataService.saveProduct({ ...product, synergy_analyzed: true, last_synergy_analysis: Date.now() }, { silent: true });
          this.clearCurrent();
          return;
        }
      }

      // 2. Análisis de Principios Activos (IA Componentes)
      let anotaciones_componentes = product.anotaciones_componentes || {};
      if (Object.keys(anotaciones_componentes).length === 0 && product.principios_activos && product.principios_activos.length > 0) {
        try {
          const { aiService: localAiService } = await import('./AIService');
          logger.info(`Iniciando análisis de componentes para ${product.sku}...`, 'Sinergia');
          const result = await localAiService.explainIngredients(product.nombre_comercial, product.principios_activos);
          if (result && Object.keys(result).length > 0) {
            anotaciones_componentes = result;
          }
        } catch (error) {
          logger.error(`Error analizando componentes en pipeline para ${product.sku}`, 'Sinergia', error);
        }
      }

      // 3. Búsqueda de Candidatos para Sinergia
      const allProducts = await dataService.getAllProducts();

      const candidates = allProducts
        .filter((p: any) => p.sku !== product.sku && p.vectores && p.vectores.length > 0)
        .map((p: any) => ({
          product: p,
          score: this.cosineSimilarity(mainVector, p.vectores)
        }))
        .filter(item => item.score > 0.65)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(item => item.product);

      if (candidates.length === 0) {
        logger.info(`Sin candidatos para ${product.sku}.`, 'Sinergia');
        const updatedProduct = { 
          ...product, 
          synergy_analyzed: true, 
          last_synergy_analysis: Date.now(),
          sugerencia_complementaria: "No se encontraron complementos directos en la base local.",
          skus_relacionados: []
        };
        await cloudSyncService.releaseProductLockAndSave(updatedProduct);
        this.clearCurrent();
        return;
      }

      logger.info(`Encontrados ${candidates.length} candidatos. Iniciando motor...`, 'Sinergia');

      let synergyResult;
      const isOllamaAvailable = await ollamaService.isAvailable();

      if (isOllamaAvailable) {
        this.setActiveEngine('Ollama (Local Externo)');
        try {
          logger.info(`Consultando Ollama...`, 'Sinergia');
          const analysis = await ollamaService.analyzeSynergy(product, candidates);
          synergyResult = {
            sugerencia_complementaria: analysis.sugerencia_complementaria,
            skus_relacionados: analysis.skus_relacionados,
            explicacion_clinica: analysis.explicacion_clinica
          };
        } catch (e: any) {
          logger.warn(`Ollama falló: ${e.message}. Probando siguiente motor.`, 'Sinergia');
        }
      }

      if (!synergyResult) {
        const config = configService.getConfig();
        if (config.useGeminiForSynergy) {
          this.setActiveEngine('Gemini (Nube)');
          try {
            logger.info(`Consultando Gemini...`, 'Sinergia');
            const analysis = await geminiService.analyzeSynergy(product, candidates);
            synergyResult = {
              sugerencia_complementaria: analysis.sugerencia_complementaria,
              skus_relacionados: analysis.skus_relacionados,
              explicacion_clinica: analysis.explicacion_clinica
            };
          } catch (e: any) {
            logger.warn(`Gemini falló (esperando retry en cola).`, 'Sinergia');
            await taskQueueService.addTask('ai_analysis', { sku: product.sku, type: 'synergy' });
          }
        }
      }

      if (!synergyResult && status.isReady) {
        this.setActiveEngine('WebLLM (Interno GPU)');
        try {
          logger.info(`Consultando WebLLM (Browser)...`, 'Sinergia');
          const prompt = `Analiza la sinergia clínica entre el producto principal y sus complementos. 
          
          PRODUCTO PRINCIPAL:
          - Nombre: ${product.nombre_comercial}
          - Indicaciones: ${formatArrayToString(product.indicaciones, ', ')}
          
          CANDIDATOS:
          ${candidates.map(c => `- ${c.nombre_comercial}: ${formatArrayToString(c.indicaciones, ', ')}`).join('\n')}
          
          TAREA:
          1. Explica por qué estos productos se complementan clínicamente.
          2. Indica qué beneficios aporta combinar ${product.nombre_comercial} con los candidatos mencionados.
          3. Mantén la respuesta concisa y profesional.`;

          const localAnalysis = await aiService.analyze(prompt, [product, ...candidates]);
          synergyResult = {
            sugerencia_complementaria: localAnalysis.substring(0, 200),
            skus_relacionados: candidates.map(c => c.sku),
            explicacion_clinica: localAnalysis
          };
        } catch (e) {
          logger.error(`WebLLM falló fatalmente.`, 'Sinergia');
        }
      }

      if (!synergyResult) {
        synergyResult = {
          sugerencia_complementaria: "Análisis pendiente de motor IA.",
          skus_relacionados: [],
          explicacion_clinica: "No hay motores de IA disponibles para el análisis profundo."
        };
      }

      const finalProduct = {
        ...product,
        synergy_analyzed: true,
        last_synergy_analysis: Date.now(),
        sugerencia_complementaria: synergyResult.sugerencia_complementaria,
        skus_relacionados: synergyResult.skus_relacionados,
        anotaciones_componentes: anotaciones_componentes
      };

      await cloudSyncService.releaseProductLockAndSave(finalProduct);
      
      const duration = ((Date.now() - startTimestamp) / 1000).toFixed(1);
      logger.success(`Completado: ${product.nombre_comercial} (${duration}s)`, 'Sinergia');

    } catch (error: any) {
      logger.error(`Fallo en pipeline para ${product.sku}`, 'Sinergia', error);
      
      const retryCount = (product as any).synergy_retries || 0;
      await dataService.saveProduct({ 
        ...product, 
        synergy_retries: retryCount + 1,
        last_synergy_analysis: Date.now() 
      }, { silent: true });

      console.error(`[SynergyService] Error procesando ${product.sku}:`, error);
    } finally {
      this.clearCurrent();
    }
  }

  private clearCurrent() {
    this.currentProcessingSku = null;
    this.currentProcessingName = null;
    this.currentEngine = null;
    this.notifyListeners();
  }

  private setActiveEngine(engine: string) {
    this.currentEngine = engine;
    this.notifyListeners();
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
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
}

export const synergyBackgroundService = SynergyBackgroundService.getInstance();
