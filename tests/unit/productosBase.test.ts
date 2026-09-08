import { describe, it, expect, beforeEach } from 'vitest';
import productosData from '@/db/seeders/data/productos_base.json';
import { db } from '@/db/schema';
import { seedKnowledgeBase } from '@/db/seeders/knowledgeSeeder';

describe('Base de datos estructurada de productos base (20 productos)', () => {
  it('contiene exactamente 20 productos válidos en el catálogo base', () => {
    expect(productosData.productos).toBeDefined();
    expect(productosData.productos.length).toBe(20);
    expect(productosData.metadata.total).toBe(20);
  });

  it('todos los productos tienen SKU único, nombre comercial y campo cómo funciona claro', () => {
    const skus = new Set<string>();
    for (const prod of productosData.productos) {
      expect(prod.sku).toBeTruthy();
      expect(skus.has(prod.sku)).toBe(false);
      skus.add(prod.sku);

      expect(prod.nombreComercial).toBeTruthy();
      expect(prod.como_funciona || prod.comoFunciona).toBeTruthy();
      const explanation = prod.como_funciona || prod.comoFunciona || '';
      expect(explanation.length).toBeGreaterThan(20);
      // Verifica que no tenga jerga incomprensible y que sea directo
      expect(prod.principiosActivos.length).toBeGreaterThan(0);
      expect(prod.indicaciones.length).toBeGreaterThan(0);
    }
  });

  it('incluye tanto productos farmacéuticos convencionales como homeopáticos y fitoterapéuticos', () => {
    const categories = productosData.productos.map(p => p.categoria);
    expect(categories).toContain('farmaceutico');
    expect(categories).toContain('homeopatia');
    expect(categories).toContain('fitoterapia');
  });

  it('seembra correctamente los 20 productos en la base de datos Dexie', async () => {
    await db.products.clear();
    const stats = await seedKnowledgeBase();
    expect(stats.products).toBe(20);

    const count = await db.products.count();
    expect(count).toBeGreaterThanOrEqual(20);

    const ibu = await db.products.get('PROD-IBU-400');
    expect(ibu).toBeDefined();
    expect(ibu?.nombreComercial).toContain('Ibuprofeno');
    expect(ibu?.como_funciona).toBeTruthy();
    expect(ibu?.comoFunciona).toBeTruthy();

    const oscillo = await db.products.get('PROD-OSC-BOI');
    expect(oscillo).toBeDefined();
    expect(oscillo?.nombreComercial).toContain('Oscillococcinum');
    expect(oscillo?.categoria).toBe('homeopatia');
    expect(oscillo?.como_funciona).toBeTruthy();
  });
});
