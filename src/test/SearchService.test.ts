import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchService, SearchIndexItem } from '../services/SearchService';
import { Product, SafetyStatus } from '../core/types';

// Mock dataService
const mockProducts: Product[] = [
  {
    sku: 'MED001',
    nombre_comercial: 'Aspirina 500mg',
    descripcion: 'Analgésico y antipirético',
    principios_activos: ['Ácido Acetilsalicílico'],
    posologia: '1-2 comprimidos cada 4-6 horas',
    indicaciones: ['Dolor', 'Fiebre', 'Inflamación'],
    advertencias: 'No usar en menores de 12 años',
    tags_ia: ['analgesico', 'antipiretico'],
    categoria_principal: 'Analgésicos',
    vectores: [0.1, 0.2, 0.3],
    analisis_componentes: null,
    apto_embarazo: SafetyStatus.PRECAUCION,
    apto_lactancia: SafetyStatus.NO_APTO,
    apto_pediatria: SafetyStatus.NO_APTO,
    apto_diabeticos: SafetyStatus.SEGURO,
    apto_hipertensos: SafetyStatus.PRECAUCION,
    apto_celiacos: SafetyStatus.SEGURO,
    last_updated: Date.now(),
  },
  {
    sku: 'MED002',
    nombre_comercial: 'Ibuprofeno 400mg',
    descripcion: 'Antiinflamatorio no esteroideo',
    principios_activos: ['Ibuprofeno'],
    posologia: '1 comprimido cada 6-8 horas',
    indicaciones: ['Dolor', 'Inflamación', 'Fiebre'],
    advertencias: 'Tomar con comida',
    tags_ia: ['aine', 'antiinflamatorio'],
    categoria_principal: 'Antiinflamatorios',
    vectores: [0.4, 0.5, 0.6],
    analisis_componentes: null,
    apto_embarazo: SafetyStatus.NO_APTO,
    apto_lactancia: SafetyStatus.PRECAUCION,
    apto_pediatria: SafetyStatus.PRECAUCION,
    apto_diabeticos: SafetyStatus.SEGURO,
    apto_hipertensos: SafetyStatus.SEGURO,
    apto_celiacos: SafetyStatus.SEGURO,
    last_updated: Date.now(),
  },
  {
    sku: 'MED003',
    nombre_comercial: 'Paracetamol 500mg',
    descripcion: 'Analgésico y antipirético',
    principios_activos: ['Paracetamol'],
    posologia: '1-2 comprimidos cada 4-6 horas',
    indicaciones: ['Dolor', 'Fiebre'],
    advertencias: 'No exceder 4g diarios',
    tags_ia: ['analgesico', 'antipiretico'],
    categoria_principal: 'Analgésicos',
    vectores: [0.7, 0.8, 0.9],
    analisis_componentes: null,
    apto_embarazo: SafetyStatus.SEGURO,
    apto_lactancia: SafetyStatus.SEGURO,
    apto_pediatria: SafetyStatus.SEGURO,
    apto_diabeticos: SafetyStatus.SEGURO,
    apto_hipertensos: SafetyStatus.SEGURO,
    apto_celiacos: SafetyStatus.SEGURO,
    last_updated: Date.now(),
  },
];

// Mock database
vi.mock('../database', () => ({
  productsCollection: {
    query: vi.fn(() => ({
      fetch: vi.fn().mockResolvedValue([]),
    })),
    changes: {
      subscribe: vi.fn(),
    },
  },
  database: {
    write: vi.fn(async (fn) => fn()),
  },
}));

// Mock dataService
vi.mock('../services/DataService', () => ({
  dataService: {
    getAllProducts: vi.fn(() => Promise.resolve(mockProducts)),
    getProductBySku: vi.fn((sku: string) => 
      Promise.resolve(mockProducts.find(p => p.sku === sku) || null)
    ),
  },
}));

describe('SearchService', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset search service state by re-initializing
    await searchService.initializeIndex();
  });

  describe('normalizeText', () => {
    it('should normalize text to lowercase', () => {
      const result = searchService.normalizeText('HOLA MUNDO');
      expect(result).toBe('hola mundo');
    });

    it('should remove accents', () => {
      const result = searchService.normalizeText('café naïve');
      expect(result).toBe('cafe naive');
    });

    it('should handle empty strings', () => {
      const result = searchService.normalizeText('');
      expect(result).toBe('');
    });

    it('should handle null/undefined', () => {
      const result = searchService.normalizeText(null as any);
      expect(result).toBe('');
    });
  });

  describe('initializeIndex', () => {
    it('should create search index from products', async () => {
      await searchService.initializeIndex();
      const products = searchService.getAllIndexedProducts();
      expect(products).toHaveLength(3);
    });

    it('should index product names, principles, and categories', async () => {
      await searchService.initializeIndex();
      const facets = searchService.getFacets();
      
      expect(facets.categories).toContain('Analgésicos');
      expect(facets.categories).toContain('Antiinflamatorios');
      expect(facets.activePrinciples).toContain('Ácido Acetilsalicílico');
      expect(facets.activePrinciples).toContain('Ibuprofeno');
      expect(facets.activePrinciples).toContain('Paracetamol');
    });

    it('should count principles correctly', async () => {
      await searchService.initializeIndex();
      const facets = searchService.getFacets();
      
      // Verify principlesWithCounts exists and has entries
      expect(facets.principlesWithCounts).toBeDefined();
      expect(Array.isArray(facets.principlesWithCounts)).toBe(true);
      
      // Should have entries for the mock products
      expect(facets.principlesWithCounts!.length).toBeGreaterThan(0);
    });
  });

  describe('search', () => {
    it('should find products by name', async () => {
      const result = await searchService.search('Aspirina');
      expect(result.products.some(p => p.sku === 'MED001')).toBe(true);
      expect(result.total).toBeGreaterThan(0);
    });

    it('should find products by active principle', async () => {
      const result = await searchService.search('Ibuprofeno');
      expect(result.products.some(p => p.sku === 'MED002')).toBe(true);
    });

    it('should be case insensitive', async () => {
      const resultLower = await searchService.search('aspirina');
      const resultUpper = await searchService.search('ASPIRINA');
      const resultMixed = await searchService.search('AsPiRiNa');
      
      expect(resultLower.products.length).toBe(resultUpper.products.length);
      expect(resultLower.products.length).toBe(resultMixed.products.length);
    });

    it('should find products with typo tolerance', async () => {
      // "Aspirna" is a typo of "Aspirina"
      const result = await searchService.search('Aspirna');
      expect(result.products.length).toBeGreaterThan(0);
    });

    it('should filter by category', async () => {
      const result = await searchService.search('', { category: 'Analgésicos' });
      expect(result.products.every(p => p.categoria_principal === 'Analgésicos')).toBe(true);
    });

    it('should filter by active principle', async () => {
      const result = await searchService.search('', { principle: 'Paracetamol' });
      expect(result.products.every(p => p.principios_activos?.includes('Paracetamol'))).toBe(true);
    });

    it('should return empty array for non-existent products', async () => {
      const result = await searchService.search('MedicamentoInexistenteXYZ');
      expect(result.products).toHaveLength(0);
    });

    it('should limit results to 50', async () => {
      const result = await searchService.search('');
      expect(result.products.length).toBeLessThanOrEqual(50);
      expect(result.pageSize).toBe(50);
    });

    it('should handle accented searches', async () => {
      const result = await searchService.search('ácido acetilsalicílico');
      expect(result.products.some(p => p.sku === 'MED001')).toBe(true);
    });

    it('should return pagination info', async () => {
      const result = await searchService.search('');
      expect(result.page).toBe(1);
      expect(result.hasMore !== undefined).toBe(true);
    });
  });

  describe('getLatestResults', () => {
    it('should return the most recent search results', async () => {
      await searchService.search('Aspirina');
      const latest = searchService.getLatestResults();
      expect(latest).toBeDefined();
      expect(Array.isArray(latest)).toBe(true);
    });
  });

  describe('getFacets', () => {
    it('should return sorted categories', async () => {
      await searchService.initializeIndex();
      const facets = searchService.getFacets();
      const sortedCategories = [...facets.categories].sort();
      expect(facets.categories).toEqual(sortedCategories);
    });

    it('should limit active principles to top 50', async () => {
      await searchService.initializeIndex();
      const facets = searchService.getFacets();
      expect(facets.activePrinciples.length).toBeLessThanOrEqual(50);
    });
  });
});
