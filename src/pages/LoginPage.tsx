/**
 * LoginPage - Página de inicio de sesión
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useE2EE } from '@/app/E2EEAuthProvider';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { Lock, Eye, EyeOff } from 'lucide-react';

export function LoginPage() {
  const { unlock } = useE2EE();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await unlock(password);
      if (!success) {
        setError('Contraseña incorrecta');
      }
    } catch {
      setError('Error al desbloquear');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Lock className="w-8 h-8 text-primary" />
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
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
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
