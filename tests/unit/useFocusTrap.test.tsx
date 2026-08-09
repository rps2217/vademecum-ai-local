import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { useRef } from 'react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

function FocusTrapTest({ active }: { active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, active);
  return (
    <div ref={ref} tabIndex={-1} data-testid="container">
      <button>Primero</button>
      <input type="text" placeholder="Medio" />
      <button>Último</button>
    </div>
  );
}

describe('useFocusTrap', () => {
  afterEach(() => cleanup());

  it('no hace nada cuando active=false', () => {
    render(<FocusTrapTest active={false} />);
    // El contenedor existe pero no captura el foco
    expect(screen.getByTestId('container')).toBeTruthy();
  });

  it('auto-enfoca el primer elemento enfocable cuando active=true', () => {
    render(<FocusTrapTest active={true} />);
    expect(document.activeElement).toBe(screen.getByText('Primero'));
  });

  it('cicla del último al primero con Tab', () => {
    render(<FocusTrapTest active={true} />);
    const last = screen.getByText('Último');
    last.focus();
    expect(document.activeElement).toBe(last);

    fireEvent.keyDown(last, { key: 'Tab' });
    expect(document.activeElement).toBe(screen.getByText('Primero'));
  });

  it('cicla del primero al último con Shift+Tab', () => {
    render(<FocusTrapTest active={true} />);
    const first = screen.getByText('Primero');
    expect(document.activeElement).toBe(first);

    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(screen.getByText('Último'));
  });

  it('no interfiere con teclas que no son Tab', () => {
    render(<FocusTrapTest active={true} />);
    const first = screen.getByText('Primero');
    first.focus();
    fireEvent.keyDown(first, { key: 'Enter' });
    expect(document.activeElement).toBe(first);
  });
});
