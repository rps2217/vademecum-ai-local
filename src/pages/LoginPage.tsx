import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-bold text-[var(--color-primary-600)]">Vademécum AI</h1>
          <p className="mt-2 text-[var(--fg-muted)]">
            Consultora de farmacia inteligente
          </p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-8 space-y-6">
          <p className="text-sm text-[var(--fg-muted)]">
            Esta aplicación funciona 100% offline. No necesitas crear una cuenta.
          </p>
          <Button className="w-full" size="lg" onClick={() => navigate('/')}>
            Comenzar
          </Button>
        </div>

        <p className="text-xs text-[var(--fg-muted)]">
          v2.0.0 — PWA Local-first con IA
        </p>
      </div>
    </div>
  );
}
