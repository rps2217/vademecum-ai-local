import React from 'react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { WifiOff, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useNetworkStatus();
  const [showStatus, setShowStatus] = React.useState(false);

  React.useEffect(() => {
    if (!isOnline) {
      setShowStatus(true);
    } else {
      // Mostrar brevemente el estado "Online" antes de ocultar
      setShowStatus(true);
      const timer = setTimeout(() => setShowStatus(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  return (
    <AnimatePresence>
      {showStatus && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-2 rounded-full border shadow-lg backdrop-blur-md ${
            isOnline 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
              : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
          }`}
        >
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Conectado / Motor Local activo</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Sin conexión / Modo Local limitado</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
