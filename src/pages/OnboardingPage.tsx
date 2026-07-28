/**
 * OnboardingPage - Configuración inicial
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useE2EE } from '@/app/E2EEAuthProvider';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { Card } from '@/ui/Card';
import { Copy, Check, Shield, Search, Key } from 'lucide-react';

export function OnboardingPage() {
  const navigate = useNavigate();
  const { setup } = useE2EE();
  const [step, setStep] = useState(1);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [recoveryPhrase, setRecoveryPhrase] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setStep(2);
  };

  const handleSetup = async () => {
    setIsLoading(true);
    try {
      const { recoveryPhrase: phrase } = await setup(password);
      setRecoveryPhrase(phrase);
      setStep(3);
    } catch {
      setError('Error al configurar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(recoveryPhrase);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleComplete = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Configuración inicial</h1>
          <p className="text-muted-foreground mt-2">
            {step === 1 && 'Crea una contraseña segura'}
            {step === 2 && 'Generando claves de seguridad...'}
            {step === 3 && 'Guarda tu frase de recuperación'}
          </p>
        </div>

        {/* Progress */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-3 h-3 rounded-full transition-colors ${
                s <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <Card className="p-6">
          {step === 1 && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Tu contraseña protege el acceso a tus datos. Debe tener al menos 8 caracteres.
                </p>
              </div>

              <Input
                type="password"
                label="Contraseña"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <Input
                type="password"
                label="Confirmar contraseña"
                placeholder="Repite la contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={error}
              />

              <Button type="submit" className="w-full">
                Continuar
              </Button>
            </form>
          )}

          {step === 2 && (
            <div className="text-center py-8">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">Generando claves de cifrado...</p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                <Key className="w-5 h-5 text-amber-600 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Guarda estas 12 palabras en un lugar seguro. Las necesitarás para recuperar tu cuenta.
                </p>
              </div>

              <div className="p-4 bg-muted rounded-lg font-mono text-center">
                {recoveryPhrase}
              </div>

              <Button variant="outline" className="w-full" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar al portapapeles
                  </>
                )}
              </Button>

              <Button className="w-full" onClick={handleComplete} isLoading={isLoading}>
                Completar configuración
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
