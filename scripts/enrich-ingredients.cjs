const fs = require('fs');
const path = require('path');

const files = [
  './src/db/seeders/data/fitoterapia.json',
  './src/db/seeders/data/homeopatia.json',
  './src/db/seeders/data/aceites.json',
  './src/db/seeders/data/vitaminas_minerales.json'
];

function generateBeneficioCliente(ing) {
  if (ing.beneficioCliente) return ing.beneficioCliente;

  const name = ing.nombre || ing.id;
  const indications = ing.indicaciones || [];
  const primaryInd = indications[0] || 'bienestar general';
  const desc = ing.descripcion || '';

  if (ing.categoria === 'homeopatia') {
    const dil = ing.dilucionRecomendada || '7CH - 9CH';
    return `Remedio homeopático tradicional para aliviar los síntomas de ${primaryInd}, ideal como tratamiento de apoyo sin efectos secundarios conocidos (${dil}).`;
  }

  if (ing.categoria === 'aceite_esencial' || ing.categoria === 'aceite') {
    return `Aceite esencial puro con propiedades para ${primaryInd}, adecuado para difusor de aromas o aplicación tópica diluida en aceite vehicular.`;
  }

  if (ing.categoria === 'vitamina' || ing.categoria === 'mineral') {
    return `Nutriente esencial que ayuda a mantener el equilibrio en caso de ${primaryInd}, reforzando la vitalidad y la salud del organismo.`;
  }

  if (ing.categoria === 'aminoacido') {
    return `Aminoácido clave para el apoyo metabólico en ${primaryInd}, optimizando la función celular y el rendimiento físico/mental.`;
  }

  if (ing.categoria === 'probiotico') {
    return `Cepa probiótica que favorece el equilibrio de la microbiota intestinal y refuerza las defensas naturales frente a ${primaryInd}.`;
  }

  // Default fitoterapia
  return `Extracto natural de ${name} con eficacia probada para calmar y mejorar los síntomas de ${primaryInd} de forma respetuosa con el organismo.`;
}

function generatePosologia(ing) {
  if (ing.posologia || ing.dilucionRecomendada) return ing.posologia || ing.dilucionRecomendada;

  if (ing.categoria === 'homeopatia') {
    return '5 gránulos 3 veces al día vía sublingual, espaciando las tomas según mejoría (4CH-9CH para síntomas locales/generales).';
  }

  if (ing.categoria === 'aceite_esencial' || ing.categoria === 'aceite') {
    return 'Difusión ambiental: 3-5 gotas en difusor. Tópico: 2-3 gotas diluidas en 10 ml de aceite vegetal portador (almendras/jojoba).';
  }

  if (ing.categoria === 'vitamina' || ing.categoria === 'mineral') {
    return '1 cápsula o comprimido al día preferentemente con las comidas junto con un vaso de agua.';
  }

  if (ing.categoria === 'probiotico') {
    return '1 cáp/sobre al día por la mañana en ayunas o antes de la comida principal con agua del tiempo.';
  }

  return '1 a 2 cápsulas o comprimidos al día (o 20-30 gotas de extracto fluido) repartidos antes de las principales comidas.';
}

let totalEnriched = 0;

for (const relPath of files) {
  const fullPath = path.join(__dirname, '..', relPath);
  const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  
  if (Array.isArray(data.ingredientes)) {
    data.ingredientes = data.ingredientes.map(ing => {
      const b = generateBeneficioCliente(ing);
      const p = generatePosologia(ing);
      totalEnriched++;
      return {
        ...ing,
        beneficioCliente: ing.beneficioCliente || b,
        posologia: ing.posologia || p
      };
    });
    fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Enriched ${relPath}`);
  }
}

console.log(`Total ingredients enriched with beneficioCliente & posologia: ${totalEnriched}`);
