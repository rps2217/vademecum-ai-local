import React from 'react';
import { Lock, Key } from 'lucide-react';

interface PasswordPromptProps {
  password: string;
  setPassword: (p: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  title?: string;
  description?: string;
}

export const PasswordPrompt: React.FC<PasswordPromptProps> = ({
  password,
  setPassword,
  onSubmit,
  onCancel,
  title = "Acceso Restringido",
  description = "Ingresa la contraseña maestra para editar este registro."
}) => {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-2xl max-w-sm w-full mx-4 animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-primary rounded-3xl flex items-center justify-center mb-6 mx-auto">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-foreground text-center mb-2">{title}</h3>
        <p className="text-muted-foreground text-center text-sm mb-6">{description}</p>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="relative">
            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              autoFocus
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className="w-full bg-background border border-border rounded-2xl pl-12 pr-4 py-4 text-foreground focus:border-primary/50 outline-none transition-all shadow-inner"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-4 rounded-2xl bg-card hover:bg-slate-700 text-muted-foreground font-bold transition-all border border-border"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-4 rounded-2xl bg-primary hover:bg-primary text-foreground font-bold transition-all shadow-lg shadow-brand-primary/20"
            >
              Entrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
