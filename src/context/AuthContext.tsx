import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabaseService } from '../services/SupabaseService';

interface AuthContextType {
  user: { uid: string; email?: string } | null;
  loading: boolean;
  isAdmin: boolean;
  isAccessGranted: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  isSupabaseConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface StoredCredentials {
  email: string;
  sessionToken: string;
  expiresAt: number;
}

/**
 * AuthProvider con Supabase Auth integration.
 * Proporciona autenticación segura con email/password.
 * 
 * ⚠️ MODO DESARROLLO: Autenticación deshabilitada para facilitar el desarrollo.
 *    Todos los usuarios tienen acceso de administrador sin necesidad de login.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Modo desarrollo: siempre tener acceso de admin
  const [user] = useState<{ uid: string; email?: string }>({ uid: 'local-user', email: 'local@vademecum.local' });
  const [loading] = useState(false);
  const [isAdmin] = useState(true);
  const [isAccessGranted] = useState(true);
  const [isSupabaseConfigured] = useState(false);

  // useEffect y validateStoredSession deshabilitados en modo desarrollo
  // La autenticación está permanentemente activa con acceso de admin

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const supabase = supabaseService.getClient();
    
    if (!supabase || !supabaseService.isConfigured()) {
      return { success: false, error: 'Sistema de autenticación no disponible. Configure Supabase.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: 'Formato de email inválido' };
    }

    if (password.length < 6) {
      return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.session) {
        setUser({ uid: data.user!.id, email: data.user!.email });
        setIsAdmin(true);
        setIsAccessGranted(true);
        
        localStorage.setItem('vademecum_session', JSON.stringify({
          email: data.user!.email,
          sessionToken: data.session.access_token,
          expiresAt: data.session.expires_at ? data.session.expires_at * 1000 : Date.now() + 7 * 24 * 60 * 60 * 1000
        }));
      }

      return { success: true };
    } catch (err) {
      console.error('Error en signIn:', err);
      return { success: false, error: 'Error de conexión. Intente nuevamente.' };
    }
  };

  const signUp = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const supabase = supabaseService.getClient();
    
    if (!supabase || !supabaseService.isConfigured()) {
      return { success: false, error: 'Sistema de autenticación no disponible. Configure Supabase.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: 'Formato de email inválido' };
    }

    if (password.length < 8) {
      return { success: false, error: 'La contraseña debe tener al menos 8 caracteres' };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            role: 'professional',
            created_at: new Date().toISOString()
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user && !data.session) {
        return { success: true };
      }

      if (data.session) {
        setUser({ uid: data.user!.id, email: data.user!.email });
        setIsAdmin(true);
        setIsAccessGranted(true);
      }

      return { success: true };
    } catch (err) {
      console.error('Error en signUp:', err);
      return { success: false, error: 'Error de conexión. Intente nuevamente.' };
    }
  };

  const signOut = async (): Promise<void> => {
    const supabase = supabaseService.getClient();
    
    if (supabase) {
      await supabase.auth.signOut();
    }
    
    setUser(null);
    setIsAdmin(false);
    setIsAccessGranted(false);
    localStorage.removeItem('vademecum_session');
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const supabase = supabaseService.getClient();
    
    if (!supabase || !supabaseService.isConfigured()) {
      return { success: false, error: 'Sistema de autenticación no disponible.' };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      console.error('Error en resetPassword:', err);
      return { success: false, error: 'Error de conexión. Intente nuevamente.' };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isAdmin, 
      isAccessGranted, 
      signIn,
      signUp,
      signOut,
      resetPassword,
      isSupabaseConfigured
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
