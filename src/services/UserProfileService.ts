/**
 * User Profile Service - Sincronización de Configuraciones entre Dispositivos
 * 
 * Permite a los usuarios:
 * - Crear cuenta o iniciar sesión
 * - Guardar configuraciones en la nube (Supabase)
 * - Sincronizar configuraciones entre dispositivos
 */

import { supabaseService } from './SupabaseService';
import { logger } from './LoggerService';

export interface UserSettings {
  // Identificación
  userId: string;
  email: string;
  displayName: string;
  
  // Configuraciones de APIs
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  geminiApiKey?: string;
  
  // Preferencias de la app
  theme: 'light' | 'dark' | 'auto';
  language: string;
  
  // Configuraciones de búsqueda
  searchPreferences: {
    fuzzySearch: boolean;
    semanticSearch: boolean;
    maxResults: number;
  };
  
  // Configuraciones de sync
  syncEnabled: boolean;
  lastSyncAt: string;
}

export interface AuthResult {
  success: boolean;
  user?: UserSettings;
  error?: string;
}

// Nombre de la tabla en Supabase
const PROFILES_TABLE = 'user_profiles';

class UserProfileService {
  private static instance: UserProfileService;
  private currentUser: UserSettings | null = null;
  private listeners: ((user: UserSettings | null) => void)[] = [];

  private constructor() {
    // Verificar si hay sesión guardada
    this.restoreSession();
    
    // Escuchar cambios de autenticación de Supabase
    this.setupAuthListener();
  }

  static getInstance(): UserProfileService {
    if (!UserProfileService.instance) {
      UserProfileService.instance = new UserProfileService();
    }
    return UserProfileService.instance;
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser(): UserSettings | null {
    return this.currentUser;
  }

  /**
   * Registra un listener para cambios de autenticación
   */
  onAuthChange(callback: (user: UserSettings | null) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Registra un nuevo usuario
   */
  async signUp(email: string, password: string, displayName?: string): Promise<AuthResult> {
    const client = supabaseService.getClient();
    if (!client) {
      return { success: false, error: 'Supabase no está configurado' };
    }

    try {
      // Verificar si Supabase Auth está configurado
      const { data: authData, error: authError } = await client.auth.signUp({
        email,
        password,
      });

      if (authError) {
        logger.error('Error en registro:', 'UserProfile', authError);
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'No se pudo crear el usuario' };
      }

      // Crear perfil inicial
      const profile: Partial<UserSettings> = {
        userId: authData.user.id,
        email: authData.user.email || email,
        displayName: displayName || email.split('@')[0],
        theme: 'auto',
        language: 'es',
        syncEnabled: true,
        lastSyncAt: new Date().toISOString(),
        searchPreferences: {
          fuzzySearch: true,
          semanticSearch: true,
          maxResults: 50,
        },
      };

      // Guardar en tabla profiles
      const { error: profileError } = await client
        .from(PROFILES_TABLE)
        .insert({
          user_id: authData.user.id,
          email: profile.email,
          display_name: profile.displayName,
          settings: profile,
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        logger.warn('Error guardando perfil inicial:', 'UserProfile', profileError);
        // No fallar por esto, el perfil se puede crear después
      }

      // Guardar sesión
      this.currentUser = profile as UserSettings;
      this.saveSession();
      this.notifyListeners();

      logger.info(`Usuario registrado: ${email}`, 'UserProfile');
      return { success: true, user: this.currentUser };

    } catch (error: any) {
      logger.error('Error en signUp:', 'UserProfile', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Inicia sesión
   */
  async signIn(email: string, password: string): Promise<AuthResult> {
    const client = supabaseService.getClient();
    if (!client) {
      return { success: false, error: 'Supabase no está configurado' };
    }

    try {
      const { data: authData, error: authError } = await client.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        logger.error('Error en login:', 'UserProfile', authError);
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'No se pudo iniciar sesión' };
      }

      // Cargar perfil desde Supabase
      const profile = await this.loadProfile(authData.user.id);
      
      if (profile) {
        this.currentUser = profile;
        this.saveSession();
        this.notifyListeners();
        
        logger.info(`Sesión iniciada: ${email}`, 'UserProfile');
        return { success: true, user: profile };
      }

      // Crear perfil si no existe
      return this.createDefaultProfile(authData.user);

    } catch (error: any) {
      logger.error('Error en signIn:', 'UserProfile', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cierra sesión
   */
  async signOut(): Promise<void> {
    const client = supabaseService.getClient();
    if (client) {
      await client.auth.signOut();
    }
    
    this.currentUser = null;
    this.clearSession();
    this.notifyListeners();
    
    logger.info('Sesión cerrada', 'UserProfile');
  }

  /**
   * Actualiza las configuraciones del usuario
   */
  async updateSettings(settings: Partial<UserSettings>): Promise<AuthResult> {
    if (!this.currentUser) {
      return { success: false, error: 'No hay usuario autenticado' };
    }

    const client = supabaseService.getClient();
    if (!client) {
      return { success: false, error: 'Supabase no está configurado' };
    }

    try {
      // Actualizar local
      this.currentUser = { ...this.currentUser, ...settings };
      this.currentUser.lastSyncAt = new Date().toISOString();

      // Sincronizar a Supabase
      const { error } = await client
        .from(PROFILES_TABLE)
        .update({
          settings: this.currentUser,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', this.currentUser.userId);

      if (error) {
        logger.error('Error sincronizando settings:', 'UserProfile', error);
        // Guardar localmente aunque falle la sync
        this.saveSession();
        return { success: false, error: error.message };
      }

      this.saveSession();
      this.notifyListeners();
      logger.info('Configuraciones actualizadas', 'UserProfile');
      
      return { success: true, user: this.currentUser };

    } catch (error: any) {
      logger.error('Error en updateSettings:', 'UserProfile', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sincroniza configuraciones desde la nube
   */
  async syncFromCloud(): Promise<AuthResult> {
    if (!this.currentUser) {
      return { success: false, error: 'No hay usuario autenticado' };
    }

    const profile = await this.loadProfile(this.currentUser.userId);
    
    if (profile) {
      this.currentUser = profile;
      this.saveSession();
      this.notifyListeners();
      return { success: true, user: profile };
    }

    return { success: false, error: 'No se pudo cargar perfil desde la nube' };
  }

  /**
   * Genera un código QR o link para importar configuraciones
   * (Para usuarios sin cuenta de Supabase)
   */
  async exportConfig(): Promise<string> {
    if (!this.currentUser) {
      throw new Error('No hay usuario autenticado');
    }

    // Crear payload con configuraciones (sin datos sensibles completos)
    const config = {
      version: 1,
      exportDate: new Date().toISOString(),
      userId: this.currentUser.userId,
      displayName: this.currentUser.displayName,
      settings: {
        theme: this.currentUser.theme,
        language: this.currentUser.language,
        searchPreferences: this.currentUser.searchPreferences,
        // NO incluir API keys en exportación simple
      },
    };

    // Codificar como base64 para fácil transferencia
    return btoa(JSON.stringify(config));
  }

  /**
   * Importa configuraciones desde código
   */
  async importConfig(encodedConfig: string): Promise<AuthResult> {
    try {
      const config = JSON.parse(atob(encodedConfig));
      
      if (config.version !== 1) {
        return { success: false, error: 'Versión de configuración no soportada' };
      }

      if (this.currentUser) {
        // Fusionar con configuraciones actuales
        const merged: Partial<UserSettings> = {
          ...this.currentUser,
          ...config.settings,
        };
        return this.updateSettings(merged);
      }

      return { success: false, error: 'Debe iniciar sesión primero' };

    } catch (error: any) {
      return { success: false, error: 'Código de configuración inválido' };
    }
  }

  // ==================== MÉTODOS PRIVADOS ====================

  private async loadProfile(userId: string): Promise<UserSettings | null> {
    const client = supabaseService.getClient();
    if (!client) return null;

    try {
      // Usar maybeSingle() en lugar de single() para no error si no existe
      const { data, error } = await client
        .from(PROFILES_TABLE)
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        // Si la tabla no existe, intentar crearla
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          logger.warn('Tabla user_profiles no existe, intentando crear...', 'UserProfile');
          await this.ensureTableExists();
          return null;
        }
        logger.debug('Error cargando perfil (puede ser normal):', 'UserProfile', error.message);
        return null;
      }

      if (!data) {
        // No existe perfil, es normal para nuevos usuarios
        return null;
      }

      return this.parseProfile(data);

    } catch (error: any) {
      // Error genérico, puede ser que la tabla no existe
      logger.debug('Excepción cargando perfil:', 'UserProfile', error.message);
      return null;
    }
  }

  /**
   * Intenta crear la tabla si no existe (solo para clientes nuevos)
   */
  private async ensureTableExists(): Promise<boolean> {
    const client = supabaseService.getClient();
    if (!client) return false;

    try {
      // Intentar crear la tabla usando la API de Supabase
      const { error } = await client.rpc('pg_catalog.pg_tables', {
        schemaname: 'public',
      });
      
      // Si llegamos aquí sin error crítico, la conexión funciona
      // El usuario necesitará crear la tabla manualmente via SQL
      logger.info('Tabla user_profiles requiere creación manual', 'UserProfile');
      return false;
    } catch {
      return false;
    }
  }

  private async createDefaultProfile(user: any): Promise<AuthResult> {
    const profile: UserSettings = {
      userId: user.id,
      email: user.email || '',
      displayName: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Usuario',
      theme: 'auto',
      language: 'es',
      syncEnabled: true,
      lastSyncAt: new Date().toISOString(),
      searchPreferences: {
        fuzzySearch: true,
        semanticSearch: true,
        maxResults: 50,
      },
    };

    const client = supabaseService.getClient();
    if (client) {
      await client
        .from(PROFILES_TABLE)
        .insert({
          user_id: user.id,
          email: profile.email,
          display_name: profile.displayName,
          settings: profile,
          updated_at: new Date().toISOString(),
        });
    }

    this.currentUser = profile;
    this.saveSession();
    this.notifyListeners();

    return { success: true, user: profile };
  }

  private parseProfile(data: any): UserSettings {
    const settings = data.settings || {};
    return {
      userId: data.user_id,
      email: data.email,
      displayName: data.display_name || settings.displayName || 'Usuario',
      supabaseUrl: settings.supabaseUrl,
      supabaseAnonKey: settings.supabaseAnonKey,
      geminiApiKey: settings.geminiApiKey,
      theme: settings.theme || 'auto',
      language: settings.language || 'es',
      syncEnabled: settings.syncEnabled ?? true,
      lastSyncAt: settings.lastSyncAt || data.updated_at,
      searchPreferences: settings.searchPreferences || {
        fuzzySearch: true,
        semanticSearch: true,
        maxResults: 50,
      },
    };
  }

  private setupAuthListener(): void {
    const client = supabaseService.getClient();
    if (!client) return;

    client.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await this.loadProfile(session.user.id);
        if (profile) {
          this.currentUser = profile;
          this.saveSession();
          this.notifyListeners();
        }
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null;
        this.clearSession();
        this.notifyListeners();
      }
    });
  }

  private saveSession(): void {
    if (this.currentUser && typeof localStorage !== 'undefined') {
      // Guardar sesión de Supabase (manejado por el SDK)
      // Guardar también en localStorage como backup
      localStorage.setItem('vademecum_user_profile', JSON.stringify(this.currentUser));
    }
  }

  private restoreSession(): void {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('vademecum_user_profile');
      if (saved) {
        try {
          this.currentUser = JSON.parse(saved);
        } catch (e) {
          localStorage.removeItem('vademecum_user_profile');
        }
      }
    }
  }

  private clearSession(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('vademecum_user_profile');
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.currentUser);
      } catch (e) {
        logger.error('Error en listener:', 'UserProfile', e);
      }
    });
  }
}

// Singleton export
export const userProfileService = UserProfileService.getInstance();
