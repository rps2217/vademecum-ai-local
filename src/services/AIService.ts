import { HardwareProfile } from '../core/types/hardware.types';
import { Product, SafetyStatus } from '../core/types/product.types';
import { formatArrayToString } from '../utils/formatters';
import { SynergyBackgroundService } from './SynergyBackgroundService';

export class AIService {
  private static worker: Worker | null = null;
  private static isInitializing = false;
  private static isReady = false;
  private static initProgressCallback: ((text: string, progress: number) => void) | null = null;
  private static engineName = 'Ninguno';
  private static hardware: HardwareProfile | null = null;
  private static lastProgress = { text: '', progress: 0 };
  private static watchdogInterval: number | null = null;

  static setProgressCallback(cb: (text: string, progress: number) => void) {
    this.initProgressCallback = cb;
  }

  // Configurar hardware pero NO iniciar el motor
  static configure(hardware: HardwareProfile) {
    this.hardware = hardware;
  }

  // Iniciar el motor explícitamente (Lazy Load)
  static async startEngine(): Promise<boolean> {
    if (this.isReady) {
      SynergyBackgroundService.start();
      return true;
    }
    if (this.isInitializing) return false; // Ya está en proceso
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
                this.engineName = engine;
                this.lastProgress = { text: `${engine} Listo`, progress: 100 };
                this.initProgressCallback?.(this.lastProgress.text, this.lastProgress.progress);
                
                // Iniciar motor de sinergia en segundo plano
                SynergyBackgroundService.start();
                this.startWatchdog();
                
                resolve(true);
              } else {
                console.error('Fallo inicialización IA:', error);
                this.lastProgress = { text: `Error: ${error}`, progress: 0 };
                this.initProgressCallback?.(this.lastProgress.text, this.lastProgress.progress);
                this.worker?.terminate();
                this.worker = null;
                resolve(false);
              }
              break;
            case 'ERROR':
              console.error('Error en Worker IA:', error);
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
  static stopEngine() {
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

  private static startWatchdog() {
    if (this.watchdogInterval) return;
    // Revisar cada 5 minutos si el worker sigue vivo
    this.watchdogInterval = window.setInterval(async () => {
      if (this.isReady && this.worker) {
        try {
          const health = await this.runHealthCheckTimeout(5000); // 5 segundos de timeout
          if (!health.ok) {
            console.warn('[AIService] Watchdog: El motor no responde. Reiniciando...');
            this.restartEngine();
          }
        } catch (e) {
          console.warn('[AIService] Watchdog: Error de timeout. Reiniciando motor...', e);
          this.restartEngine();
        }
      }
    }, 5 * 60 * 1000);
  }

  private static stopWatchdog() {
    if (this.watchdogInterval) {
      clearInterval(this.watchdogInterval);
      this.watchdogInterval = null;
    }
  }

  private static async restartEngine() {
    this.stopEngine();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar a que se limpie la memoria
    this.startEngine();
  }

  private static async runHealthCheckTimeout(timeoutMs: number): Promise<{ ok: boolean }> {
    return Promise.race([
      this.runHealthCheck(),
      new Promise<{ ok: boolean }>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), timeoutMs)
      )
    ]);
  }

  static async extractProductData(rawText: string, url: string): Promise<Product | null> {
    // Si el motor NO está listo, usamos el modo "Lite" (Regex/Heurística) inmediatamente
    // Esto evita bloqueos y permite funcionalidad básica siempre.
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
            // Fallback a Lite si la IA falla
            resolve(this.extractDataLite(rawText, url));
            return;
          }

          try {
            let content = payload.content;
            let data: any = null;
      
            // Limpieza agresiva para encontrar el JSON
            try {
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                const cleanContent = jsonMatch[0].replace(/```json/g, '').replace(/```/g, '').trim();
                data = JSON.parse(cleanContent);
                }
            } catch (jsonError) {
                console.warn('[AIService] JSON del modelo inválido. Iniciando fallback heurístico.');
            }

            // Si no hay datos válidos del modelo, usar Regex (Fallback)
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

  // Método privado para extracción ligera (Regex/Heurística)
  // Garantiza que la app funcione incluso en un Nokia 3310 (metafóricamente)
  private static extractDataLite(rawText: string, url: string): Product {
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

  static async generateEmbedding(text: string): Promise<number[]> {
    if (!this.worker || !this.isReady) {
      // Fallback a vector vacío si no hay motor
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

  static async analyze(query: string, products: Product[]): Promise<string> {
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

    return new Promise((resolve) => {
        const handler = (e: MessageEvent) => {
            const { type, payload, error } = e.data;
            if (type === 'ANALYZE_RESULT' || type === 'ERROR') {
                this.worker?.removeEventListener('message', handler);
                if (error) resolve('Error generando análisis.');
                else resolve(payload);
            }
        };
        this.worker?.addEventListener('message', handler);
        this.worker?.postMessage({ type: 'ANALYZE', payload: { query, context } });
    });
  }

  static async normalizeTag(tag: string): Promise<string | null> {
    if (!this.worker || !this.isReady) return null;

    return new Promise((resolve) => {
      const handler = (e: MessageEvent) => {
        const { type, payload, error } = e.data;
        if (type === 'NORMALIZE_TAG_RESULT' || type === 'ERROR') {
          this.worker?.removeEventListener('message', handler);
          if (error) resolve(null);
          else resolve(payload);
        }
      };
      this.worker?.addEventListener('message', handler);
      this.worker?.postMessage({ type: 'NORMALIZE_TAG', payload: { tag } });
    });
  }

  static async runHealthCheck(): Promise<{ ok: boolean; engine: string; response?: string; error?: string }> {
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

  static async purgeCache(): Promise<boolean> {
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

  static getStatus() {
    return {
      isReady: this.isReady,
      isInitializing: this.isInitializing,
      engine: this.engineName,
      lastProgress: this.lastProgress
    };
  }
}
