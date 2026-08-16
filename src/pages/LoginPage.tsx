/**
 * LoginPage - Página de inicio de sesión (PIN de 4 dígitos)
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppAuth } from '@/app/AppAuthProvider';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { Lock } from 'lucide-react';

export function LoginPage() {
  const { unlock, hasAccount, isLoading } = useAppAuth();
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
        setError('PIN incorrecto');
        setPin('');
      }
    } catch {
      setError('Error al desbloquear');
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Lock className="w-8 h-8 text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold">Vademecum AI</h1>
          <p className="text-muted-foreground mt-2">Ingresa tu PIN para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="PIN"
            type="password"
            inputMode="numeric"
            placeholder="PIN de 4 dígitos"
            autoComplete="off"
            autoFocus
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            error={error}
          />

          <Button type="submit" className="w-full" isLoading={isUnlocking} disabled={pin.length < 4}>
            Desbloquear
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          ¿Olvidaste tu PIN?{' '}
          <Link to="/onboarding" className="text-primary hover:underline">
            Restablecer
          </Link>
        </p>
      </div>
    </div>
  );
}
