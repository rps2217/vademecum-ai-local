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
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ uid: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAccessGranted, setIsAccessGranted] = useState(false);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(false);

  const validateStoredSession = useCallback((): StoredCredentials | null => {
    try {
      const stored = localStorage.getItem('vademecum_session');
      if (!stored) return null;
      
      const session: StoredCredentials = JSON.parse(stored);
      
      if (Date.now() > session.expiresAt) {
        localStorage.removeItem('vademecum_session');
        return null;
      }
      
      return session;
    } catch {
      localStorage.removeItem('vademecum_session');
      return null;
    }
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const supabase = supabaseService.getClient();
      const isConfigured = supabaseService.isConfigured();
      setIsSupabaseConfigured(isConfigured);

      if (!isConfigured) {
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setUser({ 
          uid: session.user.id, 
          email: session.user.email 
        });
        setIsAdmin(true);
        setIsAccessGranted(true);
        
        localStorage.setItem('vademecum_session', JSON.stringify({
          email: session.user.email,
          sessionToken: session.access_token,
          expiresAt: session.expires_at ? session.expires_at * 1000 : Date.now() + 7 * 24 * 60 * 60 * 1000
        }));
      } else {
        const storedSession = validateStoredSession();
        if (storedSession) {
          const { error } = await supabase.auth.refreshSession();
          if (!error) {
            const { data: { session: newSession } } = await supabase.auth.getSession();
            if (newSession) {
              setUser({ uid: newSession.user.id, email: newSession.user.email });
              setIsAdmin(true);
              setIsAccessGranted(true);
            }
          } else {
            localStorage.removeItem('vademecum_session');
          }
        }
      }
      
      setLoading(false);
    };

    checkSession();

    const supabase = supabaseService.getClient();
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          setUser({ uid: session.user.id, email: session.user.email });
          setIsAdmin(true);
          setIsAccessGranted(true);
        } else {
          setUser(null);
          setIsAdmin(false);
          setIsAccessGranted(false);
          localStorage.removeItem('vademecum_session');
        }
      });

      return () => subscription.unsubscribe();
    }
  }, [validateStoredSession]);

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
