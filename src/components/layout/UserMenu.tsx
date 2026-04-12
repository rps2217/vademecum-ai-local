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
    <div className="flex items-center gap-4">
      {isAdmin && cloudHasData === false && (
        <button
          onClick={onSyncClick}
          disabled={isSyncing}
          className="flex items-center gap-2 px-4 py-2 bg-brand-accent text-brand-bg rounded-xl text-sm font-bold hover:bg-brand-accent/80 transition-all disabled:opacity-50"
        >
          {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Sincronizar Nube
        </button>
      )}
      <div className="flex items-center gap-3 bg-brand-surface border border-slate-800 px-4 py-2 rounded-xl">
        <div className="w-6 h-6 rounded-full bg-brand-primary/20 flex items-center justify-center">
          <UserIcon className="w-3.5 h-3.5 text-brand-primary" />
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none mb-1">
            {isAdmin ? 'Administrador' : 'Profesional'}
          </p>
          <p className="text-xs font-bold text-white leading-none truncate max-w-[120px]">
            {user.displayName || user.email}
          </p>
        </div>
        <button
          onClick={logout}
          className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
          title="Cerrar Sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
