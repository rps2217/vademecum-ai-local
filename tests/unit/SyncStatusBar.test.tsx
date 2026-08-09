import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { SyncStatusBar } from '@/components/sync/SyncStatusBar';

// En entorno de test, isSupabaseConfigured() es false → !isConfigured
// Este es el caso que arreglamos: el badge Online/Offline debe mostrarse.

describe('SyncStatusBar — sin Supabase configurado (uso local PWA)', () => {
  afterEach(() => cleanup());

  it('muestra el badge Online incluso cuando sync no está configurado', () => {
    render(<SyncStatusBar />);
    // navigator.onLine es true en jsdom por defecto
    expect(screen.getByText('Online')).toBeTruthy();
  });

  it('muestra "Sync local" como indicador de modo local', () => {
    render(<SyncStatusBar />);
    expect(screen.getByText('Sync local')).toBeTruthy();
  });

  it('no muestra "Sync no configurado" (mensaje anterior eliminado)', () => {
    render(<SyncStatusBar />);
    expect(screen.queryByText('Sync no configurado')).toBeNull();
  });

  it('muestra el badge Offline cuando navigator.onLine es false', () => {
    const original = navigator.onLine;
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true, writable: true });
    render(<SyncStatusBar />);
    expect(screen.getByText('Offline')).toBeTruthy();
    Object.defineProperty(navigator, 'onLine', { value: original, configurable: true, writable: true });
  });
});
