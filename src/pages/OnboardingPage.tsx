import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function OnboardingPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-8 text-center">
        <div>
          <h1 className="text-3xl font-bold">Bienvenido a Vademécum AI</h1>
          <p className="mt-2 text-[var(--fg-muted)]">
            Tu asistente inteligente para consultoras de farmacia.
          </p>
        </div>

        <div className="space-y-4 text-left">
          {[
            { icon: '🔍', title: 'Búsqueda inteligente', desc: 'Encuentra ingredientes al instante' },
            { icon: '🤝', title: 'Sinergias', desc: 'Descubre combinaciones beneficiosas' },
            { icon: '☁️', title: 'Backup cifrado', desc: 'Sincroniza tus datos de forma segura' },
            { icon: '📱', title: '100% offline', desc: 'Funciona sin conexión a internet' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex items-center gap-4 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
              <span className="text-3xl">{icon}</span>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-[var(--fg-muted)]">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <Button className="w-full" size="lg" onClick={() => navigate('/')}>
          Empezar
        </Button>
      </div>
    </div>
  );
}
