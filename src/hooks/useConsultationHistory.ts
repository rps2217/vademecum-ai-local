/**
 * useConsultationHistory - Historial de consultas de la sesión.
 *
 * Registra los términos/ingredientes consultados para que el farmacéutico
 * pueda volver atrás rápidamente. No persiste datos personales del cliente
 * — solo el término de búsqueda y el timestamp. Se guarda en sessionStorage
 * (se borra al cerrar la pestaña) por privacidad.
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'vademecum-consultation-history';
const MAX_ENTRIES = 12;

export interface HistoryEntry {
  id: string;
  query: string;
  timestamp: number;
}

function readHistory(): HistoryEntry[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeHistory(entries: HistoryEntry[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // sessionStorage puede fallar en modos privados; ignorar
  }
}

export function useConsultationHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>(() => readHistory());

  // Sincronizar con otros componentes
  useEffect(() => {
    const handler = () => setHistory(readHistory());
    window.addEventListener('vademecum-history-updated', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('vademecum-history-updated', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const addEntry = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return;
    setHistory(prev => {
      // Evitar duplicados consecutivos
      if (prev[0]?.query === trimmed) return prev;
      const entry: HistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        query: trimmed,
        timestamp: Date.now(),
      };
      const next = [entry, ...prev.filter(e => e.query !== trimmed)].slice(0, MAX_ENTRIES);
      writeHistory(next);
      window.dispatchEvent(new CustomEvent('vademecum-history-updated'));
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    writeHistory([]);
    window.dispatchEvent(new CustomEvent('vademecum-history-updated'));
    setHistory([]);
  }, []);

  return { history, addEntry, clearHistory };
}
