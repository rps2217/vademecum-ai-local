/**
 * OllamaFallbackService - Fallback a Ollama para procesamiento IA local
 * 
 * Ollama permite ejecutar modelos LLM localmente (Llama2, Mistral, etc.)
 * sin necesidad de GPU potente, como alternativa a WebLLM/WebGPU.
 */

import { logger } from './LoggerService';

export interface OllamaConfig {
  baseUrl: string;
  model: string;
  timeout: number;
  maxRetries: number;
}

export interface OllamaResponse {
  model: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
}

const DEFAULT_CONFIG: OllamaConfig = {
  baseUrl: 'http://localhost:11434',
  model: 'llama3.2',
  timeout: 120000,
  maxRetries: 3
};

export class OllamaFallbackService {
  private static instance: OllamaFallbackService;
  private config: OllamaConfig;
  private isAvailable = false;
  private checkInterval: number | null = null;
  private statusCallbacks: ((available: boolean) => void)[] = [];

  private constructor() {
    this.config = this.loadConfig();
  }

  static getInstance(): OllamaFallbackService {
    if (!OllamaFallbackService.instance) {
      OllamaFallbackService.instance = new OllamaFallbackService();
    }
    return OllamaFallbackService.instance;
  }

  private loadConfig(): OllamaConfig {
    const saved = localStorage.getItem('ollama_config');
    if (!saved) return DEFAULT_CONFIG;
    try {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    } catch {
      return DEFAULT_CONFIG;
    }
  }

  updateConfig(updates: Partial<OllamaConfig>): void {
    this.config = { ...this.config, ...updates };
    localStorage.setItem('ollama_config', JSON.stringify(this.config));
    logger.info('Configuracion de Ollama actualizada', 'OllamaFallback');
  }

  getConfig(): OllamaConfig {
    return { ...this.config };
  }

  async checkAvailability(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.config.baseUrl}/api/tags`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const models: OllamaModel[] = data.models || [];
        
        if (models.length > 0) {
          this.isAvailable = true;
          logger.success(`Ollama disponible con ${models.length} modelo(s)`, 'OllamaFallback');
          this.notifyStatusChange(true);
          return true;
        }
      }

      this.isAvailable = false;
      this.notifyStatusChange(false);
      return false;
    } catch {
      this.isAvailable = false;
      this.notifyStatusChange(false);
      return false;
    }
  }

  startHealthCheck(intervalMs: number = 30000): void {
    this.stopHealthCheck();
    this.checkInterval = window.setInterval(() => {
      this.checkAvailability();
    }, intervalMs);
    this.checkAvailability();
  }

  stopHealthCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  async listModels(): Promise<OllamaModel[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.models || [];
    } catch {
      return [];
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.model,
          prompt: text
        }),
        signal: AbortSignal.timeout(this.config.timeout)
      });

      if (!response.ok) {
        throw new Error(`Embedding error: ${response.status}`);
      }

      const data = await response.json();
      return data.embedding || [];
    } catch (error) {
      logger.error('Error generando embedding con Ollama', 'OllamaFallback', error);
      throw error;
    }
  }

  async complete(prompt: string, options?: {
    system?: string;
    temperature?: number;
    maxTokens?: number;
    stop?: string[];
  }): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.config.baseUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.config.model,
            prompt,
            system: options?.system,
            temperature: options?.temperature ?? 0.7,
            options: {
              num_predict: options?.maxTokens ?? 512,
              stop: options?.stop
            },
            stream: false
          }),
          signal: AbortSignal.timeout(this.config.timeout)
        });

        if (!response.ok) {
          throw new Error(`Completion error: ${response.status}`);
        }

        const data: OllamaResponse = await response.json();
        return data.response;
      } catch (error) {
        lastError = error as Error;
        logger.warn(`Intento ${attempt + 1} fallido`, 'OllamaFallback');
        
        if (attempt < this.config.maxRetries - 1) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }

    logger.error('Todos los intentos fallaron', 'OllamaFallback', lastError);
    throw lastError;
  }

  async chat(messages: Array<{ role: string; content: string }>, options?: {
    temperature?: number;
    maxTokens?: number;
  }): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.config.baseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.config.model,
            messages,
            stream: false,
            options: {
              temperature: options?.temperature ?? 0.7,
              num_predict: options?.maxTokens ?? 512
            }
          }),
          signal: AbortSignal.timeout(this.config.timeout)
        });

        if (!response.ok) {
          throw new Error(`Chat error: ${response.status}`);
        }

        const data = await response.json();
        return data.message?.content || '';
      } catch (error) {
        lastError = error as Error;
        logger.warn(`Intento ${attempt + 1} fallido`, 'OllamaFallback');
        
        if (attempt < this.config.maxRetries - 1) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }

    throw lastError;
  }

  async pullModel(model?: string, onProgress?: (progress: number) => void): Promise<boolean> {
    const targetModel = model || this.config.model;

    try {
      const response = await fetch(`${this.config.baseUrl}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: targetModel }),
        signal: AbortSignal.timeout(3600000)
      });

      if (!response.ok) return false;

      const reader = response.body?.getReader();
      if (!reader) return false;

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        try {
          const lines = chunk.split('\n').filter(Boolean);
          for (const line of lines) {
            const data = JSON.parse(line);
            if (data.total && data.completed) {
              const progress = (data.completed / data.total) * 100;
              onProgress?.(progress);
            }
          }
        } catch {}
      }

      logger.success(`Modelo ${targetModel} descargado`, 'OllamaFallback');
      return true;
    } catch (error) {
      logger.error('Error descargando modelo', 'OllamaFallback', error);
      return false;
    }
  }

  isOllamaAvailable(): boolean {
    return this.isAvailable;
  }

  onStatusChange(callback: (available: boolean) => void): () => void {
    this.statusCallbacks.push(callback);
    return () => {
      this.statusCallbacks = this.statusCallbacks.filter(cb => cb !== callback);
    };
  }

  private notifyStatusChange(available: boolean): void {
    this.statusCallbacks.forEach(cb => cb(available));
  }

  getStatus(): { available: boolean; config: OllamaConfig } {
    return {
      available: this.isAvailable,
      config: this.config
    };
  }
}

export const ollamaFallbackService = OllamaFallbackService.getInstance();
