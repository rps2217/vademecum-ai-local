import { Settings } from 'lucide-react';
import { useTheme } from '@/app/providers/ThemeProvider';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-[var(--color-primary-500)]" />
        <h1 className="text-3xl font-bold text-[var(--fg)]">Configuración</h1>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6">
          <h2 className="text-lg font-semibold">Apariencia</h2>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">
            Personaliza el tema de la aplicación.
          </p>
          <div className="mt-4 flex gap-2">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <Button
                key={t}
                variant={theme === t ? 'primary' : 'outline'}
                onClick={() => setTheme(t)}
                className="capitalize"
              >
                {t === 'system' ? 'Sistema' : t === 'light' ? 'Claro' : 'Oscuro'}
              </Button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6">
          <h2 className="text-lg font-semibold">Sincronización</h2>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">
            Configura el backup cifrado en la nube.
          </p>
          <div className="mt-4">
            <Button variant="outline">Conectar Supabase</Button>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6">
          <h2 className="text-lg font-semibold">Datos</h2>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">
            Gestiona los datos locales y la base de conocimiento.
          </p>
          <div className="mt-4 flex gap-2">
            <Button variant="outline">Exportar datos</Button>
            <Button variant="outline">Importar datos</Button>
            <Button variant="outline">Restablecer base de conocimiento</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
