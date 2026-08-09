import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HighlightText } from '@/ui/HighlightText';

describe('HighlightText', () => {
  it('renderiza el texto sin resaltar cuando no hay términos', () => {
    render(<HighlightText text="Planta sedante" terms={[]} />);
    expect(screen.getByText('Planta sedante')).toBeTruthy();
    expect(document.querySelector('mark')).toBeNull();
  });

  it('resalta términos encontrados con <mark>', () => {
    render(
      <HighlightText
        text="Modula los receptores GABA-A"
        terms={['GABA']}
      />
    );
    const mark = document.querySelector('mark');
    expect(mark).not.toBeNull();
    expect(mark?.textContent).toBe('GABA');
  });

  it('resalta múltiples ocurrencias', () => {
    const { container } = render(
      <HighlightText
        text="ansiedad y más ansiedad"
        terms={['ansiedad']}
      />
    );
    const marks = container.querySelectorAll('mark');
    expect(marks.length).toBe(2);
  });

  it('es case-insensitive', () => {
    render(
      <HighlightText
        text="ANSIEDAD y Ansiedad"
        terms={['ansiedad']}
      />
    );
    const marks = document.querySelectorAll('mark');
    expect(marks.length).toBe(2);
  });

  it('no resalta nada si el término no aparece', () => {
    render(
      <HighlightText
        text="Planta digestiva"
        terms={['insomnio']}
      />
    );
    expect(document.querySelector('mark')).toBeNull();
  });

  it('resalta múltiples términos diferentes', () => {
    const { container } = render(
      <HighlightText
        text="sedante y ansiolítico para ansiedad"
        terms={['ansiedad', 'sedante']}
      />
    );
    const marks = container.querySelectorAll('mark');
    expect(marks.length).toBe(2);
  });

  it('ignora términos de menos de 3 caracteres', () => {
    render(
      <HighlightText
        text="el de la y"
        terms={['el', 'de', 'la']}
      />
    );
    expect(document.querySelector('mark')).toBeNull();
  });

  it('maneja texto vacío', () => {
    render(<HighlightText text="" terms={['algo']} />);
    expect(document.querySelector('mark')).toBeNull();
  });
});
