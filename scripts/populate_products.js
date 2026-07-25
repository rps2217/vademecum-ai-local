/**
 * Script para poblar la base de datos con productos de Farmacias Knop
 * Ejecutar con: node scripts/populate_products.js
 */

const https = require('https');

// URL base de Farmacias Knop
const BASE_URL = 'https://www.farmaciasknop.com';
const CATEGORIES = [
  'homeopatia',
  'fitoterapia',
  'vitaminas-y-suplementos',
  'salud-natural'
];

// Productos de ejemplo para poblar la base de datos
const SAMPLE_PRODUCTS = [
  {
    sku: 'KNOP-B12-01',
    nombre_comercial: 'Vitamina B12 Knop',
    descripcion: 'Suplemento alimenticio de Vitamina B12. Producto con certificación vegana y libre de gluten. Ideal para personas con dieta vegetariana o vegana.',
    principios_activos: ['Vitamina B12', 'Cianocobalamina'],
    categoria_principal: 'vitaminas',
    precio: 8500,
    marca: 'Knop',
    data: {
      nombre: 'Vitamina B12 Knop',
      descripcion: 'Suplemento alimenticio de Vitamina B12 1000mcg. Producto con certificación vegana y libre de gluten.',
      ingredientes: ['Vitamina B12 (Cianocobalamina) 1000mcg', 'Celulosa microcristalina', 'Estearato de magnesio'],
      mecanismo_accion: 'Cofactor esencial en la síntesis de ácidos nucleicos y hemoglobina',
      beneficios: ['Salud del sistema nervioso', 'Formación de glóbulos rojos', 'Metabolismo energético'],
      dosis_recomendada: '1 comprimido sublingual diario',
      contraindicaciones: ['Hipersensibilidad a la vitamina B12']
    }
  },
  {
    sku: 'KNOP-D3-01',
    nombre_comercial: 'Vitamina D3 + Calcio Knop',
    descripcion: 'Suplemento de vitamina D3 y calcio para fortalecer huesos y dientes. Ideal para prevenir osteoporosis.',
    principios_activos: ['Vitamina D3', 'Calcio'],
    categoria_principal: 'vitaminas',
    precio: 12500,
    marca: 'Knop',
    data: {
      nombre: 'Vitamina D3 + Calcio',
      descripcion: 'Combinación de Vitamina D3 (Colecalciferol) 1000 UI y Calcio 500mg para salud ósea.',
      ingredientes: ['Vitamina D3 (Colecalciferol) 1000 UI', 'Calcio (Carbonato) 500mg'],
      mecanismo_accion: 'Regula la absorción intestinal de calcio y fosfato',
      beneficios: ['Fortalecimiento óseo', 'Prevención de osteoporosis', 'Salud muscular'],
      dosis_recomendada: '1-2 comprimidos diarios con las comidas',
      contraindicaciones: ['Hipercalcemia', 'Insuficiencia renal']
    }
  },
  {
    sku: 'KNOP-MAG-01',
    nombre_comercial: 'Magnesio Quelato Knop',
    descripcion: 'Suplemento de magnesio en forma de quelato para mejor absorción. Contribuye a la función muscular y nerviosa.',
    principios_activos: ['Magnesio'],
    categoria_principal: 'minerales',
    precio: 9800,
    marca: 'Knop',
    data: {
      nombre: 'Magnesio Quelato Knop',
      descripcion: 'Magnesio Quelato 400mg de alta biodisponibilidad. Forma de quelato para mejor absorción intestinal.',
      ingredientes: ['Magnesio (Quelato) 400mg', 'Excipientes c.s.'],
      mecanismo_accion: 'Cofactor de más de 300 enzimas, esencial para síntesis de proteínas y ATP',
      beneficios: ['Función muscular normal', 'Reducción del cansancio', 'Equilibrio electrolítico'],
      dosis_recomendada: '1 cápsula al día antes de dormir',
      contraindicaciones: ['Insuficiencia renal grave']
    }
  },
  {
    sku: 'KNOP-ZINC-01',
    nombre_comercial: 'Zinc Quelato Knop',
    descripcion: 'Suplemento de zinc en forma de quelato para fortalecer el sistema inmune.',
    principios_activos: ['Zinc'],
    categoria_principal: 'minerales',
    precio: 7800,
    marca: 'Knop',
    data: {
      nombre: 'Zinc Quelato Knop',
      descripcion: 'Zinc Quelato 30mg de alta biodisponibilidad. Mineral esencial para el sistema inmune.',
      ingredientes: ['Zinc (Quelato) 30mg', 'Excipientes c.s.'],
      mecanismo_accion: 'Cofactor de metaloenzimas, esencial para función inmune y cicatrización',
      beneficios: ['Refuerzo del sistema inmune', 'Cicatrización de heridas', 'Salud de la piel'],
      dosis_recomendada: '1 cápsula al día',
      contraindicaciones: ['Hipersensibilidad al zinc']
    }
  },
  {
    sku: 'KNOP-OMEGA-01',
    nombre_comercial: 'Omega 3 Premium Knop',
    descripcion: 'Suplemento de ácidos grasos omega-3 EPA y DHA de aceite de pescado. Salud cardiovascular.',
    principios_activos: ['Omega-3', 'EPA', 'DHA'],
    categoria_principal: 'acidos_grasos',
    precio: 15900,
    marca: 'Knop',
    data: {
      nombre: 'Omega 3 Premium',
      descripcion: 'Aceite de pescado rico en EPA y DHA. 1000mg de omega-3 por cápsula.',
      ingredientes: ['Aceite de pescado 1000mg', 'EPA 180mg', 'DHA 120mg'],
      mecanismo_accion: 'Estructura de membranas celulares, precursor de eicosanoides antiinflamatorios',
      beneficios: ['Salud cardiovascular', 'Función cerebral', 'Reducción de triglicéridos'],
      dosis_recomendada: '2 cápsulas diarias con las comidas',
      contraindicaciones: ['Alergia al pescado', 'Anticoagulantes']
    }
  },
  {
    sku: 'KNOP-C-01',
    nombre_comercial: 'Vitamina C + Zinc Knop',
    descripcion: 'Combinación sinérgica de vitamina C y zinc para refuerzo inmune. Conocer más.',
    principios_activos: ['Vitamina C', 'Zinc'],
    categoria_principal: 'vitaminas',
    precio: 8900,
    marca: 'Knop',
    data: {
      nombre: 'Vitamina C + Zinc',
      descripcion: 'Combinación sinérgica de Vitamina C 500mg y Zinc 15mg para refuerzo del sistema inmune.',
      ingredientes: ['Vitamina C (Ácido ascórbico) 500mg', 'Zinc 15mg', 'Excipientes c.s.'],
      mecanismo_accion: 'Sinergia en función inmunológica: vitamina C como antioxidante, zinc para función celular inmune',
      beneficios: ['Refuerzo del sistema inmune', 'Antioxidante', 'Salud de la piel'],
      dosis_recomendada: '1 comprimido efervescente al día',
      contraindicaciones: ['Hipersensibilidad a los componentes']
    }
  },
  {
    sku: 'KNOP-PROBIO-01',
    nombre_comercial: 'Probióticos 10 Knop',
    descripcion: 'Suplemento con 10 cepas de probióticos para здоровье digestivo. Flora intestinal.',
    principios_activos: ['Probióticos', 'Lactobacillus', 'Bifidobacterium'],
    categoria_principal: 'probióticos',
    precio: 18500,
    marca: 'Knop',
    data: {
      nombre: 'Probióticos 10 Cepas',
      descripcion: 'Complejo de 10 cepas probióticas. 10 mil millones de UFC por cápsula.',
      ingredientes: ['Lactobacillus acidophilus', 'Bifidobacterium lactis', 'Lactobacillus rhamnosus', 'Y más'],
      mecanismo_accion: 'Restauración de la microbiota intestinal, competencia con patógenos',
      beneficios: ['Salud digestiva', 'Refuerzo inmune', 'Absorción de nutrientes'],
      dosis_recomendada: '1 cápsula al día en ayunas',
      contraindicaciones: ['Inmunocompromiso severo']
    }
  },
  {
    sku: 'KNOP-CURC-01',
    nombre_comercial: 'Curcuma Plus Knop',
    descripcion: 'Suplemento de cúrcuma con pimienta negra para mejor absorción. Antiinflamatorio natural.',
    principios_activos: ['Cúrcuma', 'Curcumina', 'Pimienta negra'],
    categoria_principal: 'fitoterapia',
    precio: 11200,
    marca: 'Knop',
    data: {
      nombre: 'Curcuma Plus',
      descripcion: 'Cúrcuma (Curcuma longa) 500mg con piperina para absorción. Antiinflamatorio natural.',
      ingredientes: ['Extracto de cúrcuma 500mg', 'Piperina 5mg'],
      mecanismo_accion: 'La piperina aumenta biodisponibilidad de curcumina. Efecto antiinflamatorio por inhibición de COX-2',
      beneficios: ['Antiinflamatorio natural', 'Salud articular', 'Antioxidante'],
      dosis_recomendada: '1 cápsula 2 veces al día con las comidas',
      contraindicaciones: ['Obstrucción biliar', 'Anticoagulantes']
    }
  },
  {
    sku: 'KNOP-MELAT-01',
    nombre_comercial: 'Melatonina 3mg Knop',
    descripcion: 'Suplemento de melatonina para regulación del sueño. Ayuda a conciliar el sueño naturalmente.',
    principios_activos: ['Melatonina'],
    categoria_principal: 'fitoterapia',
    precio: 6500,
    marca: 'Knop',
    data: {
      nombre: 'Melatonina 3mg',
      descripcion: 'Melatonina 3mg para regulación del ritmo circadiano y mejora de la calidad del sueño.',
      ingredientes: ['Melatonina 3mg', 'Excipientes c.s.'],
      mecanismo_accion: 'Hormona que regula el ciclo sueño-vigilia. Señal de oscuridad al cerebro.',
      beneficios: ['Conciliación del sueño', 'Jet lag', 'Regulación del ritmo circadiano'],
      dosis_recomendada: '1 comprimido 30 min antes de dormir',
      contraindicaciones: ['Embarazo', 'Lactancia', 'Enfermedades autoinmunes']
    }
  },
  {
    sku: 'KNOP-HIERRO-01',
    nombre_comercial: 'Hierro Quelato Knop',
    descripcion: 'Suplemento de hierro en forma de quelato para mejor tolerancia. Trata y previene anemia.',
    principios_activos: ['Hierro'],
    categoria_principal: 'minerales',
    precio: 7200,
    marca: 'Knop',
    data: {
      nombre: 'Hierro Quelato',
      descripcion: 'Hierro (Bisglicinato) 30mg de alta biodisponibilidad y mejor tolerancia gástrica.',
      ingredientes: ['Hierro (Bisglicinato) 30mg', 'Vitamina C 50mg', 'Excipientes c.s.'],
      mecanismo_accion: 'Componente esencial de hemoglobina. Transporte de oxígeno en sangre.',
      beneficios: ['Prevención de anemia', 'Energía y vitalidad', 'Función cognitiva'],
      dosis_recomendada: '1 cápsula al día con vitamina C',
      contraindicaciones: ['Hemocromatosis', 'Trasfusiones sanguineas frecuentes']
    }
  },
  {
    sku: 'KNOP-VITB-01',
    nombre_comercial: 'Complejo B Completo Knop',
    descripcion: 'Complejo de vitaminas del grupo B para metabolismo energético. 8 vitaminas esenciales.',
    principios_activos: ['Vitamina B1', 'Vitamina B2', 'Vitamina B3', 'Vitamina B5', 'Vitamina B6', 'Vitamina B7', 'Vitamina B9', 'Vitamina B12'],
    categoria_principal: 'vitaminas',
    precio: 9500,
    marca: 'Knop',
    data: {
      nombre: 'Complejo B Completo',
      descripcion: '8 vitaminas del grupo B en una sola cápsula. Esencial para metabolismo energético.',
      ingredientes: ['B1 10mg', 'B2 10mg', 'B3 40mg', 'B5 25mg', 'B6 10mg', 'B7 150mcg', 'B9 400mcg', 'B12 50mcg'],
      mecanismo_accion: 'Cofactores de enzimas en metabolismo de carbohidratos, proteínas y grasas',
      beneficios: ['Metabolismo energético', 'Función nerviosa', 'Salud de la piel'],
      dosis_recomendada: '1 cápsula al día con el desayuno',
      contraindicaciones: ['Hipersensibilidad a las vitaminas del grupo B']
    }
  },
  {
    sku: 'KNOP-COQ10-01',
    nombre_comercial: 'CoQ10 100mg Knop',
    descripcion: 'Coenzima Q10 para energía celular y salud cardiovascular. Antioxidante mitocondrial.',
    principios_activos: ['Coenzima Q10', 'Ubiquinona'],
    categoria_principal: 'vitaminas',
    precio: 22000,
    marca: 'Knop',
    data: {
      nombre: 'CoQ10 100mg',
      descripcion: 'Coenzima Q10 100mg. Antioxidante celular y esencial para producción de ATP.',
      ingredientes: ['CoQ10 (Ubiquinona) 100mg', 'Excipientes c.s.'],
      mecanismo_accion: 'Componente de la cadena respiratoria mitocondrial. Producción de ATP.',
      beneficios: ['Energía celular', 'Salud cardiovascular', 'Antioxidante'],
      dosis_recomendada: '1 cápsula al día con alguna comida grasa',
      contraindicaciones: ['Anticoagulantes (warfarina)']
    }
  }
];

// Productos adicionales para simular más datos
const MORE_PRODUCTS = [
  { sku: 'KNOP-ASHW-01', nombre: 'Ashwagandha 500mg', categoria: 'fitoterapia', precio: 9800 },
  { sku: 'KNOP-GINK-01', nombre: 'Ginkgo Biloba 80mg', categoria: 'fitoterapia', precio: 8500 },
  { sku: 'KNOP-SAW-PAL-01', nombre: 'Saw Palmetto 320mg', categoria: 'fitoterapia', precio: 11000 },
  { sku: 'KNOP-COLAG-01', nombre: 'Colágeno Hidrolizado 10g', categoria: 'vitaminas', precio: 18000 },
  { sku: 'KNOP-VITD-01', nombre: 'Vitamina D3 2000 UI', categoria: 'vitaminas', precio: 6500 },
  { sku: 'KNOP-CALCIO-01', nombre: 'Calcio + Magnesio', categoria: 'minerales', precio: 8900 },
  { sku: 'KNOP-SELENIO-01', nombre: 'Selenio 200mcg', categoria: 'minerales', precio: 5500 },
  { sku: 'KNOP-CROMO-01', nombre: 'Cromo 200mcg', categoria: 'minerales', precio: 6000 },
  { sku: 'KNOP-YOGURT-01', nombre: 'Probióticos Plus', categoria: 'probióticos', precio: 14500 },
  { sku: 'KNOP-FIBRA-01', nombre: 'Fibra soluble 30g', categoria: 'fitoterapia', precio: 7500 },
  { sku: 'KNOP-OLIVE-01', nombre: 'Extracto de Oliva', categoria: 'fitoterapia', precio: 9500 },
  { sku: 'KNOP-GRAPE-01', nombre: 'Resveratrol 250mg', categoria: 'fitoterapia', precio: 12500 },
];

// Crear productos adicionales
const ADDITIONAL_PRODUCTS = MORE_PRODUCTS.map(p => ({
  sku: p.sku,
  nombre_comercial: p.nombre + ' Knop',
  descripcion: `Suplemento de ${p.nombre.toLowerCase()}. Producto de alta calidad de Laboratorios Knop.`,
  principios_activos: [p.nombre.split(' ')[0]],
  categoria_principal: p.categoria,
  precio: p.precio,
  marca: 'Knop',
  data: {
    nombre: p.nombre + ' Knop',
    descripcion: `Suplemento alimenticio de ${p.nombre.toLowerCase()}.`,
    ingredientes: [p.nombre, 'Excipientes c.s.'],
    beneficios: ['Salud general', 'Bienestar'],
    dosis_recomendada: 'Según indicación médica'
  }
}));

// Combinar todos los productos
const ALL_PRODUCTS = [...SAMPLE_PRODUCTS, ...ADDITIONAL_PRODUCTS];

console.log('📦 Productos准备 para insertar:', ALL_PRODUCTS.length);
console.log('');

// Mostrar productos
ALL_PRODUCTS.forEach((p, i) => {
  console.log(`${i + 1}. ${p.sku} - ${p.nombre_comercial}`);
});

console.log('');
console.log('✅ Script preparado. Para ejecutar necesitas:');
console.log('1. Tener las credenciales de Supabase configuradas');
console.log('2. Ejecutar: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/populate_products.js');
console.log('');
console.log('Los productos se insertarán usando la API del servidor en http://localhost:3000');
console.log('Primero inicia el servidor con: npm run start');
