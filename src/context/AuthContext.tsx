import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: { uid: string; email?: string } | null;
  loading: boolean;
  isAdmin: boolean;
  isAccessGranted: boolean;
  grantAccess: (key: string) => boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Access key loaded from environment variable — never hardcode secrets in source.
const SYSTEM_ACCESS_KEY = import.meta.env.VITE_ACCESS_KEY as string || '';
if (!SYSTEM_ACCESS_KEY) {
  console.warn('[Auth] VITE_ACCESS_KEY no configurada en .env. El acceso profesional no funcionará.');
}

/**
 * AuthProvider simplificado tras migración a Supabase.
 * Actualmente se enfoca en el acceso profesional mediante clave.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ uid: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAccessGranted, setIsAccessGranted] = useState(() => {
    return localStorage.getItem('vademecum_access_granted') === 'true';
  });

  useEffect(() => {
    // Simulamos un usuario local para mantener la lógica de permisos activa
    if (isAccessGranted) {
      setUser({ uid: 'local-professional', email: 'profesional@local.vademecum' });
      setIsAdmin(true); // El usuario con acceso profesional actúa como admin local
    } else {
      setUser(null);
      setIsAdmin(false);
    }
    setLoading(false);
  }, [isAccessGranted]);

  const grantAccess = (key: string) => {
    if (key === SYSTEM_ACCESS_KEY) {
      setIsAccessGranted(true);
      localStorage.setItem('vademecum_access_granted', 'true');
      return true;
    }
    return false;
  };

  const login = async () => {
    // Aquí se integraría Supabase Auth en el futuro
  };

  const logout = async () => {
    setIsAccessGranted(false);
    localStorage.removeItem('vademecum_access_granted');
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isAccessGranted, grantAccess, login, logout }}>
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
