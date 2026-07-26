/**
 * AuthModal - Modal de autenticación accesible desde cualquier parte de la app
 */

import React, { useState, useEffect } from 'react';
import { UserAuth } from './UserAuth';
import { userProfileService } from '../../services/UserProfileService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform">
          <UserAuth onClose={onClose} />
        </div>
      </div>
    </div>
  );
};

// Hook para controlar el modal desde cualquier parte de la app
export function useAuthModal() {
  const [isOpen, setIsOpen] = useState(false);

  const openAuth = () => setIsOpen(true);
  const closeAuth = () => setIsOpen(false);

  return { isOpen, openAuth, closeAuth };
}
