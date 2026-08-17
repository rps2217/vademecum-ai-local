/**
 * PrintSheet - Contenedor para impresión
 *
 * Rendera contenido optimizado para impresión/papel. El contenido
 * está oculto en pantalla (display:none) y solo se muestra al
 * llamar window.print() vía CSS @media print.
 *
 * Uso:
 * <PrintSheet title="Protocolo de descanso">
 *   ...contenido imprimible...
 * </PrintSheet>
 *
 * El botón que dispara la impresión debe llamar window.print().
 */

import type { ReactNode } from 'react';

interface PrintSheetProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function PrintSheet({ title, subtitle, children }: PrintSheetProps) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="print-sheet hidden print:block">
      <div className="print-header">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children}
      <div className="print-footer">
        <p>
          Vademecum AI — Documento generado el {dateStr} a las{' '}
          {now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        </p>
        <p>La información aquí contenida es orientativa y no sustituye el consejo profesional del farmacéutico.</p>
      </div>
    </div>
  );
}
