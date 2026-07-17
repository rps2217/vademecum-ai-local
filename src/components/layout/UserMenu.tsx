import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCloudSync } from '../../hooks/useCloudSync';
import { LogOut, User as UserIcon, Loader2, RefreshCw } from 'lucide-react';

export const UserMenu: React.FC = () => {
  const { user, signOut, isAdmin, loading } = useAuth();
  const { isSyncing, cloudHasData, handleSync } = useCloudSync();

  const onSyncClick = async () => {
    try {
      const count = await handleSync();
      if (count !== undefined) {
        alert(`¡Sincronización exitosa! Se han subido/actualizado ${count} productos en la nube.`);
      }
    } catch (error) {
      alert("Hubo un error al sincronizar con la nube.");
    }
  };

  const onSignOut = async () => {
    await signOut();
  };

  if (loading) return null;
  
  if (!user) {
    return null; // No mostrar nada si no hay usuario (AccessGate se encarga)
  }

  return (
    <div className="flex items-center gap-2">
      {isAdmin && cloudHasData === false && (
        <button
          onClick={onSyncClick}
          disabled={isSyncing}
          className="p-2.5 bg-brand-accent/10 border border-brand-accent/20 text-primary rounded-xl hover:bg-brand-accent/20 transition-all disabled:opacity-50"
          title="Sincronizar Nube"
        >
          {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </button>
      )}
      
      <div className="flex items-center gap-2 bg-card border border-border p-1 rounded-xl">
        <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/10" title={user.email || user.uid}>
          <UserIcon className="w-4 h-4 text-orange-500" />
        </div>
        
        <button
          onClick={onSignOut}
          className="p-1 px-2 text-muted-foreground hover:text-foreground transition-colors"
          title="Cerrar Sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
