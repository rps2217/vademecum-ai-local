/**
 * Supabase Client
 * 
 * Cliente singleton para conexion con Supabase.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;
let configError: string | null = null;

/**
 * Placeholder para credenciales de ejemplo
 */
const PLACEHOLDER_URL = 'yourproject.supabase.co';

/**
 * Verifica si Supabase esta configurado con credenciales reales
 */
export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    return false;
  }
  
  // Verificar que no sean los valores placeholder
  if (url.includes(PLACEHOLDER_URL) || url === '') {
    return false;
  }
  
  return true;
}

/**
 * Obtiene la URL de Supabase configurada
 */
export function getSupabaseUrl(): string | null {
  return import.meta.env.VITE_SUPABASE_URL || null;
}

/**
 * Obtiene la clave anon de Supabase
 */
export function getSupabaseAnonKey(): string | null {
  return import.meta.env.VITE_SUPABASE_ANON_KEY || null;
}

/**
 * Obtiene el cliente Supabase (singleton)
 * 
 * @returns Cliente Supabase o null si no esta configurado
 */
export function getSupabase(): SupabaseClient | null {
  if (configError) {
    console.warn('[Supabase] Config error:', configError);
    return null;
  }

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
      
      console.log('[Supabase] Client created successfully');
    } catch (err) {
      configError = err instanceof Error ? err.message : 'Failed to create Supabase client';
      console.error('[Supabase] Creation error:', configError);
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
    // Verificar tabla extended_ingredients (la que usa el sync)
    const { data, error } = await supabase
      .from('extended_ingredients')
      .select('ingredient_key')
      .limit(1);
    
    if (error) {
      // 406 = tabla existe pero RLS no permite (OK, sync configurado)
      // 42P01 = tabla no existe
      if (error.code === '42P01') {
        return { 
          success: true, 
          message: 'Conexion exitosa - tabla extended_ingredients no existe aun' 
        };
      }
      // Otros errores pueden ser por RLS, pero la conexion funciona
      if (error.code === '406' || error.code === '42501') {
        return { 
          success: true, 
          message: 'Conexion exitosa - RLS configurado' 
        };
      }
      return { 
        success: false, 
        error: error.message,
        message: 'Error en consulta'
      };
    }
    
    return { 
      success: true, 
      message: `Conexion exitosa (${Array.isArray(data) ? data.length : 0} registros)` 
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
  console.log('[Supabase] Client reset');
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
