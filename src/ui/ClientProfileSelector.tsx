/**
 * ClientProfileSelector - Selector de perfil del cliente en el mostrador.
 *
 * Barra discreta de chips para activar el perfil del cliente que se está
 * atendiendo. Al activarse, los ingredientes con restricciones se marcan
 * visualmente (ámbars/contraindicado) en toda la app.
 */

import { CLIENT_PROFILES, useClientProfile } from '@/contexts/ClientProfileContext';
import { Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ClientProfileSelector({ compact = false }: { compact?: boolean }) {
  const { profile, setProfile } = useClientProfile();
  const active = profile !== 'ninguno';
  const activeInfo = CLIENT_PROFILES.find(p => p.value === profile);

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <Users className={cn('w-3.5 h-3.5', active ? 'text-primary' : 'text-muted-foreground')} aria-hidden="true" />
        {CLIENT_PROFILES.slice(1).map((p) => {
          const isActive = profile === p.value;
          return (
            <button
              key={p.value}
              onClick={() => setProfile(isActive ? 'ninguno' : p.value)}
              title={p.description}
              className={cn(
                'px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
              )}
              aria-pressed={isActive}
            >
              {p.short}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn(
      'rounded-lg border px-3 py-2 transition-colors',
      active ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/30'
    )}>
      <div className="flex items-center gap-2 mb-1.5">
        <Users className={cn('w-4 h-4', active ? 'text-primary' : 'text-muted-foreground')} aria-hidden="true" />
        <span className="text-xs font-medium text-foreground">Perfil del cliente</span>
        {active && activeInfo && (
          <>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-primary font-medium">{activeInfo.label}</span>
            <button
              onClick={() => setProfile('ninguno')}
              className="ml-auto text-muted-foreground hover:text-foreground"
              aria-label="Quitar perfil"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {CLIENT_PROFILES.slice(1).map((p) => {
          const isActive = profile === p.value;
          return (
            <button
              key={p.value}
              onClick={() => setProfile(isActive ? 'ninguno' : p.value)}
              title={p.description}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
              )}
              aria-pressed={isActive}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
