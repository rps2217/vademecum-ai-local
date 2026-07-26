/**
 * Tests para AppStore
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../appStore';

describe('AppStore', () => {
  beforeEach(() => {
    // Reset store before each test (sin persistencia)
    useAppStore.setState({
      view: 'buscar',
      searchQuery: '',
      selectedCategory: 'todas',
      selectedProduct: null,
      isLoading: false,
      loadingMessage: '',
      products: [],
      categories: [],
      syncStatus: { status: 'idle', pendingChanges: 0 },
      kbStats: { total: 0, families: 0, types: 0 },
      supabaseConnected: false,
      scrapeStates: {},
      kb: {},
      ingredientCount: 0,
    });
  });

  describe('UI State', () => {
    it('should set view correctly', () => {
      const { setView } = useAppStore.getState();
      setView('catalogo');
      expect(useAppStore.getState().view).toBe('catalogo');
    });

    it('should set search query correctly', () => {
      const { setSearchQuery } = useAppStore.getState();
      setSearchQuery('paracetamol');
      expect(useAppStore.getState().searchQuery).toBe('paracetamol');
    });

    it('should set selected category correctly', () => {
      const { setSelectedCategory } = useAppStore.getState();
      setSelectedCategory('analgesicos');
      expect(useAppStore.getState().selectedCategory).toBe('analgesicos');
    });

    it('should set loading state correctly', () => {
      const { setLoading } = useAppStore.getState();
      setLoading(true, 'Cargando productos...');
      
      const state = useAppStore.getState();
      expect(state.isLoading).toBe(true);
      expect(state.loadingMessage).toBe('Cargando productos...');
    });
  });

  describe('Products State', () => {
    it('should add product correctly', () => {
      const { addProduct } = useAppStore.getState();
      
      const mockProduct = {
        sku: 'TEST-001',
        principios_activos: ['paracetamol'],
        cobertura_kb: 100,
        sinergias_detectadas: [],
        antagonismos_detectados: [],
      };
      
      addProduct(mockProduct as any);
      
      const state = useAppStore.getState();
      expect(state.products).toHaveLength(1);
      expect(state.products[0].sku).toBe('TEST-001');
    });

    it('should update product correctly', () => {
      const { addProduct, updateProduct } = useAppStore.getState();
      
      const mockProduct = {
        sku: 'TEST-002',
        nombre_comercial: 'Test Original',
        principios_activos: [],
        cobertura_kb: 0,
        sinergias_detectadas: [],
        antagonismos_detectados: [],
      };
      
      addProduct(mockProduct as any);
      updateProduct('TEST-002', { nombre_comercial: 'Test Updated' });
      
      const state = useAppStore.getState();
      expect(state.products[0].nombre_comercial).toBe('Test Updated');
    });

    it('should remove product correctly', () => {
      const { addProduct, removeProduct } = useAppStore.getState();
      
      const mockProduct = {
        sku: 'TEST-003',
        principios_activos: [],
        cobertura_kb: 0,
        sinergias_detectadas: [],
        antagonismos_detectados: [],
      };
      
      addProduct(mockProduct as any);
      expect(useAppStore.getState().products).toHaveLength(1);
      
      removeProduct('TEST-003');
      expect(useAppStore.getState().products).toHaveLength(0);
    });

    it('should set products array correctly', () => {
      const { setProducts } = useAppStore.getState();
      
      const mockProducts = [
        { sku: 'P1', principios_activos: [], cobertura_kb: 0, sinergias_detectadas: [], antagonismos_detectados: [] },
        { sku: 'P2', principios_activos: [], cobertura_kb: 0, sinergias_detectadas: [], antagonismos_detectados: [] },
      ];
      
      setProducts(mockProducts as any);
      expect(useAppStore.getState().products).toHaveLength(2);
    });
  });

  describe('Sync State', () => {
    it('should set sync status correctly', () => {
      const { setSyncStatus } = useAppStore.getState();
      
      setSyncStatus({ 
        status: 'syncing', 
        progress: 50,
        pendingChanges: 5 
      });
      
      const state = useAppStore.getState();
      expect(state.syncStatus.status).toBe('syncing');
      expect(state.syncStatus.progress).toBe(50);
      expect(state.syncStatus.pendingChanges).toBe(5);
    });

    it('should set KB stats correctly', () => {
      const { setKbStats } = useAppStore.getState();
      
      setKbStats({ total: 100, families: 10, types: 5 });
      
      const state = useAppStore.getState();
      expect(state.kbStats.total).toBe(100);
      expect(state.kbStats.families).toBe(10);
      expect(state.kbStats.types).toBe(5);
    });

    it('should set Supabase connection status', () => {
      const { setSupabaseConnected } = useAppStore.getState();
      
      setSupabaseConnected(true);
      expect(useAppStore.getState().supabaseConnected).toBe(true);
      
      setSupabaseConnected(false);
      expect(useAppStore.getState().supabaseConnected).toBe(false);
    });
  });

  describe('Scraping State', () => {
    it('should set scrape state for a product', () => {
      const { setScrapeState } = useAppStore.getState();
      
      setScrapeState('SKU-001', 'scraping');
      expect(useAppStore.getState().scrapeStates['SKU-001']).toBe('scraping');
      
      setScrapeState('SKU-001', 'success');
      expect(useAppStore.getState().scrapeStates['SKU-001']).toBe('success');
    });

    it('should reset all scrape states', () => {
      const { setScrapeState, resetScrapeStates } = useAppStore.getState();
      
      setScrapeState('SKU-001', 'scraping');
      setScrapeState('SKU-002', 'success');
      setScrapeState('SKU-003', 'error');
      
      resetScrapeStates();
      
      const state = useAppStore.getState();
      expect(Object.keys(state.scrapeStates)).toHaveLength(0);
    });
  });

  describe('Computed Getters', () => {
    it('should calculate stats correctly', () => {
      const { setProducts } = useAppStore.getState();
      
      const mockProducts = [
        { sku: 'P1', principios_activos: ['A'], cobertura_kb: 100, sinergias_detectadas: ['S1'], antagonismos_detectados: [] },
        { sku: 'P2', principios_activos: ['B'], cobertura_kb: 50, sinergias_detectadas: [], antagonismos_detectados: [] },
        { sku: 'P3', principios_activos: ['C'], cobertura_kb: 0, sinergias_detectadas: [], antagonismos_detectados: [] },
      ];
      
      setProducts(mockProducts as any);
      
      const stats = useAppStore.getState().getStats();
      expect(stats.total).toBe(3);
      expect(stats.kbMatch).toBe(2);
      expect(stats.sinergias).toBe(1);
    });

    it('should return empty stats for empty products', () => {
      const stats = useAppStore.getState().getStats();
      expect(stats.total).toBe(0);
      expect(stats.kbMatch).toBe(0);
      expect(stats.sinergias).toBe(0);
    });
  });

  describe('KB State', () => {
    it('should set KB and count', () => {
      const { setKb } = useAppStore.getState();
      
      const mockKb = {
        paracetamol: { nombre: 'Paracetamol', type: 'analgesico' },
        ibuprofeno: { nombre: 'Ibuprofeno', type: 'antiinflamatorio' },
      };
      
      setKb(mockKb, 2);
      
      const state = useAppStore.getState();
      expect(state.ingredientCount).toBe(2);
      expect(state.kb).toEqual(mockKb);
    });
  });
});
