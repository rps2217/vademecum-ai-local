/**
 * LoginPage - Página de inicio de sesión (PIN de 4 dígitos)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppAuth } from '@/app/AppAuthProvider';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { Lock, KeyRound } from 'lucide-react';

export function LoginPage() {
  const { unlock, hasAccount, isLoading, resetAccount } = useAppAuth();
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  useEffect(() => {
    if (!isLoading && !hasAccount) {
      navigate('/onboarding', { replace: true });
    }
  }, [isLoading, hasAccount, navigate]);

  if (isLoading) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsUnlocking(true);

    try {
      const success = await unlock(pin);
      if (!success) {
        setError('PIN incorrecto (prueba con 1234)');
        setPin('');
      }
    } catch {
      setError('Error al desbloquear');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleReset = () => {
    resetAccount();
    navigate('/onboarding', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md bg-card border border-border/80 rounded-2xl p-7 sm:p-9 shadow-sm">
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-3.5">
            <Lock className="w-7 h-7" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Vademecum AI</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Mostrador de Farmacia e Inteligencia Clínica
          </p>
        </div>

        {/* PIN Reminder Pill / Note */}
        <div className="mb-6 rounded-xl border border-border/70 bg-muted/40 p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <KeyRound className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
            <span>PIN predeterminado de acceso:</span>
            <span className="font-mono font-bold text-foreground text-sm tracking-wider">1234</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="PIN de acceso (4 dígitos)"
            type="password"
            inputMode="numeric"
            placeholder="••••"
            autoComplete="off"
            autoFocus
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            error={error}
          />

          <Button
            type="submit"
            className="w-full h-11 text-sm font-semibold rounded-xl"
            isLoading={isUnlocking}
            disabled={pin.length < 4}
          >
            Acceder al mostrador
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
          <span>¿Olvidaste tu PIN?</span>
          <button
            type="button"
            onClick={handleReset}
            className="font-medium text-primary hover:underline cursor-pointer"
          >
            Restablecer o crear nuevo
          </button>
        </div>
      </div>
    </div>
  );
}
