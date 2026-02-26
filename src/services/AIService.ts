import { HardwareProfile } from '../core/types/hardware.types';
import { Product, SafetyStatus } from '../core/types/product.types';

export class AIService {
  private static worker: Worker | null = null;
  private static isInitializing = false;
  private static isReady = false;
  private static initProgressCallback: ((text: string, progress: number) => void) | null = null;
  private static engineName = 'Ninguno';
  private static hardware: HardwareProfile | null = null;

  static setProgressCallback(cb: (text: string, progress: number) => void) {
    this.initProgressCallback = cb;
  }

  // Configurar hardware pero NO iniciar el motor
  static configure(hardware: HardwareProfile) {
    this.hardware = hardware;
  }

  // Iniciar el motor explícitamente (Lazy Load)
  static async startEngine(): Promise<boolean> {
    if (this.isReady) return true;
    if (this.isInitializing) return false; // Ya está en proceso
    if (!this.hardware) throw new Error('Hardware no configurado. Llame a AIService.configure() primero.');

    this.isInitializing = true;
    this.initProgressCallback?.('Iniciando Worker de IA...', 0);

    return new Promise((resolve) => {
      try {
        this.worker = new Worker(new URL('../workers/ai.worker.ts', import.meta.url), { type: 'module' });

        this.worker.onmessage = (e) => {
          const { type, text, progress, success, engine, error } = e.data;

          switch (type) {
            case 'PROGRESS':
              this.initProgressCallback?.(text, progress);
              break;
            case 'INIT_COMPLETE':
              this.isInitializing = false;
              if (success) {
                this.isReady = true;
                this.engineName = engine;
                this.initProgressCallback?.(`${engine} Listo`, 100);
                resolve(true);
              } else {
                console.error('Fallo inicialización IA:', error);
                this.initProgressCallback?.(`Error: ${error}`, 0);
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
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.isReady = false;
    this.isInitializing = false;
    this.engineName = 'Ninguno';
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
        source_url: url
    };
  }

  static async analyze(query: string, products: Product[]): Promise<string> {
    if (!this.worker || !this.isReady) {
        const productNames = products.map(p => p.nombre_comercial).join(' y ');
        return `### ⚡ Modo Lite (Sin IA)\nEl motor de IA no está activo. Mostrando información básica.\n\n**Productos:** ${productNames}\n\nPor favor, active el motor de IA en Configuración para un análisis clínico profundo.`;
    }

    const context = products.map(p => 
      `MEDICAMENTO: ${p.nombre_comercial}\n` +
      `- Principios Activos: ${p.principios_activos.join(', ')}\n` +
      `- Indicaciones: ${p.indicaciones.join(', ')}\n` +
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
      engine: this.engineName
    };
  }
}
