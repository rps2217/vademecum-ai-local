/**
 * ClientProfileContext - Perfil del cliente atendido en el mostrador.
 *
 * Permite al farmacéutico activar un perfil (embarazada, lactante,
 * pediátrico, anciano, hipertenso, diabético) para que la app marque
 * visualmente qué ingredientes son seguros o requieren precaución para
 * ESE cliente. No persiste datos personales del cliente — solo el flag.
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { DbIngredient, SafetyStatus } from '@/db/schema';

export type ClientProfile =
  | 'ninguno'
  | 'embarazada'
  | 'lactante'
  | 'pediatrico'
  | 'anciano'
  | 'hipertenso'
  | 'diabetico';

export interface ClientProfileInfo {
  value: ClientProfile;
  label: string;
  short: string;
  description: string;
}

export const CLIENT_PROFILES: ClientProfileInfo[] = [
  { value: 'ninguno', label: 'Sin perfil', short: '—', description: 'Sin restricciones de cliente' },
  { value: 'embarazada', label: 'Embarazada', short: 'Embarazo', description: 'Resaltar ingredientes a evitar en embarazo' },
  { value: 'lactante', label: 'Lactante', short: 'Lactancia', description: 'Resaltar ingredientes a evitar en lactancia' },
  { value: 'pediatrico', label: 'Pediátrico', short: 'Pediatria', description: 'Resaltar ingredientes a evitar en pediatría' },
  { value: 'anciano', label: 'Anciano', short: 'Anciano', description: 'Precauciones en geriatría' },
  { value: 'hipertenso', label: 'Hipertenso', short: 'HTA', description: 'Precauciones en hipertensión' },
  { value: 'diabetico', label: 'Diabético', short: 'DM', description: 'Precauciones en diabetes' },
];

type SafetyVerdict = 'apto' | 'precaucion' | 'contraindicado';

interface ClientProfileContextValue {
  profile: ClientProfile;
  setProfile: (p: ClientProfile) => void;
  /** Evalúa un ingrediente frente al perfil activo. */
  evaluateSafety: (ingredient: DbIngredient) => SafetyVerdict | null;
}

const ClientProfileContext = createContext<ClientProfileContextValue | null>(null);

const STORAGE_KEY = 'vademecum-client-profile';

export function ClientProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<ClientProfile>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(STORAGE_KEY) as ClientProfile) || 'ninguno';
    }
    return 'ninguno';
  });

  const setProfile = (p: ClientProfile) => {
    setProfileState(p);
    localStorage.setItem(STORAGE_KEY, p);
  };

  // Reaccionar a cambios en otra pestaña
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setProfileState(e.newValue as ClientProfile);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const evaluateSafety = (ingredient: DbIngredient): SafetyVerdict | null => {
    if (profile === 'ninguno') return null;
    const seg = ingredient.seguridad;
    const statusFor: SafetyStatus | undefined =
      profile === 'embarazada' ? seg?.embarazo :
      profile === 'lactante' ? seg?.lactancia :
      profile === 'pediatrico' ? seg?.pediatria :
      undefined;

    if (statusFor === 'contraindicado') return 'contraindicado';
    if (statusFor === 'evitar') return 'precaucion';

    // Perfiles sin campo directo (anciano/hipertenso/diabetico): revisar interacciones
    if (profile === 'hipertenso' || profile === 'diabetico' || profile === 'anciano') {
      const inter = ingredient.interacciones ?? [];
      const term = profile === 'hipertenso' ? /hipertens|antihipertens|tens/i :
                   profile === 'diabetico' ? /diabet|insulin|glucos|hipogluc/i :
                   /anticoagul|diuret|cardiac/i;
      if (inter.some(i => term.test(i))) return 'precaucion';
    }
    return 'apto';
  };

  return (
    <ClientProfileContext.Provider value={{ profile, setProfile, evaluateSafety }}>
      {children}
    </ClientProfileContext.Provider>
  );
}

export function useClientProfile() {
  const ctx = useContext(ClientProfileContext);
  if (!ctx) throw new Error('useClientProfile must be used within ClientProfileProvider');
  return ctx;
}

/** Helper: clases visuales para un veredicto de seguridad. */
export function safetyVerdictStyle(verdict: SafetyVerdict | null): string | null {
  if (!verdict) return null;
  if (verdict === 'contraindicado') return 'ring-2 ring-red-500/60 bg-red-500/5';
  if (verdict === 'precaucion') return 'ring-2 ring-amber-500/60 bg-amber-500/5';
  return null;
}

export function safetyVerdictBadge(verdict: SafetyVerdict | null): { label: string; className: string } | null {
  if (!verdict) return null;
  if (verdict === 'contraindicado') return { label: 'Contraindicado', className: 'bg-red-500/15 text-red-700 dark:text-red-300 ring-1 ring-red-500/30' };
  if (verdict === 'precaucion') return { label: 'Precaución', className: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30' };
  return null;
}
