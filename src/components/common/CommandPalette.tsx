import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { Search, Package, Network, FileText, Settings, Shield } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const searchItems = [
  { icon: Search, label: 'Buscar ingredientes', path: '/' },
  { icon: Package, label: 'Ver productos', path: '/products' },
  { icon: Network, label: 'Ver sinergias', path: '/synergies' },
  { icon: FileText, label: 'Ver protocolos', path: '/protocols' },
  { icon: Shield, label: 'Panel de administración', path: '/admin' },
  { icon: Settings, label: 'Configuración', path: '/settings' },
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 animate-in fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/4 z-50 w-full max-w-lg -translate-x-1/2 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-xl animate-in fade-in zoom-in-95">
          <Command className="flex flex-col" shouldFilter={true}>
            <div className="flex items-center border-b border-[var(--border)] px-4">
              <Search className="h-5 w-5 text-[var(--fg-muted)]" />
              <Command.Input
                placeholder="Escribe un comando o busca..."
                className="flex-1 border-0 bg-transparent py-4 text-sm outline-none placeholder:text-[var(--fg-muted)]"
                autoFocus
              />
            </div>
            <Command.List className="max-h-80 overflow-y-auto p-2">
              <Command.Empty className="py-6 text-center text-sm text-[var(--fg-muted)]">
                No se encontraron resultados.
              </Command.Empty>
              <Command.Group heading="Navegación" className="text-xs font-semibold text-[var(--fg-muted)] px-2 py-1.5">
                {searchItems.map(({ icon: Icon, label, path }) => (
                  <Command.Item
                    key={path}
                    value={label}
                    onSelect={() => {
                      navigate(path);
                      onOpenChange(false);
                    }}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-[var(--color-neutral-100)] data-[selected=true]:bg-[var(--color-primary-100)]"
                  >
                    <Icon className="h-4 w-4 text-[var(--fg-muted)]" />
                    {label}
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
