import { HardwareProfile } from '../core/types/hardware.types';
import { Product } from '../core/types/product.types';

export class AIService {
  private static worker: Worker | null = null;
  private static isInitializing = false;
  private static isReady = false;
  private static initProgressCallback: ((text: string, progress: number) => void) | null = null;
  private static engineName = 'Ninguno';

  static setProgressCallback(cb: (text: string, progress: number) => void) {
    this.initProgressCallback = cb;
  }

  static async initialize(hardware: HardwareProfile) {
    if (this.isInitializing || this.isReady) return;
    this.isInitializing = true;

    // Crear Worker
    this.worker = new Worker(new URL('../workers/ai.worker.ts', import.meta.url), { type: 'module' });

    this.worker.onmessage = (e) => {
      const { type, payload, text, progress, success, engine, error } = e.data;

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
          } else {
            console.error('Fallo inicialización IA:', error);
            this.initProgressCallback?.(`Error: ${error}`, 0);
          }
          break;
        case 'ERROR':
          console.error('Error en Worker IA:', error);
          break;
      }
    };

    this.worker.postMessage({ type: 'INIT', payload: { hardwareTier: hardware.aiModelTier } });
  }

  static async extractProductData(rawText: string, url: string): Promise<Product | null> {
    if (!this.worker || !this.isReady) {
      console.warn('[AIService] Worker no listo.');
      return null;
    }

    return new Promise((resolve) => {
      const handler = (e: MessageEvent) => {
        const { type, payload, error } = e.data;
        if (type === 'EXTRACT_RESULT' || type === 'ERROR') {
          this.worker?.removeEventListener('message', handler);
          
          if (error) {
            console.error('[AIService] Error extracción:', error);
            resolve(null);
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
                console.log('[AIService] Aplicando extracción por Regex al texto:', rawText);
                const nombreMatch = rawText.match(/Producto:\s*([^.]+)/i) || rawText.match(/Nombre:\s*([^.]+)/i);
                const indicacionMatch = rawText.match(/Indicación:\s*([^.]+)/i) || rawText.match(/Para:\s*([^.]+)/i);
                
                if (nombreMatch) {
                    data = {
                        sku: "REC-" + Date.now().toString().slice(-4),
                        nombre_comercial: nombreMatch[1].trim(),
                        principios_activos: [],
                        indicaciones: indicacionMatch ? [indicacionMatch[1].trim()] : [],
                        advertencias: "Datos extraídos parcialmente por heurística",
                        posologia: "Consultar prospecto",
                        descripcion: "Extracción automática",
                        tags_ia: ["extracción_manual"],
                        apto_embarazo: "PRECAUCION",
                        apto_lactancia: "PRECAUCION",
                        apto_pediatria: "PRECAUCION",
                        apto_diabeticos: "PRECAUCION",
                        apto_hipertensos: "PRECAUCION",
                        apto_celiacos: "PRECAUCION",
                        sugerencia_complementaria: "Verificar datos manualmente"
                    };
                }
            }

            if (!data) throw new Error('No se pudo generar JSON.');

            data.vectores = [];
            data.skus_relacionados = [];
            data.source_url = url;
            
            resolve(data as Product);

          } catch (err) {
            console.error(err);
            resolve(null);
          }
        }
      };
      this.worker?.addEventListener('message', handler);
      this.worker?.postMessage({ type: 'EXTRACT', payload: { text: rawText, url } });
    });
  }

  static async analyze(query: string, products: Product[]): Promise<string> {
    if (!this.worker || !this.isReady) return 'IA no disponible.';

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
