/**
 * Script para poblar la base de datos de Supabase directamente
 * Usa la API REST de Supabase con la Anon Key
 * 
 * Uso: node scripts/insert_supabase.js
 */

// Credenciales de Supabase (estas son seguras de compartir - son la Anon Key pública)
const SUPABASE_URL = 'https://pspxqzwxulgmzarlqwtt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzcHhxend4dWxnbXphcmxxd3R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1NzQ1ODQsImV4cCI6MjA5MjE1MDU4NH0.5P_XIDqdiuxf4IP8Jxah81ZJTiln8MnBkX9_sZgubMU';

// Productos a insertar
const PRODUCTS = [
  {
    sku: 'KNOP-B12-01',
    nombre_comercial: 'Vitamina B12 Knop 1000mcg',
    descripcion: 'Suplemento alimenticio de Vitamina B12. Producto con certificación vegana y libre de gluten.',
    principios_activos: ['Vitamina B12', 'Cianocobalamina'],
    categoria_principal: 'vitaminas',
    precio: 8500,
    marca: 'Knop',
    data: { tipo: 'suplemento', unidad: 'comprimidos', cantidad: 30 }
  },
  {
    sku: 'KNOP-D3-01',
    nombre_comercial: 'Vitamina D3 + Calcio Knop',
    descripcion: 'Suplemento de vitamina D3 y calcio para fortalecer huesos y dientes.',
    principios_activos: ['Vitamina D3', 'Calcio'],
    categoria_principal: 'vitaminas',
    precio: 12500,
    marca: 'Knop',
    data: { tipo: 'suplemento', unidad: 'comprimidos', cantidad: 60 }
  },
  {
    sku: 'KNOP-MAG-01',
    nombre_comercial: 'Magnesio Quelato Knop 400mg',
    descripcion: 'Suplemento de magnesio en forma de quelato para mejor absorción.',
    principios_activos: ['Magnesio'],
    categoria_principal: 'minerales',
    precio: 9800,
    marca: 'Knop',
    data: { tipo: 'suplemento', unidad: 'cápsulas', cantidad: 30 }
  },
  {
    sku: 'KNOP-ZINC-01',
    nombre_comercial: 'Zinc Quelato Knop 30mg',
    descripcion: 'Suplemento de zinc en forma de quelato para fortalecer el sistema inmune.',
    principios_activos: ['Zinc'],
    categoria_principal: 'minerales',
    precio: 7800,
    marca: 'Knop',
    data: { tipo: 'suplemento', unidad: 'cápsulas', cantidad: 30 }
  },
  {
    sku: 'KNOP-OMEGA-01',
    nombre_comercial: 'Omega 3 Premium Knop',
    descripcion: 'Suplemento de ácidos grasos omega-3 EPA y DHA de aceite de pescado.',
    principios_activos: ['Omega-3', 'EPA', 'DHA'],
    categoria_principal: 'acidos_grasos',
    precio: 15900,
    marca: 'Knop',
    data: { tipo: 'suplemento', unidad: 'cápsulas', cantidad: 60 }
  },
  {
    sku: 'KNOP-C-ZINC-01',
    nombre_comercial: 'Vitamina C + Zinc Knop',
    descripcion: 'Combinación sinérgica de vitamina C y zinc para refuerzo inmune.',
    principios_activos: ['Vitamina C', 'Zinc'],
    categoria_principal: 'vitaminas',
    precio: 8900,
    marca: 'Knop',
    data: { tipo: 'suplemento', unidad: 'comprimidos efervescentes', cantidad: 20 }
  },
  {
    sku: 'KNOP-PROBIO-01',
    nombre_comercial: 'Probióticos 10 Knop',
    descripcion: 'Suplemento con 10 cepas de probióticos para salud digestiva.',
    principios_activos: ['Probióticos', 'Lactobacillus', 'Bifidobacterium'],
    categoria_principal: 'probióticos',
    precio: 18500,
    marca: 'Knop',
    data: { tipo: 'suplemento', unidad: 'cápsulas', cantidad: 30 }
  },
  {
    sku: 'KNOP-CURC-01',
    nombre_comercial: 'Curcuma Plus Knop',
    descripcion: 'Suplemento de cúrcuma con pimienta negra para mejor absorción.',
    principios_activos: ['Cúrcuma', 'Curcumina'],
    categoria_principal: 'fitoterapia',
    precio: 11200,
    marca: 'Knop',
    data: { tipo: 'suplemento', unidad: 'cápsulas', cantidad: 60 }
  },
  {
    sku: 'KNOP-MELAT-01',
    nombre_comercial: 'Melatonina 3mg Knop',
    descripcion: 'Suplemento de melatonina para regulación del sueño.',
    principios_activos: ['Melatonina'],
    categoria_principal: 'fitoterapia',
    precio: 6500,
    marca: 'Knop',
    data: { tipo: 'suplemento', unidad: 'comprimidos', cantidad: 30 }
  },
  {
    sku: 'KNOP-HIERRO-01',
    nombre_comercial: 'Hierro Quelato Knop',
    descripcion: 'Suplemento de hierro en forma de quelato para mejor tolerancia.',
    principios_activos: ['Hierro'],
    categoria_principal: 'minerales',
    precio: 7200,
    marca: 'Knop',
    data: { tipo: 'suplemento', unidad: 'cápsulas', cantidad: 30 }
  },
  {
    sku: 'KNOP-BCOMP-01',
    nombre_comercial: 'Complejo B Completo Knop',
    descripcion: 'Complejo de vitaminas del grupo B para metabolismo energético.',
    principios_activos: ['Vitamina B1', 'Vitamina B6', 'Vitamina B12', 'B9', 'B5'],
    categoria_principal: 'vitaminas',
    precio: 9500,
    marca: 'Knop',
    data: { tipo: 'suplemento', unidad: 'cápsulas', cantidad: 30 }
  },
  {
    sku: 'KNOP-CAQ10-01',
    nombre_comercial: 'CoQ10 100mg Knop',
    descripcion: 'Coenzima Q10 para energía celular y salud cardiovascular.',
    principios_activos: ['Coenzima Q10'],
    categoria_principal: 'vitaminas',
    precio: 22000,
    marca: 'Knop',
    data: { tipo: 'suplemento', unidad: 'cápsulas', cantidad: 30 }
  },
  {
    sku: 'KNOP-ASHW-01',
    nombre_comercial: 'Ashwagandha 500mg Knop',
    descripcion: 'Suplemento de ashwagandha para manejo del estrés.',
    principios_activos: ['Ashwagandha'],
    categoria_principal: 'fitoterapia',
    precio: 9800,
    marca: 'Knop',
    data: { tipo: 'suplemento', unidad: 'cápsulas', cantidad: 60 }
  },
  {
    sku: 'KNOP-GINK-01',
    nombre_comercial: 'Ginkgo Biloba 80mg Knop',
    descripcion: 'Suplemento de ginkgo para función cognitiva y memoria.',
    principios_activos: ['Ginkgo Biloba'],
    categoria_principal: 'fitoterapia',
    precio: 8500,
    marca: 'Knop',
    data: { tipo: 'suplemento', unidad: 'comprimidos', cantidad: 30 }
  },
  {
    sku: 'KNOP-COLAG-01',
    nombre_comercial: 'Colágeno Hidrolizado Knop',
    descripcion: 'Colágeno para salud articular y de la piel.',
    principios_activos: ['Colágeno'],
    categoria_principal: 'vitaminas',
    precio: 18000,
    marca: 'Knop',
    data: { tipo: 'suplemento', unidad: 'sobres', cantidad: 30 }
  },
  {
    sku: 'KNOP-VITD-01',
    nombre_comercial: 'Vitamina D3 2000 UI Knop',
    descripcion: 'Vitamina D3 para salud ósea e inmune.',
    principios_activos: ['Vitamina D3'],
    categoria_principal: 'vitaminas',
    precio: 6500,
    marca: 'Knop',
    data: { tipo: 'suplemento', unidad: 'cápsulas', cantidad: 30 }
  },
  {
    sku: 'KNOP-CALMAG-01',
    nombre_comercial: 'Calcio + Magnesio Knop',
    descripcion: 'Combinación de calcio y magnesio para huesos y músculos.',
    principios_activos: ['Calcio', 'Magnesio'],
    categoria_principal: 'minerales',
    precio: 8900,
    marca: 'Knop',
    data: { tipo: 'suplemento', unidad: 'comprimidos', cantidad: 60 }
  },
  {
    sku: 'KNOP-SELEN-01',
    nombre_comercial: 'Selenio 200mcg Knop',
    descripcion: 'Suplemento de selenio con propiedades antioxidantes.',
    principios_activos: ['Selenio'],
    categoria_principal: 'minerales',
    precio: 5500,
    marca: 'Knop',
    data: { tipo: 'suplemento', unidad: 'cápsulas', cantidad: 30 }
  },
  {
    sku: 'KNOP-FIBRA-01',
    nombre_comercial: 'Fibra Soluble Knop',
    descripcion: 'Suplemento de fibra soluble para salud digestiva.',
    principios_activos: ['Fibra'],
    categoria_principal: 'fitoterapia',
    precio: 7500,
    marca: 'Knop',
    data: { tipo: 'suplemento', unidad: 'sobres', cantidad: 20 }
  },
  {
    sku: 'KNOP-RESV-01',
    nombre_comercial: 'Resveratrol 250mg Knop',
    descripcion: 'Antioxidante natural del vino tinto para longevidad.',
    principios_activos: ['Resveratrol'],
    categoria_principal: 'fitoterapia',
    precio: 12500,
    marca: 'Knop',
    data: { tipo: 'suplemento', unidad: 'cápsulas', cantidad: 30 }
  }
];

// Función para insertar un producto usando la API de Supabase
async function insertProduct(product) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify({
      sku: product.sku,
      nombre_comercial: product.nombre_comercial,
      data: product,
      last_updated: new Date().toISOString()
    })
  });
  
  return response;
}

// Función principal
async function main() {
  console.log('🚀 Insertando productos en Supabase...\n');
  console.log(`📡 Conectando a: ${SUPABASE_URL}\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const product of PRODUCTS) {
    try {
      const response = await insertProduct(product);
      
      if (response.ok || response.status === 201) {
        successCount++;
        console.log(`✅ ${product.sku} - ${product.nombre_comercial}`);
      } else {
        errorCount++;
        const errorText = await response.text();
        console.log(`❌ ${product.sku}: ${response.status} - ${errorText.substring(0, 100)}`);
      }
    } catch (error) {
      errorCount++;
      console.log(`❌ ${product.sku}: Error - ${error.message}`);
    }
    
    // Pausa entre requests
    await new Promise(r => setTimeout(r, 200));
  }
  
  console.log('\n========================================');
  console.log('📊 Resumen:');
  console.log(`   ✅ Insertados: ${successCount}`);
  console.log(`   ❌ Errores: ${errorCount}`);
  console.log(`   📦 Total: ${PRODUCTS.length}`);
  console.log('========================================\n');
  
  if (successCount > 0) {
    console.log('🎉 ¡Productos insertados exitosamente!');
    console.log('   Refresca el dashboard para ver los datos.');
  }
  
  if (errorCount > 0) {
    console.log('⚠️  Algunos productos no se insertaron.');
    console.log('   Verifica que la tabla "products" exista en Supabase.');
  }
}

main().catch(console.error);
