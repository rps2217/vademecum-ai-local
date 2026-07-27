import { Search, Command, Moon, Sun, Bell } from 'lucide-react';
import { useTheme } from '@/app/providers/ThemeProvider';

interface TopBarProps {
  onOpenCommand: () => void;
}

export function TopBar({ onOpenCommand }: TopBarProps) {
  const { setTheme, resolved } = useTheme();

  return (
    <header className="flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--bg-elevated)] px-6">
      <button
        onClick={onOpenCommand}
        className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-sm text-[var(--fg-muted)] hover:border-[var(--color-primary-300)] transition-colors"
      >
        <Search className="h-4 w-4" />
        <span>Buscar...</span>
        <kbd className="ml-4 flex items-center gap-1 rounded bg-[var(--color-neutral-100)] px-1.5 py-0.5 text-xs font-mono">
          <Command className="h-3 w-3" />K
        </kbd>
      </button>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setTheme(resolved === 'dark' ? 'light' : 'dark')}
          className="rounded-lg p-2 hover:bg-[var(--color-neutral-100)] text-[var(--fg-muted)]"
          aria-label="Cambiar tema"
        >
          {resolved === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <button
          className="relative rounded-lg p-2 hover:bg-[var(--color-neutral-100)] text-[var(--fg-muted)]"
          aria-label="Notificaciones"
        >
          <Bell className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
