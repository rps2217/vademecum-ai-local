/**
 * Modal - Componente de modal/dialog usando Radix UI
 */

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
};

export function Modal({ open, onClose, title, description, children, size = 'md' }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 animate-fade-in z-50" />
        <Dialog.Content className={cn(
          'fixed z-50 w-full rounded-xl bg-card p-6 shadow-xl',
          'animate-scale-in max-h-[90vh] overflow-y-auto focus:outline-none',
          sizes[size]
        )}>
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          <Dialog.Description className="sr-only">{description}</Dialog.Description>

          {(title || description) && (
            <div className="flex items-start justify-between mb-4">
              <div>
                {title && <h2 className="text-lg font-semibold">{title}</h2>}
                {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
              </div>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" className="-mr-2 -mt-2" aria-label="Cerrar">
                  <X className="w-4 h-4" aria-hidden="true" />
                </Button>
              </Dialog.Close>
            </div>
          )}

          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// Alert Dialog
interface AlertDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export function AlertDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  variant = 'info',
}: AlertDialogProps) {
  const buttonVariant = variant === 'danger' ? 'destructive' : variant === 'warning' ? 'secondary' : 'default';

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 animate-fade-in z-50" />
        <Dialog.Content className={cn(
          'fixed z-50 w-full max-w-sm rounded-xl bg-card p-6 shadow-xl',
          'animate-scale-in max-h-[90vh] overflow-y-auto focus:outline-none'
        )}>
          <Dialog.Title className="text-lg font-semibold mb-2">{title}</Dialog.Title>
          {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              {cancelLabel}
            </Button>
            <Button variant={buttonVariant} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
