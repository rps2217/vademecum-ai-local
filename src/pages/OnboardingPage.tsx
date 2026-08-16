/**
 * OnboardingPage - Configuración inicial (crear PIN de 4 dígitos)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppAuth } from '@/app/AppAuthProvider';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { Card } from '@/ui/Card';
import { Shield } from 'lucide-react';

export function OnboardingPage() {
  const navigate = useNavigate();
  const { setup, hasAccount, isLoading } = useAppAuth();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && hasAccount) {
      navigate('/login', { replace: true });
    }
  }, [isLoading, hasAccount, navigate]);

  if (isLoading) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (pin.length < 4) {
      setError('El PIN debe tener 4 dígitos');
      return;
    }

    if (pin !== confirmPin) {
      setError('Los PINs no coinciden');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await setup(pin);
      if (success) {
        navigate('/');
      } else {
        setError('No se pudo crear el PIN');
      }
    } catch {
      setError('Error al configurar el PIN');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Shield className="w-8 h-8 text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold">Configuración inicial</h1>
          <p className="text-muted-foreground mt-2">Crea un PIN para proteger el acceso</p>
        </div>

        <Card className="p-6">
          <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg mb-4">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" aria-hidden="true" />
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Este PIN protege el acceso a la aplicación. Debe tener 4 dígitos.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="PIN"
              type="password"
              inputMode="numeric"
              placeholder="4 dígitos"
              autoComplete="off"
              autoFocus
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            />

            <Input
              label="Confirmar PIN"
              type="password"
              inputMode="numeric"
              placeholder="Repite el PIN"
              autoComplete="off"
              maxLength={4}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              error={error}
            />

            <Button type="submit" className="w-full" isLoading={isSubmitting} disabled={pin.length < 4 || confirmPin.length < 4}>
              Crear PIN y continuar
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
