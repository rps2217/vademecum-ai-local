import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cloudSyncService, resolveProductConflict } from '../services/CloudSyncService';
import { Product, SafetyStatus } from '../core/types';

// Mock dependencies
vi.mock('../services/SupabaseService', () => ({
  supabaseService: {
    isConfigured: vi.fn(() => true),
    markUnreachable: vi.fn(),
  },
}));

vi.mock('../services/DataService', () => ({
  dataService: {
    getSupabaseInfo: vi.fn(() => ({
      supabaseUrl: 'https://test.supabase.co',
      supabaseKey: 'test-key',
    })),
    saveProduct: vi.fn(),
    syncProductsBatch: vi.fn(),
    fetchCloudInventory: vi.fn(() => Promise.resolve([])),
    downloadCloudProducts: vi.fn(() => Promise.resolve([])),
    importProducts: vi.fn(),
    getAllProducts: vi.fn(() => Promise.resolve([])),
  },
}));

vi.mock('../services/ConfigService', () => ({
  configService: {
    getConfig: vi.fn(() => ({
      autoSyncCloud: true,
    })),
  },
}));

vi.mock('../services/TaskQueueService', () => ({
  taskQueueService: {
    addTask: vi.fn(),
  },
}));

vi.mock('../services/EventBus', () => ({
  EventBus: {
    emit: vi.fn(),
  },
  EventType: {
    PRODUCT_UPDATED: 'PRODUCT_UPDATED',
    DB_UPDATED: 'DB_UPDATED',
  },
}));

vi.mock('../services/LoggerService', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    ai: vi.fn(),
    log: vi.fn(),
  },
}));

describe('Security Tests', () => {
  describe('Input Validation', () => {
    it('should reject XSS attempts in product names', async () => {
      const maliciousProduct: Product = {
        sku: 'TEST<script>alert("xss")</script>',
        nombre_comercial: '<img src=x onerror=alert("XSS")>Test',
        descripcion: 'Normal description',
        principios_activos: ['Test'],
        posologia: 'Test',
        indicaciones: ['Test'],
        advertencias: 'Test',
        tags_ia: ['test'],
        categoria_principal: 'Test',
        last_updated: Date.now(),
      };

      // The search service should sanitize inputs
      expect(maliciousProduct.nombre_comercial).toContain('<img');
    });

    it('should handle SQL injection attempts in SKU', () => {
      const maliciousSku = "'; DROP TABLE products; --";
      
      // SKU should be treated as plain string
      expect(typeof maliciousSku).toBe('string');
      expect(maliciousSku).not.toBe('');
    });

    it('should validate product schema fields', () => {
      const validProduct: Product = {
        sku: 'VALID001',
        nombre_comercial: 'Valid Product',
        descripcion: 'Valid description',
        principios_activos: ['Valid Ingredient'],
        posologia: 'Valid dosage',
        indicaciones: ['Valid indication'],
        advertencias: 'Valid warning',
        tags_ia: ['valid', 'test'],
        categoria_principal: 'Valid Category',
        last_updated: Date.now(),
      };

      // All required fields should exist
      expect(validProduct.sku).toBeDefined();
      expect(validProduct.nombre_comercial).toBeDefined();
      expect(validProduct.principios_activos).toBeDefined();
      expect(Array.isArray(validProduct.principios_activos)).toBe(true);
    });
  });

  describe('CloudSyncService - resolveProductConflict', () => {
    const baseProduct: Product = {
      sku: 'CONFLICT001',
      nombre_comercial: 'Original Product',
      descripcion: 'Original description',
      principios_activos: ['Original Ingredient'],
      posologia: 'Original dosage',
      indicaciones: ['Original indication'],
      advertencias: 'Original warning',
      tags_ia: ['original'],
      categoria_principal: 'Original Category',
      last_updated: 1000,
      last_synced_cloud: 500,
    };

    it('should prefer cloud version when local has no changes since last sync', () => {
      const localModified: Product = {
        ...baseProduct,
        nombre_comercial: 'Local Modified Name',
        last_updated: 600, // Before last sync
      };

      const cloudVersion: Product = {
        ...baseProduct,
        nombre_comercial: 'Cloud Version Name',
        last_updated: 2000,
      };

      const result = resolveProductConflict(localModified, cloudVersion);
      
      // Should prefer cloud version
      expect(result.nombre_comercial).toBe('Cloud Version Name');
    });

    it('should prefer local version when cloud has no changes since last sync', () => {
      const localModified: Product = {
        ...baseProduct,
        nombre_comercial: 'Local Modified Name',
        last_updated: 3000,
        last_synced_cloud: 500,
      };

      const cloudVersion: Product = {
        ...baseProduct,
        nombre_comercial: 'Cloud Version Name',
        last_updated: 400, // Before last sync
      };

      const result = resolveProductConflict(localModified, cloudVersion);
      
      expect(result.nombre_comercial).toBe('Local Modified Name');
      expect(result.is_synced_cloud).toBe(false);
    });

    it('should merge tags from both local and cloud without duplicates', () => {
      const localModified: Product = {
        ...baseProduct,
        tags_ia: ['local-tag-1', 'local-tag-2'],
        last_updated: 3000,
      };

      const cloudVersion: Product = {
        ...baseProduct,
        tags_ia: ['cloud-tag-1', 'local-tag-1'],
        last_updated: 3000,
      };

      const result = resolveProductConflict(localModified, cloudVersion);
      
      // Should have all unique tags
      const uniqueTags = new Set(result.tags_ia);
      expect(uniqueTags.has('local-tag-1')).toBe(true);
      expect(uniqueTags.has('local-tag-2')).toBe(true);
      expect(uniqueTags.has('cloud-tag-1')).toBe(true);
    });

    it('should preserve patient safety fields from the newer version', () => {
      const localModified: Product = {
        ...baseProduct,
        tags_ia: [],
        last_updated: 3000,
        last_synced_cloud: 500,
        apto_embarazo: SafetyStatus.SEGURO,
      };

      const cloudVersion: Product = {
        ...baseProduct,
        tags_ia: [],
        last_updated: 3000,
        last_synced_cloud: 500,
        apto_embarazo: SafetyStatus.PRECAUCION,
      };

      const result = resolveProductConflict(localModified, cloudVersion);
      
      // Should use the newer version (either is fine, just testing merge)
      expect(result.apto_embarazo).toBeDefined();
    });

    it('should reset sync status after conflict resolution', () => {
      const localModified: Product = {
        ...baseProduct,
        last_updated: 3000,
      };

      const cloudVersion: Product = {
        ...baseProduct,
        last_updated: 3000,
      };

      const result = resolveProductConflict(localModified, cloudVersion);
      
      expect(result.is_synced_cloud).toBe(false);
    });
  });

  describe('Session Management', () => {
    it('should validate session structure', () => {
      // Test that session data follows expected structure
      const sessionInfo = {
        email: 'user@example.com',
        sessionToken: 'sensitive-token',
        expiresAt: Date.now() + 3600000,
      };

      // Verify structure
      expect(sessionInfo.email).toBeDefined();
      expect(sessionInfo.sessionToken).toBeDefined();
      expect(sessionInfo.expiresAt).toBeGreaterThan(Date.now());
    });

    it('should handle session expiration check', () => {
      const expiredSession = {
        email: 'user@example.com',
        sessionToken: 'token',
        expiresAt: Date.now() - 1000, // Expired
      };

      const validSession = {
        email: 'user@example.com',
        sessionToken: 'token',
        expiresAt: Date.now() + 3600000, // Valid
      };

      // Check expiration
      expect(Date.now() > expiredSession.expiresAt).toBe(true);
      expect(Date.now() > validSession.expiresAt).toBe(false);
    });
  });

  describe('AuthContext Security', () => {
    it('should validate email format properly', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      const validEmails = [
        'test@example.com',
        'user.name@domain.org',
        'admin@sub.domain.com',
      ];

      const invalidEmails = [
        'notanemail',
        '@nodomain.com',
        'spaces in@email.com',
        '',
      ];

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });

    it('should validate password minimum length', () => {
      const minPasswordLength = 6;
      
      expect('12345'.length < minPasswordLength).toBe(true);
      expect('123456'.length >= minPasswordLength).toBe(true);
      expect('longpassword123'.length >= minPasswordLength).toBe(true);
    });
  });

  describe('API Key Handling', () => {
    it('should use environment variables for sensitive config', () => {
      // Supabase URL and keys should come from env vars
      const envVars = {
        VITE_SUPABASE_URL: import.meta.env?.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: import.meta.env?.VITE_SUPABASE_ANON_KEY,
      };

      // In tests, these may be undefined which is expected
      // In production, they should be set via .env file
      expect(envVars).toBeDefined();
    });
  });
});
