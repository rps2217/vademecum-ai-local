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
          className="flex items-center gap-2 px-3 py-1.5 bg-brand-accent/10 border border-brand-accent/20 text-brand-accent rounded-xl text-[10px] font-bold uppercase hover:bg-brand-accent/20 transition-all disabled:opacity-50"
        >
          {isSyncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          <span>Sincronizar</span>
        </button>
      )}
      <div className="flex items-center gap-1.5 bg-white/5 border border-white/5 p-1 rounded-xl group transition-all hover:bg-white/10">
        <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/10">
          <UserIcon className="w-3.5 h-3.5 text-orange-500" />
        </div>
        <button
          onClick={logout}
          className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
          title="Cerrar Sesión"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
