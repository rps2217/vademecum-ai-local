/**
 * Modal - Componente de modal/dialog usando Radix UI
 * 
 * Modal responsivo con overlay y animaciones.
 */

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface ModalProps {
  open: boolean;
  onClose: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  className?: string;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  className,
}: ModalProps) {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-4xl',
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 animate-fade-in z-50" />
        <Dialog.Content
          className={cn(
            'fixed z-50 w-full max-h-[90vh] overflow-y-auto',
            'bg-card rounded-xl shadow-2xl p-6',
            'animate-scale-in',
            'focus:outline-none',
            sizes[size],
            className
          )}
        >
          <Dialog.Title className="sr-only">{title || 'Dialog'}</Dialog.Title>

          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-start justify-between mb-4">
              <div>
                {title && (
                  <h2 className="text-lg font-semibold text-foreground">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {description}
                  </p>
                )}
              </div>
              {showCloseButton && (
                <Dialog.Close asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="-mr-2 -mt-2"
                    aria-label="Cerrar"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </Dialog.Close>
              )}
            </div>
          )}

          {/* Content */}
          <div className="flex-1">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// Alert Dialog (simpler version)
interface AlertDialogProps {
  open: boolean;
  onClose: (open: boolean) => void;
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
  const buttonVariant = variant === 'danger' ? 'destructive' : variant === 'warning' ? 'secondary' : 'primary';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={() => onClose(false)}>
            {cancelLabel}
          </Button>
          <Button variant={buttonVariant} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {null}
    </Modal>
  );
}
