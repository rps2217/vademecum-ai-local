/**
 * Modal - Componente de modal/dialog
 * 
 * Modal responsivo con overlay.
 */

import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnOverlay = true,
  closeOnEscape = true,
  showCloseButton = true,
}: ModalProps) {
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && closeOnEscape) {
      onClose();
    }
  }, [onClose, closeOnEscape]);

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, handleEscape]);

  if (!open) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-4xl',
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-overlay animate-fade-in"
        onClick={closeOnOverlay ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={cn(
          'relative w-full bg-card rounded-xl shadow-xl',
          'animate-scale-in',
          'max-h-[90vh] overflow-hidden flex flex-col',
          sizes[size]
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-description' : undefined}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between p-6 border-b border-border">
            <div>
              {title && (
                <h2 id="modal-title" className="text-lg font-semibold text-foreground">
                  {title}
                </h2>
              )}
              {description && (
                <p id="modal-description" className="mt-1 text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="-mr-2 -mt-2"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

// Alert Dialog (simpler version)
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
          <Button variant="outline" onClick={onClose}>
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
