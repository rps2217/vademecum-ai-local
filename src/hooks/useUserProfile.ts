/**
 * useUserProfile Hook - Acceso al perfil de usuario
 * 
 * Uso:
 * const { user, isAuthenticated, updateSettings, signOut } = useUserProfile();
 */

import { useState, useEffect } from 'react';
import { userProfileService, type UserSettings } from '../services/UserProfileService';

export function useUserProfile() {
  const [user, setUser] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Estado inicial
    setUser(userProfileService.getCurrentUser());
    setLoading(false);

    // Suscribirse a cambios
    const unsubscribe = userProfileService.onAuthChange((newUser) => {
      setUser(newUser);
    });

    return () => unsubscribe();
  }, []);

  const isAuthenticated = user !== null;

  const updateSettings = async (settings: Partial<UserSettings>) => {
    return userProfileService.updateSettings(settings);
  };

  const signOut = async () => {
    return userProfileService.signOut();
  };

  const syncFromCloud = async () => {
    return userProfileService.syncFromCloud();
  };

  return {
    user,
    isAuthenticated,
    loading,
    updateSettings,
    signOut,
    syncFromCloud,
  };
}
