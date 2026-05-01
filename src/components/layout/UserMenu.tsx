import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCloudSync } from '../../hooks/useCloudSync';
import { LogOut, User as UserIcon, Loader2, RefreshCw, Lock } from 'lucide-react';

export const UserMenu: React.FC = () => {
  const { user, login, logout, isAdmin, loading } = useAuth();
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

  if (loading) return null;

  if (!user) {
    return (
      <button
        onClick={login}
        className="p-2 text-slate-700 hover:text-brand-primary transition-colors"
        title="Acceso Administrador"
      >
        <Lock className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {isAdmin && cloudHasData === false && (
        <button
          onClick={onSyncClick}
          disabled={isSyncing}
          className="p-2.5 bg-brand-accent/10 border border-brand-accent/20 text-brand-accent rounded-xl hover:bg-brand-accent/20 transition-all disabled:opacity-50"
          title="Sincronizar Nube"
        >
          {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </button>
      )}
      
      <div className="flex items-center gap-2 bg-brand-surface border border-slate-800 p-1 rounded-xl">
        <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/10">
          <UserIcon className="w-4 h-4 text-orange-500" />
        </div>
        
        <button
          onClick={logout}
          className="p-1 px-2 text-slate-500 hover:text-white transition-colors"
          title="Cerrar Sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
