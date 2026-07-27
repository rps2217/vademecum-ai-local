/**
 * Tests para KnowledgeService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KnowledgeService } from '../services/KnowledgeService';
import type { KbIngredient } from '../types';

describe('KnowledgeService', () => {
  let service: KnowledgeService;
  
  // Datos de prueba
  const mockIngredients: KbIngredient[] = [
    {
      id: 'vitamina-c',
      nombre: 'Vitamina C',
      sinonimos: ['Ascorbic acid'],
      familia: 'Vitamina',
      tipo: 'vitaminico',
      propiedades: ['Antioxidante', 'Inmunidad'],
      sinergias: ['vitamina-e'],
      antagonismos: [],
      contraindicaciones: [],
      notas: 'Vitamina esencial'
    },
    {
      id: 'vitamina-e',
      nombre: 'Vitamina E',
      sinonimos: ['Tocopherol'],
      familia: 'Vitamina',
      tipo: 'vitaminico',
      propiedades: ['Antioxidante'],
      sinergias: ['vitamina-c'],
      antagonismos: [],
      contraindicaciones: [],
      notas: 'Vitamina liposoluble'
    },
    {
      id: 'zinc',
      nombre: 'Zinc',
      sinonimos: ['Zinc gluconate'],
      familia: 'Mineral',
      tipo: 'mineral',
      propiedades: ['Inmunidad'],
      sinergias: ['vitamina-c'],
      antagonismos: ['hierro'],
      contraindicaciones: [],
      notas: 'Mineral esencial'
    }
  ];

  beforeEach(() => {
    service = new KnowledgeService();
  });

  describe('getAllIngredients', () => {
    it('debe devolver todos los ingredientes', () => {
      const ingredients = service.getAllIngredients();
      expect(Array.isArray(ingredients)).toBe(true);
    });
  });

  describe('searchIngredients', () => {
    it('debe buscar por nombre', () => {
      const results = service.searchIngredients('vitamina');
      expect(results.length).toBeGreaterThan(0);
    });

    it('debe ser case insensitive', () => {
      const results1 = service.searchIngredients('VITAMINA');
      const results2 = service.searchIngredients('vitamina');
      expect(results1.length).toBe(results2.length);
    });

    it('debe devolver array vacío para búsqueda sin resultados', () => {
      const results = service.searchIngredients('xyz123inexistente');
      expect(results.length).toBe(0);
    });
  });

  describe('getIngredientById', () => {
    it('debe encontrar ingrediente por ID', () => {
      const ingredient = service.getIngredientById('vitamina-c');
      expect(ingredient).toBeDefined();
      expect(ingredient?.nombre).toBe('Vitamina C');
    });

    it('debe devolver undefined para ID inexistente', () => {
      const ingredient = service.getIngredientById('inexistente');
      expect(ingredient).toBeUndefined();
    });
  });

  describe('findIngredient', () => {
    it('debe encontrar ingrediente por nombre', () => {
      const ingredient = service.findIngredient('Vitamina C');
      expect(ingredient).toBeDefined();
      expect(ingredient?.id).toBe('vitamina-c');
    });

    it('debe encontrar por sinónimo', () => {
      const ingredient = service.findIngredient('Ascorbic acid');
      expect(ingredient).toBeDefined();
    });
  });

  describe('getSynergies', () => {
    it('debe obtener sinergias de un ingrediente', () => {
      const sinergias = service.getSynergies('vitamina-c');
      expect(sinergias.length).toBeGreaterThan(0);
      expect(sinergias[0]).toHaveProperty('from');
      expect(sinergias[0]).toHaveProperty('to');
    });

    it('debe devolver array vacío para ingrediente sin sinergias', () => {
      const sinergias = service.getSynergies('ninguno');
      expect(sinergias.length).toBe(0);
    });
  });

  describe('getAntagonisms', () => {
    it('debe obtener antagonismos de un ingrediente', () => {
      const antagonismos = service.getAntagonisms('zinc');
      expect(antagonismos.length).toBeGreaterThan(0);
    });

    it('debe devolver array vacío para ingrediente sin antagonismos', () => {
      const antagonismos = service.getAntagonisms('vitamina-c');
      expect(Array.isArray(antagonismos)).toBe(true);
    });
  });

  describe('getByType', () => {
    it('debe filtrar por tipo', () => {
      const vitamins = service.getByType('vitaminico');
      expect(vitamins.length).toBeGreaterThan(0);
      vitamins.forEach(ing => {
        expect(ing.tipo).toBe('vitaminico');
      });
    });

    it('debe devolver array vacío para tipo sin ingredientes', () => {
      const ingredients = service.getByType('tipoinexistente');
      expect(ingredients.length).toBe(0);
    });
  });

  describe('getByFamily', () => {
    it('debe filtrar por familia', () => {
      const ingredients = service.getByFamily('Vitamina');
      expect(ingredients.length).toBeGreaterThan(0);
    });
  });

  describe('analyzeProduct', () => {
    it('debe analizar principios activos de un producto', () => {
      const result = service.analyzeProduct({
        sku: 'test-1',
        principios_activos: ['Vitamina C', 'Zinc']
      });
      
      expect(result.ingredientes_kb).toBeDefined();
      expect(result.sinergias).toBeDefined();
      expect(result.antagonismos).toBeDefined();
      expect(result.cobertura_kb).toBeDefined();
    });

    it('debe manejar producto sin principios activos', () => {
      const result = service.analyzeProduct({ sku: 'test-2' });
      expect(result.ingredientes_kb.length).toBe(0);
      expect(result.cobertura_kb).toBe(0);
    });
  });

  describe('getStats', () => {
    it('debe devolver estadísticas', () => {
      const stats = service.getStats();
      
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('types');
      expect(stats).toHaveProperty('families');
      expect(stats.total).toBeGreaterThan(0);
    });
  });

  describe('getVersion', () => {
    it('debe devolver versión de la KB', () => {
      const version = service.getVersion();
      expect(version).toBeDefined();
      expect(typeof version).toBe('string');
    });
  });
});
