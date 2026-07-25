/**
 * Script para poblar la base de datos de Supabase con productos
 * Ejecutar después de iniciar el servidor: node scripts/insert_products.js
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

// Productos de Farmacias Knop
const PRODUCTS = [
  {
    sku: 'KNOP-B12-01',
    nombre_comercial: 'Vitamina B12 Knop 1000mcg',
    descripcion: 'Suplemento alimenticio de Vitamina B12. Producto con certificación vegana y libre de gluten. Ideal para personas con dieta vegetariana o vegana.',
    principios_activos: ['Vitamina B12', 'Cianocobalamina'],
    categoria_principal: 'vitaminas',
    precio: 8500,
    marca: 'Knop'
  },
  {
    sku: 'KNOP-D3-01',
    nombre_comercial: 'Vitamina D3 + Calcio Knop',
    descripcion: 'Suplemento de vitamina D3 y calcio para fortalecer huesos y dientes. Ideal para prevenir osteoporosis.',
    principios_activos: ['Vitamina D3', 'Calcio'],
    categoria_principal: 'vitaminas',
    precio: 12500,
    marca: 'Knop'
  },
  {
    sku: 'KNOP-MAG-01',
    nombre_comercial: 'Magnesio Quelato Knop 400mg',
    descripcion: 'Suplemento de magnesio en forma de quelato para mejor absorción. Contribuye a la función muscular y nerviosa.',
    principios_activos: ['Magnesio'],
    categoria_principal: 'minerales',
    precio: 9800,
    marca: 'Knop'
  },
  {
    sku: 'KNOP-ZINC-01',
    nombre_comercial: 'Zinc Quelato Knop 30mg',
    descripcion: 'Suplemento de zinc en forma de quelato para fortalecer el sistema inmune.',
    principios_activos: ['Zinc'],
    categoria_principal: 'minerales',
    precio: 7800,
    marca: 'Knop'
  },
  {
    sku: 'KNOP-OMEGA-01',
    nombre_comercial: 'Omega 3 Premium Knop',
    descripcion: 'Suplemento de ácidos grasos omega-3 EPA y DHA de aceite de pescado. Salud cardiovascular.',
    principios_activos: ['Omega-3', 'EPA', 'DHA'],
    categoria_principal: 'acidos_grasos',
    precio: 15900,
    marca: 'Knop'
  },
  {
    sku: 'KNOP-C-ZINC-01',
    nombre_comercial: 'Vitamina C + Zinc Knop',
    descripcion: 'Combinación sinérgica de vitamina C y zinc para refuerzo inmune.',
    principios_activos: ['Vitamina C', 'Zinc'],
    categoria_principal: 'vitaminas',
    precio: 8900,
    marca: 'Knop'
  },
  {
    sku: 'KNOP-PROBIO-01',
    nombre_comercial: 'Probióticos 10 Knop',
    descripcion: 'Suplemento con 10 cepas de probióticos para salud digestiva.',
    principios_activos: ['Probióticos', 'Lactobacillus', 'Bifidobacterium'],
    categoria_principal: 'probióticos',
    precio: 18500,
    marca: 'Knop'
  },
  {
    sku: 'KNOP-CURC-01',
    nombre_comercial: 'Curcuma Plus Knop',
    descripcion: 'Suplemento de cúrcuma con pimienta negra para mejor absorción. Antiinflamatorio natural.',
    principios_activos: ['Cúrcuma', 'Curcumina'],
    categoria_principal: 'fitoterapia',
    precio: 11200,
    marca: 'Knop'
  },
  {
    sku: 'KNOP-MELAT-01',
    nombre_comercial: 'Melatonina 3mg Knop',
    descripcion: 'Suplemento de melatonina para regulación del sueño.',
    principios_activos: ['Melatonina'],
    categoria_principal: 'fitoterapia',
    precio: 6500,
    marca: 'Knop'
  },
  {
    sku: 'KNOP-HIERRO-01',
    nombre_comercial: 'Hierro Quelato Knop',
    descripcion: 'Suplemento de hierro en forma de quelato para mejor tolerancia.',
    principios_activos: ['Hierro'],
    categoria_principal: 'minerales',
    precio: 7200,
    marca: 'Knop'
  },
  {
    sku: 'KNOP-BCOMP-01',
    nombre_comercial: 'Complejo B Completo Knop',
    descripcion: 'Complejo de vitaminas del grupo B para metabolismo energético.',
    principios_activos: ['Vitamina B1', 'Vitamina B6', 'Vitamina B12'],
    categoria_principal: 'vitaminas',
    precio: 9500,
    marca: 'Knop'
  },
  {
    sku: 'KNOP-CAQ10-01',
    nombre_comercial: 'CoQ10 100mg Knop',
    descripcion: 'Coenzima Q10 para energía celular y salud cardiovascular.',
    principios_activos: ['Coenzima Q10'],
    categoria_principal: 'vitaminas',
    precio: 22000,
    marca: 'Knop'
  },
  {
    sku: 'KNOP-ASHW-01',
    nombre_comercial: 'Ashwagandha 500mg Knop',
    descripcion: 'Suplemento de ashwagandha para manejo del estrés.',
    principios_activos: ['Ashwagandha'],
    categoria_principal: 'fitoterapia',
    precio: 9800,
    marca: 'Knop'
  },
  {
    sku: 'KNOP-GINK-01',
    nombre_comercial: 'Ginkgo Biloba 80mg Knop',
    descripcion: 'Suplemento de ginkgo para función cognitiva y memoria.',
    principios_activos: ['Ginkgo Biloba'],
    categoria_principal: 'fitoterapia',
    precio: 8500,
    marca: 'Knop'
  },
  {
    sku: 'KNOP-COLAG-01',
    nombre_comercial: 'Colágeno Hidrolizado Knop',
    descripcion: 'Colágeno para salud articular y de la piel.',
    principios_activos: ['Colágeno'],
    categoria_principal: 'vitaminas',
    precio: 18000,
    marca: 'Knop'
  },
  {
    sku: 'KNOP-VITD-01',
    nombre_comercial: 'Vitamina D3 2000 UI Knop',
    descripcion: 'Vitamina D3 para salud ósea e inmune.',
    principios_activos: ['Vitamina D3'],
    categoria_principal: 'vitaminas',
    precio: 6500,
    marca: 'Knop'
  },
  {
    sku: 'KNOP-CALMAG-01',
    nombre_comercial: 'Calcio + Magnesio Knop',
    descripcion: 'Combinación de calcio y magnesio para huesos y músculos.',
    principios_activos: ['Calcio', 'Magnesio'],
    categoria_principal: 'minerales',
    precio: 8900,
    marca: 'Knop'
  },
  {
    sku: 'KNOP-SELEN-01',
    nombre_comercial: 'Selenio 200mcg Knop',
    descripcion: 'Suplemento de selenio con propiedades antioxidantes.',
    principios_activos: ['Selenio'],
    categoria_principal: 'minerales',
    precio: 5500,
    marca: 'Knop'
  },
  {
    sku: 'KNOP-FIBRA-01',
    nombre_comercial: 'Fibra Soluble Knop',
    descripcion: 'Suplemento de fibra soluble para salud digestiva.',
    principios_activos: ['Fibra'],
    categoria_principal: 'fitoterapia',
    precio: 7500,
    marca: 'Knop'
  },
  {
    sku: 'KNOP-RESV-01',
    nombre_comercial: 'Resveratrol 250mg Knop',
    descripcion: 'Antioxidante natural del vino tinto para longevidad.',
    principios_activos: ['Resveratrol'],
    categoria_principal: 'fitoterapia',
    precio: 12500,
    marca: 'Knop'
  }
];

async function insertProducts() {
  console.log('🚀 Insertando productos en la base de datos...\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const product of PRODUCTS) {
    try {
      const response = await fetch(`${BASE_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(product)
      });
      
      if (response.ok) {
        successCount++;
        console.log(`✅ ${product.sku} - ${product.nombre_comercial}`);
      } else {
        errorCount++;
        console.log(`❌ Error inserting ${product.sku}: ${response.status}`);
      }
    } catch (error) {
      errorCount++;
      console.log(`❌ Error: ${product.sku} - ${error.message}`);
    }
    
    // Pequeña pausa entre inserciones
    await new Promise(r => setTimeout(r, 100));
  }
  
  console.log('\n========================================');
  console.log(`📊 Resumen:`);
  console.log(`   ✅ Insertados: ${successCount}`);
  console.log(`   ❌ Errores: ${errorCount}`);
  console.log(`   📦 Total: ${PRODUCTS.length}`);
  console.log('========================================\n');
  
  if (successCount > 0) {
    console.log('🎉 ¡Productos insertados exitosamente!');
    console.log('   Refresca el dashboard para ver los datos.');
  }
}

insertProducts();
