/**
 * Supabase Client
 *
 * Cliente singleton para conexion con Supabase.
 */

import { logger } from '@/lib/logger';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;
let configError: string | null = null;

/**
 * Default de credenciales de producción para Vademecum AI
 */
const DEFAULT_URL = 'https://lcoweosnhdkzogtmsfml.supabase.co';
const DEFAULT_KEY = 'sb_publishable_kIQXsVe8mokmityM5GzozA_RLaXcDAo';
const PLACEHOLDER_URL = 'yourproject.supabase.co';

function isPlaceholder(value: string | undefined | null): boolean {
  if (!value) return true;
  const val = value.trim().toLowerCase();
  return (
    val === '' ||
    val.includes('yourproject') ||
    val.includes('your-anon') ||
    val.includes('your-publishable') ||
    val.includes('your-secret') ||
    val.includes('tu-clave') ||
    val.includes('tu-proyecto') ||
    val.includes('example.supabase.co')
  );
}

export function getEffectiveSupabaseUrl(): string {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  if (envUrl && !isPlaceholder(envUrl)) {
    return envUrl.trim();
  }
  return DEFAULT_URL;
}

export function getEffectiveSupabaseAnonKey(): string {
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (envKey && !isPlaceholder(envKey)) {
    return envKey.trim();
  }
  return DEFAULT_KEY;
}

/**
 * Verifica si Supabase esta configurado con credenciales reales
 */
export function isSupabaseConfigured(): boolean {
  const url = getEffectiveSupabaseUrl();
  const key = getEffectiveSupabaseAnonKey();
  
  if (!url || !key) {
    return false;
  }
  
  if (url.includes(PLACEHOLDER_URL) || url === '') {
    return false;
  }
  
  return true;
}

/**
 * Obtiene la URL de Supabase configurada
 */
export function getSupabaseUrl(): string | null {
  return getEffectiveSupabaseUrl();
}

/**
 * Obtiene la clave anon de Supabase
 */
export function getSupabaseAnonKey(): string | null {
  return getEffectiveSupabaseAnonKey();
}

/**
 * Obtiene el cliente Supabase (singleton)
 * 
 * @returns Cliente Supabase o null si no esta configurado
 */
export function getSupabase(): SupabaseClient | null {
  if (configError) {
    logger.warn('[Supabase] Config error:', configError);
    return null;
  }

  const url = getEffectiveSupabaseUrl();
  const key = getEffectiveSupabaseAnonKey();

  // Validar credenciales
  if (!url || !key) {
    configError = 'VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set in environment';
    return null;
  }

  if (url.includes(PLACEHOLDER_URL) || url === '') {
    configError = 'Please configure real Supabase credentials in .env file';
    return null;
  }

  // Crear cliente si no existe
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
        global: {
          headers: {
            'x-client-info': 'vademecum-ai',
          },
        },
      });
      
      logger.log('[Supabase] Client created successfully');
    } catch (err) {
      configError = err instanceof Error ? err.message : 'Failed to create Supabase client';
      logger.error('[Supabase] Creation error:', configError);
      return null;
    }
  }

  return supabaseInstance;
}

/**
 * Prueba la conexion a Supabase
 */
export async function testConnection(): Promise<{
  success: boolean;
  error?: string;
  message?: string;
}> {
  const supabase = getSupabase();
  
  if (!supabase) {
    return { 
      success: false, 
      error: configError || 'Supabase not configured',
      message: 'Credenciales no configuradas'
    };
  }

  try {
    // Verificar tabla products (catalogo comercial) e ingredients
    const { count: productCount, error: prodErr } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (prodErr) {
      if (prodErr.code === '42P01' || prodErr.code === 'PGRST205') {
        return {
          success: false,
          error: prodErr.message,
          message: 'Conexión OK pero la tabla "products" no existe en Supabase'
        };
      }
      if (prodErr.code === '42501') {
        return {
          success: true,
          message: 'Conexión exitosa - RLS activo (sin permiso de lectura con anon key)'
        };
      }
      return {
        success: false,
        error: prodErr.message,
        message: 'Error en consulta de catálogo'
      };
    }

    const { count: ingCount } = await supabase
      .from('ingredients')
      .select('*', { count: 'exact', head: true });

    return {
      success: true,
      message: `Conexión activa y verificada: ${productCount ?? 0} productos y ${ingCount ?? 0} ingredientes en Supabase.`
    };
  } catch (err) {
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Connection test failed',
      message: 'Error de conexion'
    };
  }
}

/**
 * Resetea el cliente (util para re-configuracion)
 */
export function resetSupabaseClient(): void {
  supabaseInstance = null;
  configError = null;
  logger.log('[Supabase] Client reset');
}

/**
 * Obtiene el estado actual de la configuracion
 */
export function getSupabaseConfigStatus(): {
  configured: boolean;
  url: string | null;
  hasKey: boolean;
  error: string | null;
} {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  return {
    configured: isSupabaseConfigured(),
    url: url || null,
    hasKey: !!key,
    error: configError,
  };
}
