/**
 * AdminGate — Gate de PIN para /admin
 *
 * Si hay un PIN de admin configurado (localStorage), muestra un modal
 * de PIN antes de dejar pasar a AdminPage. Si no hay PIN configurado,
 * deja pasar sin gate (compatibilidad hacia atrás).
 *
 * Hallazgo 5.3 de la bitácora.
 */

import { useState, useCallback } from 'react';
import { Modal } from '@/ui/Modal';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { Shield, Loader2 } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from 'sonner';

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { hasAdminPin, isAdminUnlocked, unlockAdmin } = useAdminAuth();
  const [pin, setPin] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleUnlock = useCallback(async () => {
    setVerifying(true);
    try {
      const ok = await unlockAdmin(pin);
      if (!ok) {
        toast.error('PIN incorrecto');
        setPin('');
      }
    } finally {
      setVerifying(false);
    }
  }, [pin, unlockAdmin]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleUnlock();
    },
    [handleUnlock],
  );

  if (!hasAdminPin || isAdminUnlocked) {
    return <>{children}</>;
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Modal
        open={true}
        onClose={() => {}}
        title="Acceso de administrador"
        description="Introduce el PIN de admin para editar la base de conocimiento"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            <Shield className="w-10 h-10 text-primary" aria-hidden="true" />
          </div>
          <Input
            type="password"
            inputMode="numeric"
            placeholder="PIN de admin"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            aria-label="PIN de admin"
          />
          <Button
            className="w-full"
            onClick={handleUnlock}
            disabled={verifying || pin.length < 4}
          >
            {verifying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                Verificando...
              </>
            ) : (
              'Desbloquear'
            )}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
