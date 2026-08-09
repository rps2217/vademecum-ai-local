/**
 * OnboardingPage - Configuración inicial
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useE2EE } from '@/app/E2EEAuthProvider';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { Card } from '@/ui/Card';
import { Copy, Check, Shield, Key, Eye, EyeOff } from 'lucide-react';

export function OnboardingPage() {
  const navigate = useNavigate();
  const { setup, hasAccount, isLoading } = useE2EE();
  const [step, setStep] = useState(1);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [recoveryPhrase, setRecoveryPhrase] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Calculate password strength
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 1) return { score: 1, label: 'Débil', color: 'bg-red-500' };
    if (score <= 2) return { score: 2, label: 'Regular', color: 'bg-orange-500' };
    if (score <= 3) return { score: 3, label: 'Buena', color: 'bg-yellow-500' };
    return { score: 4, label: 'Fuerte', color: 'bg-green-500' };
  }, [password]);

  // Redirect to login if already has account (useEffect to avoid render-time navigation)
  useEffect(() => {
    if (!isLoading && hasAccount) {
      navigate('/login', { replace: true });
    }
  }, [isLoading, hasAccount, navigate]);

  // Clear copy timer on unmount
  useEffect(() => () => {
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
  }, []);

  // Show loading while checking auth state
  if (isLoading) {
    return null;
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
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

    // Generate keypair
    setStep(2);
    setIsSubmitting(true);
    
    try {
      const result = await setup(password);
      setRecoveryPhrase(result.recoveryPhrase);
      setStep(3);
    } catch {
      setError('Error al generar las claves. Intenta de nuevo.');
      setStep(1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(recoveryPhrase);
    setCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
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
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" aria-hidden="true" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Tu contraseña protege el acceso a tus datos. Debe tener al menos 8 caracteres.
                </p>
              </div>

              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  label="Contraseña"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

              {/* Password strength indicator */}
              {password && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          level <= passwordStrength.score ? passwordStrength.color : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Fortaleza: {passwordStrength.label}
                  </p>
                </div>
              )}

              <div className="relative">
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  label="Confirmar contraseña"
                  placeholder="Repite la contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={error}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-9 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded active:bg-accent"
                  aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                </button>
              </div>

              <Button type="submit" className="w-full" isLoading={isSubmitting}>
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
                <Key className="w-5 h-5 text-amber-600 mt-0.5" aria-hidden="true" />
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
                    <Check className="w-4 h-4 mr-2" aria-hidden="true" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" aria-hidden="true" />
                    Copiar al portapapeles
                  </>
                )}
              </Button>

              <Button className="w-full" onClick={handleComplete} isLoading={isSubmitting}>
                Completar configuración
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
