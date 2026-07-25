/**
 * Tests para ProductCategorizationService
 */

import { describe, it, expect } from 'vitest';
import { productCategorizationService } from '../services/ProductCategorizationService';

describe('ProductCategorizationService', () => {
  // El servicio es un singleton que usa la KB real

  describe('findMatchingIngredients', () => {
    it('debe encontrar ingrediente por nombre exacto', () => {
      const matches = productCategorizationService.findMatchingIngredients('Vitamina C');
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].id).toBe('vitamina-c');
    });

    it('debe encontrar ingrediente por sinonimo', () => {
      const matches = productCategorizationService.findMatchingIngredients('Ascorbic acid');
      expect(matches.length).toBeGreaterThan(0);
    });

    it('debe ser case insensitive', () => {
      const matches1 = productCategorizationService.findMatchingIngredients('VITAMINA C');
      const matches2 = productCategorizationService.findMatchingIngredients('vitamina c');
      expect(matches1.length).toBe(matches2.length);
    });

    it('debe encontrar por coincidencia parcial', () => {
      const matches = productCategorizationService.findMatchingIngredients('vitamina');
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  describe('categorizeProduct', () => {
    it('debe devolver categorias para producto con principios activos', () => {
      const product = {
        sku: 'TEST001',
        nombre_comercial: 'Suplemento Vit C',
        principios_activos: ['Vitamina C']
      };
      
      const categories = productCategorizationService.categorizeProduct(product);
      expect(categories.length).toBeGreaterThan(0);
      expect(categories).toContain('vitaminico');
    });

    it('debe categorizar producto con zinc', () => {
      const product = {
        sku: 'TEST002',
        nombre_comercial: 'Zinc Supplement',
        principios_activos: ['Zinc']
      };
      
      const categories = productCategorizationService.categorizeProduct(product);
      expect(categories).toContain('mineral');
    });

    it('debe categorizar producto con ashwagandha', () => {
      const product = {
        sku: 'TEST003',
        nombre_comercial: 'Ashwagandha Plus',
        principios_activos: ['Ashwagandha']
      };
      
      const categories = productCategorizationService.categorizeProduct(product);
      expect(categories.length).toBeGreaterThan(0);
    });

    it('debe categorizar producto multivitaminico', () => {
      const product = {
        sku: 'TEST004',
        nombre_comercial: 'Multivitaminico',
        principios_activos: ['Vitamina C', 'Zinc', 'Magnesio']
      };
      
      const categories = productCategorizationService.categorizeProduct(product);
      expect(categories.length).toBeGreaterThan(2);
    });
  });

  describe('getCategorizationDetails', () => {
    it('debe devolver detalles de categorizacion', () => {
      const product = {
        sku: 'TEST005',
        nombre_comercial: 'Inmunity Boost',
        principios_activos: ['Vitamina C', 'Zinc']
      };
      
      const details = productCategorizationService.getCategorizationDetails(product);
      
      expect(details.categories).toBeDefined();
      expect(details.categoryLabels).toBeDefined();
      expect(details.matchedIngredients).toBeDefined();
    });
  });
});
