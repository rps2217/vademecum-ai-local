/**
 * LoginPage - Página de inicio de sesión
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useE2EE } from '@/app/E2EEAuthProvider';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { Lock, Eye, EyeOff } from 'lucide-react';

export function LoginPage() {
  const { unlock, hasAccount, isLoading } = useE2EE();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Redirect to onboarding if no account exists (useEffect to avoid render-time navigation)
  useEffect(() => {
    if (!isLoading && !hasAccount) {
      navigate('/onboarding', { replace: true });
    }
  }, [isLoading, hasAccount, navigate]);

  // Show loading while checking auth state
  if (isLoading) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsUnlocking(true);

    try {
      const success = await unlock(password);
      if (!success) {
        setError('Contraseña incorrecta');
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
          <p className="text-muted-foreground mt-2">Ingresa tu contraseña para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded active:bg-accent"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
            </button>
          </div>

          <Button type="submit" className="w-full" isLoading={isUnlocking}>
            Desbloquear
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          ¿Olvidaste tu contraseña?{' '}
          <Link to="/onboarding" className="text-primary hover:underline">
            Restablecer
          </Link>
        </p>
      </div>
    </div>
  );
}
