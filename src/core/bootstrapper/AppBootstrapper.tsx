import React, { useEffect, useState } from 'react';
import { useHardwareDetection } from '../../hooks/useHardwareDetection';
import { logger } from '../../services/LoggerService';

import { taskProcessorService } from '../../services/TaskProcessorService';
import { automationTriggerService } from '../../services/AutomationTriggerService';
import { seedDrugData } from '../../services/drugInteractionService';
import { dataService } from '../../services/DataService';
import { useStore } from '../../store/useStore';
import { drugFamiliesCollection, productsCollection } from '../../database';
import { Product } from '../types';

// Productos de ejemplo para demostración
const SAMPLE_PRODUCTS: Product[] = [
  {
    sku: 'KNOP-B12-01',
    nombre_comercial: 'Vitamina B12 Knop 1000mcg',
    descripcion: 'Suplemento alimenticio de Vitamina B12. Producto con certificación vegana y libre de gluten.',
    principios_activos: ['Vitamina B12', 'Cianocobalamina'],
    categoria_principal: 'vitaminas',
    tags_ia: ['vitamina B12', 'vegan', 'gluten-free'],
    indicaciones: ['Deficiencia de vitamina B12', 'Anemia perniciosa', 'Vegetarianos'],
    advertencias: 'Consulte a su médico si está embarazada o amamantando.',
    last_updated: Date.now(),
  },
  {
    sku: 'KNOP-D3-01',
    nombre_comercial: 'Vitamina D3 + Calcio Knop',
    descripcion: 'Suplemento de vitamina D3 y calcio para fortalecer huesos y dientes.',
    principios_activos: ['Vitamina D3', 'Calcio'],
    categoria_principal: 'vitaminas',
    tags_ia: ['vitamina D', 'calcio', 'huesos'],
    indicaciones: ['Osteoporosis', 'Deficiencia de calcio', 'Menopausia'],
    advertencias: 'No exceder la dosis recomendada.',
    last_updated: Date.now(),
  },
  {
    sku: 'KNOP-MAG-01',
    nombre_comercial: 'Magnesio Quelato Knop 400mg',
    descripcion: 'Suplemento de magnesio en forma de quelato para mejor absorción.',
    principios_activos: ['Magnesio'],
    categoria_principal: 'minerales',
    tags_ia: ['magnesio', 'quelato', 'músculos'],
    indicaciones: ['Calambres musculares', 'Estrés', 'Insomnio'],
    advertencias: 'Puede causar molestias digestivas en algunas personas.',
    last_updated: Date.now(),
  },
  {
    sku: 'KNOP-ZINC-01',
    nombre_comercial: 'Zinc Quelato Knop 30mg',
    descripcion: 'Suplemento de zinc en forma de quelato para fortalecer el sistema inmune.',
    principios_activos: ['Zinc'],
    categoria_principal: 'minerales',
    tags_ia: ['zinc', 'inmune', 'antioxidante'],
    indicaciones: ['Resfriados', 'Infecciones recurrentes', 'Salud de la piel'],
    advertencias: 'Tomar con alimentos para mejor absorción.',
    last_updated: Date.now(),
  },
  {
    sku: 'KNOP-OMEGA-01',
    nombre_comercial: 'Omega 3 Premium Knop',
    descripcion: 'Suplemento de ácidos grasos omega-3 EPA y DHA de aceite de pescado.',
    principios_activos: ['Omega-3', 'EPA', 'DHA'],
    categoria_principal: 'acidos_grasos',
    tags_ia: ['omega-3', 'cardiovascular', 'EPA', 'DHA'],
    indicaciones: ['Salud cardiovascular', 'Función cerebral', 'Triglicéridos altos'],
    advertencias: 'Personas alérgicas al pescado deben consultar antes de usar.',
    last_updated: Date.now(),
  },
  {
    sku: 'KNOP-CURC-01',
    nombre_comercial: 'Curcuma Plus Knop',
    descripcion: 'Suplemento de cúrcuma con pimienta negra para mejor absorción.',
    principios_activos: ['Cúrcuma', 'Curcumina', 'Pimienta negra'],
    categoria_principal: 'fitoterapia',
    tags_ia: ['cúrcuma', 'antiinflamatorio', 'articular'],
    indicaciones: ['Inflamación articular', 'Dolores musculares', 'Digestión'],
    advertencias: 'Consultar si toma anticoagulantes.',
    last_updated: Date.now(),
  },
  {
    sku: 'KNOP-PROBIO-01',
    nombre_comercial: 'Probióticos 10 Knop',
    descripcion: 'Suplemento con 10 cepas de probióticos para salud digestiva.',
    principios_activos: ['Probióticos', 'Lactobacillus', 'Bifidobacterium'],
    categoria_principal: 'probióticos',
    tags_ia: ['probióticos', 'flora intestinal', 'digestión'],
    indicaciones: ['Disbiosis', 'Antibióticos', 'Salud digestiva'],
    advertencias: 'Mantener refrigerado para máxima potencia.',
    last_updated: Date.now(),
  },
  {
    sku: 'KNOP-MELAT-01',
    nombre_comercial: 'Melatonina 3mg Knop',
    descripcion: 'Suplemento de melatonina para regulación del sueño.',
    principios_activos: ['Melatonina'],
    categoria_principal: 'fitoterapia',
    tags_ia: ['melatonina', 'sueño', 'jet-lag'],
    indicaciones: ['Insomnio', 'Jet lag', 'Regulación del ciclo circadiano'],
    advertencias: 'No conducir dentro de las 4 horas posteriores a la toma.',
    last_updated: Date.now(),
  },
];

async function seedSampleProducts() {
  const existingCount = await productsCollection.query().fetchCount();
  if (existingCount > 0) {
    logger.info(`Ya hay ${existingCount} productos en la BD. Omitiendo seed.`, 'AppBootstrapper');
    return;
  }

  logger.info('🌱 Insertando productos de ejemplo...', 'AppBootstrapper');
  await dataService.saveProductsToLocalDB(SAMPLE_PRODUCTS);
  logger.success(`✅ ${SAMPLE_PRODUCTS.length} productos de ejemplo insertados`, 'AppBootstrapper');
}

interface AppBootstrapperProps {
  children: React.ReactNode;
}

export const AppBootstrapper: React.FC<AppBootstrapperProps> = ({ children }) => {
  const { hardware, isDetecting: isDetectingHardware } = useHardwareDetection();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      taskProcessorService.start();
      automationTriggerService.start();

      // Seed drug families if empty
      const families = await drugFamiliesCollection.query().fetch();
      if (families.length === 0) {
        await seedDrugData();
      }

      // Seed sample products if empty
      await seedSampleProducts();

      // Load products into Zustand store
      const products = await dataService.getAllProducts();
      useStore.getState().setProducts(products);
      logger.debug('Productos cargados en store: ' + products.length, 'AppBootstrapper');

      setIsReady(true);
    };
    initialize();
  }, []);

  if (isDetectingHardware || !isReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <h2 className="text-lg font-medium">Iniciando Vademécum...</h2>
        <p className="text-sm text-muted-foreground mt-2">
          {"Preparando sistema clínico..."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};
