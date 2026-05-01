import { Product } from '../../../core/types';

export const printProductTicket = (product: Product) => {
  const ticketContent = `
    <html>
      <head>
        <title>Imprimir - ${product.nombre_comercial}</title>
        <style>
          @media print {
            body { width: 80mm; font-family: monospace; font-size: 12px; line-height: 1.4; padding: 5px; color: #000; }
            h3 { margin: 0 0 10px 0; font-size: 18px; text-transform: uppercase; border-bottom: 3px solid #000; padding-bottom: 5px; }
            .posologia-content { font-size: 16px; font-weight: bold; margin: 10px 0; }
            .section-title { font-weight: bold; text-decoration: underline; margin-top: 15px; font-size: 14px; }
            .footer { margin-top: 25px; border-top: 1px dashed #000; padding-top: 10px; font-size: 10px; text-align: center; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h3>${product.nombre_comercial}</h3>
        </div>
        
        <div class="section-title">POSOLOGÍA / MODO DE USO:</div>
        <p class="posologia-content">${product.posologia || 'Consulte con su consultor técnico.'}</p>

        <div class="footer">
          Vademécum Profesional - Consultoría Técnica<br/>
          ${new Date().toLocaleString()}
        </div>
      </body>
    </html>
  `;
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(ticketContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }
};
