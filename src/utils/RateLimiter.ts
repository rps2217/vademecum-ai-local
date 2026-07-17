/**
 * Rate Limiter Utility
 * Controla la frecuencia de llamadas a APIs para evitar throttling
 */

export interface RateLimiterConfig {
  maxRequests: number;      // Máximo requests por ventana
  windowMs: number;         // Ventana de tiempo en ms
  onLimitReached?: () => void;
}

export class RateLimiter {
  private requests: number[] = [];
  private config: RateLimiterConfig;

  constructor(config: RateLimiterConfig) {
    this.config = config;
  }

  /**
   * Verifica si se puede hacer un request
   */
  canMakeRequest(): boolean {
    this.cleanOldRequests();
    return this.requests.length < this.config.maxRequests;
  }

  /**
   * Registra un request y retorna delay si es necesario
   */
  async waitForSlot(): Promise<void> {
    this.cleanOldRequests();
    
    if (this.requests.length >= this.config.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.config.windowMs - (Date.now() - oldestRequest);
      
      if (waitTime > 0) {
        this.config.onLimitReached?.();
        await this.delay(waitTime);
        this.cleanOldRequests();
      }
    }
    
    this.requests.push(Date.now());
  }

  /**
   * Hace un request con rate limiting automático
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    await this.waitForSlot();
    return fn();
  }

  /**
   * Limpia requests antiguos fuera de la ventana
   */
  private cleanOldRequests(): void {
    const now = Date.now();
    this.requests = this.requests.filter(
      timestamp => now - timestamp < this.config.windowMs
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Reset del limiter
   */
  reset(): void {
    this.requests = [];
  }

  /**
   * Obtiene stats actuales
   */
  getStats() {
    this.cleanOldRequests();
    return {
      currentRequests: this.requests.length,
      maxRequests: this.config.maxRequests,
      remainingRequests: this.config.maxRequests - this.requests.length,
      windowMs: this.config.windowMs
    };
  }
}

// Rate limiters pre-configurados
export const supabaseRateLimiter = new RateLimiter({
  maxRequests: 30,           // Supabase free tier: 60 req/min
  windowMs: 60 * 1000,      // 1 minuto
  onLimitReached: () => console.warn('[RateLimiter] Límite de Supabase próximo')
});

export const geminiRateLimiter = new RateLimiter({
  maxRequests: 15,           // Gemini free tier: 15 req/min
  windowMs: 60 * 1000,      // 1 minuto
  onLimitReached: () => console.warn('[RateLimiter] Límite de Gemini próximo')
});

export const apiRateLimiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60 * 1000,
});
