/**
 * AppAuthService - Autenticación Simple con Contraseña Compartida
 * 
 * Sistema simplificado para equipos pequeños:
 * - Una contraseña para toda la app
 * - Se guarda en localStorage (encriptado)
 * - Opcional: sincronizar configs via Supabase (sin usuario individual)
 */

import { logger } from './LoggerService';

const AUTH_KEY = 'vademecum_app_auth';
const CONFIG_KEY = 'vademecum_app_config';
const SALT = 'vademecum-salt-2026';

export interface AppConfig {
  passwordHash: string;
  createdAt: string;
  lastAccess: string;
  deviceId: string;
  supabaseUrl?: string;
  supabaseKey?: string;
  theme?: string;
  language?: string;
}

// Generar ID único para el dispositivo
function getDeviceId(): string {
  let deviceId = localStorage.getItem('vademecum_device_id');
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    localStorage.setItem('vademecum_device_id', deviceId);
  }
  return deviceId;
}

// Hash simple de contraseña (para verificación, no es bcrypt pero suficiente para este caso)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(SALT + password + SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Comparar contraseña
async function comparePassword(password: string, hash: string): Promise<boolean> {
  const inputHash = await hashPassword(password);
  return inputHash === hash;
}

class AppAuthService {
  private static instance: AppAuthService;
  private isAuthenticated: boolean = false;
  private listeners: ((authenticated: boolean) => void)[] = [];

  private constructor() {
    this.checkStoredAuth();
  }

  static getInstance(): AppAuthService {
    if (!AppAuthService.instance) {
      AppAuthService.instance = new AppAuthService();
    }
    return AppAuthService.instance;
  }

  /**
   * Verifica si hay sesión guardada válida
   */
  private checkStoredAuth(): void {
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored) {
      try {
        const config: AppConfig = JSON.parse(stored);
        // Si hay hash guardado, está autenticado (para este modelo simple)
        this.isAuthenticated = !!config.passwordHash;
      } catch {
        this.isAuthenticated = false;
      }
    }
  }

  /**
   * Verificar si está autenticado
   */
  isLoggedIn(): boolean {
    return this.isAuthenticated;
  }

  /**
   * Suscribirse a cambios de autenticación
   */
  onAuthChange(callback: (authenticated: boolean) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Configurar contraseña inicial (primera vez)
   */
  async setupPassword(password: string): Promise<{ success: boolean; error?: string }> {
    if (password.length < 4) {
      return { success: false, error: 'La contraseña debe tener al menos 4 caracteres' };
    }

    try {
      const hash = await hashPassword(password);
      const config: AppConfig = {
        passwordHash: hash,
        createdAt: new Date().toISOString(),
        lastAccess: new Date().toISOString(),
        deviceId: getDeviceId(),
      };

      localStorage.setItem(AUTH_KEY, JSON.stringify(config));
      this.isAuthenticated = true;
      this.notifyListeners();

      logger.info('Contraseña configurada correctamente', 'AppAuth');
      return { success: true };

    } catch (error) {
      logger.error('Error configurando contraseña', 'AppAuth', error);
      return { success: false, error: 'Error al guardar' };
    }
  }

  /**
   * Verificar contraseña
   */
  async verifyPassword(password: string): Promise<{ success: boolean; error?: string }> {
    const stored = localStorage.getItem(AUTH_KEY);
    
    if (!stored) {
      // Primera vez - configurar
      return this.setupPassword(password);
    }

    try {
      const config: AppConfig = JSON.parse(stored);
      const isValid = await comparePassword(password, config.passwordHash);

      if (isValid) {
        // Actualizar último acceso
        config.lastAccess = new Date().toISOString();
        localStorage.setItem(AUTH_KEY, JSON.stringify(config));
        
        this.isAuthenticated = true;
        this.notifyListeners();

        logger.info('Sesión iniciada', 'AppAuth');
        return { success: true };
      }

      return { success: false, error: 'Contraseña incorrecta' };

    } catch (error) {
      logger.error('Error verificando contraseña', 'AppAuth', error);
      return { success: false, error: 'Error al verificar' };
    }
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const verify = await this.verifyPassword(currentPassword);
    if (!verify.success) {
      return { success: false, error: 'Contraseña actual incorrecta' };
    }

    if (newPassword.length < 4) {
      return { success: false, error: 'La nueva contraseña debe tener al menos 4 caracteres' };
    }

    return this.setupPassword(newPassword);
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    // Mantener la configuración pero marcar como desconectado
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored) {
      try {
        const config: AppConfig = JSON.parse(stored);
        config.lastAccess = new Date().toISOString();
        localStorage.setItem(AUTH_KEY, JSON.stringify(config));
      } catch { /* ignore */ }
    }
    
    this.isAuthenticated = false;
    this.notifyListeners();
    logger.info('Sesión cerrada', 'AppAuth');
  }

  /**
   * Reset completo (cuidado - borra todo)
   */
  resetAll(): void {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(CONFIG_KEY);
    localStorage.removeItem('vademecum_device_id');
    this.isAuthenticated = false;
    this.notifyListeners();
    logger.info('Reset completo realizado', 'AppAuth');
  }

  /**
   * Verificar si es primera vez (nunca se ha configurado)
   */
  isFirstTime(): boolean {
    return !localStorage.getItem(AUTH_KEY);
  }

  /**
   * Guardar configuración de la app
   */
  saveAppConfig(config: Partial<Omit<AppConfig, 'passwordHash' | 'deviceId'>>): void {
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored) {
      try {
        const current: AppConfig = JSON.parse(stored);
        const updated = { ...current, ...config };
        localStorage.setItem(AUTH_KEY, JSON.stringify(updated));
      } catch { /* ignore */ }
    }
  }

  /**
   * Obtener configuración actual
   */
  getAppConfig(): AppConfig | null {
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch { return null; }
    }
    return null;
  }

  /**
   * Verificar si tiene Supabase configurado
   */
  hasSupabase(): boolean {
    const config = this.getAppConfig();
    return !!(config?.supabaseUrl && config?.supabaseKey);
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.isAuthenticated);
      } catch (e) {
        logger.error('Error en listener', 'AppAuth', e);
      }
    });
  }
}

export const appAuthService = AppAuthService.getInstance();
